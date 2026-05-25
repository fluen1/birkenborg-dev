# News-Pipeline Milestone 2 — Implementations-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Når Philip svarer YES på en draft i Telegram, pusher bot-worker'en posten til `birkenborg-dev` repo'et via GitHub Contents API (auto-deploy → live på birkenborg.dev/skrifter/<slug>). Allerede ved REVIEWING-state får draften et signeret preview-link i Telegram-DM'en der viser draften med samme styling som live-sitet.

**Architecture:** To workers samarbejder.
- **Bot-worker** (`bot.birkenborg.dev`, repo `birkenborg-agents`): genererer preview-token, gemmer i KV, pusher til GitHub. Eksponerer `GET /internal/preview/<token>` så site-worker kan hente draften.
- **Site-worker** (`birkenborg.dev`, repo `birkenborg-dev`): fanger `/skrifter/<slug>?preview=<token>` før ASSETS fall-through. Henter draft fra bot-worker via internal-API, renderer markdown med `marked`, wrapper i HTML der genbruger sitets CSS.

**Tech Stack:** Cloudflare Workers + KV, GitHub Contents API, `marked` v18 markdown-renderer, HMAC-SHA-256 token-signering, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-07-news-pipeline-design.md` sektion 5.2.7 + 5.4 + Milestone 2 i sektion 13.

---

## Repository Setup

Plan'en involverer to repos. Antag følgende lokal struktur:

```
C:\Users\birke\Projects\
├── birkenborg-dev\          (offentlig — site + spec/plan + site-worker)
│   ├── content/posts/       (markdown blog-posts)
│   ├── site/                (Astro static site)
│   ├── worker/              (birkenborg.dev site-worker — udvides her)
│   ├── package.json         (root — `marked` tilføjes som dep)
│   ├── wrangler.toml        (site-worker config)
│   └── docs/superpowers/specs/, plans/
└── birkenborg-agents\       (privat — bot-worker)
    ├── worker/
    │   ├── src/
    │   │   ├── index.ts     (Telegram-router)
    │   │   ├── internal.ts  (internal-API — udvides her)
    │   │   └── news/        (M1 — udvides her)
    │   └── tests/
    └── .env / .env.example  (PREVIEW_TOKEN_SECRET tilføjes her)
```

**Hver task angiver `Repo:` så det er klart hvor du arbejder.** Kommandoer som `git commit` køres i den korrekte repo-rod.

---

## File Structure

### birkenborg-agents (bot-worker)

**Skabes:**
- `worker/src/news/preview.ts` — token sign/verify + KV-storage (~80 linjer)
- `worker/tests/news/preview.test.ts`
- `worker/src/news/publish.ts` — GitHub Contents API push (~90 linjer)
- `worker/tests/news/publish.test.ts`

**Modificeres:**
- `worker/src/news/handler.ts` — issue token i `handleOutlineApproval`, publish i `handleDraftReview` YES, udvid `formatDraftMessage` med preview-URL
- `worker/src/internal.ts` — ny `GET /internal/preview/<token>`-endpoint
- `worker/tests/news/handler.test.ts` — opdater eksisterende tests + nye for publish
- `worker/tests/internal.test.ts` — test for nyt endpoint
- `.env.example` — ny `PREVIEW_TOKEN_SECRET`-variabel

### birkenborg-dev (site-worker)

**Skabes:**
- `worker/preview.ts` — `handlePreview`-funktion: fetch draft, render, wrap HTML (~120 linjer)
- `worker/preview.test.ts`

**Modificeres:**
- `worker/index.ts` — fang `/skrifter/<slug>?preview=<token>` før ASSETS fall-through
- `package.json` — `marked` tilføjes som **dependency** (ikke kun site/-dep)
- `wrangler.toml` — `BOT_INTERNAL_TOKEN` allerede sat som secret; bekræft binding

### birkenborg-dev (docs)

**Modificeres:**
- `README.md` (eller `docs/RUNBOOK.md`) — ny `PREVIEW_TOKEN_SECRET`-secret dokumenteres
- `birkenborg-agents/README.md` — samme

---

## Design-beslutninger (referér fra tasks)

**Token-format:** Random hex (16 bytes → 32 chars) genereret via `crypto.getRandomValues`. Lookup i KV-key `news-preview:<token>` → `{ seedId, chatId, expiresAt, slug }`. TTL 24t. **HMAC droppes** til fordel for KV-lookup (simplere, latency er ikke kritisk på preview-route, og random-token er lige så uforudsigelig).

**Cross-worker auth:** Site-worker bruger eksisterende `BOT_INTERNAL_TOKEN`-secret (allerede sat via memory-noter) til at kalde `GET https://bot.birkenborg.dev/internal/preview/<token>`. Ingen delte HMAC-secrets.

**CSS-strategi:** Site-worker fetcher en eksisterende `/skrifter/<en-rigtig-slug>`-side via `env.ASSETS`-binding, ekstraherer `<link rel="stylesheet">`-tags via regex, og injicerer dem i preview-HTML. Cachet i `caches.default` med 1t TTL. Fallback hvis fetch fejler: minimal hardcoded styling.

**Preview-vinder over static:** Hvis URL har `?preview=<token>`-parameter, ALTID brug preview-rute (selv hvis posten allerede er live). Det lader Philip se preview af tidligere drafts.

**Slug-strategi:** Title → slug via lowercase + erstat ikke-alfanumerisk med `-`, trim, max 60 tegn. Filnavn = `<YYYY-MM-DD>-<slug>.md` (matcher M2-naming i eksisterende posts).

---

## Task 1: Preview-token helpers (bot-worker)

**Repo:** `birkenborg-agents/`

**Files:**
- Create: `worker/src/news/preview.ts`
- Create: `worker/tests/news/preview.test.ts`

**Goal:** Pure helper-modul der genererer tokens, gemmer dem i KV, og verificerer dem ved lookup. Ingen handler-integration endnu.

- [ ] **Step 1: Skriv failing test for token-generation + KV write**

Opret `worker/tests/news/preview.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { env as cfEnv } from "cloudflare:test";
import { issuePreviewToken, lookupPreviewToken } from "../../src/news/preview";

describe("issuePreviewToken", () => {
  it("genererer 32-char hex token og gemmer entry i KV", async () => {
    const token = await issuePreviewToken(cfEnv.BOT_STATE, {
      seedId: "abc123",
      chatId: 12345,
      slug: "min-post",
      ttlSeconds: 86400,
    });
    expect(token).toMatch(/^[0-9a-f]{32}$/);

    const entry = await lookupPreviewToken(cfEnv.BOT_STATE, token);
    expect(entry).not.toBeNull();
    expect(entry?.seedId).toBe("abc123");
    expect(entry?.chatId).toBe(12345);
    expect(entry?.slug).toBe("min-post");
    expect(entry?.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("genererer unikke tokens hver gang", async () => {
    const t1 = await issuePreviewToken(cfEnv.BOT_STATE, { seedId: "s", chatId: 1, slug: "a", ttlSeconds: 60 });
    const t2 = await issuePreviewToken(cfEnv.BOT_STATE, { seedId: "s", chatId: 1, slug: "a", ttlSeconds: 60 });
    expect(t1).not.toBe(t2);
  });
});

describe("lookupPreviewToken", () => {
  it("returnerer null for ukendt token", async () => {
    const entry = await lookupPreviewToken(cfEnv.BOT_STATE, "deadbeef".repeat(4));
    expect(entry).toBeNull();
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/preview.test.ts
```

Forventet: FAIL — `Cannot find module '../../src/news/preview'`.

- [ ] **Step 3: Skriv minimal implementation**

Opret `worker/src/news/preview.ts`:

```typescript
const KEY_PREFIX = "news-preview:";

export interface PreviewEntry {
  seedId: string;
  chatId: number;
  slug: string;
  expiresAt: number;
}

export interface IssueOptions {
  seedId: string;
  chatId: number;
  slug: string;
  ttlSeconds: number;
}

function genToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function issuePreviewToken(
  kv: KVNamespace,
  opts: IssueOptions,
): Promise<string> {
  const token = genToken();
  const expiresAt = Math.floor(Date.now() / 1000) + opts.ttlSeconds;
  const entry: PreviewEntry = {
    seedId: opts.seedId,
    chatId: opts.chatId,
    slug: opts.slug,
    expiresAt,
  };
  await kv.put(`${KEY_PREFIX}${token}`, JSON.stringify(entry), {
    expirationTtl: opts.ttlSeconds,
  });
  return token;
}

export async function lookupPreviewToken(
  kv: KVNamespace,
  token: string,
): Promise<PreviewEntry | null> {
  const raw = await kv.get(`${KEY_PREFIX}${token}`);
  return raw ? (JSON.parse(raw) as PreviewEntry) : null;
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/preview.test.ts
```

Forventet: 3 PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/news/preview.ts worker/tests/news/preview.test.ts
git commit -m "feat(news): preview-token helpers — issue/lookup via KV

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: GitHub publish-funktion (bot-worker)

**Repo:** `birkenborg-agents/`

**Files:**
- Create: `worker/src/news/publish.ts`
- Create: `worker/tests/news/publish.test.ts`

**Goal:** Pure funktion der tager en seed med draft + slug, genererer frontmatter, pusher til GitHub via Contents API. Ingen handler-integration endnu.

- [ ] **Step 1: Skriv failing test for slug-generation**

Opret `worker/tests/news/publish.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { slugify, buildFrontmatter, publishPost } from "../../src/news/publish";

describe("slugify", () => {
  it("konverterer titel til lowercase hyphen-separated slug", () => {
    expect(slugify("Min M&A-agent fejlede på paragraf 30")).toBe("min-m-a-agent-fejlede-pa-paragraf-30");
  });

  it("trimmer til max 60 tegn", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });

  it("strip leading/trailing hyphens", () => {
    expect(slugify("---hej---")).toBe("hej");
  });
});

describe("buildFrontmatter", () => {
  it("indeholder alle obligatoriske felter", () => {
    const fm = buildFrontmatter({
      title: "Min titel",
      slug: "min-titel",
      tags: ["jura", "kode"],
      publishAt: "2026-05-08T10:00:00.000Z",
    });
    expect(fm).toContain('title: "Min titel"');
    expect(fm).toContain("slug: min-titel");
    expect(fm).toContain("status: published");
    expect(fm).toContain('publish_at: 2026-05-08T10:00:00.000Z');
    expect(fm).toContain('privacy_flag: false');
    expect(fm).toContain("tags: [jura, kode]");
    expect(fm).toContain("linkedin_url: null");
    expect(fm.startsWith("---\n")).toBe(true);
    expect(fm.endsWith("---\n")).toBe(true);
  });

  it("escaper title med dobbelt-anførselstegn", () => {
    const fm = buildFrontmatter({
      title: 'Hun sagde "hej"',
      slug: "hun-sagde-hej",
      tags: [],
      publishAt: "2026-05-08T10:00:00.000Z",
    });
    expect(fm).toContain('title: "Hun sagde \\"hej\\""');
  });
});

describe("publishPost", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("PUTer til GitHub Contents API med base64-encoded body", async () => {
    let captured: { url: string; body: any; headers: Record<string, string> } | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      captured = {
        url: url.toString(),
        body: JSON.parse((init as RequestInit).body as string),
        headers: (init as RequestInit).headers as Record<string, string>,
      };
      return new Response(JSON.stringify({
        commit: { html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc123" },
      }), { status: 201 });
    });

    const result = await publishPost({
      githubToken: "ghp_test",
      title: "Min Post",
      slug: "min-post",
      tags: ["jura"],
      body: "# Hej\n\nIndhold.",
      publishAt: "2026-05-08T10:00:00.000Z",
    });

    expect(result.commitUrl).toBe("https://github.com/fluen1/birkenborg-dev/commit/abc123");
    expect(captured).not.toBeNull();
    expect(captured!.url).toBe("https://api.github.com/repos/fluen1/birkenborg-dev/contents/content/posts/2026-05-08-min-post.md");
    expect(captured!.headers.Authorization).toBe("Bearer ghp_test");
    expect(captured!.body.branch).toBe("main");
    expect(captured!.body.message).toContain("min-post");
    // base64-decoded content skal indeholde frontmatter + body
    const decoded = atob(captured!.body.content);
    expect(decoded).toContain('title: "Min Post"');
    expect(decoded).toContain("# Hej");
  });

  it("kaster fejl ved 4xx GitHub-respons", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("forbidden", { status: 403 }),
    );

    await expect(publishPost({
      githubToken: "ghp_bad",
      title: "x",
      slug: "x",
      tags: [],
      body: "x",
      publishAt: "2026-05-08T10:00:00.000Z",
    })).rejects.toThrow(/github_403/);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/publish.test.ts
```

Forventet: FAIL — `Cannot find module`.

- [ ] **Step 3: Skriv minimal implementation**

Opret `worker/src/news/publish.ts`:

```typescript
const REPO = "fluen1/birkenborg-dev";
const POSTS_DIR = "content/posts";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

interface FrontmatterInput {
  title: string;
  slug: string;
  tags: string[];
  publishAt: string;
}

export function buildFrontmatter(input: FrontmatterInput): string {
  const escapedTitle = input.title.replace(/"/g, '\\"');
  const tagsList = input.tags.length === 0 ? "[]" : `[${input.tags.join(", ")}]`;
  return `---
title: "${escapedTitle}"
slug: ${input.slug}
publish_at: ${input.publishAt}
status: published
tags: ${tagsList}
privacy_flag: false
linkedin_url: null
---
`;
}

interface PublishInput {
  githubToken: string;
  title: string;
  slug: string;
  tags: string[];
  body: string;
  publishAt: string;
}

export async function publishPost(input: PublishInput): Promise<{ commitUrl: string }> {
  const date = input.publishAt.slice(0, 10);
  const filename = `${date}-${input.slug}.md`;
  const path = `${POSTS_DIR}/${filename}`;

  const frontmatter = buildFrontmatter({
    title: input.title,
    slug: input.slug,
    tags: input.tags,
    publishAt: input.publishAt,
  });
  const fullContent = `${frontmatter}\n${input.body}\n`;
  const base64 = btoa(unescape(encodeURIComponent(fullContent)));

  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${input.githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "birkenborg-bot-news",
    },
    body: JSON.stringify({
      message: `news: publish ${input.slug}`,
      content: base64,
      branch: "main",
    }),
  });

  if (!res.ok) {
    throw new Error(`github_${res.status}`);
  }

  const data = (await res.json()) as { commit?: { html_url?: string } };
  return { commitUrl: data.commit?.html_url ?? "" };
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/publish.test.ts
```

Forventet: 7 PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/news/publish.ts worker/tests/news/publish.test.ts
git commit -m "feat(news): GitHub publish — slugify, frontmatter, Contents API push

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Handler-integration — preview-token + publish on YES

**Repo:** `birkenborg-agents/`

**Files:**
- Modify: `worker/src/news/handler.ts`
- Modify: `worker/tests/news/handler.test.ts`

**Goal:** `handleOutlineApproval` udsteder preview-token efter tone-eval og putter URL i DM. `handleDraftReview` YES-branch kalder `publishPost` med GitHub-PAT og DM'er commit-URL.

- [ ] **Step 1: Læs eksisterende `handleOutlineApproval`-endpoint**

Reference: `worker/src/news/handler.ts:228-275` — den linje hvor `formatDraftMessage(finalDraft, score, ...)` returneres.

Reference: `formatDraftMessage`-signaturen er på linje 450.

- [ ] **Step 2: Skriv failing test — preview-URL i DM efter tone-eval**

Tilføj i `worker/tests/news/handler.test.ts` inde i `describe("handleOutlineApproval", ...)`-blokken (efter den eksisterende "bruger rewritten draft"-test):

```typescript
it("udsteder preview-token og inkluderer URL i DM", async () => {
  setupDraftMocks(
    "# Min Titel\n\nIndhold.",
    { originalScore: 9, score: 9, verdict: "approved", draft: "# Min Titel\n\nIndhold." },
  );
  const env = makeEnv({ PREVIEW_TOKEN_SECRET: "test-secret" });
  const CHAT_ID = 99220;
  const seed = await setupSeedInOutlining(env, CHAT_ID);

  const { handleOutlineApproval } = await import("../../src/news/handler");
  const result = await handleOutlineApproval(env, seed);

  expect("tgMessage" in result).toBe(true);
  if (!("tgMessage" in result)) return;
  // DM skal indeholde preview-URL med birkenborg.dev/skrifter/<slug>?preview=<token>
  expect(result.tgMessage).toMatch(/https:\/\/birkenborg\.dev\/skrifter\/[a-z0-9-]+\?preview=[0-9a-f]{32}/);

  // Token skal være lookup-bar i KV
  const match = result.tgMessage.match(/preview=([0-9a-f]{32})/);
  expect(match).not.toBeNull();
  const { lookupPreviewToken } = await import("../../src/news/preview");
  const entry = await lookupPreviewToken(env.BOT_STATE, match![1]!);
  expect(entry).not.toBeNull();
  expect(entry?.chatId).toBe(CHAT_ID);
  expect(entry?.seedId).toBe(seed.id);
});
```

- [ ] **Step 3: Tilføj `PREVIEW_TOKEN_SECRET` til NewsEnv-typen**

Modify `worker/src/news/handler.ts` — `NewsEnv` interface:

```typescript
export interface NewsEnv {
  BOT_STATE: KVNamespace;
  ANTHROPIC_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  NEWS_DAILY_BUDGET?: string;
  NEWS_DISABLED?: string;
  NEWS_MODEL?: string;
  PREVIEW_TOKEN_SECRET?: string;
  PUBLIC_REPO_PAT?: string;
}
```

(`PUBLIC_REPO_PAT` tilføjes nu så Task 4 kan bruge den uden at ændre interface igen.)

Modify `worker/src/index.ts` — Env-interface inkluderer allerede begge to (`PUBLIC_REPO_PAT` er der; tilføj `PREVIEW_TOKEN_SECRET?: string`).

- [ ] **Step 4: Implementér token-issuing i handleOutlineApproval**

Modify `worker/src/news/handler.ts:265-275`:

```typescript
  const wasRewritten = toneJson.verdict === "rewritten";
  const finalDraft = wasRewritten ? toneJson.draft : draft;
  const score = toneJson.score ?? 0;

  // Generer slug fra første H1 i drafted, eller fallback til seedId
  const slugFromTitle = extractSlugFromDraft(finalDraft) ?? `seed-${seed.id}`;

  seed.draft = finalDraft;
  seed.toneScore = score;
  seed.state = "REVIEWING";
  await setSeed(env.BOT_STATE, seed);

  // Udsted preview-token (24t TTL)
  const { issuePreviewToken } = await import("./preview");
  const token = await issuePreviewToken(env.BOT_STATE, {
    seedId: seed.id,
    chatId: seed.chatId,
    slug: slugFromTitle,
    ttlSeconds: 86400,
  });
  const previewUrl = `https://birkenborg.dev/skrifter/${slugFromTitle}?preview=${token}`;

  return { tgMessage: formatDraftMessage(finalDraft, score, wasRewritten ? "rewritten" : undefined, previewUrl) };
}
```

Tilføj helper-funktion under `formatDraftMessage` (i samme fil, efter linje 471):

```typescript
function extractSlugFromDraft(draft: string): string | null {
  const h1Match = draft.match(/^#\s+(.+)$/m);
  if (!h1Match) return null;
  // slugify-logik genbrugt fra publish.ts
  return h1Match[1]!
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "") || null;
}
```

- [ ] **Step 5: Udvid formatDraftMessage med preview-URL**

Modify `worker/src/news/handler.ts:450-471`:

```typescript
function formatDraftMessage(draft: string, score: number, note?: string, previewUrl?: string): string {
  const TRUNCATE_AT = 2500;
  const telegramReady = draft.replace(/\*\*([^*\n]+?)\*\*/g, "*$1*");
  const truncated = telegramReady.length > TRUNCATE_AT
    ? telegramReady.slice(0, TRUNCATE_AT) + "\n\n_(…trunkeret — fuld draft lever i KV indtil du svarer)_"
    : telegramReady;
  let scoreLine: string;
  if (score > 0 && note === "rewritten") {
    scoreLine = `✏️ _Original tone-score: ${score}/10. Auto-omskrevet til at ramme din stemme bedre — det er den forbedrede du ser._`;
  } else if (score > 0) {
    scoreLine = `🎯 *Tone-eval: ${score}/10* — godkendt uden omskrivning`;
  } else if (note === "eval-fejlede") {
    scoreLine = `⚠️ _Tone-eval fejlede — viser raw draft_`;
  } else {
    scoreLine = `⚠️ _Tone-eval: parse-fejl_`;
  }
  const previewLine = previewUrl ? `\n🔗 [Se preview](${previewUrl}) (udløber om 24t)` : "";
  return `📰 *Draft færdig* — ${draft.length} tegn\n${scoreLine}${previewLine}\n\n────────\n\n${truncated}\n\n────────\n\n_Svar:_\n• *YES* — markér klar\n• *STOP* — kasser\n• *EDIT* — genstart med ny vinkel`;
}
```

- [ ] **Step 6: Opdater eksisterende test-mock til at sætte PREVIEW_TOKEN_SECRET i `makeEnv`-helper**

Modify `worker/tests/news/handler.test.ts` linje 8-19 (`makeEnv`-funktionen):

```typescript
function makeEnv(overrides: Partial<NewsEnv> = {}): NewsEnv {
  return {
    BOT_STATE: cfEnv.BOT_STATE,
    ANTHROPIC_API_KEY: "sk-test",
    TELEGRAM_BOT_TOKEN: "tg-test",
    TELEGRAM_CHAT_ID: "12345",
    NEWS_DAILY_BUDGET: undefined,
    NEWS_DISABLED: undefined,
    NEWS_MODEL: undefined,
    PREVIEW_TOKEN_SECRET: "test-secret",
    PUBLIC_REPO_PAT: "ghp_test",
    ...overrides,
  };
}
```

- [ ] **Step 7: Verify GREEN — alle handler-tests + ny preview-test**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/handler.test.ts
```

Forventet: alle 23 tests PASS (22 eksisterende + 1 ny).

- [ ] **Step 8: Skriv failing test for YES → publish**

Tilføj i `worker/tests/news/handler.test.ts` inde i `describe("handleDraftReview", ...)`-blokken (efter "YES → state PUBLISHED"-testen, **erstat** den):

```typescript
it("YES → kalder GitHub publish, sætter PUBLISHED, DM'er commit-URL", async () => {
  let publishCalled = false;
  let commitUrl = "";
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    const u = url.toString();
    if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/contents/")) {
      publishCalled = true;
      const body = JSON.parse((init as RequestInit).body as string);
      // verify base64-content includes title from draft
      const decoded = atob(body.content);
      expect(decoded).toContain("Min Draft");
      commitUrl = "https://github.com/fluen1/birkenborg-dev/commit/abc";
      return new Response(JSON.stringify({ commit: { html_url: commitUrl } }), { status: 201 });
    }
    return new Response("not found", { status: 404 });
  });

  const env = makeEnv();
  const CHAT_ID = 99300;
  const { setSeed: setS } = await import("../../src/news/state");
  const seed = await createSeed(env.BOT_STATE, CHAT_ID, "tanke");
  seed.state = "REVIEWING";
  seed.draft = "# Min Draft\n\nIndhold.";
  seed.toneScore = 9;
  await setS(env.BOT_STATE, seed);

  const { handleDraftReview } = await import("../../src/news/handler");
  const result = await handleDraftReview(env, seed, "YES");

  expect(publishCalled).toBe(true);
  expect("tgMessage" in result).toBe(true);
  if (!("tgMessage" in result)) return;
  expect(result.tgMessage).toContain(commitUrl);

  const updated = await getSeed(env.BOT_STATE, CHAT_ID, seed.id);
  expect(updated?.state).toBe("PUBLISHED");
});

it("YES → publish fejler → state FAILED, DM med retry-besked", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (url.toString().includes("api.github.com")) {
      return new Response("forbidden", { status: 403 });
    }
    return new Response("not found", { status: 404 });
  });

  const env = makeEnv();
  const CHAT_ID = 99301;
  const { setSeed: setS } = await import("../../src/news/state");
  const seed = await createSeed(env.BOT_STATE, CHAT_ID, "tanke");
  seed.state = "REVIEWING";
  seed.draft = "# Draft\n\nx";
  await setS(env.BOT_STATE, seed);

  const { handleDraftReview } = await import("../../src/news/handler");
  const result = await handleDraftReview(env, seed, "YES");

  expect("tgMessage" in result).toBe(true);
  if (!("tgMessage" in result)) return;
  expect(result.tgMessage).toMatch(/publish.*fejlede/i);

  const updated = await getSeed(env.BOT_STATE, CHAT_ID, seed.id);
  expect(updated?.state).toBe("FAILED");
});
```

(Tip: hvis den eksisterende "YES → state PUBLISHED"-test er på linje 319-327, erstat den med dette par.)

- [ ] **Step 9: Verify RED for nye YES-tests**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/handler.test.ts -t "YES"
```

Forventet: 2 FAIL (publish ikke kaldt + state ikke FAILED).

- [ ] **Step 10: Implementér YES → publish-call i handleDraftReview**

Modify `worker/src/news/handler.ts:289-296`:

```typescript
  if (upper === "YES") {
    const { publishPost, slugify } = await import("./publish");
    const titleMatch = (seed.draft ?? "").match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? `Seed ${seed.id}`;
    const slug = slugify(title);
    const body = (seed.draft ?? "").replace(/^#\s+.+$/m, "").trim();

    if (!env.PUBLIC_REPO_PAT) {
      seed.state = "FAILED";
      await setSeed(env.BOT_STATE, seed);
      return { tgMessage: `Publish fejlede: PUBLIC_REPO_PAT mangler.` };
    }

    try {
      const result = await publishPost({
        githubToken: env.PUBLIC_REPO_PAT,
        title,
        slug,
        tags: [],
        body,
        publishAt: new Date().toISOString(),
      });
      seed.state = "PUBLISHED";
      await setSeed(env.BOT_STATE, seed);
      return {
        tgMessage: `✅ Skubbet til main.\n\nLive om ~30s: https://birkenborg.dev/skrifter/${slug}\n\nCommit: ${result.commitUrl}`,
      };
    } catch (e) {
      const msg = (e as Error).message;
      console.error("publish_failed", msg);
      seed.state = "FAILED";
      await setSeed(env.BOT_STATE, seed);
      return { tgMessage: `❌ Publish fejlede (${msg}). Draft bevares 24t i KV — retry ved at sende YES igen efter fix.` };
    }
  }
```

- [ ] **Step 11: Verify GREEN — alle handler-tests**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/news/handler.test.ts
```

Forventet: alle 24 tests PASS (22 + 1 preview-token + erstattet+ekstra YES).

- [ ] **Step 12: Verify GREEN — fuld worker-suite**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run
```

Forventet: alle ~105 tests PASS.

- [ ] **Step 13: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/news/handler.ts worker/src/index.ts worker/tests/news/handler.test.ts
git commit -m "feat(news): handler-integration — preview-token i DM + GitHub publish ved YES

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Internal preview-endpoint (bot-worker)

**Repo:** `birkenborg-agents/`

**Files:**
- Modify: `worker/src/internal.ts`
- Modify: `worker/tests/internal.test.ts`

**Goal:** Site-worker kan kalde `GET /internal/preview/<token>` for at hente draft + slug. Auth via eksisterende `BOT_INTERNAL_TOKEN`.

- [ ] **Step 1: Skriv failing test for preview-endpoint**

Tilføj i `worker/tests/internal.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { env as cfEnv, SELF } from "cloudflare:test";
import { issuePreviewToken } from "../src/news/preview";
import { createSeed, setSeed } from "../src/news/state";

describe("GET /internal/preview/<token>", () => {
  it("returnerer draft + slug for valid token", async () => {
    const seed = await createSeed(cfEnv.BOT_STATE, 12345, "tanke");
    seed.draft = "# Title\n\nBody.";
    seed.state = "REVIEWING";
    await setSeed(cfEnv.BOT_STATE, seed);

    const token = await issuePreviewToken(cfEnv.BOT_STATE, {
      seedId: seed.id,
      chatId: 12345,
      slug: "title",
      ttlSeconds: 60,
    });

    const res = await SELF.fetch(`https://bot.example/internal/preview/${token}`, {
      headers: { Authorization: `Bearer ${cfEnv.BOT_INTERNAL_TOKEN}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { draft: string; slug: string; expiresAt: number };
    expect(data.draft).toBe("# Title\n\nBody.");
    expect(data.slug).toBe("title");
    expect(data.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("returnerer 404 for ukendt token", async () => {
    const res = await SELF.fetch("https://bot.example/internal/preview/deadbeef00000000000000000000beef", {
      headers: { Authorization: `Bearer ${cfEnv.BOT_INTERNAL_TOKEN}` },
    });
    expect(res.status).toBe(404);
  });

  it("returnerer 401 uden Bearer-token", async () => {
    const res = await SELF.fetch("https://bot.example/internal/preview/foo");
    expect(res.status).toBe(401);
  });
});
```

(Hvis testen mangler `BOT_INTERNAL_TOKEN` i `cfEnv`, læg den til i `worker/vitest.config.ts` `miniflare.bindings`.)

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/internal.test.ts -t "preview"
```

Forventet: 3 FAIL (404 returneres for alle tokens fordi endpoint ikke eksisterer).

- [ ] **Step 3: Implementér endpoint i internal.ts**

Modify `worker/src/internal.ts` — tilføj **før** `return new Response("Not found", ...)`-linjen:

```typescript
  if (path.startsWith("/internal/preview/") && req.method === "GET") {
    const token = path.slice("/internal/preview/".length);
    if (!/^[0-9a-f]{32}$/.test(token)) {
      return new Response("invalid token", { status: 404 });
    }
    const { lookupPreviewToken } = await import("./news/preview");
    const entry = await lookupPreviewToken(env.BOT_STATE, token);
    if (!entry) return new Response("not found", { status: 404 });

    const { getSeed } = await import("./news/state");
    const seed = await getSeed(env.BOT_STATE, entry.chatId, entry.seedId);
    if (!seed?.draft) return new Response("draft missing", { status: 404 });

    return Response.json({
      draft: seed.draft,
      slug: entry.slug,
      expiresAt: entry.expiresAt,
    });
  }
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/internal.test.ts
```

Forventet: alle internal-tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/internal.ts worker/tests/internal.test.ts
git commit -m "feat(news): internal preview-endpoint — bot-worker exposer draft via token

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Site-worker handlePreview-funktion

**Repo:** `birkenborg-dev/`

**Files:**
- Create: `worker/preview.ts`
- Create: `worker/preview.test.ts`

**Goal:** Pure funktion der tager `(slug, token, env)` → returnerer `Response` med rendered HTML eller 404. Ingen dispatcher-integration endnu.

- [ ] **Step 1: Tilføj `marked` som root-dependency**

Modify `package.json` (root) — tilføj `dependencies`-blok hvis den mangler:

```json
{
  "devDependencies": { "...eksisterende": "..." },
  "dependencies": {
    "marked": "^18.0.3"
  },
  "scripts": { "...eksisterende": "..." }
}
```

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npm install
```

Forventet: `marked` installeret i `node_modules/marked`.

- [ ] **Step 2: Skriv failing test**

Opret `worker/preview.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handlePreview } from "./preview";

interface MockEnv {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  BOT_INTERNAL_TOKEN: string;
}

function makeEnv(): MockEnv {
  return {
    ASSETS: {
      fetch: async () =>
        new Response(
          `<html><head><link rel="stylesheet" href="/_astro/skrifter.AbCdEf.css"></head><body></body></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
    },
    BOT_INTERNAL_TOKEN: "tok-test",
  };
}

describe("handlePreview", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renderer markdown med sitets CSS-link inkluderet", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("bot.birkenborg.dev/internal/preview/")) {
        return new Response(JSON.stringify({
          draft: "# Hej verden\n\nDette er en preview.",
          slug: "hej-verden",
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const url = new URL("https://birkenborg.dev/skrifter/hej-verden?preview=" + "a".repeat(32));
    const res = await handlePreview(url, makeEnv() as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("<h1>Hej verden</h1>");
    expect(html).toContain("Dette er en preview.");
    expect(html).toContain('href="/_astro/skrifter.AbCdEf.css"');
    expect(html).toContain("preview-banner");
  });

  it("returnerer 404 for ukendt token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    const url = new URL("https://birkenborg.dev/skrifter/x?preview=" + "b".repeat(32));
    const res = await handlePreview(url, makeEnv() as never);
    expect(res.status).toBe(404);
  });

  it("returnerer 404 for ugyldig token-format", async () => {
    const url = new URL("https://birkenborg.dev/skrifter/x?preview=ikke-hex");
    const res = await handlePreview(url, makeEnv() as never);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 3: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run worker/preview.test.ts
```

Forventet: FAIL — modul mangler.

- [ ] **Step 4: Implementér handlePreview**

Opret `worker/preview.ts`:

```typescript
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
  // Cache resultat i caches.default (1t TTL) for at undgå at fetche ASSETS hver request
  const cacheKey = new Request("https://birkenborg.dev/__preview-css-cache");
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached.text();

  try {
    const stubReq = new Request("https://birkenborg.dev/skrifter/", { method: "GET" });
    const res = await env.ASSETS.fetch(stubReq);
    if (!res.ok) return fallbackCss();
    const html = await res.text();
    const links = Array.from(html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g))
      .map(m => m[0])
      .join("\n");
    if (!links) return fallbackCss();

    const toCache = new Response(links, {
      headers: { "cache-control": "public, max-age=3600" },
    });
    await caches.default.put(cacheKey, toCache.clone());
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
```

- [ ] **Step 5: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run worker/preview.test.ts
```

Forventet: 3 PASS.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add package.json package-lock.json worker/preview.ts worker/preview.test.ts
git commit -m "feat(site): handlePreview — render markdown med live CSS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Site-worker dispatcher hook

**Repo:** `birkenborg-dev/`

**Files:**
- Modify: `worker/index.ts`

**Goal:** Site-workerens `fetch`-handler fanger `/skrifter/<slug>?preview=<token>` før ASSETS fall-through og kalder `handlePreview`.

- [ ] **Step 1: Tilføj `BOT_INTERNAL_TOKEN` til Env-typen i index.ts**

Modify `worker/index.ts:13-23`:

```typescript
interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN?: string;
  BOT_INTERNAL_TOKEN: string;  // Var optional — nu krævet (preview-route bruger den)
  CHAT_STATE: KVNamespace;
  ANTHROPIC_API_KEY: string;
  IP_HASH_SALT: string;
  CHAT_DISABLED?: string;
  DAILY_CAP?: string;
  CHAT_MODEL?: string;
}
```

(Den eksisterende `fetchDrafts`-funktion bruger allerede `env.BOT_INTERNAL_TOKEN` med optional-check; den fortsætter med at virke fordi vi har secret'en sat live).

- [ ] **Step 2: Tilføj preview-route i fetch-handleren**

Modify `worker/index.ts:50-64`:

```typescript
export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/activity") {
      return handleActivity(req, env, ctx);
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
```

- [ ] **Step 3: Verify GREEN — fuld site-worker test-suite**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run
```

Forventet: alle eksisterende tests PASS + 3 preview-tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add worker/index.ts
git commit -m "feat(site): preview-route — fang /skrifter/<slug>?preview=<token> før ASSETS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Documentation, secret-deployment, smoke test

**Repo:** Begge.

**Files:**
- Modify: `birkenborg-agents/.env.example`
- Modify: `birkenborg-agents/README.md`
- Modify: `birkenborg-dev/README.md` (eller `docs/RUNBOOK.md`)

**Goal:** Dokumentér nye secrets, sæt dem live på Cloudflare, og verificér end-to-end via en testseed.

- [ ] **Step 1: Tilføj PREVIEW_TOKEN_SECRET til .env.example**

Modify `birkenborg-agents/.env.example` — tilføj nederst:

```
# HMAC-secret til at signere preview-tokens (genereres ved deployment)
# Generer: openssl rand -hex 32
PREVIEW_TOKEN_SECRET=
```

(Reserveret feltet til fremtidig HMAC-implementation. Aktuelt M2 bruger random-tokens, men reserveret for forward-compat.)

- [ ] **Step 2: Sæt PREVIEW_TOKEN_SECRET som Cloudflare secret på bot-worker**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
$secret = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
Write-Output $secret | npx wrangler secret put PREVIEW_TOKEN_SECRET
```

(Eller manuelt — generer en 64-tegns hex-streng og paste).

- [ ] **Step 3: Verify secrets er sat på begge workers**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx wrangler secret list
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx wrangler secret list
```

Forventet — bot-worker har:
- `ANTHROPIC_API_KEY`, `BOT_INTERNAL_TOKEN`, `PUBLIC_REPO_PAT`, `TELEGRAM_*`, **`PREVIEW_TOKEN_SECRET`**

Forventet — site-worker har:
- `ANTHROPIC_API_KEY`, **`BOT_INTERNAL_TOKEN`**, `IP_HASH_SALT`, m.fl.

(Hvis BOT_INTERNAL_TOKEN ikke er sat på site-worker, sæt den til samme værdi som bot-workerens.)

- [ ] **Step 4: Deploy begge workers**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx wrangler deploy
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx wrangler deploy
```

Forventet: ingen fejl. Begge workers live.

- [ ] **Step 5: Smoke test — opret en testseed via Telegram**

Send til bot via Telegram:
```
Test seed for M2 https://example.com
```

Følg flowet:
1. Bot svarer med afklarende spørgsmål
2. Du svarer kort
3. Bot foreslår outline → svar `JA`
4. Bot leverer draft + tone-score + **preview-link** (kontroller at linket har formen `https://birkenborg.dev/skrifter/<slug>?preview=<32-hex>`)
5. Klik på preview-linket → siden skal rendere med Fraunces-font og samme baggrund som /skrifter
6. Send `YES` til bot
7. Bot svarer med commit-URL og "Live om ~30s"
8. Vent ~30s, gå til `https://birkenborg.dev/skrifter/<slug>` — posten skal være live

- [ ] **Step 6: Verify live-deploy via GitHub Actions**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; git pull
npx wrangler tail
```

Eller tjek GitHub Actions-fanen for deploy.yml-runs efter commit'et fra bot.

- [ ] **Step 7: Cleanup test-seed**

Hvis testseden ikke skal være live, slet via:
```bash
cd /c/Users/birke/Projects/birkenborg-dev
git rm content/posts/2026-05-08-test-seed-for-m2.md
git commit -m "chore: fjern M2 test-seed"
git push
```

- [ ] **Step 8: Opdatér README'er**

Modify `birkenborg-agents/README.md` — tilføj kort sektion "M2 — News-pipeline GitHub-publish":
- Bot pusher godkendte drafts til `birkenborg-dev/content/posts/<date>-<slug>.md` via Contents API
- Preview-link genereres ved REVIEWING-state og er gyldig 24t
- Secrets påkrævet: `PUBLIC_REPO_PAT`, `PREVIEW_TOKEN_SECRET`, `BOT_INTERNAL_TOKEN`

Modify `birkenborg-dev/README.md` — tilføj kort sektion "Preview-rute":
- `/skrifter/<slug>?preview=<token>` rendres af site-worker, ikke fra static
- Henter draft fra `bot.birkenborg.dev/internal/preview/<token>` med `BOT_INTERNAL_TOKEN`-bearer

- [ ] **Step 9: Final commit + push**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add README.md .env.example
git commit -m "docs(news): M2 — preview-link + GitHub publish-flow"

cd /c/Users/birke/Projects/birkenborg-dev
git add README.md
git commit -m "docs(site): preview-rute via bot-internal API"
```

Push begge når Philip bekræfter.

---

## Self-review tjekliste (run efter alle tasks)

- [ ] Spec section 5.2.7 (publish.ts) → Task 2 ✅
- [ ] Spec section 5.4 (preview-rute) → Task 5 + 6 ✅
- [ ] Spec data flow T+1:30 (YES → publish) → Task 3 step 10 ✅
- [ ] Spec data flow T+1:12 (preview link i DM) → Task 3 step 4 ✅
- [ ] Frontmatter matcher eksisterende posts (title, slug, publish_at, status, tags, privacy_flag, linkedin_url) → Task 2 ✅
- [ ] Token TTL 24t → Task 1 ✅
- [ ] Site-worker bruger ASSETS-binding for CSS-discovery → Task 5 ✅
- [ ] Cross-worker auth via BOT_INTERNAL_TOKEN → Task 4+5 ✅
- [ ] Type consistency: `PreviewEntry`-felter (seedId, chatId, slug, expiresAt) er ens i issue/lookup/internal-endpoint → ✅
- [ ] Slug-funktion identisk i `publish.ts` og `handler.ts:extractSlugFromDraft` → ⚠️ duplikeret, men acceptabelt for små helper. Kan refactores i task 3 step 4 hvis ønsket.
