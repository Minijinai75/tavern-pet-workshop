import JSZip from 'jszip';

export interface PackDraft {
  displayName: string;
  creator: string;
  description: string;
  accentColor: string;
  idlePrompt: string;
  letterPrompt: string;
  storyPrompt: string;
}

export interface PackAsset {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface PackManifest {
  schemaVersion: 1;
  id: string;
  identity: {
    displayName: string;
    creator: string;
    description: string;
  };
  assets: {
    spritesheet: string;
  };
  animation: {
    kind: 'grid';
    columns: 8;
    rows: 12;
    frameWidth: 128;
    frameHeight: 128;
    frameCount: 96;
  };
  theme: {
    accentColor: string;
  };
  prompts: {
    idle: string;
    letters: string;
    stories: string;
  };
  capabilities: Array<'idle' | 'letters' | 'stories'>;
}

const SPRITESHEET_MIME = 'image/png';

export function slugifyPackId(value: string): string {
  const slug = value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('zh-Hant')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return slug || 'resident-pet';
}

export function createPackManifest(draft: PackDraft, assetName: string): PackManifest {
  return {
    schemaVersion: 1,
    id: slugifyPackId(draft.displayName),
    identity: {
      displayName: draft.displayName.trim(),
      creator: draft.creator.trim(),
      description: draft.description.trim(),
    },
    assets: {
      spritesheet: `assets/${assetName}`,
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
      accentColor: draft.accentColor,
    },
    prompts: {
      idle: draft.idlePrompt.trim(),
      letters: draft.letterPrompt.trim(),
      stories: draft.storyPrompt.trim(),
    },
    capabilities: ['idle', 'letters', 'stories'],
  };
}

export async function buildPackArchive(draft: PackDraft, asset: PackAsset): Promise<Blob> {
  if (asset.mimeType !== SPRITESHEET_MIME) {
    throw new Error('圖集只支援透明 PNG。');
  }

  const assetName = 'spritesheet.png';
  const manifest = createPackManifest(draft, assetName);
  const zip = new JSZip();

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file(
    'pack-meta.json',
    JSON.stringify(
      {
        format: 'jinghe-resident-pack',
        formatVersion: 1,
        generatedBy: 'tavern-pet-workshop',
      },
      null,
      2,
    ),
  );
  zip.folder('assets')!.file(assetName, asset.bytes);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}
