import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { importResidentPack } from '../src/loader/pack-importer';

function pngHeader(width = 1024, height = 1536): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

const PNG_SIGNATURE = pngHeader();

const validManifest = {
  schemaVersion: 1,
  id: 'doctor-hesianian',
  identity: {
    displayName: '何思年',
    creator: 'Mini',
    description: '一名溫柔沉著的醫生桌寵。',
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
    idle: '用角色口吻說一句短短的陪伴。',
    letters: '用角色口吻寫一封信。',
    stories: '根據最近對話寫一段番外。',
  },
  capabilities: ['idle', 'letters', 'stories'],
};

async function makeArchive(
  mutate?: (zip: JSZip) => void,
  manifest: unknown = validManifest,
): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest));
  zip.file(
    'pack-meta.json',
    JSON.stringify({
      format: 'jinghe-resident-pack',
      formatVersion: 1,
      generatedBy: 'tavern-pet-workshop',
    }),
  );
  zip.folder('assets')!.file('spritesheet.png', PNG_SIGNATURE);
  mutate?.(zip);
  return zip.generateAsync({ type: 'arraybuffer' });
}

describe('importResidentPack', () => {
  it('accepts the workshop data-only v1 archive', async () => {
    const pack = await importResidentPack(await makeArchive());

    expect(pack.manifest).toEqual(validManifest);
    expect(pack.spritesheet).toEqual(PNG_SIGNATURE);
    expect(pack.importedAt).toEqual(expect.any(Number));
  });

  it.each([
    ['JavaScript', (zip: JSZip) => zip.file('payload.js', 'alert(1)')],
    ['HTML', (zip: JSZip) => zip.file('assets/panel.html', '<script>bad()</script>')],
    ['SVG', (zip: JSZip) => zip.file('assets/pet.svg', '<svg onload="bad()"/>')],
  ])('rejects an archive containing unknown executable %s files', async (_label, mutate) => {
    await expect(importResidentPack(await makeArchive(mutate))).rejects.toThrow(
      '包含不支援的檔案',
    );
  });

  it('rejects unsafe parent-directory paths', async () => {
    const archive = await makeArchive((zip) => zip.file('../escape.js', 'bad()'));

    await expect(importResidentPack(archive)).rejects.toThrow('路徑不安全');
  });

  it('rejects a fake PNG asset', async () => {
    const archive = await makeArchive((zip) => {
      zip.file('assets/spritesheet.png', new TextEncoder().encode('<script>bad()</script>'));
    });

    await expect(importResidentPack(archive)).rejects.toThrow('不是有效的 PNG');
  });

  it('rejects a PNG that is not the standard 1024x1536 sprite sheet', async () => {
    const archive = await makeArchive((zip) => {
      zip.file('assets/spritesheet.png', pngHeader(512, 512));
    });

    await expect(importResidentPack(archive)).rejects.toThrow('1024×1536');
  });

  it('rejects manifest fields outside the public data-only contract', async () => {
    const archive = await makeArchive(undefined, {
      ...validManifest,
      script: 'alert(1)',
    });

    await expect(importResidentPack(archive)).rejects.toThrow('manifest 格式不正確');
  });

  it('rejects sprite grid values that are incompatible with Loader v1', async () => {
    const archive = await makeArchive(undefined, {
      ...validManifest,
      animation: { ...validManifest.animation, columns: 7 },
    });

    await expect(importResidentPack(archive)).rejects.toThrow('manifest 格式不正確');
  });
});
