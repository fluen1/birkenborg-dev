import { marked } from "marked";

interface PreviewEnv {
  ASSETS: Fetcher;
  BOT_INTERNAL_TOKEN: string;
}

const BOT_BASE = "https://bot.birkenborg.dev";

export async function handlePreview(url: URL, env: PreviewEnv): Promise<Response> {
  const token = url.searchParams.get("preview") ?? "";
  if (!/^[0-9a-f]{32}$/.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  // Hent draft fra bot-worker
  const botRes = await fetch(`${BOT_BASE}/internal/preview/${token}`, {
    headers: { Authorization: `Bearer ${env.BOT_INTERNAL_TOKEN}` },
  });
  if (!botRes.ok) {
    return new Response("Not found", { status: 404 });
  }
  const { draft, expiresAt } = (await botRes.json()) as {
    draft: string;
    slug: string;
    expiresAt: number;
  };

  // Find CSS-links via stub-side fra ASSETS
  const cssLinks = await getStaticCssLinks(env);

  // Render markdown
  const renderedBody = await marked.parse(draft);

  const expiresInHours = Math.max(0, Math.floor((expiresAt - Date.now() / 1000) / 3600));

  const html = `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<title>Preview · birkenborg.dev</title>
${cssLinks}
<style>
  .preview-banner {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #d97757; color: #fff; padding: 12px 20px;
    font-family: system-ui, sans-serif; font-size: 14px;
    text-align: center; z-index: 9999;
  }
  body { padding-bottom: 60px; }
</style>
</head>
<body class="preview-mode">
<main class="post-page"><article class="container"><div class="post-body">
${renderedBody}
</div></article></main>
<div class="preview-banner">Preview · udløber om ${expiresInHours}t · ikke publiceret endnu</div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex,nofollow",
    },
  });
}

async function getStaticCssLinks(env: PreviewEnv): Promise<string> {
  // Try cache (Workers runtime only — gracefully skipped in test/node env)
  let cache: Cache | undefined;
  try {
    // caches is not defined in node env — catch the ReferenceError
    if (typeof caches !== "undefined") {
      cache = (caches as unknown as { default?: Cache }).default;
    }
  } catch {
    cache = undefined;
  }

  const cacheKey = new Request("https://birkenborg.dev/__preview-css-cache");
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached.text();
  }

  try {
    const stubReq = new Request("https://birkenborg.dev/skrifter/", { method: "GET" });
    const res = await env.ASSETS.fetch(stubReq);
    if (!res.ok) return fallbackCss();
    const html = await res.text();
    const links = Array.from(html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g))
      .map((m) => m[0])
      .join("\n");
    if (!links) return fallbackCss();

    if (cache) {
      const toCache = new Response(links, {
        headers: { "cache-control": "public, max-age=3600" },
      });
      await cache.put(cacheKey, toCache.clone());
    }
    return links;
  } catch {
    return fallbackCss();
  }
}

function fallbackCss(): string {
  return `<style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 64px auto; padding: 0 20px; color: #141413; background: #faf9f5; }
    h1 { font-size: 36px; }
    article { line-height: 1.6; }
  </style>`;
}
