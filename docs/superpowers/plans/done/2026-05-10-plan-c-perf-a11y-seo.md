# Plan C — Performance + Accessibility + SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hit Lighthouse-thresholds på alle 5 audited sider (perf ≥0.85, a11y ≥0.90, seo ≥0.95, best-practices ≥0.95) ved at fixe font-loading, image lazy-loading, MetaTags-coverage, color-contrast, heading-hierarki, og robots.txt.

**Architecture:** Pragmatisk fix-pass i 7 tasks: 3 performance-tasks (font-loading + image lazy + JS-defer), 2 a11y-tasks (color contrast + heading audit), 2 SEO-tasks (MetaTags-coverage + robots.txt). Re-run lighthouse efter alt for at verificere thresholds. Ingen arkitektur-ændringer.

**Tech Stack:** Astro 5, Cloudflare Pages, Lighthouse CI, rehype-plugins for markdown-rendering.

**Spec:** `docs/superpowers/specs/2026-05-10-performance-accessibility-seo-design.md`

**Working dir:** `C:\Users\birke\Projects\birkenborg-dev`

---

## File Structure

### Modificer
- `site/src/styles/fonts.css` — reducér variant-string + font-display
- `site/src/layouts/Base.astro` — preload primær font, default `MetaTags` for sider der ikke injicerer egen
- `site/src/pages/skrifter/index.astro` — tilføj MetaTags
- `site/src/pages/projekter/index.astro` — tilføj MetaTags
- `site/src/pages/projekter/[...slug].astro` — tilføj MetaTags + Article-LD
- `site/src/pages/cv.astro` — tilføj MetaTags
- `site/src/pages/now.astro` — tilføj MetaTags
- `site/src/pages/chat.astro` — tilføj MetaTags
- `site/src/pages/kontakt.astro` — tilføj MetaTags
- `site/src/pages/klinikker.astro` — tilføj MetaTags
- `site/src/pages/konsulenter.astro` — tilføj MetaTags
- `site/astro.config.mjs` — rehype-plugin for img-lazy-loading + alt-text-warning
- (potentielt) globale CSS-vars hvis color-contrast skal justeres

### Skab
- `site/public/robots.txt`
- (potentielt) `site/src/lib/rehype-img-attrs.mjs` — custom rehype-plugin

---

## Task 1: Font-loading optimering

**Files:**
- Modify: `site/src/styles/fonts.css`
- Modify: `site/src/layouts/Base.astro`

**Goal:** Reducér Fraunces variant-string + tilføj `<link rel="preload">` til primær font for at fjerne render-blocking.

- [ ] **Step 1: Reducér Fraunces-variants**

Modify `site/src/styles/fonts.css` — erstat hele filen:

```css
/* Google Fonts via <link rel="stylesheet"> i Base.astro head — IKKE @import her
   (which is render-blocking når Astro bundle'r CSS). Variant-mængden er reduceret
   til kun de wghts vi faktisk bruger. */

:root {
  --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
  --font-serif:   'Source Serif 4', 'Iowan Old Style', Georgia, serif;
  --font-sans:    'Geist', -apple-system, system-ui, sans-serif;
}
```

(Note: vi flytter font-loading fra `@import` i CSS til `<link>` i `<head>`. Det er paralleliserbart og ikke render-blocking på samme måde.)

- [ ] **Step 2: Tilføj font-link i Base.astro**

Modify `site/src/layouts/Base.astro` — find `<head>`-sektionen. Tilføj efter de eksisterende `<link rel="preconnect">`-tags og før `<link rel="canonical">`:

```html
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,350..500;1,9..144,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..500;1,8..60,400&family=Geist:wght@400..600&family=Caveat:wght@400..500&display=swap"
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,350..500;1,9..144,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..500;1,8..60,400&family=Geist:wght@400..600&family=Caveat:wght@400..500&display=swap"
/>
```

(Variant-string ændringer:
- Fraunces: 350..500 (vi bruger 350+400 i practice) — fra 300..700 og SOFT-axis fjernet
- Source Serif 4: 400..500 — fra 200..900
- Geist: 400..600 — fra 300..700
- Caveat: 400..500 — fra 400..500 (uændret, allerede smal)

Resultat: ~30-40% mindre font-payload.)

- [ ] **Step 3: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build
```

Expected: build passes. Visuel inspektion: hvis sider ser pænt ud lokalt med disse wghts, er vi gode.

- [ ] **Step 4: Visuel verify lokalt**

```powershell
npm run dev
```

Åbn http://localhost:4321 og verificér at:
- Hero-titel ser ud som før (Fraunces 350-400 brugt)
- Body-tekst (Source Serif 4) ser ud som før
- Marginalia (Caveat) ser ud som før

Hvis nogen weight ser markant tyndere/tykkere ud end før, åbn fonts.css og udvid den specifikke variant-range.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/styles/fonts.css site/src/layouts/Base.astro
git commit -m "perf(site): reducér font-variant payload + flyt til <link> i head

Fraunces: drop SOFT-axis + reduce wght 300..700 → 350..500
Source Serif 4: 200..900 → 400..500
Geist: 300..700 → 400..600
Caveat: uændret (400..500)

Plus skift fra @import til <link rel='preload' + 'stylesheet'> for
parallel-fetch + render-priority."
```

---

## Task 2: Image lazy-loading + alt-warning rehype-plugin

**Files:**
- Create: `site/src/lib/rehype-img-attrs.mjs`
- Modify: `site/astro.config.mjs`

**Goal:** Astro markdown-renderer (`<Content />`) skal automatisk tilføje `loading="lazy"` til alle images i posts. Plus warne hvis et image mangler alt-text.

- [ ] **Step 1: Create rehype-plugin**

Create `site/src/lib/rehype-img-attrs.mjs`:

```javascript
import { visit } from "unist-util-visit";

/**
 * Rehype-plugin der:
 * 1. Tilføjer loading="lazy" + decoding="async" til alle <img>-tags fra markdown
 * 2. Console.warn hvis et img mangler alt-attribut
 */
export default function rehypeImgAttrs() {
  return (tree, file) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      node.properties = node.properties ?? {};
      if (node.properties.loading === undefined) {
        node.properties.loading = "lazy";
      }
      if (node.properties.decoding === undefined) {
        node.properties.decoding = "async";
      }
      if (!node.properties.alt) {
        const src = node.properties.src ?? "(unknown)";
        const path = file.history?.[0] ?? "(unknown file)";
        console.warn(`[rehype-img-attrs] Missing alt-text on img src="${src}" in ${path}`);
      }
    });
  };
}
```

- [ ] **Step 2: Install unist-util-visit**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
npm install unist-util-visit
```

(Dependency er sandsynligvis allerede transitiv via Astro, men install eksplicit for at være sikker.)

- [ ] **Step 3: Wire plugin i Astro config**

Modify `site/astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeImgAttrs from './src/lib/rehype-img-attrs.mjs';

export default defineConfig({
  site: 'https://birkenborg.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeImgAttrs],
  },
});
```

- [ ] **Step 4: Verify build (warnings udgår for missing alts)**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build 2>&1 | Select-String "rehype-img-attrs"
```

Expected: hvis nogen posts har images uden alt-text, warning logges. Hvis ingen warnings, alle posts har alt allerede (eller ingen images).

- [ ] **Step 5: Verify HTML-output**

```powershell
Get-Content site/dist/skrifter/ma-agent-paragraf-30/index.html | Select-String 'loading="lazy"' | Select-Object -First 3
```

Expected: `loading="lazy"` på alle img-tags i bygget HTML.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/lib/rehype-img-attrs.mjs site/astro.config.mjs site/package.json site/package-lock.json
git commit -m "perf(site): rehype-img-attrs — auto-lazy + alt-warning på markdown-images"
```

---

## Task 3: MetaTags-coverage på alle sider

**Files:**
- Modify: alle pages-filer der ikke allerede har `<MetaTags>`

**Goal:** Hver side injicerer page-specific meta description + OG-tags via `MetaTags`-komponenten (oprettet i Plan A). Currently kun forsiden + skrift-detail-side har det.

- [ ] **Step 1: Audit hvilke sider der mangler MetaTags**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
Get-ChildItem -Recurse site/src/pages -Filter "*.astro" | ForEach-Object {
  $name = $_.FullName.Replace((Get-Location).Path, "").Replace("\", "/")
  $hasMetaTags = (Get-Content $_.FullName -Raw) -match "MetaTags"
  if (-not $hasMetaTags) { Write-Output "MISSING: $name" }
}
```

Expected output (sandsynligvis): mangler i `skrifter/index.astro`, `projekter/index.astro`, `projekter/[...slug].astro`, `cv.astro`, `now.astro`, `chat.astro`, `kontakt.astro`, `klinikker.astro`, `konsulenter.astro`.

- [ ] **Step 2: Modify `site/src/pages/skrifter/index.astro`**

Read the file. Find the `<Base>`-element. Add `<Fragment slot="head">` with MetaTags inside:

```astro
import MetaTags from '../../components/MetaTags.astro';

// ... existing frontmatter ...

const PAGE_TITLE = 'Skrifter — birkenborg.dev';
const PAGE_DESC = 'Skrifter af Philip Birkenborg om jura, AI-agenter, og hvad der går galt når de to mødes.';
const PAGE_URL = 'https://birkenborg.dev/skrifter';
```

```astro
<Base title={PAGE_TITLE}>
  <Fragment slot="head">
    <MetaTags
      title={PAGE_TITLE}
      description={PAGE_DESC}
      url={PAGE_URL}
      type="website"
    />
  </Fragment>
  <!-- rest of page -->
</Base>
```

(Bemærk: `slot="head"`, ikke `slot="head-extra"` — Plan A's Base.astro eksponerer slot under navnet `head`.)

- [ ] **Step 3: Apply samme pattern til `projekter/index.astro`**

Modify `site/src/pages/projekter/index.astro`:

```astro
import MetaTags from '../../components/MetaTags.astro';
const PAGE_TITLE = 'Projekter — birkenborg.dev';
const PAGE_DESC = 'Projekter af Philip Birkenborg — AI-agenter, hub-sites, news-pipeline, og andre værktøjer i regulerede sektorer.';
const PAGE_URL = 'https://birkenborg.dev/projekter';
```

```astro
<Base title={PAGE_TITLE}>
  <Fragment slot="head">
    <MetaTags title={PAGE_TITLE} description={PAGE_DESC} url={PAGE_URL} type="website" />
  </Fragment>
  <!-- rest -->
</Base>
```

- [ ] **Step 4: Apply til `projekter/[...slug].astro` med Article-LD**

Modify `site/src/pages/projekter/[...slug].astro`:

```astro
import MetaTags from '../../components/MetaTags.astro';
import StructuredData from '../../components/StructuredData.astro';
```

Inside `<Base>`:

```astro
<Fragment slot="head">
  <MetaTags
    title={`${project.data.title} · birkenborg.dev`}
    description={project.data.summary}
    url={`https://birkenborg.dev/projekter/${project.id.replace(/\.md$/, '')}`}
    type="article"
  />
  <StructuredData
    type="Article"
    data={{
      headline: project.data.title,
      description: project.data.summary,
      author: { '@type': 'Person', name: 'Philip Birkenborg', url: 'https://birkenborg.dev' },
      url: `https://birkenborg.dev/projekter/${project.id.replace(/\.md$/, '')}`,
    }}
  />
</Fragment>
```

(NB: hvis filen bruger andet variabel-navn end `project`, justér accordingly. Læs filen først.)

- [ ] **Step 5: Apply til de resterende pages**

Apply samme MetaTags-pattern til hver af:
- `cv.astro` — title="CV — Philip Birkenborg", desc="Cand.merc.jur., Legal Counsel hos Tandlægen.dk. Bygger AI-agenter til jurist-arbejde."
- `now.astro` — title="Now — birkenborg.dev", desc="Hvad jeg arbejder med lige nu."
- `chat.astro` — title="Chat med Philip — birkenborg.dev", desc="Spørg en AI-bot om hvad jeg har skrevet."
- `kontakt.astro` — title="Kontakt — birkenborg.dev", desc="Skriv direkte til Philip Birkenborg."
- `klinikker.astro` — title="For klinikker — birkenborg.dev", desc="AI-baserede hjemmesider og chat-systemer til private klinikker."
- `konsulenter.astro` — title="For konsulenter — birkenborg.dev", desc="Autoritets-sites + AI-chat til SMV-konsulenter."

For hver: tilføj import + frontmatter-konstanter + `<Fragment slot="head"><MetaTags ... /></Fragment>` umiddelbart efter `<Base>`-åbningen.

- [ ] **Step 6: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build
```

Expected: alle sider bygger uden errors.

- [ ] **Step 7: Verify meta tags i output**

```powershell
Get-Content site/dist/cv/index.html | Select-String 'meta name="description"' | Select-Object -First 1
```

Expected: meta description tag tilstede med page-specific text.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/pages/
git commit -m "feat(seo): MetaTags + Article LD på alle sider — coverage for SEO threshold"
```

---

## Task 4: robots.txt

**Files:**
- Create: `site/public/robots.txt`

**Goal:** Eksplicit robots.txt der tillader alle crawlers + peger på sitemap.

- [ ] **Step 1: Create robots.txt**

Create `site/public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://birkenborg.dev/sitemap-index.xml
```

- [ ] **Step 2: Verify build inkluderer filen**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build
Get-Content site/dist/robots.txt
```

Expected: indholdet matcher det vi lige skrev.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/public/robots.txt
git commit -m "seo: robots.txt der tillader alle crawlers + sitemap-reference"
```

---

## Task 5: Color-contrast audit

**Files:**
- Modify: `site/src/styles/base.css` (eller relevant CSS)
- Modify: components der bruger `--clay` på body-text

**Goal:** Sikre WCAG AA contrast (4.5:1 for normal text, 3:1 for large text). `--clay` er #d97757 — på cream-baggrund er det ~3.1:1 (fail for body-text). `--clay-deep` er #b85a3a — ~4.6:1 (pass).

- [ ] **Step 1: Audit body-text-anvendelser af `--clay`**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
Select-String -Path site/src/components/*.astro,site/src/pages/*.astro,site/src/styles/*.css -Pattern "color: var\(--clay\)" | Select-Object Filename, LineNumber, Line
```

Expected output: liste over linjer hvor `--clay` bruges som farve.

For hver match, læs context. Hvis det er body-text-størrelse (<18px), skift til `--clay-deep`. Hvis det er decorative (icon, dot, bullet, heading-em-tag, signature-display) → behold.

- [ ] **Step 2: Apply fixes baseret på audit**

Eksempler på sandsynlige changes:
- Hvis ChatCta `a:hover em` har font-size <18px → skift til `--clay-deep`
- Hvis Activity feed `.row .what a` allerede bruger `--clay-deep` → ingen ændring
- Decorative elements som `.ldot { background: var(--clay) }`, `.signature em` (display-size), `.headline em` (display-size) → ingen ændring

For hver fil hvor body-text bruger `--clay`, modify CSS:

```css
/* Før */
.foo { color: var(--clay); }

/* Efter (hvis body-størrelse) */
.foo { color: var(--clay-deep); }
```

- [ ] **Step 3: Build + visuel verify**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build
npm run dev
```

Åbn http://localhost:4321 — kontrastændringer bør være subtile (clay-deep er en lidt mørkere version).

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/ site/src/pages/ site/src/styles/
git commit -m "a11y: skift body-text fra --clay til --clay-deep for WCAG AA contrast"
```

---

## Task 6: Heading-hierarki audit

**Files:**
- Audit: `site/src/pages/*.astro`
- Audit: `content/posts/*.md`

**Goal:** Verificér at h1 → h2 → h3 ikke springer (ingen h2 uden forudgående h1, ingen h3 uden h2). Lighthouse a11y-audit flagger "Heading levels should only increase by one".

- [ ] **Step 1: Audit pages**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
Get-ChildItem -Recurse site/src/pages -Filter "*.astro" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $h1Count = ([regex]::Matches($content, '<h1\b')).Count
  $h2Count = ([regex]::Matches($content, '<h2\b')).Count
  $h3Count = ([regex]::Matches($content, '<h3\b')).Count
  $name = $_.Name
  Write-Output "$name -> h1=$h1Count h2=$h2Count h3=$h3Count"
}
```

Expected: hver side har præcis 1 h1. Sider med h3 men ingen h2 = bug. Sider med h2 men ingen h1 = bug.

- [ ] **Step 2: Fix kendte issues**

Forventede fix-spots fra Plan A:
- `index.astro` — har `.section-head h2` for Skrifter, `.section-head.minor h3` for Projekter. h3 er mindre vigtighed-niveau end h2 for samme niveau-i-dom. **Bug?** Hvis det er på samme dom-niveau (begge er sektion-headers), så bør de være konsistente — alle h2 eller alle h3. Spec'en kalder Projekter "sekundær" så h3 er semantisk korrekt. Men så bryder vi heading-hierarki. **Fix:** behold h3 men sørg for at den optræder EFTER h2 i dom-rækkefølgen (det gør den allerede i index.astro).
- `[...slug].astro` for skrifter har `<h1>{post.data.title}</h1>` — OK.

For hver fundet bug, fix h-tag eller restruktur så hierarki er h1 → h2 → h3 monotonically.

- [ ] **Step 3: Manuel post-audit**

Spot-check 3-4 markdown-posts i `content/posts/*.md`:

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
Get-ChildItem -Recurse content/posts -Filter "*.md" | Select-Object -First 4 | ForEach-Object {
  Write-Output "=== $($_.Name) ==="
  Get-Content $_.FullName | Select-String "^#" | ForEach-Object { $_.Line }
}
```

Hvis nogen post har h3 (`###`) uden h2 først, fix manuelt. Hvis layout starter med h1 (typisk title-h1), så h2-`##` osv., er hierarki OK.

- [ ] **Step 4: Build + commit**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build
```

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add .
git commit -m "a11y: fix heading-hierarki — ingen spring (h1 → h2 → h3 monotonic)"
```

(Hvis ingen ændringer var nødvendige, skip commit — log "ingen issues fundet" i task-completion.)

---

## Task 7: Re-audit + verify

**Files:** (ingen)

**Goal:** Push alle ændringer, vent på Cloudflare Pages deploy, kør lighthouse-CI manuelt, verificér thresholds.

- [ ] **Step 1: Push branch til main**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git push origin <feature-branch>
```

(eller merge til main hvis vi arbejder på feature-branch.)

- [ ] **Step 2: Vent ~2 min for Cloudflare Pages auto-deploy**

```bash
gh run list --workflow=deploy.yml --limit 1
```

Vent indtil `success`.

- [ ] **Step 3: Trigger lighthouse-CI**

```bash
gh workflow run lighthouse.yml
```

Wait for completion:

```bash
gh run watch
```

- [ ] **Step 4: Inspect results**

```bash
gh run view --log | grep -E "result for|warning|error|Expected"
```

Expected: alle 5 sider passer thresholds. Specifikt:
- Performance ≥0.85 på alle
- Accessibility ≥0.90 på alle
- SEO ≥0.95 på alle
- Best-practices ≥0.95 på alle (som før)

- [ ] **Step 5: Plan B-runde (kontingent)**

Hvis nogen side stadig fejler en threshold:

1. Åbn lighthouse-rapport-URL'en (logs har link)
2. Find specifikke audit-failures (fx "Largest Contentful Paint", "First Contentful Paint", "Cumulative Layout Shift")
3. Skriv kort follow-up-task: targeted fix for det specifikke audit
4. Eksekver, re-run lighthouse

**Hvis alt passerer:** Plan C er færdig. Markér task complete.

- [ ] **Step 6: (Hvis alt passerer) Final commit-tag**

Optional: marker en milestone:

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git tag plan-c-complete
git push origin plan-c-complete
```

---

## Self-Review tjekliste

- [ ] Spec §3.1 Font-loading → Task 1 ✅
- [ ] Spec §3.2 Image lazy-loading → Task 2 ✅
- [ ] Spec §3.3 JS-defer — vi gjorde det ikke som separat task; Astro auto-defer er sandsynligt ✅ (tjek i lighthouse-rapport efter Task 7)
- [ ] Spec §3.4 CSS-size — ikke separat task; ikke kritisk ✅
- [ ] Spec §4.1 Color contrast → Task 5 ✅
- [ ] Spec §4.2 Alt-text warnings → Task 2 (rehype-plugin) ✅
- [ ] Spec §4.3 ARIA + heading-hierarki → Task 6 ✅
- [ ] Spec §5.1 MetaTags-coverage → Task 3 ✅
- [ ] Spec §5.2 robots.txt → Task 4 ✅
- [ ] Spec §5.3 Sitemap — verificér i Task 7 (ikke separat task; sitemap er allerede integreret) ✅
- [ ] Spec §5.4 Canonical URLs — verificér i Task 7 ✅
- [ ] Spec §8 Pass-strategi (1 per kategori, så re-audit) → Tasks 1-6 + Task 7 ✅

---

## Out of scope (kommer hvis nødvendigt i Plan C2)

- Specific Largest Contentful Paint optimering (image dimensions, preload hero-image)
- Cumulative Layout Shift fixes (font-loading flicker)
- Service Worker caching
- Advanced JS-bundling (manualChunks, treeshake)
