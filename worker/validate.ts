export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ValidationResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

const MAX_TURNS = 10;
const MAX_CONTENT_LEN = 2000;

export function validateMessages(input: unknown): ValidationResult {
  if (!Array.isArray(input)) {
    return { ok: false, error: 'messages must be an array' };
  }
  if (input.length === 0) {
    return { ok: false, error: 'messages must not be empty' };
  }
  if (input.length > MAX_TURNS) {
    return { ok: false, error: `max ${MAX_TURNS} turns allowed` };
  }

  const messages: ChatMessage[] = [];
  for (let i = 0; i < input.length; i++) {
    const m = input[i];
    if (typeof m !== 'object' || m === null) {
      return { ok: false, error: `message ${i} must be an object` };
    }
    const { role, content } = m as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') {
      return { ok: false, error: `message ${i} role must be 'user' or 'assistant'` };
    }
    if (typeof content !== 'string') {
      return { ok: false, error: `message ${i} content must be a string` };
    }
    if (content.length === 0) {
      return { ok: false, error: `message ${i} content must not be empty` };
    }
    if (content.length > MAX_CONTENT_LEN) {
      return { ok: false, error: `message ${i} content exceeds ${MAX_CONTENT_LEN} chars` };
    }

    const expectedRole = i % 2 === 0 ? 'user' : 'assistant';
    if (role !== expectedRole) {
      return { ok: false, error: `messages must alternate user/assistant starting with user` };
    }

    messages.push({ role, content });
  }

  return { ok: true, messages };
}
