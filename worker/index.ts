/**
 * birkenborg.dev Worker — serverer statisk site + /api/* live-signaler.
 *
 * Routes:
 *   GET /api/activity   → JSON med GitHub-aktivitet sidste 30 dage + senest commit
 *   POST /api/chat      → chat-endpoint (Anthropic)
 *   alt andet           → fall-through til ASSETS (Astro static build)
 */

import { handleChat, type ChatEnv } from './chat';
import type { KVNamespace } from '@cloudflare/workers-types';

interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN?: string;
  BOT_INTERNAL_TOKEN: string;
  CHAT_STATE: KVNamespace;
  ANTHROPIC_API_KEY: string;
  IP_HASH_SALT: string;
  CHAT_DISABLED?: string;
  DAILY_CAP?: string;
  CHAT_MODEL?: string;
}

const GITHUB_USER = "fluen1";
const PUBLIC_REPOS = ["birkenborg-dev"];
const ACTIVITY_WINDOW_DAYS = 30;
const CACHE_TTL_SECONDS = 300;
const BOT_BASE = "https://bot.birkenborg.dev";

interface DayCount {
  date: string;
  count: number;
}

interface LastCommit {
  repo: string;
  message: string;
  ts: number;
  url: string;
}

interface ActivityEvent {
  type: 'commit' | 'skrift' | 'now' | 'highlight';
  ts: number;
  text: string;
  icon: string;
  url?: string;
}

interface ActivityResponse {
  activity: DayCount[];
  lastCommit: LastCommit | null;
  generatedAt: number;
  events: ActivityEvent[];
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/activity") {
      return handleActivity(req, env, ctx);
    }

    // Let-vægts health-probe så chat-badgen kan fortælle sandheden ved page-load
    // uden at koste et Anthropic-kald. Spejler disabled-checken i handleChat.
    if (url.pathname === "/api/chat/health") {
      const status = env.CHAT_DISABLED === '1' ? 'disabled' : 'online';
      return Response.json(
        { status },
        { headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' } },
      );
    }

    if (url.pathname === "/api/chat") {
      return handleChat(req, env satisfies ChatEnv, ctx);
    }

    if (url.pathname.startsWith("/skrifter/") && url.searchParams.has("preview")) {
      const { handlePreview } = await import("./preview");
      return handlePreview(url, env);
    }

    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;

async function handleActivity(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheUrl = new URL(req.url);
  cacheUrl.pathname = "/api/activity";
  cacheUrl.search = "";
  const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const data = await collectActivity(env);

  const res = Response.json(data, {
    headers: {
      "cache-control": `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
      "access-control-allow-origin": "*",
    },
  });

  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function collectActivity(env: Env): Promise<ActivityResponse> {
  const [activity, events] = await Promise.all([
    fetchActivityWindow(env).catch((e) => {
      console.error("activity", e);
      return emptyWindow();
    }),
    buildEvents(env).catch((e) => {
      console.error('events', e);
      return [] as ActivityEvent[];
    }),
  ]);

  const firstCommit = events.find(e => e.type === 'commit');
  const lastCommit: LastCommit | null = firstCommit
    ? { repo: 'birkenborg-dev', message: firstCommit.text, ts: firstCommit.ts, url: firstCommit.url ?? '' }
    : null;

  return {
    activity,
    lastCommit,
    generatedAt: Math.floor(Date.now() / 1000),
    events,
  };
}

async function fetchActivityWindow(env: Env): Promise<DayCount[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "birkenborg-dev-worker",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`,
    { headers },
  );
  if (!res.ok) {
    throw new Error(`events ${res.status}`);
  }

  const events = (await res.json()) as Array<{
    type: string;
    created_at: string;
    payload?: { commits?: unknown[] };
  }>;

  const cutoff = Date.now() - ACTIVITY_WINDOW_DAYS * 86400_000;
  const counts = new Map<string, number>();

  for (const ev of events) {
    if (ev.type !== "PushEvent") continue;
    const ts = Date.parse(ev.created_at);
    if (ts < cutoff) continue;
    const key = ev.created_at.slice(0, 10);
    const commitCount = ev.payload?.commits?.length ?? 1;
    counts.set(key, (counts.get(key) ?? 0) + commitCount);
  }

  const window: DayCount[] = [];
  for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    window.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return window;
}

function emptyWindow(): DayCount[] {
  const window: DayCount[] = [];
  for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    window.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return window;
}


async function buildEvents(env: Env): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];

  // Fetch up to 15 recent commits
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'birkenborg-dev-worker',
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${PUBLIC_REPOS[0]}/commits?per_page=15`,
      { headers },
    );
    if (r.ok) {
      const commits = (await r.json()) as Array<{
        sha: string;
        commit: { message: string; author: { date: string } };
        html_url: string;
      }>;
      for (const c of commits) {
        const msg = c.commit.message.split('\n')[0];
        if (/^merge[: ]/i.test(msg) || /^wip/i.test(msg) || msg.length < 8) continue;
        const cleanMsg = msg.match(/^[a-z]+(\([^)]+\))?:\s*(.+)$/)?.[2] ?? msg;
        events.push({
          type: 'commit',
          ts: Math.floor(new Date(c.commit.author.date).getTime() / 1000),
          text: cleanMsg.trim(),
          icon: '⚙',
          url: c.html_url,
        });
      }
    }
  } catch (e) {
    console.error('events_commits', e);
  }

  // Fetch skrifter from build-time _corpus.json (served as static asset)
  try {
    const corpusReq = new Request('https://birkenborg.dev/api/_corpus.json');
    const corpusRes = await env.ASSETS.fetch(corpusReq);
    if (corpusRes.ok) {
      const corpus = (await corpusRes.json()) as Array<{
        slug: string;
        title: string;
        publish_at: string;
      }>;
      for (const post of corpus) {
        events.push({
          type: 'skrift',
          ts: Math.floor(new Date(post.publish_at).getTime() / 1000),
          text: post.title,
          icon: '✎',
          url: `/skrifter/${post.slug}`,
        });
      }
    }
  } catch (e) {
    console.error('events_skrifter', e);
  }

  // Fetch highlights fra bot-worker (placeres øverst, ikke ts-sorteret)
  const highlightTexts = new Set<string>();
  const highlights: ActivityEvent[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const r = await fetch(`${BOT_BASE}/internal/highlights`, {
      headers: { Authorization: `Bearer ${env.BOT_INTERNAL_TOKEN}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (r.ok) {
      const data = (await r.json()) as { highlights: Array<{ ts: number; text: string }> };
      for (const h of data.highlights) {
        highlights.push({
          type: 'highlight',
          ts: h.ts,
          text: h.text,
          icon: '✦',
        });
        highlightTexts.add(h.text);
      }
    }
  } catch (e) {
    console.error('events_highlights', e);
  }

  // Dedup commits/skrifter mod highlights
  const dedupedRest = events.filter(e => !highlightTexts.has(e.text));
  dedupedRest.sort((a, b) => b.ts - a.ts);

  // Highlights ALTID øverst, derefter sorted commits/skrifter
  const finalEvents = [...highlights, ...dedupedRest].slice(0, 5);
  return finalEvents;
}
