---
name: parallel-development
description: Claude Code entry point for this project's shared parallel development workflow, isolated worktrees, cross-agent task handoffs, reviews, and recovery.
---

# Shared project workflow

Read `.agents/skills/parallel-development/SKILL.md` from the repository root and follow that canonical skill. Its `references/`, `assets/`, and `scripts/` are the shared implementation for every coding agent.

Use `python3 .agents/skills/parallel-development/scripts/workflow.py --help` for the provider-neutral helper. This wrapper adds no Claude-specific permissions, hooks, tools, model choices, or launch requirements. If a working directory is a subdirectory, find its Git root first; do not resolve the canonical skill relative to this wrapper.
