---
name: parallel-development
description: Coordinate parallel development and prototype validation in this project using isolated Git worktrees and a shared task protocol. Use for multi-agent batches, independent reviews, or resuming work across any coding tools.
---

# Parallel development

Use one coordinator, one integration writer, and independently owned tasks. Any agent may fill these roles. Markdown, JSON, Git, and Python 3.9+ standard library are the shared interface; no provider API, MCP server, or particular agent CLI is required.

Read [the protocol](references/protocol.md) when planning or resuming, [tool adapters](references/adapters.md) when starting agents, and [project context](references/project.md) before splitting prototype/product work. Generated worker packets contain task-specific steps.

## Start and complete a batch

1. Inspect the current branch, local work, latest specifications, and available tools. Preserve active prototype design. Split independent deliverables and give shared interfaces/files a single owner. Use serial work when separation costs exceed the benefit.
2. Adapt [the example plan](assets/prototype-plan.json). Use exact owned paths or directory prefixes ending in `/`, explicit dependencies, and real gate commands as argument arrays. From the repository root run `python3 .agents/skills/parallel-development/scripts/workflow.py init --plan PLAN.json --batch .parallel/BATCH`, then `prepare --batch .parallel/BATCH`. This creates worker and integration worktrees at a fixed committed baseline without switching the user's checkout. Uncommitted edits are not copied.
3. Run `packet --batch .parallel/BATCH --task TASK`. Give the packet to an agent through available native delegation, an authorized headless process, or a manual session. Do not invent spawn APIs or grant permissions. An unavailable launcher leaves a queued task with a complete handoff packet.
4. Each worker runs `claim --owner UNIQUE-NAME`, retains its attempt token, and works only inside its assigned worktree/owned paths. Use `heartbeat` for long work. Every nested write-capable agent needs its own planned task/claim within the batch budget; unplanned helpers stay read-only. Start with two writers.
5. Workers commit explicit owned files, run `check`, then `submit`. They stop writing after submission. A different agent inspects the diff and gate evidence before `review --decision approve`; changing the reviewer name alone is not independent review. Rejected work needs a fresh claim/check/submit.
6. The integration writer runs `integrate` in manifest order. The helper merges the reviewed commit into the dedicated integration worktree, runs gates, and stops on conflicts/failures. Inspect the final diff and report the integration branch. Moving changes to the product branch follows the user's authorization; publishing and deployment are separate actions.

## Invariants

- `.parallel/` holds local state/worktrees/packets/logs and is ignored by Git. Curate sanitized evidence under `specs/development/`. Plans and logs must not contain credentials/private content.
- Use the helper for shared state: cross-process lock, atomic writes, attempt tokens, exact commit evidence. Gate argument arrays are trusted executable input: review them before running. They execute without a shell.
- Ownership is checked on delivery; it is not a security sandbox. Keep host permissions and isolate dependencies, build output, ports, browser profiles, and databases. Never reuse a live prototype's mutable runtime directories.
- `recover` only reconciles observations. An expired lease does not authorize takeover. Confirm the old writer stopped before `handoff --stopped`, preserve its work, invalidate its token, then claim a new attempt.
- On conflict retain the work and record the blocker. Repair through a reviewed task or inspect and abort the merge before retrying. Do not improvise business changes in the integration worktree.
- Nothing is pushed or deleted automatically. Do not broaden skills into permission grants, automatic production operations, or an obligation to parallelize unrelated small edits.

Based on the role separation, worktree-first approach, and durable handoffs in `Projsyc/claude-boss-workflow` at `20f7b88ae739e17bb3222e8ad3e085eefc42c406`. This tool-neutral implementation does not copy its CLI permission configuration.
