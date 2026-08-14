import { describe, expect, it } from 'vitest';
import {
  analyzeSpriteFrames,
  fitBoundsIntoSafeArea,
  frameRect,
  sourceRectForFrame,
} from '../src/sprite-calibrator';

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
});
