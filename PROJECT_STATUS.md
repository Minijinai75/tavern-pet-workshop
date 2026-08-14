# Project Status

## Snapshot

- Project: 桌寵工坊 / Tavern Pet Workshop
- Active task: 發布 96 格校正工具與【酒館桌寵】v0.2.0 安裝入口
- Current phase: 本機實作、完整測試與睿圖瀏覽器 QA 已通過
- Overall status: in progress
- Last updated: 2026-08-14 21:24 Asia/Taipei

## Current Goal

- Goal: 使用者能製作安全 `.jrpack.zip`，並用只安裝一次的共用 Loader 匯入、綁定角色、調整生成與保存歷史。
- Success criteria: 工坊與 Loader 都可建置；壞包被拒；API 不重填 Key；Prompt／樓數／速度可調；生成歷史重開仍在；網站可下載安裝包。
- Why it matters: 讓不會寫 JSON 或 JavaScript 的使用者也能製作 SillyTavern 桌寵角色包。

## Completed So Far

- GitHub public repository created at `Minijinai75/tavern-pet-workshop`.
- Product direction confirmed: one shared Resident Loader, data-only character packs.
- Privacy direction confirmed: no accounts; image, character data, and prompts remain in the browser.
- Design system generated and persisted under `design-system/桌寵工坊/`.
- Website UI, browser-local spritesheet preview, visible/editable prompts, one-click GPT image prompt, and `.jrpack.zip` builder implemented.
- Exact `1024×1536`, `8×12`, `128×128` atlas validation implemented.
- Loader v1 requirements confirmed and recorded: existing SillyTavern API/model selection, per-character prompt overrides, size/position/opacity, separate animation and movement speeds.
- Website v0.1 baseline completed with its original 12-test suite and production build.
- Public GitHub Pages site deployed and verified at `https://minijinai75.github.io/tavern-pet-workshop/`.
- Responsive v0.2 implemented: explicit mobile/desktop mode detection, smaller hero title, mobile touch/layout refinements, and responsive preview label.
- Resident Loader hybrid distillation contract completed and validator passed under `docs/ResidentLoader_參考技術蒸餾契約_260814.md`.
- Resident Loader v0.1.0 implemented: safe ZIP importer, IndexedDB pack/binding/settings/history repository, current API and existing Connection Profile adapter, visible daily/letter/story Prompts, per-feature recent-floor count/size/content preview, 8×12 sprite runtime, persistent drag position, independent animation/movement speeds with presets, and mobile-first same-HTML control/history panel.
- Installable ZIP built at `public/downloads/resident-loader-v0.1.0.zip`; website download CTA and installation README added.
- Dedicated public Loader repository published at `https://github.com/Minijinai75/resident-loader`; its root contains the manifest and committed dist files required for SillyTavern repo-URL installation.
- Loader v0.1.1 offline release published at `https://github.com/Minijinai75/resident-loader/releases/tag/v0.1.1`.
- Workshop now exposes and copies the repo installation URL; Loader source, six test suites, build, and packaging ownership moved out of this website repository.
- GitHub Pages deployment `31795059107` passed; public website and Loader ZIP both return HTTP 200, and the served ZIP matches the reproducible local SHA-256.
- Full unit suite: 11 files / 45 tests passing. Website build, Loader build, deterministic package step, and SillyTavern extension validator all pass.
- Browser-local 96-frame alpha safety inspection, per-frame drag/scale editor, one-click unsafe-frame fit, and exact Canvas PNG recomposition implemented.
- Real `睿.png` browser QA passed: 96 warnings before correction, 0 after; uploaded preview hides the pink mascot; desktop/mobile have no horizontal overflow.
- Loader v0.2.1 uses the user-facing name【酒館桌寵】, lives in the extensions drawer, splits pet-click letter/story archives, and makes daily Prompt manual generation operational without enabling automatic calls.
- Sprite correction now re-crops from the full original atlas: each frame can cross the old 128×128 boundary with an adjustable source window and source offsets before output placement.

## Files Completed Or Meaningfully Updated

- Continuity files, project rules, design system, Vite workshop, pack builder, Loader source/build/package scripts, security/context/persistence tests, README, and Pages workflow.

## Current Blockers

- No publishing blocker. A real SillyTavern repo-install smoke remains.

## Next Recommended Step

- Run a real SillyTavern update smoke against the published v0.2.1 release.

## Resume Here

Start by:

1. Reading `DECISIONS.md`.
2. Checking the latest `TASK_LOG.md` entry.
3. Work on the "Next Recommended Step" above.
4. Do not add an API-key form or make generated history session-only; both are settled requirements.
