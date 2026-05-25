# AI Features — birkenborg-dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 AI features to birkenborg.dev: reading time calculation, contextual chat via `?about=` slug, and full-content RSS feed. Also extend `_corpus.json` with tags for the agents topic gap feature.

**Architecture:** Reading time is pure build-time. Contextual chat adds a dynamic system block in the Worker. RSS adds `content` field to existing feed. Corpus tags is a one-line addition to the build script.

**Tech Stack:** Astro 6, Cloudflare Workers, `@astrojs/rss`.

**Spec:** `docs/superpowers/specs/2026-05-25-ai-features-design.md`

---

### Task 1: Reading time calculation

**Files:**
- Modify: `site/src/components/WritingItem.astro`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/pages/skrifter/index.astro`

- [ ] **Step 1: Update WritingItem props**

In `WritingItem.astro`, replace the Props interface and destructuring (lines 4-13):

```typescript
interface Props {
  href: string;
  title: string;
  date: Date | string;
  body?: string;
  headingLevel?: 'h2' | 'h3';
}
const { href, title, date, body = '', headingLevel = 'h3' } = Astro.props;
const HeadingTag = headingLevel;
const slug = href.split('/').pop() ?? '';
const words = body.replace(/[*#`>\[\]_]/g, '').trim().split(/\s+/).filter(Boolean).length;
const minutes = Math.max(1, Math.round(words / 200));
const readTime = `${minutes} min`;
```

The template already uses `{readTime}` on line 18 — no change needed there.

- [ ] **Step 2: Pass body prop from index.astro**

In `site/src/pages/index.astro`, find the WritingItem usage in the `.writings-list`. Add `body` prop:

```astro
            <WritingItem
              href={`/skrifter/${p.data.slug ?? p.id.replace(/\.md$/, '')}`}
              title={p.data.title}
              date={p.data.publish_at}
              body={p.body ?? ''}
            />
```

- [ ] **Step 3: Pass body prop from skrifter/index.astro**

In `site/src/pages/skrifter/index.astro`, same change:

```astro
          <WritingItem
            href={`/skrifter/${p.id.replace(/\.md$/, '')}`}
            title={p.data.title}
            date={p.data.publish_at}
            body={p.body ?? ''}
            headingLevel="h2"
          />
```

- [ ] **Step 4: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`

- [ ] **Step 5: Commit**

```bash
git add site/src/components/WritingItem.astro site/src/pages/index.astro site/src/pages/skrifter/index.astro
git commit -m "feat: dynamic reading time from word count (replaces hardcoded 5 min)"
```

---

### Task 2: Contextual chat via `?about=` slug

**Files:**
- Modify: `worker/persona.ts`
- Modify: `worker/chat.ts`
- Modify: `site/src/pages/chat.astro`

- [ ] **Step 1: Add findPostBySlug to persona.ts**

In `worker/persona.ts`, add after the `buildSystemPrompt` function:

```typescript
export function findPostBySlug(corpus: CorpusPost[], slug: string): CorpusPost | null {
  return corpus.find(p => p.slug === slug) ?? null;
}
```

- [ ] **Step 2: Update chat.ts to read aboutSlug and inject focused system block**

In `worker/chat.ts`, after the payload parsing (line 89-94), read `aboutSlug`:

```typescript
  const aboutSlug = (payload as { aboutSlug?: string })?.aboutSlug;
```

Then modify the `anthropicReq.system` array (lines 107-113). Change from:

```typescript
  const anthropicReq = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    system: [
      {
        type: 'text',
        text: getSystemPrompt(),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: validation.messages,
  };
```

to:

```typescript
  const systemBlocks: Array<{ type: string; text: string; cache_control?: { type: string } }> = [
    {
      type: 'text',
      text: getSystemPrompt(),
      cache_control: { type: 'ephemeral' },
    },
  ];

  if (aboutSlug && typeof aboutSlug === 'string') {
    const { findPostBySlug } = await import('./persona');
    const focusPost = findPostBySlug(CORPUS, aboutSlug);
    if (focusPost) {
      systemBlocks.push({
        type: 'text',
        text: `Brugeren læser lige nu: "${focusPost.title}"\nTags: ${focusPost.tags.join(', ')}\n\nPrioritér dette skrift i dine svar. Citér det først hvis relevant.`,
      });
    }
  }

  const anthropicReq = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    system: systemBlocks,
    messages: validation.messages,
  };
```

Note: the focus block intentionally has NO `cache_control` since it's different per request.

- [ ] **Step 3: Send aboutSlug from chat.astro client**

In `site/src/pages/chat.astro`, find the `send` function. In the `fetch('/api/chat', ...)` call, the body is:

```typescript
body: JSON.stringify({ messages }),
```

Change to:

```typescript
body: JSON.stringify({ messages, aboutSlug: aboutSlug ?? undefined }),
```

Where `aboutSlug` is the variable already defined earlier in the script (from `params.get('about')`). Move the `aboutSlug` extraction to module scope (above the `send` function) if it's not already:

```typescript
  const params = new URLSearchParams(window.location.search);
  const aboutSlug = params.get('about');
```

This should already exist from the previous chat CTA implementation. Just ensure it's accessible inside `send`.

- [ ] **Step 4: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`

- [ ] **Step 5: Commit**

```bash
git add worker/persona.ts worker/chat.ts site/src/pages/chat.astro
git commit -m "feat(chat): contextual focus when linked from a specific post via ?about="
```

---

### Task 3: Full-content RSS feed

**Files:**
- Modify: `site/src/pages/rss.xml.ts`

- [ ] **Step 1: Add content and privacy filter to RSS**

Replace the entire file:

```typescript
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { stripLinkedinBlock } from '../lib/linkedin-block.mjs';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const posts = await getCollection('posts', ({ data }) =>
    data.status === 'published' && !data.privacy_flag
  );
  const sorted = posts.sort((a, b) => +b.data.publish_at - +a.data.publish_at);

  return rss({
    title: 'birkenborg.dev — Skrifter',
    description: 'Korte essays om jura, AI-systemer i drift og fejl jeg er løbet ind i.',
    site: context.site!.toString(),
    items: sorted.map(p => ({
      title: p.data.title,
      pubDate: p.data.publish_at,
      description: p.data.excerpt ?? '',
      link: `/skrifter/${p.data.slug ?? p.id.replace(/\.md$/, '')}`,
      content: p.body ? stripLinkedinBlock(p.body) : '',
    })),
    customData: '<language>da-dk</language>',
  });
};
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/rss.xml.ts
git commit -m "feat(rss): full post content in RSS feed, filtered by privacy_flag"
```

---

### Task 4: Extend `_corpus.json` with tags

**Files:**
- Modify: `scripts/build-corpus.mjs`

- [ ] **Step 1: Add tags to API corpus output**

In `scripts/build-corpus.mjs`, find the `apiCorpus` mapping (around line 90-94):

```javascript
  const apiCorpus = corpus.map(p => ({
    slug: p.slug,
    title: p.title,
    publish_at: p.publishAt,
  }));
```

Add `tags`:

```javascript
  const apiCorpus = corpus.map(p => ({
    slug: p.slug,
    title: p.title,
    publish_at: p.publishAt,
    tags: p.tags ?? [],
  }));
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Check: the generated `site/public/api/_corpus.json` should now contain `tags` arrays.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-corpus.mjs
git commit -m "feat(corpus): add tags to _corpus.json for topic gap analysis"
```

---

### Task 5: Content schema for image_url (prep for B1)

**Files:**
- Modify: `site/src/content.config.ts`
- Modify: `site/src/pages/skrifter/[...slug].astro`

- [ ] **Step 1: Add image_url to posts schema**

In `content.config.ts`, add to the posts schema after `linkedin_url`:

```typescript
    image_url: z.string().url().optional(),
```

- [ ] **Step 2: Render image on post page**

In `[...slug].astro`, find the `<header class="post-head">` block. After the excerpt `<p>` (around line 89) and before `</header>`, add:

```astro
          {post.data.image_url && (
            <img class="post-hero-image"
              src={post.data.image_url}
              alt={`Illustration: ${post.data.title}`}
              loading="eager"
              width="720"
              height="378" />
          )}
```

Add styles in the `<style>` block:

```css
  .post-hero-image {
    max-width: 720px;
    width: 100%;
    height: auto;
    border-radius: var(--r-md);
    margin: 24px auto 48px;
    display: block;
  }
```

Update the MetaTags `imageUrl` prop to prefer `image_url` when available:

```astro
      imageUrl={post.data.image_url ?? `https://birkenborg.dev/og/posts/${post.id.replace(/\.md$/, '')}.png`}
```

- [ ] **Step 3: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`

- [ ] **Step 4: Commit**

```bash
git add site/src/content.config.ts site/src/pages/skrifter/[...slug].astro
git commit -m "feat(schema): add image_url to posts + render on post page + OG fallback"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`

- [ ] **Step 2: Visual check**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run dev`
Check:
- Reading time on homepage + /skrifter shows real minutes (not all "5 min")
- `/chat?about=ma-agent-paragraf-30` pre-fills question AND sends aboutSlug to worker
- `/rss.xml` contains full post content
- Post pages render without errors (no image_url set yet — no image shown, which is correct)
