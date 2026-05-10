# Plan B — Marginalia-pipeline design

**Forfatter:** Philip Birkenborg Andersen
**Dato:** 2026-05-10
**Status:** Aktivt design — klar til implementations-plan
**Bygger ovenpå:** `docs/superpowers/specs/2026-05-10-site-personal-brand-redesign-design.md` (Plan A leverede display-laget; Plan B leverer automation)

## 1. Vision

Plan A leverede **visning** af marginalia + activity-feed. Plan B reducerer det manuelle arbejde med at vedligeholde dem ved at flytte alt redigering ind i Philips eksisterende Telegram-flow — og tilføjer en build-time pipeline der scanner commits for relevante noter.

Tre features:
1. **`/note <slug> <tekst>`** — Telegram-kommando der pusher en marginalia-note til en publiceret skrift via GitHub Contents API
2. **`/highlight <tekst>` + `/highlights` + `/unhighlight`** — pin events ekstra prominent i activity-feed, persisteret i KV
3. **Auto-commit-scanning** — ugentlig GitHub Action der scanner recent commits for keyword-matches mod publicerede skrifter og åbner PR med suggested marginalia

## 2. `/note <slug> <tekst>`

### UX
Eksplicit slug-arg + fejl med forslag når slug ikke matcher. Ingen interaktiv state-machine, ingen fuzzy-match.

```
/note ma-agent-paragraf-30 har lukket sagen — det var en grænse-værdi-bug
```

### Flow
1. Bot-worker modtager `/note`-kommando i webhook
2. Parser slug + tekst fra args (split på første whitespace efter slug)
3. Læser `content/posts/<slug>.md` fra `birkenborg-dev` via GitHub Contents API (auth: `PUBLIC_REPO_PAT`)
4. Hvis 404: bot DM'er fejlbesked med liste over de 8 senest publicerede slugs (sorteret desc efter `publish_at`). Slug-listen hentes via `https://birkenborg.dev/api/_corpus.json` (build-time genereret af Plan A's `build-corpus.mjs`-pipeline; opdateres automatisk når en ny skrift publiceres).
5. Parser eksisterende frontmatter med `gray-matter`-library (allerede dependency på root via Plan A)
6. Append ny entry til `data.marginalia`-array:
   ```yaml
   - ts: "<current ISO timestamp>"
     text: "<tekst>"
     source: telegram
   ```
7. Re-encode frontmatter + body med `matter.stringify(content, data)`
8. Push tilbage til `birkenborg-dev` via Contents API (PUT) med commit-message `note: <slug> — <første 40 chars af tekst>`
9. Bot DM'er Philip: ✅ "Note tilføjet til <slug>. Live om ~30s: birkenborg.dev/skrifter/<slug>"

### Fejlhåndtering
- Slug ikke fundet → DM med slug-forslag (top 8)
- GitHub PUT fejl (typisk SHA-mismatch ved race) → retry én gang efter at hente fresh SHA; hvis stadig fejler, DM med fejlbesked
- Tom tekst → DM "Tom note. Skriv `/note <slug> <tekst>` med faktisk indhold."

### Filer
- Ny: `birkenborg-agents/worker/src/commands/note.ts`
- Modificer: `birkenborg-agents/worker/src/index.ts` — dispatch til `/note`-handler
- Genbruger: `news/publish.ts`-flow til GitHub Contents API (eller refaktorer fælles `github.ts`-helpers)

## 3. `/highlight <tekst>` + `/highlights` + `/unhighlight`

### Persistens
KV-keys i `BOT_STATE`:
- Format: `feed-highlight:<unix-ts>` → JSON: `{ text: string, ts: number }`
- **Permanent — ingen TTL.** Højdepunkter persists indtil eksplicit fjernet via `/unhighlight`.
- Begrundelse for ikke-TTL: TTL er friktion på den forkerte side. Når Philip har besluttet at noget er værd at highlighte, skal han ikke betale en counter for at opretholde den beslutning. Activity-feedet viser kun 5 events — hvis 5+ highlights akkumulerer, er det selv-synligt og inviterer cleanup.

### Kommandoer

**`/highlight <tekst>`**
- Generer ny KV-key med current ts
- Skriv `{ text, ts }` til BOT_STATE
- DM Philip: ✦ "Pinned: <tekst>"

**`/highlights`**
- List alle `feed-highlight:*`-keys, sortér desc efter ts
- DM Philip nummereret liste:
  ```
  ✦ Aktive highlights:
  1. (i dag) Multi-agent compliance live på første kunde
  2. (8/5) Talt med Pernille — første samtale booket
  ...
  ```

**`/unhighlight <num>`**
- Tag liste fra `/highlights`-output (som er dokumenteret rækkefølge — desc by ts)
- Slet `feed-highlight:<ts>`-key matching valgt nummer
- DM Philip ✗ "Fjernet: <tekst>"
- `/unhighlight all` → kræver bekræftelse via separat YES-prompt; sletter alle keys

### Activity-feed integration
Site-worker `/api/activity` udvides:
- Henter highlights fra bot-worker via ny internal endpoint `GET bot.birkenborg.dev/internal/highlights` (auth: `BOT_INTERNAL_TOKEN`)
- Builder events af type `'highlight'` med icon `✦`, dedupliceret hvis text matcher en eksisterende commit/skrift
- Highlights placeres ALTID øverst i feed (over commits/skrifter), uanset ts

### Filer
- Ny: `birkenborg-agents/worker/src/commands/highlight.ts`
- Ny: `birkenborg-agents/worker/src/internal-highlights.ts` (eller udvid `internal.ts`)
- Modificer: `birkenborg-dev/worker/index.ts` — `buildEvents` henter highlights og merger dem ind
- Modificer: `birkenborg-dev/site/src/components/ActivityFeed.astro` — render highlight-rows med distinkt styling (lidt federe, ✦-ikon i clay-color i stedet for opacity 0.5)

## 4. Auto-commit-scanning

### Flow
Build-time GitHub Action på `birkenborg-dev`-repo, kører ugentligt (søndag aften, samme cadence som existing draft-generation).

1. Action checker ud `birkenborg-dev`-repo
2. Kører `scripts/build-marginalia.mjs`
3. Script læser alle `content/posts/*.md` med `status: published`
4. For hver post: extract `slug` + `tags`-array + `title`-keywords (stop-words filtered)
5. Query GitHub Commits API for begge `birkenborg-dev` + `birkenborg-agents` repos, sidste 30 dage
6. For hver commit: scan commit-message for keyword-overlap med post (case-insensitive partial match på slug-fragmenter eller tags)
7. Hvis match: byg suggested marginalia entry:
   ```yaml
   - ts: "<commit author date>"
     text: "<commit-message — første 80 chars, conventional-commit-prefix strippet>"
     source: auto-commit
     commit_url: "<commit html_url>"
   ```
8. **Deduplicer** mod eksisterende marginalia (skip hvis text allerede er i array — match på text-equality)
9. Hvis nogen suggestions akkumuleret: skriv ændrede `content/posts/*.md`-filer i ny branch `auto-marginalia/<date>`
10. Åben PR mod `main` via `gh pr create` med:
    - Titel: `auto-marginalia: <N> nye noter fra ugens commits`
    - Body: Markdown-tabel der lister hvert affected post + commits + foreslået note-tekst
11. Action notify Philip via Telegram: bot DM'er "Auto-marginalia PR åben: <URL>. Review og merge når klar."

### Heuristik for keyword-match
- Slug-fragmenter (split slug på `-`, filter ord <3 chars og stop-words)
- Tags fra frontmatter
- Match på commit-message med `string.toLowerCase().includes()` for hver keyword
- Mindstekrav: 1 match (lavt threshold). Hvis det giver for meget støj efter første run, hæver vi til 2.

### Trade-off accepteret
Auto-noter kan være misvisende (commit "feat(site): hero-restruktur" matcher en post hvis post har "site" i tags). PR-flow gør det tydeligt: Philip ser hver suggestion og kan strikke den ud i PR-review FØR merge. Auto-scan optimere FOR recall (foreslå mange) frem for precision (kun foreslå sikre matches) — fordi false positives koster sekunder at slette i PR, mens false negatives mister insight.

### Filer
- Ny: `birkenborg-dev/scripts/build-marginalia.mjs`
- Ny: `birkenborg-dev/.github/workflows/auto-marginalia.yml`
- Modificer: `birkenborg-dev/scripts/build-corpus.mjs` — eventuelt udvide hvis vi vil dele helpers

## 5. Sikkerhed + secrets

Ingen nye secrets. Alle features genbruger eksisterende:
- `PUBLIC_REPO_PAT` (på bot-worker for `/note` GitHub-push; også brugt af auto-scan workflow for cross-repo læsning af `birkenborg-agents`-commits siden den er privat)
- `BOT_INTERNAL_TOKEN` (mellem site-worker ↔ bot-worker for highlights-fetch)
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- Auto-scan workflow: bruger `secrets.PUBLIC_REPO_PAT` (allerede i `birkenborg-dev`-repo's secrets) for både cross-repo commit-fetch og PR-opening

## 6. Tests

### `/note`
- Unit test for command-parser (slug + tekst extraction, edge cases: tom tekst, kun slug, multi-word slug)
- Integration test (mocket GitHub Contents API): læs frontmatter, append marginalia, push tilbage, verify body unchanged
- Fail-path: 404 fra GitHub → DM med slug-suggestions

### `/highlight` family
- Unit test for KV write/read/delete
- Integration: send `/highlight <tekst>` → KV-key oprettet → `/highlights` lister korrekt → `/unhighlight 1` fjerner

### Auto-scan
- Unit test for keyword-extraction fra slug + tags
- Unit test for keyword-matching mod commit-message (positive + negative cases)
- Unit test for deduplication (don't duplicate existing marginalia)
- Integration test (mocket GitHub Commits API): full pipeline → verify changed files match expected

## 7. Out of scope (mulig Plan B2 senere)

- Slug-fuzzy-matching (`/note` med partial slug)
- Interaktiv menu hvis slug glemmes (`/notes` lister recent slugs)
- Highlights-TTL hvis akkumulering bliver et reelt problem
- Auto-scan i bot-worker (i stedet for GitHub Action)
- LinkedIn-cross-post når marginalia tilføjes til viral-skrift

## 8. Implementation-faser (forslag)

### Plan B1 — `/note` (uge 1)
Mest umiddelbar værdi. Independent af de andre to. Test-cases dækker GitHub-mock + KV.

### Plan B2 — `/highlight` family (uge 2)
Kræver ny internal endpoint på bot-worker + udvidelse af `/api/activity` på site-worker. Touches both repos.

### Plan B3 — Auto-scan (uge 3)
Mest kompleks. Kræver GitHub Action workflow. Kun nyttig efter en tids brug af `/note` — så vi ved hvilke patterns auto-scan skal fange.

Kan implementeres sekventielt — ingen tight coupling. Hver fase leverer brugbart værdifuldt-feature alene.
