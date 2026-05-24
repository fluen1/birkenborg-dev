# LinkedIn-blok strip i markdown-rendering — design

**Dato:** 2026-05-24
**Status:** design
**Område:** site rendering, content pipeline

## Problem

Posts i `content/posts/*.md` indeholder både web-essay og en LinkedIn-version, adskilt af HTML-kommentarer:

```markdown
Web-essay her…

<!-- linkedin:start -->
LinkedIn-version her…
<!-- linkedin:end -->
```

På `/skrifter/[slug]` rendres hele bodyen via `<Content />`. HTML-kommentarerne er usynlige i output, men teksten imellem dem er almindelig markdown og rendres derfor — LinkedIn-versionen vises som duplikeret tekst nedenunder essayet.

`scripts/build-corpus.mjs:24-27` stripper allerede blokken korrekt før RAG-corpus, voice-samples og citations bygges. Bugen er at samme regel ikke gælder Astro's markdown-pipeline.

## Mål

1. LinkedIn-blokken må aldrig nå ud i HTML på `/skrifter/[slug]`.
2. Marker-konstanten (`<!-- linkedin:start -->` / `<!-- linkedin:end -->`) skal leve ét sted, så site-rendering og corpus-builder ikke kan glide ud af sync.
3. Forfatter-flowet ændres ikke: begge versioner bliver i samme `.md`-fil, så essay og LinkedIn-tekst kan reviewes side om side.
4. Ingen migration af eksisterende posts.

## Ikke-mål

- At eksponere LinkedIn-teksten som strukturerede data (`post.data.linkedinText`). Hvis behovet opstår senere, kan det tilføjes; pt. udnyttes det ikke noget sted.
- At ændre `linkedin_url`-frontmatter-feltet eller "Læs også på LinkedIn"-linket i footer.
- At håndtere afsluttende markør (`<!-- linkedin:end -->`). Build-corpus tager kun start-markøren og stripper alt efter den; samme semantik holdes.

## Løsning

En remark-plugin der fjerner alle AST-noder fra og med den første `<!-- linkedin:start -->` HTML-kommentar i dokumentet. Plugin'en registreres i `astro.config.mjs` under `markdown.remarkPlugins`, så `<Content />` automatisk får den rensede version.

Marker-konstant og strip-semantik flyttes ud i en delt util der både remark-pluginen og `build-corpus.mjs` importerer fra. Dermed er der ét sandhedssted for content-format-kontrakten.

### Komponenter

**1. `scripts/lib/linkedin-block.mjs` (ny)**

Delt util med marker-konstant og en ren string-strip-funktion brugt af build-corpus.

```js
export const LINKEDIN_MARKER_START = '<!-- linkedin:start -->';

export function stripLinkedinBlock(markdown) {
  const idx = markdown.indexOf(LINKEDIN_MARKER_START);
  return idx === -1 ? markdown : markdown.slice(0, idx);
}
```

Placering: `scripts/lib/` så `build-corpus.mjs` kan importere relativt, og en remark-plugin i `site/src/lib/` kan importere på tværs af repo-rod via relativ path. Alternativt placering: `site/src/lib/linkedin-block.mjs` — vælges hvis cross-repo-relativ-import bliver klodset. (Afgøres i implementation-plan.)

**2. `site/src/lib/remark-strip-linkedin.mjs` (ny)**

Remark-plugin der walker AST'et, finder første `html`-node hvis value starter med marker-strengen, og fjerner den + alle efterfølgende noder fra dokumentets root-children-array.

Følger samme `.mjs`-konvention som eksisterende `rehype-img-attrs.mjs`.

**3. `site/astro.config.mjs` (modificeret)**

Tilføj `remarkPlugins: [remarkStripLinkedin]` under `markdown`.

**4. `scripts/build-corpus.mjs` (refaktoreret)**

Importér `LINKEDIN_MARKER_START` og `stripLinkedinBlock` fra `./lib/linkedin-block.mjs`. Erstat de lokale konstanter og 3 linjer strip-logik med ét funktionskald. Adfærd uændret.

### Data-flow

```
content/posts/*.md
  │
  ├─→ Astro glob loader
  │     │
  │     └─→ remark-pipeline
  │           ├─ remark-strip-linkedin  ← NY
  │           └─ (default remark/rehype)
  │           │
  │           └─→ <Content /> på /skrifter/[slug]
  │
  └─→ scripts/build-corpus.mjs
        │
        └─ stripLinkedinBlock()  ← refaktoreret til delt util
        │
        └─→ chat-corpus, voice-samples, citations
```

## Test

**Unit-tests for `stripLinkedinBlock` (ny fil eller udvid build-corpus.test.ts):**
- Input uden marker → uændret output.
- Input med marker → alt fra markøren og frem fjernet.
- Input med marker på linje 1 → tom string.

**Unit-test for remark-plugin (ny: `site/src/lib/remark-strip-linkedin.test.ts`):**
- Givet en mdast-tree med en `html`-node der starter med markøren, fjernes den og alt efter fra root.children.
- Givet en tree uden markøren, ændres tree'et ikke.

**Integration / end-to-end check:**
- Build `site/` og verificér at den genererede HTML for `2026-05-05-jurist-bygger-dokumentation` ikke indeholder strengen "Det er ikke sløseri. Det er strukturelt." (kun-LinkedIn-variant af sætningen), eller — mere robust — at output-HTML kun indeholder essay-versionen og ikke har duplikeret indhold.
- Eksisterende `build-corpus.test.ts` skal fortsat passere uændret efter refaktorering (samme adfærd, anden implementation).

## Risici

- **Remark mdast-API-version:** Astro bruger `unified` v11 / `remark-parse` v11 (mdast v4). HTML-kommentarer parses som `html`-noder med `value: '<!-- linkedin:start -->'`. Plugin'en skal være robust over for at noden kan stå alene eller indlejret. Holdes simpel: strip kun på document-root, ikke nested.
- **Cross-import mellem `scripts/` og `site/src/`:** Relativ import fungerer (`../../scripts/lib/linkedin-block.mjs` fra Astro-config). Hvis det bliver klodset, dupliker konstant + util i `site/src/lib/linkedin-block.mjs` og hold to filer i sync via test. Afgøres når plan skrives.
- **Ingen afsluttende markør i strip:** Hvis nogen skriver indhold _efter_ `<!-- linkedin:end -->` (fx noter), bliver det også strippet. Samme adfærd som build-corpus i dag — dokumenteres som konvention: alt efter `linkedin:start` er LinkedIn-territorium.

## Out of scope

- Migration til sidecar-fil (`<slug>.linkedin.md`) eller frontmatter-felt — vurderet under brainstorming, afvist pga. forfatter-flow-disruption og ingen tydelig gevinst.
- Eksponering af LinkedIn-tekst som `post.data.linkedinText` — YAGNI; tilføjes hvis et faktisk konsument-behov opstår.
