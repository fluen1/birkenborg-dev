# LinkedIn-blok strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop LinkedIn-versionen i posts fra at rendre på `/skrifter/[slug]`, og samle marker-strip-logikken ét sted så site-rendering og RAG-corpus deler samme kontrakt.

**Architecture:** En remark-plugin registreres i `astro.config.mjs` og fjerner alle root-noder fra og med første `<!-- linkedin:start -->` HTML-kommentar. Plugin og `build-corpus.mjs` deler en lille util (`site/src/lib/linkedin-block.mjs`) der eksporterer marker-konstanten og en `stripLinkedinBlock(string)`-funktion.

**Tech Stack:** Astro 6, unified/remark (allerede dep i `site/`), vitest (separat config i `site/` og repo-root), Node 22 ESM.

**Spec:** `docs/superpowers/specs/2026-05-24-linkedin-block-strip-design.md`

---

## File Structure

**Create:**
- `site/src/lib/linkedin-block.mjs` — delt util: marker-konstant + `stripLinkedinBlock(string)`. Co-locates med remark-plugin.
- `site/src/lib/linkedin-block.test.ts` — unit-tests for util (vitest, picked up af `site/vitest.config.ts`).
- `site/src/lib/remark-strip-linkedin.mjs` — remark-plugin der walker mdast-root og slicer børn fra og med markør-node.
- `site/src/lib/remark-strip-linkedin.test.ts` — integration-test via unified-pipeline.

**Modify:**
- `site/astro.config.mjs` — registrér plugin i `markdown.remarkPlugins`.
- `scripts/build-corpus.mjs` — fjern lokal marker-konstant + 3 strip-linjer, importér fra `../site/src/lib/linkedin-block.mjs`.

**Untouched (verificeret konsumenter-liste):**
- `site/src/pages/rss.xml.ts` (bruger kun frontmatter)
- `site/src/pages/skrifter/index.astro` (kun titler + datoer)
- `scripts/build-marginalia*` (rører ikke body-tekst på samme måde)

---

## Task 1: Delt util — marker-konstant og strip-funktion

**Files:**
- Create: `site/src/lib/linkedin-block.mjs`
- Test: `site/src/lib/linkedin-block.test.ts`

- [ ] **Step 1: Skriv failing tests**

Skriv `site/src/lib/linkedin-block.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LINKEDIN_MARKER_START, stripLinkedinBlock } from './linkedin-block.mjs';

describe('LINKEDIN_MARKER_START', () => {
  it('matches the agreed marker string', () => {
    expect(LINKEDIN_MARKER_START).toBe('<!-- linkedin:start -->');
  });
});

describe('stripLinkedinBlock', () => {
  it('returns input unchanged when marker is absent', () => {
    const input = 'Web essay text.\n\nMore text.';
    expect(stripLinkedinBlock(input)).toBe(input);
  });

  it('strips everything from the marker onwards', () => {
    const input = [
      'Web essay text.',
      '',
      '<!-- linkedin:start -->',
      'LinkedIn version here.',
      '<!-- linkedin:end -->',
    ].join('\n');
    expect(stripLinkedinBlock(input)).toBe('Web essay text.\n\n');
  });

  it('returns empty string when marker is at position 0', () => {
    const input = '<!-- linkedin:start -->\nOnly LinkedIn.';
    expect(stripLinkedinBlock(input)).toBe('');
  });
});
```

- [ ] **Step 2: Kør test, verificér FAIL**

```bash
cd site && npm test -- linkedin-block
```

Expected: FAIL — `Cannot find module './linkedin-block.mjs'`.

- [ ] **Step 3: Implementér util**

Opret `site/src/lib/linkedin-block.mjs`:

```js
export const LINKEDIN_MARKER_START = '<!-- linkedin:start -->';

export function stripLinkedinBlock(markdown) {
  const idx = markdown.indexOf(LINKEDIN_MARKER_START);
  return idx === -1 ? markdown : markdown.slice(0, idx);
}
```

- [ ] **Step 4: Kør test, verificér PASS**

```bash
cd site && npm test -- linkedin-block
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/lib/linkedin-block.mjs site/src/lib/linkedin-block.test.ts
git commit -m "feat(content): add shared LinkedIn block strip util"
```

---

## Task 2: Remark-plugin der fjerner LinkedIn-blok fra mdast

**Files:**
- Create: `site/src/lib/remark-strip-linkedin.mjs`
- Test: `site/src/lib/remark-strip-linkedin.test.ts`

Plugin'en walker ikke nested AST; den kigger kun på `tree.children` på document-root og truncerer arrayet fra og med første matchende `html`-node. Dette afspejler at markøren altid skrives som top-level HTML-kommentar i posts (samme kontrakt som build-corpus' string-baserede strip).

- [ ] **Step 1: Skriv failing test**

Opret `site/src/lib/remark-strip-linkedin.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkStripLinkedin from './remark-strip-linkedin.mjs';

async function process(input: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkStripLinkedin)
    .use(remarkStringify)
    .process(input);
  return String(file);
}

describe('remarkStripLinkedin', () => {
  it('removes content from <!-- linkedin:start --> onwards', async () => {
    const input = [
      'Web essay text.',
      '',
      '<!-- linkedin:start -->',
      'LinkedIn version here.',
      '<!-- linkedin:end -->',
      '',
    ].join('\n');
    const output = await process(input);
    expect(output).toContain('Web essay text.');
    expect(output).not.toContain('LinkedIn version here.');
    expect(output).not.toContain('linkedin:start');
    expect(output).not.toContain('linkedin:end');
  });

  it('leaves documents without the marker unchanged', async () => {
    const input = 'Essay only.\n\nNo LinkedIn here.\n';
    const output = await process(input);
    expect(output.trim()).toBe('Essay only.\n\nNo LinkedIn here.'.trim());
  });
});
```

- [ ] **Step 2: Kør test, verificér FAIL**

```bash
cd site && npm test -- remark-strip-linkedin
```

Expected: FAIL — `Cannot find module './remark-strip-linkedin.mjs'`.

- [ ] **Step 3: Implementér plugin**

Opret `site/src/lib/remark-strip-linkedin.mjs`:

```js
import { LINKEDIN_MARKER_START } from './linkedin-block.mjs';

export default function remarkStripLinkedin() {
  return (tree) => {
    const idx = tree.children.findIndex(
      (node) =>
        node.type === 'html' &&
        typeof node.value === 'string' &&
        node.value.startsWith(LINKEDIN_MARKER_START)
    );
    if (idx !== -1) {
      tree.children.length = idx;
    }
  };
}
```

- [ ] **Step 4: Kør test, verificér PASS**

```bash
cd site && npm test -- remark-strip-linkedin
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/lib/remark-strip-linkedin.mjs site/src/lib/remark-strip-linkedin.test.ts
git commit -m "feat(site): add remark-strip-linkedin plugin"
```

---

## Task 3: Registrér plugin i Astro markdown-pipeline

**Files:**
- Modify: `site/astro.config.mjs`

- [ ] **Step 1: Tilføj plugin til markdown-config**

Åbn `site/astro.config.mjs`. Filen ser pt. sådan ud:

```js
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

Ændr til:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeImgAttrs from './src/lib/rehype-img-attrs.mjs';
import remarkStripLinkedin from './src/lib/remark-strip-linkedin.mjs';

export default defineConfig({
  site: 'https://birkenborg.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkStripLinkedin],
    rehypePlugins: [rehypeImgAttrs],
  },
});
```

- [ ] **Step 2: Byg site og verificér at LinkedIn-tekst ikke længere er i output**

```bash
cd site && npm run build
```

Expected: build lykkes uden fejl.

Verificér derefter den genererede HTML:

```bash
grep -l "linkedin:start\|Det er ikke sløseri\. Det er strukturelt\." dist/skrifter/jurist-bygger-dokumentation/index.html
```

Expected: ingen output (grep finder hverken markør-strengen eller den kun-LinkedIn-formulering af sætningen).

Som positiv kontrol — at den web-version (læg mærke til "ikke sløseri — det er strukturelt" med tankestreg) stadig er der:

```bash
grep -c "ikke sløseri — det er strukturelt" dist/skrifter/jurist-bygger-dokumentation/index.html
```

Expected: `1` eller højere.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/astro.config.mjs
git commit -m "feat(site): wire remark-strip-linkedin into markdown pipeline"
```

---

## Task 4: Refaktorér `build-corpus.mjs` til at bruge delt util

**Files:**
- Modify: `scripts/build-corpus.mjs:6,24-27`
- Test (eksisterende, skal stadig passere): `scripts/build-corpus.test.ts`

- [ ] **Step 1: Bekræft baseline — alle build-corpus-tests passerer i dag**

```bash
cd /c/Users/birke/Projects/birkenborg-dev && npm test -- build-corpus
```

Expected: alle tests PASS. (Hvis ikke, stop og undersøg — ikke en del af denne ændring.)

- [ ] **Step 2: Refaktorér til delt util**

Åbn `scripts/build-corpus.mjs`.

Erstat linje 6:

```js
const LINKEDIN_MARKER = '<!-- linkedin:start -->';
```

med:

```js
import { LINKEDIN_MARKER_START, stripLinkedinBlock } from '../site/src/lib/linkedin-block.mjs';
```

(Tilføj import-linjen sammen med de øvrige imports øverst i filen, slet den gamle konstant.)

Erstat linjerne 24-27:

```js
    // Strip LinkedIn-blok
    const linkedinIdx = content.indexOf(LINKEDIN_MARKER);
    const body = linkedinIdx === -1
      ? content.trim()
      : content.slice(0, linkedinIdx).trim();
```

med:

```js
    // Strip LinkedIn-blok
    const body = stripLinkedinBlock(content).trim();
```

(`LINKEDIN_MARKER_START` importeres for at signalere kontrakten ét sted — men selve funktionskaldet er nok her. Hvis ingen andre linjer bruger `LINKEDIN_MARKER_START` direkte, kan importen reduceres til kun `stripLinkedinBlock`. Vælg det.)

Endelig form af de relevante linjer:

```js
import { stripLinkedinBlock } from '../site/src/lib/linkedin-block.mjs';
```

og:

```js
    const body = stripLinkedinBlock(content).trim();
```

- [ ] **Step 3: Kør eksisterende build-corpus-tests, verificér PASS**

```bash
cd /c/Users/birke/Projects/birkenborg-dev && npm test -- build-corpus
```

Expected: alle tests PASS uændret (samme adfærd, anden implementation).

- [ ] **Step 4: Kør build-corpus CLI mod rigtige posts, sanity-check output**

```bash
cd /c/Users/birke/Projects/birkenborg-dev && node scripts/build-corpus.mjs
```

Expected: skriver corpus-, citations-, voice-samples-filer uden fejl, og udskriver "Wrote N posts to …"-linjer.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-corpus.mjs
git commit -m "refactor(scripts): share LinkedIn strip util with site renderer"
```

---

## Task 5: End-to-end verifikation

**Files:** ingen ændringer — kun verifikation af at hele systemet hænger sammen.

- [ ] **Step 1: Kør alle tests på tværs af repo og site**

```bash
cd /c/Users/birke/Projects/birkenborg-dev && npm test
```

Expected: alle tests PASS (worker + scripts).

```bash
cd /c/Users/birke/Projects/birkenborg-dev/site && npm test
```

Expected: alle tests PASS (inkl. de to nye filer fra Task 1+2).

- [ ] **Step 2: Byg site og verificér begge posts**

```bash
cd /c/Users/birke/Projects/birkenborg-dev/site && npm run build
```

Expected: succes.

For `jurist-bygger-dokumentation`:

```bash
grep -c "linkedin:start" dist/skrifter/jurist-bygger-dokumentation/index.html
```

Expected: `0`.

For `nybolig-fjerner-koglen-fra-salgsfotos`:

```bash
grep -c "linkedin:start" dist/skrifter/nybolig-fjerner-koglen-fra-salgsfotos/index.html
```

Expected: `0`.

- [ ] **Step 3: Visuel verifikation**

Start dev-server:

```bash
cd /c/Users/birke/Projects/birkenborg-dev/site && npm run dev
```

Åbn `http://localhost:4321/skrifter/jurist-bygger-dokumentation` i browser. Verificér:
- Essayet vises én gang.
- Ingen duplikeret LinkedIn-tekst nedenunder.
- "Læs også på LinkedIn →"-link i footer er stadig synligt (det styres af `linkedin_url`-frontmatter, ikke body).

Stop dev-server (Ctrl+C).

- [ ] **Step 4: Slut-commit hvis nødvendigt**

Hvis alle tidligere commits er på plads og dette kun var verifikation, ingen commit nødvendig. Hvis du har lavet småjusteringer undervejs (fx logging eller en glemt formattering), commit dem her:

```bash
git status
# hvis noget — commit med fokuseret besked
```

---

## Self-Review Notes

- **Spec coverage:** Mål 1 (LinkedIn-blok aldrig i HTML) → Task 2+3+5. Mål 2 (marker ét sted) → Task 1+4. Mål 3 (forfatter-flow uændret) → ingen content-ændringer i planen. Mål 4 (ingen migration) → ingen task rører `content/posts/*.md`.
- **Fil-placeringsbeslutning fra spec:** Valgt `site/src/lib/linkedin-block.mjs` (co-located med remark-plugin); `build-corpus.mjs` importerer på tværs af `../site/src/lib/`. Begrundelse: strip-logikken hører til parser-side; build-corpus er konsument.
- **Placeholders:** ingen TBD/TODO. Alle code-blokke er konkrete.
- **Type-/navnekonsistens:** `LINKEDIN_MARKER_START` og `stripLinkedinBlock` bruges identisk på tværs af alle tasks.
