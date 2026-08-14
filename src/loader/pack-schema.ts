export const PACK_FORMAT = 'jinghe-resident-pack' as const;
export const PACK_FORMAT_VERSION = 1 as const;

export interface ResidentPackManifest {
  schemaVersion: 1;
  id: string;
  identity: {
    displayName: string;
    creator: string;
    description: string;
  };
  assets: {
    spritesheet: 'assets/spritesheet.png';
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

const ROOT_KEYS = [
  'schemaVersion',
  'id',
  'identity',
  'assets',
  'animation',
  'theme',
  'prompts',
  'capabilities',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isString(value: unknown, minimum = 1, maximum = 8_000): value is string {
  return typeof value === 'string' && value.trim().length >= minimum && value.length <= maximum;
}

export function isResidentPackManifest(value: unknown): value is ResidentPackManifest {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) return false;
  if (value.schemaVersion !== 1) return false;
  if (!isString(value.id, 1, 64) || !/^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u.test(value.id)) return false;

  const identity = value.identity;
  if (!isRecord(identity) || !hasExactKeys(identity, ['displayName', 'creator', 'description'])) {
    return false;
  }
  if (!isString(identity.displayName, 1, 100)) return false;
  if (typeof identity.creator !== 'string' || identity.creator.length > 100) return false;
  if (typeof identity.description !== 'string' || identity.description.length > 1_000) return false;

  const assets = value.assets;
  if (!isRecord(assets) || !hasExactKeys(assets, ['spritesheet'])) return false;
  if (assets.spritesheet !== 'assets/spritesheet.png') return false;

  const animation = value.animation;
  if (!isRecord(animation) || !hasExactKeys(animation, [
    'kind',
    'columns',
    'rows',
    'frameWidth',
    'frameHeight',
    'frameCount',
  ])) return false;
  if (
    animation.kind !== 'grid' ||
    animation.columns !== 8 ||
    animation.rows !== 12 ||
    animation.frameWidth !== 128 ||
    animation.frameHeight !== 128 ||
    animation.frameCount !== 96
  ) return false;

  const theme = value.theme;
  if (!isRecord(theme) || !hasExactKeys(theme, ['accentColor'])) return false;
  if (typeof theme.accentColor !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(theme.accentColor)) return false;

  const prompts = value.prompts;
  if (!isRecord(prompts) || !hasExactKeys(prompts, ['idle', 'letters', 'stories'])) return false;
  if (!isString(prompts.idle) || !isString(prompts.letters) || !isString(prompts.stories)) return false;

  const capabilities = value.capabilities;
  if (!Array.isArray(capabilities) || capabilities.length === 0) return false;
  const allowed = new Set(['idle', 'letters', 'stories']);
  if (!capabilities.every((entry) => typeof entry === 'string' && allowed.has(entry))) return false;
  return new Set(capabilities).size === capabilities.length;
}

export function parseResidentPackManifest(value: unknown): ResidentPackManifest {
  if (!isResidentPackManifest(value)) {
    throw new Error('角色包的 manifest 格式不正確。');
  }
  return value;
}
