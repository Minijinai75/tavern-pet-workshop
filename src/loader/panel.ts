import type { ImportedResidentPack } from './pack-importer';
import type { HistoryRecord } from './repository';
import type { LoaderSettings, GenerationFeature } from './settings';
import type { ConnectionProfileSummary, TavernIdentity } from './st-adapter';
import type { ConversationSummary } from './context-builder';

export interface LoaderPanelModel {
  identity: TavernIdentity | null;
  packs: ImportedResidentPack[];
  selectedPackId: string;
  settings: LoaderSettings;
  profiles: ConnectionProfileSummary[];
  histories: Record<GenerationFeature, HistoryRecord[]>;
  contextSummaries: Record<GenerationFeature, ConversationSummary>;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, action: string): HTMLButtonElement {
  const node = element('button', 'resident-loader-button', label);
  node.type = 'button';
  node.dataset.action = action;
  return node;
}

function field(label: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = element('label', 'resident-loader-field');
  wrapper.append(element('span', '', label), control);
  return wrapper;
}

function rangeControl(
  label: string,
  key: string,
  value: number,
  minimum: number,
  maximum: number,
  step = 1,
): HTMLLabelElement {
  const input = element('input');
  input.type = 'range';
  input.min = String(minimum);
  input.max = String(maximum);
  input.step = String(step);
  input.value = String(value);
  input.dataset.setting = key;
  const output = element('output', '', String(value));
  output.dataset.output = key;
  const wrapper = field(label, input);
  wrapper.append(output);
  return wrapper;
}

function packSelector(model: LoaderPanelModel): HTMLElement {
  const section = element('section', 'resident-loader-section');
  section.append(element('h3', '', '角色包與綁定'));

  const importInput = element('input');
  importInput.type = 'file';
  importInput.accept = '.zip,application/zip';
  importInput.dataset.action = 'import';
  section.append(field('匯入 .jrpack.zip', importInput));

  const select = element('select');
  select.dataset.packSelect = 'true';
  if (model.packs.length === 0) {
    const option = element('option', '', '還沒有角色包');
    option.value = '';
    select.append(option);
  } else {
    for (const pack of model.packs) {
      const option = element('option', '', pack.manifest.identity.displayName);
      option.value = pack.manifest.id;
      option.selected = pack.manifest.id === model.selectedPackId;
      select.append(option);
    }
  }
  section.append(field('已匯入的角色包', select));

  const bind = button('綁定目前角色', 'bind');
  bind.disabled = !model.identity || model.packs.length === 0;
  section.append(bind);
  return section;
}

function appearanceSection(settings: LoaderSettings): HTMLElement {
  const section = element('section', 'resident-loader-section');
  section.append(element('h3', '', '外觀與速度'));
  const presets = element('div', 'resident-loader-actions resident-loader-presets');
  for (const [key, label] of [
    ['slow', '慢'],
    ['normal', '正常'],
    ['fast', '快'],
  ] as const) {
    const preset = button(label, 'motion-preset');
    preset.dataset.motionPreset = key;
    presets.append(preset);
  }
  section.append(presets);
  const grid = element('div', 'resident-loader-grid');
  grid.append(
    rangeControl('桌機大小 %', 'desktopSizePercent', settings.appearance.desktopSizePercent, 60, 180),
    rangeControl('手機大小 %', 'mobileSizePercent', settings.appearance.mobileSizePercent, 60, 180),
    rangeControl('透明度', 'opacity', settings.appearance.opacity, 0.2, 1, 0.05),
    rangeControl('動畫間隔 ms', 'frameIntervalMs', settings.motion.frameIntervalMs, 50, 1000, 5),
    rangeControl('移動速度 px/s', 'walkSpeedPxPerSec', settings.motion.walkSpeedPxPerSec, 10, 500),
  );
  section.append(grid, button('儲存外觀與速度', 'save-settings'), button('重設桌寵位置', 'reset-position'));
  return section;
}

function idlePromptSection(
  settings: LoaderSettings,
  pack: ImportedResidentPack | undefined,
): HTMLElement {
  const section = element('section', 'resident-loader-section');
  section.append(element('h3', '', '日常陪伴 Prompt'));
  const prompt = element('textarea');
  prompt.rows = 5;
  prompt.maxLength = 8_000;
  prompt.dataset.prompt = 'idle';
  const packPrompt = pack?.manifest.prompts.idle ?? '';
  prompt.value = settings.idlePromptOverride || packPrompt;
  prompt.placeholder = packPrompt || '先匯入並綁定角色包。';
  section.append(
    field('可見、可自行修改的日常 Prompt', prompt),
    button('恢復角色包預設 Prompt', 'reset-prompt:idle'),
  );
  return section;
}

function featureSection(
  feature: GenerationFeature,
  model: LoaderPanelModel,
  pack: ImportedResidentPack | undefined,
): HTMLElement {
  const featureSettings = model.settings.features[feature];
  const label = feature === 'letters' ? '角色來信' : '對話番外';
  const section = element('section', 'resident-loader-section resident-loader-feature');
  section.dataset.feature = feature;
  section.append(element('h3', '', label));

  const prompt = element('textarea');
  prompt.rows = 6;
  prompt.maxLength = 8_000;
  prompt.dataset.prompt = feature;
  const packPrompt = pack?.manifest.prompts[feature] ?? '';
  prompt.value = featureSettings.promptOverride || packPrompt;
  prompt.placeholder = packPrompt || '先匯入並綁定角色包。';
  section.append(field('可見、可自行修改的 Prompt', prompt));

  const recent = element('input');
  recent.type = 'number';
  recent.min = '0';
  recent.max = '50';
  recent.inputMode = 'numeric';
  recent.value = String(featureSettings.recentMessages);
  recent.dataset.recent = feature;

  const mode = element('select');
  mode.dataset.mode = feature;
  const current = element('option', '', '沿用目前酒館 API');
  current.value = 'current';
  const profile = element('option', '', '使用既有 Connection Profile');
  profile.value = 'profile';
  mode.append(current, profile);
  mode.value = featureSettings.mode;

  const profiles = element('select');
  profiles.dataset.profile = feature;
  const noProfile = element('option', '', model.profiles.length ? '請選擇' : '酒館目前沒有可用 Profile');
  noProfile.value = '';
  profiles.append(noProfile);
  for (const item of model.profiles) {
    const suffix = item.model ? ` · ${item.model}` : '';
    const option = element('option', '', `${item.name}${suffix}`);
    option.value = item.id;
    profiles.append(option);
  }
  profiles.value = featureSettings.profileId;

  const controls = element('div', 'resident-loader-grid');
  controls.append(field('帶入最近幾樓（0＝不帶）', recent), field('生成連線', mode), field('指定 Profile', profiles));
  section.append(controls);

  const summary = model.contextSummaries[feature];
  const contextBox = element('details', 'resident-loader-context');
  const summaryLabel = element(
    'summary',
    '',
    `${summary.messageCount} 樓 · 約 ${summary.characterCount} 字（點開預覽）`,
  );
  summaryLabel.dataset.contextLabel = feature;
  const preview = element(
    'pre',
    '',
    summary.preview || '這個功能目前不會帶入最近對話。',
  );
  preview.dataset.contextPreview = feature;
  contextBox.append(summaryLabel, preview);
  section.append(contextBox);

  const actions = element('div', 'resident-loader-actions');
  const generate = button(`生成${label}`, `generate:${feature}`);
  generate.disabled = !model.identity || !pack;
  actions.append(button('恢復角色包預設 Prompt', `reset-prompt:${feature}`), generate);
  section.append(actions);

  const history = element('div', 'resident-loader-history');
  history.append(element('h4', '', `${label}紀錄`));
  const records = model.histories[feature];
  if (records.length === 0) {
    history.append(element('p', 'resident-loader-empty', '這段聊天目前還沒有生成紀錄。'));
  }
  for (const record of records) {
    const article = element('article', 'resident-loader-record');
    article.dataset.historyId = String(record.id);
    const time = new Date(record.createdAt).toLocaleString('zh-TW');
    article.append(element('p', 'resident-loader-record-meta', `${time} · ${record.apiSource}`));
    const content = element('div', 'resident-loader-record-content', record.content);
    const recordActions = element('div', 'resident-loader-actions');
    const copy = button('複製', 'copy-history');
    copy.dataset.historyId = String(record.id);
    const remove = button('刪除', 'delete-history');
    remove.dataset.historyId = String(record.id);
    recordActions.append(copy, remove);
    article.append(content, recordActions);
    history.append(article);
  }
  section.append(history);
  return section;
}

export function createLoaderPanel(model: LoaderPanelModel): HTMLElement {
  const panel = element('section', 'resident-loader-panel');
  panel.id = 'resident-loader-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'resident-loader-title');

  const header = element('header', 'resident-loader-panel-header');
  const title = element('h2', '', 'Resident Loader');
  title.id = 'resident-loader-title';
  header.append(title, button('關閉', 'close'));

  const identity = model.identity
    ? `目前角色：${model.identity.characterName}`
    : '請先打開一個角色聊天，再進行綁定。';
  const status = element('p', 'resident-loader-status', identity);
  status.dataset.status = 'true';

  const body = element('div', 'resident-loader-panel-body');
  const selectedPack = model.packs.find((pack) => pack.manifest.id === model.selectedPackId);
  body.append(
    packSelector(model),
    appearanceSection(model.settings),
    idlePromptSection(model.settings, selectedPack),
    featureSection('letters', model, selectedPack),
    featureSection('stories', model, selectedPack),
  );
  panel.append(header, status, body);
  return panel;
}
