# Protocol v1

The helper is optional infrastructure, not a host-specific agent framework. An agent with file/terminal access can participate; an agent without a terminal returns a proposed patch/review to the coordinator and does not claim a write task. A coordinator may execute commands on that agent's behalf but must record the actual worker and evidence.

## Plan and ownership

`assets/prototype-plan.json` is an executable example. Required fields:

| Field | Meaning |
| --- | --- |
| version / id / goal | Protocol 1, unique lowercase batch ID, intended result |
| max_workers | Concurrent running claims, including nested writers; integer 1–16, chosen for the batch rather than fixed at 2 |
| tasks | Topologically ordered tasks; this is also integration order |
| task.id / goal / acceptance | Unique task ID, deliverable, observable acceptance |
| task.owns | Exact repository paths or directory prefixes ending in `/`; no globs |
| task.depends_on | Earlier task IDs that must be integrated and verified before claim |
| task.gates / integration_gates | Nonempty arrays of `{name, argv, timeout?}`; timeout defaults to 120 seconds |

Owned paths cannot overlap inside a batch, even for dependent tasks. Keep a shared file with one owner or make another serial batch. Namespace ports/databases/build directories explicitly in the task goal/acceptance when needed. Missing gate commands are blockers, never invented passes. Shell expansion is intentionally absent: list test files explicitly or use the package manager's existing script.

The host's agent limit and `max_workers` count different resources. Read-only reviewers consume host capacity without holding write claims. Choose the batch budget from independent tasks and actual host capacity, reserving room for review; do not treat a configured host limit as proof that the current session exposes it. The example plan uses 2 because it has two audit tasks. See [tool adapters](adapters.md) for the local Codex configuration. Do not edit an active batch's immutable plan to change its budget; create a new batch after preserving existing work.

Path comparisons conservatively ignore case to prevent overlapping writers on case-insensitive macOS/Windows filesystems. Task ID `integration` is reserved.

Initialize/prepare/claim/check/review/integrate are local Git/file actions. Review executable plans and repository hooks as normal trusted project code; ownership patterns and tokens do not sandbox commands or establish user identity.

## Worker lifecycle

```text
queued → running → ready_for_review → merge_ready → integrating
            ↑             ↓                            ↓
            └── changes_requested              merged_unverified → verified
running → confirmed-stopped handoff → queued (new attempt, new token)
```

The mutable `state.json` holds task owner, attempt, token, lease, exact baseline/branch/worktree, commit evidence, review, integration result, and history. Each update is serialized by `.lock/` and written using atomic replacement. Workers run gate processes concurrently outside this state lock; integration is serialized. Failed `check`/integration gates exit 1, invalid operations exit 2, success exits 0. Every command emits JSON; help is available with `--help`.

1. `init --plan … --batch …`: validate first, capture committed HEAD, write state and immutable plan snapshot. A batch inside the repository must be ignored by Git. Use a new batch ID for changed plans; do not edit live state/plan.
2. `prepare --batch …`: idempotently create worker/integration branches and worktrees. A partial preparation can be retried. Existing branches with work are retained; missing worktrees with changed branches require manual restoration.
3. `packet --batch … --task …`: Markdown handoff with absolute paths, scope, acceptance, exact gates, and commands. It is tool-neutral. Packets contain no conversation history.
4. `claim --batch … --task … --owner … [--lease 1800]`: claim after dependencies are verified; initial worktree fast-forwards to the integration branch and records that baseline. Re-claims preserve previous commits/uncommitted work. All later commands use `--token TOKEN`. Running claims count against the budget even if their lease expired.
5. `heartbeat …`: extend a running claim; `handoff … --stopped --reason …`: invalidate it only after stopping the old writer. Reassignment is explicit and bounded by the same concurrency budget.
6. Commit explicit owned files. `check …` verifies a clean assigned branch, baseline ancestry, owned diff (including both sides of renames), whitespace and task gates. Evidence is bound to attempt/HEAD. A gate that changes the worktree cannot produce a passing submission.
7. `submit … --summary …`: requires passing checks for the current commit/attempt. Include limitations; stop editing. `review … --reviewer … --decision approve|changes_requested --note …`: review the actual diff and evidence in a different agent/session. The helper rejects a reviewer equal to the worker name, but human/process independence remains the coordinator's responsibility.
8. `integrate …`: merge the approved SHA, not a moving branch, into the dedicated integration worktree in plan order; run integration gates on that result. On retry, skip an already merged SHA. On repeated verified calls, report success without another merge. A dirty/conflicted integration worktree blocks later actions.
9. `status` / `recover --batch …`: read-only reconciliation of persisted state, actual HEAD/dirty state, evidence match, ancestry and leases. These commands do not launch agents, execute gates, mark work verified, or repeat external effects. Save a sanitized final report; leave branches/worktrees until their results are safely delivered.

## Recovery decisions

| Observation | Action |
| --- | --- |
| Commit exists, report missing | Contact worker, check/submit the existing commit; do not redo implementation |
| Old process or provider unavailable | Confirm stopped; preserve work, handoff, give packet and current diff to another agent |
| Expired lease, process may still be alive | Contact/stop it first; expiry alone never permits a second writer |
| Merge exists, gates not recorded | Inspect integration worktree; rerun integrate to check the included SHA |
| Merge conflict | Preserve and inspect; abort only after checking changes, then use a reviewed repair task/batch |
| Integration gate fails | Stop later merges; diagnose/fix in a reviewed task; rerun after repair, recording why |
| `.lock/` remains after coordinator crash | Inspect owner.json and host/PID; only after confirming no active operation, remove that specific lock directory and run recover |
| Worker HEAD changed after review | Confirm stopped, run `reopen --task … --coordinator … --reason … --stopped`, then claim/check/submit/review a fresh attempt; work is retained |
| Worktree was deleted by a tool | Restore the branch's worktree manually; do not create a fresh empty branch over existing work |

Gate timeouts kill the direct subprocess; inspect descendant processes before a retry. A batch lock is local to one filesystem, not a distributed coordinator: remote agents must exchange Git commits/reports through a coordinator, not concurrently mutate copied state files. For multi-machine execution assign one writer per clone and have the coordinator validate fetched commits in local worktrees; remote transport is outside v1 automation.
