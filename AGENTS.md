# Project agents

For multi-agent development, prototype validation batches, or resuming parallel work, read [the project parallel-development skill](.agents/skills/parallel-development/SKILL.md). It is the canonical workflow for all tools. Small independent edits do not require a parallel batch.

Keep the user's active prototype checkout and runtime intact. Use assigned worktrees for concurrent writers; shared interfaces and files have one owner. Read the latest concept specifications and `specs/concept/prototype-handoff.md` before deriving tasks from older issue discussions.

The helper requires Git and Python 3.9+ standard library. Agents without native skill discovery can read the same Markdown and generated task packets directly. Local `.parallel/` state/logs are ignored; curated development evidence belongs in `specs/development/`. Using the workflow does not grant publishing or production permissions.
