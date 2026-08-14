# Decisions

## Confirmed Decisions

### 2026-08-14 - Shared loader and data-only packs

- Status: confirmed by Mini
- Decision: Users install one shared Resident Loader; the website exports `.jrpack.zip` data packs rather than complete extensions or arbitrary JavaScript.
- Why: Easier upgrades, safer imports, and simpler authoring.
- Scope: Pack schema, website export, future Loader import.
- Revisit when: A SillyTavern platform constraint makes data-only packs impossible.

### 2026-08-14 - Browser-local privacy model

- Status: confirmed by Mini
- Decision: No account, backend, telemetry, or remote upload in v1. Images, character data, and prompts stay in the user's browser.
- Why: Privacy, low hosting complexity, and transparent behavior.
- Scope: Entire website and GitHub Pages deployment.
- Revisit when: Mini explicitly requests optional cloud features.

### 2026-08-14 - Separate public GitHub website repository

- Status: confirmed by Mini
- Decision: Build the website in `Minijinai75/tavern-pet-workshop`, separate from the reference-distillation project, and publish it with GitHub Pages.
- Why: Clear public product boundary and simple static hosting.
- Scope: Repository and deployment topology.
- Revisit when: Loader packaging requires a separate repository.

### 2026-08-14 - GPT reference-image spritesheet workflow

- Status: confirmed by Mini
- Decision: The website exposes a one-click-copy image prompt. The user uploads a character reference image to GPT, pastes the prompt, receives one transparent `1024×1536` PNG arranged as `8×12` frames (`128×128` each), then uploads that file to the workshop.
- Required behavior: The prompt and the resulting character prompts are visible to the user. The image prompt preserves the exact grid, transparent margin, no-cross-cell, consistency, and 12-row animation requirements supplied by Mini.
- Why: Users should not have to manually draw, crop, or edit JSON, and remote users should not need to paste the long prompt in pieces.
- Scope: Website prompt generator, validation, preview, and pack schema.
- Revisit when: A future generator can guarantee the same atlas contract through a direct image API.

### 2026-08-14 - Resident Loader v1 settings contract

- Status: confirmed by Mini
- Decision: The shared Resident Loader is the next project phase after the website. Users install it once, then import and switch data-only character packs.
- Character settings: pet size, screen position, opacity, animation playback speed, movement speed, and active character.
- Speed UI: simple slow/normal/fast presets plus fine sliders; animation speed and movement speed are separate; settings persist per character and can be restored to pack defaults.
- Prompt settings: daily-companion, letter, story, and other supported prompts remain visible and editable; local user overrides never overwrite the original pack defaults and can be reset.
- API behavior: do not ask users to re-enter an API key. Transplant the existing Jinghe Resident script's integration so the Loader can follow the current SillyTavern API/model or select from APIs/models already configured in SillyTavern. Selection may persist per character.
- Safety: imported packs remain data-only and may not execute arbitrary JavaScript.
- Scope: Loader technical distillation, settings UI, persistence, and pack importer.
- Revisit when: SillyTavern changes the APIs exposed to extensions or a platform limitation prevents enumerating existing connections.

## Preserved Exceptions

### 2026-08-14 - No open-source license selected yet

- Status: preserved on purpose
- What looks odd: The repository is public but has no license file.
- Why it was kept: Public visibility does not authorize choosing a redistribution license on Mini's behalf.
- Do not "clean this up" unless: Mini selects or approves a license.
- Affected files: repository root

## Open Questions

- None at this checkpoint.
