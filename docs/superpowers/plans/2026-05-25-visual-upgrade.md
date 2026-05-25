# Visual Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 visual/interactive features to birkenborg.dev — dark mode, View Transitions, scroll-reveal, micro-interactions, activity feed v2, chat polish, typography refinement, and footer /now-integration — without changing any backend/Worker code or adding new dependencies.

**Architecture:** All changes are in `site/` (Astro SSG frontend). Dark mode uses CSS custom properties with `[data-theme]` on `<html>`. View Transitions use Astro's built-in `<ViewTransitions />`. Scroll-reveal is a custom IntersectionObserver script. Everything else is CSS-only or minor template changes.

**Tech Stack:** Astro 6, CSS custom properties, IntersectionObserver, Astro View Transitions API, TypeScript.

**Spec:** `docs/superpowers/specs/2026-05-24-visual-upgrade-design.md`

**Definition of Done (from CLAUDE.md):**
1. `npm test` (repo-root) — worker + scripts tests green
2. `cd site && npm test` — site tests green
3. `cd site && npm run build` — succeeds
4. Visual check via `cd site && npm run dev` on `http://localhost:4321`

---

### Task 1: Spacing tokens

**Files:**
- Modify: `site/src/styles/tokens.css`

- [ ] **Step 1: Add spacing tokens to tokens.css**

Add after the `--pad-x: 40px;` line, still inside `:root`:

```css
  /* Spacing — 4px grid */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 80px;
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds, 17 pages.

- [ ] **Step 3: Commit**

```bash
git add site/src/styles/tokens.css
git commit -m "feat(tokens): add spacing scale (4px grid)"
```

---

### Task 2: Dark mode tokens

**Files:**
- Modify: `site/src/styles/tokens.css`

- [ ] **Step 1: Add dark mode token overrides**

Add after the closing `}` of `:root` in `tokens.css`:

```css
[data-theme="dark"] {
  --cream:        #0c0c0c;
  --cream-warm:   #1a1917;
  --gray-100:     #27261f;
  --gray-200:     #333028;
  --gray-400:     #8a887e;
  --gray-deco:    #4a483f;
  --gray-700:     #9a988f;
  --ink:          #e8e6dc;
  --clay:         #e8a087;
  --clay-deep:    #d97757;
  --clay-xdeep:   #d97757;
  --clay-soft:    #b85d40;
  --slate:        #7daed4;
  --sage:         #8ea472;

  --shadow-sm:  0 1px 2px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.2);
  --shadow-md:  0 4px 12px rgba(0,0,0,.3), 0 0 0 1px rgba(0,0,0,.2);
  --shadow-hov: 0 16px 36px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.3);
}

@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) {
    --cream:        #0c0c0c;
    --cream-warm:   #1a1917;
    --gray-100:     #27261f;
    --gray-200:     #333028;
    --gray-400:     #8a887e;
    --gray-deco:    #4a483f;
    --gray-700:     #9a988f;
    --ink:          #e8e6dc;
    --clay:         #e8a087;
    --clay-deep:    #d97757;
    --clay-xdeep:   #d97757;
    --clay-soft:    #b85d40;
    --slate:        #7daed4;
    --sage:         #8ea472;

    --shadow-sm:  0 1px 2px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.2);
    --shadow-md:  0 4px 12px rgba(0,0,0,.3), 0 0 0 1px rgba(0,0,0,.2);
    --shadow-hov: 0 16px 36px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.3);
  }
}
```

- [ ] **Step 2: Add theme transition to base.css**

In `site/src/styles/base.css`, add after the `::selection` rule:

```css
html[data-theme] body,
html[data-theme] .site-header {
  transition: background-color 200ms ease, color 200ms ease;
}
```

- [ ] **Step 3: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add site/src/styles/tokens.css site/src/styles/base.css
git commit -m "feat(dark-mode): add dark token overrides + prefers-color-scheme"
```

---

### Task 3: Dark mode anti-flash script + toggle

**Files:**
- Modify: `site/src/layouts/Base.astro`
- Modify: `site/src/components/Header.astro`

- [ ] **Step 1: Add anti-flash script to Base.astro**

In `Base.astro`, add an inline script inside `<head>`, right before `<slot name="head" />`:

```html
    <script is:inline>
      (function() {
        var t = localStorage.getItem('theme');
        if (t === 'dark' || t === 'light') {
          document.documentElement.setAttribute('data-theme', t);
        }
      })();
    </script>
```

- [ ] **Step 2: Add toggle button to Header.astro**

Replace the `<nav>` section in `Header.astro` with:

```astro
    <div class="nav-group">
      <nav class="primary">
        {links.map(l => <a href={l.href}>{l.label}</a>)}
      </nav>
      <button class="theme-toggle" aria-label="Skift tema" type="button">
        <svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
```

- [ ] **Step 3: Add toggle script to Header.astro**

Add a `<script>` block at the bottom of `Header.astro`:

```html
<script>
  function initThemeToggle() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    function getEffective(): 'light' | 'dark' {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function apply() {
      const theme = getEffective();
      document.documentElement.setAttribute('data-theme', theme);
    }

    btn.addEventListener('click', () => {
      const current = getEffective();
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      apply();
    });

    apply();
  }

  initThemeToggle();
  document.addEventListener('astro:after-swap', initThemeToggle);
</script>
```

- [ ] **Step 4: Add toggle + dark header styles**

Add to the `<style>` block in `Header.astro`:

```css
  .nav-group { display: flex; align-items: center; gap: 24px; }
  .theme-toggle {
    background: none; border: none; cursor: pointer;
    color: var(--gray-700); padding: 4px;
    transition: color 0.2s;
    display: flex; align-items: center;
  }
  .theme-toggle:hover { color: var(--ink); }
  [data-theme="dark"] .icon-sun { display: inline; }
  [data-theme="dark"] .icon-moon { display: none; }
  :not([data-theme="dark"]) .icon-sun { display: none; }
  :not([data-theme="dark"]) .icon-moon { display: inline; }
```

Also update the `.site-header` background rule — replace the hardcoded `rgba(250, 249, 245, .85)` with a token-friendly approach:

```css
  .site-header {
    position: sticky; top: 0; z-index: 50;
    background: color-mix(in srgb, var(--cream) 85%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--gray-100);
  }
```

- [ ] **Step 5: Verify dark mode visually**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run dev`
Open: `http://localhost:4321`
Test:
1. Toggle button visible in header
2. Click toggles between light/dark
3. Refresh preserves theme choice
4. All pages readable in dark mode (check `/`, `/skrifter`, `/chat`, `/cv`)

- [ ] **Step 6: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add site/src/layouts/Base.astro site/src/components/Header.astro
git commit -m "feat(dark-mode): anti-flash script + toggle button in header"
```

---

### Task 4: Scroll-reveal script

**Files:**
- Create: `site/src/scripts/reveal.ts`
- Modify: `site/src/styles/base.css`
- Modify: `site/src/layouts/Base.astro`

- [ ] **Step 1: Create reveal.ts**

Create `site/src/scripts/reveal.ts`:

```typescript
function initReveal() {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!elements.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));
}

initReveal();
document.addEventListener('astro:page-load', initReveal);
```

- [ ] **Step 2: Add reveal CSS to base.css**

Add at the end of `site/src/styles/base.css`:

```css
/* Scroll-reveal */
[data-reveal] {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}
[data-reveal-delay="1"] { transition-delay: 80ms; }
[data-reveal-delay="2"] { transition-delay: 160ms; }
[data-reveal-delay="3"] { transition-delay: 240ms; }

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 0;
    transform: none;
    transition: opacity 0ms;
  }
  [data-reveal].revealed { opacity: 1; }
  [data-reveal-delay="1"],
  [data-reveal-delay="2"],
  [data-reveal-delay="3"] { transition-delay: 0ms; }
}
```

- [ ] **Step 3: Import reveal script in Base.astro**

Add at the bottom of `Base.astro`, just before closing `</html>`:

```html
    <script src="../scripts/reveal.ts"></script>
```

Note: Astro processes `<script src>` as a module — it's bundled and deduplicated automatically.

- [ ] **Step 4: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds. No visual change yet (no elements have `data-reveal`).

- [ ] **Step 5: Commit**

```bash
git add site/src/scripts/reveal.ts site/src/styles/base.css site/src/layouts/Base.astro
git commit -m "feat(reveal): scroll-reveal script + CSS with reduced-motion support"
```

---

### Task 5: Add data-reveal attributes to components

**Files:**
- Modify: `site/src/components/HeroSkrift.astro`
- Modify: `site/src/components/OmMig.astro`
- Modify: `site/src/components/ActivityFeed.astro`
- Modify: `site/src/components/ChatCta.astro`
- Modify: `site/src/components/Footer.astro`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: HeroSkrift.astro**

Change `<section class="hero-skrift">` to:
```html
<section class="hero-skrift" data-reveal>
```

- [ ] **Step 2: OmMig.astro**

Change `<section class="om-mig">` to:
```html
<section class="om-mig" data-reveal>
```

- [ ] **Step 3: ActivityFeed.astro**

Change `<aside class="feed"` to:
```html
<aside class="feed" data-reveal
```
(Keep existing attributes on the same element.)

- [ ] **Step 4: ChatCta.astro**

Change `<aside class="chat-cta">` to:
```html
<aside class="chat-cta" data-reveal>
```

- [ ] **Step 5: Footer.astro**

Change `<footer class="site-footer">` to:
```html
<footer class="site-footer" data-reveal>
```

- [ ] **Step 6: index.astro — staggered WritingItems and pills**

In `index.astro`, update the WritingItem loop to add reveal with stagger. Since `WritingItem` is an `<a>` element, wrap each in a `<div>`:

Replace the `.writings-list` content:
```astro
      <div class="writings-list">
        {restPosts.map((p, i) => (
          <div data-reveal data-reveal-delay={String(Math.min(i, 3))}>
            <WritingItem
              href={`/skrifter/${p.data.slug ?? p.id.replace(/\.md$/, '')}`}
              title={p.data.title}
              date={p.data.publish_at}
            />
          </div>
        ))}
      </div>
```

Update the `.pill-grid` content — pills are already `<a>` elements, add `data-reveal` directly:
```astro
      <div class="pill-grid">
        {sortedProjects.map((p, i) => (
          <a class="pill" href={`/projekter/${p.id.replace(/\.md$/, '')}`} data-reveal data-reveal-delay={String(Math.min(i, 3))}>
            <div class="nm">{p.data.title}</div>
            <div class="desc">{p.data.summary}</div>
          </a>
        ))}
      </div>
```

- [ ] **Step 7: Verify visually**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run dev`
Open: `http://localhost:4321`
Test: Scroll down the homepage — sections should fade in with stagger. Check `prefers-reduced-motion` in DevTools (Rendering panel > Emulate CSS media feature `prefers-reduced-motion`).

- [ ] **Step 8: Run tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm test`
Expected: All existing Playwright tests pass. Note: `.hero-skrift` visibility test may need adjustment since `data-reveal` starts with `opacity: 0`. If the test fails, it will be fixed in Task 14.

- [ ] **Step 9: Commit**

```bash
git add site/src/components/HeroSkrift.astro site/src/components/OmMig.astro site/src/components/ActivityFeed.astro site/src/components/ChatCta.astro site/src/components/Footer.astro site/src/pages/index.astro
git commit -m "feat(reveal): add data-reveal to homepage components with stagger"
```

---

### Task 6: View Transitions

**Files:**
- Modify: `site/src/layouts/Base.astro`
- Modify: `site/src/components/Header.astro`
- Modify: `site/src/components/HeroSkrift.astro`
- Modify: `site/src/components/WritingItem.astro`
- Modify: `site/src/pages/skrifter/[...slug].astro`

- [ ] **Step 1: Add ViewTransitions to Base.astro**

At the top of the frontmatter in `Base.astro`, add the import:
```typescript
import { ViewTransitions } from 'astro:transitions';
```

In the `<head>`, add before `<slot name="head" />`:
```html
    <ViewTransitions />
```

- [ ] **Step 2: Persist Header**

In `Header.astro`, add `transition:persist` to the header element:
```html
<header class="site-header" transition:persist>
```

- [ ] **Step 3: Shared transition names for skrift titles**

In `HeroSkrift.astro`, add a transition name to the title:
```astro
  <h1 class="title" transition:name={`skrift-${slug}`}>
```

In `WritingItem.astro`, extract slug from href. Add after the existing destructuring line:
```typescript
const slug = href.split('/').pop() ?? '';
```

Then add transition name to the heading:
```astro
  <HeadingTag transition:name={`skrift-${slug}`}>{title}</HeadingTag>
```

In `site/src/pages/skrifter/[...slug].astro`, add to the `<h1>` (line 88):
```astro
          <h1 transition:name={`skrift-${currentSlug}`}>{post.data.title}</h1>
```
(`currentSlug` is already defined on line 26.)

- [ ] **Step 4: Verify visually**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run dev`
Open: `http://localhost:4321`
Test:
1. Click a skrift title — title should morph smoothly to the post page
2. Click back — title morphs back
3. Header stays in place during navigation
4. Dark mode toggle still works after navigation
5. Scroll-reveals still fire on navigated-to pages

- [ ] **Step 5: Run tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm test`
Expected: All tests pass.

- [ ] **Step 6: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add site/src/layouts/Base.astro site/src/components/Header.astro site/src/components/HeroSkrift.astro site/src/components/WritingItem.astro site/src/pages/skrifter/[...slug].astro
git commit -m "feat(transitions): Astro View Transitions with shared skrift titles"
```

---

### Task 7: Micro-interactions — WritingItem hover

**Files:**
- Modify: `site/src/components/WritingItem.astro`

- [ ] **Step 1: Update WritingItem template**

Add an arrow span inside the `<a>`. Replace the template:

```astro
<a class="writing" href={href}>
  <span class="date">{formatDateShort(date)}</span>
  <HeadingTag transition:name={`skrift-${slug}`}>{title}</HeadingTag>
  <span class="read">{readTime} <span class="arrow">&rarr;</span></span>
</a>
```

- [ ] **Step 2: Update WritingItem styles**

Replace the entire `<style>` block:

```css
<style>
  .writing {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    align-items: baseline;
    gap: 32px;
    padding: 26px 0;
    border-bottom: 1px solid var(--gray-100);
    border-left: 0px solid var(--clay);
    transition: padding 250ms cubic-bezier(0.16, 1, 0.3, 1),
                border-left-width 250ms cubic-bezier(0.16, 1, 0.3, 1),
                background-color 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .writing:hover {
    padding-left: 16px;
    border-left-width: 3px;
    background-color: rgba(217, 119, 87, 0.04);
  }
  .writing:hover h2, .writing:hover h3 { color: var(--clay-deep); }
  .date {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--gray-400);
  }
  h2, h3 {
    font-family: var(--font-serif);
    font-weight: 500;
    font-size: 22px;
    margin: 0;
    line-height: 1.3;
    transition: color .2s;
  }
  .read { font-size: 12px; color: var(--gray-400); font-variant-numeric: tabular-nums; }
  .arrow {
    display: inline-block;
    opacity: 0;
    transform: translateX(0);
    transition: opacity 250ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .writing:hover .arrow {
    opacity: 1;
    transform: translateX(4px);
  }
  @media (max-width: 720px) {
    .writing { grid-template-columns: 64px 1fr; gap: 16px; }
    .read { display: none; }
    h2, h3 { font-size: 18px; }
  }
</style>
```

- [ ] **Step 3: Verify visually**

Run dev server, hover over skrifter items on homepage and `/skrifter`. Confirm clay border slides in, arrow appears, background tints.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/WritingItem.astro
git commit -m "feat(hover): WritingItem clay border + arrow micro-interaction"
```

---

### Task 8: Micro-interactions — Header nav underline + active state

**Files:**
- Modify: `site/src/components/Header.astro`

- [ ] **Step 1: Add active page detection**

In `Header.astro` frontmatter, add:
```typescript
const currentPath = Astro.url.pathname;
```

Update the nav links rendering:
```astro
      <nav class="primary">
        {links.map(l => (
          <a href={l.href} class:list={[{ active: currentPath.startsWith(l.href) }]}>{l.label}</a>
        ))}
      </nav>
```

- [ ] **Step 2: Update nav link styles**

Replace the existing `nav.primary` style rules with:

```css
  nav.primary { display: flex; gap: 32px; font-size: 14px; color: var(--gray-700); }
  nav.primary a {
    padding: 4px 0;
    transition: color .2s;
    position: relative;
  }
  nav.primary a::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 100%; height: 1.5px;
    background: var(--clay);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  nav.primary a:hover { color: var(--ink); }
  nav.primary a:hover::after { transform: scaleX(1); }
  nav.primary a.active { color: var(--ink); }
  nav.primary a.active::after { transform: scaleX(1); }
```

Remove the old `nav.primary a` rule that had `padding: 4px 0; transition: color .2s;` — it's merged into the new rules above.

- [ ] **Step 3: Verify visually**

Check: hover over nav links shows underline. Active page has permanent underline. Works in both light and dark mode.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/Header.astro
git commit -m "feat(hover): header nav underline animation + active page indicator"
```

---

### Task 9: Micro-interactions — Projekt-pills + ChatCta

**Files:**
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/components/ChatCta.astro`

- [ ] **Step 1: Upgrade pill hover in index.astro**

In `index.astro`, replace the `.pill` and `.pill:hover` styles:

```css
  .pill {
    background: var(--cream-warm);
    border: 1px solid var(--gray-100);
    padding: 14px 18px;
    border-radius: var(--r-md);
    transition: border-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pill:hover {
    border-color: var(--clay);
    transform: translateY(-2px);
    box-shadow: var(--shadow-hov);
  }
```

- [ ] **Step 2: Upgrade ChatCta hover**

In `ChatCta.astro`, replace the `<style>` block:

```css
<style>
  .chat-cta {
    max-width: 720px;
    margin: 24px auto 0;
    text-align: left;
  }
  .chat-cta a {
    font-family: var(--font-serif);
    font-size: 16px;
    color: var(--gray-700);
    line-height: 1.5;
    transition: color .15s;
  }
  .chat-cta a em {
    color: var(--clay-deep);
    font-style: italic;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
    transition: text-decoration-color 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .chat-cta a:hover { color: var(--ink); }
  .chat-cta a:hover em { text-decoration-color: var(--clay-deep); }
</style>
```

- [ ] **Step 3: Verify visually**

Check both hover effects on the homepage at `http://localhost:4321`.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/index.astro site/src/components/ChatCta.astro
git commit -m "feat(hover): pill lift + ChatCta underline reveal"
```

---

### Task 10: Activity Feed v2 — inline stats

**Files:**
- Modify: `site/src/components/ActivityFeed.astro`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Add project-count data attribute in index.astro**

In `index.astro`, update the ActivityFeed usage. Change:
```astro
      <ActivityFeed />
```
to:
```astro
      <ActivityFeed projectCount={sortedProjects.length} />
```

- [ ] **Step 2: Rewrite ActivityFeed.astro template**

Replace the entire frontmatter + template (keep the `<script>` and `<style>` blocks for now):

```astro
---
interface Props {
  projectCount?: number;
}
const { projectCount = 0 } = Astro.props;
---

<aside class="feed" data-reveal aria-label="Hvad jeg arbejder med" data-project-count={projectCount}>
  <div class="head">
    <div class="head-left">
      <span class="ldot" aria-hidden="true"></span>
      <span class="label">Hvad jeg bygger</span>
    </div>
    <div class="stats" data-stats>
      <div class="stat">
        <span class="stat-num" data-stat-skrifter>&ndash;</span>
        <span class="stat-label">Skrifter</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-stat-projekter>{projectCount}</span>
        <span class="stat-label">Projekter</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-stat-commits>&ndash;</span>
        <span class="stat-label">Commits</span>
      </div>
    </div>
  </div>
  <ul class="list" data-list>
    <li class="row skeleton-row"><span class="skeleton" style="width: 320px"></span></li>
    <li class="row skeleton-row"><span class="skeleton" style="width: 280px"></span></li>
    <li class="row skeleton-row"><span class="skeleton" style="width: 240px"></span></li>
  </ul>
  <svg class="graph" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
    <g data-bars></g>
  </svg>
  <div class="footer">
    <span class="hint" data-hint>Aktivitet sidste 30 dage</span>
    <a class="github" href="https://github.com/fluen1" target="_blank" rel="noopener">github.com/fluen1 &rarr;</a>
  </div>
</aside>
```

- [ ] **Step 3: Update ActivityFeed script**

Replace the `<script>` block. Key change: populate stat badges from fetched data, remove old `metaEl` reference:

```html
<script>
  interface DayCount { date: string; count: number; }
  interface ActivityEvent {
    type: 'commit' | 'skrift' | 'now' | 'highlight';
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
    const hintEl = root.querySelector('[data-hint]') as HTMLElement;
    const barsEl = root.querySelector('[data-bars]') as SVGGElement;
    const statSkrifter = root.querySelector('[data-stat-skrifter]') as HTMLElement;
    const statCommits = root.querySelector('[data-stat-commits]') as HTMLElement;

    const MONTHS_DA = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

    const formatWhen = (ts: number): string => {
      const diff = Math.floor(Date.now() / 1000) - ts;
      if (diff < 3600) return 'Lige nu';
      if (diff < 86400) return 'I dag';
      if (diff < 2 * 86400) return 'I går';
      const d = new Date(ts * 1000);
      return `${d.getDate()}. ${MONTHS_DA[d.getMonth()]}`;
    };

    const renderEvents = (events: ActivityEvent[]): void => {
      listEl.replaceChildren();
      for (const e of events) {
        const li = document.createElement('li');
        li.className = 'row';
        li.dataset.type = e.type;
        const when = document.createElement('span');
        when.className = 'when';
        when.textContent = formatWhen(e.ts);
        const what = document.createElement('span');
        what.className = 'what';
        const ic = document.createElement('span');
        ic.className = 'ic';
        ic.textContent = e.icon;
        what.appendChild(ic);
        const textNode = e.type === 'skrift'
          ? Object.assign(document.createElement('em'), { textContent: e.text })
          : document.createTextNode(e.text);
        if (e.url) {
          const a = document.createElement('a');
          a.href = e.url;
          a.appendChild(textNode);
          what.appendChild(a);
        } else {
          what.appendChild(textNode);
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
        const h = Math.max(2, (d.count / max) * 32);
        const y = 40 - h;
        const x = i * w;
        const opacity = d.count === 0 ? 0.18 : 0.5 + (d.count / max) * 0.5;
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', x.toFixed(2));
        rect.setAttribute('y', y.toFixed(2));
        rect.setAttribute('width', (w - gap).toFixed(2));
        rect.setAttribute('height', h.toFixed(2));
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', 'currentColor');
        rect.setAttribute('opacity', opacity.toFixed(2));
        barsEl.appendChild(rect);
      });
    };

    fetch('/api/activity')
      .then((r) => r.json() as Promise<ActivityResponse>)
      .then((data) => {
        renderEvents(data.events);
        if (data.events.length === 0) {
          const li = document.createElement('li');
          li.className = 'row';
          li.textContent = 'Stille for tiden';
          listEl.replaceChildren(li);
        }
        const total = data.activity.reduce((sum, d) => sum + d.count, 0);
        const skriftCount = data.events.filter(e => e.type === 'skrift').length;
        statCommits.textContent = String(total);
        statSkrifter.textContent = String(skriftCount);
        hintEl.textContent = 'Aktivitet sidste 30 dage';
        renderBars(data.activity);
      })
      .catch(() => {
        renderError('Kunne ikke hente aktivitet.');
        statCommits.textContent = '–';
        statSkrifter.textContent = '–';
      });
  }
</script>
```

- [ ] **Step 4: Update ActivityFeed styles**

Replace the entire `<style is:global>` block:

```html
<style is:global>
  .feed {
    margin: 24px 0 32px;
    padding: 22px 28px 18px;
    background: var(--cream-warm);
    border: 1px solid var(--gray-100);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm);
    color: var(--clay-deep);
  }
  .head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }
  .head-left { display: flex; align-items: center; gap: 10px; }
  .ldot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--clay);
    box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.55);
    animation: pulse 2.4s infinite;
  }
  .label {
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--clay-xdeep); font-weight: 600;
  }
  .stats { display: flex; gap: 20px; }
  .stat { text-align: center; }
  .stat-num {
    display: block; font-family: var(--font-display);
    font-size: 18px; font-weight: 500; color: var(--ink);
    line-height: 1; font-feature-settings: 'tnum';
  }
  .stat-label {
    font-size: 8px; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--gray-700);
  }
  .list {
    list-style: none; padding: 0; margin: 0 0 16px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .row {
    display: flex; gap: 10px; align-items: baseline;
    padding: 8px 12px; margin: 0 -12px; border-radius: 6px;
    font-size: 14px; line-height: 1.5;
    transition: background 0.15s ease;
  }
  .row:hover { background: rgba(217, 119, 87, 0.05); }
  .row .when {
    color: var(--gray-700); font-size: 12px; white-space: nowrap;
    font-feature-settings: 'tnum'; letter-spacing: 0.02em; min-width: 48px;
  }
  .row .what { color: var(--ink); }
  .row .what em { font-style: italic; color: var(--ink); }
  .row .what a { color: var(--clay-deep); }
  .row .what a:hover { text-decoration: underline; }
  .row .ic { display: inline-block; margin-right: 10px; opacity: 0.5; font-size: 12px; }
  .row[data-type="highlight"] {
    background: rgba(217, 119, 87, 0.06); padding-left: 12px;
    border-left: 2px solid var(--clay); border-radius: 0 6px 6px 0;
  }
  .row[data-type="highlight"]:hover { background: rgba(217, 119, 87, 0.10); }
  .row[data-type="highlight"] .ic { opacity: 1; color: var(--clay); font-weight: 600; }
  .row[data-type="highlight"] .what { font-weight: 500; }
  .skeleton-row { padding: 9px 0; }
  .skeleton {
    display: inline-block; height: 16px;
    background: linear-gradient(90deg, var(--gray-100) 0%, var(--gray-200) 50%, var(--gray-100) 100%);
    background-size: 200% 100%; border-radius: 3px; animation: shimmer 1.4s infinite;
  }
  .graph { width: 100%; height: 40px; color: var(--clay); display: block; margin-bottom: 10px; }
  .footer {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: var(--gray-700);
  }
  .github { color: var(--gray-700); }
  .github:hover { color: var(--clay-deep); }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.55); }
    50% { box-shadow: 0 0 0 7px rgba(217, 119, 87, 0); }
  }
  @media (max-width: 720px) {
    .feed { padding: 18px 16px; }
    .stats { gap: 14px; }
    .stat-num { font-size: 16px; }
    .row { gap: 10px; padding: 8px 8px; margin: 0 -8px; }
    .row .when { min-width: 44px; font-size: 11px; }
    .row .ic { margin-right: 6px; }
  }
</style>
```

- [ ] **Step 5: Verify visually**

Run dev server. The activity feed should show stat badges in the top-right. On mobile width, stats compress.

Note: `/api/activity` requires the Worker — in dev it may 404. Skeleton → error fallback should render cleanly.

- [ ] **Step 6: Verify build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add site/src/components/ActivityFeed.astro site/src/pages/index.astro
git commit -m "feat(feed): activity feed v2 with inline stat badges"
```

---

### Task 11: Chat-UI polish

**Files:**
- Modify: `site/src/pages/chat.astro`

- [ ] **Step 1: Add online indicator to chat header**

In `chat.astro`, replace the `<header class="chat-head">` block:

```html
      <header class="chat-head">
        <div class="chat-status">
          <span class="chat-dot" data-chat-dot></span>
          <span class="chat-online" data-chat-online>Online</span>
        </div>
        <h1>Snak med Philip om hans skrifter</h1>
        <p class="chat-lede">
          Bot'en kender alt p&aring; <a href="/skrifter">/skrifter</a>. Den citerer kilder.
          Den giver ikke juridisk r&aring;dgivning. Samtalen gemmes ikke &mdash; genindl&aelig;s siden for at starte forfra.
        </p>
      </header>
```

- [ ] **Step 2: Add online indicator + thinking dots styles**

Add to the scoped `<style>` block:

```css
  .chat-status {
    display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
  }
  .chat-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sage);
    box-shadow: 0 0 0 0 rgba(120, 140, 93, 0.5);
    animation: chat-pulse 2.4s infinite;
  }
  .chat-dot.offline { background: var(--gray-400); animation: none; }
  .chat-online {
    font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
    font-weight: 600; color: var(--sage);
  }
  .chat-online.offline { color: var(--gray-400); }
  @keyframes chat-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(120, 140, 93, 0.5); }
    50% { box-shadow: 0 0 0 5px rgba(120, 140, 93, 0); }
  }
```

Add to the `<style is:global>` block:

```css
  .chat-thread .thinking-dots {
    display: inline-flex; gap: 4px; padding: 12px 16px;
    background: var(--cream-warm); border: 1px solid var(--gray-100);
    border-radius: 12px; width: fit-content;
  }
  .chat-thread .thinking-dots span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--clay); opacity: 0.4;
    animation: thinking 1.4s infinite;
  }
  .chat-thread .thinking-dots span:nth-child(2) { animation-delay: 200ms; }
  .chat-thread .thinking-dots span:nth-child(3) { animation-delay: 400ms; }
  @keyframes thinking {
    0%, 100% { opacity: 0.4; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-3px); }
  }

  .chat-thread .bubble-assistant .body {
    background: var(--cream-warm);
    border: 1px solid var(--gray-100);
    border-radius: 12px;
    padding: 20px 24px;
  }

  .chat-thread .retry-btn {
    display: inline-block; margin-top: 12px;
    padding: 6px 14px; border: 1px solid var(--clay);
    border-radius: var(--r-sm); background: transparent;
    color: var(--clay-deep); font-size: 13px;
    cursor: pointer; transition: background 0.15s, color 0.15s;
    font-family: var(--font-sans);
  }
  .chat-thread .retry-btn:hover {
    background: var(--clay); color: var(--cream);
  }
```

- [ ] **Step 3: Add thinking dots to send function**

In the `<script>` block, find the `send` function. After `renderMessage(userMsg);` and before `const assistantMsg`, add:

```typescript
    // Show thinking dots
    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'bubble bubble-assistant';
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'thinking-dots';
    for (let i = 0; i < 3; i++) {
      dotsContainer.appendChild(document.createElement('span'));
    }
    thinkingEl.appendChild(dotsContainer);
    thread.appendChild(thinkingEl);
```

Then add `thinkingEl.remove();` in each exit path of the `send` function:
- Before `const { el: assistantEl, bodyEl } = renderMessage(assistantMsg, true);` (success path)
- In the network `catch` block, before `setDimMessage(...)`
- In the `!res.ok` block, before `setDimMessage(...)`
- In the `!res.body` block, before `setDimMessage(...)`

- [ ] **Step 4: Add retry button to error paths**

In each error path that calls `setDimMessage(bodyEl, ...)` followed by `messages.pop(); setBusy(false); return;`, add a retry button after `setDimMessage`:

```typescript
      const retryContent = content;
      const retryBtn = document.createElement('button');
      retryBtn.className = 'retry-btn';
      retryBtn.textContent = 'Prøv igen →';
      retryBtn.addEventListener('click', () => {
        assistantEl.remove();
        void send(retryContent);
      });
      bodyEl.appendChild(retryBtn);
```

Note: `retryContent` captures the current `content` parameter so the retry sends the same message.

- [ ] **Step 5: Add Esc key handler**

Find the existing `input.addEventListener('keydown', ...)` handler. Add Esc handling at the top of the callback:

```typescript
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      input.blur();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
```

- [ ] **Step 6: Verify visually**

Run dev server, go to `/chat`:
1. Online indicator visible (green dot + "Online")
2. Type a message — thinking dots appear while waiting
3. Bot response has cream-warm background with rounded corners
4. Esc clears input

- [ ] **Step 7: Commit**

```bash
git add site/src/pages/chat.astro
git commit -m "feat(chat): online indicator, thinking dots, bot bubbles, retry + Esc"
```

---

### Task 12: Typography — drop-caps + gradient dividers + opsz tuning

**Files:**
- Modify: `site/src/styles/base.css`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Add drop-cap rule to base.css**

Add at the end of `site/src/styles/base.css`:

```css
/* Drop-cap — post pages only */
.post-body > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 3.2em;
  float: left;
  line-height: 0.8;
  margin-right: 6px;
  margin-top: 4px;
  color: var(--clay-deep);
  font-variation-settings: 'opsz' 144;
  font-weight: 400;
}
```

- [ ] **Step 2: Add gradient dividers to index.astro**

Replace the `.section-head` style in `index.astro`:

```css
  .section-head {
    display: flex; align-items: end; justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 14px;
    border-bottom: none;
    background-image: linear-gradient(90deg, var(--clay), transparent);
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: bottom;
  }
```

- [ ] **Step 3: Tune opsz on section headings**

In `index.astro`, add `font-variation-settings` to `.section-head h2`:

```css
  .section-head h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 32px;
    margin: 0;
    letter-spacing: -.015em;
    font-variation-settings: 'opsz' 72;
  }
```

- [ ] **Step 4: Verify visually**

Run dev server:
1. Homepage: gradient dividers between sections (clay to transparent)
2. Post page (`/skrifter/ma-agent-paragraf-30`): drop-cap on first paragraph
3. Both look correct in dark mode

- [ ] **Step 5: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add site/src/styles/base.css site/src/pages/index.astro
git commit -m "feat(typography): drop-caps on posts, gradient dividers, opsz tuning"
```

---

### Task 13: Footer with /now integration

**Files:**
- Modify: `site/src/components/Footer.astro`

- [ ] **Step 1: Update Footer.astro frontmatter**

Replace the frontmatter:

```astro
---
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const year = new Date().getFullYear();

let nowSnippet = '';
let nowUpdated = '';
try {
  const nowPath = path.resolve('../content/now.md');
  const raw = await fs.readFile(nowPath, 'utf-8');
  const { data, content } = matter(raw);
  const trimmed = content.trim();
  nowSnippet = trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed;
  if (data.updated) {
    const d = new Date(data.updated);
    const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
    nowUpdated = `${d.getDate()}. ${months[d.getMonth()]}`;
  }
} catch {
  // now.md missing or unreadable — skip snippet
}
---
```

- [ ] **Step 2: Add now snippet to template**

After the closing `</em>` of the signature div, add:

```astro
      {nowSnippet && (
        <div class="now-snippet">
          <span class="now-label">Lige nu</span>
          <p>{nowSnippet}</p>
          <a class="now-link" href="/now">Mere &rarr;</a>
          {nowUpdated && <span class="now-updated">Opdateret {nowUpdated}</span>}
        </div>
      )}
```

This goes inside the existing `.signature` div, after the `<em>Cand.merc.jur.</em>` line.

- [ ] **Step 3: Add now snippet styles**

Add to the `<style>` block in Footer.astro:

```css
  .now-snippet {
    margin-top: 16px; padding-top: 12px;
    border-top: 1px solid var(--gray-100);
  }
  .now-label {
    font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--clay-xdeep);
    font-weight: 600; display: block; margin-bottom: 6px;
  }
  .now-snippet p {
    font-size: 13px; color: var(--gray-700);
    line-height: 1.5; margin: 0 0 6px;
    font-family: var(--font-serif);
  }
  .now-link { font-size: 12px; color: var(--clay-deep); }
  .now-updated { font-size: 10px; color: var(--gray-400); margin-left: 12px; }
```

- [ ] **Step 4: Verify visually**

Run dev server. Scroll to footer — "Lige nu" snippet should appear below the signature. Check dark mode.

- [ ] **Step 5: Verify build + tests**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add site/src/components/Footer.astro
git commit -m "feat(footer): /now integration with truncated snippet"
```

---

### Task 14: Playwright test updates

**Files:**
- Modify: `site/src/tests/pages.spec.ts`

- [ ] **Step 1: Update hero-skrift test for data-reveal**

The existing test `'forside renders med hero-skrift'` checks `toBeVisible()`, but `data-reveal` starts at `opacity: 0`. Update:

```typescript
test('forside renders med hero-skrift', async ({ page }) => {
  await page.goto('/');
  // Wait for scroll-reveal to fire (element starts at opacity: 0)
  await expect(page.locator('section.hero-skrift.revealed')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('section.hero-skrift .label')).toContainText('Senest skrift');
  await expect(page.locator('section.hero-skrift h1.title')).toBeVisible();
});
```

- [ ] **Step 2: Update activity feed test for new class structure**

The test `'forsiden viser om-mig-sektion + activity-feed'` should still work since `.feed` class is preserved. Verify no changes needed.

- [ ] **Step 3: Add dark mode toggle test**

```typescript
test('dark mode toggle persists across page load', async ({ page }) => {
  await page.goto('/');
  await page.click('.theme-toggle');
  const theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('dark');
  await page.reload();
  const themeAfterReload = await page.getAttribute('html', 'data-theme');
  expect(themeAfterReload).toBe('dark');
});
```

- [ ] **Step 4: Add reduced-motion test**

```typescript
test('scroll-reveal respects prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const heroClass = await page.locator('section.hero-skrift').getAttribute('class');
  expect(heroClass).toContain('revealed');
});
```

- [ ] **Step 5: Run full test suite**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm test`
Expected: All tests pass.

Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`
Expected: Worker + scripts tests also pass (sanity check).

- [ ] **Step 6: Commit**

```bash
git add site/src/tests/pages.spec.ts
git commit -m "test: update for data-reveal + add dark mode and reduced-motion tests"
```

---

### Task 15: Final verification

- [ ] **Step 1: Full build**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run build`
Expected: Build succeeds, all pages generated.

- [ ] **Step 2: Full test suite**

Run: `cd C:\Users\birke\Projects\birkenborg-dev && npm test`
Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm test`
Expected: All green.

- [ ] **Step 3: Visual check all pages**

Run: `cd C:\Users\birke\Projects\birkenborg-dev\site && npm run dev`
Check each page in both light and dark mode:
- `/` — hero reveal, activity feed stats, gradient dividers, pill hover, scroll-reveal stagger
- `/skrifter` — writing items with clay border hover + arrow
- `/skrifter/[any-post]` — drop-cap, view transition from list
- `/chat` — online indicator, thinking dots placeholder, bot bubble styling
- `/cv` — dark mode readable
- `/now` — dark mode readable
- Footer on all pages — now snippet visible

- [ ] **Step 4: Mobile check**

Open DevTools responsive mode (375px width). Verify:
- Header toggle visible and functional
- Pill grid stacks to 1 column
- Activity feed stats compress
- Chat form stacks
- No horizontal overflow anywhere

- [ ] **Step 5: Commit any fixes**

If any visual issues found, fix and commit individually.
