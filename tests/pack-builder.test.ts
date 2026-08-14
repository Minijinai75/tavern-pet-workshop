import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import {
  buildPackArchive,
  createPackManifest,
  slugifyPackId,
  type PackDraft,
} from '../src/pack-builder';

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

describe('createPackManifest', () => {
  it('creates a data-only v1 manifest with a standard 8x12 sprite atlas', () => {
    expect(createPackManifest(draft, 'spritesheet.png')).toEqual({
      schemaVersion: 1,
      id: '小景和',
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
      id: '小景和',
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
