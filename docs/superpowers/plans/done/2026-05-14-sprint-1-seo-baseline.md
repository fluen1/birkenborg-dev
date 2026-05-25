# Sprint 1: SEO Baseline — pipeline-regression + site meta-coverage

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop pipeline-regression der producerer SEO-svage posts (manglende `excerpt` + `tags`), og tilføj `MetaTags`-coverage til de 8 site-pages der mangler det, plus `robots.txt`. Efter sprint 1 har alle pages distinkte meta descriptions + OG-tags og fremtidige Telegram-posts kommer med ordentlig SEO-frontmatter.

**Architecture:**
- **Del A (birkenborg-agents):** `draftPrompt()` JSON-output udvides med `excerpt` (140-160 tegn, distinkt fra titel) + `tags` (3-5 emner). `Seed` får `skrifterMeta`-felt. `handler.ts` parser det. `publish.ts` skriver det til frontmatter sammen med titel.
- **Del B (birkenborg-dev):** Manuel patch af Nybolig-posten. `<MetaTags>` tilføjes på alle 8 pages der mangler det. `robots.txt` oprettes i `public/`.
- **Del C (validation):** Deploy + curl-verify + re-run Lighthouse.

**Tech Stack:** TypeScript + Cloudflare Workers + Vitest (agents). Astro + vanilla CSS (dev). Cloudflare Pages auto-deploy ved push til main.

**Repos:**
- `birkenborg-agents` (pipeline): `C:\Users\birke\Projects\birkenborg-agents\`
- `birkenborg-dev` (site): `C:\Users\birke\Projects\birkenborg-dev\`

---

## File Structure

**`birkenborg-agents`:**
- Modify: `worker/src/news/prompts.ts:336-470` — `draftPrompt()` JSON-skema får `excerpt` + `tags`
- Modify: `worker/src/news/state.ts:34-51` — `Seed` får `skrifterMeta?: { excerpt: string; tags: string[] }`
- Modify: `worker/src/news/handler.ts:325-340` — parse skrifterMeta fra draft-output, gem i seed
- Modify: `worker/src/news/publish.ts:15-41` — `buildFrontmatter` får `excerpt`-param og skriver det til frontmatter
- Modify: `worker/tests/news/draftPrompt.test.ts` — test JSON-skemaet inkluderer excerpt + tags
- Modify: `worker/tests/news/publish.test.ts` — test buildFrontmatter med excerpt
- Modify: `worker/scripts/simulate_draft.mts` — print excerpt + tags fra parsed output

**`birkenborg-dev`:**
- Modify: `content/posts/2026-05-12-nybolig-fjerner-koglen-fra-salgsfotos.md` — tilføj `excerpt:` + populér `tags:`
- Modify: `site/src/pages/skrifter/index.astro` — tilføj `<MetaTags>` via head-slot
- Modify: `site/src/pages/projekter/index.astro` — tilføj `<MetaTags>`
- Modify: `site/src/pages/projekter/[...slug].astro` — tilføj `<MetaTags>` + `<StructuredData type="Article">`
- Modify: `site/src/pages/cv.astro` — tilføj `<MetaTags>`
- Modify: `site/src/pages/now.astro` — tilføj `<MetaTags>`
- Modify: `site/src/pages/kontakt.astro` — tilføj `<MetaTags>`
- Modify: `site/src/pages/chat.astro` — tilføj `<MetaTags>`
- Modify: `site/src/pages/klinikker.astro` — tilføj `<MetaTags>`
- Modify: `site/src/pages/konsulenter.astro` — tilføj `<MetaTags>`
- Create: `site/public/robots.txt`

**Content schema-validering:** Posts-collection schema i `site/src/content/config.ts` skal acceptere `excerpt` som optional string. Tjek + udvid hvis nødvendigt under Task 7.

---

## Task 1: Udvid `draftPrompt()` JSON-output med `excerpt` + `tags`

**Files:**
- Modify: `worker/src/news/prompts.ts`
- Test: `worker/tests/news/draftPrompt.test.ts`

- [ ] **Step 1: Skriv failing test**

Tilføj i `worker/tests/news/draftPrompt.test.ts`:

```typescript
it("kraver excerpt (140-160 tegn) + tags (3-5) som strukturerede JSON-felter", () => {
  const prompt = draftPrompt({
    seedText: "test",
    articleSummary: "",
    clarificationA: "klar",
    outlineText: "1. Tese: X",
    voiceSamples: "voice",
  });
  expect(prompt).toContain('"excerpt"');
  expect(prompt).toContain('"tags"');
  expect(prompt).toMatch(/140[\s\S]*160 tegn/);
  expect(prompt).toMatch(/3-5 (?:emner|tags)/);
});
```

- [ ] **Step 2: Verificér failing**

```powershell
cd worker
npx vitest run tests/news/draftPrompt.test.ts
```

Forventet: 1 test fejler ("`prompt` does not contain `\"excerpt\"`").

- [ ] **Step 3: Udvid OUTPUT-FORMAT-blokken og KRAV-listen i `draftPrompt()`**

I `worker/src/news/prompts.ts` find `OUTPUT-FORMAT:`-blokken (omkring linje 463) og erstat den med:

```typescript
OUTPUT-FORMAT:
{
  "skrifterPost": "# Titel\\n\\nProse her...",
  "linkedInVersion": "Plain tekst LinkedIn-version her...",
  "excerpt": "140-160 tegn, distinkt fra titel, beskriver hvad posten konkret handler om uden at gentage titlen ordret. Skal kunne stå alene som SERP-snippet og LinkedIn-preview.",
  "tags": ["3-5 emner", "som kategoriserer", "posten"]
}

Returner KUN JSON som ren tekst — ingen markdown-fences (\`\`\`json osv.),
ingen prose-introduktion. Start svaret direkte med {.`;
```

Find også `KRAV til /skrifter-versionen (skrifterPost):` og tilføj nye to KRAV-blokke før det:

```typescript
KRAV til excerpt (excerpt):
- 140-160 tegn, helst tæt på 150
- Distinkt fra titlen — gentag ikke titlen ordret
- Beskriver hvad posten konkret handler om
- Skal kunne stå alene som SERP-snippet og LinkedIn/X-preview-tekst
- Ingen consultant-fraser, ingen "Læs mere her", ingen "I dette indlæg..."

KRAV til tags (tags):
- 3-5 lowercase emner, en-ords-form når muligt
- Kategoriserer posten på tema-niveau, ikke beskrivelse
- ✅ ["ai", "jura", "kontrakter", "automation"]
- ❌ ["ai-revolutionerer-jura-branchen"] (for langt, for tematisk)
- ❌ ["meget-interessant-emne"] (ikke en kategori)

```

- [ ] **Step 4: Verificér tests passerer**

```powershell
npx vitest run tests/news/draftPrompt.test.ts
```

Forventet: alle tests grønne.

- [ ] **Step 5: Commit**

```powershell
git add worker/src/news/prompts.ts worker/tests/news/draftPrompt.test.ts
git commit -m "feat(news): udvid draftPrompt JSON med excerpt + tags-felter"
```

---

## Task 2: Opdatér `Seed`-interface med `skrifterMeta`

**Files:**
- Modify: `worker/src/news/state.ts`

- [ ] **Step 1: Tilføj felt i Seed-interface**

I `worker/src/news/state.ts` find `interface Seed` (linje 34) og tilføj efter `linkedInDraft?: string;`:

```typescript
  skrifterMeta?: {
    excerpt: string;
    tags: string[];
  };
```

Det færdige Seed-interface ser sådan ud:

```typescript
export interface Seed {
  id: string;
  chatId: number;
  state: SeedState;
  seedText: string;
  articleUrl?: string;
  articleSummary?: string;
  articleFacts?: ArticleFactsBlob;
  clarificationQ?: string;
  clarificationA?: string;
  outline?: Outline;
  skrifterDraft?: string;
  linkedInDraft?: string;
  skrifterMeta?: {
    excerpt: string;
    tags: string[];
  };
  toneScore?: number;
  retries: number;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 2: Verificér type-check**

```powershell
npx tsc --noEmit 2>&1 | Select-String -Pattern "state.ts"
```

Forventet: ingen output (eller kun pre-eksisterende `cloudflare:test`-fejl). Type-fejl i `handler.ts` om manglende `skrifterMeta`-håndtering er forventet — fixes i Task 3.

- [ ] **Step 3: Commit**

```powershell
git add worker/src/news/state.ts
git commit -m "feat(state): Seed.skrifterMeta med excerpt + tags"
```

---

## Task 3: Parse `skrifterMeta` i `handler.ts`

**Files:**
- Modify: `worker/src/news/handler.ts`
- Test: `worker/tests/news/handler.test.ts` (hvis testen kan køres uden cloudflare:test) — ELLER tilføj direkte i `draftPrompt.test.ts` som JSON-parse-test

- [ ] **Step 1: Skriv failing test**

Tilføj i `worker/tests/news/draftPrompt.test.ts` (handler-testen kræver cloudflare:test-runtime, så vi tester JSON-parse-shape direkte):

```typescript
import { describe, it, expect } from "vitest";

it("draft-JSON kan parses til skrifterPost + linkedInVersion + excerpt + tags", () => {
  const mockOutput = JSON.stringify({
    skrifterPost: "# Titel\n\nProse",
    linkedInVersion: "LI-version",
    excerpt: "En 150-tegns beskrivelse af hvad posten handler om uden at gentage titlen ordret, perfekt til SERP og social preview.",
    tags: ["ai", "jura", "kontrakter"],
  });
  const parsed = JSON.parse(mockOutput) as {
    skrifterPost: string;
    linkedInVersion: string;
    excerpt: string;
    tags: string[];
  };
  expect(parsed.excerpt.length).toBeGreaterThanOrEqual(140);
  expect(parsed.excerpt.length).toBeLessThanOrEqual(160);
  expect(parsed.tags.length).toBeGreaterThanOrEqual(3);
  expect(parsed.tags.length).toBeLessThanOrEqual(5);
});
```

- [ ] **Step 2: Verificér passing (struktur-test, ikke pipeline-integration)**

```powershell
npx vitest run tests/news/draftPrompt.test.ts
```

Forventet: alle tests grønne — denne her er en pure JSON-parse-shape-test der validerer kontrakten.

- [ ] **Step 3: Modificér `handler.ts` til at parse + gemme skrifterMeta**

I `worker/src/news/handler.ts` find blokken hvor `JSON.parse(stripCodeFences(draftResult.text))` kaldes (omkring linje 325-335) og udvid type-annotationen + assignment:

Find:
```typescript
  try {
    const parsed = JSON.parse(stripCodeFences(draftResult.text)) as {
      skrifterPost: string;
      linkedInVersion: string;
    };
    skrifterDraft = parsed.skrifterPost;
    linkedInDraft = parsed.linkedInVersion;
  } catch {
```

Erstat med:
```typescript
  let skrifterMeta: { excerpt: string; tags: string[] } | undefined;
  try {
    const parsed = JSON.parse(stripCodeFences(draftResult.text)) as {
      skrifterPost: string;
      linkedInVersion: string;
      excerpt?: string;
      tags?: string[];
    };
    skrifterDraft = parsed.skrifterPost;
    linkedInDraft = parsed.linkedInVersion;
    if (parsed.excerpt && parsed.tags) {
      skrifterMeta = { excerpt: parsed.excerpt, tags: parsed.tags };
    }
  } catch {
```

Find så hvor `seed.skrifterDraft = skrifterDraft;` sættes (efter try-catch-blokken) og tilføj umiddelbart efter:

```typescript
  if (skrifterMeta) {
    seed.skrifterMeta = skrifterMeta;
  }
```

- [ ] **Step 4: Type-check**

```powershell
npx tsc --noEmit 2>&1 | Select-String -Pattern "handler.ts" | Select-Object -First 5
```

Forventet: ingen handler.ts-fejl (kun pre-eksisterende cloudflare:test-fejl).

- [ ] **Step 5: Commit**

```powershell
git add worker/src/news/handler.ts worker/tests/news/draftPrompt.test.ts
git commit -m "feat(handler): parse + gem skrifterMeta fra draft-output"
```

---

## Task 4: `publish.ts` skriver `excerpt` + `tags` til frontmatter

**Files:**
- Modify: `worker/src/news/publish.ts`
- Test: `worker/tests/news/publish.test.ts`

- [ ] **Step 1: Skriv failing test**

Tilføj i `worker/tests/news/publish.test.ts` (læs filen først for at se importer + existing tests; tilføj efter eksisterende buildFrontmatter-tests):

```typescript
it("buildFrontmatter inkluderer excerpt-feltet hvis givet", () => {
  const fm = buildFrontmatter({
    title: "Test",
    slug: "test",
    tags: ["ai"],
    publishAt: "2026-05-14T09:00:00+02:00",
    excerpt: "En kort beskrivelse på 150 tegn der kan stå alene som SERP-snippet for testposten uden at gentage titlen ordret tilbage.",
  });
  expect(fm).toContain('excerpt: "En kort beskrivelse');
  expect(fm).toContain('tags: ["ai"]');
});

it("buildFrontmatter udelader excerpt-linjen hvis ikke givet (backwards compat)", () => {
  const fm = buildFrontmatter({
    title: "Test",
    slug: "test",
    tags: [],
    publishAt: "2026-05-14T09:00:00+02:00",
  });
  expect(fm).not.toContain('excerpt:');
});

it("buildFrontmatter escaper quotes i excerpt", () => {
  const fm = buildFrontmatter({
    title: "Test",
    slug: "test",
    tags: [],
    publishAt: "2026-05-14T09:00:00+02:00",
    excerpt: 'Han sagde "hej" og gik.',
  });
  expect(fm).toContain('excerpt: "Han sagde \\"hej\\" og gik."');
});
```

- [ ] **Step 2: Verificér failing**

```powershell
npx vitest run tests/news/publish.test.ts
```

Forventet: 3 tests fejler ("buildFrontmatter does not return string containing 'excerpt:'").

- [ ] **Step 3: Udvid `FrontmatterInput` + `buildFrontmatter` i `publish.ts`**

Erstat `FrontmatterInput`-interfacet og `buildFrontmatter`-funktionen (linje 15-41) med:

```typescript
interface FrontmatterInput {
  title: string;
  slug: string;
  tags: string[];
  publishAt: string;
  excerpt?: string;
}

export function buildFrontmatter(input: FrontmatterInput): string {
  const escapedTitle = input.title
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
  const tagsList = input.tags.length === 0
    ? "[]"
    : `[${input.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`;
  const excerptLine = input.excerpt
    ? `excerpt: "${input.excerpt.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "").replace(/\n/g, " ")}"\n`
    : "";
  return `---
title: "${escapedTitle}"
slug: ${input.slug}
publish_at: ${input.publishAt}
status: published
tags: ${tagsList}
${excerptLine}privacy_flag: false
linkedin_url: null
---
`;
}
```

Noter: excerpt-linjen indsættes EFTER `tags:` og FØR `privacy_flag:`. Ingen ekstra newline efter `tags:` når excerpt mangler — `excerptLine` er tom-streng i det tilfælde.

- [ ] **Step 4: Find + opdatér `PublishInput` + `publishPost`-call-site**

I samme fil, find `PublishInput`-interfacet (linje 47) og tilføj `excerpt?: string;`:

```typescript
interface PublishInput {
  githubToken: string;
  title: string;
  slug: string;
  tags: string[];
  body: string;
  linkedInVersion: string;
  publishAt: string;
  excerpt?: string;
}
```

I `publishPost`-funktionen, find `buildFrontmatter`-kaldet (linje 62-67) og udvid:

```typescript
  const frontmatter = buildFrontmatter({
    title: input.title,
    slug: input.slug,
    tags: input.tags,
    publishAt: input.publishAt,
    excerpt: input.excerpt,
  });
```

- [ ] **Step 5: Opdatér publishPost-callsite i handler.ts (linje 493-501)**

I `worker/src/news/handler.ts` linje 493-501 ligger den eksisterende `publishPost`-call:

```typescript
      const result = await publishPost({
        githubToken: env.PUBLIC_REPO_PAT,
        title,
        slug,
        tags: [],
        body,
        linkedInVersion: linkedInDraft,
        publishAt: skrifterPublishAt,
      });
```

Erstat med:

```typescript
      const result = await publishPost({
        githubToken: env.PUBLIC_REPO_PAT,
        title,
        slug,
        tags: seed.skrifterMeta?.tags ?? [],
        body,
        linkedInVersion: linkedInDraft,
        publishAt: skrifterPublishAt,
        excerpt: seed.skrifterMeta?.excerpt,
      });
```

Ingen andre publishPost-callsites findes (tjekket via `grep -n "publishPost("`).

- [ ] **Step 6: Verificér tests passerer**

```powershell
npx vitest run tests/news/publish.test.ts
```

Forventet: alle tests grønne.

```powershell
npx tsc --noEmit 2>&1 | Select-String -Pattern "(publish.ts|handler.ts)" | Select-Object -First 5
```

Forventet: ingen nye type-fejl.

- [ ] **Step 7: Commit**

```powershell
git add worker/src/news/publish.ts worker/src/news/handler.ts worker/tests/news/publish.test.ts
git commit -m "feat(publish): excerpt + tags i frontmatter fra skrifterMeta"
```

---

## Task 5: Opdatér `simulate_draft.mts` til at vise excerpt + tags

**Files:**
- Modify: `worker/scripts/simulate_draft.mts`

- [ ] **Step 1: Udvid parsed-typen + print-output**

Find i `worker/scripts/simulate_draft.mts` (omkring linje 195-205) hvor JSON parses:

```typescript
  let parsed: { skrifterPost: string; linkedInVersion: string };
  try {
    parsed = JSON.parse(stripCodeFences(result.text)) as typeof parsed;
```

Erstat med:

```typescript
  let parsed: {
    skrifterPost: string;
    linkedInVersion: string;
    excerpt?: string;
    tags?: string[];
  };
  try {
    parsed = JSON.parse(stripCodeFences(result.text)) as typeof parsed;
```

Find så sektionen efter LinkedIn-version-print (omkring linje 222), efter `console.log(parsed.linkedInVersion);` — tilføj en META-sektion FØR TIC-ANALYSE-blokken:

```typescript
  console.log("\n" + "═".repeat(72));
  console.log("META (excerpt + tags)");
  console.log("═".repeat(72));
  console.log(`excerpt (${parsed.excerpt?.length ?? 0} tegn): ${parsed.excerpt ?? "(MANGLER)"}`);
  console.log(`tags: ${parsed.tags ? JSON.stringify(parsed.tags) : "(MANGLER)"}`);
```

- [ ] **Step 2: Kør sim + verificér output**

```powershell
npx tsx scripts/simulate_draft.mts
```

Forventet output inkluderer:

```
═══════════════════════════════════════════════════════════════════════
META (excerpt + tags)
═══════════════════════════════════════════════════════════════════════
excerpt (152 tegn): [konkret 140-160-tegn beskrivelse]
tags: ["ai", "jura", "kontrakter", ...]
```

- [ ] **Step 3: Commit**

```powershell
git add worker/scripts/simulate_draft.mts
git commit -m "feat(scripts): simulate_draft printer excerpt + tags fra parsed output"
```

---

## Task 6: Deploy worker via wrangler

- [ ] **Step 1: Run tests**

```powershell
cd worker
npx vitest run tests/news/
```

Forventet: alle tests grønne.

- [ ] **Step 2: Deploy**

```powershell
npx wrangler deploy
```

Forventet output:

```
Uploaded birkenborg-agents-bot (XX.XX sec)
Deployed birkenborg-agents-bot triggers (XX.XX sec)
  bot.birkenborg.dev (custom domain)
  Producer for news-pipeline
  Consumer for news-pipeline
Current Version ID: <new-version-id>
```

- [ ] **Step 3: Push agents-commits**

```powershell
git push origin main
```

Forventet: 4-5 commits pushes til origin/main.

---

## Task 7: Manuel patch af Nybolig-posten + tjek content schema

**Repo:** `birkenborg-dev`

**Files:**
- Modify: `content/posts/2026-05-12-nybolig-fjerner-koglen-fra-salgsfotos.md`
- Tjek: `site/src/content/config.ts`

- [ ] **Step 1: Tjek at posts-schema accepterer excerpt**

```powershell
cd C:\Users\birke\Projects\birkenborg-dev
Get-Content site/src/content/config.ts
```

Forventet: posts-schema har enten `excerpt: z.string().optional()` ELLER `.passthrough()` ELLER intet schema (alle felter tilladt). Hvis schema er strict og excerpt mangler, tilføj `excerpt: z.string().optional(),` til posts-schema og commit som separat sub-step.

- [ ] **Step 2: Læs nuværende frontmatter**

```powershell
Get-Content content/posts/2026-05-12-nybolig-fjerner-koglen-fra-salgsfotos.md -TotalCount 9
```

Forventet:
```yaml
---
title: "Nybolig fjerner Koglen fra salgsfotos"
slug: nybolig-fjerner-koglen-fra-salgsfotos
publish_at: 2026-05-12T22:35:00+02:00
status: published
tags: []
privacy_flag: false
linkedin_url: null
---
```

- [ ] **Step 3: Patch frontmatter**

Erstat de første 9 linjer med:

```yaml
---
title: "Nybolig fjerner Koglen fra salgsfotos"
slug: nybolig-fjerner-koglen-fra-salgsfotos
publish_at: 2026-05-12T22:35:00+02:00
status: published
tags: [ai, ejendomsmægler, sikkerhed, retouchering]
excerpt: "En ejendomsmægler i Aarhus retoucherer designerlamper ud af salgsbillederne fordi indbrudstyve bruger dem som indkøbsliste. Mindste mulige fix til et reelt problem."
privacy_flag: false
linkedin_url: null
---
```

Excerpt-tegnetælling: ca. 158 tegn — inden for 140-160-grænsen.

- [ ] **Step 4: Verificér build**

```powershell
cd site
npm run build 2>&1 | Select-String -Pattern "(error|warning|build complete)" | Select-Object -Last 5
```

Forventet: `build complete`, ingen errors. Hvis schema klager over `excerpt`, gå tilbage til Step 1 og udvid schema.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add content/posts/2026-05-12-nybolig-fjerner-koglen-fra-salgsfotos.md site/src/content/config.ts
git commit -m "content: tilfoj excerpt + tags til Nybolig-posten"
```

---

## Task 8: `<MetaTags>` på listing-pages (`/skrifter`, `/projekter`)

**Files:**
- Modify: `site/src/pages/skrifter/index.astro`
- Modify: `site/src/pages/projekter/index.astro`

- [ ] **Step 1: Tilføj MetaTags på `/skrifter`**

Læs `site/src/pages/skrifter/index.astro`. Find frontmatter (mellem `---`-markers) og tilføj imports + page-meta-konstanter:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import WritingItem from '../../components/WritingItem.astro';
import MetaTags from '../../components/MetaTags.astro';

const allPosts = await getCollection('posts', ({ data }) => data.status === 'published');
const sorted = allPosts.sort((a, b) => +b.data.publish_at - +a.data.publish_at);

const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/skrifter`;
const PAGE_TITLE = 'Skrifter · birkenborg.dev';
const PAGE_DESC = `Korte essays om jura, AI-systemer i drift og fejl jeg er løbet ind i. ${sorted.length} stykker.`;
---
```

Find så `<Base title="...">`-linjen og udskift med:

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
  <Header />
```

- [ ] **Step 2: Tilføj MetaTags på `/projekter`**

Læs `site/src/pages/projekter/index.astro`. Tilføj samme pattern. Page-meta:

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/projekter`;
const PAGE_TITLE = 'Projekter · birkenborg.dev';
const PAGE_DESC = 'AI-systemer og legal-tech jeg har bygget — fra alpha-eksperimenter til produktion. Konkrete cases, åbne fejl, ingen pitch.';
```

Tilføj `import MetaTags from '../../components/MetaTags.astro';` + samme `<Fragment slot="head">`-blok som ovenfor.

- [ ] **Step 3: Build verify**

```powershell
cd site
npm run build 2>&1 | Select-String -Pattern "(error|warning|complete)" | Select-Object -Last 5
```

Forventet: build complete, ingen errors.

- [ ] **Step 4: Visuel verify (curl mod local dev)**

```powershell
npm run dev
```

I anden terminal:

```powershell
Start-Sleep -Seconds 3
curl -s http://localhost:4321/skrifter | Select-String -Pattern '<meta name="description"|<meta property="og:'
```

Forventet: 2+ `<meta name="description">` + flere `<meta property="og:`-linjer.

Stop dev-server med Ctrl+C.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add site/src/pages/skrifter/index.astro site/src/pages/projekter/index.astro
git commit -m "feat(site): MetaTags pa skrifter/index + projekter/index"
```

---

## Task 9: `<MetaTags>` + Article-LD på `/projekter/[...slug]`

**Files:**
- Modify: `site/src/pages/projekter/[...slug].astro`

- [ ] **Step 1: Læs filen**

```powershell
Get-Content site/src/pages/projekter/`[...slug`].astro -TotalCount 30
```

Identificér hvor frontmatter ender og hvor `<Base>` kaldes.

- [ ] **Step 2: Tilføj imports + page-meta**

Filen bruger `project` som prop (verificeret: `const { project } = Astro.props;` på linje 15). Schema-feltet er `summary` (ikke `description`).

Tilføj efter eksisterende imports + render-call:

```astro
import MetaTags from '../../components/MetaTags.astro';
import StructuredData from '../../components/StructuredData.astro';

const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/projekter/${project.id.replace(/\.md$/, '')}`;
const PAGE_TITLE = `${project.data.title} · birkenborg.dev`;
const PAGE_DESC = project.data.summary;
```

- [ ] **Step 3: Indsæt MetaTags + StructuredData i `<Base>` head-slot**

Find `<Base title="...">` og udvid:

```astro
<Base title={PAGE_TITLE}>
  <Fragment slot="head">
    <MetaTags
      title={PAGE_TITLE}
      description={PAGE_DESC}
      url={PAGE_URL}
      type="article"
    />
    <StructuredData
      type="Article"
      data={{
        headline: project.data.title,
        author: { '@type': 'Person', name: 'Philip Birkenborg', url: SITE_URL },
        publisher: { '@type': 'Person', name: 'Philip Birkenborg' },
        description: PAGE_DESC,
        url: PAGE_URL,
      }}
    />
  </Fragment>
```

- [ ] **Step 4: Build verify**

```powershell
cd site
npm run build 2>&1 | Select-String -Pattern "(error|warning|complete)" | Select-Object -Last 5
```

Forventet: build complete.

- [ ] **Step 5: Verify dist-output for ét projekt**

```powershell
Get-Content site/dist/projekter/retsklar/index.html | Select-String -Pattern '<meta name="description"|"@type":"Article"' | Select-Object -First 5
```

Forventet: 1 meta description + 1 Article JSON-LD.

- [ ] **Step 6: Commit**

```powershell
cd ..
git add site/src/pages/projekter/`[...slug`].astro
git commit -m "feat(site): MetaTags + Article-LD pa projekt-detail-sider"
```

---

## Task 10: `<MetaTags>` på standalone-pages

**Files:**
- Modify: `site/src/pages/cv.astro`
- Modify: `site/src/pages/now.astro`
- Modify: `site/src/pages/kontakt.astro`
- Modify: `site/src/pages/chat.astro`
- Modify: `site/src/pages/klinikker.astro`
- Modify: `site/src/pages/konsulenter.astro`

Pattern er identisk for alle 6 pages: tilføj `import MetaTags`, definér `PAGE_TITLE`/`PAGE_DESC`/`PAGE_URL`-konstanter, indsæt `<Fragment slot="head"><MetaTags .../></Fragment>` i `<Base>`.

- [ ] **Step 1: CV-page**

Læs filen + tilføj imports og:

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/cv`;
const PAGE_TITLE = 'CV · Philip Birkenborg';
const PAGE_DESC = 'Cand.merc.jur. + AI-superbruger. Legal Counsel hos Tandlægen.dk, bygger AI-agenter til jurist-arbejde. Karriere, projekter, sprog og kompetencer.';
```

Indsæt `<MetaTags>`-fragment som i Task 8.

- [ ] **Step 2: Now-page**

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/now`;
const PAGE_TITLE = 'Nu · birkenborg.dev';
const PAGE_DESC = 'Hvad Philip Birkenborg arbejder på lige nu — projekter, læring og fokus. Inspireret af nownownow.com-genren.';
```

- [ ] **Step 3: Kontakt-page**

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/kontakt`;
const PAGE_TITLE = 'Kontakt · birkenborg.dev';
const PAGE_DESC = 'Skriv til Philip Birkenborg via email, LinkedIn eller GitHub. Specifikt om AI-systemer, jurist-arbejde og legal-tech-projekter.';
```

- [ ] **Step 4: Chat-page**

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/chat`;
const PAGE_TITLE = 'Chat med Philip · birkenborg.dev';
const PAGE_DESC = 'Stil spørgsmål til Philips skrifter og få streamede svar med citation-link. Drevet af Anthropic Claude over sitets korpus.';
```

- [ ] **Step 5: Klinikker-page**

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/klinikker`;
const PAGE_TITLE = 'Klinikker · birkenborg.dev';
const PAGE_DESC = 'Authority-sites + AI-værktøjer til privatpraksis-klinikker (læge, fysio, psykolog, kiropraktor). Fast prissætning, single leverandør.';
```

- [ ] **Step 6: Konsulenter-page**

```typescript
const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/konsulenter`;
const PAGE_TITLE = 'Konsulenter · birkenborg.dev';
const PAGE_DESC = 'Authority-sites + AI-værktøjer til SMV-konsulenter (strategi, forretningsudvikling, compliance). Fast prissætning, single leverandør.';
```

- [ ] **Step 7: Build verify**

```powershell
cd site
npm run build 2>&1 | Select-String -Pattern "(error|warning|complete)" | Select-Object -Last 5
```

Forventet: build complete.

- [ ] **Step 8: Commit**

```powershell
cd ..
git add site/src/pages/cv.astro site/src/pages/now.astro site/src/pages/kontakt.astro site/src/pages/chat.astro site/src/pages/klinikker.astro site/src/pages/konsulenter.astro
git commit -m "feat(site): MetaTags pa 6 standalone-pages (cv now kontakt chat klinikker konsulenter)"
```

---

## Task 11: `robots.txt`

**Files:**
- Create: `site/public/robots.txt`

- [ ] **Step 1: Create file**

```powershell
$content = @"
User-agent: *
Allow: /

Sitemap: https://birkenborg.dev/sitemap-index.xml
"@
Set-Content -Path site/public/robots.txt -Value $content -Encoding utf8
```

- [ ] **Step 2: Verify build inkluderer filen**

```powershell
cd site
npm run build 2>&1 | Select-Object -Last 3
Get-Content site/dist/robots.txt -ErrorAction SilentlyContinue
```

Forventet: filen ligger i `site/dist/robots.txt` med samme indhold.

- [ ] **Step 3: Commit**

```powershell
cd ..
git add site/public/robots.txt
git commit -m "feat(site): robots.txt med sitemap-pointer"
```

---

## Task 12: Push birkenborg-dev → auto-deploy → live verify

- [ ] **Step 1: Push alle commits**

```powershell
git push origin main
```

- [ ] **Step 2: Vent på Cloudflare Pages auto-deploy**

```powershell
gh run list --workflow="Deploy to Cloudflare Pages" --limit 1
```

Eller bare vent ~2 min. Cloudflare auto-deployer ved push til main.

- [ ] **Step 3: Live verify — robots.txt**

```powershell
curl -s https://birkenborg.dev/robots.txt
```

Forventet:
```
User-agent: *
Allow: /

Sitemap: https://birkenborg.dev/sitemap-index.xml
```

- [ ] **Step 4: Live verify — MetaTags på alle pages**

```powershell
$pages = @('/skrifter', '/projekter', '/cv', '/now', '/kontakt', '/chat', '/klinikker', '/konsulenter')
foreach ($p in $pages) {
  $url = "https://birkenborg.dev$p"
  $hasDescription = (curl -sL $url | Select-String -Pattern '<meta name="description"' -Quiet)
  $hasOg = (curl -sL $url | Select-String -Pattern '<meta property="og:title"' -Quiet)
  Write-Host "$p -> description: $hasDescription, og:title: $hasOg"
}
```

Forventet: alle 8 pages har både `description` og `og:title`.

- [ ] **Step 5: Live verify — Nybolig-posten har excerpt**

```powershell
curl -sL https://birkenborg.dev/skrifter/nybolig-fjerner-koglen-fra-salgsfotos | Select-String -Pattern '<meta name="description"' | Select-Object -First 1
```

Forventet: description er den nye 150-tegns-tekst, ikke duplikat af titlen.

---

## Task 13: Re-run Lighthouse audit

- [ ] **Step 1: Trigger Lighthouse workflow**

```powershell
gh workflow run lighthouse.yml
```

- [ ] **Step 2: Vent på run-completion (~2 min)**

```powershell
gh run list --workflow=lighthouse.yml --limit 1
```

- [ ] **Step 3: Hent scores fra run-output**

```powershell
$runId = (gh run list --workflow=lighthouse.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view $runId --log 2>&1 | Select-String -Pattern "(categories\.|Expected)" | Select-Object -First 30
```

Forventet ændring fra baseline:
- `/skrifter` SEO: 0.92 → ≥0.95 (description er nu unik for hver post-listing-side; description-distinct fra titel)
- `/projekter` SEO: 0.92 → ≥0.95
- `/cv` SEO: 0.92 → ≥0.95

Performance + accessibility forventes UÆNDRET (Plan C task 1+2+5+6 ikke implementeret endnu — det er Sprint 2).

**Note:** Hvis SEO-score stadig er <0.95, undersøg det specifikke audit-flag i Lighthouse-report-URL'en (linkes i workflow-loggen). Sandsynlige restproblemer: heading-hopper H1→H5 (Sprint 2 task 6) eller mobile-tap-targets.

---

## Self-review checklist (kør efter alle tasks)

- [ ] Pipeline-tests: alle 18 tests i `worker/tests/news/` grønne
- [ ] `simulate_draft.mts` printer excerpt + tags
- [ ] Nybolig-posten har `excerpt:` + `tags: [ai, ejendomsmægler, sikkerhed, retouchering]` i frontmatter
- [ ] Alle 9 pages (8 fra Task 8+10 + projekter/[...slug] fra Task 9) har `<meta name="description">` med unik tekst
- [ ] `/robots.txt` returnerer 200 + sitemap-pointer på live
- [ ] Lighthouse SEO ≥0.95 på `/skrifter`, `/projekter`, `/cv`
- [ ] Ingen nye type-fejl introduceret i worker (`npx tsc --noEmit` på worker/)
- [ ] Git-historik er rene commits per task (13 commits) — ingen WIP eller "fixup"-commits

---

## Hvad Sprint 1 IKKE indeholder

Følgende er ikke i denne plan — kommer i Sprint 2 + 3:

**Sprint 2 (Lighthouse pass):**
- Font-loading optimering (perf 0.66→0.85)
- Image lazy-loading + alt-warning rehype-plugin
- Color contrast audit (a11y 0.87→0.90)
- Heading-hierarki H1→H5-fix
- Re-audit

**Sprint 3 (Content-SEO, Plan D):**
- Per-post OG-images (statisk generation i public/og/ eller Cloudflare Images)
- Article JSON-LD udvidet (image, keywords, wordCount, articleSection)
- Internal linking: "Relaterede skrifter"-blok baseret på tag-overlap
- Title-length + description-quality-audit
- Search Console + indexing-verifikation
- Person JSON-LD med sameAs (LinkedIn, GitHub, etc.) på forsiden
