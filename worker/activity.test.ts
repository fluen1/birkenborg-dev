import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Cloudflare Cache API (not available in Node test environment)
const mockCache = {
  match: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(globalThis, 'caches', {
  value: { default: mockCache },
  writable: true,
  configurable: true,
});

describe('/api/activity events array', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCache.match.mockResolvedValue(undefined);
    mockCache.put.mockResolvedValue(undefined);
  });

  it('returnerer events-array med commits og skrifter merged + sorteret efter ts desc', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes('api.github.com/users/fluen1/events/public')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (u.includes('api.github.com/repos/fluen1/birkenborg-dev/commits')) {
        return new Response(JSON.stringify([
          {
            sha: 'abc',
            commit: {
              message: 'feat(site): Marginalia-komponent',
              author: { date: '2026-05-09T14:00:00Z' },
            },
            html_url: 'https://github.com/fluen1/birkenborg-dev/commit/abc',
          },
        ]), { status: 200 });
      }
      if (u.includes('bot.birkenborg.dev/internal/inbox')) {
        return new Response(JSON.stringify({ messages: [] }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });

    const { default: worker } = await import('./index');
    const env = {
      ASSETS: {
        fetch: async (req: Request) => {
          if (req.url.includes('_corpus.json')) {
            return new Response(JSON.stringify([
              { slug: 'foo', title: 'Foo skrift', publish_at: '2026-05-08T10:00:00Z' },
            ]), { status: 200 });
          }
          return new Response('', { status: 404 });
        },
      } as Fetcher,
      CHAT_STATE: {} as KVNamespace,
      ANTHROPIC_API_KEY: 'sk-test',
      IP_HASH_SALT: 'salt',
      BOT_INTERNAL_TOKEN: 'tok',
    };
    const ctx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext;

    const req = new Request('https://birkenborg.dev/api/activity');
    const res = await worker.fetch!(req, env as never, ctx);
    expect(res.status).toBe(200);
    const data = await res.json() as { events: Array<{ type: string; ts: number; text: string; icon: string }> };
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
    const types = new Set(data.events.map(e => e.type));
    expect(types.has('commit')).toBe(true);
    expect(types.has('skrift')).toBe(true);
    for (let i = 1; i < data.events.length; i++) {
      expect(data.events[i - 1].ts).toBeGreaterThanOrEqual(data.events[i].ts);
    }
  });

  it("inkluderer highlights øverst i events-array (uafhængigt af ts)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("api.github.com/users/fluen1/events/public")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/commits")) {
        return new Response(JSON.stringify([
          {
            sha: "abc",
            commit: { message: "feat: ny feature", author: { date: "2026-05-09T14:00:00Z" } },
            html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc",
          },
        ]), { status: 200 });
      }
      if (u.includes("bot.birkenborg.dev/internal/inbox")) {
        return new Response(JSON.stringify({ messages: [] }), { status: 200 });
      }
      if (u.includes("bot.birkenborg.dev/internal/highlights")) {
        return new Response(JSON.stringify({
          highlights: [
            { ts: 1746000000, text: "ÆLDRE highlight" },
          ],
        }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const { default: worker } = await import("./index");
    const env = {
      ASSETS: { fetch: async () => new Response(JSON.stringify([])) } as Fetcher,
      CHAT_STATE: {} as KVNamespace,
      ANTHROPIC_API_KEY: "sk-test",
      IP_HASH_SALT: "salt",
      BOT_INTERNAL_TOKEN: "tok",
    };
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

    const req = new Request("https://birkenborg.dev/api/activity");
    const res = await worker.fetch!(req, env as never, ctx);
    const data = await res.json() as { events: Array<{ type: string; text: string; icon: string }> };

    expect(data.events[0].type).toBe("highlight");
    expect(data.events[0].text).toBe("ÆLDRE highlight");
    expect(data.events[0].icon).toBe("✦");
  });

  it("dedupliker highlight mod commit hvis text matcher", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("api.github.com/users/fluen1/events/public")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/commits")) {
        return new Response(JSON.stringify([
          {
            sha: "abc",
            commit: { message: "feat: dubletten", author: { date: "2026-05-09T14:00:00Z" } },
            html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc",
          },
        ]), { status: 200 });
      }
      if (u.includes("bot.birkenborg.dev/internal/inbox")) {
        return new Response(JSON.stringify({ messages: [] }), { status: 200 });
      }
      if (u.includes("bot.birkenborg.dev/internal/highlights")) {
        return new Response(JSON.stringify({
          highlights: [{ ts: 1746000000, text: "dubletten" }],
        }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const { default: worker } = await import("./index");
    const env = {
      ASSETS: { fetch: async () => new Response(JSON.stringify([])) } as Fetcher,
      CHAT_STATE: {} as KVNamespace,
      ANTHROPIC_API_KEY: "sk-test",
      IP_HASH_SALT: "salt",
      BOT_INTERNAL_TOKEN: "tok",
    };
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

    const req = new Request("https://birkenborg.dev/api/activity");
    const res = await worker.fetch!(req, env as never, ctx);
    const data = await res.json() as { events: Array<{ type: string; text: string }> };

    const matching = data.events.filter(e => e.text === "dubletten");
    expect(matching).toHaveLength(1);
    expect(matching[0].type).toBe("highlight");
  });
});
