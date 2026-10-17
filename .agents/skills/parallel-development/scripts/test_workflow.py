"""Behavioral integration tests in disposable Git repositories; no agents/network."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("workflow.py").resolve()


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="parallel-tests-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo = self.root / "repo with spaces"
        self.repo.mkdir()
        self.run_git(self.repo, "init", "-b", "main")
        self.run_git(self.repo, "config", "user.name", "Workflow Test")
        self.run_git(self.repo, "config", "user.email", "workflow@example.invalid")
        for name in ("a.txt", "b.txt", "c.txt"):
            (self.repo / name).write_text("baseline\n")
        (self.repo / ".gitignore").write_text(".parallel/\n")
        self.run_git(self.repo, "add", "a.txt", "b.txt", "c.txt", ".gitignore")
        self.run_git(self.repo, "commit", "-m", "baseline")
        self.batch = self.root / "batch with spaces"
        gate = {"name": "file", "argv": [sys.executable, "-c", "from pathlib import Path; assert Path('a.txt').is_file()"]}
        self.plan = {"version": 1, "id": "test", "goal": "test observable task invariants", "max_workers": 2,
                     "tasks": [{"id": key, "goal": "update " + key, "owns": [key + ".txt"],
                                "depends_on": [], "gates": [gate]} for key in ("a", "b")],
                     "integration_gates": [gate]}

    def run_git(self, cwd, *args):
        p = subprocess.run(["git", *args], cwd=cwd, text=True, capture_output=True)
        self.assertEqual(p.returncode, 0, p.stderr)
        return p.stdout.strip()

    def cli(self, command, *args, ok=True):
        p = subprocess.run([sys.executable, str(SCRIPT), command, "--batch", str(self.batch), *args],
                           cwd=self.repo, text=True, capture_output=True)
        if ok:
            self.assertEqual(p.returncode, 0, p.stderr + p.stdout)
        else:
            self.assertNotEqual(p.returncode, 0, p.stdout)
        return json.loads(p.stdout if p.returncode in (0, 1) else p.stderr)

    def start(self):
        plan_path = self.root / "plan.json"
        plan_path.write_text(json.dumps(self.plan))
        self.cli("init", "--plan", str(plan_path))
        self.cli("prepare")
        return json.loads((self.batch / "state.json").read_text())

    def claim(self, key="a", owner="worker-a"):
        return self.cli("claim", "--task", key, "--owner", owner)

    def commit(self, task, filename=None, text="updated\n"):
        cwd = Path(task["worktree"])
        filename = filename or task["id"] + ".txt"
        (cwd / filename).write_text(text)
        self.run_git(cwd, "add", filename)
        self.run_git(cwd, "commit", "-m", "change " + filename)
        return self.run_git(cwd, "rev-parse", "HEAD")

    def submit(self, task):
        params = ("--task", task["id"], "--token", task["token"])
        self.cli("check", *params)
        self.cli("submit", *params, "--summary", "checked change")

    def approve(self, key="a"):
        return self.cli("review", "--task", key, "--reviewer", "independent-reviewer",
                        "--decision", "approve", "--note", "inspected actual diff and gates")

    def test_parallel_claims_and_serial_idempotent_integration(self):
        self.start()
        with ThreadPoolExecutor() as pool:
            tasks = list(pool.map(lambda k: self.claim(k, "worker-" + k), ("a", "b")))
        with ThreadPoolExecutor() as pool:
            list(pool.map(self.commit, tasks))
            list(pool.map(self.submit, tasks))
        self.approve("a")
        self.approve("b")
        self.cli("integrate", "--task", "b", ok=False)
        self.cli("integrate", "--task", "a")
        self.cli("integrate", "--task", "b")
        target = self.cli("status")["integration"]["worktree"]
        before = self.run_git(target, "rev-parse", "HEAD")
        self.assertTrue(self.cli("integrate", "--task", "b")["skipped"])
        self.assertEqual(before, self.run_git(target, "rev-parse", "HEAD"))
        self.assertEqual((Path(target) / "a.txt").read_text(), "updated\n")
        self.assertEqual((Path(target) / "b.txt").read_text(), "updated\n")
        self.assertEqual(self.run_git(self.repo, "branch", "--show-current"), "main")
        self.assertEqual((self.repo / "a.txt").read_text(), "baseline\n")

    def test_concurrent_duplicate_claim_has_one_winner(self):
        self.start()
        def run(owner):
            return subprocess.run([sys.executable, str(SCRIPT), "claim", "--batch", str(self.batch),
                                   "--task", "a", "--owner", owner], cwd=self.repo, capture_output=True).returncode
        with ThreadPoolExecutor() as pool:
            codes = list(pool.map(run, ("one", "two")))
        self.assertEqual(sorted(codes), [0, 2])

    def test_expired_lease_requires_confirmed_handoff_preserves_dirty_work(self):
        self.plan["max_workers"] = 1
        self.start()
        old = self.claim()
        path = Path(old["worktree"]) / "a.txt"
        path.write_text("unfinished design\n")
        state_path = self.batch / "state.json"
        state = json.loads(state_path.read_text())
        state["tasks"]["a"]["lease_until"] = 0
        state_path.write_text(json.dumps(state))
        before = state_path.read_bytes()
        first, second = self.cli("recover"), self.cli("recover")
        self.assertEqual(first, second)
        self.assertEqual(before, state_path.read_bytes())
        self.assertTrue(first["tasks"][0]["lease_expired"])
        self.cli("claim", "--task", "a", "--owner", "replacement", ok=False)
        self.cli("claim", "--task", "b", "--owner", "other", ok=False)
        params = ("--task", "a", "--token", old["token"], "--reason", "old writer stopped")
        self.cli("handoff", *params, ok=False)
        self.cli("handoff", *params, "--stopped")
        new = self.claim(owner="replacement")
        self.assertNotEqual(new["token"], old["token"])
        self.assertEqual(path.read_text(), "unfinished design\n")
        self.cli("heartbeat", "--task", "a", "--token", old["token"], ok=False)

    def test_dependent_task_waits_and_inherits_verified_commit(self):
        self.plan["tasks"][1]["depends_on"] = ["a"]
        self.start()
        self.cli("claim", "--task", "b", "--owner", "worker-b", ok=False)
        a = self.claim()
        commit = self.commit(a)
        self.submit(a)
        self.approve()
        self.cli("integrate", "--task", "a")
        b = self.claim("b", "worker-b")
        self.assertEqual((Path(b["worktree"]) / "a.txt").read_text(), "updated\n")
        self.assertNotEqual(b["base_sha"], a["base_sha"])
        self.assertEqual(self.run_git(b["worktree"], "merge-base", commit, "HEAD"), commit)
        self.commit(b)
        self.assertEqual(self.cli("check", "--task", "b", "--token", b["token"])["files"], ["b.txt"])

    def test_ownership_checks_both_rename_endpoints(self):
        self.start()
        a = self.claim()
        self.run_git(a["worktree"], "mv", "-f", "b.txt", "a.txt")
        self.run_git(a["worktree"], "commit", "-m", "out of scope rename")
        error = self.cli("check", "--task", "a", "--token", a["token"], ok=False)
        self.assertIn("ownership", error["error"])

    def test_changed_sha_cannot_submit_or_integrate_old_evidence(self):
        self.start()
        a = self.claim()
        self.commit(a)
        self.cli("check", "--task", "a", "--token", a["token"])
        self.commit(a, text="second version\n")
        self.cli("submit", "--task", "a", "--token", a["token"], "--summary", "stale", ok=False)
        self.submit(a)
        self.cli("review", "--task", "a", "--reviewer", a["owner"], "--decision", "approve", "--note", "self", ok=False)
        self.approve()
        self.commit(a, text="post-review change\n")
        self.cli("integrate", "--task", "a", ok=False)

    def test_failed_gate_does_not_allow_submission(self):
        self.plan["tasks"][0]["gates"] = [{"name": "fail", "argv": [sys.executable, "-c", "raise SystemExit(7)"]}]
        self.start()
        a = self.claim()
        self.commit(a)
        result = self.cli("check", "--task", "a", "--token", a["token"], ok=False)
        self.assertFalse(result["passed"])
        self.assertEqual(result["gates"][1]["exit_code"], 7)
        self.cli("submit", "--task", "a", "--token", a["token"], "--summary", "incorrect pass", ok=False)

    def test_gate_arguments_are_literal_and_worktree_scoped(self):
        self.plan["tasks"][0]["gates"] = [{"name": "literal", "argv": [sys.executable, "-c",
            "import sys; from pathlib import Path; assert sys.argv[1] == '$(touch injected)'; assert Path('a.txt').read_text() == 'updated\\n'", "$(touch injected)"]}]
        self.start()
        a = self.claim()
        self.commit(a)
        self.cli("check", "--task", "a", "--token", a["token"])
        self.assertFalse((Path(a["worktree"]) / "injected").exists())

    def test_integration_failure_stops_later_merges_and_retry_does_not_duplicate(self):
        flag = self.root / "gate-allowed"
        self.plan["integration_gates"] = [{"name": "flag", "argv": [sys.executable, "-c",
            "import sys; from pathlib import Path; assert Path(sys.argv[1]).exists()", str(flag)]}]
        self.start()
        a = self.claim()
        self.commit(a)
        self.submit(a)
        self.approve()
        result = self.cli("integrate", "--task", "a", ok=False)
        self.assertEqual(result["status"], "merged_unverified")
        target = self.cli("status")["integration"]["worktree"]
        merged = self.run_git(target, "rev-parse", "HEAD")
        flag.write_text("available")
        self.assertEqual(self.cli("integrate", "--task", "a")["status"], "verified")
        self.assertEqual(merged, self.run_git(target, "rev-parse", "HEAD"))

    def test_merge_conflict_is_preserved_and_recovery_is_read_only(self):
        state = self.start()
        a = self.claim()
        self.commit(a, text="worker version\n")
        self.submit(a)
        self.approve()
        target = state["integration"]["worktree"]
        (Path(target) / "a.txt").write_text("conflicting integration version\n")
        self.run_git(target, "add", "a.txt")
        self.run_git(target, "commit", "-m", "simulate conflicting integration change")
        self.cli("integrate", "--task", "a", ok=False)
        self.assertIn("UU a.txt", self.run_git(target, "status", "--porcelain"))
        before = (self.batch / "state.json").read_bytes()
        self.cli("recover")
        self.cli("recover")
        self.assertEqual(before, (self.batch / "state.json").read_bytes())
        self.cli("integrate", "--task", "a", ok=False)

    def test_prepare_is_idempotent_and_packet_is_provider_neutral(self):
        self.start()
        self.cli("prepare")
        packet = self.cli("packet", "--task", "a")
        self.assertTrue(Path(packet["packet"]).is_file())
        self.assertIn("claim", packet["content"])
        self.assertIn(str(self.batch), packet["content"])
        self.assertNotIn("--dangerously", packet["content"])

    def test_invalid_plan_rejected_before_creating_batch(self):
        for owns in (["../outside"], ["a/../outside"], [".git/config"], ["a*.txt"]):
            self.plan["tasks"][0]["owns"] = owns
            path = self.root / "bad-plan.json"
            path.write_text(json.dumps(self.plan))
            self.cli("init", "--plan", str(path), ok=False)
            self.assertFalse(self.batch.exists())
        self.plan["tasks"][0]["owns"] = ["directory/"]
        self.plan["tasks"][1]["owns"] = ["directory/file.md"]
        path.write_text(json.dumps(self.plan))
        self.cli("init", "--plan", str(path), ok=False)
        self.assertFalse(self.batch.exists())

    def test_reopen_preserves_post_review_work_and_requires_new_evidence(self):
        self.start()
        a = self.claim()
        self.commit(a)
        self.submit(a)
        self.approve()
        commit = self.commit(a, text="unreviewed followup\n")
        self.cli("reopen", "--task", "a", "--coordinator", "lead", "--reason", "HEAD changed", ok=False)
        self.cli("reopen", "--task", "a", "--coordinator", "lead", "--reason", "HEAD changed", "--stopped")
        new = self.claim(owner="replacement")
        self.assertEqual(self.run_git(new["worktree"], "rev-parse", "HEAD"), commit)
        self.assertNotEqual(new["token"], a["token"])
        self.cli("submit", "--task", "a", "--token", new["token"], "--summary", "no new evidence", ok=False)
        self.submit(new)
        self.approve()
        self.cli("integrate", "--task", "a")
        self.cli("reopen", "--task", "a", "--coordinator", "lead", "--reason", "too late", "--stopped", ok=False)

    def test_case_insensitive_overlap_and_reserved_id_rejected(self):
        path = self.root / "invalid-plan.json"
        for value in ("A.TXT", "a.txt/", "a.txt/child"):
            self.plan["tasks"][1]["owns"] = [value]
            path.write_text(json.dumps(self.plan))
            self.cli("init", "--plan", str(path), ok=False)
            self.assertFalse(self.batch.exists())
        self.plan["tasks"][1]["owns"] = ["b.txt"]
        self.plan["tasks"][1]["id"] = "integration"
        path.write_text(json.dumps(self.plan))
        self.cli("init", "--plan", str(path), ok=False)
        self.assertFalse(self.batch.exists())


if __name__ == "__main__":
    unittest.main()
