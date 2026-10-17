# Agent adapters

One canonical skill lives at `.agents/skills/parallel-development/`. This repository provides a short Claude discovery wrapper in `.claude/skills/parallel-development/`; it points to the canonical files rather than duplicating the protocol or script. There are no symlinks, provider SDKs, required marketplace plugins, model defaults, or permissions overrides.

| Agent surface | Entry and execution |
| --- | --- |
| Codex | Discover the project skill in `.agents/skills/`; use `$parallel-development` or read its SKILL.md. Give a worker packet to an available authorized native subagent/session. Worktree creation can use the helper; do not also ask the host to create a second worktree for that task |
| Claude Code | Use `/parallel-development` from the project wrapper. The main session can delegate focused read-only helpers or run independent write tasks in their assigned worktrees. Subagents, headless sessions and Agent Teams are distinct choices; choose one and verify worktree isolation |
| Cursor | Discover `.agents/skills/` or explicitly read the canonical SKILL.md; open each assigned worktree in an agent session. Native parallel/best-of-N UI is optional; it does not replace task ownership, review or integration |
| Other CLI/IDE agents | Read SKILL.md and the worker packet; claim, edit, commit, check and submit with the same Python commands. Markdown/JSON/Git are the compatibility contract, regardless of native skills support |
| Chat-only agents | Return a patch, analysis or review to the coordinator. They cannot independently claim a filesystem writer slot without a terminal bridge |

## Starting workers

Use native tool delegation when available and authorized. Give the full packet, not only a task name; pass the assigned worktree as the working directory and preserve the owner identity/attempt. For a headless CLI, inspect the locally installed `--help` and supported input/output flags before invoking it. Send the packet via stdin or an explicitly supported file argument; do not insert file contents into a shell command or assume flags are portable across tools/versions.

The coordinator can launch independent permitted processes in parallel using its existing terminal/process facilities; log each process separately under the batch. Do not bypass host approval prompts, enable unrestricted modes, or inject vendor-specific permissions into shared configuration. If the tool cannot launch, print the packet path and exact handoff steps and continue independent work.

For a Claude workstream that needs several Claude writers, plan them as separate task IDs in the same batch and use the same claim budget. A nested manager may aggregate their results but cannot create a second integration writer. A single task must never have multiple simultaneous writers hidden behind one claim. Read-only exploration/review can run alongside a writer.

No tool's session state is the cross-agent source of truth. Replace an unavailable agent by confirmed handoff, a new attempt, the current Git branch/diff, and the same packet. Remote/multi-machine workers use Git/report handoffs to one coordinator; v1 does not provide remote execution or distributed locking.

## Compatibility verification

Distinguish protocol compatibility from verified native discovery/launching. The helper's test suite exercises provider-neutral Git/JSON behavior. Real multi-agent exercises verify the hosts actually used; untested Claude/Cursor launching must stay labeled untested. Record OS, Python/Git versions, agent surface, base SHA, task commits, gate results and limitations.

Official documentation checked for discovery and isolation design on 2026-10-17:

- https://developers.openai.com/codex/skills/
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/agent-teams
- https://cursor.com/docs/context/skills
- https://cursor.com/docs/configuration/worktrees

These describe the hosts; installed versions still determine available features. The shared script does not depend on those features.
