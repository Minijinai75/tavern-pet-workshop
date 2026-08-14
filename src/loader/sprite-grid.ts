export type ResidentAnimation =
  | 'idle'
  | 'walk-right'
  | 'walk-left'
  | 'settle'
  | 'glasses'
  | 'guard'
  | 'affection'
  | 'celebrate'
  | 'sad'
  | 'sleep'
  | 'shy'
  | 'turn';

const ROW_BY_ANIMATION: Record<ResidentAnimation, number> = {
  idle: 0,
  'walk-right': 1,
  'walk-left': 2,
  settle: 3,
  glasses: 4,
  guard: 5,
  affection: 6,
  celebrate: 7,
  sad: 8,
  sleep: 9,
  shy: 10,
  turn: 11,
};

export function getAnimationFrames(animation: ResidentAnimation): number[] {
  const start = ROW_BY_ANIMATION[animation] * 8;
  return Array.from({ length: 8 }, (_value, index) => start + index);
}

export function getSpriteFramePosition(frame: number): {
  column: number;
  row: number;
  xPercent: number;
  yPercent: number;
} {
  const safeFrame = Math.min(95, Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0)));
  const column = safeFrame % 8;
  const row = Math.floor(safeFrame / 8);
  return {
    column,
    row,
    xPercent: (column / 7) * 100,
    yPercent: (row / 11) * 100,
  };
}
