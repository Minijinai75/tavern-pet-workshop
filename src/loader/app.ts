import {
  buildFeaturePrompt,
  summarizeRecentConversation,
  type TavernChatMessage,
} from './context-builder';
import { importResidentPack, type ImportedResidentPack } from './pack-importer';
import { createLoaderPanel } from './panel';
import {
  openResidentRepository,
  type HistoryRecord,
  type ResidentRepository,
} from './repository';
import { normalizeLoaderSettings, type GenerationFeature, type LoaderSettings } from './settings';
import { SpriteResident } from './sprite-resident';
import {
  createGenerationAdapter,
  extractConnectionProfiles,
  getTavernIdentity,
  type TavernIdentity,
} from './st-adapter';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function defaultTavernContext(): unknown {
  const scope = globalThis as Record<string, unknown>;
  const tavern = scope.SillyTavern;
  if (isRecord(tavern) && typeof tavern.getContext === 'function') {
    return (tavern.getContext as () => unknown)();
  }
  try {
    const parent = globalThis.top as unknown as Record<string, unknown> | null;
    const parentTavern = parent?.SillyTavern;
    if (isRecord(parentTavern) && typeof parentTavern.getContext === 'function') {
      return (parentTavern.getContext as () => unknown)();
    }
    return parentTavern ?? tavern ?? null;
  } catch {
    return tavern ?? null;
  }
}

function numericValue(panel: HTMLElement, key: string, fallback: number): number {
  const value = panel.querySelector<HTMLInputElement>(`[data-setting="${key}"]`)?.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class ResidentLoaderApp {
  private repository?: ResidentRepository;
  private sprite?: SpriteResident;
  private launcher?: HTMLButtonElement;
  private panel?: HTMLElement;
  private identity: TavernIdentity | null = null;
  private activePack?: ImportedResidentPack;
  private settings: LoaderSettings = normalizeLoaderSettings({});
  private panelSelectedPackId = '';
  private readonly unsubscribers: Array<() => void> = [];
  private started = false;
  private readonly generation;

  constructor(private readonly getContext: () => unknown = defaultTavernContext) {
    this.generation = createGenerationAdapter({ getContext });
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.repository = await openResidentRepository();
    this.mountLauncher();
    this.subscribe('APP_READY');
    this.subscribe('CHAT_CHANGED');
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    await this.rebind();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.sprite?.destroy();
    this.sprite = undefined;
    this.panel?.remove();
    this.panel = undefined;
    this.launcher?.remove();
    this.launcher = undefined;
    this.repository?.close();
    this.repository = undefined;
  }

  async openPanel(): Promise<void> {
    const repository = this.requireRepository();
    const packs = await repository.listPacks();
    const binding = this.identity
      ? await repository.getBinding(this.identity.characterKey)
      : undefined;
    if (!this.panelSelectedPackId) {
      this.panelSelectedPackId = binding?.packId ?? packs[0]?.manifest.id ?? '';
    }

    const histories: Record<GenerationFeature, HistoryRecord[]> = { letters: [], stories: [] };
    if (this.identity) {
      histories.letters = await repository.listHistory({
        characterKey: this.identity.characterKey,
        chatKey: this.identity.chatKey,
        feature: 'letters',
      });
      histories.stories = await repository.listHistory({
        characterKey: this.identity.characterKey,
        chatKey: this.identity.chatKey,
        feature: 'stories',
      });
    }
    const currentContext = this.getContext();
    const chat = isRecord(currentContext) && Array.isArray(currentContext.chat)
      ? (currentContext.chat as TavernChatMessage[])
      : [];
    const contextSummaries = {
      letters: summarizeRecentConversation(
        chat,
        this.settings.features.letters.recentMessages,
        this.identity?.userName ?? 'USER',
        this.identity?.characterName ?? '角色',
      ),
      stories: summarizeRecentConversation(
        chat,
        this.settings.features.stories.recentMessages,
        this.identity?.userName ?? 'USER',
        this.identity?.characterName ?? '角色',
      ),
    };

    const nextPanel = createLoaderPanel({
      identity: this.identity,
      packs,
      selectedPackId: this.panelSelectedPackId,
      settings: this.settings,
      profiles: extractConnectionProfiles(this.getContext()),
      histories,
      contextSummaries,
    });
    this.panel?.remove();
    this.panel = nextPanel;
    document.body.append(nextPanel);
    this.wirePanel(nextPanel);
    nextPanel.querySelector<HTMLElement>('[data-action="close"]')?.focus();
  }

  private requireRepository(): ResidentRepository {
    if (!this.repository) throw new Error('Resident Loader 尚未完成啟動。');
    return this.repository;
  }

  private mountLauncher(): void {
    const launcher = document.createElement('button');
    launcher.id = 'resident-loader-launcher';
    launcher.type = 'button';
    launcher.textContent = '桌寵';
    launcher.setAttribute('aria-label', '打開 Resident Loader');
    launcher.addEventListener('click', () => void this.openPanel());
    document.body.append(launcher);
    this.launcher = launcher;
  }

  private subscribe(eventName: 'APP_READY' | 'CHAT_CHANGED'): void {
    const context = this.getContext();
    if (!isRecord(context) || !isRecord(context.eventSource)) return;
    const eventTypes = isRecord(context.eventTypes)
      ? context.eventTypes
      : isRecord(context.event_types)
        ? context.event_types
        : undefined;
    if (!eventTypes) return;
    const event = eventTypes[eventName];
    const source = context.eventSource;
    const on = typeof source.on === 'function' ? source.on : undefined;
    const off = typeof source.removeListener === 'function' ? source.removeListener : source.off;
    if (!on || typeof off !== 'function' || event === undefined) return;
    const handler = () => void this.rebind();
    (on as (event: unknown, handler: () => void) => void).call(source, event, handler);
    this.unsubscribers.push(() => {
      (off as (event: unknown, handler: () => void) => void).call(source, event, handler);
    });
  }

  private async rebind(): Promise<void> {
    const repository = this.requireRepository();
    this.identity = getTavernIdentity(this.getContext());
    this.sprite?.destroy();
    this.sprite = undefined;
    this.activePack = undefined;
    this.panelSelectedPackId = '';

    if (!this.identity) {
      if (this.panel) await this.openPanel();
      return;
    }
    this.settings = (await repository.getSettings(this.identity.characterKey)) ?? normalizeLoaderSettings({});
    const binding = await repository.getBinding(this.identity.characterKey);
    if (binding) this.activePack = await repository.getPack(binding.packId);
    if (this.activePack) this.mountSprite(this.activePack);
    if (this.panel) await this.openPanel();
  }

  private mountSprite(pack: ImportedResidentPack): void {
    if (!this.identity) return;
    this.sprite = new SpriteResident({
      pack,
      settings: this.settings,
      onOpen: () => void this.openPanel(),
      onPositionChange: (viewport, point) => {
        if (!this.identity) return;
        this.settings = normalizeLoaderSettings({
          ...this.settings,
          position: { ...this.settings.position, [viewport]: point },
        });
        void this.requireRepository().putSettings(this.identity.characterKey, this.settings);
      },
    });
  }

  private wirePanel(panel: HTMLElement): void {
    panel.querySelector<HTMLButtonElement>('[data-action="close"]')?.addEventListener('click', () => {
      panel.remove();
      if (this.panel === panel) this.panel = undefined;
    });

    panel.querySelector<HTMLInputElement>('[data-action="import"]')?.addEventListener('change', (event) => {
      void this.importPack(event.currentTarget as HTMLInputElement);
    });
    panel.querySelector<HTMLSelectElement>('[data-pack-select]')?.addEventListener('change', (event) => {
      this.panelSelectedPackId = (event.currentTarget as HTMLSelectElement).value;
      void this.openPanel();
    });
    panel.querySelector<HTMLButtonElement>('[data-action="bind"]')?.addEventListener('click', () => {
      void this.bindSelectedPack(panel);
    });
    panel.querySelector<HTMLButtonElement>('[data-action="save-settings"]')?.addEventListener('click', () => {
      void this.saveSettings(panel, true);
    });
    panel.querySelector<HTMLButtonElement>('[data-action="reset-position"]')?.addEventListener('click', () => {
      void this.resetPosition(panel);
    });

    for (const input of panel.querySelectorAll<HTMLInputElement>('input[type="range"][data-setting]')) {
      input.addEventListener('input', () => {
        const key = input.dataset.setting;
        const output = key ? panel.querySelector<HTMLOutputElement>(`[data-output="${key}"]`) : undefined;
        if (output) output.value = input.value;
      });
    }
    for (const preset of panel.querySelectorAll<HTMLButtonElement>('[data-motion-preset]')) {
      preset.addEventListener('click', () => this.applyMotionPreset(panel, preset.dataset.motionPreset));
    }
    panel
      .querySelector<HTMLButtonElement>('[data-action="reset-prompt:idle"]')
      ?.addEventListener('click', () => void this.resetPrompt('idle'));
    for (const feature of ['letters', 'stories'] as const) {
      panel
        .querySelector<HTMLInputElement>(`[data-recent="${feature}"]`)
        ?.addEventListener('input', () => this.updateContextPreview(panel, feature));
      panel
        .querySelector<HTMLButtonElement>(`[data-action="reset-prompt:${feature}"]`)
        ?.addEventListener('click', () => void this.resetPrompt(feature));
      panel
        .querySelector<HTMLButtonElement>(`[data-action="generate:${feature}"]`)
        ?.addEventListener('click', () => void this.generate(feature, panel));
    }
    for (const copy of panel.querySelectorAll<HTMLButtonElement>('[data-action="copy-history"]')) {
      copy.addEventListener('click', () => void this.copyHistory(copy));
    }
    for (const remove of panel.querySelectorAll<HTMLButtonElement>('[data-action="delete-history"]')) {
      remove.addEventListener('click', () => void this.deleteHistory(remove));
    }
  }

  private setStatus(message: string, kind: 'neutral' | 'success' | 'error' = 'neutral'): void {
    const status = this.panel?.querySelector<HTMLElement>('[data-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  }

  private async importPack(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    this.setStatus('正在檢查角色包…');
    try {
      const pack = await importResidentPack(await file.arrayBuffer());
      await this.requireRepository().putPack(pack);
      this.panelSelectedPackId = pack.manifest.id;
      await this.openPanel();
      this.setStatus(`已安全匯入「${pack.manifest.identity.displayName}」。`, 'success');
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : '角色包匯入失敗。', 'error');
      input.value = '';
    }
  }

  private async bindSelectedPack(panel: HTMLElement): Promise<void> {
    if (!this.identity) return this.setStatus('請先打開一個角色聊天。', 'error');
    const packId = panel.querySelector<HTMLSelectElement>('[data-pack-select]')?.value ?? '';
    if (!packId) return this.setStatus('請先匯入並選擇角色包。', 'error');
    try {
      await this.requireRepository().bindCharacter(
        { characterKey: this.identity.characterKey, displayName: this.identity.characterName },
        packId,
      );
      await this.rebind();
      this.setStatus(`已綁定目前角色「${this.identity.characterName}」。`, 'success');
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : '角色綁定失敗。', 'error');
    }
  }

  private settingsFromPanel(panel: HTMLElement): LoaderSettings {
    const features = { ...this.settings.features };
    for (const feature of ['letters', 'stories'] as const) {
      const prompt = panel.querySelector<HTMLTextAreaElement>(`[data-prompt="${feature}"]`)?.value ?? '';
      const packDefault = this.activePack?.manifest.prompts[feature] ?? '';
      const recentMessages = Number(
        panel.querySelector<HTMLInputElement>(`[data-recent="${feature}"]`)?.value,
      );
      const mode = panel.querySelector<HTMLSelectElement>(`[data-mode="${feature}"]`)?.value;
      const profileId = panel.querySelector<HTMLSelectElement>(`[data-profile="${feature}"]`)?.value ?? '';
      features[feature] = {
        promptOverride: prompt.trim() === packDefault.trim() ? '' : prompt,
        recentMessages,
        mode: mode === 'profile' ? 'profile' : 'current',
        profileId,
      };
    }
    const idlePrompt = panel.querySelector<HTMLTextAreaElement>('[data-prompt="idle"]')?.value ?? '';
    const idleDefault = this.activePack?.manifest.prompts.idle ?? '';
    return normalizeLoaderSettings({
      idlePromptOverride: idlePrompt.trim() === idleDefault.trim() ? '' : idlePrompt,
      appearance: {
        desktopSizePercent: numericValue(
          panel,
          'desktopSizePercent',
          this.settings.appearance.desktopSizePercent,
        ),
        mobileSizePercent: numericValue(
          panel,
          'mobileSizePercent',
          this.settings.appearance.mobileSizePercent,
        ),
        opacity: numericValue(panel, 'opacity', this.settings.appearance.opacity),
      },
      motion: {
        frameIntervalMs: numericValue(
          panel,
          'frameIntervalMs',
          this.settings.motion.frameIntervalMs,
        ),
        walkSpeedPxPerSec: numericValue(
          panel,
          'walkSpeedPxPerSec',
          this.settings.motion.walkSpeedPxPerSec,
        ),
      },
      position: this.settings.position,
      features,
    });
  }

  private applyMotionPreset(panel: HTMLElement, preset: string | undefined): void {
    const values = preset === 'slow'
      ? { frameIntervalMs: 220, walkSpeedPxPerSec: 35 }
      : preset === 'fast'
        ? { frameIntervalMs: 75, walkSpeedPxPerSec: 140 }
        : { frameIntervalMs: 125, walkSpeedPxPerSec: 72 };
    for (const [key, value] of Object.entries(values)) {
      const input = panel.querySelector<HTMLInputElement>(`[data-setting="${key}"]`);
      const output = panel.querySelector<HTMLOutputElement>(`[data-output="${key}"]`);
      if (input) input.value = String(value);
      if (output) output.value = String(value);
    }
  }

  private updateContextPreview(panel: HTMLElement, feature: GenerationFeature): void {
    if (!this.identity) return;
    const context = this.getContext();
    const chat = isRecord(context) && Array.isArray(context.chat)
      ? (context.chat as TavernChatMessage[])
      : [];
    const recentMessages = Number(
      panel.querySelector<HTMLInputElement>(`[data-recent="${feature}"]`)?.value,
    );
    const summary = summarizeRecentConversation(
      chat,
      recentMessages,
      this.identity.userName,
      this.identity.characterName,
    );
    const label = panel.querySelector<HTMLElement>(`[data-context-label="${feature}"]`);
    const preview = panel.querySelector<HTMLElement>(`[data-context-preview="${feature}"]`);
    if (label) label.textContent = `${summary.messageCount} 樓 · 約 ${summary.characterCount} 字（點開預覽）`;
    if (preview) preview.textContent = summary.preview || '這個功能目前不會帶入最近對話。';
  }

  private async saveSettings(panel: HTMLElement, rerender: boolean): Promise<void> {
    if (!this.identity) return this.setStatus('請先打開一個角色聊天。', 'error');
    this.settings = await this.requireRepository().putSettings(
      this.identity.characterKey,
      this.settingsFromPanel(panel),
    );
    this.sprite?.destroy();
    this.sprite = undefined;
    if (this.activePack) this.mountSprite(this.activePack);
    if (rerender) {
      await this.openPanel();
      this.setStatus('Prompt、樓數、連線與桌寵外觀已保存。', 'success');
    }
  }

  private async resetPosition(panel: HTMLElement): Promise<void> {
    if (!this.identity) return;
    this.settings = normalizeLoaderSettings({
      ...this.settingsFromPanel(panel),
      position: {
        ...this.settings.position,
        [window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop']: {
          x: null,
          y: null,
        },
      },
    });
    await this.requireRepository().putSettings(this.identity.characterKey, this.settings);
    this.sprite?.destroy();
    if (this.activePack) this.mountSprite(this.activePack);
    this.setStatus('桌寵已回到右下角。', 'success');
  }

  private async resetPrompt(feature: GenerationFeature | 'idle'): Promise<void> {
    if (!this.identity) return;
    this.settings = feature === 'idle'
      ? normalizeLoaderSettings({ ...this.settings, idlePromptOverride: '' })
      : normalizeLoaderSettings({
          ...this.settings,
          features: {
            ...this.settings.features,
            [feature]: { ...this.settings.features[feature], promptOverride: '' },
          },
        });
    await this.requireRepository().putSettings(this.identity.characterKey, this.settings);
    await this.openPanel();
    this.setStatus('已恢復角色包預設 Prompt。', 'success');
  }

  private async generate(feature: GenerationFeature, panel: HTMLElement): Promise<void> {
    if (!this.identity || !this.activePack) return;
    this.setStatus('正在請酒館生成，結果不會新增聊天樓層…');
    try {
      await this.saveSettings(panel, false);
      const featureSettings = this.settings.features[feature];
      const context = this.getContext();
      const chat = isRecord(context) && Array.isArray(context.chat)
        ? (context.chat as TavernChatMessage[])
        : [];
      const prompt = buildFeaturePrompt({
        packPrompt: this.activePack.manifest.prompts[feature],
        promptOverride: featureSettings.promptOverride,
        recentMessages: featureSettings.recentMessages,
        chat,
        userName: this.identity.userName,
        characterName: this.identity.characterName,
      });
      const result = await this.generation.generateText({
        mode: featureSettings.mode,
        profileId: featureSettings.profileId,
        prompt,
        maxChatHistory: featureSettings.recentMessages,
      });
      await this.requireRepository().addHistory({
        characterKey: this.identity.characterKey,
        chatKey: this.identity.chatKey,
        feature,
        content: result.text,
        prompt: featureSettings.promptOverride || this.activePack.manifest.prompts[feature],
        apiSource: result.source,
      });
      await this.openPanel();
      this.setStatus('生成完成，已保存在下方歷史紀錄。', 'success');
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : '生成失敗，沒有寫入空紀錄。', 'error');
    }
  }

  private async copyHistory(button: HTMLButtonElement): Promise<void> {
    const content = button.closest<HTMLElement>('[data-history-id]')?.querySelector<HTMLElement>(
      '.resident-loader-record-content',
    )?.textContent;
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      this.setStatus('紀錄已複製。', 'success');
    } catch {
      this.setStatus('瀏覽器沒有開放剪貼簿，請手動選取內容。', 'error');
    }
  }

  private async deleteHistory(button: HTMLButtonElement): Promise<void> {
    const id = Number(button.dataset.historyId);
    if (!Number.isInteger(id)) return;
    if (!window.confirm('只刪除這一筆桌寵生成紀錄？這不會刪除角色包或聊天樓層。')) return;
    await this.requireRepository().deleteHistory(id);
    await this.openPanel();
    this.setStatus('已刪除指定紀錄。', 'success');
  }

  private readonly handleBeforeUnload = (): void => {
    this.stop();
  };
}
