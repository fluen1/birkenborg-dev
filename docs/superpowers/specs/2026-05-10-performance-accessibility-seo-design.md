# Plan C — Performance + Accessibility + SEO fixes design

**Forfatter:** Philip Birkenborg Andersen
**Dato:** 2026-05-10
**Status:** Aktivt design — klar til implementations-plan
**Bygger ovenpå:** Plan A site-redesign (merget). Audit-data fra lighthouse-CI run 25629978168.

## 1. Vision

Hit Lighthouse-thresholds på alle audited sider: **performance ≥0.85, accessibility ≥0.90, SEO ≥0.95, best-practices ≥0.95.**

Eksisterende thresholds er defineret i `lighthouserc.json`. Workflow `lighthouse.yml` kører ugentligt mandag 06:00 UTC.

## 2. Baseline (post-Plan A relaunch)

| Side | Performance | Accessibility | SEO |
|---|---|---|---|
| `/` | 0.63 ⚠️ (-22) | — | — |
| `/skrifter` | 0.72 ⚠️ (-13) | 0.87 ⚠️ (-3) | 0.92 ❌ (-3) |
| `/projekter` | — | 0.87 ⚠️ (-3) | 0.92 ❌ (-3) |
| `/cv` | 0.66 ⚠️ (-19) | 0.89 ⚠️ (-1) | 0.92 ❌ (-3) |
| `/skrifter/<post>` | 0.63 ⚠️ (-22) | — | — |

Best-practices ikke flagged → sandsynligvis ≥0.95 allerede.

## 3. Performance — antaget root causes + fixes

Performance-issuet er stort (gap 13-22 points). Mest sandsynlige årsager:

### 3.1 Font-loading
Sitet importerer 4 Google Fonts via `@import url(...)` i `site/src/styles/fonts.css`:
- Fraunces (display, multiple wghts + opsz + SOFT)
- Source Serif 4 (serif body)
- Geist (sans)
- Caveat (handwritten — Plan A's marginalia)

Hver `@import url(...)` blokker render. Plus `family=Fraunces:ital,opsz,wght,SOFT@0,9..144,...` er en stor variant-string.

**Fix:**
- Skift `@import` til `<link rel="stylesheet">` i `Base.astro` `<head>` så browseren kan parallel-fetch + render
- Tilføj `display=swap` (allerede der per current setup-tjek; verificér)
- Reducér variant-mængden: kun de wghts vi faktisk bruger (Fraunces 350+400; SourceSerif 400+italic; Geist 400+500; Caveat 400)
- Preload den primære font (Fraunces) med `<link rel="preload" as="font" type="font/woff2" crossorigin>`

### 3.2 Image lazy-loading
Eksisterende skrift-/projekt-/cv-sider kan have billeder uden `loading="lazy"`. Astro auto-applicerer det på `<Image>`-komponenter, men markdown-images i posts (via `![]()`) gør det IKKE automatisk.

**Fix:**
- Tilføj `<img loading="lazy">` til alle img-tags i markdown-output (kan gøres via remark/rehype-plugin)
- Tjek hvilken `astro:content`-rendering der er tilstede; rehype-plugin er enkel

### 3.3 Eliminate render-blocking JS
ActivityFeed bruger inline-script i Astro-komponent (`<script>`-block i .astro). Astro inline'er det som module ved build. Inline-scripts er render-blocking medmindre `defer`/`async`.

**Fix:**
- Tjek bygget output; tilføj `defer` til script-tags hvis ikke allerede.

### 3.4 Reduktioner CSS-size
Plan A introducerede `<style is:global>` på ActivityFeed.astro (for at fixe scoping-bug). Globale styles bundles forskelligt. Ikke et critical issue, men værd at tjekke output-størrelse.

## 4. Accessibility — antaget fixes

A11y-gap er 1-3 points (87-89 vs 90 threshold). Mest sandsynlige causes:

### 4.1 Color contrast
Eksisterende palette: `--clay: #d97757`, `--clay-deep: #b85a3a`. På cream-baggrund (`#faf9f5`):
- `--clay-deep` på cream: ~4.5:1 (WCAG AA for normal text — borderline)
- `--clay` på cream: ~3.1:1 (FAIL for body text, OK for large text)

**Fix:**
- Brug kun `--clay-deep` for body-text-størrelse (ikke `--clay` direkte)
- Audit alle `color: var(--clay)`-anvendelser; skift til `--clay-deep` hvis font-size <18px
- For accent-elements som ikoner kan `--clay` blive på subtle-baggrunde

### 4.2 Manglende alt-text
Markdown-images i `content/posts/*.md` har sandsynligvis ingen alt-text når Philip skriver `![](url)` uden alt.

**Fix:**
- rehype-plugin der requires alt-text (warns if empty)
- Manuelt audit eksisterende posts for missing alts

### 4.3 ARIA-labels + heading-hierarki
- Verificér at alle interaktive elementer har label (links, buttons)
- Tjek at h1/h2/h3 ikke springer (h1 → h3 uden h2)
- Marginalia-aside har allerede `aria-label="Philips noter"` (verificér)

## 5. SEO — antaget fixes

SEO-gap er 3 points (92 vs 95). Mest sandsynlige causes:

### 5.1 Meta description
Plan A introducerede `MetaTags.astro` der sætter `<meta name="description">` på sider der bruger den. Men IKKE alle sider bruger MetaTags-komponenten.

**Fix:**
- Audit hver side for MetaTags-injection: `/skrifter` (index), `/skrifter/<slug>`, `/projekter` (index), `/projekter/<slug>`, `/cv`, `/now`, `/chat`, `/kontakt`, `/klinikker`, `/konsulenter`
- Tilføj MetaTags hvor manglende

### 5.2 robots.txt
Astro genererer ikke robots.txt automatisk. Cloudflare Pages kan have default-robots der siger "noindex".

**Fix:**
- Tilføj `site/public/robots.txt` med `User-agent: *\nAllow: /\nSitemap: https://birkenborg.dev/sitemap-index.xml`

### 5.3 Sitemap
Astro `@astrojs/sitemap`-integration er allerede aktiv (`sitemap-index.xml created at dist` i build-log).

**Fix:** Verificér det er accessible på live-domain.

### 5.4 Canonical URLs
`Base.astro` allerede sætter `<link rel="canonical">`. Verificér det er korrekt på alle sider.

## 6. Best-practices — formodentlig ingen fix nødvendigt

Ikke flagged i audit-output. Verificér post-fix (kunne være 0.95 nu og falde til 0.94 efter ændringer).

## 7. Out of scope

- Performance-arkitektur-ændringer (fx skifte til Astro Islands hvor vi har static, brug af Service Worker, etc.). YAGNI.
- A11y-features ud over WCAG 2.1 AA (skip-links til screen readers, prefers-reduced-motion, etc.). Yagni for solo-projekt der ikke har specielle accessibility-krav.
- SEO-features ud over Lighthouse-thresholds (rich snippets, AMP, etc.).

## 8. Implementation-strategi

Pragmatisk fix-pass:

1. **Pass 1: Performance-driven fixes** (font-loading + image-lazy + JS-defer)
2. **Pass 2: A11y-fixes** (contrast audit + alt-text + ARIA)
3. **Pass 3: SEO-fixes** (MetaTags-coverage + robots.txt)
4. **Re-run lighthouse** efter hver pass for at se progress
5. **Pass 4 (kontingent):** hvis nogen kategori stadig under threshold, dyk ned i specifikke audit-failures via lighthouse-rapport

## 9. Tests

Hovedtesten er Lighthouse-CI re-run. Sekundært:
- Visuel QA på birkenborg.dev (font-loading ser stadig pænt ud)
- A11y-tools: WAVE eller axe-DevTools på live site for at finde missed issues

## 10. Reference

- Audit-data: GitHub Actions run 25629978168 (https://github.com/fluen1/birkenborg-dev/actions/runs/25629978168)
- Thresholds: `lighthouserc.json`
- Workflow: `.github/workflows/lighthouse.yml`
- Plan A spec: `docs/superpowers/specs/2026-05-10-site-personal-brand-redesign-design.md`
