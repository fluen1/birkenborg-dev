/**
 * birkenborg.dev Worker — serverer statisk site + /api/* live-signaler.
 *
 * Routes:
 *   GET /api/activity   → JSON med GitHub-aktivitet sidste 30 dage + senest commit
 *   alt andet           → fall-through til ASSETS (Astro static build)
 */

interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN?: string;
  BOT_INTERNAL_TOKEN?: string;
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

interface ActivityResponse {
  activity: DayCount[];
  lastCommit: LastCommit | null;
  draftsPending: number | null;
  generatedAt: number;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/activity") {
      return handleActivity(req, env, ctx);
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
  const [activity, lastCommit] = await Promise.all([
    fetchActivityWindow(env).catch((e) => {
      console.error("activity", e);
      return emptyWindow();
    }),
    fetchLastCommit(env).catch((e) => {
      console.error("lastCommit", e);
      return null;
    }),
  ]);

  let draftsPending: number | null = null;
  if (env.BOT_INTERNAL_TOKEN) {
    try {
      draftsPending = await fetchDrafts(env);
    } catch (e) {
      console.error("drafts", e);
    }
  }

  return {
    activity,
    lastCommit,
    draftsPending,
    generatedAt: Math.floor(Date.now() / 1000),
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

async function fetchLastCommit(env: Env): Promise<LastCommit | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "birkenborg-dev-worker",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const results = await Promise.all(
    PUBLIC_REPOS.map(async (repo) => {
      try {
        const r = await fetch(
          `https://api.github.com/repos/${GITHUB_USER}/${repo}/commits?per_page=1`,
          { headers },
        );
        if (!r.ok) return null;
        const arr = (await r.json()) as Array<{
          sha: string;
          commit: { message: string; author: { date: string } };
          html_url: string;
        }>;
        if (!arr.length) return null;
        const c = arr[0];
        return {
          repo,
          message: c.commit.message.split("\n")[0].slice(0, 80),
          ts: Math.floor(Date.parse(c.commit.author.date) / 1000),
          url: c.html_url,
        };
      } catch {
        return null;
      }
    }),
  );

  const valid = results.filter((c): c is LastCommit => c !== null);
  if (!valid.length) return null;
  valid.sort((a, b) => b.ts - a.ts);
  return valid[0];
}

async function fetchDrafts(env: Env): Promise<number | null> {
  const sinceTs = Math.floor(Date.now() / 1000) - 7 * 86400;
  const r = await fetch(`${BOT_BASE}/internal/inbox?since=${sinceTs}`, {
    headers: { Authorization: `Bearer ${env.BOT_INTERNAL_TOKEN}` },
  });
  if (!r.ok) return null;
  const data = (await r.json()) as { messages?: unknown[] };
  return data.messages?.length ?? 0;
}
