import { describe, expect, it } from 'vitest';
import { getAnimationFrames, getSpriteFramePosition } from '../src/loader/sprite-grid';

describe('getSpriteFramePosition', () => {
  it.each([
    [0, { column: 0, row: 0, xPercent: 0, yPercent: 0 }],
    [7, { column: 7, row: 0, xPercent: 100, yPercent: 0 }],
    [8, { column: 0, row: 1, xPercent: 0, yPercent: 100 / 11 }],
    [95, { column: 7, row: 11, xPercent: 100, yPercent: 100 }],
  ])('maps frame %s to the standard 8x12 atlas', (frame, expected) => {
    expect(getSpriteFramePosition(frame)).toEqual(expected);
  });

  it('clamps out-of-range frame numbers before reading the atlas', () => {
    expect(getSpriteFramePosition(999)).toEqual(getSpriteFramePosition(95));
    expect(getSpriteFramePosition(-20)).toEqual(getSpriteFramePosition(0));
  });
});

describe('getAnimationFrames', () => {
  it('returns eight continuous frames for every named animation row', () => {
    expect(getAnimationFrames('idle')).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(getAnimationFrames('walk-right')).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    expect(getAnimationFrames('shy')).toEqual([80, 81, 82, 83, 84, 85, 86, 87]);
    expect(getAnimationFrames('turn')).toEqual([88, 89, 90, 91, 92, 93, 94, 95]);
  });
});
