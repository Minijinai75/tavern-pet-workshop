import { describe, expect, it } from 'vitest';
import type { PackDraft } from '../src/pack-builder';
import {
  createDownloadName,
  validateSpriteDimensions,
  validateWorkshopInput,
} from '../src/workshop';

const validDraft: PackDraft = {
  displayName: '夜航景和',
  creator: 'Mini',
  description: '陪你整理深夜靈感。',
  accentColor: '#ec4899',
  idlePrompt: '說一句短短的陪伴。',
  letterPrompt: '寫一封角色來信。',
  storyPrompt: '寫一段對話番外。',
};

describe('validateWorkshopInput', () => {
  it('reports the fields needed before export', () => {
    expect(
      validateWorkshopInput(
        { ...validDraft, displayName: '', idlePrompt: '' },
        undefined,
      ),
    ).toEqual(['請先填桌寵名稱。', '請先填日常陪伴 Prompt。', '請先選擇 GPT 產生的透明 Sprite Sheet PNG。']);
  });

  it('rejects unsupported or oversized image files', () => {
    expect(
      validateWorkshopInput(validDraft, { type: 'image/webp', size: 100 }),
    ).toEqual(['圖集只支援透明 PNG。']);

    expect(
      validateWorkshopInput(validDraft, { type: 'image/png', size: 8 * 1024 * 1024 + 1 }),
    ).toEqual(['圖集需小於或等於 8 MB。']);
  });

  it('accepts a complete browser-local draft', () => {
    expect(
      validateWorkshopInput(validDraft, { type: 'image/png', size: 1024 }),
    ).toEqual([]);
  });
});

describe('validateSpriteDimensions', () => {
  it('accepts only the standard 1024x1536 8x12 atlas', () => {
    expect(validateSpriteDimensions(1024, 1536)).toEqual([]);
    expect(validateSpriteDimensions(1024, 1024)).toEqual([
      '圖集尺寸必須是 1024 × 1536 像素（8 欄 × 12 列）。',
    ]);
  });
});

describe('createDownloadName', () => {
  it('uses the safe pack id and jrpack marker', () => {
    expect(createDownloadName('夜航 景和')).toBe('夜航-景和.jrpack.zip');
  });
});
