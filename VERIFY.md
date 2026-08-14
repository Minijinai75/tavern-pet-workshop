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

## Unverified Areas

- A human click-through download in a normal headed browser after Pages deployment.

## Known Risks

- Future Resident Loader importer is not implemented in this repository yet.
- Public repository has no redistribution license until Mini chooses one.
- Headless Chrome in this Windows environment cancels all tested Blob downloads; automated native-file completion cannot be used as the final download oracle here.

## Recommended Next Verification

- Perform one normal-browser download click if a human browser session is available; begin Loader reference distillation.
