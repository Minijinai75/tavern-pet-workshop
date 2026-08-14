# Project Workflow

## Purpose

讓下一扇工作窗能在五秒內知道桌寵工坊做到哪裡、為什麼這樣做，以及下一步先碰哪裡。

## Workflow

1. Read `PROJECT_STATUS.md`, `DECISIONS.md`, and the latest `TASK_LOG.md` entry.
2. Confirm the active task and success criteria.
3. For TypeScript behavior, write one focused failing test and run it before implementation.
4. Implement the smallest useful slice and rerun all tests.
5. Run build, accessibility-oriented manual checks, and Pages checks as appropriate.
6. Update continuity files before commit and push.

## When To Escalate

- A change would introduce a backend, user accounts, telemetry, or remote asset uploads.
- A pack format change can break an already exported `.jrpack.zip`.
- A repository visibility, license, or public branding decision is required.
- A deletion, history rewrite, or other irreversible operation is being considered.

## End-Of-Session Gate

Update `PROJECT_STATUS.md`, `TASK_LOG.md`, `VERIFY.md`, and any affected decision record before handoff.

