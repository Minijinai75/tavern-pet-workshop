import JSZip from 'jszip';
import {
  PACK_FORMAT,
  PACK_FORMAT_VERSION,
  parseResidentPackManifest,
  type ResidentPackManifest,
} from './pack-schema';

const MAX_ARCHIVE_BYTES = 30 * 1024 * 1024;
const MAX_SPRITESHEET_BYTES = 20 * 1024 * 1024;
const ALLOWED_ENTRIES = new Set([
  'manifest.json',
  'pack-meta.json',
  'assets/',
  'assets/spritesheet.png',
]);
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10] as const;

export interface ImportedResidentPack {
  manifest: ResidentPackManifest;
  spritesheet: Uint8Array;
  importedAt: number;
}

function unsafeOriginalName(entry: JSZip.JSZipObject): string {
  return (entry as JSZip.JSZipObject & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
}

function hasUnsafePath(path: string): boolean {
  const normalized = path.replaceAll('\\', '/');
  return (
    normalized.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split('/').some((segment) => segment === '..' || segment === '.')
  );
}

function validateEntries(zip: JSZip): void {
  for (const entry of Object.values(zip.files)) {
    const rawPath = unsafeOriginalName(entry);
    if (hasUnsafePath(rawPath)) {
      throw new Error('角色包路徑不安全。');
    }
    if (!ALLOWED_ENTRIES.has(entry.name)) {
      throw new Error(`角色包包含不支援的檔案：${entry.name}`);
    }
  }
}

function validatePng(bytes: Uint8Array): void {
  if (bytes.length < 24 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    throw new Error('角色圖不是有效的 PNG。');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width !== 1024 || height !== 1536) {
    throw new Error('角色圖必須是 1024×1536 像素。');
  }
}

function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${label} 不是有效的 JSON。`);
  }
}

function validateMeta(value: unknown): void {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (value as Record<string, unknown>).format !== PACK_FORMAT ||
    (value as Record<string, unknown>).formatVersion !== PACK_FORMAT_VERSION
  ) {
    throw new Error('角色包版本不支援。');
  }
}

export async function importResidentPack(
  archive: ArrayBuffer | Uint8Array,
): Promise<ImportedResidentPack> {
  if (archive.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error('角色包超過 30 MB 上限。');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(archive, { checkCRC32: true });
  } catch {
    throw new Error('無法讀取這個角色包。');
  }

  validateEntries(zip);
  const manifestFile = zip.file('manifest.json');
  const metaFile = zip.file('pack-meta.json');
  const spritesheetFile = zip.file('assets/spritesheet.png');
  if (!manifestFile || !metaFile || !spritesheetFile) {
    throw new Error('角色包缺少必要檔案。');
  }

  const [manifestText, metaText, spritesheet] = await Promise.all([
    manifestFile.async('string'),
    metaFile.async('string'),
    spritesheetFile.async('uint8array'),
  ]);
  if (manifestText.length > 64_000 || metaText.length > 8_000) {
    throw new Error('角色包設定檔超過安全上限。');
  }
  if (spritesheet.byteLength > MAX_SPRITESHEET_BYTES) {
    throw new Error('角色圖超過 20 MB 上限。');
  }

  validateMeta(parseJson(metaText, 'pack-meta.json'));
  const manifest = parseResidentPackManifest(parseJson(manifestText, 'manifest.json'));
  validatePng(spritesheet);

  return {
    manifest,
    spritesheet,
    importedAt: Date.now(),
  };
}
