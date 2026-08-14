## Project Working Rules

- Treat this as a continuity-sensitive, multi-session project.
- Before substantial work, read `PROJECT_STATUS.md`, `DECISIONS.md`, and `PROJECT_WORKFLOW.md`.
- Keep the website account-free and browser-local unless Mini explicitly changes that decision.
- Use test-driven development for behavior-bearing TypeScript: write and observe a failing test before production code.
- Do not add executable JavaScript fields to exported character packs. Packs are data-only.
- Record completed files, deliberate exceptions, verification, and remaining work before ending a session.

## Execution Standard

- Prefer the smallest change that fully solves the active task.
- Preserve keyboard access, readable contrast, responsive layouts, and reduced-motion support.
- Never upload a user's character image, character data, or prompt to a server.
- Keep GitHub Pages deployment static; no backend or account service belongs in v1.

## Continuity Gate

Before handoff, update:

- `PROJECT_STATUS.md`
- `TASK_LOG.md`
- `DECISIONS.md` when a durable decision changed
- `VERIFY.md` with commands actually run and known gaps

