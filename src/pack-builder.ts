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
// 酒館端的 id 規則：≤64 字元、首字元字母或數字、其餘可含 . _ -（resident-loader pack-schema.ts:62）。
const LOADER_ID_MAX_LENGTH = 64;
const CREATOR_SLUG_MAX_LENGTH = 24;

function slugify(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('zh-Hant')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function clampSlug(slug: string, maximum: number): string {
  return slug.slice(0, maximum).replace(/-+$/g, '');
}

export function slugifyPackId(value: string): string {
  return clampSlug(slugify(value), LOADER_ID_MAX_LENGTH) || 'resident-pet';
}

/**
 * 角色包 id 帶作者命名空間：`<creatorSlug>.<packSlug>`。
 * 兩位作者各做一個「小明」不會撞 id，酒館端也就不會把別人的包無聲蓋掉（審查 P0-2）。
 * 作者欄空白時退回純 packSlug，與舊版工坊產出的 id 相容。
 */
export function createPackId(creator: string, displayName: string): string {
  const packSlug = slugifyPackId(displayName);
  const creatorSlug = clampSlug(slugify(creator), CREATOR_SLUG_MAX_LENGTH);
  if (!creatorSlug) return packSlug;
  return `${creatorSlug}.${clampSlug(packSlug, LOADER_ID_MAX_LENGTH - creatorSlug.length - 1)}`;
}

export function createPackManifest(draft: PackDraft, assetName: string): PackManifest {
  return {
    schemaVersion: 1,
    id: createPackId(draft.creator, draft.displayName),
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
