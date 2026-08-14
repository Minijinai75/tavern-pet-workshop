// @vitest-environment jsdom
/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';

describe('workshop sprite alignment controls', () => {
  it('offers one-click row detection instead of requiring 96 manual crops', () => {
    document.documentElement.innerHTML = html;

    const button = document.querySelector<HTMLButtonElement>('#auto-align-rows');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('一鍵自動辨識並對齊');
    expect(document.querySelector('#auto-alignment-report')).not.toBeNull();
    expect(document.querySelector('#frame-live-status')).not.toBeNull();
    expect(document.querySelector('.calibrator-limit')?.textContent).toContain('整張圖需要回 GPT 重生');
  });
});
