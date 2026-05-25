# birkenborg.dev Visual Upgrade — Design Spec

**Dato:** 2026-05-24
**Scope:** 8 features der løfter det visuelle og interaktive niveau på birkenborg.dev uden at ændre den eksisterende Anthropic-æstetik eller backend/Worker.

---

## 1. Dark Mode

CSS custom properties-baseret tema-skift. Alle tokens i `tokens.css` får dark-varianter via `[data-theme="dark"]` selector på `<html>`.

### Palette-mapping

| Token | Light | Dark |
|-------|-------|------|
| `--cream` | `#faf9f5` | `#0c0c0c` |
| `--cream-warm` | `#f5f1e8` | `#1a1917` |
| `--ink` | `#141413` | `#e8e6dc` |
| `--gray-100` | `#e8e6dc` | `#27261f` |
| `--gray-200` | `#d8d5c6` | `#333028` |
| `--gray-400` | `#6c6a5e` | `#8a887e` |
| `--gray-deco` | `#b0aea5` | `#4a483f` |
| `--gray-700` | `#5a584f` | `#9a988f` |
| `--clay` | `#d97757` | `#e8a087` |
| `--clay-deep` | `#b85d40` | `#d97757` |
| `--clay-xdeep` | `#a04830` | `#d97757` |
| `--clay-soft` | `#e8a087` | `#b85d40` |
| `--slate` | `#6a9bcc` | `#7daed4` |
| `--sage` | `#788c5d` | `#8ea472` |
| `--shadow-sm` | `rgba(20,20,19,.04)` | `rgba(0,0,0,.2)` |
| `--shadow-md` | `rgba(20,20,19,.06)` | `rgba(0,0,0,.3)` |
| `--shadow-hov` | `rgba(20,20,19,.08)` | `rgba(0,0,0,.4)` |

### Adfærd

- Default: følger `prefers-color-scheme: dark`
- Manual toggle: sol/måne-ikon i Header (højre side af nav)
- Persistence: `localStorage.setItem('theme', 'dark'|'light'|'auto')`
- Transition: 200ms på `background-color` og `color` for smooth skift
- Anti-flash: inline `<script>` i `<head>` der sætter `data-theme` før paint

### Scope

Alle sider inkl. chat, activity feed, footer. Header `backdrop-filter` justeres:
- Light: `rgba(250, 249, 245, .85)`
- Dark: `rgba(12, 12, 12, .85)`

### Filer der ændres

- `site/src/styles/tokens.css` — dark-varianter
- `site/src/components/Header.astro` — toggle-knap + dark backdrop
- `site/src/layouts/Base.astro` — anti-flash script i `<head>`

---

## 2. View Transitions

Astro's native `<ViewTransitions />` komponent. Ingen ekstra dependencies.

### Transitions

- **Header:** `transition:persist` — forbliver på plads, ingen animation
- **Main content:** Cross-fade, 150ms ease
- **Skrift-titler:** Shared element transition via `transition:name={slug}` — titlen i WritingItem/HeroSkrift morphes til titlen på post-siden
- **Projekt-pills:** Fade-up, 100ms

### Lifecycle

- Chat-sidens script-state: `transition:persist` på chat-containeren, eller re-init via `astro:after-swap`
- Activity feed: cache data i memory, undgå re-fetch ved back-navigation
- Dark mode: `astro:after-swap` hook sætter `data-theme` fra `localStorage`
- Scroll-reveal: script re-kører via `astro:page-load`

### Fallback

Browsere uden View Transitions API får standard page-load. Progressiv forbedring, ingen polyfill.

### Filer der ændres

- `site/src/layouts/Base.astro` — tilføj `<ViewTransitions />`
- `site/src/components/WritingItem.astro` — `transition:name`
- `site/src/components/HeroSkrift.astro` — `transition:name`
- `site/src/pages/skrifter/[slug].astro` — `transition:name` på titel

---

## 3. Scroll-reveal animationer

Én global utility-script. Ren `IntersectionObserver`, ingen library.

### Implementering

- Elementer med `data-reveal` attribut starter med `opacity: 0; transform: translateY(12px)`
- Ved intersection (threshold `0.15`): tilføj `.revealed` class
- `.revealed`: `opacity: 1; transform: translateY(0)` over 600ms `cubic-bezier(0.16, 1, 0.3, 1)`
- Observer disconnects efter reveal (one-shot)
- Staggering: `data-reveal-delay="1|2|3"` → CSS `transition-delay: 80ms|160ms|240ms`

### Elementer der reveals

- HeroSkrift (titel + excerpt + læs videre)
- OmMig-sektion
- ActivityFeed-kortet
- Hver WritingItem i listen (staggered)
- Projekt-pills (staggered, 80ms mellem hver)
- ChatCta
- Footer-sektioner

### Accessibility

`prefers-reduced-motion: reduce` → instant reveal (ingen transform/delay, kun opacity 0→1 med 0ms duration).

### View Transitions-integration

Script kører via `astro:page-load` event, så reveals fungerer efter navigation.

### Filer der ændres

- `site/src/scripts/reveal.ts` — ny fil, global utility
- `site/src/layouts/Base.astro` — importér reveal-script
- `site/src/styles/base.css` — `.revealed` styles + reduced-motion
- Alle komponenter ovenfor — tilføj `data-reveal` attributter

---

## 4. Micro-interactions & hover effects

Rent CSS. Alle transitions bruger `cubic-bezier(0.16, 1, 0.3, 1)`.

### WritingItem hover

- Clay left-border: `0px → 3px` via `border-left` transition
- Pil (`→`): `opacity: 0 → 1` + `translateX(0 → 4px)`
- Baggrund: `rgba(217,119,87,0.04)`
- Duration: 250ms

### Projekt-pills hover

- Løft: `translateY(-2px)`
- Shadow: `shadow-sm → shadow-hov`
- Border: `gray-100 → clay`
- Duration: 200ms

### Header nav-links

- Underline: `::after` pseudo-element, `scaleX(0) → scaleX(1)` fra venstre
- Farve: `gray-700 → ink`
- Active page: permanent underline i `clay`

### Read-more / pile-links

- Alle `→` pile: `translateX(0 → 4px)` ved hover
- Standardiseres på tværs af HeroSkrift, WritingItem, ChatCta, footer-links

### ChatCta hover

- `em`-tekst: underline-reveal
- Linje: `gray-700 → ink`

### Filer der ændres

- `site/src/components/WritingItem.astro` — hover styles
- `site/src/pages/index.astro` — pill hover styles (allerede delvist)
- `site/src/components/Header.astro` — nav underline + active state
- `site/src/components/HeroSkrift.astro` — standardisér pile-animation
- `site/src/components/ChatCta.astro` — hover styles

---

## 5. Activity Feed v2 med inline stats

Samme API-endpoint (`/api/activity`), samme data. Kun UI-ændringer.

### Nyt layout

**Header-row:**
- Venstre: Pulserende dot + "Hvad jeg bygger" label (uændret)
- Højre: Tre stat-badges i stedet for `"42 commits · sidste 30 dage"` tekst

**Stat-badges:**
- Tal: Fraunces 18px, `font-weight: 500`, `color: var(--ink)`
- Label: uppercase 8px, `color: var(--gray-700)`
- Badges: `skrifter` | `projekter` | `commits`

**Bar-chart:**
- Højde øget fra 56px → 40px (visuelt fylder mere, men SVG viewBox justeres)
- Bredere bars, `rx: 2` for blødere corners

**Event-liste:**
- Kompaktere gap: `18px → 10px`
- Beholder highlight-styling

### Dataflow

- Skrifter-count: tæl `events.filter(e => e.type === 'skrift').length`
- Commits-count: `activity.reduce((sum, d) => sum + d.count, 0)`
- Projekter-count: hardcoded data-attribut `data-project-count` sat fra Astro build (collection size)

Ingen API-ændringer.

### Filer der ændres

- `site/src/components/ActivityFeed.astro` — nyt layout + stat-badges
- `site/src/pages/index.astro` — sæt `data-project-count` fra collection

---

## 6. Chat-UI polish

Forbedringer i `chat.astro`. Ingen Worker-ændringer.

### Online-indikator

- Grøn dot (sage `#788c5d`) + "Online" tekst i chat-header
- Pulserende animation (samme som activity feed, grøn variant)
- Når `CHAT_DISABLED`: grå dot + "Offline"
- Detektering: forsøg initial fetch, vis status baseret på response

### Message-bubbles

- User: Beholder stort italic Fraunces + clay right-border (signatur)
- Bot: Tilføj `cream-warm` baggrund + `gray-100` border + `border-radius: 12px`
- Citations i bot-svar: klikbare clay-farvede links med hover-underline

### Thinking-animation

- Tre pulserende dots i en bot-bubble
- Vises mellem send og første SSE-token
- CSS-only animation, 1.4s infinite loop med 200ms stagger

### Error-state

- Fejl: rød-tonet besked med retry-knap
- Rate-limit: specifik besked "For mange beskeder — prøv igen om lidt"
- Retry-knap re-sender sidste besked

### Keyboard

- Enter: send (allerede implementeret)
- Shift+Enter: linjeskift
- Esc: clear input

### Filer der ændres

- `site/src/pages/chat.astro` — alle ændringer

---

## 7. Typografi-finpudsning

Udnyt Fraunces' variable font-axes bedre. Kun CSS-ændringer.

### Drop-caps

- Kun på post-sider (`/skrifter/[slug]`)
- Første bogstav i første `<p>` efter `<h1>`
- Fraunces, `opsz: 144`, `font-size: 3.2em`, `float: left`, `line-height: 0.8`
- Farve: `var(--clay-deep)`
- `margin-right: 6px`, `margin-top: 4px`

### Gradient-dividers

- Mellem sektioner på forsiden (erstatter `border-bottom: 1px solid var(--gray-100)`)
- `background: linear-gradient(90deg, var(--clay) 0%, transparent 100%); height: 1px`
- Anvendes på `.section-head` border

### Spacing-tokens

Nye tokens i `tokens.css`:

```
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 24px;  --space-6: 32px;
--space-7: 48px;  --space-8: 64px;  --space-9: 80px;
```

Erstatter hardcodede margins/paddings i komponenter gradvist. Ingen visuel ændring — rent konsistens-forbedring.

### Fraunces opsz-tuning

- Hero-titel: `opsz: 144` (bekræft)
- Sektion-headings (`h2`): `opsz: 72`
- Wordmark: `opsz: 100, SOFT: 100` (bekræft)
- OmMig body: `opsz: 24` (bekræft)

### Filer der ændres

- `site/src/styles/tokens.css` — spacing-tokens
- `site/src/styles/base.css` — drop-cap rule
- `site/src/pages/index.astro` — gradient-dividers
- `site/src/pages/skrifter/[slug].astro` — drop-cap scope
- Diverse komponenter — spacing-tokens migration

---

## 8. Footer med /now-integration

Dynamisk "Lige nu" snippet i footeren, bygget ved build-time fra `content/now.md`.

### Layout

- Grid uændret: `2fr 1fr 1fr`
- Venstre kolonne: Signatur + ny "Lige nu" snippet under
- Snippet: uppercase clay label + 1-2 sætninger + "Mere →" link til `/now`

### Data

- `now.md` er fritekst med kun `updated` i frontmatter (ingen strukturerede felter)
- Importér via `Astro.glob` eller `getEntry` og læs body som rå tekst
- Trunkér body til første sætning eller max 120 tegn
- `updated`-dato vises som "Opdateret X. maj" under snippeten

### Truncation

- Max 120 tegn af body, afkortet med `…`
- Link til `/now` for fuld version: "Mere →"

### Filer der ændres

- `site/src/components/Footer.astro` — tilføj now-snippet

---

## Tværgående hensyn

### Dependencies

Ingen nye npm-dependencies. Alt bygger på:
- Astro ViewTransitions (built-in i Astro 6)
- CSS custom properties
- IntersectionObserver (browser-native)

### Dark mode × alle features

Alle features bruger CSS tokens, så dark mode virker automatisk. Specifikke undtagelser:
- Header backdrop-filter — håndteret i sektion 1
- Activity feed shadows — håndteret via shadow-tokens
- Chat bot-bubbles — `cream-warm` + `gray-100` tokens inverterer automatisk

### Performance

- Scroll-reveal: IntersectionObserver er passiv, ingen layout-thrashing
- View Transitions: native browser API, ingen JS-overhead
- Hover effects: rent CSS, GPU-accelereret via `transform`
- Ingen nye API-kald, ingen nye fonts, ingen nye external requests

### Test-strategi

- Eksisterende Playwright E2E tests skal stadig passe
- Nye tests: dark mode toggle persistence, view transition navigation, reduced-motion respect
- Visuelt: Lighthouse score skal forblive ≥ 90 på performance

### Implementeringsrækkefølge (anbefalet)

1. **Spacing-tokens + typografi** — fundament der bruges af alt andet
2. **Dark mode** — token-infra der påvirker alle komponenter
3. **Scroll-reveal** — global script
4. **View Transitions** — kræver at scroll-reveal er klar (lifecycle-hooks)
5. **Micro-interactions** — CSS-only, uafhængig
6. **Activity Feed v2** — selvstændig komponent
7. **Chat-UI polish** — selvstændig side
8. **Footer /now-integration** — selvstændig komponent
