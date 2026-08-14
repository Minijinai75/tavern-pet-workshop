import { describe, expect, it } from 'vitest';
import {
  analyzeSpriteFrames,
  copyRowAlignment,
  detectAutomaticSpriteAlignment,
  fitBoundsIntoSafeArea,
  frameRect,
  inspectFramePixels,
  rowFrameIndexes,
  sourceRectForFrame,
  unsafeFrameEdges,
} from '../src/sprite-calibrator';

function paintAlphaRect(
  data: Uint8ClampedArray,
  width: number,
  left: number,
  top: number,
  rectWidth: number,
  rectHeight: number,
): void {
  for (let y = top; y < top + rectHeight; y += 1) {
    for (let x = left; x < left + rectWidth; x += 1) {
      const offset = (y * width + x) * 4;
      data[offset] = 32;
      data[offset + 1] = 48;
      data[offset + 2] = 64;
      data[offset + 3] = 255;
    }
  }
}

function unevenSpriteSheet(): { data: Uint8ClampedArray; width: number; height: number } {
  const width = 1024;
  const height = 1536;
  const data = new Uint8ClampedArray(width * height * 4);
  const lefts = [18, 143, 270, 393, 521, 648, 774, 907];
  for (let row = 0; row < 12; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const left = lefts[column];
      const top = row * 128 + 20;
      paintAlphaRect(data, width, left, top, 86, 94);
      paintAlphaRect(data, width, left + 89, top + 28, 5, 5);
    }
  }
  return { data, width, height };
}

describe('sprite frame calibration', () => {
  it('maps all 96 frames to exact 128x128 source rectangles', () => {
    expect(frameRect(0)).toEqual({ x: 0, y: 0, width: 128, height: 128 });
    expect(frameRect(9)).toEqual({ x: 128, y: 128, width: 128, height: 128 });
    expect(frameRect(95)).toEqual({ x: 896, y: 1408, width: 128, height: 128 });
  });

  it('flags alpha content that enters the 8px safety margin of its own cell', () => {
    const width = 1024;
    const height = 1536;
    const data = new Uint8ClampedArray(width * height * 4);
    data[(40 * width + 2) * 4 + 3] = 255;
    data[(50 * width + 128 + 64) * 4 + 3] = 255;

    const inspections = analyzeSpriteFrames({ data, width, height });
    expect(inspections).toHaveLength(96);
    expect(inspections[0]).toMatchObject({ frame: 0, unsafe: true });
    expect(inspections[1]).toMatchObject({ frame: 1, unsafe: false });
  });

  it('reports the exact live overflow edge and ignores imperceptible alpha fringe', () => {
    const width = 128;
    const height = 128;
    const data = new Uint8ClampedArray(width * height * 4);
    paintAlphaRect(data, width, 12, 10, 100, 108);
    data[(64 * width + 2) * 4 + 3] = 8;

    const safe = inspectFramePixels({ data, width, height });
    expect(safe.unsafe).toBe(false);

    data[(2 * width + 64) * 4 + 3] = 255;
    const overflowing = inspectFramePixels({ data, width, height });
    expect(overflowing.unsafe).toBe(true);
    expect(unsafeFrameEdges(overflowing.bounds)).toEqual(['top']);
  });

  it('calculates a centered scale and translation that fits visible pixels in the safe area', () => {
    const adjustment = fitBoundsIntoSafeArea({ left: 0, top: 4, right: 127, bottom: 127 });
    expect(adjustment.scale).toBeLessThan(1);
    expect(Number.isFinite(adjustment.offsetX)).toBe(true);
    expect(Number.isFinite(adjustment.offsetY)).toBe(true);
  });

  it('can move the source crop across the old 128px cell boundary to recover clipped pixels', () => {
    expect(sourceRectForFrame(9, {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      sourceOffsetX: -18,
      sourceOffsetY: 12,
      cropSize: 156,
    })).toEqual({ x: 96, y: 126, width: 156, height: 156 });
  });

  it('keeps the old exact-cell crop as the default', () => {
    expect(sourceRectForFrame(9, { scale: 1, offsetX: 0, offsetY: 0 })).toEqual({
      x: 128,
      y: 128,
      width: 128,
      height: 128,
    });
  });

  it('returns the eight frames in the selected animation row', () => {
    expect(rowFrameIndexes(19)).toEqual([16, 17, 18, 19, 20, 21, 22, 23]);
  });

  it('copies size and vertical alignment across a row without destroying per-frame horizontal crops', () => {
    const target = {
      scale: 0.8,
      offsetX: 17,
      offsetY: -4,
      cropSize: 128,
      sourceOffsetX: -13,
      sourceOffsetY: 6,
    };
    const reference = {
      scale: 0.92,
      offsetX: 2,
      offsetY: 11,
      cropSize: 164,
      sourceOffsetX: 9,
      sourceOffsetY: -18,
    };
    expect(copyRowAlignment(target, reference)).toEqual({
      scale: 0.92,
      offsetX: 17,
      offsetY: 11,
      cropSize: 164,
      sourceOffsetX: -13,
      sourceOffsetY: -18,
    });
  });

  it('detects eight unevenly spaced sprites per row without trusting the old 128px columns', () => {
    const pixels = unevenSpriteSheet();
    const layout = detectAutomaticSpriteAlignment(pixels);

    expect(layout.ok).toBe(true);
    expect(layout.rows).toHaveLength(12);
    expect(layout.rows.every((row) => row.frames.length === 8)).toBe(true);
    for (const row of layout.rows) {
      expect(new Set(row.frames.map((frame) => frame.scale)).size).toBe(1);
      for (const frame of row.frames) {
        expect(frame.outputLeft).toBeGreaterThanOrEqual(8);
        expect(frame.outputTop).toBeGreaterThanOrEqual(8);
        expect(frame.outputLeft + frame.outputWidth).toBeLessThanOrEqual(120);
        expect(frame.outputTop + frame.outputHeight).toBeLessThanOrEqual(120);
      }
    }

    const detachedPixel = 48 * pixels.width + 107;
    expect(layout.pixelOwners[detachedPixel]).toBe(1);
  });
});
