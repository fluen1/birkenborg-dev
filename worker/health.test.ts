import { describe, it, expect } from 'vitest';
import type { KVNamespace } from '@cloudflare/workers-types';

// /api/chat/health — let-vægts probe som chat-badgen bruger ved page-load.
// Spejler disabled-checken i handleChat, men uden Anthropic-kald.

const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

function baseEnv(overrides: Record<string, unknown> = {}) {
  return {
    ASSETS: { fetch: async () => new Response('', { status: 404 }) } as Fetcher,
    CHAT_STATE: {} as KVNamespace,
    ANTHROPIC_API_KEY: 'sk-test',
    IP_HASH_SALT: 'salt',
    BOT_INTERNAL_TOKEN: 'tok',
    ...overrides,
  };
}

describe('/api/chat/health', () => {
  it('returnerer online når chatten ikke er disabled', async () => {
    const { default: worker } = await import('./index');
    const req = new Request('https://birkenborg.dev/api/chat/health');
    const res = await worker.fetch!(req, baseEnv() as never, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const data = await res.json() as { status: string };
    expect(data.status).toBe('online');
  });

  it('returnerer disabled når CHAT_DISABLED=1', async () => {
    const { default: worker } = await import('./index');
    const req = new Request('https://birkenborg.dev/api/chat/health');
    const res = await worker.fetch!(req, baseEnv({ CHAT_DISABLED: '1' }) as never, ctx);
    expect(res.status).toBe(200);
    const data = await res.json() as { status: string };
    expect(data.status).toBe('disabled');
  });
});
