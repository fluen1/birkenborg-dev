# birkenborg-dev Comprehensive Upgrade Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix bugs, remove dead code, improve performance, and add 2 features (full-content RSS, contextual chat CTA) to birkenborg.dev.

**Architecture:** All changes in `site/` (Astro SSG) and `worker/` (Cloudflare Worker). No new dependencies. Performance changes focus on font loading, CLS, and client-side caching.

**Tech Stack:** Astro 6, CSS custom properties, Cloudflare Workers.

**Spec:** `docs/superpowers/specs/2026-05-25-comprehensive-upgrade-design.md`

**Definition of Done:** `cd site && npm run build` succeeds + `npm test` (root) green.

---

### Task 1: Bugfixes — og-default.png + font-mono + ghost inbox call

**Files:**
- Create: `site/public/og-default.png`
- Modify: `site/src/styles/fonts.css`
- Modify: `worker/index.ts`

- [ ] **Step 1: Create og-default.png**

Create a 1200×630px OG image. Use the Astro OG canvas approach that already exists for posts. Create a simple default:

```typescript
// This can be done via a simple HTML→PNG render or manually in a design tool.
// The image should have: cream (#faf9f5) background, "birkenborg/dev" wordmark centered,
// clay (#d97757) accent line. Save as site/public/og-default.png
```

Since the project already uses `astro-og-canvas` for per-post OG images, the simplest approach is to create a static PNG manually or copy an existing generated OG image and customize it. Check `site/dist/og/posts/` for existing examples of the format.

Alternatively, create a minimal SVG-to-PNG at build time. For now, create a simple static file.

- [ ] **Step 2: Define --font-mono token**

In `site/src/styles/fonts.css`, add inside the `:root` block after `--font-handwritten`:

```css
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;
```

- [ ] **Step 3: Remove fetchDrafts ghost call from worker**

In `worker/index.ts`, remove the `fetchDrafts` function (lines 233-241) and the call to it in `collectActivity` (lines 115-122). Also remove `draftsPending` from the `ActivityResponse` interface and the return object.

Remove:
```typescript
  let draftsPending: number | null = null;
  if (env.BOT_INTERNAL_TOKEN) {
    try {
      draftsPending = await fetchDrafts(env);
    } catch (e) {
      console.error("drafts", e);
    }
  }
```

And remove `draftsPending` from the return:
```typescript
  return {
    activity,
    lastCommit,
    generatedAt: Math.floor(Date.now() / 1000),
    events,
  };
```

Remove the `ActivityResponse` interface `draftsPending` field and the `fetchDrafts` function entirely.

- [ ] **Step 4: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`

- [ ] **Step 5: Commit**

```bash
git add site/public/og-default.png site/src/styles/fonts.css worker/index.ts
git commit -m "fix: og-default.png, --font-mono token, remove ghost inbox call"
```

---

### Task 2: Dead code cleanup

**Files:**
- Delete: `site/src/components/LiveActivity.astro`
- Delete: `site/src/components/Hero.astro`
- Delete: `site/src/components/StatusPanel.astro`
- Modify: `site/src/components/Marginalia.astro`
- Modify: `package.json` (root)

- [ ] **Step 1: Delete unused components**

```bash
cd C:\Users\birke\Projects\birkenborg-dev
git rm site/src/components/LiveActivity.astro
git rm site/src/components/Hero.astro
git rm site/src/components/StatusPanel.astro
```

- [ ] **Step 2: Use --font-handwritten token in Marginalia**

In `site/src/components/Marginalia.astro`, replace line 30:
```css
    font-family: 'Caveat', 'Patrick Hand', 'Segoe Script', cursive;
```
with:
```css
    font-family: var(--font-handwritten);
```

- [ ] **Step 3: Remove marked from root package.json**

In `package.json` (root), remove `"marked"` from `"dependencies"`. It is only used in `site/` and `worker/` which have their own package.json.

- [ ] **Step 4: Archive completed plan files**

```bash
mkdir -p docs/superpowers/plans/done
git mv docs/superpowers/plans/2026-05-05-m1-site-mvp.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-07-chat-rag-fase-2.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-07-news-pipeline-m1.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-08-news-pipeline-m2.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-08-uafhaengighed-fase-1.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-10-plan-b1-note-command.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-10-plan-b2-highlight-family.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-10-plan-b3-auto-marginalia.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-10-plan-c-perf-a11y-seo.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-10-site-restruktur-plan-a.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-14-sprint-1-seo-baseline.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-24-linkedin-block-strip.md docs/superpowers/plans/done/
git mv docs/superpowers/plans/2026-05-25-visual-upgrade.md docs/superpowers/plans/done/
```

- [ ] **Step 5: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove dead components, archive shipped plans, cleanup deps"
```

---

### Task 3: Performance — fonts + CLS

**Files:**
- Modify: `site/src/layouts/Base.astro`
- Modify: `site/src/styles/fonts.css`
- Modify: `site/src/components/Marginalia.astro`
- Modify: `site/src/components/ActivityFeed.astro`

- [ ] **Step 1: Add Fraunces font preload**

In `Base.astro`, add in `<head>` before the anti-flash script. First find the correct woff2 path:

```bash
ls node_modules/@fontsource-variable/fraunces/files/
```

Then add the preload link with the correct filename:

```html
    <link rel="preload" as="font" type="font/woff2"
      href="/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2" crossorigin>
```

Note: Astro resolves the `/@fontsource-variable/` path at build time. Verify the exact filename.

- [ ] **Step 2: Lazy-load Caveat font**

In `site/src/styles/fonts.css`, remove:
```css
@import '@fontsource-variable/caveat';
```

In `site/src/components/Marginalia.astro`, add a style import inside the `<style>` block:
```css
<style>
  @import '@fontsource-variable/caveat';
  .marginalia {
    /* ... existing styles ... */
```

This ensures Caveat is only loaded when Marginalia renders (posts with marginalia data).

- [ ] **Step 3: ActivityFeed CLS fix**

In `ActivityFeed.astro`, add `min-height: 220px` to the `.af-feed` rule (or `.feed` if not yet prefixed):

```css
  .feed {
    margin: 24px 0 32px;
    padding: 22px 28px 18px;
    background: var(--cream-warm);
    border: 1px solid var(--gray-100);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm);
    color: var(--clay-deep);
    min-height: 220px;
  }
```

- [ ] **Step 4: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`

- [ ] **Step 5: Commit**

```bash
git add site/src/layouts/Base.astro site/src/styles/fonts.css site/src/components/Marginalia.astro site/src/components/ActivityFeed.astro
git commit -m "perf: Fraunces preload, lazy Caveat, ActivityFeed CLS fix"
```

---

### Task 4: Performance — worker optimization + activity client cache

**Files:**
- Modify: `worker/index.ts`
- Modify: `site/src/components/ActivityFeed.astro`

- [ ] **Step 1: Remove redundant per_page=1 commits call**

In `worker/index.ts`, the `fetchLastCommit` function (lines 191-231) fetches commits with `per_page=1`. The `buildEvents` function (lines 243-280) already fetches with `per_page=15`. The first commit in that response IS the last commit.

Remove the `fetchLastCommit` function entirely. In `collectActivity`, get `lastCommit` from `buildEvents` output instead. Modify `buildEvents` to also return the last commit:

Change `buildEvents` return type to include lastCommit, or extract it from events. Simplest: after `buildEvents` populates the events array, find the newest commit event:

```typescript
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

  const commitEvents = events.filter(e => e.type === 'commit');
  const lastCommit: LastCommit | null = commitEvents.length > 0
    ? { repo: 'birkenborg-dev', message: commitEvents[0].text, ts: commitEvents[0].ts, url: commitEvents[0].url ?? '' }
    : null;

  return {
    activity,
    lastCommit,
    generatedAt: Math.floor(Date.now() / 1000),
    events,
  };
}
```

Remove the entire `fetchLastCommit` function.

- [ ] **Step 2: Add timeout on bot-worker fetches**

In `buildEvents`, add AbortController timeout around the highlights fetch (lines 310-327):

```typescript
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const r = await fetch(`${BOT_BASE}/internal/highlights`, {
      headers: { Authorization: `Bearer ${env.BOT_INTERNAL_TOKEN}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    // ... rest of highlights processing
```

- [ ] **Step 3: Add sessionStorage cache in ActivityFeed**

In `ActivityFeed.astro`, wrap the fetch call with a cache check. Replace the `fetch('/api/activity')` call:

```typescript
    const CACHE_KEY = 'activity_v1';
    const CACHE_TTL_MS = 5 * 60 * 1000;

    async function loadActivity(): Promise<ActivityResponse> {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached) as { data: ActivityResponse; ts: number };
          if (Date.now() - ts < CACHE_TTL_MS) return data;
        }
      } catch {}

      const r = await fetch('/api/activity');
      const data = await r.json() as ActivityResponse;

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch {}

      return data;
    }

    loadActivity()
      .then((data) => {
        // ... existing renderEvents, renderBars, stat updates ...
      })
      .catch(() => {
        // ... existing error handling ...
      });
```

- [ ] **Step 4: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`

- [ ] **Step 5: Commit**

```bash
git add worker/index.ts site/src/components/ActivityFeed.astro
git commit -m "perf: remove redundant GitHub call, bot-worker timeout, activity client cache"
```

---

### Task 5: ActivityFeed CSS prefix

**Files:**
- Modify: `site/src/components/ActivityFeed.astro`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/tests/pages.spec.ts`

- [ ] **Step 1: Rename all CSS classes in ActivityFeed**

In `ActivityFeed.astro`, rename all generic classes in the HTML template AND the `<style is:global>` block. Prefix with `af-`:

HTML: `.feed` → `.af-feed`, `.head` → `.af-head`, `.head-left` → `.af-head-left`, `.ldot` → `.af-ldot`, `.label` → `.af-label`, `.stats` → `.af-stats`, `.stat` → `.af-stat`, `.stat-num` → `.af-stat-num`, `.stat-label` → `.af-stat-label`, `.list` → `.af-list`, `.row` → `.af-row`, `.skeleton-row` → `.af-skeleton-row`, `.skeleton` → `.af-skeleton`, `.graph` → `.af-graph`, `.footer` → `.af-footer`, `.github` → `.af-github`, `.hint` → `.af-hint`

Also update `.when`, `.what`, `.ic` to `.af-when`, `.af-what`, `.af-ic`.

Update all data-attribute selectors: `[data-list]`, `[data-bars]`, `[data-hint]`, `[data-stats]`, `[data-stat-skrifter]`, `[data-stat-projekter]`, `[data-stat-commits]` — these can stay as-is since they are data attributes, not class names.

- [ ] **Step 2: Update Playwright test**

In `pages.spec.ts`, update the test that checks for `aside.feed`:
```typescript
  await expect(page.locator('aside.af-feed')).toBeVisible();
```

- [ ] **Step 3: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm test`

- [ ] **Step 4: Commit**

```bash
git add site/src/components/ActivityFeed.astro site/src/pages/index.astro site/src/tests/pages.spec.ts
git commit -m "refactor(feed): prefix ActivityFeed global CSS classes with af-"
```

---

### Task 6: Full-content RSS feed

**Files:**
- Modify: `site/src/pages/rss.xml.ts`

- [ ] **Step 1: Add content to RSS items**

Replace the entire `rss.xml.ts`:

```typescript
import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import { stripLinkedinBlock } from '../lib/linkedin-block.mjs';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const posts = await getCollection('posts', ({ data }) => data.status === 'published' && !data.privacy_flag);
  const sorted = posts.sort((a, b) => +b.data.publish_at - +a.data.publish_at);

  const items = await Promise.all(
    sorted.map(async (p) => {
      const { Content } = await render(p);
      // We need the raw HTML. Astro's render() returns a component, not HTML string.
      // Use the body directly and strip LinkedIn block.
      const body = p.body ? stripLinkedinBlock(p.body) : '';
      return {
        title: p.data.title,
        pubDate: p.data.publish_at,
        description: p.data.excerpt ?? '',
        link: `/skrifter/${p.data.slug ?? p.id.replace(/\.md$/, '')}`,
        content: body,
      };
    }),
  );

  return rss({
    title: 'birkenborg.dev — Skrifter',
    description: 'Korte essays om jura, AI-systemer i drift og fejl jeg er løbet ind i.',
    site: context.site!.toString(),
    items,
    customData: '<language>da-dk</language>',
  });
};
```

Note: `@astrojs/rss` `content` field accepts a string (raw text/HTML). If `p.body` is markdown, it will be included as-is. RSS readers typically handle markdown in content. For rendered HTML, you'd need to compile the markdown — check if `render()` returns usable HTML or if using `p.body` (raw markdown) is acceptable for the RSS use case.

- [ ] **Step 2: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Check: `cat site/dist/rss.xml` — verify items have content.

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/rss.xml.ts
git commit -m "feat(rss): add full post content to RSS feed"
```

---

### Task 7: "Spørg om dette skrift" CTA

**Files:**
- Modify: `site/src/pages/skrifter/[...slug].astro`
- Modify: `site/src/pages/chat.astro`

- [ ] **Step 1: Add CTA to post page**

In `[...slug].astro`, after the `{related.length > 0 && (...)}` block (around line 111), add:

```astro
        <aside class="ask-cta" data-reveal>
          <a href={`/chat?about=${currentSlug}`}>
            Spørg Philip-bot om <em>dette skrift</em> →
          </a>
        </aside>
```

Add styles in the `<style>` block:

```css
  .ask-cta {
    max-width: 720px;
    margin: 48px auto 0;
    padding-top: 24px;
    border-top: 1px solid var(--gray-100);
  }
  .ask-cta a {
    font-family: var(--font-serif);
    font-size: 16px;
    color: var(--gray-700);
    transition: color 0.15s;
  }
  .ask-cta a em {
    color: var(--clay-deep);
    font-style: italic;
  }
  .ask-cta a:hover { color: var(--ink); }
```

- [ ] **Step 2: Handle query param in chat.astro**

In `chat.astro`'s `<script>` block, after the `input` element is queried, add:

```typescript
  // Pre-fill from ?about=slug
  const params = new URLSearchParams(window.location.search);
  const aboutSlug = params.get('about');
  if (aboutSlug) {
    const title = (citations as Record<string, string>)[aboutSlug];
    if (title) {
      input.value = `Hvad mener du om "${title}"?`;
      input.focus();
    }
  }
```

- [ ] **Step 3: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/skrifter/[...slug].astro site/src/pages/chat.astro
git commit -m "feat: contextual chat CTA on post pages with query param prefill"
```

---

### Task 8: Final verification

- [ ] **Step 1: Full build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`

- [ ] **Step 2: Full test suite**

Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`

- [ ] **Step 3: Visual check**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run dev`
Check all pages in light + dark mode. Verify:
- OG default image exists at `/og-default.png`
- Font-mono renders in chat
- Fraunces loads quickly (no visible FOUT)
- Activity feed has min-height (no CLS)
- RSS feed at `/rss.xml` has full content
- Post pages have "Spørg Philip-bot" CTA
- `/chat?about=ma-agent-paragraf-30` pre-fills the question
