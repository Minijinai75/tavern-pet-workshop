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

## Unverified Areas

- A human click-through download in a normal headed browser after Pages deployment.
- A real SillyTavern install smoke for Connection Profile generation, drag persistence, chat switching, and history reload.

## Known Risks

- Public repository has no redistribution license until Mini chooses one.
- Headless Chrome in this Windows environment cancels all tested Blob downloads; automated native-file completion cannot be used as the final download oracle here.
- Loader v0.1.0 has automated contract/build coverage but has not yet been exercised inside a real headed SillyTavern runtime.

## Recommended Next Verification

- Verify the Pages ZIP URL after deployment, then install v0.1.0 into a real SillyTavern and exercise import → bind → generate → close/reopen panel → reload.
