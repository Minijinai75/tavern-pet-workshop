export interface ConnectionProfileSummary {
  id: string;
  name: string;
  api: string;
  model: string;
}

export interface TavernIdentity {
  characterKey: string;
  characterName: string;
  chatKey: string;
  userName: string;
}

type UnknownFunction = (...args: never[]) => unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, maximum = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

export function extractConnectionProfiles(context: unknown): ConnectionProfileSummary[] {
  if (!isRecord(context)) return [];
  const extensionSettings = context.extensionSettings;
  if (!isRecord(extensionSettings)) return [];
  const connectionManager = extensionSettings.connectionManager;
  if (!isRecord(connectionManager) || !Array.isArray(connectionManager.profiles)) return [];

  return connectionManager.profiles.flatMap((profile): ConnectionProfileSummary[] => {
    if (!isRecord(profile)) return [];
    const id = safeString(profile.id);
    const name = safeString(profile.name) || id;
    if (!id || !name) return [];
    return [
      {
        id,
        name,
        api: safeString(profile.api),
        model: safeString(profile.model),
      },
    ];
  });
}

function recordValue(record: Record<string, unknown>, key: unknown): unknown {
  if (typeof key !== 'string' && typeof key !== 'number') return undefined;
  const collection = record.characters;
  if (Array.isArray(collection)) return collection[Number(key)];
  if (isRecord(collection)) return collection[String(key)];
  return undefined;
}

export function getTavernIdentity(context: unknown): TavernIdentity | null {
  if (!isRecord(context)) return null;
  const character = recordValue(context, context.characterId);
  const directCharacter = isRecord(context.character) ? context.character : undefined;
  const resolvedCharacter = isRecord(character) ? character : directCharacter;
  const data = resolvedCharacter && isRecord(resolvedCharacter.data) ? resolvedCharacter.data : undefined;
  const characterName =
    safeString(context.name2) ||
    safeString(resolvedCharacter?.name) ||
    safeString(data?.name);
  if (!characterName) return null;

  const avatar = safeString(resolvedCharacter?.avatar) || safeString(data?.avatar);
  const rawCharacterId = context.characterId;
  const characterKey = avatar
    ? `avatar:${avatar}`
    : rawCharacterId !== undefined && rawCharacterId !== null
      ? `character-id:${String(rawCharacterId)}`
      : `name:${characterName}`;
  const chatMetadata = isRecord(context.chatMetadata)
    ? context.chatMetadata
    : isRecord(context.chat_metadata)
      ? context.chat_metadata
      : undefined;
  let liveChatId = '';
  if (typeof context.getCurrentChatId === 'function') {
    try {
      liveChatId = safeString((context.getCurrentChatId as () => unknown)());
    } catch {
      liveChatId = '';
    }
  }
  const rawChatKey =
    liveChatId ||
    safeString(context.chatId) ||
    safeString(context.chatFile) ||
    safeString(context.chat_file) ||
    safeString(chatMetadata?.chatId) ||
    safeString(chatMetadata?.chat_id) ||
    'current';

  return {
    characterKey,
    characterName,
    chatKey: `chat:${rawChatKey}`,
    userName: safeString(context.name1) || 'USER',
  };
}

function defaultFindApi(name: string): unknown {
  const current = globalThis as Record<string, unknown>;
  if (name in current) return current[name];
  try {
    const parent = globalThis.top as unknown as Record<string, unknown> | null;
    return parent?.[name];
  } catch {
    return undefined;
  }
}

function callable(value: unknown): UnknownFunction | undefined {
  return typeof value === 'function' ? (value as UnknownFunction) : undefined;
}

function cleanGeneratedText(value: unknown): string {
  let text = '';
  if (typeof value === 'string') text = value;
  else if (isRecord(value)) {
    text = safeString(value.content, 20_000) || safeString(value.text, 20_000);
  }
  text = text
    .trim()
    .replace(/^```(?:markdown|text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  if (!text) throw new Error('酒館沒有回傳文字，請檢查生成連線。');
  return text.slice(0, 12_000);
}

function slashQuote(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function createGenerationAdapter(options: {
  getContext: () => unknown;
  findApi?: (name: string) => unknown;
}) {
  const findApi = options.findApi ?? defaultFindApi;
  return {
    async generateText(input: {
      mode: 'current' | 'profile';
      profileId: string;
      prompt: string;
      maxChatHistory: number;
    }): Promise<{ text: string; source: string }> {
      const context = options.getContext();
      if (input.mode === 'profile') {
        const profile = extractConnectionProfiles(context).find((item) => item.id === input.profileId);
        if (!profile) throw new Error('找不到指定的酒館連線設定檔。');
        const triggerSlash = callable(findApi('triggerSlash'));
        if (!triggerSlash) throw new Error('酒館指令介面目前無法使用。');
        const command = [
          '/profile-genstream',
          `profile=${slashQuote(profile.id)}`,
          'reasoning=false',
          'stop=true',
          slashQuote(input.prompt),
        ].join(' ');
        const result = await triggerSlash(command as never);
        return { text: cleanGeneratedText(result), source: `profile:${profile.id}` };
      }

      const generate = callable(findApi('generate'));
      if (generate) {
        const result = await generate({
          user_input: input.prompt,
          should_stream: false,
          should_silence: true,
          max_chat_history: Math.max(0, Math.min(50, Math.round(input.maxChatHistory))),
        } as never);
        return { text: cleanGeneratedText(result), source: 'current' };
      }

      const current = isRecord(context) ? context : {};
      const quiet = callable(current.generateQuietPrompt) ?? callable(findApi('generateQuietPrompt'));
      if (!quiet) throw new Error('找不到酒館生成介面，請確認目前連線或 TavernHelper。');
      const result = await quiet({ quietPrompt: input.prompt, removeReasoning: true } as never);
      return { text: cleanGeneratedText(result), source: 'current' };
    },
  };
}
