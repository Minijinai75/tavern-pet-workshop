# Verification

## Validation Rules

- Record commands actually run and their important results.
- Record skipped checks explicitly.

## Commands And Results

### 2026-08-14

| Command | Purpose | Result | Notes |
|---|---|---|---|
| `gh auth status` | Confirm GitHub authority | PASS | Active account `Minijinai75`; repo/workflow scopes present |
| `gh repo create Minijinai75/tavern-pet-workshop --public --clone` | Create and clone repository | PASS | Remote URL created successfully |
| UI/UX design-system search with `--persist` | Establish UI source of truth | PASS | `design-system/桌寵工坊/MASTER.md` created |
| `npm test` | Verify pack schema, validation, GPT prompt, and download URL lifetime | PASS | 4 test files, 12 tests passed |
| `npm run build` | Type-check and create production bundle | PASS | Vite 7.3.6 build completed; JS bundle 106.84 kB before gzip |
| Chrome desktop/mobile screenshots | Responsive visual QA | PASS | 1440 px and 390 px viewports checked; mobile `scrollWidth === clientWidth`; no horizontal overflow |
| Puppeteer clipboard/upload/preview flow | Exercise main browser workflow | PASS | One-click status updated; prompt contains `8欄×12列` and `第12排`; valid source PNG accepted; preview visible; no console errors |
| Puppeteer generated archive inspection + unit ZIP inspection | Verify export is built locally | PASS | UI reached success; builder tests confirm only manifest, metadata, and PNG are included |
| Headless Chrome native download control | Distinguish app bug from QA environment | ENV LIMITATION | Chrome received the complete archive byte count but reported cancellation. A separate 1 MB minimal Blob download with no URL revocation also canceled, so this is not specific to the workshop code. Object URLs are retained for 60 seconds as a defensive measure. |
| GitHub Actions run `31790068216` | CI test, build, and Pages deploy | PASS | Build and deploy jobs completed successfully |
| `Invoke-WebRequest https://minijinai75.github.io/tavern-pet-workshop/` | Confirm public availability | PASS | HTTP 200; expected title and copy button present |
| Puppeteer against public Pages URL | Confirm deployed JS/CSS and mobile behavior | PASS | One-click copy worked; generated prompt contains grid and row-12 contract; no console errors; no horizontal overflow at 390 px |
| `npm test` after responsive update | Verify mobile/desktop mode behavior and regressions | PASS | 5 test files, 15 tests passed |
| `npm run build` after responsive update | Type-check and bundle v0.2 | PASS | Vite production build completed |
| Chrome 390px responsive QA | Verify actual mobile operation mode | PASS | `layout=mobile`,「手機版」label, 37.05px title, 16px input text, 48px+ primary actions, zero overflow, no console errors |
| Chrome 1440px responsive QA | Verify reduced title and desktop layout | PASS | `layout=desktop`,「桌面版」label, 60.48px title, zero overflow |
| Resident Loader distillation validator (`--route hybrid`) | Enforce evidence/behavior contract before implementation | PASS | Ten sections complete; product flow, state owners, boundaries, rollback, mappings recorded |
| `npm test` after Loader v0.1.0 | Verify workshop and Loader security, settings, context preview, profiles, history, sprite grid, and panel | PASS | 11 test files, 45 tests passed |
| `npm run build` | Type-check and build updated website with Loader download CTA | PASS | Vite production build completed |
| `npm run package:loader` twice | Type-check, bundle, and create a reproducible extension package | PASS | Both runs produced `resident-loader-v0.1.0.zip`, 50,502 bytes; SHA-256 `85d450783ad0b731a90838a9b8e8bfd8743f44a7a24a1cc00c50365c03e3e5b5` |
| `validate-extension.js resident-loader` | Validate SillyTavern manifest, JS/CSS and lifecycle exports | PASS | 10 passed / 0 warnings / 0 failures |
| GitHub Actions run `31795059107` | CI test, reproducible Loader packaging, site build, and Pages deployment | PASS | Build and deploy jobs completed successfully |
| Public page and Loader ZIP requests | Verify the deployed CTA and downloadable artifact | PASS | Page HTTP 200 with Loader link; ZIP HTTP 200, `application/x-zip-compressed`, 50,502 bytes, SHA-256 matched local package |
| Website copy-install RED test | Prove repo URL copy behavior was absent before implementation | EXPECTED FAIL | Missing `src/loader-install.ts` |
| `npm test` after repository split | Verify the focused workshop suite | PASS | 6 files / 16 tests passed |
| `npm run build` after repository split | Verify the static website without Loader build ownership | PASS | Vite production build completed; page contains repo install and offline release entry points |
| Independent Loader source SHA-256 comparison | Prove migration copied the complete core before cleanup | PASS | All 10 `src/loader/*.ts` files matched |
| Independent Loader `npm test` / build / topology test | Verify migrated behavior and direct-install root | PASS | 6 files / 30 tests; root manifest and dist test passed |
| Independent Loader package twice | Verify deterministic offline fallback | PASS | SHA-256 `bdb512c679f356e3b3b528ff49dc1fe470e399f656918c5abf4e0458c237bfd5` both times |
| Independent Loader extension validator | Validate direct SillyTavern installation contract | PASS | 10 passed / 0 warnings / 0 failures |
| Independent Loader GitHub Actions run `31799793600` | Verify the published extension repository | PASS | Tests, build, committed-dist drift check, and package completed |
| Workshop Pages run `31799989399` | Deploy the repository-install UI | PASS | Build and deploy jobs completed |
| Public workshop and v0.1.1 release requests | Verify live user entry points and artifact integrity | PASS | Site HTTP 200 with repo URL/copy button/release link; ZIP HTTP 200, 50,600 bytes, SHA-256 matched |
| `npm test` after 96-frame calibrator | Verify atlas analysis and existing workshop behavior | PASS | 7 files / 19 tests |
| `npm run build` after calibrator UI | Type-check and bundle static Pages site | PASS | Vite production build completed |
| Playwright/Chrome with real `睿.png` | Verify uploaded preview, 96-cell warnings, recomposition, and responsive layout | PASS | mascot `display:none`; 96 unsafe → 0 after auto-fit; zero console errors and zero horizontal overflow at 1440px/390px |
| `npm test` / `npm run build` before v0.2.1 link release | Verify website behavior and production bundle | PASS | 7 files / 19 tests; Vite production build completed |
| GitHub Pages run `31806001648` and public page request | Deploy and verify v0.2.1 handoff | PASS | Run completed; public page shows【酒館桌寵】and the v0.2.1 release asset link |
| Cross-boundary crop RED/GREEN tests | Prove a frame can sample outside its old fixed cell | PASS | 2 new tests; suite now 7 files / 21 tests |
| Headed Chrome/CDP with real `睿.png` | Verify full-atlas source recrop controls | PASS | 96 cells; crop 128→160; source offsets -18/+12; editor canvas hash changed `1856235845`→`2822728570` |
| GitHub Pages run `31807400771` and public-page request | Publish cross-boundary crop fix | PASS | Commit `4c6c957`; live page HTTP 200 and contains full-atlas crop controls, recovery button, and edge limitation warning |
| Row-alignment RED/GREEN tests | Keep each animation row visually stable without losing horizontal motion | PASS | New helpers return the selected row's 8 frames and copy crop-size/Y plus output-scale/Y while preserving source/output X; full suite 7 files / 23 tests |
| Production build and headed Chrome row-control check | Verify the new workflow compiles and renders | PASS | Vite build passed; Chrome showed「同一橫排一起對齊」and the dynamic「套用目前大小與上下到第 1 排」button |
| Pages run `31810079759` | Publish row-level calibration | PASS | Commit `84ddc60`; deployment completed successfully |
| Loader v0.3.0 CI/release | Verify new compact entry, pages, TXT, binding, and world-info selection handoff | PASS | Loader CI `31811764567`; release published with final ZIP SHA-256 `0c48e383118160b64728c2abc81f2406d7b85301d08bc611c6dffffdc2f17e90` |
| Automatic row-detection TDD | Detect uneven X spacing without trusting old 128px columns | PASS | Synthetic 12-row atlas detected 8 roles per row, preserved detached props, used one scale per row, and reconstructed all content inside the 8px margin |
| Full workshop suite after automatic alignment | Verify prompt, page control, calibrator, and prior behavior | PASS | 8 files / 26 tests |
| Production build after automatic alignment | Type-check and bundle the new workflow | PASS | Vite build completed successfully |
| Headed Chrome with Jiangnan source atlas | Verify the real uneven-spacing case | PASS | One click reported 12 rows / 96 cells and changed unsafe count 96 → 0 |
| Chrome mobile QA at 390×844 | Verify the new action/report do not break phone layout | PASS | `scrollWidth=390`, button 298×50.2px, report 298px wide, and unsafe count remained 0 |
| Loader v0.3.1 CI/release/public artifact | Verify redesigned letter/story reading-page handoff | PASS | CI `31816357745`; public manifest v0.3.1; ZIP 59,435 bytes and SHA-256 `e1c6a804df98e6ed1d043067595d92ebb7fecff3af3d182a6c3304ec3cce4df3` |
| Live frame-safety RED/GREEN tests | Prevent stale red borders after a visual adjustment | PASS | Exact 128×128 inspection reports overflow edges, ignores alpha `<=16`, exposes live status, and uses whole-sheet regeneration wording |
| Chrome live editor check at 390×844 | Verify the border/status changes before Apply | PASS | Real source changed live state from unsafe「右側、下方」to safe immediately after scale input; document had no horizontal overflow |

## Unverified Areas

- A human click-through download in a normal headed browser after Pages deployment.
- A real SillyTavern install smoke for Connection Profile generation, drag persistence, chat switching, and history reload.

## Known Risks

- Public repository has no redistribution license until Mini chooses one.
- Headless Chrome in this Windows environment cancels all tested Blob downloads; automated native-file completion cannot be used as the final download oracle here.
- Loader v0.1.0 has automated contract/build coverage but has not yet been exercised inside a real headed SillyTavern runtime.

## Recommended Next Verification

- Verify the Pages ZIP URL after deployment, then install v0.1.0 into a real SillyTavern and exercise import → bind → generate → close/reopen panel → reload.
