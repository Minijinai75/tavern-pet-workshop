import { describe, expect, it } from 'vitest';
import { createGptImagePrompt } from '../src/image-prompt';

describe('createGptImagePrompt', () => {
  it('asks GPT to convert an uploaded reference into the exact legacy 8x12 atlas', () => {
    const prompt = createGptImagePrompt({
      displayName: '自訂角色',
      referenceNotes: '保留黑色耳釘與深色襯衫，不要增加其他配件。',
    });

    expect(prompt).toContain('我上傳的角色參考圖片作為唯一角色外觀參考');
    expect(prompt).toContain('自訂角色');
    expect(prompt).toContain('保留黑色耳釘與深色襯衫，不要增加其他配件。');
    expect(prompt).toContain('1024×1536');
    expect(prompt).toContain('8欄×12列，共96格');
    expect(prompt).toContain('每格必須正好是128×128像素');
    expect(prompt).toContain('每格四周至少保留8像素完全透明的安全距離');
    expect(prompt).toContain('完整且彼此分離的角色區塊');
    expect(prompt).toContain('至少12像素完全透明的垂直間隔');
    expect(prompt).toContain('網站會自動辨識並重新組成精確的128×128格子');
    expect(prompt).toContain('不要為了硬塞格線而裁掉');
    expect(prompt).toContain('第12排');
    expect(prompt).toContain('請只輸出完整的透明 Sprite Sheet PNG');
  });

  it('works from the uploaded reference even without extra notes', () => {
    const prompt = createGptImagePrompt({ displayName: '', referenceNotes: '' });
    expect(prompt).toContain('角色名稱／版本：未命名角色');
    expect(prompt).toContain('額外固定要求：無，請忠實保留參考圖。');
  });
});
