import { describe, expect, it } from 'vitest';
import { buildFeaturePrompt, summarizeRecentConversation } from '../src/loader/context-builder';
import { extractConnectionProfiles } from '../src/loader/st-adapter';
import { DEFAULT_LOADER_SETTINGS, normalizeLoaderSettings } from '../src/loader/settings';

describe('normalizeLoaderSettings', () => {
  it('keeps frame speed and movement speed independent while clamping unsafe values', () => {
    const settings = normalizeLoaderSettings({
      idlePromptOverride: 'USER 的日常陪伴 Prompt',
      appearance: { desktopSizePercent: 999, mobileSizePercent: 30, opacity: 2 },
      motion: { frameIntervalMs: 40, walkSpeedPxPerSec: 900 },
      position: {
        desktop: { x: 240, y: 300 },
        mobile: { x: null, y: null },
      },
    });

    expect(settings.appearance).toEqual({
      desktopSizePercent: 180,
      mobileSizePercent: 60,
      opacity: 1,
    });
    expect(settings.motion).toEqual({ frameIntervalMs: 50, walkSpeedPxPerSec: 500 });
    expect(settings.position.desktop).toEqual({ x: 240, y: 300 });
    expect(settings.position.mobile).toEqual({ x: null, y: null });
    expect(settings.idlePromptOverride).toBe('USER 的日常陪伴 Prompt');
  });

  it('uses visible per-feature prompt overrides and accepts zero recent floors', () => {
    const settings = normalizeLoaderSettings({
      features: {
        stories: {
          promptOverride: '這是 USER 自己改的番外 Prompt。',
          recentMessages: 0,
          mode: 'profile',
          profileId: 'writer',
        },
      },
    });

    expect(settings.features.stories).toMatchObject({
      promptOverride: '這是 USER 自己改的番外 Prompt。',
      recentMessages: 0,
      mode: 'profile',
      profileId: 'writer',
    });
    expect(settings.features.letters).toEqual(DEFAULT_LOADER_SETTINGS.features.letters);
  });
});

describe('summarizeRecentConversation', () => {
  it('returns a USER-auditable count, character estimate, and preview without hidden fields', () => {
    const summary = summarizeRecentConversation(
      [
        { is_user: true, name: 'Mini', mes: '第一樓', extra: { reasoning: 'SECRET' } },
        { is_user: false, name: '景和', mes: '第二樓' },
        { is_user: true, name: 'Mini', mes: '第三樓' },
      ],
      2,
      'Mini',
      '景和',
    );

    expect(summary.messageCount).toBe(2);
    expect(summary.characterCount).toBeGreaterThan(0);
    expect(summary.preview).toContain('第二樓');
    expect(summary.preview).toContain('第三樓');
    expect(summary.preview).not.toContain('第一樓');
    expect(summary.preview).not.toContain('SECRET');
  });
});

describe('buildFeaturePrompt', () => {
  const chat = [
    { is_user: true, name: 'Mini', mes: '第一樓' },
    { is_user: false, name: '景和', mes: '第二樓' },
    { is_user: true, name: 'Mini', mes: '第三樓' },
    { is_user: false, name: '景和', mes: '第四樓' },
  ];

  it('includes no chat content when recentMessages is zero', () => {
    const prompt = buildFeaturePrompt({
      packPrompt: '寫一段番外。',
      promptOverride: '',
      recentMessages: 0,
      chat,
      userName: 'Mini',
      characterName: '景和',
    });

    expect(prompt).toBe('寫一段番外。');
    expect(prompt).not.toContain('最近對話');
    expect(prompt).not.toContain('第四樓');
  });

  it('uses the USER override and only the newest requested floors in chronological order', () => {
    const prompt = buildFeaturePrompt({
      packPrompt: '舊 Prompt',
      promptOverride: '新版 Prompt',
      recentMessages: 3,
      chat,
      userName: 'Mini',
      characterName: '景和',
    });

    expect(prompt).toContain('新版 Prompt');
    expect(prompt).not.toContain('舊 Prompt');
    expect(prompt).not.toContain('第一樓');
    expect(prompt.indexOf('第二樓')).toBeLessThan(prompt.indexOf('第三樓'));
    expect(prompt.indexOf('第三樓')).toBeLessThan(prompt.indexOf('第四樓'));
  });
});

describe('extractConnectionProfiles', () => {
  it('exposes selectable labels without leaking URL, token, or API key fields', () => {
    const profiles = extractConnectionProfiles({
      extensionSettings: {
        connectionManager: {
          profiles: [
            {
              id: 'writer',
              name: '番外專用',
              api: 'openai',
              model: 'gpt-test',
              apiKey: 'SECRET',
              endpoint: 'https://secret.example',
            },
          ],
        },
      },
    });

    expect(profiles).toEqual([
      { id: 'writer', name: '番外專用', api: 'openai', model: 'gpt-test' },
    ]);
    expect(JSON.stringify(profiles)).not.toContain('SECRET');
    expect(JSON.stringify(profiles)).not.toContain('secret.example');
  });
});
