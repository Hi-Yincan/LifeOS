# Project adaptation

Read the current `specs/concept/README.md`, `implementation-plan.md`, `prototype-handoff.md`, `acceptance.md`, and relevant app/architecture specifications in the actual task baseline. Issue #18 was initially drafted before App Store and the default-desktop change; do not freeze its older scope into the workflow. Current prototype and production requirements are different evidence levels.

The first exercise uses a disposable local clone of the committed prototype plus the skill files, two read-only source audits that write separate report files, independent review and integration. It must not change the active design, reuse a running service's `.runtime`, or claim browser/production validation from source checks.

Useful current commands (from the repository root):

```sh
node --check research/daedalos-portfolio/service.mjs
node --check research/daedalos-portfolio/tools/prepare.mjs
node --test research/daedalos-portfolio/test/content.test.mjs research/daedalos-portfolio/test/app-store.test.mjs
```

The test runner may need local loopback access; use the host's normal approval flow if the sandbox blocks it. The full daedalOS prototype build requires the pinned upstream checkout, dependencies and its own output. Do not run `prepare.mjs` or build scripts against the user's active checkout during an isolated task unless that target is explicitly assigned.

For product work, make upstream import/branch strategy and shared API/types the initial serial work. Portfolio UI may then use agreed fixtures while the content service progresses independently. System registration, Providers, menu/settings entry points, dictionary indexes, lockfiles and migration sequences each have one owner. Management/media tasks wait for their API/auth dependencies. App Store planning follows the current concept handoff and its unresolved distribution/permission decisions. Validate the actual A01–A18 requirements after reading their latest revisions.

Adopt from `claude-boss-workflow`: separated coordinator/worker/integrator/reviewer roles, fixed worktrees, explicit ownership, durable packets/reports and recovery by Git evidence. Replace its `dev` assumption, project-specific gates/permissions, default style and unattended push/cleanup with this project's actual environment and authorization. No production deployment or broad refactor is implied by using the skill.
