import type { KVNamespace } from '@cloudflare/workers-types';
import { validateMessages } from './validate';
import { checkRateLimit, incrementCounters } from './rate-limit';
import { buildSystemPrompt, type CorpusPost } from './persona';
import corpusData from './data/chat-corpus.json';

export interface ChatEnv {
  CHAT_STATE: KVNamespace;
  ANTHROPIC_API_KEY: string;
  IP_HASH_SALT: string;
  CHAT_DISABLED?: string;
  DAILY_CAP?: string;
  CHAT_MODEL?: string;
}

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_DAILY_CAP = 500;
const MAX_OUTPUT_TOKENS = 800;

const CORPUS = corpusData as CorpusPost[];
let cachedSystemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (cachedSystemPrompt === null) {
    cachedSystemPrompt = buildSystemPrompt(CORPUS);
  }
  return cachedSystemPrompt;
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${ip}`);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function jsonError(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function handleChat(
  req: Request,
  env: ChatEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (env.CHAT_DISABLED === '1') {
    return jsonError(503, { error: 'disabled', message: 'Chatten er midlertidigt slået fra.' });
  }

  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
  let ipHash: string;
  try {
    ipHash = await hashIp(ip, env.IP_HASH_SALT);
  } catch {
    return jsonError(503, { error: 'internal', message: 'Chatten er midlertidigt utilgængelig' });
  }

  const dailyCap = env.DAILY_CAP ? parseInt(env.DAILY_CAP, 10) : DEFAULT_DAILY_CAP;
  const now = new Date();

  let rateCheck: Awaited<ReturnType<typeof checkRateLimit>>;
  try {
    rateCheck = await checkRateLimit(env.CHAT_STATE, ipHash, now, dailyCap);
  } catch (e) {
    console.error('rate_limit_read_failed', e);
    return jsonError(503, { error: 'internal', message: 'Chatten er midlertidigt utilgængelig' });
  }

  if (!rateCheck.allowed) {
    if (rateCheck.reason === 'per_ip') {
      return jsonError(429, {
        error: 'rate_limit',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }
    return jsonError(503, { error: 'daily_cap' });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError(400, { error: 'invalid_json' });
  }

  const messagesField = (payload as { messages?: unknown })?.messages;
  const validation = validateMessages(messagesField);
  if (!validation.ok) {
    return jsonError(400, { error: 'validation', message: validation.error });
  }

  const model = env.CHAT_MODEL ?? DEFAULT_MODEL;
  const anthropicReq = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    system: [
      {
        type: 'text',
        text: getSystemPrompt(),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: validation.messages,
  };

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicReq),
    });
  } catch (e) {
    console.error('anthropic_fetch_failed', e);
    return jsonError(502, { error: 'upstream' });
  }

  if (!upstream.ok || !upstream.body) {
    console.error('anthropic_status', upstream.status);
    return jsonError(502, { error: 'upstream' });
  }

  ctx.waitUntil(
    incrementCounters(env.CHAT_STATE, ipHash, now).catch(e => {
      console.error('rate_limit_write_failed', e);
    }),
  );

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
    },
  });
}
