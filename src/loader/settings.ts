export type GenerationMode = 'current' | 'profile';
export type GenerationFeature = 'letters' | 'stories';

export interface FeatureSettings {
  promptOverride: string;
  recentMessages: number;
  mode: GenerationMode;
  profileId: string;
}

export interface LoaderSettings {
  idlePromptOverride: string;
  appearance: {
    desktopSizePercent: number;
    mobileSizePercent: number;
    opacity: number;
  };
  motion: {
    frameIntervalMs: number;
    walkSpeedPxPerSec: number;
  };
  position: {
    desktop: { x: number | null; y: number | null };
    mobile: { x: number | null; y: number | null };
  };
  features: Record<GenerationFeature, FeatureSettings>;
}

export const DEFAULT_LOADER_SETTINGS: LoaderSettings = {
  idlePromptOverride: '',
  appearance: {
    desktopSizePercent: 100,
    mobileSizePercent: 82,
    opacity: 1,
  },
  motion: {
    frameIntervalMs: 125,
    walkSpeedPxPerSec: 72,
  },
  position: {
    desktop: { x: null, y: null },
    mobile: { x: null, y: null },
  },
  features: {
    letters: {
      promptOverride: '',
      recentMessages: 8,
      mode: 'current',
      profileId: '',
    },
    stories: {
      promptOverride: '',
      recentMessages: 6,
      mode: 'current',
      profileId: '',
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: unknown, minimum: number, maximum: number, fallback: number): number {
  return Math.min(maximum, Math.max(minimum, finiteNumber(value, fallback)));
}

function featureSettings(value: unknown, fallback: FeatureSettings): FeatureSettings {
  const input = isRecord(value) ? value : {};
  const mode = input.mode === 'profile' ? 'profile' : 'current';
  return {
    promptOverride:
      typeof input.promptOverride === 'string' ? input.promptOverride.slice(0, 8_000) : fallback.promptOverride,
    recentMessages: Math.round(clamp(input.recentMessages, 0, 50, fallback.recentMessages)),
    mode,
    profileId:
      typeof input.profileId === 'string' && input.profileId.length <= 200
        ? input.profileId
        : fallback.profileId,
  };
}

function coordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = finiteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? Math.round(Math.min(10_000, Math.max(0, parsed))) : null;
}

function positionValue(value: unknown): { x: number | null; y: number | null } {
  const input = isRecord(value) ? value : {};
  return { x: coordinate(input.x), y: coordinate(input.y) };
}

export function normalizeLoaderSettings(value: unknown): LoaderSettings {
  const input = isRecord(value) ? value : {};
  const appearance = isRecord(input.appearance) ? input.appearance : {};
  const motion = isRecord(input.motion) ? input.motion : {};
  const position = isRecord(input.position) ? input.position : {};
  const features = isRecord(input.features) ? input.features : {};
  return {
    idlePromptOverride:
      typeof input.idlePromptOverride === 'string'
        ? input.idlePromptOverride.slice(0, 8_000)
        : DEFAULT_LOADER_SETTINGS.idlePromptOverride,
    appearance: {
      desktopSizePercent: Math.round(
        clamp(
          appearance.desktopSizePercent,
          60,
          180,
          DEFAULT_LOADER_SETTINGS.appearance.desktopSizePercent,
        ),
      ),
      mobileSizePercent: Math.round(
        clamp(
          appearance.mobileSizePercent,
          60,
          180,
          DEFAULT_LOADER_SETTINGS.appearance.mobileSizePercent,
        ),
      ),
      opacity: clamp(appearance.opacity, 0.2, 1, DEFAULT_LOADER_SETTINGS.appearance.opacity),
    },
    motion: {
      frameIntervalMs: Math.round(
        clamp(
          motion.frameIntervalMs,
          50,
          1_000,
          DEFAULT_LOADER_SETTINGS.motion.frameIntervalMs,
        ),
      ),
      walkSpeedPxPerSec: Math.round(
        clamp(
          motion.walkSpeedPxPerSec,
          10,
          500,
          DEFAULT_LOADER_SETTINGS.motion.walkSpeedPxPerSec,
        ),
      ),
    },
    position: {
      desktop: positionValue(position.desktop),
      mobile: positionValue(position.mobile),
    },
    features: {
      letters: featureSettings(features.letters, DEFAULT_LOADER_SETTINGS.features.letters),
      stories: featureSettings(features.stories, DEFAULT_LOADER_SETTINGS.features.stories),
    },
  };
}
