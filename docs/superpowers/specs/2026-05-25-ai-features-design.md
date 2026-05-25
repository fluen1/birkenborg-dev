# AI Features — Design Spec

**Dato:** 2026-05-25
**Scope:** 5 AI-drevne features på tværs af birkenborg-dev og birkenborg-agents: kontekstuel chat, post-illustrationer, reading time, topic gap-analyse, og voice drift detection.

**Projekter:**
- `birkenborg-dev` @ `C:\Users\birke\Projects\birkenborg-dev`
- `birkenborg-agents` @ `C:\Users\birke\Projects\birkenborg-agents`

---

## 1. C1 — Kontekstuel chat via `?about=`

Når en bruger klikker "Spørg Philip-bot om dette skrift →" på en post-side, åbner chatten med `?about=slug`. Chat-workeren bruger slugget til at fokusere system-prompten.

### Client-side (chat.astro)

Chat-klienten sender allerede `messages[]` til `/api/chat`. Udvid request body med et valgfrit `aboutSlug` felt:

```typescript
body: JSON.stringify({ messages, aboutSlug })
```

`aboutSlug` hentes fra `URLSearchParams` (allerede implementeret i chat.astro fra den forrige spec — `params.get('about')`).

### Worker-side (chat.ts + persona.ts)

I `chat.ts`, læs `aboutSlug` fra request body. Hvis sat, find posten i corpus og tilføj en ekstra system-blok:

```
Brugeren læser lige nu: "${post.title}"
Excerpt: ${post.excerpt}
Prioritér dette skrift i dine svar. Citér det først hvis relevant.
```

Denne instruktion tilføjes som en tredje system-blok (efter persona + corpus) — UDEN `cache_control` (den er dynamisk per request).

I `persona.ts`, tilføj en hjælpefunktion:

```typescript
export function findPostBySlug(corpus: CorpusPost[], slug: string): CorpusPost | null {
  return corpus.find(p => p.slug === slug) ?? null;
}
```

### Filer der ændres

- `birkenborg-dev/site/src/pages/chat.astro` — send aboutSlug i fetch body
- `birkenborg-dev/worker/chat.ts` — læs aboutSlug, injicér ekstra system-blok
- `birkenborg-dev/worker/persona.ts` — findPostBySlug hjælpefunktion

---

## 2. B1 — AI-illustrationer til posts

Hver post får en genereret editorial illustration der vises mellem excerpt og body. Samme billede bruges som OG-image.

### Pipeline-flow

1. Philip siger `YES` i REVIEWING → `handleDraftReview` kører
2. Før `publishPost`, generér illustration:
   - API: DALL-E 3 via OpenAI API (1024×1024, quality: standard)
   - Prompt: `"Minimalist editorial illustration for a Danish blog post. Title: '${title}'. Theme: ${excerpt}. Style: warm cream and terracotta tones, clean geometric lines, no text, no faces, abstract conceptual. Aspect ratio: landscape."`
   - Resize til 1200×630 for OG-kompatibilitet
3. Upload PNG til Cloudflare R2 bucket (`birkenborg-images`) under `posts/${slug}.png`
4. Offentlig URL: `https://images.birkenborg.dev/posts/${slug}.png` (R2 custom domain)
5. Tilføj `image_url` til frontmatter i `buildFrontmatter`

### Content schema udvidelse

I `birkenborg-dev/site/src/content.config.ts`:

```typescript
image_url: z.string().url().optional(),
```

### Post-side rendering

I `[...slug].astro`, efter excerpt og før `post-body`:

```html
{post.data.image_url && (
  <img class="post-hero-image"
    src={post.data.image_url}
    alt={`Illustration: ${post.data.title}`}
    loading="eager"
    width="720"
    height="378" />
)}
```

CSS:
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

### OG-image integration

I `MetaTags.astro`, `imageUrl` prop bruges allerede. Posts med `image_url` sender det som `imageUrl` prop fra `[...slug].astro`:

```astro
imageUrl={post.data.image_url ?? `https://birkenborg.dev/og/posts/${post.id.replace(/\.md$/, '')}.png`}
```

### Ny dependency

`OPENAI_API_KEY` env var i birkenborg-agents worker. Alternativt: brug Anthropic's kommende image generation API når tilgængelig — for nu er DALL-E 3 den mest pålidelige option.

### Cost og budget

~$0.04 per billede (DALL-E 3 standard). Tracked i budget via `recordSpend`. Daglig cap gælder fortsat.

### Fallback

Hvis billedgenerering fejler (API error, timeout, budget overskredet): publicér posten uden billede. `image_url` sættes ikke i frontmatter. Eksisterende text-OG bruges. Log warning. Non-fatal.

### Infrastruktur krav

- R2 bucket `birkenborg-images` oprettet i Cloudflare dashboard
- `R2_IMAGES` binding tilføjet i agents `wrangler.toml`
- Custom domain `images.birkenborg.dev` konfigureret til R2 bucket
- `OPENAI_API_KEY` tilføjet som Worker secret

### Filer der ændres

- `birkenborg-agents/worker/src/news/handler.ts` — generér billede før publish
- `birkenborg-agents/worker/src/news/publish.ts` — tilføj `image_url` til `buildFrontmatter`
- `birkenborg-agents/worker/wrangler.toml` — R2 binding
- `birkenborg-dev/site/src/content.config.ts` — nyt felt
- `birkenborg-dev/site/src/pages/skrifter/[...slug].astro` — render billede + send til MetaTags
- `birkenborg-dev/site/src/components/MetaTags.astro` — ingen ændring (bruger allerede imageUrl prop)

---

## 3. S4 — Reading time beregning

Erstat hardcoded "5 min" i WritingItem med faktisk læsetid beregnet fra ordtælling.

### Implementering

I `WritingItem.astro`, fjern `readTime` prop (default "5 min"). Tilføj `body` prop i stedet:

```typescript
interface Props {
  href: string;
  title: string;
  date: Date | string;
  body?: string;
  headingLevel?: 'h2' | 'h3';
}
const { href, title, date, body = '', headingLevel = 'h3' } = Astro.props;
const words = body.replace(/[*#`>\[\]_]/g, '').trim().split(/\s+/).filter(Boolean).length;
const minutes = Math.max(1, Math.round(words / 200));
const readTime = `${minutes} min`;
```

Callsites (`index.astro`, `skrifter/index.astro`) sender `body={p.body ?? ''}`.

### Filer der ændres

- `birkenborg-dev/site/src/components/WritingItem.astro` — ny beregning
- `birkenborg-dev/site/src/pages/index.astro` — send body prop
- `birkenborg-dev/site/src/pages/skrifter/index.astro` — send body prop

---

## 4. P1 — Topic gap-analyse i digest

Når daglig digest genereres, sammenlign nye historiers emner mod eksisterende corpus-tags. Flag historier der dækker emner Philip ikke har skrevet om.

### Dataflow

```
runDailyDigest()
  → fetchAllSources() → scoreAndRankItems() → top items
  → fetchCorpusTags() ← birkenborg.dev/api/_corpus.json (med tags)
  → annotateGaps(top, corpusTags)
  → formatDigestDM(annotatedTop)
```

### `_corpus.json` udvidelse

I `build-corpus.mjs`, tilføj `tags` til API corpus output:

```javascript
const apiCorpus = corpus.map(p => ({
  slug: p.slug,
  title: p.title,
  publish_at: p.publish_at,
  tags: p.tags ?? [],
}));
```

### `digest.ts` — fetchCorpusTags + annotateGaps

```typescript
async function fetchCorpusTags(): Promise<Set<string>> {
  try {
    const r = await fetch('https://birkenborg.dev/api/_corpus.json');
    if (!r.ok) return new Set();
    const corpus = await r.json() as Array<{ tags?: string[] }>;
    const tags = new Set<string>();
    for (const p of corpus) {
      for (const t of p.tags ?? []) tags.add(t.toLowerCase());
    }
    return tags;
  } catch { return new Set(); }
}

function isTopicGap(item: ScoredDiscoveryItem, corpusTags: Set<string>): boolean {
  const words = `${item.title} ${item.angle}`.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  return !words.some(w => corpusTags.has(w));
}
```

### DM annotation

I `formatDigestDM`, efter hver story-linje, tilføj `🆕 Ny vinkel` marker hvis gap:

```typescript
if (item.isGap) {
  lines.push(`   🆕 Ny vinkel — du har ingen posts om dette emne`);
}
```

`ScoredDiscoveryItem` udvides med valgfrit `isGap?: boolean` felt, sat i `runDailyDigest` efter gap-analyse.

### Fallback

Hvis corpus-fetch fejler, skip gap-annotation. Digest sendes uden markers. Non-fatal.

### Filer der ændres

- `birkenborg-dev/scripts/build-corpus.mjs` — tilføj tags til _corpus.json
- `birkenborg-agents/worker/src/discovery/digest.ts` — fetchCorpusTags, isTopicGap, annotation
- `birkenborg-agents/worker/src/discovery/types.ts` — isGap felt på ScoredDiscoveryItem

---

## 5. P5 — Voice drift detection

Ugentlig automatisk check der sammenligner de seneste posts mod PERSONA_BASE's craft_moves og anti_tics. Rapporterer drift i en Telegram-DM søndag aften.

### Cron trigger

Tilføj `0 18 * * 0` (søndag 18:00 UTC = 20:00 CEST) til `wrangler.toml` cron triggers.

### Ny fil: `worker/src/discovery/voice-drift.ts`

```typescript
export async function runVoiceDriftCheck(env: NewsEnv): Promise<string> {
  const samples = await loadVoiceSamples();
  if (samples.length === 0) return "⚠️ Voice drift check: ingen samples tilgængelige.";

  const voiceText = formatVoiceSamples(samples);

  const result = await callClaude({
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.NEWS_LIGHT_MODEL ?? "claude-haiku-4-5-20251001",
    systemBase: DRIFT_CHECK_SYSTEM,
    userMessage: voiceText,
    maxTokens: 500,
  });
  await recordSpend(env.BOT_STATE, result.costUsd);

  // Parse JSON response, format as Telegram DM
  return formatDriftReport(result.text);
}
```

### Analyse-prompt (DRIFT_CHECK_SYSTEM)

```
Du er en kvalitetskontrol for Philip Birkenborgs skrivestil.

CRAFT-MOVES (mindst 2 per post, heraf mindst 1 PERSONLIG DOM eller VOICE-SLUTNING):
1. REFRAME — alternativ kategori for det oplagte begreb
2. SENSORISK FORANKRING — specifikke genstande placeret i rum
3. RYTMISK TRIPLET — tre korte sekventielle elementer
4. KLICHÉ-DEFUSE — navngiv den oplagte fortælling, afvis den
5. VOICE-SLUTNING — sidste sætning med en lille skæv kant
6. PERSONLIG DOM — en lille konkret præference eller reaktion

ANTI-TICS:
1. "Det er X, ikke Y" — max 1 per post
2. "Det er X"-sætningsåbnere — 3 i træk er en rytmefejl
3. THESIS-SLUTNING — opsummerende/generaliserende sidste sætning er forbudt
4. ESSAY-DRIFT — efter REFRAME, forklar den ikke abstrakt
5. ANTI-META-NARRATIV — navngiv aldrig et craft-move i prosaen

Analysér de givne posts. Returner JSON:
{
  "posts": [{ "slug": "...", "moves_found": [...], "moves_missing": [...], "tics_found": [...] }],
  "drift_level": "none" | "minor" | "significant",
  "summary": "<1 sætning på dansk>"
}
```

### Handler i `index.ts` scheduled

```typescript
if (trigger.cron === "0 18 * * 0") {
  const { runVoiceDriftCheck } = await import("./discovery/voice-drift");
  const report = await runVoiceDriftCheck(env);
  await sendDM(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, report);
}
```

### DM-format

```
📊 Ugentlig stemme-check

nybolig-fjerner-koglen: ✓ REFRAME, PERSONLIG DOM, VOICE-SLUTNING
digital-suveraenittet: ✓ KLICHÉ-DEFUSE, PERSONLIG DOM — mangler SENSORISK FORANKRING
ma-agent-paragraf-30: ⚠️ "Det er X"-tic (3× i træk)

Drift: minor — SENSORISK FORANKRING fraværende i 2/3 posts.
```

### Cost

~$0.002 per ugentlig kørsel (Haiku, ~2000 input tokens, ~300 output). Tracked via `recordSpend`.

### Fallback

Hvis voice-samples fetch fejler eller Claude fejler: send kort fejl-DM. Non-fatal.

### Filer der ændres

- `birkenborg-agents/worker/src/discovery/voice-drift.ts` — ny fil
- `birkenborg-agents/worker/src/index.ts` — cron handler
- `birkenborg-agents/worker/wrangler.toml` — ny cron trigger

---

## Tværgående hensyn

### Dependencies

- **Ny:** `OPENAI_API_KEY` som Worker secret (kun for B1 billedgenerering)
- **Ny:** R2 bucket `birkenborg-images` + custom domain (kun for B1)
- **Eksisterende:** Alt andet bruger eksisterende Anthropic API, Telegram API, GitHub API

### Implementeringsrækkefølge

1. **S4 — Reading time** (trivielt, ingen risiko, rent build-time)
2. **C1 — Kontekstuel chat** (lille, 3 filer, umiddelbar værdi)
3. **P1 — Topic gap-analyse** (lille, kræver _corpus.json udvidelse først i dev, derefter agents)
4. **P5 — Voice drift detection** (selvstændig, ny fil + cron)
5. **B1 — AI-illustrationer** (mest kompleks, kræver R2 setup, ny API-key, schema-ændring)

### Risiko-vurdering

| Feature | Risiko | Note |
|---------|--------|------|
| S4 Reading time | Lav | Rent build-time beregning |
| C1 Kontekstuel chat | Lav | Ekstra system-blok, non-cached |
| P1 Topic gap | Lav | Fetch kan fejle — fallback til ingen annotation |
| P5 Voice drift | Lav | Ny cron, Haiku kald, non-fatal |
| B1 Illustrationer | Medium | Ny ekstern API (OpenAI), R2 infra, schema-ændring |
