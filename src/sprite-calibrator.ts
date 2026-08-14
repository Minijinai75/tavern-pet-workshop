export const SPRITE_COLUMNS = 8;
export const SPRITE_ROWS = 12;
export const SPRITE_FRAME_SIZE = 128;
export const SPRITE_FRAME_COUNT = 96;
export const SPRITE_SAFE_MARGIN = 8;

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface AlphaBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FrameAdjustment {
  scale: number;
  offsetX: number;
  offsetY: number;
  cropSize?: number;
  sourceOffsetX?: number;
  sourceOffsetY?: number;
}

export interface FrameInspection {
  frame: number;
  bounds: AlphaBounds | null;
  unsafe: boolean;
  empty: boolean;
}

export function frameRect(frame: number): { x: number; y: number; width: number; height: number } {
  const safe = Math.max(0, Math.min(SPRITE_FRAME_COUNT - 1, Math.floor(frame)));
  return {
    x: (safe % SPRITE_COLUMNS) * SPRITE_FRAME_SIZE,
    y: Math.floor(safe / SPRITE_COLUMNS) * SPRITE_FRAME_SIZE,
    width: SPRITE_FRAME_SIZE,
    height: SPRITE_FRAME_SIZE,
  };
}

export function sourceRectForFrame(
  frame: number,
  adjustment: FrameAdjustment,
): { x: number; y: number; width: number; height: number } {
  const rect = frameRect(frame);
  const cropSize = Math.max(96, Math.min(256, adjustment.cropSize ?? SPRITE_FRAME_SIZE));
  return {
    x: rect.x + SPRITE_FRAME_SIZE / 2 + (adjustment.sourceOffsetX ?? 0) - cropSize / 2,
    y: rect.y + SPRITE_FRAME_SIZE / 2 + (adjustment.sourceOffsetY ?? 0) - cropSize / 2,
    width: cropSize,
    height: cropSize,
  };
}

export function analyzeSpriteFrames(
  pixels: PixelBuffer,
  safeMargin = SPRITE_SAFE_MARGIN,
): FrameInspection[] {
  if (pixels.width !== 1024 || pixels.height !== 1536) {
    throw new Error('逐格檢查需要 1024×1536 的標準圖集。');
  }
  return Array.from({ length: SPRITE_FRAME_COUNT }, (_, frame) => {
    const rect = frameRect(frame);
    let left = SPRITE_FRAME_SIZE;
    let top = SPRITE_FRAME_SIZE;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < SPRITE_FRAME_SIZE; y += 1) {
      for (let x = 0; x < SPRITE_FRAME_SIZE; x += 1) {
        const alpha = pixels.data[((rect.y + y) * pixels.width + rect.x + x) * 4 + 3];
        if (!alpha) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    const empty = right < 0;
    const bounds = empty ? null : { left, top, right, bottom };
    const unsafe = empty || Boolean(
      bounds && (
        bounds.left < safeMargin ||
        bounds.top < safeMargin ||
        bounds.right >= SPRITE_FRAME_SIZE - safeMargin ||
        bounds.bottom >= SPRITE_FRAME_SIZE - safeMargin
      )
    );
    return { frame, bounds, unsafe, empty };
  });
}

export function fitBoundsIntoSafeArea(
  bounds: AlphaBounds,
  safeMargin = SPRITE_SAFE_MARGIN,
): FrameAdjustment {
  const available = SPRITE_FRAME_SIZE - safeMargin * 2;
  const width = Math.max(1, bounds.right - bounds.left + 1);
  const height = Math.max(1, bounds.bottom - bounds.top + 1);
  const scale = Math.min(1, available / width, available / height);
  const centerX = (bounds.left + bounds.right + 1) / 2;
  const centerY = (bounds.top + bounds.bottom + 1) / 2;
  return {
    scale,
    offsetX: -(centerX - SPRITE_FRAME_SIZE / 2) * scale,
    offsetY: -(centerY - SPRITE_FRAME_SIZE / 2) * scale,
  };
}

export function composeAdjustedSpriteSheet(
  source: CanvasImageSource,
  adjustments: ReadonlyMap<number, FrameAdjustment>,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法建立圖片校正畫布。');
  context.imageSmoothingEnabled = true;
  for (let frame = 0; frame < SPRITE_FRAME_COUNT; frame += 1) {
    const rect = frameRect(frame);
    const adjustment = adjustments.get(frame) ?? { scale: 1, offsetX: 0, offsetY: 0 };
    const sourceRect = sourceRectForFrame(frame, adjustment);
    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
    context.translate(
      rect.x + SPRITE_FRAME_SIZE / 2 + adjustment.offsetX,
      rect.y + SPRITE_FRAME_SIZE / 2 + adjustment.offsetY,
    );
    context.scale(adjustment.scale, adjustment.scale);
    context.drawImage(
      source,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      -SPRITE_FRAME_SIZE / 2,
      -SPRITE_FRAME_SIZE / 2,
      SPRITE_FRAME_SIZE,
      SPRITE_FRAME_SIZE,
    );
    context.restore();
  }
  return canvas;
}

export function canvasToPngFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('瀏覽器無法輸出校正後的 PNG。'));
      resolve(new File([blob], fileName, { type: 'image/png' }));
    }, 'image/png');
  });
}
