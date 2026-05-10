# Site-restrukturering — Plan A (personlig brand-redesign)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrukturér birkenborg.dev forsiden + skrifter til personlig-brand-fokuseret layout — seneste skrift som hero, marginalia-signatur, udvidet activity-feed, SEO-baseline, og navigation-cleanup. Visningen klar til relaunch; auto-pipelinen for marginalia (Plan B) udbygges separat.

**Architecture:** Astro-static site med Cloudflare Worker foran. Frontside bygges af Astro components der bruger Astro content-collections til at trække seneste skrift + marginalia-data. Worker `/api/activity` udvides til at returnere unified `ActivityEvent[]` der inkluderer commits + skrifter (browser fetcher og renderer i `ActivityFeed`-komponent). Sekundære sider (klinikker, konsulenter, kontakt) flyttes ud af hovednavigationen og ned i footeren.

**Tech Stack:** Astro 5, TypeScript, Cloudflare Workers, Vitest (worker-tests), Playwright (site e2e).

**Spec:** `docs/superpowers/specs/2026-05-10-site-personal-brand-redesign-design.md`

---

## File Structure

### Skab
- `site/src/components/HeroSkrift.astro` — variant A: seneste skrift som hero
- `site/src/components/OmMig.astro` — kort om-mig-sektion
- `site/src/components/Marginalia.astro` — render marginalia-spalte (display-only)
- `site/src/components/ActivityFeed.astro` — udvidet timeline (erstatter `LiveActivity` på forsiden)
- `site/src/components/StructuredData.astro` — JSON-LD slot
- `site/src/components/MetaTags.astro` — OG/Twitter meta-tags

### Modificer
- `site/src/content.config.ts` — tilføj `marginalia: z.array(...).optional()` til posts
- `site/src/layouts/Base.astro` — tilføj slots for `head-extra` (structured data + meta-tags)
- `site/src/components/Header.astro` — fjern `/now`, `/kontakt` fra nav; behold `Skrifter, Projekter, CV`; tilføj `Chat`
- `site/src/components/Footer.astro` — tilføj `/kontakt` og `/now` til "Sider"-listen
- `site/src/pages/index.astro` — wire nye komponenter, fjern gamle Hero + ProjectCard-grid
- `site/src/pages/skrifter/[...slug].astro` — render `<Marginalia>` på single-skrift-side
- `worker/index.ts` — udvid `/api/activity` til at returnere `events: ActivityEvent[]` (commits + skrifter)

### Test
- `worker/activity.test.ts` — ny test-fil for `events`-array i `/api/activity`-response
- `site/src/tests/pages.spec.ts` — opdatér eksisterende tests så de matcher nyt layout

### Slet/lad ligge
- `site/src/components/Hero.astro` — kan blive (importeres ikke længere fra `index.astro`)
- `site/src/components/LiveActivity.astro` — kan blive (importeres ikke længere fra `index.astro`)
- Vi sletter dem ikke for at holde diff'en mindre. De kan ryddes op i en senere refactor-runde.

---

## Task 1: Tilføj `marginalia`-felt til posts-schema

**Files:**
- Modify: `site/src/content.config.ts`

**Goal:** Astro content-collection skal acceptere et valgfri `marginalia`-array på posts.

- [ ] **Step 1: Læs nuværende schema**

```bash
cat site/src/content.config.ts
```

Bekræft at `posts` har: `title, slug, publish_at, status, tags, privacy_flag, linkedin_url, excerpt`.

- [ ] **Step 2: Tilføj marginalia-felt**

Modify `site/src/content.config.ts` — udvid `posts.schema` (efter `excerpt`-linjen):

```typescript
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    publish_at: z.coerce.date(),
    status: z.enum(['draft', 'scheduled', 'published', 'aborted']).default('draft'),
    tags: z.array(z.string()).default([]),
    privacy_flag: z.boolean().default(false),
    linkedin_url: z.string().nullable().default(null),
    excerpt: z.string().optional(),
    marginalia: z.array(z.object({
      ts: z.string(),
      text: z.string(),
      source: z.enum(['telegram', 'auto-commit', 'manual']).default('manual'),
    })).default([]),
  }),
});
```

- [ ] **Step 3: Verificér build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

Forventet: build lykkes. Eksisterende posts uden `marginalia` får default `[]`.

- [ ] **Step 4: Tilføj test-marginalia til ÉN eksisterende post**

Modify (vælg en seneste post — fx `content/posts/<seneste>.md`) — tilføj i frontmatter:

```yaml
marginalia:
  - ts: "8/5 14:32"
    text: "undersøgte det her i 3 dage før jeg gav op"
    source: manual
  - ts: "9/5 09:01"
    text: "rettelse: agenten ramte 11 ud af 10 paragraffer — men spillede pas"
    source: manual
```

(Bruges som visuel test-data i Task 2 og 12.)

- [ ] **Step 5: Verify build still passes**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/content.config.ts content/posts/
git commit -m "feat(content): tilføj marginalia[]-felt til posts-schema"
```

---

## Task 2: Marginalia-komponent

**Files:**
- Create: `site/src/components/Marginalia.astro`

**Goal:** Astro-komponent der renderer en marginalia-array som højre-side spalte med håndskrift-style noter.

- [ ] **Step 1: Skab komponenten**

Opret `site/src/components/Marginalia.astro`:

```astro
---
interface MarginaliaNote {
  ts: string;
  text: string;
  source?: string;
}

interface Props {
  notes: MarginaliaNote[];
}

const { notes } = Astro.props;
---

{notes.length > 0 && (
  <aside class="marginalia" aria-label="Philips noter">
    {notes.map(n => (
      <div class="note">
        <div class="ts">{n.ts}</div>
        <div class="text">{n.text}</div>
      </div>
    ))}
  </aside>
)}

<style>
  .marginalia {
    border-left: 1px dashed var(--margin-rule, #d9c8a8);
    padding-left: 18px;
    font-family: 'Caveat', 'Patrick Hand', 'Segoe Script', cursive;
    font-size: 15px;
    line-height: 1.5;
    color: var(--margin-ink, #8a6e3d);
  }
  .note {
    margin-bottom: 16px;
    padding-left: 4px;
    position: relative;
  }
  .note::before {
    content: '↗';
    position: absolute;
    left: -14px;
    top: 0;
    color: var(--clay);
    font-size: 12px;
  }
  .ts {
    font-family: var(--font-sans, system-ui);
    font-size: 9px;
    color: var(--margin-ts, #b8a888);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 2px;
  }
  .text { font-style: normal; }

  @media (max-width: 900px) {
    .marginalia {
      border-left: none;
      border-top: 1px dashed var(--margin-rule, #d9c8a8);
      padding-left: 0;
      padding-top: 16px;
      margin-top: 24px;
    }
  }
</style>
```

- [ ] **Step 2: Tilføj Caveat-font til Base layout**

Læs eksisterende `site/src/layouts/Base.astro`. Find `<head>`-sektionen.

Hvis filen allerede har Google Fonts via `<link>`, tilføj `Caveat:wght@400;500` til den eksisterende request URL. Ellers indsæt umiddelbart efter `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/Marginalia.astro site/src/layouts/Base.astro
git commit -m "feat(site): Marginalia-komponent + Caveat-font"
```

---

## Task 3: HeroSkrift-komponent

**Files:**
- Create: `site/src/components/HeroSkrift.astro`

**Goal:** Hero-komponent der tager en post (med data + slug) og renderer variant A: label + titel + deck + læs-videre-link.

- [ ] **Step 1: Skab komponenten**

Opret `site/src/components/HeroSkrift.astro`:

```astro
---
interface Props {
  slug: string;
  title: string;
  publish_at: Date;
  excerpt?: string;
}

const { slug, title, publish_at, excerpt } = Astro.props;
const dateLabel = publish_at.toLocaleDateString('da-DK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
---

<section class="hero-skrift">
  <div class="label">Senest skrift · {dateLabel}</div>
  <h1 class="title">
    <a href={`/skrifter/${slug}`}>{title}</a>
  </h1>
  {excerpt && <p class="deck">{excerpt}</p>}
  <a class="read-more" href={`/skrifter/${slug}`}>Læs videre <span class="arrow">→</span></a>
</section>

<style>
  .hero-skrift {
    border-left: 3px solid var(--clay);
    padding: 24px 0 24px 28px;
    margin: 56px 0 32px;
  }
  .label {
    font-size: 11px;
    font-weight: 700;
    color: var(--clay-deep);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 14px;
    font-family: var(--font-sans, system-ui);
  }
  .title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(32px, 4.5vw, 56px);
    line-height: 1.06;
    letter-spacing: -0.02em;
    margin: 0 0 18px;
    font-variation-settings: 'opsz' 144;
  }
  .title a { color: inherit; text-decoration: none; }
  .title a:hover { color: var(--clay-deep); }
  .deck {
    font-size: 18px;
    line-height: 1.55;
    color: var(--gray-700);
    max-width: 620px;
    margin: 0 0 18px;
  }
  .read-more {
    font-size: 14px;
    color: var(--clay-deep);
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .read-more .arrow { transition: transform 0.2s; }
  .read-more:hover .arrow { transform: translateX(3px); }

  @media (max-width: 720px) {
    .hero-skrift { padding-left: 18px; }
  }
</style>
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/HeroSkrift.astro
git commit -m "feat(site): HeroSkrift-komponent — variant A hero"
```

---

## Task 4: OmMig-komponent

**Files:**
- Create: `site/src/components/OmMig.astro`

**Goal:** Kort om-mig sektion der placeres mellem hero og activity-feed.

- [ ] **Step 1: Skab komponenten**

Opret `site/src/components/OmMig.astro`:

```astro
---
// Kort om-mig sektion. Statisk indhold; ændringer redigeres her direkte.
---

<section class="om-mig">
  <p>
    Cand.merc.jur. og Legal Counsel hos <a href="https://tandlaegen.dk" target="_blank" rel="noopener">Tandlægen.dk</a>.
    Bygger AI-agenter til jurist-arbejde i fritiden — og deler hvad der virker, og <em>præcist hvor det fejler</em>.
  </p>
</section>

<style>
  .om-mig {
    padding: 28px 0 16px;
  }
  .om-mig p {
    font-family: var(--font-display);
    font-size: 21px;
    line-height: 1.55;
    color: var(--gray-700);
    max-width: 680px;
    margin: 0;
    font-weight: 350;
    font-variation-settings: 'opsz' 24;
  }
  .om-mig em { color: var(--clay-deep); font-style: italic; }
  .om-mig a { color: var(--clay-deep); border-bottom: 1px solid currentColor; }
</style>
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/OmMig.astro
git commit -m "feat(site): OmMig-komponent — kort placerings-tekst"
```

---

## Task 5: Header-cleanup

**Files:**
- Modify: `site/src/components/Header.astro`

**Goal:** Hovednavigationen viser kun: `Skrifter · Projekter · Chat · CV`. Fjern `/now` og `/kontakt`.

- [ ] **Step 1: Opdatér links-array**

Modify `site/src/components/Header.astro` — erstat `links`-array (linjer 2-7):

```astro
const links = [
  { href: '/skrifter', label: 'Skrifter' },
  { href: '/projekter', label: 'Projekter' },
  { href: '/chat', label: 'Chat' },
  { href: '/cv', label: 'CV' },
];
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/Header.astro
git commit -m "refactor(site): minimal nav — Skrifter/Projekter/Chat/CV"
```

---

## Task 6: Footer-udvidelse

**Files:**
- Modify: `site/src/components/Footer.astro`

**Goal:** Footer viser nu også `/now` og `/kontakt` (sider der blev fjernet fra nav). Klinikker + konsulenter ligger der allerede.

- [ ] **Step 1: Tilføj /now og /kontakt til "Sider"-listen**

Modify `site/src/components/Footer.astro` — find blokken `<ul>` under "Sider" (linjer ~10-17). Erstat med:

```astro
<ul>
  <li><a href="/skrifter">Skrifter</a></li>
  <li><a href="/projekter">Projekter</a></li>
  <li><a href="/now">Now</a></li>
  <li><a href="/cv">CV</a></li>
  <li><a href="/chat">Chat</a></li>
  <li><a href="/kontakt">Kontakt</a></li>
  <li><a href="/klinikker">For klinikker</a></li>
  <li><a href="/konsulenter">For konsulenter</a></li>
</ul>
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/Footer.astro
git commit -m "refactor(site): footer inkluderer /now /kontakt — fjernet fra hovednav"
```

---

## Task 7: Worker `/api/activity` — events-array

**Files:**
- Modify: `worker/index.ts`
- Modify: `scripts/build-corpus.mjs`
- Create: `worker/activity.test.ts`

**Goal:** `/api/activity` returnerer nu også `events: ActivityEvent[]` med unified commits + skrift-publiseringer. Skrifter parses fra build-time genereret `_corpus.json`.

- [ ] **Step 1: Skriv failing test**

Opret `worker/activity.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('/api/activity events array', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returnerer events-array med commits og skrifter merged + sorteret efter ts desc', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = url.toString();
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
        return new Response(JSON.stringify({ count: 0 }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });

    const { default: worker } = await import('./index');
    const env = {
      ASSETS: { fetch: async () => new Response(JSON.stringify([])) },
      CHAT_STATE: {} as KVNamespace,
      ANTHROPIC_API_KEY: 'sk-test',
      IP_HASH_SALT: 'salt',
      BOT_INTERNAL_TOKEN: 'tok',
    };
    const ctx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as ExecutionContext;

    const req = new Request('https://birkenborg.dev/api/activity');
    const res = await worker.fetch!(req, env as never, ctx);
    expect(res.status).toBe(200);
    const data = await res.json() as { events: Array<{ type: string; ts: number; text: string; icon: string }> };
    expect(Array.isArray(data.events)).toBe(true);
    const commitEvents = data.events.filter(e => e.type === 'commit');
    expect(commitEvents.length).toBeGreaterThan(0);
    for (let i = 1; i < data.events.length; i++) {
      expect(data.events[i - 1].ts).toBeGreaterThanOrEqual(data.events[i].ts);
    }
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run worker/activity.test.ts
```

Forventet: FAIL — `events`-property eksisterer ikke i response.

- [ ] **Step 3: Udvid `ActivityResponse`-typen + add events**

Modify `worker/index.ts` — udvid `ActivityResponse`:

```typescript
interface ActivityEvent {
  type: 'commit' | 'skrift' | 'now';
  ts: number;
  text: string;
  icon: string;
  url?: string;
}

interface ActivityResponse {
  activity: DayCount[];
  lastCommit: LastCommit | null;
  draftsPending: number | null;
  generatedAt: number;
  events: ActivityEvent[];
}
```

- [ ] **Step 4: Byg events-array**

Modify `worker/index.ts` — i `handleActivity`-funktionen, efter at have hentet `activity` og `lastCommit`. Tilføj nye linjer FØR response-konstruktionen:

```typescript
const events: ActivityEvent[] = [];

try {
  const commitsRes = await fetch(
    `https://api.github.com/repos/${GITHUB_USER}/${PUBLIC_REPOS[0]}/commits?per_page=15`,
    {
      headers: env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {},
    }
  );
  if (commitsRes.ok) {
    const commits = (await commitsRes.json()) as Array<{
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

try {
  const corpusReq = new Request('https://birkenborg.dev/api/_corpus.json');
  const corpusRes = await env.ASSETS.fetch(corpusReq);
  if (corpusRes.ok) {
    const corpus = (await corpusRes.json()) as Array<{ slug: string; title: string; publish_at: string }>;
    for (const post of corpus) {
      events.push({
        type: 'skrift',
        ts: Math.floor(new Date(post.publish_at).getTime() / 1000),
        text: `Skrev "${post.title}"`,
        icon: '✎',
        url: `/skrifter/${post.slug}`,
      });
    }
  }
} catch (e) {
  console.error('events_skrifter', e);
}

events.sort((a, b) => b.ts - a.ts);
const limitedEvents = events.slice(0, 10);
```

Modify response-objekt-konstruktionen til at inkludere `events: limitedEvents`:

```typescript
const responseBody: ActivityResponse = {
  activity,
  lastCommit,
  draftsPending,
  generatedAt: Math.floor(Date.now() / 1000),
  events: limitedEvents,
};
```

- [ ] **Step 5: Tilføj static `_corpus.json`-output**

Læs `scripts/build-corpus.mjs`. Find slut-blokken hvor corpus skrives til disk.

Modify `scripts/build-corpus.mjs` — tilføj efter den eksisterende output-skrivning:

```javascript
import * as path from 'node:path';
import * as fs from 'node:fs';

const apiCorpus = posts.map(p => ({
  slug: p.slug,
  title: p.title,
  publish_at: p.publish_at,
}));
const apiCorpusPath = path.join(SITE_DIST, 'api', '_corpus.json');
fs.mkdirSync(path.dirname(apiCorpusPath), { recursive: true });
fs.writeFileSync(apiCorpusPath, JSON.stringify(apiCorpus));
console.log(`Wrote ${apiCorpus.length} posts til ${apiCorpusPath}`);
```

(Hvis variablerne i scriptet hedder andet end `posts` eller `SITE_DIST`, justér accordingly. Læs filen før edit.)

- [ ] **Step 6: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run worker/activity.test.ts
```

Forventet: PASS.

- [ ] **Step 7: Verify fuld worker-suite**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run
```

Forventet: alle tests PASS.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add worker/index.ts worker/activity.test.ts scripts/build-corpus.mjs
git commit -m "feat(api): /api/activity returnerer unified events-array (commits + skrifter)"
```

---

## Task 8: ActivityFeed-komponent

**Files:**
- Create: `site/src/components/ActivityFeed.astro`

**Goal:** Render `events: ActivityEvent[]` fra `/api/activity` som tidslinje (én række per event). Erstatter `LiveActivity` på forsiden men beholder samme aktivitets-graf.

- [ ] **Step 1: Skab komponenten**

Opret `site/src/components/ActivityFeed.astro`:

```astro
---
// Udvidet aktivitets-feed: tidslinje af events fra /api/activity.
// Initial render er skeleton; data fetches client-side.
---

<aside class="feed" aria-label="Hvad jeg arbejder med">
  <div class="head">
    <span class="ldot" aria-hidden="true"></span>
    <span class="label">Hvad jeg arbejder med</span>
    <span class="meta" data-meta>henter status…</span>
  </div>
  <ul class="list" data-list>
    <li class="row skeleton-row"><span class="skeleton" style="width: 320px"></span></li>
    <li class="row skeleton-row"><span class="skeleton" style="width: 280px"></span></li>
    <li class="row skeleton-row"><span class="skeleton" style="width: 240px"></span></li>
  </ul>
  <svg class="graph" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">
    <g data-bars></g>
  </svg>
  <div class="footer">
    <span class="hint" data-hint>Aktivitet sidste 30 dage</span>
    <a class="github" href="https://github.com/fluen1" target="_blank" rel="noopener">github.com/fluen1 →</a>
  </div>
</aside>

<script>
  interface DayCount { date: string; count: number; }
  interface ActivityEvent {
    type: 'commit' | 'skrift' | 'now';
    ts: number;
    text: string;
    icon: string;
    url?: string;
  }
  interface ActivityResponse {
    activity: DayCount[];
    events: ActivityEvent[];
    generatedAt: number;
  }

  const root = document.querySelector('.feed') as HTMLElement | null;
  if (root) {
    const listEl = root.querySelector('[data-list]') as HTMLUListElement;
    const metaEl = root.querySelector('[data-meta]') as HTMLElement;
    const hintEl = root.querySelector('[data-hint]') as HTMLElement;
    const barsEl = root.querySelector('[data-bars]') as SVGGElement;

    const formatWhen = (ts: number): string => {
      const diff = Math.floor(Date.now() / 1000) - ts;
      if (diff < 3600) return 'lige nu';
      if (diff < 86400) return 'i dag';
      if (diff < 2 * 86400) return 'i går';
      const d = new Date(ts * 1000);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    const renderEvents = (events: ActivityEvent[]): void => {
      listEl.replaceChildren();
      for (const e of events) {
        const li = document.createElement('li');
        li.className = 'row';
        const when = document.createElement('span');
        when.className = 'when';
        when.textContent = formatWhen(e.ts);
        const what = document.createElement('span');
        what.className = 'what';
        const ic = document.createElement('span');
        ic.className = 'ic';
        ic.textContent = e.icon;
        what.appendChild(ic);
        if (e.url) {
          const a = document.createElement('a');
          a.href = e.url;
          a.textContent = e.text;
          what.appendChild(a);
        } else {
          what.appendChild(document.createTextNode(e.text));
        }
        li.appendChild(when);
        li.appendChild(what);
        listEl.appendChild(li);
      }
    };

    const renderError = (msg: string): void => {
      listEl.replaceChildren();
      const li = document.createElement('li');
      li.className = 'row';
      li.textContent = msg;
      listEl.appendChild(li);
    };

    const renderBars = (activity: DayCount[]): void => {
      barsEl.replaceChildren();
      const ns = 'http://www.w3.org/2000/svg';
      const max = Math.max(1, ...activity.map((d) => d.count));
      const w = 600 / activity.length;
      const gap = 2;
      activity.forEach((d, i) => {
        const h = Math.max(2, (d.count / max) * 48);
        const y = 56 - h;
        const x = i * w;
        const opacity = d.count === 0 ? 0.18 : 0.5 + (d.count / max) * 0.5;
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', x.toFixed(2));
        rect.setAttribute('y', y.toFixed(2));
        rect.setAttribute('width', (w - gap).toFixed(2));
        rect.setAttribute('height', h.toFixed(2));
        rect.setAttribute('rx', '1.5');
        rect.setAttribute('fill', 'currentColor');
        rect.setAttribute('opacity', opacity.toFixed(2));
        barsEl.appendChild(rect);
      });
    };

    fetch('/api/activity')
      .then((r) => r.json() as Promise<ActivityResponse>)
      .then((data) => {
        renderEvents(data.events);
        const total = data.activity.reduce((sum, d) => sum + d.count, 0);
        metaEl.textContent = `${total} commits · sidste 30 dage`;
        hintEl.textContent = 'Aktivitet sidste 30 dage';
        renderBars(data.activity);
      })
      .catch(() => {
        renderError('Kunne ikke hente aktivitet — prøv igen om lidt.');
        metaEl.textContent = '';
      });
  }
</script>

<style>
  .feed {
    margin: 24px 0 32px;
    padding: 24px 28px;
    background: var(--cream-warm);
    border: 1px solid var(--gray-100);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm);
    color: var(--clay-deep);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .ldot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--clay);
    box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.55);
    animation: pulse 2.4s infinite;
  }
  .label {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--clay-deep);
    font-weight: 600;
  }
  .meta {
    margin-left: auto;
    font-size: 12px;
    color: var(--gray-700);
    font-feature-settings: 'tnum';
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
  }
  .row {
    display: flex;
    gap: 14px;
    align-items: baseline;
    padding: 9px 0;
    border-bottom: 1px dashed var(--gray-100);
    font-size: 14px;
  }
  .row:last-child { border-bottom: none; }
  .row .when {
    color: var(--gray-700);
    font-size: 12px;
    min-width: 64px;
    font-feature-settings: 'tnum';
  }
  .row .what { color: var(--ink); }
  .row .what a { color: var(--clay-deep); }
  .row .ic { display: inline-block; margin-right: 8px; opacity: 0.5; font-size: 12px; }
  .skeleton-row { padding: 9px 0; }
  .skeleton {
    display: inline-block;
    height: 16px;
    background: linear-gradient(90deg, var(--gray-100) 0%, var(--gray-200) 50%, var(--gray-100) 100%);
    background-size: 200% 100%;
    border-radius: 3px;
    animation: shimmer 1.4s infinite;
  }
  .graph {
    width: 100%;
    height: 56px;
    color: var(--clay);
    display: block;
    margin-bottom: 10px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--gray-700);
  }
  .github { color: var(--gray-700); }
  .github:hover { color: var(--clay-deep); }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.55); }
    50% { box-shadow: 0 0 0 7px rgba(217, 119, 87, 0); }
  }
  @media (max-width: 720px) {
    .feed { padding: 20px 18px; }
    .row .when { min-width: 48px; font-size: 11px; }
    .meta { display: none; }
  }
</style>
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/ActivityFeed.astro
git commit -m "feat(site): ActivityFeed-komponent — udvidet event-tidslinje"
```

---

## Task 9: SEO-komponenter (StructuredData + MetaTags)

**Files:**
- Create: `site/src/components/StructuredData.astro`
- Create: `site/src/components/MetaTags.astro`

**Goal:** To Astro-komponenter der genererer JSON-LD og OG/Twitter meta-tags. Bruges fra Base.astro via slot eller direkte includes.

- [ ] **Step 1: Skab StructuredData-komponent**

Opret `site/src/components/StructuredData.astro`:

```astro
---
interface Props {
  type: 'WebSite' | 'Person' | 'Article';
  data: Record<string, unknown>;
}

const { type, data } = Astro.props;

const baseSchema = {
  '@context': 'https://schema.org',
  '@type': type,
  ...data,
};
---

<script type="application/ld+json" set:html={JSON.stringify(baseSchema)} />
```

- [ ] **Step 2: Skab MetaTags-komponent**

Opret `site/src/components/MetaTags.astro`:

```astro
---
interface Props {
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  imageUrl?: string;
}

const {
  title,
  description,
  url,
  type = 'website',
  publishedTime,
  imageUrl,
} = Astro.props;

const fullImageUrl = imageUrl ?? 'https://birkenborg.dev/og-default.png';
---

<meta name="description" content={description} />

<meta property="og:type" content={type} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={url} />
<meta property="og:image" content={fullImageUrl} />
<meta property="og:site_name" content="birkenborg.dev" />
<meta property="og:locale" content="da_DK" />

{publishedTime && <meta property="article:published_time" content={publishedTime} />}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={fullImageUrl} />
```

- [ ] **Step 3: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/StructuredData.astro site/src/components/MetaTags.astro
git commit -m "feat(site): StructuredData + MetaTags-komponenter for SEO"
```

---

## Task 10: Base-layout slot for head-extra

**Files:**
- Modify: `site/src/layouts/Base.astro`

**Goal:** Base-layoutet skal kunne injicere SEO-meta-tags og JSON-LD per side via en named slot.

- [ ] **Step 1: Læs nuværende Base.astro**

```bash
cat site/src/layouts/Base.astro
```

Find `</head>`-tagget. Sigtet er at indsætte en `<slot name="head-extra" />` lige før `</head>`.

- [ ] **Step 2: Tilføj slot**

Modify `site/src/layouts/Base.astro` — indsæt umiddelbart før `</head>`:

```astro
<slot name="head-extra" />
```

- [ ] **Step 3: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/layouts/Base.astro
git commit -m "feat(site): Base.astro head-extra slot for SEO injection"
```

---

## Task 11: Index.astro — restruktur

**Files:**
- Modify: `site/src/pages/index.astro`

**Goal:** Forsiden bruger nye komponenter i den aftalte rækkefølge (Hero → Marginalia [højre side] → OmMig → ActivityFeed → Skrifter → Projekter sek.). Den gamle `<Hero />` + ProjectCard-grid fjernes.

- [ ] **Step 1: Erstat hele `index.astro`-filen**

Modify `site/src/pages/index.astro` — erstat hele filens indhold med:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import HeroSkrift from '../components/HeroSkrift.astro';
import OmMig from '../components/OmMig.astro';
import Marginalia from '../components/Marginalia.astro';
import ActivityFeed from '../components/ActivityFeed.astro';
import WritingItem from '../components/WritingItem.astro';
import ChatCta from '../components/ChatCta.astro';
import StructuredData from '../components/StructuredData.astro';
import MetaTags from '../components/MetaTags.astro';

const allPosts = await getCollection('posts', ({ data }) => data.status === 'published' && !data.privacy_flag);
const sortedPosts = allPosts.sort((a, b) => +b.data.publish_at - +a.data.publish_at);
const heroPost = sortedPosts[0];
const restPosts = sortedPosts.slice(1, 5);

const heroSlug = heroPost?.data.slug ?? heroPost?.id.replace(/\.md$/, '') ?? '';
const heroMarginalia = heroPost?.data.marginalia ?? [];

const allProjects = await getCollection('projekter', ({ data }) => data.status !== 'archived');
const sortedProjects = allProjects.sort((a, b) => a.data.order - b.data.order).slice(0, 3);

const SITE_URL = 'https://birkenborg.dev';
const PAGE_TITLE = 'Philip Birkenborg — birkenborg.dev';
const PAGE_DESC = 'Cand.merc.jur. der bygger AI-agenter til jurist-arbejde. Skrifter om hvad der virker, og præcist hvor det fejler.';
---
<Base title={PAGE_TITLE}>
  <Fragment slot="head-extra">
    <MetaTags
      title={PAGE_TITLE}
      description={PAGE_DESC}
      url={SITE_URL}
      type="website"
    />
    <StructuredData
      type="Person"
      data={{
        name: 'Philip Birkenborg',
        url: SITE_URL,
        jobTitle: 'Legal Counsel & AI Agent Builder',
        worksFor: { '@type': 'Organization', name: 'Tandlægen.dk' },
        sameAs: [
          'https://linkedin.com/in/philip-birkenborg-509794172/',
          'https://github.com/fluen1',
        ],
      }}
    />
  </Fragment>

  <Header />
  <main>
    <div class="container hero-row">
      {heroPost && (
        <>
          <div class="hero-main">
            <HeroSkrift
              slug={heroSlug}
              title={heroPost.data.title}
              publish_at={heroPost.data.publish_at}
              excerpt={heroPost.data.excerpt}
            />
            <OmMig />
          </div>
          <div class="hero-margin">
            <Marginalia notes={heroMarginalia} />
          </div>
        </>
      )}
    </div>

    <section class="container">
      <ActivityFeed />
    </section>

    <section class="writings container">
      <div class="section-head">
        <h2>Skrifter</h2>
        <a class="more" href="/skrifter">Alle skrifter →</a>
      </div>
      <div class="writings-list">
        {restPosts.map(p => (
          <WritingItem
            href={`/skrifter/${p.data.slug ?? p.id.replace(/\.md$/, '')}`}
            title={p.data.title}
            date={p.data.publish_at}
          />
        ))}
      </div>
      <ChatCta />
    </section>

    <section class="projekter container">
      <div class="section-head minor">
        <h3>Andre ting jeg bygger</h3>
        <a class="more" href="/projekter">Alle projekter →</a>
      </div>
      <div class="pill-grid">
        {sortedProjects.map(p => (
          <a class="pill" href={`/projekter/${p.id.replace(/\.md$/, '')}`}>
            <div class="nm">{p.data.title}</div>
            <div class="desc">{p.data.summary}</div>
          </a>
        ))}
      </div>
    </section>
  </main>
  <Footer />
</Base>

<style>
  .hero-row {
    display: grid;
    grid-template-columns: 1fr 200px;
    gap: 32px;
    margin-top: 16px;
  }
  .hero-main { min-width: 0; }
  .hero-margin { padding-top: 80px; }

  .writings { padding: 56px 0 32px; }
  .section-head {
    display: flex; align-items: end; justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--gray-100);
  }
  .section-head h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 32px;
    margin: 0;
    letter-spacing: -.015em;
  }
  .section-head.minor h3 {
    font-size: 14px; font-weight: 600; margin: 0;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--gray-700);
  }
  .more {
    font-size: 13px; color: var(--gray-700);
  }
  .more:hover { color: var(--ink); }

  .projekter { padding: 24px 0 80px; }
  .pill-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  .pill {
    background: var(--cream-warm);
    border: 1px solid var(--gray-100);
    padding: 14px 18px;
    border-radius: var(--r-md);
    transition: border-color 0.15s;
  }
  .pill:hover { border-color: var(--clay); }
  .pill .nm { font-weight: 500; color: var(--ink); margin-bottom: 4px; }
  .pill .desc { font-size: 13px; color: var(--gray-700); }

  @media (max-width: 900px) {
    .hero-row { grid-template-columns: 1fr; gap: 8px; }
    .hero-margin { padding-top: 0; }
    .pill-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 3: Visuel inspektion lokalt**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run dev
```

Åbn http://localhost:4321 og verificér:
- Hero viser seneste skrift (titel + dato + excerpt)
- Marginalia viser noter i højre kolonne (eller under på mobil)
- OmMig vises under hero
- ActivityFeed loader (skeleton → events) — bemærk at `/api/activity` kun virker live på Cloudflare, så lokalt kan feedet vise fejl-fallback
- Skrifter viser 4 ældre posts
- Projekter er pills i bunden, mindre prominent

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/pages/index.astro
git commit -m "feat(site): forside-restruktur — hero=skrift, marginalia, activity-feed"
```

---

## Task 12: Skrifter `[...slug].astro` — render marginalia inline

**Files:**
- Modify: `site/src/pages/skrifter/[...slug].astro`

**Goal:** Single-skrift-side viser `<Marginalia>` i højre margin (på desktop) eller under indhold (på mobil).

- [ ] **Step 1: Læs nuværende `[...slug].astro`**

```bash
cat 'site/src/pages/skrifter/[...slug].astro'
```

Identificer hvor brødtekst rendres. Sigtet er at wrappe brødteksten + marginalia i et grid-layout.

- [ ] **Step 2: Tilføj Marginalia-import + render**

Modify `site/src/pages/skrifter/[...slug].astro` — tilføj import øverst (i frontmatter):

```astro
import Marginalia from '../../components/Marginalia.astro';
```

Find blokken hvor `<article>` eller `<div class="post-body">` rendres. Wrap den i et grid-layout. Eksempel-pattern:

```astro
<div class="skrift-layout">
  <article class="post-body">
    <!-- eksisterende post-content -->
  </article>
  <aside class="post-margin">
    <Marginalia notes={post.data.marginalia ?? []} />
  </aside>
</div>
```

Tilføj CSS i samme fil:

```css
.skrift-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 32px;
}
.post-margin { padding-top: 24px; }
@media (max-width: 900px) {
  .skrift-layout { grid-template-columns: 1fr; }
  .post-margin { padding-top: 0; }
}
```

(Hvis filen allerede har et grid eller side-by-side-layout, integrér Marginalia i højre kolonne i stedet for at lave et nyt grid.)

- [ ] **Step 3: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run build
```

- [ ] **Step 4: Visuel verify lokalt**

Åbn `http://localhost:4321/skrifter/<den-post-du-tilføjede-marginalia-til-i-Task-1>` og verificér at marginalia-noter vises i højre kolonne.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add 'site/src/pages/skrifter/[...slug].astro'
git commit -m "feat(site): skrift-side viser marginalia i højre margin"
```

---

## Task 13: Pre-relaunch QA — opdatér e2e + push + verify deploy

**Files:**
- Modify: `site/src/tests/pages.spec.ts`

**Goal:** Opdatér eksisterende Playwright-tests så de matcher nyt layout. Push alle commits til main og verificér Cloudflare Pages-deploy.

- [ ] **Step 1: Opdatér forside-test**

Modify `site/src/tests/pages.spec.ts` — erstat de to første tests:

```typescript
test('forside renders med hero-skrift', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.hero-skrift')).toBeVisible();
  await expect(page.locator('section.hero-skrift .label')).toContainText('Senest skrift');
  await expect(page.locator('section.hero-skrift h1.title')).toBeVisible();
});

test('forsiden viser om-mig-sektion + activity-feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.om-mig')).toBeVisible();
  await expect(page.locator('aside.feed')).toBeVisible();
});
```

- [ ] **Step 2: Opdatér nav-test (der refererer til /kontakt)**

Modify `site/src/tests/pages.spec.ts` — erstat sidste test:

```typescript
test('alle sider returnerer 200', async ({ page }) => {
  for (const url of ['/', '/skrifter', '/projekter', '/cv', '/chat', '/kontakt', '/klinikker', '/konsulenter']) {
    const resp = await page.goto(url);
    expect(resp?.status()).toBe(200);
  }
});
```

- [ ] **Step 3: Verify e2e suite**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run e2e
```

Forventet: alle tests PASS. (Tests kan kræve at dev-server kører — tjek `playwright.config.ts` for setup.)

- [ ] **Step 4: Commit + push**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/tests/pages.spec.ts
git commit -m "test(site): opdatér e2e-tests til nyt layout"
git push origin main
```

- [ ] **Step 5: Verificér Cloudflare Pages-deploy**

Cloudflare Pages auto-deployer fra `main`. Åbn https://birkenborg.dev efter ~1-2 min og verificér:
- Hero viser seneste skrift
- Marginalia synlig
- ActivityFeed loader fra worker (`/api/activity`)
- Skrifter-liste, Projekter-pills, Footer med /klinikker, /konsulenter, /kontakt
- Mobile-view (DevTools responsive) — alt kollapser pænt

- [ ] **Step 6: Final sanity-check**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"; npx vitest run
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"; npm run e2e
```

Forventet: alle tests grønne.

---

## Self-Review tjekliste (run efter alle tasks)

- [ ] Spec §3 hovedside-struktur → Task 11 ✅
- [ ] Spec §3 Hero-sektion (variant A) → Task 3, 11 ✅
- [ ] Spec §3 Om-mig-sektion → Task 4, 11 ✅
- [ ] Spec §3 Live-feed → Task 7, 8, 11 ✅
- [ ] Spec §3 Projekter sekundær → Task 11 ✅
- [ ] Spec §4 Marginalia (display-only) → Task 1, 2, 11, 12 ✅
- [ ] Spec §5 ActivityEvent-model → Task 7 ✅
- [ ] Spec §6 Header-cleanup → Task 5 ✅
- [ ] Spec §6 Footer-udvidelse → Task 6 ✅
- [ ] Spec §7 SEO-baseline (JSON-LD + meta-tags) → Task 9, 10, 11 ✅
- [ ] Spec §8 Performance → ⛔ Out of scope for Plan A (kommer i Plan C) ✅
- [ ] Marginalia-pipeline (auto-scan + Telegram /note) → ⛔ Out of scope for Plan A (kommer i Plan B) ✅
- [ ] Type consistency: `ActivityEvent`-type identisk i worker (Task 7) og component (Task 8) ✅
- [ ] Type consistency: `Marginalia`-notes-shape identisk i schema (Task 1) og component (Task 2) ✅

---

## Out of scope (kommer i Plan B + C)

**Plan B — marginalia-pipeline:**
- Telegram `/note <slug> <tekst>`-kommando
- Telegram `/highlight <tekst>`-kommando (manuel feed-highlights)
- Auto-commit-scanning (`scripts/build-marginalia.mjs`)
- Build-time PR-flow eller direct commit

**Plan C — performance follow-up:**
- Lighthouse-audit (mobile + desktop)
- Image-lazy-loading
- Font-display optimering
- Caching headers
- Targeted fixes per kategori der scorer <90
