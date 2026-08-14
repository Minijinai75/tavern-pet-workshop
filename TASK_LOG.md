# Task Log

## Sessions

### 2026-08-14 17:17

- Objective: Create the GitHub repository and begin the first deployable website version.
- What changed: Created the public repository, generated a persisted design system, and added continuity/project rules.
- Files touched: `AGENTS.md`, `PROJECT_WORKFLOW.md`, `PROJECT_STATUS.md`, `DECISIONS.md`, `TASK_LOG.md`, `VERIFY.md`, `design-system/`.
- Verification run: GitHub authentication and repository creation succeeded.
- Follow-up needed: Complete RED-GREEN pack builder, UI, build, Pages workflow, commit, and push.
- Handoff note: Do not write pack-builder production code before observing the first test fail.

### 2026-08-14 17:51

- Objective: Finish the website MVP and record the complete Loader contract Mini approved in conversation.
- What changed: Implemented the browser-local workshop, visible prompts, one-click GPT reference-image prompt, strict `8×12` spritesheet validation and preview, safe data-only pack export, responsive UI, tests, and Pages workflow. Recorded Loader requirements for existing SillyTavern API/model selection, editable/resettable per-character prompts, pet size/position/opacity, and separately adjustable animation/movement speeds.
- Files touched: `index.html`, `src/`, `tests/`, `public/`, `.github/workflows/pages.yml`, `README.md`, continuity files, and design-system files.
- Verification run: `npm test` — 4 files / 12 tests passed. `npm run build` passed. Desktop and mobile layout checked in Chrome with no horizontal overflow. Clipboard copy, strict image validation, and local preview passed.
- Investigation: Headless Chrome download events receive the full archive byte count but end as canceled. The same failure was reproduced with an unrelated minimal 1 MB Blob and no URL revocation, isolating it to this Chrome automation environment rather than the workshop. The app now retains generated object URLs for 60 seconds defensively.
- Follow-up needed: Commit/push, enable Pages, verify public URL, then start the shared Resident Loader distillation.
- Handoff note: Loader v1 promises are contractual; do not replace existing SillyTavern API selection with a new API-key form.

### 2026-08-14 17:56

- Objective: Publish website v0.1 and verify the public deployment.
- What changed: Renamed the default branch to `main`, committed website v0.1 as `53caadd`, pushed to GitHub, enabled Pages workflow deployment, and verified the public site.
- Verification run: GitHub Actions run `31790068216` passed tests, build, artifact upload, and Pages deployment. Public URL returned HTTP 200. A live mobile Puppeteer check confirmed prompt copy, 8×12/row-12 content, no console errors, and no horizontal overflow.
- Public site: `https://minijinai75.github.io/tavern-pet-workshop/`
- Repository: `https://github.com/Minijinai75/tavern-pet-workshop`
- Follow-up needed: Commit this final continuity update, then begin the shared Resident Loader distillation from the existing Jinghe Resident script.

### 2026-08-14 18:02

- Objective: Confirm whether conversation extras can use a user-selected number of recent SillyTavern messages.
- Evidence: Existing graph and source show `capture({ recentMessages })` in `src/adapters/sillytavern.mjs`, manifest-driven `context.recentMessages` in `src/core/context-provider.mjs`, context character budgeting in `src/core/context-planner.mjs`, and the shared context-aware pipeline for `letters`, `extras`, and `reviews` in `src/features/create-feature-definitions.mjs`.
- Decision recorded: Loader exposes recent-message count per character and per feature, with `0` to disable, context preview/estimate, and a second size budget to prevent oversized prompts.
- Follow-up needed: Include this control in Loader schema, settings UI, resolver tests, and migration rules.

### 2026-08-14 18:20

- Objective: Reduce the oversized hero title and automatically present a mobile-friendly operation layout.
- What changed: Added a `720px` match-media layout mode with a live mobile/desktop preview label; reduced desktop title to 60.48px at 1440px and mobile title to 37.05px at 390px; improved mobile spacing, safe areas, one-column form flow, 16px inputs, and 48px+ primary touch targets. Persisted the refreshed UI design system.
- TDD: Added `tests/layout-mode.test.ts`, observed the expected missing-module failure, then implemented `src/layout-mode.ts`; full suite now passes 15 tests.
- Verification run: Production build passed. Chrome QA at 390px reported `layout=mobile`, preview label「手機版」, zero horizontal overflow, 50.2px download button, 48px copy button, and no console errors. At 1440px it reported `layout=desktop`, preview label「桌面版」, 60.48px title, and zero overflow.
- Follow-up needed: Commit/push, wait for Pages deployment, verify the live URL, then begin Loader work.

### 2026-08-14 18:58

- Objective: Build the shared Resident Loader immediately after the responsive website, including Mini's added requirement that generated resident conversations never disappear from the same HTML panel.
- Contract gate: Distilled lifecycle, pack, character binding, current/profile API, Prompt/context, state ownership, SEND/GENERATE boundaries, rollback, and persistent history behavior into `docs/ResidentLoader_參考技術蒸餾契約_260814.md`; hybrid validator passed.
- What changed: Implemented a data-only ZIP importer, strict v1 manifest/PNG checks, IndexedDB pack/binding/settings/history repository, stable character/chat identity adapter, current API and existing Connection Profile generation, visible/editable/resettable daily/letter/story Prompts, recent-floor count/size/content preview, 8×12 sprite animation, persistent drag position, separate frame/movement speeds plus presets, responsive Loader panel, history copy/delete, ESM build, installable ZIP packaging, and website download CTA.
- Safety behavior: unknown executable files, unsafe ZIP paths, fake/wrong-size PNGs, unknown manifest fields, and unsupported grids are rejected before persistence. Loader has no SEND method and stores no API URL, Key, or Token.
- Verification: 11 files / 45 tests passed; website build passed; Loader build/package passed; SillyTavern extension validator passed 10/10 with 0 warnings. Repeated clean package runs produced the same SHA-256 `85d450783ad0b731a90838a9b8e8bfd8743f44a7a24a1cc00c50365c03e3e5b5`.
- Follow-up needed: Commit/push, verify Pages exposes the ZIP, then perform a real headed SillyTavern install/profile/generation/reload smoke check.
- Deployment: commit `f80bbd8` pushed; Pages run `31795059107` passed test, Loader package, site build, and deploy. Public page and ZIP returned HTTP 200; served ZIP was 50,502 bytes with SHA-256 `85d450783ad0b731a90838a9b8e8bfd8743f44a7a24a1cc00c50365c03e3e5b5`.
