export const SPRITE_COLUMNS = 8;
export const SPRITE_ROWS = 12;
export const SPRITE_FRAME_SIZE = 128;
export const SPRITE_FRAME_COUNT = 96;
export const SPRITE_SAFE_MARGIN = 8;
export const SPRITE_ALPHA_THRESHOLD = 16;

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

export type UnsafeFrameEdge = 'top' | 'right' | 'bottom' | 'left';

interface SpriteComponent {
  id: number;
  area: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  pixels: number[];
}

export interface AutomaticFramePlan {
  frame: number;
  sourceBounds: AlphaBounds;
  sourceAnchorX: number;
  scale: number;
  outputLeft: number;
  outputTop: number;
  outputWidth: number;
  outputHeight: number;
}

export interface AutomaticRowPlan {
  row: number;
  frames: AutomaticFramePlan[];
  scale: number;
  error?: string;
}

export interface AutomaticSpriteAlignment {
  ok: boolean;
  rows: AutomaticRowPlan[];
  pixelOwners: Uint8Array;
  errors: string[];
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

export function rowFrameIndexes(frame: number): number[] {
  const safe = Math.max(0, Math.min(SPRITE_FRAME_COUNT - 1, Math.floor(frame)));
  const start = Math.floor(safe / SPRITE_COLUMNS) * SPRITE_COLUMNS;
  return Array.from({ length: SPRITE_COLUMNS }, (_, column) => start + column);
}

export function copyRowAlignment(
  target: FrameAdjustment,
  reference: FrameAdjustment,
): FrameAdjustment {
  return {
    ...target,
    scale: reference.scale,
    offsetY: reference.offsetY,
    cropSize: reference.cropSize ?? SPRITE_FRAME_SIZE,
    sourceOffsetY: reference.sourceOffsetY ?? 0,
  };
}

function inspectAlphaRegion(
  pixels: PixelBuffer,
  originX: number,
  originY: number,
  frameSize: number,
  safeMargin: number,
): Omit<FrameInspection, 'frame'> {
  let left = frameSize;
  let top = frameSize;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const alpha = pixels.data[((originY + y) * pixels.width + originX + x) * 4 + 3];
      if (alpha <= SPRITE_ALPHA_THRESHOLD) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  const empty = right < 0;
  const bounds = empty ? null : { left, top, right, bottom };
  const unsafe = empty || unsafeFrameEdges(bounds, safeMargin, frameSize).length > 0;
  return { bounds, unsafe, empty };
}

export function unsafeFrameEdges(
  bounds: AlphaBounds | null,
  safeMargin = SPRITE_SAFE_MARGIN,
  frameSize = SPRITE_FRAME_SIZE,
): UnsafeFrameEdge[] {
  if (!bounds) return [];
  const edges: UnsafeFrameEdge[] = [];
  if (bounds.top < safeMargin) edges.push('top');
  if (bounds.right >= frameSize - safeMargin) edges.push('right');
  if (bounds.bottom >= frameSize - safeMargin) edges.push('bottom');
  if (bounds.left < safeMargin) edges.push('left');
  return edges;
}

export function inspectFramePixels(
  pixels: PixelBuffer,
  safeMargin = SPRITE_SAFE_MARGIN,
): Omit<FrameInspection, 'frame'> {
  if (pixels.width !== SPRITE_FRAME_SIZE || pixels.height !== SPRITE_FRAME_SIZE) {
    throw new Error('即時安全檢查需要 128×128 的單格預覽。');
  }
  return inspectAlphaRegion(pixels, 0, 0, SPRITE_FRAME_SIZE, safeMargin);
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
    return {
      frame,
      ...inspectAlphaRegion(
        pixels,
        rect.x,
        rect.y,
        SPRITE_FRAME_SIZE,
        safeMargin,
      ),
    };
  });
}

function connectedComponentsForRow(pixels: PixelBuffer, row: number): SpriteComponent[] {
  const rowTop = row * SPRITE_FRAME_SIZE;
  const rowPixels = pixels.width * SPRITE_FRAME_SIZE;
  const visited = new Uint8Array(rowPixels);
  const queue = new Int32Array(rowPixels);
  const components: SpriteComponent[] = [];

  for (let start = 0; start < rowPixels; start += 1) {
    const globalStart = rowTop * pixels.width + start;
    if (visited[start] || pixels.data[globalStart * 4 + 3] <= SPRITE_ALPHA_THRESHOLD) continue;

    let queueStart = 0;
    let queueEnd = 1;
    queue[0] = start;
    visited[start] = 1;
    const componentPixels: number[] = [];
    let left = pixels.width;
    let top = SPRITE_FRAME_SIZE;
    let right = -1;
    let bottom = -1;

    while (queueStart < queueEnd) {
      const current = queue[queueStart];
      queueStart += 1;
      const x = current % pixels.width;
      const localY = Math.floor(current / pixels.width);
      const globalPixel = (rowTop + localY) * pixels.width + x;
      componentPixels.push(globalPixel);
      left = Math.min(left, x);
      top = Math.min(top, rowTop + localY);
      right = Math.max(right, x);
      bottom = Math.max(bottom, rowTop + localY);

      const neighbors = [
        x > 0 ? current - 1 : -1,
        x + 1 < pixels.width ? current + 1 : -1,
        localY > 0 ? current - pixels.width : -1,
        localY + 1 < SPRITE_FRAME_SIZE ? current + pixels.width : -1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || visited[neighbor]) continue;
        const neighborGlobal = rowTop * pixels.width + neighbor;
        if (pixels.data[neighborGlobal * 4 + 3] <= SPRITE_ALPHA_THRESHOLD) continue;
        visited[neighbor] = 1;
        queue[queueEnd] = neighbor;
        queueEnd += 1;
      }
    }

    components.push({
      id: components.length,
      area: componentPixels.length,
      left,
      top,
      right,
      bottom,
      centerX: (left + right + 1) / 2,
      pixels: componentPixels,
    });
  }

  return components;
}

function automaticRowPlan(
  pixels: PixelBuffer,
  row: number,
  pixelOwners: Uint8Array,
  safeMargin: number,
): AutomaticRowPlan {
  const components = connectedComponentsForRow(pixels, row);
  const largestArea = Math.max(0, ...components.map((component) => component.area));
  const seedThreshold = Math.max(120, largestArea * 0.2);
  const seedCandidates = components
    .filter((component) => component.area >= seedThreshold)
    .sort((a, b) => b.area - a.area);
  if (seedCandidates.length < SPRITE_COLUMNS) {
    return {
      row,
      frames: [],
      scale: 1,
      error: `第 ${row + 1} 排只辨識到 ${seedCandidates.length} 個可分離角色，需要 8 個。`,
    };
  }

  const seeds = seedCandidates.slice(0, SPRITE_COLUMNS).sort((a, b) => a.centerX - b.centerX);
  const groups: SpriteComponent[][] = seeds.map((seed) => [seed]);
  const seedIds = new Set(seeds.map((seed) => seed.id));
  const noiseThreshold = Math.max(4, largestArea * 0.0005);
  for (const component of components) {
    if (seedIds.has(component.id) || component.area < noiseThreshold) continue;
    let nearest = 0;
    for (let index = 1; index < seeds.length; index += 1) {
      if (
        Math.abs(seeds[index].centerX - component.centerX) <
        Math.abs(seeds[nearest].centerX - component.centerX)
      ) {
        nearest = index;
      }
    }
    groups[nearest].push(component);
  }

  const geometries = groups.map((group, column) => {
    const left = Math.min(...group.map((component) => component.left));
    const top = Math.min(...group.map((component) => component.top));
    const right = Math.max(...group.map((component) => component.right));
    const bottom = Math.max(...group.map((component) => component.bottom));
    const lowerThreshold = top + (bottom - top + 1) * 0.72;
    const lowerPixels = group
      .flatMap((component) => component.pixels)
      .filter((pixel) => Math.floor(pixel / pixels.width) >= lowerThreshold);
    const anchorPixels = lowerPixels.length > 0
      ? lowerPixels
      : group.flatMap((component) => component.pixels);
    const sourceAnchorX = anchorPixels.reduce(
      (sum, pixel) => sum + (pixel % pixels.width),
      0,
    ) / anchorPixels.length;
    for (const component of group) {
      for (const pixel of component.pixels) pixelOwners[pixel] = row * SPRITE_COLUMNS + column + 1;
    }
    return {
      frame: row * SPRITE_COLUMNS + column,
      sourceBounds: { left, top, right, bottom },
      sourceAnchorX,
    };
  });

  const safeLeft = safeMargin;
  const safeRight = SPRITE_FRAME_SIZE - safeMargin;
  const safeTop = safeMargin;
  const safeBottom = SPRITE_FRAME_SIZE - safeMargin;
  const targetAnchorX = SPRITE_FRAME_SIZE / 2;
  const scaleLimits = [1];
  for (const geometry of geometries) {
    const { left, top, right, bottom } = geometry.sourceBounds;
    const height = bottom - top + 1;
    const leftExtent = geometry.sourceAnchorX - left;
    const rightExtent = right + 1 - geometry.sourceAnchorX;
    scaleLimits.push((safeBottom - safeTop) / height);
    if (leftExtent > 0) scaleLimits.push((targetAnchorX - safeLeft) / leftExtent);
    if (rightExtent > 0) scaleLimits.push((safeRight - targetAnchorX) / rightExtent);
  }
  const scale = Math.min(...scaleLimits);
  const frames = geometries.map((geometry) => {
    const sourceWidth = geometry.sourceBounds.right - geometry.sourceBounds.left + 1;
    const sourceHeight = geometry.sourceBounds.bottom - geometry.sourceBounds.top + 1;
    const outputWidth = Math.max(1, Math.floor(sourceWidth * scale));
    const outputHeight = Math.max(1, Math.floor(sourceHeight * scale));
    const rawLeft = Math.round(
      targetAnchorX - (geometry.sourceAnchorX - geometry.sourceBounds.left) * scale,
    );
    const outputLeft = Math.max(safeLeft, Math.min(safeRight - outputWidth, rawLeft));
    return {
      ...geometry,
      scale,
      outputLeft,
      outputTop: safeBottom - outputHeight,
      outputWidth,
      outputHeight,
    };
  });
  return { row, frames, scale };
}

export function detectAutomaticSpriteAlignment(
  pixels: PixelBuffer,
  safeMargin = SPRITE_SAFE_MARGIN,
): AutomaticSpriteAlignment {
  if (pixels.width !== 1024 || pixels.height !== 1536) {
    throw new Error('自動拆分需要 1024×1536 的標準圖集。');
  }
  const pixelOwners = new Uint8Array(pixels.width * pixels.height);
  const rows = Array.from({ length: SPRITE_ROWS }, (_, row) => (
    automaticRowPlan(pixels, row, pixelOwners, safeMargin)
  ));
  const errors = rows.flatMap((row) => row.error ? [row.error] : []);
  return { ok: errors.length === 0, rows, pixelOwners, errors };
}

export function composeAutomaticallyAlignedSpriteSheet(
  pixels: PixelBuffer,
  layout: AutomaticSpriteAlignment,
): HTMLCanvasElement {
  if (!layout.ok) throw new Error(layout.errors.join(' '));
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法建立自動對齊畫布。');
  context.imageSmoothingEnabled = true;

  for (const row of layout.rows) {
    for (const frame of row.frames) {
      const bounds = frame.sourceBounds;
      const sourceWidth = bounds.right - bounds.left + 1;
      const sourceHeight = bounds.bottom - bounds.top + 1;
      const crop = document.createElement('canvas');
      crop.width = sourceWidth;
      crop.height = sourceHeight;
      const cropContext = crop.getContext('2d');
      if (!cropContext) throw new Error('瀏覽器無法建立角色裁切畫布。');
      const image = cropContext.createImageData(sourceWidth, sourceHeight);
      for (let y = 0; y < sourceHeight; y += 1) {
        for (let x = 0; x < sourceWidth; x += 1) {
          const sourcePixel = (bounds.top + y) * pixels.width + bounds.left + x;
          if (layout.pixelOwners[sourcePixel] !== frame.frame + 1) continue;
          const sourceOffset = sourcePixel * 4;
          const targetOffset = (y * sourceWidth + x) * 4;
          image.data[targetOffset] = pixels.data[sourceOffset];
          image.data[targetOffset + 1] = pixels.data[sourceOffset + 1];
          image.data[targetOffset + 2] = pixels.data[sourceOffset + 2];
          image.data[targetOffset + 3] = pixels.data[sourceOffset + 3];
        }
      }
      cropContext.putImageData(image, 0, 0);
      const rect = frameRect(frame.frame);
      context.drawImage(
        crop,
        rect.x + frame.outputLeft,
        rect.y + frame.outputTop,
        frame.outputWidth,
        frame.outputHeight,
      );
    }
  }
  return canvas;
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
