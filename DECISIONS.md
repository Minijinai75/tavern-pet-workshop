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

### 2026-08-14 - Per-feature conversation context controls

- Status: confirmed by Mini
- Decision: Text features such as conversation extras may use recent SillyTavern chat as generation context, and the user may choose how many recent messages each feature receives.
- Existing evidence: The resident adapter already supports `capture({ recentMessages })`; the context provider reads `manifest.context.recentMessages`; and `letters`, `extras`, and `reviews` currently share the context-aware text generation pipeline.
- Loader UI: explain that one「樓」means one chat message; allow a recent-message count with `0` meaning disabled; show an estimated context size and a preview of what will be sent.
- Safety: combine message count with a character/token budget so unusually long messages cannot silently overflow the generation context. Never include hidden reasoning, API keys, or unrelated chats.
- Scope: User overrides should be saved per character and per text feature, so conversation extras may use a different context window from letters or reviews.
- Revisit when: SillyTavern changes its chat-message structure or exposes a reliable token estimator.

### 2026-08-14 - Automatic mobile operation mode

- Status: confirmed by Mini
- Decision: The workshop automatically switches at a `720px` viewport breakpoint instead of asking users to choose a device mode.
- Mobile behavior: smaller hero title, one-column workflow, 16px form text to avoid mobile browser zoom, at least 44px touch targets, full-width primary actions, compact cards/preview, safe-area bottom padding, and a visible「手機版」preview label.
- Desktop behavior: retain the two-column builder/preview layout while reducing the hero title from the original oversized treatment.
- Accessibility: responsive mode must preserve keyboard focus, readable contrast, reduced-motion behavior, and no horizontal scrolling.
- Revisit when: Device testing shows that a different breakpoint better matches the form layout.

### 2026-08-14 - Persistent same-panel generation history

- Status: confirmed by Mini
- Decision: Letters, conversation extras, and other generated resident text remain visible in the same Resident Loader HTML panel after closing the panel or reloading SillyTavern.
- Storage: local IndexedDB, partitioned by stable character key, current chat id, and feature. Results are not inserted into SillyTavern chat messages.
- User control: each record can be copied or explicitly deleted; cancellation performs no write, and deleting history never deletes a pack or chat floor.
- Failure behavior: generation failure stores no blank record; persistence failure must report that the current result was not saved.
- Revisit when: Mini requests export/import, search, retention limits, or cross-device sync.

## Preserved Exceptions

### 2026-08-14 - No open-source license selected yet

- Status: preserved on purpose
- What looks odd: The repository is public but has no license file.
- Why it was kept: Public visibility does not authorize choosing a redistribution license on Mini's behalf.
- Do not "clean this up" unless: Mini selects or approves a license.
- Affected files: repository root

## Open Questions

- None at this checkpoint.
