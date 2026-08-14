# Project Status

## Snapshot

- Project: 桌寵工坊 / Tavern Pet Workshop
- Active task: 發布手機操作版後開始共用 Resident Loader
- Current phase: website v0.2 ready to deploy
- Overall status: in progress
- Last updated: 2026-08-14 18:20 Asia/Taipei

## Current Goal

- Goal: 使用者能在不登入、不上傳資料的情況下，用圖片與表單製作安全的 `.jrpack.zip`。
- Success criteria: 本機預覽可用、匯出包結構通過測試、網站可建置、GitHub Pages 可部署。
- Why it matters: 讓不會寫 JSON 或 JavaScript 的使用者也能製作 SillyTavern 桌寵角色包。

## Completed So Far

- GitHub public repository created at `Minijinai75/tavern-pet-workshop`.
- Product direction confirmed: one shared Resident Loader, data-only character packs.
- Privacy direction confirmed: no accounts; image, character data, and prompts remain in the browser.
- Design system generated and persisted under `design-system/桌寵工坊/`.
- Website UI, browser-local spritesheet preview, visible/editable prompts, one-click GPT image prompt, and `.jrpack.zip` builder implemented.
- Exact `1024×1536`, `8×12`, `128×128` atlas validation implemented.
- Loader v1 requirements confirmed and recorded: existing SillyTavern API/model selection, per-character prompt overrides, size/position/opacity, separate animation and movement speeds.
- Unit suite: 12 tests passing. Production build passes.
- Public GitHub Pages site deployed and verified at `https://minijinai75.github.io/tavern-pet-workshop/`.
- Responsive v0.2 implemented: explicit mobile/desktop mode detection, smaller hero title, mobile touch/layout refinements, and responsive preview label.

## Files Completed Or Meaningfully Updated

- Continuity files and project rules.
- Design-system record, Vite application, pack builder, tests, README, and Pages workflow.

## Current Blockers

- None. Headless Chrome's native download cancellation was isolated to the QA environment by reproducing it with an unrelated minimal Blob download; app generation and archive contents pass tests.

## Next Recommended Step

- Deploy website v0.2, verify the public mobile view, then distill and implement the shared Resident Loader.

## Resume Here

Start by:

1. Reading `DECISIONS.md`.
2. Checking the latest `TASK_LOG.md` entry.
3. Working on the "Next Recommended Step" above.
4. Begin the shared Loader from the recorded v1 contract; do not add a new API-key form.
