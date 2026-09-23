import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import {
  buildPackArchive,
  createPackId,
  createPackManifest,
  slugifyPackId,
  type PackDraft,
} from '../src/pack-builder';

// 與 resident-loader/src/loader/pack-schema.ts:62 的 id 規則相同（≤64 字元、首字元字母或數字）。
const LOADER_ID_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u;
const LOADER_ID_MAX_LENGTH = 64;

const draft: PackDraft = {
  displayName: '小景和',
  creator: 'Mini',
  description: '安靜陪在酒館角落的桌寵。',
  accentColor: '#ec4899',
  idlePrompt: '用角色本人的語氣，給使用者一句短短的陪伴。',
  letterPrompt: '以角色口吻寫一封不超過 300 字的信。',
  storyPrompt: '以目前對話為背景，寫一段溫柔的番外。',
};

describe('slugifyPackId', () => {
  it('creates a stable safe id and preserves useful CJK characters', () => {
    expect(slugifyPackId('  小景和 Pet!!  ')).toBe('小景和-pet');
  });
});

describe('createPackId', () => {
  it('namespaces the pack under the creator so two authors naming「小明」do not collide', () => {
    expect(createPackId('Mini', '小明')).toBe('mini.小明');
    expect(createPackId('景和', '小明')).toBe('景和.小明');
    expect(createPackId('Mini', '小明')).not.toBe(createPackId('景和', '小明'));
  });

  it('slugifies the creator the same way as the pack name', () => {
    expect(createPackId('  Mini @ Tavern!! ', '小景和')).toBe('mini-tavern.小景和');
  });

  it('falls back to the bare pack slug when the creator is blank', () => {
    expect(createPackId('', '小景和')).toBe('小景和');
    expect(createPackId('   ', '小景和')).toBe('小景和');
    expect(createPackId('!!!', '小景和')).toBe('小景和');
  });

  it('stays inside the loader id contract even for very long names', () => {
    const id = createPackId('c'.repeat(90), 'p'.repeat(90));

    expect(id.length).toBeLessThanOrEqual(LOADER_ID_MAX_LENGTH);
    expect(id).toMatch(LOADER_ID_PATTERN);
    expect(id.startsWith('c'.repeat(24) + '.')).toBe(true);
  });

  it('never leaves a dangling separator after truncation', () => {
    const id = createPackId('x'.repeat(23) + ' y', 'z'.repeat(40) + ' tail');

    expect(id).toMatch(LOADER_ID_PATTERN);
    expect(id.endsWith('-')).toBe(false);
    expect(id.includes('-.')).toBe(false);
    expect(id.length).toBeLessThanOrEqual(LOADER_ID_MAX_LENGTH);
  });
});

describe('createPackManifest', () => {
  it('creates a data-only v1 manifest with a creator-namespaced id and a standard 8x12 sprite atlas', () => {
    expect(createPackManifest(draft, 'spritesheet.png')).toEqual({
      schemaVersion: 1,
      id: 'mini.小景和',
      identity: {
        displayName: '小景和',
        creator: 'Mini',
        description: '安靜陪在酒館角落的桌寵。',
      },
      assets: {
        spritesheet: 'assets/spritesheet.png',
      },
      animation: {
        kind: 'grid',
        columns: 8,
        rows: 12,
        frameWidth: 128,
        frameHeight: 128,
        frameCount: 96,
      },
      theme: {
        accentColor: '#ec4899',
      },
      prompts: {
        idle: '用角色本人的語氣，給使用者一句短短的陪伴。',
        letters: '以角色口吻寫一封不超過 300 字的信。',
        stories: '以目前對話為背景，寫一段溫柔的番外。',
      },
      capabilities: ['idle', 'letters', 'stories'],
    });
  });
});

describe('buildPackArchive', () => {
  it('exports only the manifest, metadata, and the uploaded image', async () => {
    const image = new Uint8Array([137, 80, 78, 71]);
    const blob = await buildPackArchive(draft, {
      name: 'avatar.png',
      mimeType: 'image/png',
      bytes: image,
    });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());

    expect(Object.keys(zip.files).sort()).toEqual([
      'assets/',
      'assets/spritesheet.png',
      'manifest.json',
      'pack-meta.json',
    ]);
    expect(JSON.parse(await zip.file('manifest.json')!.async('string'))).toMatchObject({
      schemaVersion: 1,
      id: 'mini.小景和',
    });
    expect(await zip.file('assets/spritesheet.png')!.async('uint8array')).toEqual(image);
  });

  it('rejects non-PNG atlas assets', async () => {
    await expect(
      buildPackArchive(draft, {
        name: 'payload.svg',
        mimeType: 'image/svg+xml',
        bytes: new Uint8Array([60, 115, 118, 103]),
      }),
    ).rejects.toThrow('圖集只支援透明 PNG');
  });
});
