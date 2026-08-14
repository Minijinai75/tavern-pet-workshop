import { describe, expect, it, vi } from 'vitest';

import { releaseDownloadUrlLater } from '../src/download';

describe('releaseDownloadUrlLater', () => {
  it('keeps the object URL alive long enough for the browser to start downloading', () => {
    const revoke = vi.fn();
    const schedule = vi.fn((callback: () => void, delay: number) => {
      expect(delay).toBeGreaterThanOrEqual(60_000);
      callback();
      return 1;
    });

    releaseDownloadUrlLater('blob:pet-pack', revoke, schedule);

    expect(schedule).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:pet-pack');
  });
});
