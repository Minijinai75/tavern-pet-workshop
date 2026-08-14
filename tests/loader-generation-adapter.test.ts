import { describe, expect, it, vi } from 'vitest';
import { createGenerationAdapter, getTavernIdentity } from '../src/loader/st-adapter';

describe('getTavernIdentity', () => {
  it('uses the avatar filename as a stable character key and isolates the chat key', () => {
    expect(
      getTavernIdentity({
        characterId: 3,
        chatId: 'stale-snapshot',
        getCurrentChatId: () => '2026-08-14-story',
        name1: 'Mini',
        name2: '景和',
        characters: {
          3: { name: '景和', avatar: 'jinghe.png' },
        },
      }),
    ).toEqual({
      characterKey: 'avatar:jinghe.png',
      characterName: '景和',
      chatKey: 'chat:2026-08-14-story',
      userName: 'Mini',
    });
  });
});

describe('createGenerationAdapter', () => {
  it('uses the current Tavern API silently and never exposes a SEND operation', async () => {
    const generate = vi.fn().mockResolvedValue({ content: '  目前連線生成的內容  ' });
    const adapter = createGenerationAdapter({
      getContext: () => ({}),
      findApi: (name) => (name === 'generate' ? generate : undefined),
    });

    const result = await adapter.generateText({
      mode: 'current',
      profileId: '',
      prompt: '測試 Prompt',
      maxChatHistory: 7,
    });

    expect(result).toEqual({ text: '目前連線生成的內容', source: 'current' });
    expect(generate).toHaveBeenCalledWith({
      user_input: '測試 Prompt',
      should_stream: false,
      should_silence: true,
      max_chat_history: 7,
    });
    expect('send' in adapter).toBe(false);
  });

  it('uses only the selected existing profile id through profile-genstream', async () => {
    const triggerSlash = vi.fn().mockResolvedValue('指定連線內容');
    const adapter = createGenerationAdapter({
      getContext: () => ({
        extensionSettings: {
          connectionManager: {
            profiles: [{ id: 'writer', name: '寫作', model: 'model-a', apiKey: 'SECRET' }],
          },
        },
      }),
      findApi: (name) => (name === 'triggerSlash' ? triggerSlash : undefined),
    });

    const result = await adapter.generateText({
      mode: 'profile',
      profileId: 'writer',
      prompt: '番外 Prompt',
      maxChatHistory: 3,
    });

    expect(result).toEqual({ text: '指定連線內容', source: 'profile:writer' });
    const command = triggerSlash.mock.calls[0]?.[0] as string;
    expect(command).toContain('/profile-genstream profile="writer"');
    expect(command).toContain('"番外 Prompt"');
    expect(command).not.toContain('SECRET');
  });
});
