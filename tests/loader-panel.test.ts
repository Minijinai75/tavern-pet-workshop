// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { createLoaderPanel } from '../src/loader/panel';
import { DEFAULT_LOADER_SETTINGS } from '../src/loader/settings';
import type { ImportedResidentPack } from '../src/loader/pack-importer';

const pack: ImportedResidentPack = {
  manifest: {
    schemaVersion: 1,
    id: 'jinghe',
    identity: {
      displayName: '<img src=x onerror=alert(1)>景和',
      creator: 'Mini',
      description: '桌邊的小居民。',
    },
    assets: { spritesheet: 'assets/spritesheet.png' },
    animation: {
      kind: 'grid',
      columns: 8,
      rows: 12,
      frameWidth: 128,
      frameHeight: 128,
      frameCount: 96,
    },
    theme: { accentColor: '#8ca8c7' },
    prompts: {
      idle: '待機 Prompt',
      letters: '角色包書信 Prompt',
      stories: '角色包番外 Prompt',
    },
    capabilities: ['idle', 'letters', 'stories'],
  },
  spritesheet: new Uint8Array(),
  importedAt: 100,
};

describe('createLoaderPanel', () => {
  it('shows editable prompts, context floors, API profiles, and persistent history in one panel', () => {
    const panel = createLoaderPanel({
      identity: {
        characterKey: 'avatar:jinghe.png',
        characterName: '景和',
        chatKey: 'chat:story',
        userName: 'Mini',
      },
      packs: [pack],
      selectedPackId: 'jinghe',
      settings: {
        ...DEFAULT_LOADER_SETTINGS,
        features: {
          ...DEFAULT_LOADER_SETTINGS.features,
          stories: {
            ...DEFAULT_LOADER_SETTINGS.features.stories,
            promptOverride: 'USER 改過的番外 Prompt',
            recentMessages: 12,
            mode: 'profile',
            profileId: 'writer',
          },
        },
      },
      profiles: [{ id: 'writer', name: '番外專用', api: 'openai', model: 'model-a' }],
      histories: {
        letters: [],
        stories: [
          {
            id: 1,
            characterKey: 'avatar:jinghe.png',
            chatKey: 'chat:story',
            feature: 'stories',
            content: '這段番外關掉面板後也還在。',
            prompt: 'prompt',
            apiSource: 'profile:writer',
            createdAt: 100,
          },
        ],
      },
      contextSummaries: {
        letters: { messageCount: 8, characterCount: 520, preview: 'Mini：最近一樓' },
        stories: { messageCount: 12, characterCount: 860, preview: '景和：最近番外內容' },
      },
    });

    expect(panel.querySelector<HTMLTextAreaElement>('[data-prompt="stories"]')?.value).toBe(
      'USER 改過的番外 Prompt',
    );
    expect(panel.querySelector<HTMLInputElement>('[data-recent="stories"]')?.value).toBe('12');
    expect(panel.querySelector<HTMLSelectElement>('[data-mode="stories"]')?.value).toBe('profile');
    expect(panel.textContent).toContain('這段番外關掉面板後也還在。');
    expect(panel.textContent).toContain('番外專用 · model-a');
    expect(panel.querySelector<HTMLTextAreaElement>('[data-prompt="idle"]')?.value).toBe(
      '待機 Prompt',
    );
    expect(panel.textContent).toContain('12 樓 · 約 860 字');
    expect(panel.textContent).toContain('最近番外內容');
    expect(panel.querySelectorAll('[data-motion-preset]')).toHaveLength(3);
  });

  it('renders imported names as text rather than executable HTML', () => {
    const panel = createLoaderPanel({
      identity: null,
      packs: [pack],
      selectedPackId: 'jinghe',
      settings: DEFAULT_LOADER_SETTINGS,
      profiles: [],
      histories: { letters: [], stories: [] },
      contextSummaries: {
        letters: { messageCount: 0, characterCount: 0, preview: '' },
        stories: { messageCount: 0, characterCount: 0, preview: '' },
      },
    });

    expect(panel.querySelector('img')).toBeNull();
    expect(panel.textContent).toContain('<img src=x onerror=alert(1)>景和');
  });
});
