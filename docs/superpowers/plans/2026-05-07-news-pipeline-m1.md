# News-Pipeline Milestone 1 — Implementations-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Multi-step Telegram-baseret Claude-pipeline der modtager seeds (link + tanke), fører Philip gennem afklaring → outline → draft → tone-eval, og DM'er den færdige draft som tekst i Telegram. Ingen GitHub-publish endnu — det er Milestone 2.

**Architecture:** Bot-worker (`bot.birkenborg.dev`, eksisterende på Cloudflare) udvides med ny `worker/news/`-mappe. Genbruger /chat's Anthropic-mønster fra dev-repoen. State-machine i eksisterende KV-namespace `BOT_STATE`. Voice-samples eksponeres som static asset på birkenborg.dev og fetches af bot-worker ved cold start.

**Tech Stack:** Cloudflare Workers + KV, Anthropic Messages API (Claude Sonnet 4.6), TypeScript, Vitest, jina.ai r.jina.ai (artikel-fetch).

**Spec:** `docs/superpowers/specs/2026-05-07-news-pipeline-design.md`

**Milestone 2 (separat plan):** GitHub Contents API publish + preview-rute på `/skrifter/<slug>?preview=<token>`. Skrives når M1 er live og valideret.

---

## Repository Setup

Plan'en involverer to repos. Antag følgende lokal struktur:

```
C:\Users\birke\Projects\
├── birkenborg-dev\          (offentlig, denne repo)
│   ├── content/posts/       (markdown blog-posts)
│   ├── scripts/             (build-corpus.mjs)
│   ├── site/                (Astro static site)
│   ├── worker/              (birkenborg.dev site-worker)
│   └── docs/superpowers/specs/, plans/
└── birkenborg-agents\       (privat, sibling-mappe)
    ├── worker/              (bot.birkenborg.dev bot-worker)
    │   ├── index.ts         (Telegram-handler dispatcher)
    │   ├── *.test.ts        (eksisterende vitest-tests)
    │   └── data/            (eventuelle datafiler)
    └── ...
```

**Hver task angiver `Repo:` så det er klart hvor du arbejder.** Kommandoer som `git commit` køres i den korrekte repo-rod.

Hvis `birkenborg-agents` ikke ligger som sibling-mappe, juster stier i task-kommandoerne tilsvarende.

---

## File Structure

### birkenborg-dev (denne repo)

**Modificeres:**
- `scripts/build-corpus.mjs` — udvid med voice-samples-output til `site/public/`
- `scripts/build-corpus.test.ts` — nye tests for voice-sample-funktionen
- `.gitignore` — tilføj `site/public/voice-samples.json` (genereret asset)

**Genererede:**
- `site/public/voice-samples.json` — 3 nyeste posts som JSON, serveret via Astro

### birkenborg-agents (privat repo)

**Skabes:**
- `worker/news/state.ts` — KV state-machine (~80 linjer)
- `worker/news/state.test.ts` — vitest-tests
- `worker/news/article.ts` — jina.ai fetcher (~50 linjer)
- `worker/news/article.test.ts`
- `worker/news/voice.ts` — voice-samples loader (~50 linjer)
- `worker/news/voice.test.ts`
- `worker/news/budget.ts` — daily spend tracker (~60 linjer)
- `worker/news/budget.test.ts`
- `worker/news/prompts.ts` — alle 4 Claude-prompts (~250 linjer template)
- `worker/news/prompts.test.ts` — minimal coverage
- `worker/news/claude.ts` — Anthropic wrapper (~100 linjer)
- `worker/news/claude.test.ts`
- `worker/news/handler.ts` — orchestrator (~250 linjer)
- `worker/news/handler.test.ts`

**Modificeres:**
- `worker/index.ts` — udvid Telegram-dispatcher med news-detection
- `wrangler.toml` — tilføj nye secrets dokumenteret
- `README.md` — deploy-krav for nye secrets

---

## Task 1: Voice-samples generation (birkenborg-dev)

Udvid build-corpus til at generere `site/public/voice-samples.json` med de 3 nyeste posts. Bot-worker fetcher den fra `https://birkenborg.dev/voice-samples.json` ved runtime.

**Repo:** `birkenborg-dev`

**Files:**
- Modify: `scripts/build-corpus.mjs`
- Modify: `scripts/build-corpus.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Skriv failing test for voice-samples-funktionen**

I `scripts/build-corpus.test.ts`, tilføj efter den eksisterende `describe('buildCitations', ...)`:

```ts
describe('buildVoiceSamples', () => {
  it('returnerer 3 nyeste posts sorteret på publish_at desc', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const samples = buildVoiceSamples(corpus, 3);
    expect(samples).toHaveLength(3);
    // Fixturerne har publish_at: 2026-05-04, 2026-05-02, 2026-05-01, 2026-04-15
    // Vi forventer de 3 nyeste først
    const titles = samples.map(s => s.title);
    expect(titles).toContain('Test Post Clean');
    expect(titles).toContain('Test Post With LinkedIn');
  });

  it('returnerer max N samples selv hvis korpus er mindre', () => {
    const small = [
      { slug: 'a', title: 'A', tags: [], body: 'a-body', publishAt: '2026-01-01' },
    ];
    const samples = buildVoiceSamples(small, 5);
    expect(samples).toHaveLength(1);
  });

  it('hver sample har slug, title, body, publishAt', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const samples = buildVoiceSamples(corpus, 3);
    for (const s of samples) {
      expect(s).toHaveProperty('slug');
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('body');
      expect(s).toHaveProperty('publishAt');
    }
  });
});
```

Også opdater import-linjen øverst:

```ts
import { buildCorpus, buildCitations, buildVoiceSamples } from './build-corpus.mjs';
```

- [ ] **Step 2: Kør test — forvent fejl**

```bash
npx vitest run scripts/build-corpus.test.ts
```

Forventet: FAIL — `buildVoiceSamples` er ikke eksporteret.

- [ ] **Step 3: Implementér buildVoiceSamples + udvid CLI**

Modificér `scripts/build-corpus.mjs`. Først udvid `buildCorpus` så hver post også returnerer `publishAt`:

Find den eksisterende `corpus.push(...)`-blok og erstat med:

```js
    corpus.push({
      slug: data.slug ?? file.replace(/\.md$/, ''),
      title: data.title,
      tags: data.tags ?? [],
      body,
      publishAt: data.publish_at?.toISOString?.() ?? data.publish_at ?? null,
    });
```

Tilføj derefter ny eksporteret funktion efter `buildCitations`:

```js
// Vælger N nyeste posts til voice-samples (bot-workerens prompt-context).
// Sortering: publishAt desc; null/manglende dates kommer sidst.
export function buildVoiceSamples(corpus, count = 3) {
  const sorted = [...corpus].sort((a, b) => {
    if (!a.publishAt && !b.publishAt) return 0;
    if (!a.publishAt) return 1;
    if (!b.publishAt) return -1;
    return b.publishAt.localeCompare(a.publishAt);
  });
  return sorted.slice(0, count).map(p => ({
    slug: p.slug,
    title: p.title,
    body: p.body,
    publishAt: p.publishAt,
  }));
}
```

Udvid CLI-blokken nederst i filen (find `if (fileURLToPath(import.meta.url) === resolve(process.argv[1]))`):

```js
if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const postsDir = join(__dirname, '..', 'content', 'posts');
  const corpusDir = join(__dirname, '..', 'worker', 'data');
  const corpusFile = join(corpusDir, 'chat-corpus.json');
  const citationsDir = join(__dirname, '..', 'site', 'src', 'data');
  const citationsFile = join(citationsDir, 'chat-citations.json');
  const voiceDir = join(__dirname, '..', 'site', 'public');
  const voiceFile = join(voiceDir, 'voice-samples.json');

  const corpus = await buildCorpus(postsDir);
  const citations = buildCitations(corpus);
  const voice = buildVoiceSamples(corpus, 3);

  await mkdir(corpusDir, { recursive: true });
  await writeFile(corpusFile, JSON.stringify(corpus, null, 2), 'utf-8');
  await mkdir(citationsDir, { recursive: true });
  await writeFile(citationsFile, JSON.stringify(citations, null, 2), 'utf-8');
  await mkdir(voiceDir, { recursive: true });
  await writeFile(voiceFile, JSON.stringify(voice, null, 2), 'utf-8');

  console.log(`Wrote ${corpus.length} posts to ${corpusFile}`);
  console.log(`Wrote ${Object.keys(citations).length} citations to ${citationsFile}`);
  console.log(`Wrote ${voice.length} voice-samples to ${voiceFile}`);
}
```

- [ ] **Step 4: Kør tests — forvent pass**

```bash
npx vitest run scripts/build-corpus.test.ts
```

Forventet: alle tests passerer (eksisterende + 3 nye).

- [ ] **Step 5: Verificér CLI**

```bash
node scripts/build-corpus.mjs
```

Forventet output:
```
Wrote N posts to .../worker/data/chat-corpus.json
Wrote N citations to .../site/src/data/chat-citations.json
Wrote 3 voice-samples to .../site/public/voice-samples.json
```

```bash
cat site/public/voice-samples.json | head -20
```

Forventet: gyldig JSON med 3 post-objekter sorteret på publishAt desc.

- [ ] **Step 6: Tilføj voice-samples.json til .gitignore**

Tilføj denne linje til `.gitignore`:

```
site/public/voice-samples.json
```

- [ ] **Step 7: Verificér Astro server filen som static asset**

```bash
cd site && npm run build && cd ..
ls site/dist/voice-samples.json
```

Forventet: filen findes i `site/dist/`. Når deployet, vil den være tilgængelig på `https://birkenborg.dev/voice-samples.json`.

- [ ] **Step 8: Commit**

```bash
git add scripts/build-corpus.mjs scripts/build-corpus.test.ts .gitignore
git commit -m "feat(news): voice-samples.json genereret build-time + serveret som static asset

build-corpus.mjs udvidet med buildVoiceSamples() der returnerer 3 nyeste
posts (publishAt desc) som JSON i site/public/. Eksponeret efter deploy
på https://birkenborg.dev/voice-samples.json — fetches af bot-worker
ved cold start til prompt-context.

3 nye tests dækker sortering, count-cap, og output-format."
```

---

## Task 2: TDD `state.ts` — KV state-machine (birkenborg-agents)

KV-baseret state-machine for in-flight news seeds. Wrapper rundt om KV-operations med type-safety.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/state.ts`
- Create: `worker/news/state.test.ts`

- [ ] **Step 1: Opret news/-mappe**

```bash
mkdir -p worker/news
```

- [ ] **Step 2: Skriv første failing test**

`worker/news/state.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createSeed, getSeed, setSeed } from './state';
import { createMockKV } from '../test-helpers';

describe('createSeed', () => {
  it('genererer unikt seedId og initial state SEEDED', async () => {
    const kv = createMockKV();
    const seed = await createSeed(kv, 12345, 'GDPR-tanke');
    expect(seed.id).toMatch(/^[a-f0-9]{8}$/);
    expect(seed.state).toBe('SEEDED');
    expect(seed.chatId).toBe(12345);
    expect(seed.seedText).toBe('GDPR-tanke');
    expect(seed.retries).toBe(0);
    expect(seed.createdAt).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Kør — forvent fejl**

```bash
npx vitest run worker/news/state.test.ts
```

Forventet: `Cannot find module './state'`.

- [ ] **Step 4: Implementér state.ts**

`worker/news/state.ts`:

```ts
import type { KVNamespace } from '@cloudflare/workers-types';

export type SeedState =
  | 'SEEDED'
  | 'CLARIFYING'
  | 'OUTLINING'
  | 'DRAFTING'
  | 'REVIEWING'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'ABORTED'
  | 'FAILED';

export interface OutlineItem {
  label: string;
  text: string;
}

export interface Outline {
  items: OutlineItem[];
  hasCase: boolean;
  hasContrast: boolean;
  hasInternalLink: boolean;
}

export interface Seed {
  id: string;
  chatId: number;
  state: SeedState;
  seedText: string;
  articleUrl?: string;
  articleSummary?: string;
  clarificationQ?: string;
  clarificationA?: string;
  outline?: Outline;
  draft?: string;
  toneScore?: number;
  retries: number;
  createdAt: number;
  updatedAt: number;
}

const KEY_PREFIX = 'news:';
const TTL_INFLIGHT = 86400 * 2;     // 2 dage
const TTL_TERMINAL = 86400;         // 1 dag

const INFLIGHT_STATES: SeedState[] = [
  'SEEDED', 'CLARIFYING', 'OUTLINING', 'DRAFTING', 'REVIEWING', 'PUBLISHING',
];

function genId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function key(chatId: number, seedId: string): string {
  return `${KEY_PREFIX}${chatId}:${seedId}`;
}

export async function createSeed(
  kv: KVNamespace,
  chatId: number,
  seedText: string,
): Promise<Seed> {
  const now = Math.floor(Date.now() / 1000);
  const seed: Seed = {
    id: genId(),
    chatId,
    state: 'SEEDED',
    seedText,
    retries: 0,
    createdAt: now,
    updatedAt: now,
  };
  await kv.put(key(chatId, seed.id), JSON.stringify(seed), {
    expirationTtl: TTL_INFLIGHT,
  });
  return seed;
}

export async function getSeed(
  kv: KVNamespace,
  chatId: number,
  seedId: string,
): Promise<Seed | null> {
  const raw = await kv.get(key(chatId, seedId));
  return raw ? (JSON.parse(raw) as Seed) : null;
}

export async function setSeed(kv: KVNamespace, seed: Seed): Promise<void> {
  const ttl = INFLIGHT_STATES.includes(seed.state) ? TTL_INFLIGHT : TTL_TERMINAL;
  const updated: Seed = { ...seed, updatedAt: Math.floor(Date.now() / 1000) };
  await kv.put(key(seed.chatId, seed.id), JSON.stringify(updated), {
    expirationTtl: ttl,
  });
}

export async function listInflight(
  kv: KVNamespace,
  chatId: number,
): Promise<Seed[]> {
  const list = await kv.list({ prefix: `${KEY_PREFIX}${chatId}:` });
  const seeds: Seed[] = [];
  for (const k of list.keys) {
    const raw = await kv.get(k.name);
    if (!raw) continue;
    const seed = JSON.parse(raw) as Seed;
    if (INFLIGHT_STATES.includes(seed.state)) seeds.push(seed);
  }
  return seeds.sort((a, b) => b.createdAt - a.createdAt);
}

export async function abortSeed(
  kv: KVNamespace,
  chatId: number,
  seedId: string,
): Promise<Seed | null> {
  const seed = await getSeed(kv, chatId, seedId);
  if (!seed) return null;
  seed.state = 'ABORTED';
  await setSeed(kv, seed);
  return seed;
}
```

- [ ] **Step 5: Kør test — forvent pass**

```bash
npx vitest run worker/news/state.test.ts
```

Forventet: 1 passed.

- [ ] **Step 6: Tilføj fuld test-suite**

Erstat `worker/news/state.test.ts` med:

```ts
import { describe, it, expect } from 'vitest';
import {
  createSeed,
  getSeed,
  setSeed,
  listInflight,
  abortSeed,
  type Seed,
} from './state';
import { createMockKV } from '../test-helpers';

describe('createSeed', () => {
  it('genererer unikt seedId og initial state SEEDED', async () => {
    const kv = createMockKV();
    const seed = await createSeed(kv, 12345, 'GDPR-tanke');
    expect(seed.id).toMatch(/^[a-f0-9]{8}$/);
    expect(seed.state).toBe('SEEDED');
    expect(seed.chatId).toBe(12345);
    expect(seed.seedText).toBe('GDPR-tanke');
    expect(seed.retries).toBe(0);
    expect(seed.createdAt).toBeGreaterThan(0);
  });

  it('to seeds får forskellige IDs', async () => {
    const kv = createMockKV();
    const a = await createSeed(kv, 1, 'a');
    const b = await createSeed(kv, 1, 'b');
    expect(a.id).not.toBe(b.id);
  });
});

describe('getSeed', () => {
  it('returnerer null for ukendt seed', async () => {
    const kv = createMockKV();
    expect(await getSeed(kv, 1, 'nonexistent')).toBeNull();
  });

  it('returnerer seed efter createSeed', async () => {
    const kv = createMockKV();
    const created = await createSeed(kv, 1, 'tanke');
    const fetched = await getSeed(kv, 1, created.id);
    expect(fetched).toEqual(created);
  });
});

describe('setSeed', () => {
  it('opdaterer state og updatedAt', async () => {
    const kv = createMockKV();
    const seed = await createSeed(kv, 1, 'tanke');
    seed.state = 'CLARIFYING';
    await setSeed(kv, seed);
    const fetched = await getSeed(kv, 1, seed.id);
    expect(fetched?.state).toBe('CLARIFYING');
    expect(fetched?.updatedAt).toBeGreaterThanOrEqual(seed.createdAt);
  });
});

describe('listInflight', () => {
  it('returnerer kun in-flight seeds for chatId', async () => {
    const kv = createMockKV();
    const a = await createSeed(kv, 100, 'a');
    const b = await createSeed(kv, 100, 'b');
    b.state = 'PUBLISHED';
    await setSeed(kv, b);
    await createSeed(kv, 200, 'c'); // anden chatId

    const inflight = await listInflight(kv, 100);
    expect(inflight).toHaveLength(1);
    expect(inflight[0]!.id).toBe(a.id);
  });

  it('sorterer efter createdAt desc (nyeste først)', async () => {
    const kv = createMockKV();
    const a = await createSeed(kv, 1, 'older');
    await new Promise(r => setTimeout(r, 1100)); // sikr ny createdAt-second
    const b = await createSeed(kv, 1, 'newer');

    const inflight = await listInflight(kv, 1);
    expect(inflight[0]!.id).toBe(b.id);
    expect(inflight[1]!.id).toBe(a.id);
  });

  it('returnerer tom array når ingen seeds', async () => {
    const kv = createMockKV();
    expect(await listInflight(kv, 1)).toEqual([]);
  });
});

describe('abortSeed', () => {
  it('sætter state til ABORTED', async () => {
    const kv = createMockKV();
    const seed = await createSeed(kv, 1, 'tanke');
    const aborted = await abortSeed(kv, 1, seed.id);
    expect(aborted?.state).toBe('ABORTED');
  });

  it('returnerer null for ukendt seed', async () => {
    const kv = createMockKV();
    expect(await abortSeed(kv, 1, 'nonexistent')).toBeNull();
  });

  it('aborted seed udelukkes fra listInflight', async () => {
    const kv = createMockKV();
    const seed = await createSeed(kv, 1, 'tanke');
    await abortSeed(kv, 1, seed.id);
    expect(await listInflight(kv, 1)).toEqual([]);
  });
});
```

- [ ] **Step 7: Kør alle state-tests**

```bash
npx vitest run worker/news/state.test.ts
```

Forventet: 11 passed.

- [ ] **Step 8: Commit**

```bash
git add worker/news/state.ts worker/news/state.test.ts
git commit -m "feat(news): KV state-machine for in-flight seeds

Type-safe wrapper omkring KV: createSeed, getSeed, setSeed, listInflight,
abortSeed. Random 8-char hex seedId. KV-keys prefixet 'news:<chatId>:<id>'.
TTL 2 dage for in-flight states, 1 dag for terminal states.

11 vitest-tests dækker happy path + edge cases."
```

---

## Task 3: TDD `article.ts` — jina.ai fetcher (birkenborg-agents)

Hentet artikel-indhold fra `r.jina.ai/<url>`. Truncerer til 8K tokens. Fail-safe ved netværksfejl.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/article.ts`
- Create: `worker/news/article.test.ts`

- [ ] **Step 1: Skriv failing test**

`worker/news/article.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchArticle, extractFirstUrl } from './article';

describe('extractFirstUrl', () => {
  it('finder URL i seed-tekst', () => {
    const text = 'GDPR-håndhævelse https://datatilsynet.dk/sag-x interessant';
    expect(extractFirstUrl(text)).toBe('https://datatilsynet.dk/sag-x');
  });

  it('returnerer null hvis ingen URL', () => {
    expect(extractFirstUrl('Bare en tanke uden link')).toBeNull();
  });

  it('finder kun første URL hvis flere', () => {
    const text = 'http://a.com og http://b.com';
    expect(extractFirstUrl(text)).toBe('http://a.com');
  });
});

describe('fetchArticle', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetcher fra r.jina.ai og returnerer markdown', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('# Test Article\n\nSome content here.', { status: 200 }),
    );
    const result = await fetchArticle('https://example.com/article');
    expect(result).toBeDefined();
    expect(result?.markdown).toContain('Test Article');
    expect(result?.markdown).toContain('Some content');
    expect(result?.url).toBe('https://example.com/article');
  });

  it('returnerer null på 5xx fejl', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('boom', { status: 500 }),
    );
    expect(await fetchArticle('https://example.com')).toBeNull();
  });

  it('returnerer null på netværksfejl', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    expect(await fetchArticle('https://example.com')).toBeNull();
  });

  it('truncerer markdown til ~8K tokens', async () => {
    const longContent = 'word '.repeat(20000); // ~20K tokens
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(longContent, { status: 200 }),
    );
    const result = await fetchArticle('https://example.com');
    expect(result).toBeDefined();
    // ~4 chars per token, 8K tokens = 32K chars cap
    expect(result!.markdown.length).toBeLessThanOrEqual(35000);
  });
});
```

- [ ] **Step 2: Kør — forvent fejl**

```bash
npx vitest run worker/news/article.test.ts
```

Forventet: `Cannot find module './article'`.

- [ ] **Step 3: Implementér article.ts**

`worker/news/article.ts`:

```ts
const URL_REGEX = /https?:\/\/[^\s)]+/i;
const MAX_CHARS = 32000; // ~8K tokens (4 chars/token approx)
const FETCH_TIMEOUT_MS = 10000;

export interface FetchedArticle {
  url: string;
  markdown: string;
}

export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_REGEX);
  return m ? m[0] : null;
}

export async function fetchArticle(url: string): Promise<FetchedArticle | null> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/markdown' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error('article_fetch_status', res.status);
      return null;
    }
    let markdown = await res.text();
    if (markdown.length > MAX_CHARS) {
      markdown = markdown.slice(0, MAX_CHARS) + '\n\n[...artikel afkortet...]';
    }
    return { url, markdown };
  } catch (e) {
    console.error('article_fetch_failed', e);
    return null;
  }
}
```

- [ ] **Step 4: Kør tests — forvent pass**

```bash
npx vitest run worker/news/article.test.ts
```

Forventet: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add worker/news/article.ts worker/news/article.test.ts
git commit -m "feat(news): jina.ai artikel-fetcher med URL-extraction og fail-safe

extractFirstUrl finder URL i seed-tekst (regex match).
fetchArticle henter via r.jina.ai/<url>, truncerer ved 32K chars
(~8K tokens), fail-safe ved 5xx eller netværksfejl (returnerer null
så pipeline kan køre videre med kun seed som input).

7 tests inkl. timeout-håndtering, store responses, og fejl-paths."
```

---

## Task 4: TDD `voice.ts` — voice-samples loader (birkenborg-agents)

Fetcher voice-samples.json fra birkenborg.dev/voice-samples.json. Cacher i Cache API i 1 time. Fail-safe → returnerer tom array hvis fetch fejler.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/voice.ts`
- Create: `worker/news/voice.test.ts`

- [ ] **Step 1: Skriv failing test**

`worker/news/voice.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadVoiceSamples, formatVoiceSamples } from './voice';

const SAMPLE_DATA = [
  { slug: 'a', title: 'Post A', body: 'Body of post A.', publishAt: '2026-05-04' },
  { slug: 'b', title: 'Post B', body: 'Body of post B.', publishAt: '2026-05-02' },
];

describe('loadVoiceSamples', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetcher fra default URL og parser JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(SAMPLE_DATA), { status: 200 }),
    );
    const samples = await loadVoiceSamples();
    expect(samples).toHaveLength(2);
    expect(samples[0]!.slug).toBe('a');
  });

  it('returnerer tom array på fetch-fejl', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const samples = await loadVoiceSamples();
    expect(samples).toEqual([]);
  });

  it('returnerer tom array på 5xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('error', { status: 500 }),
    );
    expect(await loadVoiceSamples()).toEqual([]);
  });
});

describe('formatVoiceSamples', () => {
  it('formaterer samples til prompt-string', () => {
    const formatted = formatVoiceSamples(SAMPLE_DATA);
    expect(formatted).toContain('## Post A');
    expect(formatted).toContain('Body of post A.');
    expect(formatted).toContain('## Post B');
    expect(formatted).toContain('---');
  });

  it('returnerer placeholder hvis tom array', () => {
    const formatted = formatVoiceSamples([]);
    expect(formatted).toContain('ingen voice-samples tilgængelige');
  });
});
```

- [ ] **Step 2: Kør — forvent fejl**

```bash
npx vitest run worker/news/voice.test.ts
```

Forventet: `Cannot find module './voice'`.

- [ ] **Step 3: Implementér voice.ts**

`worker/news/voice.ts`:

```ts
const VOICE_URL = 'https://birkenborg.dev/voice-samples.json';
const FETCH_TIMEOUT_MS = 5000;

export interface VoiceSample {
  slug: string;
  title: string;
  body: string;
  publishAt: string | null;
}

export async function loadVoiceSamples(url: string = VOICE_URL): Promise<VoiceSample[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      cf: { cacheTtl: 3600, cacheEverything: true } as RequestInitCfProperties,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error('voice_fetch_status', res.status);
      return [];
    }
    return (await res.json()) as VoiceSample[];
  } catch (e) {
    console.error('voice_fetch_failed', e);
    return [];
  }
}

export function formatVoiceSamples(samples: VoiceSample[]): string {
  if (samples.length === 0) {
    return '(ingen voice-samples tilgængelige)';
  }
  return samples
    .map(s => `## ${s.title}\nslug: ${s.slug}\n\n${s.body}`)
    .join('\n\n---\n\n');
}
```

Note: `cacheTtl` + `cacheEverything` lader Cloudflare Worker cache responsen i 1 time per edge, hvilket fjerner behovet for explicit Cache API i de fleste tilfælde.

- [ ] **Step 4: Kør tests — forvent pass**

```bash
npx vitest run worker/news/voice.test.ts
```

Forventet: 5 passed.

Note: Hvis `RequestInitCfProperties` type fejler i vitest-miljøet (Node, ikke Workers), tilføj cast:

```ts
} as RequestInitCfProperties);
```

eller drop `cf`-options fra test-mock.

- [ ] **Step 5: Commit**

```bash
git add worker/news/voice.ts worker/news/voice.test.ts
git commit -m "feat(news): voice-samples loader fra birkenborg.dev static asset

loadVoiceSamples fetcher https://birkenborg.dev/voice-samples.json
med Cloudflare edge-cache 1h. formatVoiceSamples konverterer til
prompt-format (## title + body, separeret af ---).

Fail-safe: returnerer tom array på fetch-fejl. Pipeline kører videre
uden voice-context (lavere tone-fidelity, men ikke crash).

5 vitest-tests."
```

---

## Task 5: TDD `budget.ts` — daily spend tracker (birkenborg-agents)

Track daglig Anthropic-spend i KV. Reject nye seeds når dagligt budget er ramt.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/budget.ts`
- Create: `worker/news/budget.test.ts`

- [ ] **Step 1: Skriv failing test**

`worker/news/budget.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { recordSpend, getDailySpend, isBudgetExceeded } from './budget';
import { createMockKV } from '../test-helpers';

const NOW = new Date('2026-05-07T10:00:00Z');

describe('recordSpend', () => {
  it('lægger til daglig counter', async () => {
    const kv = createMockKV();
    await recordSpend(kv, 0.05, NOW);
    expect(await getDailySpend(kv, NOW)).toBeCloseTo(0.05, 4);
  });

  it('akkumulerer flere kald samme dag', async () => {
    const kv = createMockKV();
    await recordSpend(kv, 0.05, NOW);
    await recordSpend(kv, 0.13, NOW);
    expect(await getDailySpend(kv, NOW)).toBeCloseTo(0.18, 4);
  });

  it('separerer på dato', async () => {
    const kv = createMockKV();
    await recordSpend(kv, 0.10, new Date('2026-05-07T23:00:00Z'));
    await recordSpend(kv, 0.20, new Date('2026-05-08T01:00:00Z'));
    expect(await getDailySpend(kv, new Date('2026-05-07T12:00:00Z')))
      .toBeCloseTo(0.10, 4);
    expect(await getDailySpend(kv, new Date('2026-05-08T12:00:00Z')))
      .toBeCloseTo(0.20, 4);
  });
});

describe('getDailySpend', () => {
  it('returnerer 0 for dag uden spend', async () => {
    const kv = createMockKV();
    expect(await getDailySpend(kv, NOW)).toBe(0);
  });
});

describe('isBudgetExceeded', () => {
  it('returnerer false når under cap', async () => {
    const kv = createMockKV();
    await recordSpend(kv, 2.0, NOW);
    expect(await isBudgetExceeded(kv, 5.0, NOW)).toBe(false);
  });

  it('returnerer true når på eller over cap', async () => {
    const kv = createMockKV();
    await recordSpend(kv, 5.0, NOW);
    expect(await isBudgetExceeded(kv, 5.0, NOW)).toBe(true);
  });

  it('returnerer false ved cap=0 (forhindrer division/disable)', async () => {
    const kv = createMockKV();
    await recordSpend(kv, 0.01, NOW);
    expect(await isBudgetExceeded(kv, 0, NOW)).toBe(false);
  });
});
```

- [ ] **Step 2: Kør — forvent fejl**

- [ ] **Step 3: Implementér budget.ts**

`worker/news/budget.ts`:

```ts
import type { KVNamespace } from '@cloudflare/workers-types';

const KEY_PREFIX = 'news-budget:';
const TTL = 86400 * 3; // 3 dage opbevaring

function dateKey(now: Date): string {
  return `${KEY_PREFIX}${now.toISOString().slice(0, 10)}`;
}

export async function recordSpend(
  kv: KVNamespace,
  usdAmount: number,
  now: Date = new Date(),
): Promise<void> {
  const k = dateKey(now);
  const raw = await kv.get(k);
  const current = raw ? parseFloat(raw) : 0;
  const next = current + usdAmount;
  await kv.put(k, next.toFixed(6), { expirationTtl: TTL });
}

export async function getDailySpend(
  kv: KVNamespace,
  now: Date = new Date(),
): Promise<number> {
  const raw = await kv.get(dateKey(now));
  return raw ? parseFloat(raw) : 0;
}

export async function isBudgetExceeded(
  kv: KVNamespace,
  capUsd: number,
  now: Date = new Date(),
): Promise<boolean> {
  if (capUsd <= 0) return false;
  const spent = await getDailySpend(kv, now);
  return spent >= capUsd;
}
```

- [ ] **Step 4: Kør tests — forvent pass**

Forventet: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add worker/news/budget.ts worker/news/budget.test.ts
git commit -m "feat(news): daily spend tracker for cost-cap

KV-baseret counter prefixet 'news-budget:<YYYY-MM-DD>'. recordSpend
akkumulerer USD per dag. isBudgetExceeded checker mod NEWS_DAILY_BUDGET
secret. Cap=0 disabler check (fail-open).

7 vitest-tests."
```

---

## Task 6: `prompts.ts` — alle 4 Claude-prompts (birkenborg-agents)

Pure template-strings. Ingen logik. Letteste fil at iterere på når tonen halter.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/prompts.ts`
- Create: `worker/news/prompts.test.ts`

- [ ] **Step 1: Skriv minimal test**

`worker/news/prompts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  clarificationPrompt,
  outlinePrompt,
  draftPrompt,
  toneEvalPrompt,
  PERSONA_BASE,
} from './prompts';

describe('prompt templates', () => {
  it('PERSONA_BASE indeholder Philips tone-instrukser', () => {
    expect(PERSONA_BASE).toContain('skæv-inden-for-normen');
    expect(PERSONA_BASE).toContain('ingen consultant-fraser');
    expect(PERSONA_BASE).toContain('UDELUKKENDE på dansk');
  });

  it('clarificationPrompt interpolerer seed + artikel', () => {
    const p = clarificationPrompt({
      seedText: 'Min tanke',
      articleSummary: 'Artiklens indhold',
      voiceSamples: '## Post A\n\nbody',
    });
    expect(p).toContain('Min tanke');
    expect(p).toContain('Artiklens indhold');
    expect(p).toContain('## Post A');
  });

  it('outlinePrompt kræver substansh-checks', () => {
    const p = outlinePrompt({
      seedText: 's',
      articleSummary: 'a',
      clarificationA: 'svar',
      voiceSamples: 'v',
    });
    expect(p).toContain('konkret case');
    expect(p).toContain('kontrastiv tese');
    expect(p).toContain('internal link');
  });

  it('draftPrompt inkluderer outline og kræver Philips tone', () => {
    const p = draftPrompt({
      seedText: 's',
      articleSummary: 'a',
      clarificationA: 'svar',
      outlineText: 'outline-tekst',
      voiceSamples: 'v',
    });
    expect(p).toContain('outline-tekst');
    expect(p).toContain('skæv-inden-for-normen');
  });

  it('toneEvalPrompt har score-format-instruks', () => {
    const p = toneEvalPrompt({ draft: 'd', voiceSamples: 'v' });
    expect(p).toMatch(/score.*1.*10/i);
    expect(p).toContain('voice-fidelity');
  });
});
```

- [ ] **Step 2: Implementér prompts.ts**

`worker/news/prompts.ts`:

```ts
export const PERSONA_BASE = `Du er Philip Birkenborg-bot — Philips assistent til at producere /skrifter-poster på birkenborg.dev fra hans seeds (link + tanker).

SPROG: Du svarer UDELUKKENDE på dansk. Aldrig norsk, svensk eller engelsk —
heller ikke enkelte ord eller udtryk. Hvis du i tvivl: brug den danske form.
- "ikke" (dansk), ikke "ikke noe" (norsk)
- "kun", ikke "bare" i betydningen "only"
- "også", ikke "óg"
- "klinikker", ikke "klinikkar"
- "deres", ikke "deira"

STIL — Philips tone:
- Skæv-inden-for-normen, eksentrisk, humoristisk, lidt provokerende, engagerende
- Ingen consultant-fraser ("Selvfølgelig!", "Det er et godt spørgsmål", "Lad mig forklare")
- Ingen indledende høflighedsfraser. Gå direkte til sagen
- Skriv i 1. person, "jeg"
- Konkrete eksempler frem for abstrakter
- Aldrig juridisk rådgivning
- Aldrig nævne tal, klienter eller konkrete sager fra Tandlægen.dk

KERNEPRINCIP: Du må polere prosa, men aldrig opfinde substans. Hvis Philip
ikke har givet dig en pointe, så foreslå én og bed ham bekræfte. Opfind
ikke argumenter han ikke har gjort.
`;

interface ClarificationInput {
  seedText: string;
  articleSummary: string;
  voiceSamples: string;
}

export function clarificationPrompt(input: ClarificationInput): string {
  return `${PERSONA_BASE}

VOICE-SAMPLES (Philips eksisterende posts som tone-reference):
${input.voiceSamples}

SEED FRA PHILIP:
"${input.seedText}"

${input.articleSummary ? `ARTIKEL-INDHOLD:\n${input.articleSummary}\n` : '(ingen artikel-context)'}

OPGAVE:
Stil ÉT konkret afklarende spørgsmål for at sikre at du forstår Philips
tese korrekt. Spørgsmålet skal:
- Være kort (1-2 sætninger)
- Foreslå en konkret tese baseret på seed + artikel
- Bede Philip bekræfte eller præcisere
- Slutte med: "Svar med 1-2 sætninger eller bekræft med JA hvis det rammer."

Returner KUN spørgsmålet, ingen indledning eller andet.`;
}

interface OutlineInput {
  seedText: string;
  articleSummary: string;
  clarificationA: string;
  voiceSamples: string;
}

export function outlinePrompt(input: OutlineInput): string {
  return `${PERSONA_BASE}

VOICE-SAMPLES:
${input.voiceSamples}

SEED: "${input.seedText}"
${input.articleSummary ? `ARTIKEL: ${input.articleSummary}` : ''}
PHILIPS AFKLARING: "${input.clarificationA}"

OPGAVE:
Foreslå en outline til posten med præcis 4 punkter:
1. Tese (kontrastiv — modsiger eller præciserer en udbredt antagelse)
2. Ankerpunkt (konkret case, tal eller artikel-citat)
3. Nøgle-pointe (Philips originale insight)
4. Implikation eller internal link til en anden /skrifter-post hvis relevant

SUBSTANSH-KRAV: outlinen SKAL indeholde mindst 2 af følgende:
- konkret case (ikke generelt eksempel)
- kontrastiv tese (ikke balanceret oversigt)
- internal link til eksisterende /skrifter-post

Format outputtet som JSON:
{
  "items": [
    { "label": "Tese", "text": "..." },
    { "label": "Ankerpunkt", "text": "..." },
    { "label": "Nøgle-pointe", "text": "..." },
    { "label": "Implikation", "text": "..." }
  ],
  "hasCase": true|false,
  "hasContrast": true|false,
  "hasInternalLink": true|false
}

Returner KUN JSON, ingen prose-introduktion.`;
}

interface DraftInput {
  seedText: string;
  articleSummary: string;
  clarificationA: string;
  outlineText: string;
  voiceSamples: string;
}

export function draftPrompt(input: DraftInput): string {
  return `${PERSONA_BASE}

VOICE-SAMPLES (læs disse grundigt — match deres tone):
${input.voiceSamples}

SEED: "${input.seedText}"
${input.articleSummary ? `ARTIKEL: ${input.articleSummary}` : ''}
PHILIPS AFKLARING: "${input.clarificationA}"

OUTLINE (godkendt af Philip):
${input.outlineText}

OPGAVE:
Skriv en /skrifter-post baseret på outlinen ovenfor. Krav:
- 800-1500 ord
- Match Philips tone fra voice-samples PRÆCIST
- Ingen consultant-fraser, ingen indledende høflighedsfraser
- Skriv i 1. person ("jeg")
- Brug konkrete eksempler, ikke abstrakter
- Ingen invention af fakta — kun pointer fra outline + Philips afklaring
- Hvis outline har internal link: inkludér det inline ("som jeg skrev om i [post-titel](/skrifter/<slug>)")
- Slut med en knivskarp implikation eller pointe — ikke "konklusion: ..."

Returner KUN posten i markdown-format. Start med en H1-titel (# Titel),
derefter prose. Ingen frontmatter, ingen meta-kommentar.`;
}

interface ToneEvalInput {
  draft: string;
  voiceSamples: string;
}

export function toneEvalPrompt(input: ToneEvalInput): string {
  return `${PERSONA_BASE}

VOICE-SAMPLES (Philips ægte stemme):
${input.voiceSamples}

DRAFT TIL EVALUERING:
${input.draft}

OPGAVE:
Vurder draften's voice-fidelity (hvor meget den lyder som Philip) på en
skala fra 1-10.

Hvis score >= 8: returner JSON:
{ "score": <tal>, "verdict": "approved", "draft": "<draften uændret>" }

Hvis score < 8: omskriv draften til at ramme Philips tone bedre,
returner JSON:
{ "score": <tal>, "verdict": "rewritten", "draft": "<den omskrevne draft>", "issues": "<kort liste af tone-issues der blev fikset>" }

Returner KUN JSON, ingen prose-introduktion.`;
}
```

- [ ] **Step 3: Kør tests — forvent pass**

```bash
npx vitest run worker/news/prompts.test.ts
```

Forventet: 5 passed.

- [ ] **Step 4: Commit**

```bash
git add worker/news/prompts.ts worker/news/prompts.test.ts
git commit -m "feat(news): 4 Claude-prompts som template-strings

PERSONA_BASE: dansk-enforcement + Philips tone (skæv, eksentrisk, ingen
consultant-fraser) + kerneprincip 'poler prosa, opfind ikke substans'.

clarificationPrompt: foreslå tese + bed bekræfte
outlinePrompt: 4-punkt struktur, JSON-output, substansh-checks
draftPrompt: 800-1500 ord i Philips tone, ingen invention
toneEvalPrompt: score 1-10, rewrite hvis < 8

5 vitest-tests verificerer interpolation + nøgle-instrukser."
```

---

## Task 7: TDD `claude.ts` — Anthropic wrapper med caching (birkenborg-agents)

Wrapper omkring Anthropic Messages API. Cache_control på voice-samples. Retry på 5xx. Tracker token-usage til budget.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/claude.ts`
- Create: `worker/news/claude.test.ts`

- [ ] **Step 1: Skriv første failing test**

`worker/news/claude.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callClaude, calculateCost } from './claude';

const MOCK_RESPONSE = {
  content: [{ type: 'text', text: 'Bot reply text' }],
  usage: {
    input_tokens: 1000,
    output_tokens: 200,
    cache_creation_input_tokens: 500,
    cache_read_input_tokens: 0,
  },
};

describe('callClaude', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('kalder Anthropic Messages API med korrekt body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(MOCK_RESPONSE), { status: 200 }),
    );
    const result = await callClaude({
      apiKey: 'sk-test',
      model: 'claude-sonnet-4-6-20251111',
      systemBase: 'persona text',
      voiceSamples: 'voice samples text',
      userMessage: 'Hej',
      maxTokens: 1000,
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe('claude-sonnet-4-6-20251111');
    expect(body.max_tokens).toBe(1000);
    expect(body.system).toHaveLength(2);
    expect(body.system[1].cache_control).toEqual({ type: 'ephemeral' });
    expect(body.messages).toEqual([{ role: 'user', content: 'Hej' }]);
    expect(result.text).toBe('Bot reply text');
  });
});
```

- [ ] **Step 2: Kør — forvent fejl**

- [ ] **Step 3: Implementér claude.ts**

`worker/news/claude.ts`:

```ts
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_RETRIES = 3;

// Sonnet 4.6 pricing (Anthropic per 1M tokens)
const PRICE_INPUT_USD = 3.0 / 1_000_000;
const PRICE_OUTPUT_USD = 15.0 / 1_000_000;
const PRICE_CACHE_WRITE_USD = 3.75 / 1_000_000;
const PRICE_CACHE_READ_USD = 0.30 / 1_000_000;

export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

export interface ClaudeResult {
  text: string;
  usage: ClaudeUsage;
  costUsd: number;
}

export interface ClaudeCallOptions {
  apiKey: string;
  model: string;
  systemBase: string;
  voiceSamples: string;
  userMessage: string;
  maxTokens: number;
}

export async function callClaude(opts: ClaudeCallOptions): Promise<ClaudeResult> {
  const body = {
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: [
      { type: 'text', text: opts.systemBase },
      {
        type: 'text',
        text: opts.voiceSamples,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: opts.userMessage }],
  };

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': opts.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      });
      if (res.status >= 500 && res.status < 600) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      if (!res.ok) {
        throw new Error(`anthropic_${res.status}`);
      }
      const data = await res.json() as {
        content: Array<{ type: string; text: string }>;
        usage: ClaudeUsage;
      };
      const text = data.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');
      const costUsd = calculateCost(data.usage);
      return { text, usage: data.usage, costUsd };
    } catch (e) {
      lastErr = e as Error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr ?? new Error('anthropic_unknown');
}

export function calculateCost(usage: ClaudeUsage): number {
  const cacheReadCost = usage.cache_read_input_tokens * PRICE_CACHE_READ_USD;
  const cacheWriteCost = usage.cache_creation_input_tokens * PRICE_CACHE_WRITE_USD;
  const freshInputCost =
    (usage.input_tokens - usage.cache_creation_input_tokens) * PRICE_INPUT_USD;
  const outputCost = usage.output_tokens * PRICE_OUTPUT_USD;
  return cacheReadCost + cacheWriteCost + freshInputCost + outputCost;
}
```

- [ ] **Step 4: Kør test — forvent pass**

```bash
npx vitest run worker/news/claude.test.ts
```

Forventet: 1 passed.

- [ ] **Step 5: Tilføj fuld test-suite**

Erstat `worker/news/claude.test.ts` med:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callClaude, calculateCost, type ClaudeUsage } from './claude';

const MOCK_RESPONSE = {
  content: [{ type: 'text', text: 'Bot reply text' }],
  usage: {
    input_tokens: 1000,
    output_tokens: 200,
    cache_creation_input_tokens: 500,
    cache_read_input_tokens: 0,
  },
};

const baseOpts = {
  apiKey: 'sk-test',
  model: 'claude-sonnet-4-6-20251111',
  systemBase: 'persona',
  voiceSamples: 'samples',
  userMessage: 'Hej',
  maxTokens: 1000,
};

describe('callClaude', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returnerer text og usage fra Anthropic-respons', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(MOCK_RESPONSE), { status: 200 }),
    );
    const result = await callClaude(baseOpts);
    expect(result.text).toBe('Bot reply text');
    expect(result.usage.input_tokens).toBe(1000);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('cache_control sat på voice-samples block', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(MOCK_RESPONSE), { status: 200 }),
    );
    await callClaude(baseOpts);
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.system[1].cache_control).toEqual({ type: 'ephemeral' });
    expect(body.system[0].cache_control).toBeUndefined();
  });

  it('retry op til 3 gange på 5xx', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(MOCK_RESPONSE), { status: 200 }));
    const result = await callClaude(baseOpts);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(result.text).toBe('Bot reply text');
  }, 30000);

  it('throws efter 3 retries på 5xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(callClaude(baseOpts)).rejects.toThrow();
  }, 30000);

  it('throws øjeblikkeligt på 4xx (auth fejl)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('unauthorized', { status: 401 }),
    );
    await expect(callClaude(baseOpts)).rejects.toThrow(/anthropic_401/);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('calculateCost', () => {
  it('beregner cost for fully fresh input', () => {
    const usage: ClaudeUsage = {
      input_tokens: 1000,
      output_tokens: 100,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    };
    const cost = calculateCost(usage);
    // 1000 × $3/M + 100 × $15/M = $0.003 + $0.0015 = $0.0045
    expect(cost).toBeCloseTo(0.0045, 5);
  });

  it('inkluderer cache write-cost i input', () => {
    const usage: ClaudeUsage = {
      input_tokens: 5000,
      output_tokens: 100,
      cache_creation_input_tokens: 4000,
      cache_read_input_tokens: 0,
    };
    const cost = calculateCost(usage);
    // 4000 × $3.75/M (write) + 1000 × $3/M (fresh) + 100 × $15/M (output)
    // = $0.015 + $0.003 + $0.0015 = $0.0195
    expect(cost).toBeCloseTo(0.0195, 5);
  });

  it('inkluderer cache read-rabat', () => {
    const usage: ClaudeUsage = {
      input_tokens: 5000,
      output_tokens: 100,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 4000,
    };
    const cost = calculateCost(usage);
    // 4000 × $0.30/M (read, ikke i input_tokens-tællingen) +
    // 5000 × $3/M (fresh input) + 100 × $15/M (output)
    expect(cost).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Kør alle claude-tests**

```bash
npx vitest run worker/news/claude.test.ts
```

Forventet: 8 passed.

- [ ] **Step 7: Commit**

```bash
git add worker/news/claude.ts worker/news/claude.test.ts
git commit -m "feat(news): Anthropic wrapper med cache_control + retry + cost-tracking

callClaude wrapper:
- system: [persona, voice-samples (cache_control: ephemeral)]
- Retry op til 3x på 5xx med exponential backoff (1s, 2s, 4s)
- Throw øjeblikkeligt på 4xx (ingen retry på auth-fejl)

calculateCost: Sonnet 4.6 pricing — fresh input \$3/M, output \$15/M,
cache write \$3.75/M, cache read \$0.30/M.

8 vitest-tests."
```

---

## Task 8: TDD handler — `startNewSeed` (birkenborg-agents)

Første step af pipelinen: modtag seed, fetch artikel, kald Claude for afklaring, gem state, DM bruger.

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/news/handler.ts`
- Create: `worker/news/handler.test.ts`

- [ ] **Step 1: Definer NewsEnv + handler-skelet**

`worker/news/handler.ts`:

```ts
import type { KVNamespace } from '@cloudflare/workers-types';
import { createSeed, getSeed, setSeed, listInflight, abortSeed, type Seed } from './state';
import { fetchArticle, extractFirstUrl } from './article';
import { loadVoiceSamples, formatVoiceSamples } from './voice';
import { recordSpend, isBudgetExceeded } from './budget';
import { callClaude } from './claude';
import {
  PERSONA_BASE,
  clarificationPrompt,
  outlinePrompt,
  draftPrompt,
  toneEvalPrompt,
} from './prompts';

export interface NewsEnv {
  BOT_STATE: KVNamespace;
  ANTHROPIC_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  AUTHORIZED_CHAT_ID: string;
  NEWS_DAILY_BUDGET?: string;
  NEWS_DISABLED?: string;
  NEWS_MODEL?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-6-20251111';
const DEFAULT_DAILY_CAP_USD = 5;
const MAX_INFLIGHT = 3;

export async function startNewSeed(
  env: NewsEnv,
  chatId: number,
  seedText: string,
): Promise<{ tgMessage: string; seedId: string } | { error: string }> {
  // 1. Tjek inflight-cap
  const inflight = await listInflight(env.BOT_STATE, chatId);
  if (inflight.length >= MAX_INFLIGHT) {
    return {
      error: `Du har ${inflight.length} in-flight seeds. Færdiggør eller STOP en før du starter en ny.`,
    };
  }

  // 2. Opret seed-state
  const seed = await createSeed(env.BOT_STATE, chatId, seedText);

  // 3. Fetch artikel hvis URL i seed
  const url = extractFirstUrl(seedText);
  if (url) {
    seed.articleUrl = url;
    const article = await fetchArticle(url);
    if (article) {
      seed.articleSummary = article.markdown;
    }
  }

  // 4. Load voice-samples
  const samples = await loadVoiceSamples();
  const voiceSamples = formatVoiceSamples(samples);

  // 5. Kald Claude for afklaring
  const prompt = clarificationPrompt({
    seedText,
    articleSummary: seed.articleSummary ?? '',
    voiceSamples,
  });

  let claudeResult;
  try {
    claudeResult = await callClaude({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.NEWS_MODEL ?? DEFAULT_MODEL,
      systemBase: PERSONA_BASE,
      voiceSamples,
      userMessage: prompt,
      maxTokens: 300,
    });
  } catch (e) {
    seed.state = 'FAILED';
    await setSeed(env.BOT_STATE, seed);
    return { error: 'Anthropic er nede lige nu. Prøv igen om lidt.' };
  }

  await recordSpend(env.BOT_STATE, claudeResult.costUsd);

  // 6. Gem afklarings-spørgsmål, opdatér state
  seed.clarificationQ = claudeResult.text;
  seed.state = 'CLARIFYING';
  await setSeed(env.BOT_STATE, seed);

  // 7. Returner DM-besked
  const articleNote = url && !seed.articleSummary
    ? '\n_(Kunne ikke hente artiklen — fortsætter med kun din tanke.)_\n'
    : '';
  const articlePreview = seed.articleSummary
    ? `\n📄 Læser artiklen.\n`
    : '';

  return {
    tgMessage: `${articlePreview}${articleNote}\n${claudeResult.text}`,
    seedId: seed.id,
  };
}
```

- [ ] **Step 2: Skriv test for inflight-cap**

`worker/news/handler.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startNewSeed, type NewsEnv } from './handler';
import { createMockKV } from '../test-helpers';

function makeEnv(overrides: Partial<NewsEnv> = {}): NewsEnv {
  return {
    BOT_STATE: createMockKV(),
    ANTHROPIC_API_KEY: 'sk-test',
    TELEGRAM_BOT_TOKEN: 'tg-test',
    AUTHORIZED_CHAT_ID: '12345',
    NEWS_DAILY_BUDGET: undefined,
    NEWS_DISABLED: undefined,
    NEWS_MODEL: undefined,
    ...overrides,
  };
}

function mockClaudeReply(text: string): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const u = url.toString();
    if (u.includes('birkenborg.dev/voice-samples')) {
      return new Response('[]', { status: 200 });
    }
    if (u.includes('r.jina.ai')) {
      return new Response('# Article\n\nContent.', { status: 200 });
    }
    if (u.includes('api.anthropic.com')) {
      return new Response(JSON.stringify({
        content: [{ type: 'text', text }],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('startNewSeed', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('afviser når 3 in-flight seeds findes', async () => {
    const env = makeEnv();
    const { createSeed } = await import('./state');
    await createSeed(env.BOT_STATE, 12345, 'a');
    await createSeed(env.BOT_STATE, 12345, 'b');
    await createSeed(env.BOT_STATE, 12345, 'c');

    const result = await startNewSeed(env, 12345, 'd');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/in-flight seeds/);
  });
});
```

- [ ] **Step 3: Kør — forvent pass**

```bash
npx vitest run worker/news/handler.test.ts
```

Forventet: 1 passed.

- [ ] **Step 4: Tilføj happy-path tests**

Erstat hele `worker/news/handler.test.ts` med:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startNewSeed, type NewsEnv } from './handler';
import { createMockKV } from '../test-helpers';
import { createSeed, getSeed, listInflight } from './state';

function makeEnv(overrides: Partial<NewsEnv> = {}): NewsEnv {
  return {
    BOT_STATE: createMockKV(),
    ANTHROPIC_API_KEY: 'sk-test',
    TELEGRAM_BOT_TOKEN: 'tg-test',
    AUTHORIZED_CHAT_ID: '12345',
    NEWS_DAILY_BUDGET: undefined,
    NEWS_DISABLED: undefined,
    NEWS_MODEL: undefined,
    ...overrides,
  };
}

function setupMocks(claudeReply: string = 'Forstår jeg dig ret? ...'): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const u = url.toString();
    if (u.includes('birkenborg.dev/voice-samples')) {
      return new Response('[]', { status: 200 });
    }
    if (u.includes('r.jina.ai')) {
      return new Response('# Article\n\nContent.', { status: 200 });
    }
    if (u.includes('api.anthropic.com')) {
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: claudeReply }],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('startNewSeed', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('afviser når 3 in-flight seeds findes', async () => {
    const env = makeEnv();
    await createSeed(env.BOT_STATE, 12345, 'a');
    await createSeed(env.BOT_STATE, 12345, 'b');
    await createSeed(env.BOT_STATE, 12345, 'c');

    const result = await startNewSeed(env, 12345, 'd');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/in-flight seeds/);
  });

  it('opretter seed i CLARIFYING med Claude-svar', async () => {
    setupMocks('Forstår jeg dig ret? Du peger på X?');
    const env = makeEnv();

    const result = await startNewSeed(env, 12345, 'GDPR-tanke https://example.com');
    expect('seedId' in result).toBe(true);
    if (!('seedId' in result)) return;

    const seed = await getSeed(env.BOT_STATE, 12345, result.seedId);
    expect(seed?.state).toBe('CLARIFYING');
    expect(seed?.clarificationQ).toMatch(/Forstår jeg dig/);
    expect(seed?.articleUrl).toBe('https://example.com');
    expect(seed?.articleSummary).toBeDefined();
  });

  it('fortsætter uden artikel-context hvis fetch fejler', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes('birkenborg.dev/voice-samples')) {
        return new Response('[]', { status: 200 });
      }
      if (u.includes('r.jina.ai')) {
        return new Response('error', { status: 500 });
      }
      if (u.includes('api.anthropic.com')) {
        return new Response(JSON.stringify({
          content: [{ type: 'text', text: 'svar' }],
          usage: { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
        }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
    const env = makeEnv();

    const result = await startNewSeed(env, 12345, 'GDPR https://broken.example');
    expect('seedId' in result).toBe(true);
    if (!('seedId' in result)) return;

    const seed = await getSeed(env.BOT_STATE, 12345, result.seedId);
    expect(seed?.articleSummary).toBeUndefined();
    expect(seed?.state).toBe('CLARIFYING');
    expect(result.tgMessage).toMatch(/Kunne ikke hente artiklen/);
  });

  it('returnerer fejl når Anthropic fejler', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes('birkenborg.dev/voice-samples')) {
        return new Response('[]', { status: 200 });
      }
      if (u.includes('api.anthropic.com')) {
        return new Response('boom', { status: 500 });
      }
      return new Response('not found', { status: 404 });
    });
    const env = makeEnv();

    const result = await startNewSeed(env, 12345, 'tanke uden link');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/Anthropic er nede/);
  }, 30000);

  it('opretter seed selv uden URL i seed-tekst', async () => {
    setupMocks();
    const env = makeEnv();

    const result = await startNewSeed(env, 12345, 'En tanke uden link');
    expect('seedId' in result).toBe(true);
    if (!('seedId' in result)) return;

    const seed = await getSeed(env.BOT_STATE, 12345, result.seedId);
    expect(seed?.articleUrl).toBeUndefined();
  });
});
```

- [ ] **Step 5: Kør tests**

```bash
npx vitest run worker/news/handler.test.ts
```

Forventet: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add worker/news/handler.ts worker/news/handler.test.ts
git commit -m "feat(news): handler.startNewSeed — første step af pipeline

Tjekker inflight-cap (max 3), opretter seed, fetcher artikel, loader
voice-samples, kalder Claude for afklarings-spørgsmål, gemmer state,
returnerer DM-besked. Fail-safe: artikel-fetch-fejl fortsætter uden
context; Anthropic-fejl returnerer FAILED + bruger-DM.

5 vitest-tests dækker inflight-cap, happy path, artikel-fail, anthropic-
fail, og uden URL."
```

---

## Task 9: TDD handler — `continueClarification` (birkenborg-agents)

Modtag brugersvar på afklarings-spørgsmål, kald Claude for outline, gem state.

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/news/handler.ts`
- Modify: `worker/news/handler.test.ts`

- [ ] **Step 1: Tilføj continueClarification i handler.ts**

I `worker/news/handler.ts`, tilføj efter `startNewSeed`:

```ts
export async function continueClarification(
  env: NewsEnv,
  seed: Seed,
  userAnswer: string,
): Promise<{ tgMessage: string } | { error: string }> {
  if (seed.state !== 'CLARIFYING') {
    return { error: `Seed ${seed.id} er i state ${seed.state}, ikke CLARIFYING.` };
  }

  // Gem brugerens svar
  seed.clarificationA = userAnswer;
  seed.state = 'OUTLINING';
  await setSeed(env.BOT_STATE, seed);

  // Load voice-samples
  const samples = await loadVoiceSamples();
  const voiceSamples = formatVoiceSamples(samples);

  // Kald Claude for outline
  const prompt = outlinePrompt({
    seedText: seed.seedText,
    articleSummary: seed.articleSummary ?? '',
    clarificationA: userAnswer,
    voiceSamples,
  });

  let result;
  try {
    result = await callClaude({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.NEWS_MODEL ?? DEFAULT_MODEL,
      systemBase: PERSONA_BASE,
      voiceSamples,
      userMessage: prompt,
      maxTokens: 800,
    });
  } catch (e) {
    seed.state = 'FAILED';
    await setSeed(env.BOT_STATE, seed);
    return { error: 'Anthropic er nede. Prøv igen om lidt.' };
  }

  await recordSpend(env.BOT_STATE, result.costUsd);

  // Parse outline JSON
  let outline;
  try {
    outline = JSON.parse(result.text);
  } catch (e) {
    seed.state = 'FAILED';
    await setSeed(env.BOT_STATE, seed);
    return { error: 'Kunne ikke parse outline-respons. Prøv at sende seed igen.' };
  }

  seed.outline = outline;
  await setSeed(env.BOT_STATE, seed);

  // Format outline til DM
  const items = outline.items
    .map((it: { label: string; text: string }, i: number) =>
      `${i + 1}. **${it.label}:** ${it.text}`)
    .join('\n');
  const checks = [
    outline.hasCase ? '✓ konkret case' : '✗ konkret case',
    outline.hasContrast ? '✓ kontrastiv tese' : '✗ kontrastiv tese',
    outline.hasInternalLink ? '✓ internal link' : '✗ internal link',
  ].join(' · ');

  return {
    tgMessage: `Forslag til outline:\n\n${items}\n\nSubstansh-tjek: ${checks}\n\nSvar **JA** for at drafte, **REDIGER** hvis vinklen er forkert, eller skriv ændringer direkte.`,
  };
}
```

- [ ] **Step 2: Tilføj test**

I `worker/news/handler.test.ts`, tilføj nye describe-blok:

```ts
describe('continueClarification', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('opdaterer seed til OUTLINING og returnerer outline-DM', async () => {
    setupMocks(JSON.stringify({
      items: [
        { label: 'Tese', text: 'Min tese' },
        { label: 'Ankerpunkt', text: 'Konkret case' },
        { label: 'Pointe', text: 'Min pointe' },
        { label: 'Implikation', text: 'Min implikation' },
      ],
      hasCase: true,
      hasContrast: true,
      hasInternalLink: false,
    }));
    const env = makeEnv();

    // Setup: opret seed i CLARIFYING
    const { createSeed, getSeed, setSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');
    seed.state = 'CLARIFYING';
    seed.clarificationQ = 'spørgsmål?';
    await setSeed(env.BOT_STATE, seed);

    const { continueClarification } = await import('./handler');
    const result = await continueClarification(env, seed, 'mit svar');

    expect('tgMessage' in result).toBe(true);
    if (!('tgMessage' in result)) return;
    expect(result.tgMessage).toMatch(/Tese/);
    expect(result.tgMessage).toMatch(/JA/);

    const updated = await getSeed(env.BOT_STATE, 12345, seed.id);
    expect(updated?.state).toBe('OUTLINING');
    expect(updated?.clarificationA).toBe('mit svar');
    expect(updated?.outline?.hasCase).toBe(true);
  });

  it('afviser hvis seed ikke er i CLARIFYING', async () => {
    const env = makeEnv();
    const { createSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');
    seed.state = 'OUTLINING';

    const { continueClarification } = await import('./handler');
    const result = await continueClarification(env, seed, 'svar');

    expect('error' in result).toBe(true);
  });

  it('returnerer fejl ved invalid JSON-respons', async () => {
    setupMocks('not valid json');
    const env = makeEnv();
    const { createSeed, setSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');
    seed.state = 'CLARIFYING';
    await setSeed(env.BOT_STATE, seed);

    const { continueClarification } = await import('./handler');
    const result = await continueClarification(env, seed, 'svar');

    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/parse outline/);
  });
});
```

- [ ] **Step 3: Kør tests**

Forventet: 8 passed (5 fra Task 8 + 3 nye).

- [ ] **Step 4: Commit**

```bash
git add worker/news/handler.ts worker/news/handler.test.ts
git commit -m "feat(news): handler.continueClarification — outline-step

Modtager brugersvar på afklarings-spørgsmål, opdaterer state til
OUTLINING, kalder Claude for outline (max 800 tokens), parser JSON,
gemmer outline i seed-state, returnerer formateret DM med substansh-
tjek (case/kontrast/internal-link).

3 nye tests."
```

---

## Task 10: TDD handler — `handleOutlineApproval` (birkenborg-agents)

Modtag JA på outline, kør draft + tone-eval, gem draft, returner draft-DM.

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/news/handler.ts`
- Modify: `worker/news/handler.test.ts`

- [ ] **Step 1: Tilføj handleOutlineApproval**

I `worker/news/handler.ts`, tilføj:

```ts
export async function handleOutlineApproval(
  env: NewsEnv,
  seed: Seed,
): Promise<{ tgMessage: string } | { error: string }> {
  if (seed.state !== 'OUTLINING') {
    return { error: `Seed ${seed.id} er i state ${seed.state}, ikke OUTLINING.` };
  }
  if (!seed.outline) {
    return { error: 'Outline mangler — genstart pipeline.' };
  }

  seed.state = 'DRAFTING';
  await setSeed(env.BOT_STATE, seed);

  const samples = await loadVoiceSamples();
  const voiceSamples = formatVoiceSamples(samples);

  // Format outline til prompt
  const outlineText = seed.outline.items
    .map((it, i) => `${i + 1}. ${it.label}: ${it.text}`)
    .join('\n');

  // 1. Draft
  const draftPromptText = draftPrompt({
    seedText: seed.seedText,
    articleSummary: seed.articleSummary ?? '',
    clarificationA: seed.clarificationA ?? '',
    outlineText,
    voiceSamples,
  });

  let draftResult;
  try {
    draftResult = await callClaude({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.NEWS_MODEL ?? DEFAULT_MODEL,
      systemBase: PERSONA_BASE,
      voiceSamples,
      userMessage: draftPromptText,
      maxTokens: 4000,
    });
  } catch {
    seed.state = 'FAILED';
    await setSeed(env.BOT_STATE, seed);
    return { error: 'Draft-generation fejlede. Prøv igen.' };
  }

  await recordSpend(env.BOT_STATE, draftResult.costUsd);
  let draft = draftResult.text;

  // 2. Tone-eval
  const evalPromptText = toneEvalPrompt({ draft, voiceSamples });
  let evalResult;
  try {
    evalResult = await callClaude({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.NEWS_MODEL ?? DEFAULT_MODEL,
      systemBase: PERSONA_BASE,
      voiceSamples,
      userMessage: evalPromptText,
      maxTokens: 4000,
    });
  } catch {
    // Eval-fejl er ikke fatal — brug raw draft
    seed.draft = draft;
    seed.toneScore = 0;
    seed.state = 'REVIEWING';
    await setSeed(env.BOT_STATE, seed);
    return {
      tgMessage: formatDraftMessage(draft, 0, 'eval-fejlede'),
    };
  }

  await recordSpend(env.BOT_STATE, evalResult.costUsd);

  let toneJson;
  try {
    toneJson = JSON.parse(evalResult.text);
  } catch {
    // JSON-parse-fejl: brug raw draft
    seed.draft = draft;
    seed.toneScore = 0;
    seed.state = 'REVIEWING';
    await setSeed(env.BOT_STATE, seed);
    return { tgMessage: formatDraftMessage(draft, 0) };
  }

  // Brug rewritten draft hvis verdict = rewritten
  const finalDraft = toneJson.verdict === 'rewritten' ? toneJson.draft : draft;
  const score = toneJson.score ?? 0;

  seed.draft = finalDraft;
  seed.toneScore = score;
  seed.state = 'REVIEWING';
  await setSeed(env.BOT_STATE, seed);

  return { tgMessage: formatDraftMessage(finalDraft, score) };
}

function formatDraftMessage(draft: string, score: number, note?: string): string {
  // Telegram-DM må max være ~4000 tegn. Trunker hvis nødvendigt.
  const TRUNCATE_AT = 2500;
  const truncated = draft.length > TRUNCATE_AT
    ? draft.slice(0, TRUNCATE_AT) + '\n\n[...trunkeret. Hele draften lever i KV. Svar YES for publish, STOP for kasser.]'
    : draft;
  const scoreNote = score > 0
    ? `Tone-eval: ${score}/10`
    : note === 'eval-fejlede'
      ? 'Tone-eval fejlede; viser raw draft'
      : 'Tone-eval: parse-fejl';
  return `Draft færdig (${draft.length} tegn). ${scoreNote}.\n\n${truncated}\n\n**YES** publish · **STOP** kasser · **EDIT** genstart med ny vinkel`;
}
```

- [ ] **Step 2: Tilføj tests**

I `worker/news/handler.test.ts`, tilføj describe-blok:

```ts
describe('handleOutlineApproval', () => {
  beforeEach(() => vi.restoreAllMocks());

  function setupDraftMocks(draftText: string, toneJson: object): void {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes('birkenborg.dev/voice-samples')) {
        return new Response('[]', { status: 200 });
      }
      if (u.includes('api.anthropic.com')) {
        callCount += 1;
        const text = callCount === 1 ? draftText : JSON.stringify(toneJson);
        return new Response(JSON.stringify({
          content: [{ type: 'text', text }],
          usage: {
            input_tokens: 1000,
            output_tokens: 500,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
  }

  async function setupSeedInOutlining(env: NewsEnv) {
    const { createSeed, setSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');
    seed.state = 'OUTLINING';
    seed.clarificationA = 'mit svar';
    seed.outline = {
      items: [
        { label: 'Tese', text: 'a' },
        { label: 'Ankerpunkt', text: 'b' },
        { label: 'Pointe', text: 'c' },
        { label: 'Implikation', text: 'd' },
      ],
      hasCase: true,
      hasContrast: true,
      hasInternalLink: false,
    };
    await setSeed(env.BOT_STATE, seed);
    return seed;
  }

  it('opretter draft, kører tone-eval, går til REVIEWING', async () => {
    setupDraftMocks(
      '# Min Post\n\nFuldt indhold her.',
      { score: 9, verdict: 'approved', draft: '# Min Post\n\nFuldt indhold her.' },
    );
    const env = makeEnv();
    const seed = await setupSeedInOutlining(env);

    const { handleOutlineApproval } = await import('./handler');
    const result = await handleOutlineApproval(env, seed);

    expect('tgMessage' in result).toBe(true);
    if (!('tgMessage' in result)) return;
    expect(result.tgMessage).toMatch(/9\/10/);
    expect(result.tgMessage).toMatch(/YES/);

    const { getSeed } = await import('./state');
    const updated = await getSeed(env.BOT_STATE, 12345, seed.id);
    expect(updated?.state).toBe('REVIEWING');
    expect(updated?.toneScore).toBe(9);
    expect(updated?.draft).toContain('Min Post');
  });

  it('bruger rewritten draft hvis verdict=rewritten', async () => {
    setupDraftMocks(
      '# Original\n\nflad tekst',
      { score: 6, verdict: 'rewritten', draft: '# Rewritten\n\nbedre tekst' },
    );
    const env = makeEnv();
    const seed = await setupSeedInOutlining(env);

    const { handleOutlineApproval } = await import('./handler');
    const result = await handleOutlineApproval(env, seed);

    expect('tgMessage' in result).toBe(true);
    const { getSeed } = await import('./state');
    const updated = await getSeed(env.BOT_STATE, 12345, seed.id);
    expect(updated?.draft).toContain('Rewritten');
  });

  it('afviser hvis seed ikke er i OUTLINING', async () => {
    const env = makeEnv();
    const { createSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');

    const { handleOutlineApproval } = await import('./handler');
    const result = await handleOutlineApproval(env, seed);
    expect('error' in result).toBe(true);
  });
});
```

- [ ] **Step 3: Kør tests**

Forventet: 11 passed.

- [ ] **Step 4: Commit**

```bash
git add worker/news/handler.ts worker/news/handler.test.ts
git commit -m "feat(news): handler.handleOutlineApproval — draft + tone-eval steps

To Claude-calls i sekvens: draft (4K max tokens) → tone-eval (med
rewrite-fallback). Gemmer endelig draft i seed.draft, score i
seed.toneScore. State går til REVIEWING. DM trunkeres til 2500 tegn
i Telegram, fuld draft beholdes i KV.

3 nye tests."
```

---

## Task 11: TDD handler — `handleDraftReview` (birkenborg-agents)

Håndter YES/STOP/EDIT på draft. YES = state PUBLISHED (placeholder for M2), STOP = ABORTED, EDIT = tilbage til OUTLINING.

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/news/handler.ts`
- Modify: `worker/news/handler.test.ts`

- [ ] **Step 1: Tilføj handleDraftReview**

I `worker/news/handler.ts`:

```ts
export async function handleDraftReview(
  env: NewsEnv,
  seed: Seed,
  userText: string,
): Promise<{ tgMessage: string } | { error: string }> {
  if (seed.state !== 'REVIEWING') {
    return { error: `Seed ${seed.id} er i state ${seed.state}, ikke REVIEWING.` };
  }

  const upper = userText.trim().toUpperCase();

  if (upper === 'YES') {
    // M1: bare markér PUBLISHED uden GitHub-push.
    // M2 vil tilføje publish.publishToGitHub(seed) her.
    seed.state = 'PUBLISHED';
    await setSeed(env.BOT_STATE, seed);
    return {
      tgMessage: `Draft markeret klar (M1: ingen publish endnu — det kommer i M2). Seed ${seed.id} arkiveret.`,
    };
  }

  if (upper === 'STOP') {
    seed.state = 'ABORTED';
    await setSeed(env.BOT_STATE, seed);
    return { tgMessage: `Draft kasseret. Seed ${seed.id} aborted.` };
  }

  if (upper.startsWith('EDIT')) {
    // Genstart fra outline-step
    seed.state = 'OUTLINING';
    seed.draft = undefined;
    seed.toneScore = undefined;
    await setSeed(env.BOT_STATE, seed);
    return {
      tgMessage: `OK — rediger din vinkel og send beskeden igen, så genererer jeg en ny outline.`,
    };
  }

  // Andet svar: forstå som ny vinkel-input → genstart fra outline med dette som ny clarificationA
  seed.state = 'CLARIFYING';
  seed.outline = undefined;
  seed.draft = undefined;
  seed.toneScore = undefined;
  await setSeed(env.BOT_STATE, seed);
  return continueClarification(env, seed, userText);
}
```

- [ ] **Step 2: Tilføj tests**

```ts
describe('handleDraftReview', () => {
  beforeEach(() => vi.restoreAllMocks());

  async function setupSeedInReviewing(env: NewsEnv) {
    const { createSeed, setSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');
    seed.state = 'REVIEWING';
    seed.draft = '# Draft\n\nIndhold.';
    seed.toneScore = 9;
    await setSeed(env.BOT_STATE, seed);
    return seed;
  }

  it('YES → state PUBLISHED', async () => {
    const env = makeEnv();
    const seed = await setupSeedInReviewing(env);
    const { handleDraftReview } = await import('./handler');
    const result = await handleDraftReview(env, seed, 'YES');
    expect('tgMessage' in result).toBe(true);
    const { getSeed } = await import('./state');
    expect((await getSeed(env.BOT_STATE, 12345, seed.id))?.state).toBe('PUBLISHED');
  });

  it('STOP → state ABORTED', async () => {
    const env = makeEnv();
    const seed = await setupSeedInReviewing(env);
    const { handleDraftReview } = await import('./handler');
    const result = await handleDraftReview(env, seed, 'STOP');
    const { getSeed } = await import('./state');
    expect((await getSeed(env.BOT_STATE, 12345, seed.id))?.state).toBe('ABORTED');
  });

  it('EDIT → state OUTLINING, draft cleared', async () => {
    const env = makeEnv();
    const seed = await setupSeedInReviewing(env);
    const { handleDraftReview } = await import('./handler');
    await handleDraftReview(env, seed, 'EDIT');
    const { getSeed } = await import('./state');
    const updated = await getSeed(env.BOT_STATE, 12345, seed.id);
    expect(updated?.state).toBe('OUTLINING');
    expect(updated?.draft).toBeUndefined();
  });

  it('YES er case-insensitive', async () => {
    const env = makeEnv();
    const seed = await setupSeedInReviewing(env);
    const { handleDraftReview } = await import('./handler');
    await handleDraftReview(env, seed, 'yes');
    const { getSeed } = await import('./state');
    expect((await getSeed(env.BOT_STATE, 12345, seed.id))?.state).toBe('PUBLISHED');
  });
});
```

- [ ] **Step 3: Kør tests**

Forventet: 15 passed.

- [ ] **Step 4: Commit**

```bash
git add worker/news/handler.ts worker/news/handler.test.ts
git commit -m "feat(news): handler.handleDraftReview — YES/STOP/EDIT-handlers

YES → PUBLISHED (M1 placeholder; M2 tilføjer GitHub-push).
STOP → ABORTED.
EDIT → tilbage til OUTLINING (bruger venter på ny seed).
Andet tekst-svar → re-clarify med teksten som nyt afklarings-svar.

4 nye tests."
```

---

## Task 12: TDD handler — STOP-menu, /inbox, ny-seed-router (birkenborg-agents)

Public dispatchers: hvad gør bot'en når brugeren skriver STOP, /inbox, eller ny besked.

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/news/handler.ts`
- Modify: `worker/news/handler.test.ts`

- [ ] **Step 1: Tilføj router + STOP-menu + /inbox**

I `worker/news/handler.ts`:

```ts
// Hovedrouter: hvad gør bot'en når en Telegram-besked ankommer
export async function handleNewsMessage(
  env: NewsEnv,
  chatId: number,
  text: string,
): Promise<string> {
  // Whitelist
  if (chatId.toString() !== env.AUTHORIZED_CHAT_ID) {
    return 'Ikke autoriseret.';
  }

  // Kill-switch
  if (env.NEWS_DISABLED === '1') {
    return 'News-pipeline er midlertidigt slået fra.';
  }

  // Daily budget
  const cap = env.NEWS_DAILY_BUDGET ? parseFloat(env.NEWS_DAILY_BUDGET) : DEFAULT_DAILY_CAP_USD;
  if (await isBudgetExceeded(env.BOT_STATE, cap)) {
    return 'Dagens budget er brugt op. Kom tilbage i morgen.';
  }

  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // /inbox
  if (trimmed === '/inbox') {
    return formatInbox(await listInflight(env.BOT_STATE, chatId));
  }

  // STOP — med menu hvis flere
  if (upper === 'STOP' || upper.startsWith('STOP ')) {
    return handleStopCommand(env, chatId, trimmed);
  }

  // Numerisk svar på STOP-menu
  const inflight = await listInflight(env.BOT_STATE, chatId);
  const stopMenuActive = await env.BOT_STATE.get(`news-stop-menu:${chatId}`);
  if (stopMenuActive && /^\d+$|^alle$/i.test(trimmed)) {
    await env.BOT_STATE.delete(`news-stop-menu:${chatId}`);
    if (trimmed.toLowerCase() === 'alle') {
      for (const seed of inflight) await abortSeed(env.BOT_STATE, chatId, seed.id);
      return `Stoppet ${inflight.length} seeds.`;
    }
    const idx = parseInt(trimmed, 10) - 1;
    if (idx < 0 || idx >= inflight.length) {
      return 'Ugyldigt nummer. Send STOP igen for menu.';
    }
    const seed = inflight[idx]!;
    await abortSeed(env.BOT_STATE, chatId, seed.id);
    return `Stoppet seed ${seed.id} ("${seed.seedText.slice(0, 40)}...").`;
  }

  // Hvis seed med URL eller /news-prefix → ny seed
  if (extractFirstUrl(trimmed) || trimmed.toLowerCase().startsWith('/news ')) {
    const seedText = trimmed.toLowerCase().startsWith('/news ')
      ? trimmed.slice(6).trim()
      : trimmed;
    const result = await startNewSeed(env, chatId, seedText);
    if ('error' in result) return result.error;
    return result.tgMessage;
  }

  // Ellers: svar til nyeste in-flight seed
  if (inflight.length === 0) {
    return 'Ingen in-flight seeds. Send et link eller en tanke for at starte.';
  }
  const targetSeed = inflight[0]!; // nyeste
  if (targetSeed.state === 'CLARIFYING') {
    const result = await continueClarification(env, targetSeed, trimmed);
    return 'tgMessage' in result ? result.tgMessage : result.error;
  }
  if (targetSeed.state === 'OUTLINING') {
    if (upper === 'JA') {
      const result = await handleOutlineApproval(env, targetSeed);
      return 'tgMessage' in result ? result.tgMessage : result.error;
    }
    if (upper === 'REDIGER' || upper.startsWith('REDIGER ')) {
      // Re-clarify med ny input
      targetSeed.state = 'CLARIFYING';
      await setSeed(env.BOT_STATE, targetSeed);
      const result = await continueClarification(env, targetSeed, trimmed);
      return 'tgMessage' in result ? result.tgMessage : result.error;
    }
    // Fri tekst på outline = juster outline
    const result = await continueClarification(env, targetSeed, trimmed);
    return 'tgMessage' in result ? result.tgMessage : result.error;
  }
  if (targetSeed.state === 'REVIEWING') {
    const result = await handleDraftReview(env, targetSeed, trimmed);
    return 'tgMessage' in result ? result.tgMessage : result.error;
  }

  return `Seed ${targetSeed.id} er i state ${targetSeed.state} — afventer system-handling.`;
}

async function handleStopCommand(
  env: NewsEnv,
  chatId: number,
  text: string,
): Promise<string> {
  const inflight = await listInflight(env.BOT_STATE, chatId);
  if (inflight.length === 0) return 'Ingen in-flight seeds at stoppe.';
  if (inflight.length === 1) {
    const seed = inflight[0]!;
    await abortSeed(env.BOT_STATE, chatId, seed.id);
    return `Stoppet seed ${seed.id}.`;
  }
  // Flere — vis menu
  await env.BOT_STATE.put(
    `news-stop-menu:${chatId}`,
    '1',
    { expirationTtl: 300 },
  );
  const lines = inflight.map(
    (s, i) =>
      `${i + 1}. seed #${s.id} · ${s.state}\n   "${s.seedText.slice(0, 50)}..."`,
  );
  return `Du har ${inflight.length} in-flight seeds. Hvilken vil du stoppe?\n\n${lines.join('\n\n')}\n\nSvar med nummer (1-${inflight.length}) eller "alle".`;
}

function formatInbox(seeds: Seed[]): string {
  if (seeds.length === 0) return 'Ingen in-flight seeds.';
  const lines = seeds.map(
    (s, i) =>
      `${i + 1}. seed #${s.id} · ${s.state}\n   "${s.seedText.slice(0, 60)}..."`,
  );
  return `In-flight seeds (${seeds.length}):\n\n${lines.join('\n\n')}`;
}
```

- [ ] **Step 2: Tilføj tests**

```ts
describe('handleNewsMessage — router', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('afviser ikke-autoriseret chatId', async () => {
    setupMocks();
    const env = makeEnv({ AUTHORIZED_CHAT_ID: '99999' });
    const result = await (await import('./handler')).handleNewsMessage(env, 12345, 'hej');
    expect(result).toMatch(/Ikke autoriseret/);
  });

  it('returnerer kill-switch besked når NEWS_DISABLED=1', async () => {
    const env = makeEnv({ NEWS_DISABLED: '1' });
    const result = await (await import('./handler')).handleNewsMessage(env, 12345, 'hej');
    expect(result).toMatch(/midlertidigt slået fra/);
  });

  it('/inbox viser tom besked når ingen seeds', async () => {
    const env = makeEnv();
    const result = await (await import('./handler')).handleNewsMessage(env, 12345, '/inbox');
    expect(result).toMatch(/Ingen in-flight/);
  });

  it('STOP med 1 seed stopper det', async () => {
    setupMocks();
    const env = makeEnv();
    const { createSeed } = await import('./state');
    const seed = await createSeed(env.BOT_STATE, 12345, 'tanke');
    const result = await (await import('./handler')).handleNewsMessage(env, 12345, 'STOP');
    expect(result).toMatch(/Stoppet seed/);
  });

  it('STOP med flere seeds viser menu', async () => {
    setupMocks();
    const env = makeEnv();
    const { createSeed } = await import('./state');
    await createSeed(env.BOT_STATE, 12345, 'a');
    await createSeed(env.BOT_STATE, 12345, 'b');
    const result = await (await import('./handler')).handleNewsMessage(env, 12345, 'STOP');
    expect(result).toMatch(/Hvilken vil du stoppe/);
  });

  it('seed med URL trigger ny pipeline', async () => {
    setupMocks();
    const env = makeEnv();
    const result = await (await import('./handler')).handleNewsMessage(env, 12345, 'tanke https://example.com');
    expect(result).toMatch(/Forstår jeg dig/i);
  });
});
```

- [ ] **Step 3: Kør tests**

Forventet: 21 passed.

- [ ] **Step 4: Commit**

```bash
git add worker/news/handler.ts worker/news/handler.test.ts
git commit -m "feat(news): handleNewsMessage — public router

Hovedrouter dispatcher Telegram-beskeder:
- whitelist + kill-switch + budget-tjek øverst
- /inbox: vis in-flight seeds
- STOP: 1 seed = direkte abort, flere = nummereret menu (KV-token 5min)
- numerisk svar på menu (1, 2, 3, alle): aborter valgte seeds
- URL eller /news-prefix: ny pipeline via startNewSeed
- ellers: dispatch til nyeste in-flight seeds rette step-handler

6 nye tests dækker autorisation, kill-switch, /inbox, STOP-paths,
ny seed-detection."
```

---

## Task 13: Wire dispatcher i `worker/index.ts` (birkenborg-agents)

Integrér news-handler i bot-workerens hovedrouter, før den eksisterende inbox-fallback.

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/index.ts`

- [ ] **Step 1: Læs eksisterende `worker/index.ts`**

```bash
cat worker/index.ts | head -80
```

Find Telegram-webhook-handlerens main switch/dispatch-blok. Den dispatcher allerede til `/help`, `/status`, `/ship`, `/now`, STOP, YES, og inbox-fallback.

- [ ] **Step 2: Tilføj imports øverst**

I `worker/index.ts`, tilføj efter eksisterende imports:

```ts
import { handleNewsMessage, type NewsEnv } from './news/handler';
```

Udvid bot-workerens `Env`-interface (eksisterende):

```ts
interface Env {
  // ... eksisterende felter ...
  NEWS_DAILY_BUDGET?: string;
  NEWS_DISABLED?: string;
  NEWS_MODEL?: string;
}
```

- [ ] **Step 3: Wire news-handler ind i dispatcher**

Find Telegram-update-håndteringen (typisk en funktion som `handleTelegramUpdate`). Tilføj news-routing FØR den eksisterende inbox-fallback. Konkret:

```ts
async function handleTelegramUpdate(
  update: TelegramUpdate,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const msg = update.message;
  if (!msg) return new Response('OK', { status: 200 });
  const chatId = msg.chat.id;
  const text = msg.text ?? '';

  // EKSISTERENDE: command-routing (/help, /status, /ship, /now, STOP, YES, ...)
  if (text.startsWith('/help')) return await sendCommand(...);
  // ... osv ...

  // NYT: News-pipeline har prioritet over inbox når seed-context er detekteret
  const hasUrl = /https?:\/\//.test(text);
  const startsWithSlashNews = text.toLowerCase().startsWith('/news ');
  const hasInflightNews = await hasInflightSeeds(env.BOT_STATE, chatId);

  if (hasUrl || startsWithSlashNews || hasInflightNews) {
    const reply = await handleNewsMessage(env satisfies NewsEnv, chatId, text);
    ctx.waitUntil(sendTelegramMessage(env, chatId, reply));
    return new Response('OK', { status: 200 });
  }

  // EKSISTERENDE: inbox-fallback
  // ...
}

// Helper — hvis ikke allerede defineret
async function hasInflightSeeds(kv: KVNamespace, chatId: number): Promise<boolean> {
  const { listInflight } = await import('./news/state');
  const inflight = await listInflight(kv, chatId);
  return inflight.length > 0;
}
```

`sendTelegramMessage` antager der findes en eksisterende helper i workeren (typisk `sendTelegramMessage(env, chatId, text)`). Hvis den hedder noget andet, juster.

- [ ] **Step 4: Type-check**

```bash
cd worker && npx tsc --noEmit && cd ..
```

Forventet: ingen fejl.

- [ ] **Step 5: Kør hele test-suiten**

```bash
npx vitest run
```

Forventet: alle eksisterende tests + alle nye news-tests passerer.

- [ ] **Step 6: Commit**

```bash
git add worker/index.ts
git commit -m "feat(news): dispatcher wirer handleNewsMessage ind i Telegram-router

News-pipeline har prioritet over inbox når:
- Besked indeholder URL
- Besked starter med /news <text>
- Bruger har in-flight news seeds

Tilføjer NEWS_DAILY_BUDGET, NEWS_DISABLED, NEWS_MODEL til Env-interface."
```

---

## Task 14: KV-namespace + secrets + README (birkenborg-agents)

Manuelle CLI-trin. Bot-workeren har allerede BOT_STATE namespace; vi genbruger. Nye secrets sættes via wrangler.

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `wrangler.toml`
- Modify: `README.md`

- [ ] **Step 1: Tjek eksisterende wrangler.toml**

```bash
cat wrangler.toml
```

Verificér at BOT_STATE allerede er bundet til workeren.

- [ ] **Step 2: Sæt nye secrets**

```bash
npx wrangler secret put NEWS_DAILY_BUDGET
# indtast: 5
```

```bash
# (Valgfrit) Disable initially indtil testet
# npx wrangler secret put NEWS_DISABLED
# indtast: 1
```

```bash
# (Valgfrit) Custom model — default er claude-sonnet-4-6-20251111
# npx wrangler secret put NEWS_MODEL
# indtast: claude-sonnet-4-6-20251111
```

Bekræft via:

```bash
npx wrangler secret list
```

Forventet output indeholder NEWS_DAILY_BUDGET (plus eksisterende ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, AUTHORIZED_CHAT_ID, etc.).

- [ ] **Step 3: Dokumentér i README**

Tilføj sektion til `README.md`:

```markdown
## News-pipeline (Milestone 1)

Multi-step pipeline der modtager seeds (link + tanke) via Telegram og
producerer publiceringsklare /skrifter-poster i Philips tone via Claude.

### Deploy-krav

Eksisterende KV-namespace `BOT_STATE` genbruges. Eksisterende secrets
`ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `AUTHORIZED_CHAT_ID`
genbruges.

Nye secrets:
- `NEWS_DAILY_BUDGET` — daglig USD-cap (default 5)
- `NEWS_DISABLED` — sæt til "1" for kill-switch
- `NEWS_MODEL` — Anthropic-model (default `claude-sonnet-4-6-20251111`)

### Brug

Send seed via Telegram til `@birkenborg_agents_bot`:
- Besked med URL → ny news-pipeline starter
- `/news <tanke>` → ny pipeline uden URL
- `/inbox` → vis in-flight seeds
- `STOP` → stop seed (menu hvis flere)

### Pipeline-trin

1. **Afklaring** — bot stiller 1 spørgsmål
2. **Outline** — JA/REDIGER/fri tekst
3. **Draft** — tone-eval kører, viser draft
4. **Review** — YES/STOP/EDIT

### Kill switch

```bash
npx wrangler secret put NEWS_DISABLED
# indtast: 1
```

Genaktivér: `npx wrangler secret delete NEWS_DISABLED`.
```

- [ ] **Step 4: Commit**

```bash
git add wrangler.toml README.md
git commit -m "config(news): NEWS_DAILY_BUDGET secret + README docs"
```

---

## Task 15: Manual smoke test i Telegram

Real-world pipeline-test mod prod-bot. Verificér at hele M1 fungerer ende-til-ende.

**Repo:** `birkenborg-agents` (deploy)

- [ ] **Step 1: Deploy bot-worker**

```bash
npx wrangler deploy
```

Forventet: deploy succeed, version-ID printed.

- [ ] **Step 2: Send seed til bot via Telegram**

Send i Telegram til `@birkenborg_agents_bot`:

```
GDPR-håndhævelse mod tandklinikker https://datatilsynet.dk/afgoerelser/2026/maj — 
gad vide om Datatilsynet skifter gear i sundhedssektoren
```

Forventet (inden for ~10s):
- Bot DM: "📄 Læser artiklen." + afklarings-spørgsmål

- [ ] **Step 3: Svar på afklaring**

Send: `ja, og pointen er at størrelse skaber compliance-risiko`

Forventet (inden for ~10s):
- Bot DM med outline: 4 punkter (tese, ankerpunkt, pointe, implikation) + substansh-tjek

- [ ] **Step 4: Godkend outline**

Send: `JA`

Forventet (inden for ~25s):
- Bot DM med draft (~800-1500 tegn trunkeret) + tone-eval-score

- [ ] **Step 5: Bekræft draft**

Send: `YES`

Forventet:
- Bot DM: "Draft markeret klar (M1: ingen publish endnu — det kommer i M2). Seed <id> arkiveret."

- [ ] **Step 6: Verificér state**

Send: `/inbox`

Forventet:
- Bot DM: "Ingen in-flight seeds." (PUBLISHED er terminal og udelukkes)

- [ ] **Step 7: Test STOP-flow**

Start 2 nye seeds (med URLs), så STOP:

Send: `STOP`

Forventet: Nummereret menu med 2 seeds. Send `1` → bot bekræfter abort.

- [ ] **Step 8: Tjek budget-tracking**

Send: `/status`

Forventet: Bot DM viser dagens news-spend (eksempelvis ~$0.13 efter første komplette pipeline).

Hvis output mangler dette, det er en M1-konsistens-bug — `/status`-handleren i eksisterende bot-worker skal udvides separat. Acceptér i M1.

- [ ] **Step 9: Tag noter til M2**

Notér ting der skal håndteres i M2:
- Faktisk GitHub-publish flow (publish.ts)
- Preview-rute på sitet (/skrifter/<slug>?preview=<token>)
- Eventuelt /status-udvidelse for spend-display
- Eventuelle tone- eller outline-prompt-justeringer baseret på reelle drafts

---

## Self-Review

**Spec coverage:**

| Spec-sektion | Implementeres i Task |
|---|---|
| 4. Arkitektur (bot-worker, KV, jina.ai, Anthropic) | 2-13 |
| 5.1 Build-step udvidelse (voice-samples) | 1 |
| 5.2.1 handler.ts | 8-12 |
| 5.2.2 state.ts | 2 |
| 5.2.3 article.ts | 3 |
| 5.2.4 prompts.ts | 6 |
| 5.2.5 voice.ts | 4 |
| 5.2.6 claude.ts | 7 |
| 5.2.7 publish.ts | (M2) |
| 5.3 Worker dispatcher | 13 |
| 5.4 Site preview-rute | (M2) |
| 6. Data flow | 8-11 |
| 7. State machine | 2 (state.ts), 8-12 (handlers) |
| 8. Cost-model | 5 (budget), 7 (claude.calculateCost) |
| 9. Cost guardrails (NEWS_DAILY_BUDGET, NEWS_DISABLED, retry-limit, article truncation) | 7, 12, 14 |
| 10. Error handling | 3 (article fail-safe), 7 (Claude retry), 8-12 (FAILED-state) |

**M1 dækker:** sektion 4, 5.1, 5.2.1-5.2.6, 5.3, 6 (delvis: ingen publish), 7 (alle states minus PUBLISHING), 8, 9, 10.
**M2 dækker:** 5.2.7 publish.ts, 5.4 preview-rute. Skrives som separat plan efter M1 er live.

**Placeholder scan:** ingen TBD/TODO/"implement later". Hvert step har konkret kode eller kommando.

**Type-konsistens:**
- `Seed`-interface defineret i `state.ts` (Task 2), brugt af handler.ts (Task 8-12). Felter konsistente (id, chatId, state, seedText, articleUrl, articleSummary, clarificationQ, clarificationA, outline, draft, toneScore, retries, createdAt, updatedAt).
- `SeedState`-union: SEEDED, CLARIFYING, OUTLINING, DRAFTING, REVIEWING, PUBLISHING, PUBLISHED, ABORTED, FAILED. Alle stater brugt eller nævnt.
- `NewsEnv`-interface defineret i handler.ts (Task 8), brugt konsistent. wrangler-secrets matcher: NEWS_DAILY_BUDGET, NEWS_DISABLED, NEWS_MODEL.
- `Outline`-interface (state.ts): `items[]`, `hasCase`, `hasContrast`, `hasInternalLink`. Genereret i Task 9 (continueClarification, fra Claude JSON), brugt i Task 10 (handleOutlineApproval).
- Funktion-navne stabile: `createSeed`, `getSeed`, `setSeed`, `listInflight`, `abortSeed`, `fetchArticle`, `extractFirstUrl`, `loadVoiceSamples`, `formatVoiceSamples`, `recordSpend`, `isBudgetExceeded`, `callClaude`, `calculateCost`, `startNewSeed`, `continueClarification`, `handleOutlineApproval`, `handleDraftReview`, `handleNewsMessage`, `formatInbox`, `handleStopCommand`.

**Scope-check:** M1 leverer working software (DM-only draft pipeline) ved Task 15. M2 (publish + preview) skrives separat efter M1-validering.

---

## Estimater

- **M1 implementations-tid:** ~10-12 timer (15 tasks)
- **M2 implementations-tid:** ~4-6 timer (separat plan)
- **Total drift-cost (efter M2):** $3-4/md realistisk ved 5 poster/uge
