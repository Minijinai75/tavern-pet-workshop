export interface TavernChatMessage {
  is_user?: boolean;
  name?: unknown;
  mes?: unknown;
  [key: string]: unknown;
}

function clippedText(value: unknown, maximum: number): string {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maximum ? `${text.slice(0, maximum)}…` : text;
}

export function buildFeaturePrompt(input: {
  packPrompt: string;
  promptOverride: string;
  recentMessages: number;
  chat: TavernChatMessage[];
  userName: string;
  characterName: string;
}): string {
  const basePrompt = input.promptOverride.trim() || input.packPrompt.trim();
  const summary = summarizeRecentConversation(
    input.chat,
    input.recentMessages,
    input.userName,
    input.characterName,
  );
  if (!summary.preview) return basePrompt;
  const budgetedContext =
    summary.preview.length > 12_000 ? `…${summary.preview.slice(-12_000)}` : summary.preview;
  return `${basePrompt}\n\n最近對話（由舊到新）：\n${budgetedContext}`;
}

export interface ConversationSummary {
  messageCount: number;
  characterCount: number;
  preview: string;
}

export function summarizeRecentConversation(
  chat: TavernChatMessage[],
  recentMessages: number,
  userName: string,
  characterName: string,
): ConversationSummary {
  const count = Math.min(50, Math.max(0, Math.round(recentMessages)));
  if (count === 0) return { messageCount: 0, characterCount: 0, preview: '' };
  const lines = chat
    .slice(-count)
    .map((message) => {
      const content = clippedText(message.mes, 1_200);
      if (!content) return '';
      const fallbackName = message.is_user ? userName : characterName;
      const name = clippedText(message.name, 80) || fallbackName;
      return `${name}：${content}`;
    })
    .filter(Boolean);
  const preview = lines.join('\n');
  return {
    messageCount: lines.length,
    characterCount: preview.length,
    preview,
  };
}
