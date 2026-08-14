# Project Status

## Snapshot

- Project: 桌寵工坊 / Tavern Pet Workshop
- Active task: 自動辨識每排 8 個角色並重建不切人的 96 格圖集
- Current phase: 元件優先自動對齊、即時紅綠安全框、GPT 圖片指令強化與 Loader v0.3.1 連結已完成本機驗證
- Overall status: implementation complete; waiting for commit, Pages deployment, and public verification
- Last updated: 2026-08-14 23:52 Asia/Taipei

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
- Workshop offline-download links now target Loader v0.2.2, whose extension entry uses SillyTavern's native collapsible drawer and loads settings on expansion.
- 96 格校正器可把目前影格的取景範圍、原圖上下、輸出大小與格內上下套用到同一橫排 8 格，同時保留每格各自的左右取景與左右位置；此流程貼合 GPT 通常在橫排內對齊動畫的輸出特性。
- Website offline fallback now targets【酒館桌寵】v0.3.0: compact extension entry, standalone settings/diary/board HTML views, TXT export, character-card switching, and read-only per-feature always-on world-info selection.
- One-click automatic atlas reconstruction now finds eight separable character groups in each 128px-high row, assigns nearby detached props, applies one shared row scale and baseline, and writes all 96 roles back into exact safe cells.
- The GPT image prompt now prioritizes complete, separated left-to-right character groups over forcing an early fixed horizontal crop; it requests transparent gaps so the workshop can rebuild exact 128×128 cells.
- Manual frame preview now recomputes the exact 128×128 output on every drag/slider input, turns the 8px frame red/green immediately, and names the overflowing sides. Alpha at or below 16/255 is treated as imperceptible fringe rather than visible sprite content.
- Website offline fallback now targets【酒館桌寵】v0.3.1, whose letters use a date-rail paper layout and whose conversation extras use four muted pastel message-card tones.

## Files Completed Or Meaningfully Updated

- Continuity files, project rules, design system, Vite workshop, pack builder, Loader source/build/package scripts, security/context/persistence tests, README, and Pages workflow.

## Current Blockers

- No publishing blocker. Automatic detection intentionally stops without changing the image if a row cannot be separated into exactly eight character groups. A real SillyTavern repo-install smoke remains.

## Next Recommended Step

- Publish the automatic alignment update, verify the public v0.3.1 link and prompt text, then run Mini's in-Tavern update smoke.

## Resume Here

Start by:

1. Reading `DECISIONS.md`.
2. Checking the latest `TASK_LOG.md` entry.
3. Work on the "Next Recommended Step" above.
4. Do not add an API-key form or make generated history session-only; both are settled requirements.
