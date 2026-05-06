import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleChat, type ChatEnv } from './chat';
import { createMockKV, type MockKV } from './test-helpers';

const VALID_BODY = JSON.stringify({
  messages: [{ role: 'user', content: 'hej' }],
});

function makeEnv(overrides: Partial<ChatEnv> & { CHAT_STATE?: MockKV } = {}): ChatEnv {
  const kv: MockKV = overrides.CHAT_STATE ?? createMockKV();
  return {
    CHAT_STATE: kv,
    ANTHROPIC_API_KEY: 'sk-test',
    IP_HASH_SALT: 'salt-test',
    CHAT_DISABLED: undefined,
    DAILY_CAP: undefined,
    CHAT_MODEL: undefined,
    ...overrides,
    CHAT_STATE: kv,
  };
}

function makeReq(body = VALID_BODY, ip = '1.2.3.4', method = 'POST'): Request {
  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': ip,
    },
  };
  if (method === 'POST') init.body = body;
  return new Request('https://birkenborg.dev/api/chat', init);
}

function makeCtx(): ExecutionContext {
  return {
    waitUntil: vi.fn((p: Promise<unknown>) => { void p; }),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext;
}

function mockAnthropicSuccess(): void {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: message_start\ndata: {}\n\n'));
      controller.close();
    },
  });
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
  );
}

describe('handleChat', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('afviser non-POST → 405', async () => {
    const res = await handleChat(makeReq(VALID_BODY, '1.2.3.4', 'GET'), makeEnv(), makeCtx());
    expect(res.status).toBe(405);
  });

  it('CHAT_DISABLED=1 → 503', async () => {
    const res = await handleChat(makeReq(), makeEnv({ CHAT_DISABLED: '1' }), makeCtx());
    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('disabled');
  });

  it('valid request → 200 + event-stream + waitUntil triggered', async () => {
    mockAnthropicSuccess();
    const ctx = makeCtx();
    const res = await handleChat(makeReq(), makeEnv(), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);
  });

  it('valid request kalder Anthropic med korrekt body', async () => {
    mockAnthropicSuccess();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await handleChat(makeReq(), makeEnv(), makeCtx());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.stream).toBe(true);
    expect(body.system[0].cache_control.type).toBe('ephemeral');
    expect(body.messages).toEqual([{ role: 'user', content: 'hej' }]);
  });

  it('respekterer CHAT_MODEL env', async () => {
    mockAnthropicSuccess();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await handleChat(makeReq(), makeEnv({ CHAT_MODEL: 'claude-sonnet-4-6' }), makeCtx());
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.model).toBe('claude-sonnet-4-6');
  });

  it('invalid JSON body → 400', async () => {
    const req = new Request('https://birkenborg.dev/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' },
      body: 'not json',
    });
    const res = await handleChat(req, makeEnv(), makeCtx());
    expect(res.status).toBe(400);
  });

  it('messages > 10 turns → 400', async () => {
    const messages = Array.from({ length: 11 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x',
    }));
    const res = await handleChat(
      makeReq(JSON.stringify({ messages })),
      makeEnv(),
      makeCtx(),
    );
    expect(res.status).toBe(400);
  });

  it('content > 2000 tegn → 400', async () => {
    const res = await handleChat(
      makeReq(JSON.stringify({ messages: [{ role: 'user', content: 'a'.repeat(2001) }] })),
      makeEnv(),
      makeCtx(),
    );
    expect(res.status).toBe(400);
  });

  it('rate limit hit → 429 med retryAfterSeconds', async () => {
    mockAnthropicSuccess();
    const kv = createMockKV();
    const env = makeEnv({ CHAT_STATE: kv });

    // Kør én request for at lære den deterministiske ipHash
    const ctx0 = makeCtx();
    await handleChat(makeReq(), env, ctx0);
    // Vent på at incrementCounters faktisk skriver til KV
    await Promise.all(
      (ctx0.waitUntil as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]),
    );
    const hashKey = Array.from(kv._store.keys()).find(k => k.startsWith('rl:'));
    expect(hashKey).toBeDefined();
    const ipHash = hashKey!.split(':')[1]!;
    const HOUR = Math.floor(Date.now() / 3600_000);
    kv._store.set(`rl:${ipHash}:${HOUR}`, '20');

    const res = await handleChat(makeReq(), env, makeCtx());
    expect(res.status).toBe(429);
    const body = await res.json() as { error: string; retryAfterSeconds: number };
    expect(body.error).toBe('rate_limit');
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('daily cap hit → 503', async () => {
    const kv = createMockKV();
    const today = new Date().toISOString().slice(0, 10);
    kv._store.set(`cap:${today}`, '500');
    const res = await handleChat(makeReq(), makeEnv({ CHAT_STATE: kv }), makeCtx());
    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('daily_cap');
  });

  it('Anthropic 5xx → 502, INGEN counter-incr', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }));
    const ctx = makeCtx();
    const kv = createMockKV();
    const res = await handleChat(makeReq(), makeEnv({ CHAT_STATE: kv }), ctx);
    expect(res.status).toBe(502);
    expect(ctx.waitUntil).not.toHaveBeenCalled();
  });

  it('Anthropic fetch throws → 502', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const res = await handleChat(makeReq(), makeEnv(), makeCtx());
    expect(res.status).toBe(502);
  });

  it('KV read failure → 503 (fail-closed)', async () => {
    const kv = createMockKV();
    kv._shouldThrowOnRead = true;
    const res = await handleChat(makeReq(), makeEnv({ CHAT_STATE: kv }), makeCtx());
    expect(res.status).toBe(503);
  });

  it('KV write failure ved counter-incr → request lykkes alligevel (fail-open)', async () => {
    mockAnthropicSuccess();
    const kv = createMockKV();
    kv._shouldThrowOnWrite = true;
    const ctx = makeCtx();
    const res = await handleChat(makeReq(), makeEnv({ CHAT_STATE: kv }), ctx);
    expect(res.status).toBe(200);
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);
  });

  it('forskellige IPs får separate rate-limit counters', async () => {
    mockAnthropicSuccess();
    const kv = createMockKV();
    const env = makeEnv({ CHAT_STATE: kv });

    const ctx1 = makeCtx();
    const ctx2 = makeCtx();
    await handleChat(makeReq(VALID_BODY, '1.1.1.1'), env, ctx1);
    await handleChat(makeReq(VALID_BODY, '2.2.2.2'), env, ctx2);

    // Hent waitUntil-promiser så incrementCounters faktisk afsluttes
    await Promise.all([
      ...(ctx1.waitUntil as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]),
      ...(ctx2.waitUntil as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]),
    ]);

    const ipKeys = Array.from(kv._store.keys()).filter(k => k.startsWith('rl:'));
    const distinctHashes = new Set(ipKeys.map(k => k.split(':')[1]));
    expect(distinctHashes.size).toBe(2);
  });
});
