import { slugifyPackId, type PackDraft } from './pack-builder';

export interface BrowserFileSummary {
  type: string;
  size: number;
}

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const SAFE_IMAGE_TYPE = 'image/png';

export function validateWorkshopInput(
  draft: PackDraft,
  image: BrowserFileSummary | undefined,
): string[] {
  const errors: string[] = [];

  if (!draft.displayName.trim()) {
    errors.push('請先填桌寵名稱。');
  }
  if (!draft.idlePrompt.trim()) {
    errors.push('請先填日常陪伴 Prompt。');
  }
  if (!image) {
    errors.push('請先選擇 GPT 產生的透明 Sprite Sheet PNG。');
    return errors;
  }
  if (image.type !== SAFE_IMAGE_TYPE) {
    errors.push('圖集只支援透明 PNG。');
  } else if (image.size > MAX_IMAGE_SIZE) {
    errors.push('圖集需小於或等於 8 MB。');
  }

  return errors;
}

export function validateSpriteDimensions(width: number, height: number): string[] {
  if (width === 1024 && height === 1536) return [];
  return ['圖集尺寸必須是 1024 × 1536 像素（8 欄 × 12 列）。'];
}

export function createDownloadName(displayName: string): string {
  return `${slugifyPackId(displayName)}.jrpack.zip`;
}
