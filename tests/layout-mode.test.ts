import { describe, expect, it } from 'vitest';

import { applyLayoutMode, getLayoutLabel } from '../src/layout-mode';

describe('applyLayoutMode', () => {
  it('marks a narrow viewport as mobile mode', () => {
    const root = { dataset: {} as Record<string, string> };

    applyLayoutMode(root, true);

    expect(root.dataset.layout).toBe('mobile');
  });

  it('marks a wider viewport as desktop mode', () => {
    const root = { dataset: {} as Record<string, string> };

    applyLayoutMode(root, false);

    expect(root.dataset.layout).toBe('desktop');
  });

  it('uses a clear label for the active preview mode', () => {
    expect(getLayoutLabel('mobile')).toBe('手機版');
    expect(getLayoutLabel('desktop')).toBe('桌面版');
  });
});
