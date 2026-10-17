#!/usr/bin/env python3
"""Provider-neutral local task coordination; Python 3.9+ and Git only."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path, PurePosixPath
import re
import socket
import subprocess
import sys
import time
import uuid


class WorkflowError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise WorkflowError(message)


def execute(argv, cwd, timeout=120):
    return subprocess.run(argv, cwd=cwd, text=True, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, timeout=timeout, check=False)


def git(repo, *args):
    result = execute(["git", *args], repo)
    require(result.returncode == 0, result.stdout.strip() or "Git command failed")
    return result.stdout.strip()


def clean(repo):
    return not git(repo, "status", "--porcelain", "--untracked-files=all")


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + "." + uuid.uuid4().hex + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


@contextmanager
def locked(batch):
    lock = batch / ".lock"
    deadline = time.monotonic() + 5
    while True:
        try:
            lock.mkdir()
            break
        except FileExistsError:
            require(time.monotonic() < deadline, f"Batch locked: {lock}; inspect owner.json before removing a stale lock")
            time.sleep(0.05)
    try:
        write_json(lock / "owner.json", {"pid": os.getpid(), "host": socket.gethostname()})
        yield
    finally:
        (lock / "owner.json").unlink(missing_ok=True)
        lock.rmdir()


def validate_gates(gates):
    require(isinstance(gates, list) and gates, "At least one explicit gate is required")
    for gate in gates:
        require(isinstance(gate, dict) and isinstance(gate.get("name"), str)
                and isinstance(gate.get("argv"), list) and gate["argv"]
                and all(isinstance(a, str) and "\0" not in a for a in gate["argv"]),
                "Gates need a name and a nonempty argv string array")
        require(isinstance(gate.get("timeout", 120), int) and 1 <= gate.get("timeout", 120) <= 3600,
                "Gate timeout must be 1..3600 seconds")


def validate_plan(plan):
    require(isinstance(plan, dict) and plan.get("version") == 1, "Expected plan version 1")
    require(re.fullmatch(r"[a-z0-9][a-z0-9-]{0,47}", plan.get("id", "")), "Invalid batch id")
    require(isinstance(plan.get("max_workers"), int) and 1 <= plan["max_workers"] <= 16,
            "max_workers must be between 1 and 16")
    require(isinstance(plan.get("goal"), str) and plan["goal"].strip(), "Missing batch goal")
    tasks = plan.get("tasks")
    require(isinstance(tasks, list) and tasks and all(isinstance(t, dict) for t in tasks), "Plan needs task objects")
    ids = [t.get("id") for t in tasks]
    require(all(isinstance(i, str) and re.fullmatch(r"[a-z0-9][a-z0-9-]{0,31}", i)
                for i in ids) and len(ids) == len(set(ids)), "Invalid or duplicate task IDs")
    require("integration" not in ids, "integration is reserved for the integration worktree")
    paths, visited = [], set()
    for task in tasks:
        require(isinstance(task.get("goal"), str) and task["goal"].strip(), "Missing task goal")
        deps = task.get("depends_on", [])
        require(isinstance(deps, list) and all(isinstance(d, str) for d in deps) and set(deps) <= visited,
                "Dependencies must refer to earlier tasks; manifest is topological merge order")
        visited.add(task["id"])
        owns = task.get("owns")
        require(isinstance(owns, list) and owns, "Every task needs owned paths")
        for value in owns:
            require(isinstance(value, str) and value and "\\" not in value
                    and not any(c in value for c in "*?[]\n\r\0"), "Use exact paths or directory/ prefixes")
            require(not PurePosixPath(value).is_absolute() and all(part not in ("", ".", "..", ".git", ".parallel")
                    for part in value.rstrip("/").split("/")), "Unsafe owned path")
            for previous, owner in paths:
                normalized, other = value.rstrip("/").casefold(), previous.rstrip("/").casefold()
                overlap = (normalized == other or normalized.startswith(other + "/")
                           or other.startswith(normalized + "/"))
                require(not overlap, f"Owned path overlap: {value} ({task['id']}) and {previous} ({owner})")
            paths.append((value, task["id"]))
        validate_gates(task.get("gates"))
    validate_gates(plan.get("integration_gates"))


def load(batch):
    return read_json(batch / "state.json")


def task_for(state, task_id):
    require(task_id in state["tasks"], f"Unknown task: {task_id}")
    return state["tasks"][task_id]


def save(batch, state):
    write_json(batch / "state.json", state)


def event(task, action, **details):
    task.setdefault("history", []).append({"action": action, "at": datetime.now(timezone.utc).isoformat(), **details})


def authorize(task, token):
    require(task.get("token") == token and token, "Stale or incorrect attempt token")
    require(task["status"] == "running", "Task must be running")


def head(task):
    return git(task["worktree"], "rev-parse", "HEAD")


def common_dir(repo):
    path = Path(git(repo, "rev-parse", "--git-common-dir"))
    return (Path(repo) / path).resolve()


def validate_delivery(task):
    require(clean(task["worktree"]), "Commit owned work first; worktree has uncommitted/untracked changes")
    require(git(task["worktree"], "branch", "--show-current") == task["branch"], "Worker changed its assigned branch")
    require(execute(["git", "merge-base", "--is-ancestor", task["base_sha"], "HEAD"],
                    task["worktree"]).returncode == 0, "Task base is no longer an ancestor")
    # Check both endpoints of a rename, including an out-of-scope deletion.
    output = git(task["worktree"], "diff", "--no-renames", "--name-only", "-z", task["base_sha"], "HEAD")
    files = [p for p in output.split("\0") if p]
    require(all(any(p == owned or (owned.endswith("/") and p.startswith(owned))
                    for owned in task["owns"]) for p in files), f"Changes exceed ownership: {files}")
    return files


def run_gates(worktree, gates, log_dir):
    log_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for index, gate in enumerate(gates):
        try:
            result = execute(gate["argv"], worktree, gate.get("timeout", 120))
            code, output = result.returncode, result.stdout
        except subprocess.TimeoutExpired:
            code, output = 124, "Gate timed out; inspect child processes before retrying.\n"
        except OSError as error:
            code, output = 127, str(error)
        log = log_dir / f"{index:02d}.log"
        log.write_text(output, encoding="utf-8")
        records.append({"name": gate["name"], "argv": gate["argv"], "exit_code": code, "log": str(log)})
    return records


def initialize(args, batch):
    plan = read_json(Path(args.plan))
    validate_plan(plan)
    repo = Path(git(Path.cwd(), "rev-parse", "--show-toplevel")).resolve()
    require(not batch.exists(), f"Batch exists: {batch}; inspect status/recover")
    if batch.is_relative_to(repo):
        require(execute(["git", "check-ignore", str(batch)], repo).returncode == 0,
                "An in-repository batch must be ignored by Git (use .parallel/)")
    batch.mkdir(parents=True)
    base = git(repo, "rev-parse", "HEAD")
    state = {"version": 1, "id": plan["id"], "repo": str(repo), "base_sha": base,
             "goal": plan["goal"], "max_workers": plan["max_workers"],
             "integration": {"branch": f"parallel/{plan['id']}/integration",
                             "worktree": str(batch / "worktrees" / "integration")},
             "integration_gates": plan["integration_gates"], "tasks": {}}
    for spec in plan["tasks"]:
        state["tasks"][spec["id"]] = {**spec, "depends_on": spec.get("depends_on", []),
            "base_sha": base, "status": "queued", "attempt": 0,
            "branch": f"parallel/{plan['id']}/{spec['id']}",
            "worktree": str(batch / "worktrees" / spec["id"]), "history": []}
    write_json(batch / "plan.json", plan)
    save(batch, state)
    return {"batch": str(batch), "base_sha": base, "note": "Committed baseline only; local edits are not copied"}


def ensure_worktree(state, task):
    path = Path(task["worktree"])
    if path.exists():
        require(git(path, "branch", "--show-current") == task["branch"], "Unexpected worktree branch")
        require(common_dir(path) == common_dir(state["repo"]), "Worktree belongs to another repository")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = execute(["git", "show-ref", "--verify", "--quiet", "refs/heads/" + task["branch"]], state["repo"])
    if exists.returncode == 0:
        require(git(state["repo"], "rev-parse", task["branch"]) == state["base_sha"],
                "Existing branch has work; restore its worktree manually")
        git(state["repo"], "worktree", "add", str(path), task["branch"])
    else:
        git(state["repo"], "worktree", "add", "-b", task["branch"], str(path), state["base_sha"])


def prepare(batch):
    with locked(batch):
        state = load(batch)
        for task in [state["integration"], *state["tasks"].values()]:
            ensure_worktree(state, task)
    return {"prepared": list(state["tasks"]), "integration": state["integration"]}


def packet(batch, task_id):
    task = task_for(load(batch), task_id)
    script = Path(__file__).resolve()
    skill = script.parent.parent / "SKILL.md"
    command = f'python3 "{script}"'
    content = f'''# {task_id}: {task['goal']}

Read the project skill: {skill}
Role: worker. Batch: {batch}
Work only in: {task['worktree']}
Branch: {task['branch']}; base before claim: {task['base_sha']}
Own only: {json.dumps(task['owns'], ensure_ascii=False)}
Dependencies: {json.dumps(task['depends_on'])}
Acceptance: {task.get('acceptance', task['goal'])}

1. Claim: `{command} claim --batch "{batch}" --task {task_id} --owner UNIQUE-AGENT-NAME`.
   Use the returned attempt token and base. If blocked, do not start writing.
2. Read assigned files, preserve previous attempts, work only in the assigned worktree.
3. Commit explicit owned paths. Never merge, push, switch branches, or edit other worktrees.
4. `{command} check --batch "{batch}" --task {task_id} --token TOKEN`
5. `{command} submit --batch "{batch}" --task {task_id} --token TOKEN --summary "actual outcome and limitations"`
6. Return commit SHA, findings, gate results, and blockers for independent review.

Long work: run heartbeat with the same batch/task/token. When stopping, retain edits and report the handoff.
The coordinator must confirm you have stopped before reassigning. Do not edit state.json directly.
Gate definitions: {json.dumps(task['gates'], ensure_ascii=False)}
'''
    path = batch / "packets" / f"{task_id}.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return {"packet": str(path), "content": content}


def claim(args, batch):
    with locked(batch):
        state = load(batch)
        task = task_for(state, args.task)
        require(task["status"] in ("queued", "changes_requested"), "Task already claimed or finished")
        require(all(state["tasks"][d]["status"] == "verified" for d in task["depends_on"]), "Dependencies not verified")
        require(sum(t["status"] == "running" for t in state["tasks"].values()) < state["max_workers"],
                "Concurrent writer budget exhausted; expired leases still count")
        ensure_worktree(state, task)
        if task["attempt"] == 0:
            require(clean(task["worktree"]) and head(task) == state["base_sha"], "Initial worktree changed before claim")
            git(task["worktree"], "merge", "--ff-only", state["integration"]["branch"])
            task["base_sha"] = head(task)
        task.update(status="running", owner=args.owner, token=uuid.uuid4().hex,
                    attempt=task["attempt"] + 1, lease_until=time.time() + args.lease)
        task.pop("evidence", None)
        task.pop("review", None)
        event(task, "claim", owner=args.owner, attempt=task["attempt"])
        save(batch, state)
        return task


def check(args, batch):
    task = task_for(load(batch), args.task)
    authorize(task, args.token)
    files = validate_delivery(task)
    sha = head(task)
    gates = [{"name": "diff-check", "argv": ["git", "diff", "--check", task["base_sha"], "HEAD"]}, *task["gates"]]
    records = run_gates(task["worktree"], gates, batch / "logs" / args.task / f"{task['attempt']}-{uuid.uuid4().hex[:8]}")
    require(head(task) == sha and clean(task["worktree"]), "Gate modified worktree or HEAD; inspect and check again")
    with locked(batch):
        state = load(batch)
        task = task_for(state, args.task)
        authorize(task, args.token)
        require(head(task) == sha, "HEAD changed during checking")
        evidence = {"sha": sha, "attempt": task["attempt"], "files": files, "gates": records,
                    "passed": all(g["exit_code"] == 0 for g in records)}
        task["evidence"] = evidence
        save(batch, state)
    return evidence


def review(args, batch):
    with locked(batch):
        state = load(batch)
        task = task_for(state, args.task)
        require(task["status"] == "ready_for_review", "Task is not awaiting review")
        require(args.reviewer != task["owner"], "Reviewer must be independent from task owner")
        validate_delivery(task)
        require(head(task) == task["evidence"]["sha"], "HEAD changed since submission")
        task["review"] = {"reviewer": args.reviewer, "decision": args.decision, "sha": head(task), "note": args.note}
        task["status"] = "merge_ready" if args.decision == "approve" else "changes_requested"
        event(task, "review", **task["review"])
        save(batch, state)
        return task["review"]


def reopen(args, batch):
    with locked(batch):
        state = load(batch)
        task = task_for(state, args.task)
        require(args.stopped, "Confirm worker stopped before reopening")
        require(task["status"] in ("ready_for_review", "merge_ready", "changes_requested"),
                "Only unmerged submissions can reopen; running tasks use handoff")
        sha = task.get("evidence", {}).get("sha")
        target = state["integration"]["worktree"]
        if sha and sha != task["base_sha"]:
            require(execute(["git", "merge-base", "--is-ancestor", sha, "HEAD"], target).returncode != 0,
                    "Submitted SHA is already integrated; use a separate repair task")
        task.update(status="changes_requested", token=None)
        task.pop("evidence", None)
        task.pop("review", None)
        event(task, "reopen", coordinator=args.coordinator, reason=args.reason)
        save(batch, state)
        return {"task": args.task, "status": task["status"], "note": "Retained all work; claim a new attempt"}


def integrate(args, batch):
    with locked(batch):
        state = load(batch)
        task = task_for(state, args.task)
        require(task["status"] in ("merge_ready", "integrating", "merged_unverified", "verified"), "Task is not approved")
        for key, previous in state["tasks"].items():
            if key == args.task:
                break
            require(previous["status"] == "verified", "Integrate tasks in manifest order")
        validate_delivery(task)
        sha = head(task)
        require(sha == task["review"]["sha"] == task["evidence"]["sha"], "Reviewed commit changed")
        target = state["integration"]["worktree"]
        require(git(target, "branch", "--show-current") == state["integration"]["branch"], "Wrong integration branch")
        require(clean(target), "Integration worktree is dirty/conflicted; preserve and resolve or abort first")
        included = execute(["git", "merge-base", "--is-ancestor", sha, "HEAD"], target).returncode == 0
        if task["status"] == "verified":
            require(included, "Verified commit missing from integration branch")
            return {"status": "verified", "skipped": True, "sha": sha}
        task["status"] = "integrating"
        save(batch, state)
        if not included:
            merged = execute(["git", "merge", "--no-ff", "--no-edit", sha], target)
            if merged.returncode:
                task["merge_error"] = merged.stdout
                save(batch, state)
                raise WorkflowError("Merge failed; conflict preserved. Inspect before retrying.")
        task["status"] = "merged_unverified"
        task["integration_sha"] = git(target, "rev-parse", "HEAD")
        save(batch, state)
        results = run_gates(target, state["integration_gates"], batch / "logs" / "integration" / uuid.uuid4().hex[:8])
        require(clean(target) and git(target, "rev-parse", "HEAD") == task["integration_sha"],
                "Integration gate changed work or HEAD; inspect before retrying")
        task["integration_gates"] = results
        if all(g["exit_code"] == 0 for g in results):
            task["status"] = "verified"
        event(task, "integration", sha=task["integration_sha"], status=task["status"])
        save(batch, state)
        return {"status": task["status"], "integration_sha": task["integration_sha"], "gates": results}


def recover(batch):
    state = load(batch)
    observations = []
    target = state["integration"]["worktree"]
    for key, task in state["tasks"].items():
        record = {"task": key, "status": task["status"], "owner": task.get("owner"),
                  "attempt": task["attempt"], "worktree": task["worktree"]}
        if Path(task["worktree"]).exists():
            record.update(head=head(task), dirty=not clean(task["worktree"]))
            evidence = task.get("evidence", {})
            record["evidence_matches_head"] = evidence.get("sha") == record["head"]
            if Path(target).exists() and evidence.get("sha"):
                record["included_in_integration"] = execute(
                    ["git", "merge-base", "--is-ancestor", evidence["sha"], "HEAD"], target).returncode == 0
        else:
            record["missing_worktree"] = True
        if task["status"] == "running":
            record["lease_expired"] = task["lease_until"] < time.time()
            record["next"] = "Contact owner; confirm stopped before handoff. No automatic takeover."
        observations.append(record)
    return {"batch": state["id"], "integration": state["integration"], "tasks": observations,
            "note": "Read-only reconciliation; missing evidence requires checking, not repeated implementation"}


def update_task(args, batch):
    with locked(batch):
        state = load(batch)
        task = task_for(state, args.task)
        authorize(task, args.token)
        if args.command == "heartbeat":
            task["lease_until"] = time.time() + args.lease
        elif args.command == "handoff":
            require(args.stopped, "Confirm previous writer stopped with --stopped; keep all edits")
            task.update(status="queued", token=None)
            event(task, "handoff", reason=args.reason, previous_owner=task["owner"])
        elif args.command == "submit":
            validate_delivery(task)
            evidence = task.get("evidence", {})
            require(evidence.get("passed") and evidence.get("sha") == head(task)
                    and evidence.get("attempt") == task["attempt"], "Run passing checks on this exact commit/attempt first")
            task.update(status="ready_for_review", summary=args.summary)
            event(task, "submit", sha=head(task), summary=args.summary)
        save(batch, state)
        return {"status": task["status"], "task": args.task}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for command in ("init", "prepare", "packet", "claim", "heartbeat", "handoff", "check", "submit", "review", "reopen", "integrate", "status", "recover"):
        p = sub.add_parser(command)
        p.add_argument("--batch", required=True)
        if command in ("packet", "claim", "heartbeat", "handoff", "check", "submit", "review", "reopen", "integrate"):
            p.add_argument("--task", required=True)
        if command in ("heartbeat", "handoff", "check", "submit"):
            p.add_argument("--token", required=True)
        if command == "init":
            p.add_argument("--plan", required=True)
        if command == "claim":
            p.add_argument("--owner", required=True)
        if command in ("claim", "heartbeat"):
            p.add_argument("--lease", type=int, default=1800)
        if command == "handoff":
            p.add_argument("--stopped", action="store_true")
            p.add_argument("--reason", required=True)
        if command == "submit":
            p.add_argument("--summary", required=True)
        if command == "review":
            p.add_argument("--reviewer", required=True)
            p.add_argument("--decision", required=True, choices=("approve", "changes_requested"))
            p.add_argument("--note", required=True)
        if command == "reopen":
            p.add_argument("--coordinator", required=True)
            p.add_argument("--reason", required=True)
            p.add_argument("--stopped", action="store_true")
    args = parser.parse_args()
    batch = Path(args.batch).expanduser().resolve()
    try:
        if hasattr(args, "lease"):
            require(1 <= args.lease <= 86400, "lease must be 1..86400 seconds")
        if args.command == "init":
            result = initialize(args, batch)
        elif args.command == "prepare":
            result = prepare(batch)
        elif args.command == "packet":
            result = packet(batch, args.task)
        elif args.command == "claim":
            result = claim(args, batch)
        elif args.command == "check":
            result = check(args, batch)
        elif args.command == "review":
            result = review(args, batch)
        elif args.command == "reopen":
            result = reopen(args, batch)
        elif args.command == "integrate":
            result = integrate(args, batch)
        elif args.command in ("status", "recover"):
            result = recover(batch)
        else:
            result = update_task(args, batch)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        failed = args.command == "check" and not result["passed"]
        failed |= args.command == "integrate" and result["status"] != "verified"
        return 1 if failed else 0
    except (WorkflowError, OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
