# Comprehensive Upgrade — Design Spec

**Dato:** 2026-05-25
**Scope:** ~35 ændringer på tværs af birkenborg-dev og birkenborg-agents: bugfixes, dead code cleanup, performance/cost-optimering, og 5 nye features. Ingen nye npm/pip dependencies.

**Projekter:**
- `birkenborg-dev` @ `C:\Users\birke\Projects\birkenborg-dev`
- `birkenborg-agents` @ `C:\Users\birke\Projects\birkenborg-agents`

---

## 1. Bugfixes

### 1a. `/linkedin` kommando camelCase-bug

**Projekt:** birkenborg-agents
**Fil:** `worker/src/commands/linkedin.ts:8`

Ændr `val.publishAt` til `val.publish_at`. KV-entryen skrives med snake_case i `saveLinkedInPending()` (`worker/src/news/handler.ts`), men den nye `/linkedin` kommando læser med camelCase. Resulterer i at alle datoer vises som "ukendt".

### 1b. Opret `og-default.png`

**Projekt:** birkenborg-dev
**Fil:** `site/public/og-default.png` (ny)

`MetaTags.astro:20` falder tilbage til `https://birkenborg.dev/og-default.png` som ikke eksisterer. 9 sider (forsiden, /skrifter, /projekter, /chat, /cv, /now, /kontakt, /klinikker, /konsulenter) har broken OG-billeder ved social sharing.

Generér et 1200×630px OG-billede med birkenborg.dev branding via `astro-og-canvas` eller manuelt. Cream baggrund, "birkenborg/dev" wordmark centreret, clay accent.

### 1c. Fjern `/internal/inbox` ghost-kald

**Projekt:** birkenborg-dev
**Fil:** `worker/index.ts` — `fetchDrafts()` funktion

`fetchDrafts` kalder `bot.birkenborg.dev/internal/inbox` som ikke eksisterer i birkenborg-agents. Kaldet fejler stille (404 → null) og tilføjer en unødvendig netværks-roundtrip ved hvert `/api/activity` cache miss.

Fjern `fetchDrafts` funktionen og `draftsPending` fra activity-response, eller erstat med et kald til `/internal/linkedin-pending` og count entries.

### 1d. Verificér `kill:<date>` write-path

**Projekt:** birkenborg-agents
**Fil:** `worker/src/commands/stop.ts`

`commands/stop.ts` skriver `kill:<YYYY-MM-DD>` til KV med 36h TTL når Philip sender STOP uden aktiv pipeline. `publish_post.py` læser den via `/internal/kill?date=`. Verificér at:
1. `stop.ts` faktisk skriver til KV (læs koden)
2. Datoen der skrives matcher datoen `publish_post.py` forespørger
3. Hele flowet virker end-to-end

Hvis det allerede virker: dokumentér flowet i en kommentar. Hvis det er brudt: fix.

### 1e. `weekday_publish.yml` failure notification

**Projekt:** birkenborg-agents
**Fil:** `.github/workflows/weekday_publish.yml:70-74`

"Notify on failure" step mangler `BOT_INTERNAL_TOKEN` og `BOT_BASE` i sin `env` blok. `telegram_bot.send_dm` delegerer til `bot_client.send_dm` som kræver begge. Failure alerts er stille.

Tilføj:
```yaml
      env:
        BOT_INTERNAL_TOKEN: ${{ secrets.BOT_INTERNAL_TOKEN }}
        BOT_BASE: ${{ secrets.BOT_BASE }}
        TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
        TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

### 1f. `preview_linkedin.py` crash

**Projekt:** birkenborg-agents
**Fil:** `scripts/preview_linkedin.py:50`

Kalder `TONE_PATH.read_text()` på `prompts/tone.md` som er slettet. Crasher med `FileNotFoundError`.

Fix: tilføj `if TONE_PATH.exists()` guard, eller embed tone-guidance inline (som `draft_outreach.py` allerede håndterer).

### 1g. `coauthor_digest.py` ugyldige SDK params

**Projekt:** birkenborg-agents
**Fil:** `scripts/coauthor_digest.py:83-84`

`thinking={"type": "disabled"}` og `output_config={"effort": "low"}` er ikke gyldige params for `anthropic.Client.messages.create()`. Fjern begge linjer.

### 1h. Definer `--font-mono` token

**Projekt:** birkenborg-dev
**Fil:** `site/src/styles/fonts.css`

`chat.astro` bruger `var(--font-mono)` 3 steder men tokenet er aldrig defineret. Tilføj:

```css
--font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;
```

### Filer der ændres

- `birkenborg-agents/worker/src/commands/linkedin.ts` — 1a
- `birkenborg-dev/site/public/og-default.png` — 1b (ny)
- `birkenborg-dev/worker/index.ts` — 1c
- `birkenborg-agents/worker/src/commands/stop.ts` — 1d (verificér)
- `birkenborg-agents/.github/workflows/weekday_publish.yml` — 1e
- `birkenborg-agents/scripts/preview_linkedin.py` — 1f
- `birkenborg-agents/scripts/coauthor_digest.py` — 1g
- `birkenborg-dev/site/src/styles/fonts.css` — 1h

---

## 2. Dead Code Cleanup

### 2a. Slet ubrugte komponenter (birkenborg-dev)

Slet:
- `site/src/components/LiveActivity.astro` — 289 linjer, superseded af ActivityFeed.astro, aldrig importeret
- `site/src/components/Hero.astro` — 89 linjer, superseded af HeroSkrift + OmMig, aldrig importeret
- `site/src/components/StatusPanel.astro` — 45 linjer, aldrig importeret

### 2b. Slet `formatFactsForPrompt` (birkenborg-agents)

`worker/src/news/article.ts` eksporterer `formatFactsForPrompt` som aldrig importeres. Pipeline bygger `<verified_facts>` inline i handler.ts. Fjern funktionen.

### 2c. Slet `out/drafts/` (birkenborg-agents)

5 stale markdown-filer fra den gamle pipeline. Ingen kode skriver til denne mappe længere. Slet hele `out/` directory.

### 2d. Fjern ubrugte Python deps (birkenborg-agents)

I `requirements.txt`, fjern:
- `pydantic>=2.0` — ingen Python-script importerer pydantic
- `pyyaml>=6.0` — ingen Python-script importerer yaml

### 2e. Fjern `marked` fra root package.json (birkenborg-dev)

`marked` i root `package.json` dependencies bruges ikke af scripts. Det bruges kun i `site/` og `worker/` som har egne package.json. Fjern fra root.

### 2f. Arkivér afsluttede plan-filer

**birkenborg-dev:** Flyt 8 shipped plans til `docs/superpowers/plans/done/`:
- `2026-05-05-m1-site-mvp.md`
- `2026-05-07-chat-rag-fase-2.md`
- `2026-05-07-news-pipeline-m1.md`
- `2026-05-08-news-pipeline-m2.md`
- `2026-05-08-uafhaengighed-fase-1.md`
- `2026-05-10-plan-b1-note-command.md`, `plan-b2-highlight-family.md`, `plan-b3-auto-marginalia.md`
- `2026-05-10-plan-c-perf-a11y-seo.md`
- `2026-05-10-site-restruktur-plan-a.md`
- `2026-05-14-sprint-1-seo-baseline.md`
- `2026-05-24-linkedin-block-strip.md`
- `2026-05-25-visual-upgrade.md`

**birkenborg-agents:** Flyt 2 shipped plans til `docs/superpowers/plans/done/`:
- `2026-05-06-bot-webhook-redesign.md`
- `2026-05-11-telegram-only-pipeline.md`

### 2g. Brug `--font-handwritten` token i Marginalia

**Projekt:** birkenborg-dev
**Fil:** `site/src/components/Marginalia.astro`

Erstat hardcoded `font-family: 'Caveat', 'Patrick Hand', 'Segoe Script', cursive` med `font-family: var(--font-handwritten)`.

### Filer der ændres

- `birkenborg-dev/site/src/components/LiveActivity.astro` — slet
- `birkenborg-dev/site/src/components/Hero.astro` — slet
- `birkenborg-dev/site/src/components/StatusPanel.astro` — slet
- `birkenborg-agents/worker/src/news/article.ts` — 2b
- `birkenborg-agents/out/` — slet directory
- `birkenborg-agents/requirements.txt` — 2d
- `birkenborg-dev/package.json` — 2e
- `birkenborg-dev/docs/superpowers/plans/` — 2f (git mv)
- `birkenborg-agents/docs/superpowers/plans/` — 2f (git mv)
- `birkenborg-dev/site/src/components/Marginalia.astro` — 2g

---

## 3. Performance — birkenborg-dev

### 3a. Font preload for Fraunces

**Fil:** `site/src/layouts/Base.astro`

Fraunces er LCP-fonten (hero h1, header wordmark). Uden preload opdager browseren den først efter CSS er parsed. Tilføj i `<head>`:

```html
<link rel="preload" as="font" type="font/woff2"
  href="/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2" crossorigin>
```

Verificér den præcise sti i `node_modules/@fontsource-variable/fraunces/` — Astro bundler kopierer den til dist automatisk via CSS @import.

### 3b. Lazy-load Caveat

**Filer:** `site/src/styles/fonts.css`, `site/src/components/Marginalia.astro`

Flyt `@import '@fontsource-variable/caveat'` fra `fonts.css` (loaded globalt) til `Marginalia.astro`'s scoped `<style>`. Caveat (76 KB) bruges kun i marginalia-sidebar.

### 3c. ActivityFeed CLS fix

**Fil:** `site/src/components/ActivityFeed.astro`

Tilføj `min-height: 220px` på `.feed` for at forhindre layout shift når skeleton erstattes af real content.

### 3d. Activity data client-cache

**Fil:** `site/src/components/ActivityFeed.astro`

Cache activity-response i `sessionStorage` med 5-min TTL. Ved View Transition navigation genbruges cached data i stedet for at re-fetche:

```typescript
const CACHE_KEY = 'activity_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cached = sessionStorage.getItem(CACHE_KEY);
if (cached) {
  const { data, ts } = JSON.parse(cached);
  if (Date.now() - ts < CACHE_TTL_MS) {
    renderFromData(data);
    return;
  }
}
// ... fetch as before, then:
sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
```

### 3e. Fjern redundant commits-kald i worker

**Fil:** `birkenborg-dev/worker/index.ts`

Worker kalder GitHub API for commits med `per_page=1` OG `per_page=15`. Den første er redundant — `per_page=15` response indeholder allerede den seneste commit. Fjern `per_page=1` kaldet.

### 3f. Timeout på bot-worker fetches

**Fil:** `birkenborg-dev/worker/index.ts`

`fetchDrafts` og `buildEvents` kalder `bot.birkenborg.dev` uden timeout. Tilføj `AbortController` med 2000ms timeout:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 2000);
const res = await fetch(url, { signal: controller.signal, headers });
clearTimeout(timeoutId);
```

### 3g. Prefix ActivityFeed globale CSS

**Fil:** `site/src/components/ActivityFeed.astro`

`is:global` styles bruger generiske class-navne (`.feed`, `.row`, `.label`, `.head`, `.footer`) der kan kollidere med andre komponenter. Prefix med `af-`:

`.feed` → `.af-feed`, `.head` → `.af-head`, `.row` → `.af-row`, `.label` → `.af-label`, `.footer` → `.af-footer`, `.stats` → `.af-stats`, `.stat` → `.af-stat`, osv.

Opdater HTML-template til at matche.

### Filer der ændres

- `birkenborg-dev/site/src/layouts/Base.astro` — 3a
- `birkenborg-dev/site/src/styles/fonts.css` — 3b
- `birkenborg-dev/site/src/components/Marginalia.astro` — 3b
- `birkenborg-dev/site/src/components/ActivityFeed.astro` — 3c, 3d, 3g
- `birkenborg-dev/worker/index.ts` — 3e, 3f

---

## 4. Cost Optimization — birkenborg-agents

### 4a. Fjern voiceSamples fra clarification + outline

**Fil:** `worker/src/news/handler.ts`

Voice samples er kun relevante for draft-generation (prose i Philips stemme). Clarification stiller ét spørgsmål, outline producerer JSON-struktur. Send `voiceSamples: undefined` til `callClaude` for disse to steps. Spar ~1000-2000 tokens per kald.

### 4b. Brug Haiku til article facts extraction

**Fil:** `worker/src/news/handler.ts`

`extractArticleFacts` bruger aktuelt `model` (Sonnet) fra env. Facts-extraction er struktureret data-udtræk der ikke kræver Sonnets reasoning. Ændr til `lightModel` (Haiku). Sparer ~5x per extraction.

### 4c. Tilføj scorer cost tracking

**Fil:** `worker/src/discovery/scorer.ts`

Scorer-kald trackedes aldrig i budget. Tilføj `recordSpend` efter hvert succesfuldt scorer-kald. Kræver at scorer enten bruger `callClaude` (og får `costUsd` retur) eller manuelt beregner cost fra response `usage`.

Simpleste approach: brug `callClaude` i scorer (som vi gjorde med `extractArticleFacts` i den forrige spec). `callClaude` med valgfri `voiceSamples` understøtter dette allerede.

### Filer der ændres

- `birkenborg-agents/worker/src/news/handler.ts` — 4a, 4b
- `birkenborg-agents/worker/src/discovery/scorer.ts` — 4c

---

## 5. Features

### 5a. Telegram inline-knapper i digest

**Projekt:** birkenborg-agents
**Filer:** `worker/src/telegram.ts`, `worker/src/discovery/digest.ts`, `worker/src/index.ts`

Erstat `/seed 1, /seed 2, /seed 3` tekst-instruktioner med Telegram `inline_keyboard` buttons. Klik sender en `callback_query` med `data: "seed:1"` i stedet for at Philip skal skrive en kommando.

**Ændringer:**
- `telegram.ts`: tilføj `sendDMWithKeyboard(token, chatId, text, keyboard)` funktion der bruger `reply_markup: { inline_keyboard: [...] }`
- `digest.ts`: `formatDigestDM` returnerer nu `{ text: string, keyboard: InlineKeyboardButton[][] }` i stedet for bare en string
- `index.ts`: tilføj `callback_query` parsing i `parseUpdate()`. Route `seed:N` callbacks til `handleSeed()`. Send `answerCallbackQuery` for at fjerne loading-spinner.
- `telegram.ts`: tilføj `answerCallbackQuery(token, callbackQueryId)` funktion
- `telegram.ts`: tilføj `editMessageText(token, chatId, messageId, text)` for at markere hvilken story der blev seeded (fjerner knapperne)

**UX-flow:**
1. Philip modtager digest-DM med 3 inline-knapper: `[📰 1] [📰 2] [📰 3] [❌ Skip]`
2. Philip tapper på en knap
3. Bot svarer med callback → redigerer den originale DM til "✅ Seeding story 1..." → starter pipeline
4. Skip-knap kalder `handleSkip` og redigerer DM til "Skippet."

### 5b. `linkedin_url` backfill efter publish

**Projekt:** birkenborg-agents
**Filer:** `scripts/publish_post.py`, `.github/workflows/weekday_publish.yml`

Efter LinkedIn API returnerer en succesfuld publish med post-URL:
1. Hent slug fra den pending KV-entry (allerede tilgængelig i `publish_post.py`)
2. Kald GitHub API for at læse `content/posts/*{slug}.md` — find filen med matching slug
3. Parse frontmatter, sæt `linkedin_url: <url>`
4. Commit opdateret fil via GitHub Contents API (PUT med SHA)

Det eksisterende `publishPost` i `worker/src/news/publish.ts` er reference for GitHub API-mønsteret.

Effekt: `[...slug].astro` linje 93-97 renderer automatisk "Læs også på LinkedIn →" link.

### 5c. Full-content RSS feed

**Projekt:** birkenborg-dev
**Fil:** `site/src/pages/rss.xml.ts` (eksisterende)

`@astrojs/rss` understøtter `content` felt per item. Tilføj rendered HTML (strippet for LinkedIn-block) som `content`:

```typescript
import { getCollection, render } from 'astro:content';

const posts = await getCollection('posts', ({ data }) => data.status === 'published' && !data.privacy_flag);
// For each post, render content and strip LinkedIn block
```

Kræver at `rss.xml.ts` importerer `render` fra Astro's content API og `stripLinkedinBlock` fra `linkedin-block.mjs`.

### 5d. Tags vist i review-DM

**Projekt:** birkenborg-agents
**Filer:** `worker/src/news/handler.ts`

I `formatDraftMessage`, tilføj en linje der viser de genererede tags:

```
Tags: ai, offentlig-it, udbud
(Svar TAGS ai jura for at ændre)
```

I `handleDraftReview`, tilføj et `TAGS` prefix-check:

```typescript
if (upper.startsWith("TAGS")) {
  const newTags = trimmed.slice(4).trim().split(/[\s,]+/).filter(Boolean);
  if (newTags.length > 0) {
    seed.skrifterMeta = { ...seed.skrifterMeta!, tags: newTags };
    await setSeed(kv, seed);
    return { tgMessage: `Tags opdateret: ${newTags.join(', ')}. Svar YES for at publicere.` };
  }
}
```

### 5e. "Spørg om dette skrift" CTA på post-sider

**Projekt:** birkenborg-dev
**Filer:** `site/src/pages/skrifter/[...slug].astro`, `site/src/pages/chat.astro`

Tilføj en CTA i post-footer (efter relaterede skrifter):

```html
<aside class="ask-cta">
  <a href={`/chat?about=${currentSlug}`}>
    Spørg Philip-bot om <em>dette skrift</em> →
  </a>
</aside>
```

I `chat.astro`, læs query param og pre-fill en suggested question:

```typescript
const params = new URLSearchParams(window.location.search);
const aboutSlug = params.get('about');
if (aboutSlug && citations[aboutSlug]) {
  input.value = `Hvad mener du om "${citations[aboutSlug]}"?`;
  input.focus();
}
```

### Filer der ændres

- `birkenborg-agents/worker/src/telegram.ts` — 5a
- `birkenborg-agents/worker/src/discovery/digest.ts` — 5a
- `birkenborg-agents/worker/src/index.ts` — 5a
- `birkenborg-agents/scripts/publish_post.py` — 5b
- `birkenborg-dev/site/src/pages/rss.xml.ts` — 5c
- `birkenborg-agents/worker/src/news/handler.ts` — 5d
- `birkenborg-dev/site/src/pages/skrifter/[...slug].astro` — 5e
- `birkenborg-dev/site/src/pages/chat.astro` — 5e

---

## Tværgående hensyn

### Dependencies

Ingen nye npm/pip dependencies. Alt bruger eksisterende runtime capabilities:
- Telegram Bot API inline_keyboard (allerede tilgængelig)
- GitHub Contents API (allerede brugt i publish.ts)
- Astro content render (allerede brugt i [slug].astro)
- `@astrojs/rss` content field (allerede installeret)

### Test-strategi

- Bugfixes: tilføj test for hvert fix (linkedin camelCase, font-mono, etc.)
- Cleanup: verificér build + test suite stadig grøn efter sletning
- Performance: Lighthouse CI fanger regressioner
- Features: unit tests for nye Telegram keyboard funktioner, callback routing

### Implementeringsrækkefølge

**Fase 1 — birkenborg-agents bugfixes (1a, 1d, 1e, 1f, 1g):** Uafhængige, kan paralleliseres.
**Fase 2 — birkenborg-dev bugfixes (1b, 1c, 1h):** Uafhængige.
**Fase 3 — Dead code cleanup (2a-2g):** Uafhængig af alt andet, risikofri.
**Fase 4 — birkenborg-dev performance (3a-3g):** Uafhængig af agents.
**Fase 5 — birkenborg-agents cost (4a-4c):** Uafhængig af dev.
**Fase 6 — Features (5a-5e):** Bygger på eksisterende infra. 5a (inline buttons) er mest kompleks. 5b-5e er uafhængige af hinanden.

### Risiko-vurdering

| Ændring | Risiko |
|---------|--------|
| Bugfixes (1a-1h) | Lav — isolerede fixes |
| Dead code sletning (2a-2g) | Lav — verificeret ubrugt |
| Font preload + lazy Caveat (3a-3b) | Lav — ren tilføjelse |
| ActivityFeed CSS prefix (3g) | Medium — mange class-renames, men isoleret komponent |
| Telegram inline buttons (5a) | Medium — ny Telegram API integration, kræver test |
| `linkedin_url` backfill (5b) | Lav — eksisterende GitHub API pattern |
| Full-content RSS (5c) | Lav — `@astrojs/rss` understøtter det native |
| Tags i review DM (5d) | Lav — lille tilføjelse |
| Chat CTA + query param (5e) | Lav — client-side JS, ingen backend |
