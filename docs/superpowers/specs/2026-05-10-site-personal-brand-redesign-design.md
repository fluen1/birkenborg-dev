# birkenborg.dev — personlig brand-redesign

**Forfatter:** Philip Birkenborg Andersen
**Dato:** 2026-05-10
**Status:** Aktivt design — klar til implementations-plan

## 1. Vision

Sitet er en **personlig fremstilling af Philip** — ikke en sales-funnel for klinik/konsulent-tilbud. Hovedfortællingen er den sjældne kombination: jurist + builder + kritisk tænker. Sitet kommunikerer det IKKE ved at fortælle ("jeg er X, Y og Z") men ved at vise — gennem skrifter, live-feed af aktivitet, og marginalia der personliggør hver side.

**Det det ikke er:**
- Salgsside målrettet klinik-ejere eller konsulenter (de pages eksisterer som standalone, ikke som hovedfortælling)
- Konsulent-CV (det er `/cv`)
- Service-katalog

## 2. Succes-signaler

Polish-arbejdet skal levere på alle fire dimensioner Philip har valgt:

1. **Memorable** — folk vender tilbage; skrifter linkes/deles
2. **Cold-Google-clarity** — én klar fortælling på 30 sek for nye besøgende
3. **Direkte henvendelser** — varme henvendelser fra folk der har læst skrifter
4. **Outreach-tillid** — leads der klikker fra outreach-email får tillid

Memorable og cold-clarity er det vigtigste — de driver de andre to.

## 3. Hovedside-struktur

```
┌─────────────────────────────────────────┐
│ Header: P.B. · Skrifter · Projekter ·   │
│         Chat · CV                       │
├─────────────────────────────────────────┤
│ HERO (variant A)            │ MARGINALIA│
│ Senest skrift · 8. maj      │ ↗ 8/5 14:32│
│ "M&A-agenten fejlede..."    │ undersøgte │
│ kort deck                   │ ↗ 9/5 09:01│
│ Læs videre →                │ rettelse   │
├─────────────────────────────────────────┤
│ OM MIG (2-3 sætninger)                  │
├─────────────────────────────────────────┤
│ LIVE-FEED (tidslinje)                   │
│ i dag — Skrev "Jurister..."             │
│ i går — Pushed news-M2                  │
│ 8/5  — Agent #11 i produktion           │
│ ...                                     │
├─────────────────────────────────────────┤
│ SKRIFTER (4-5 nyeste)        Alle →     │
├─────────────────────────────────────────┤
│ ANDRE TING JEG BYGGER (3 pills)         │
├─────────────────────────────────────────┤
│ Footer                                  │
└─────────────────────────────────────────┘
```

### Hero-sektion
- **Variant A — seneste skrift som magazine-opener**
- Auto-trækker seneste post fra `content/posts/*.md` (hvor `status: published`, sorteret efter `publish_at`)
- Layout: clay-orange venstre-border + label ("Senest skrift · 8. maj 2026") + titel + kort deck + "Læs videre →"
- Erstatter den nuværende "in-house jurist"-headline

### Om mig-sektion
- Mellem hero og live-feed
- 2-3 sætninger der placerer Philip uden at fremstille som service-sælger
- Eksempel: *"Cand.merc.jur. Legal Counsel hos Tandlægen.dk. Bygger AI-agenter til jurist-arbejde i fritiden — og deler hvad der virker, og præcist hvor det fejler."*
- Tør, tæt på den nuværende deck-tekst men frigjort fra hero-rollen

### Live-feed
- Udvidelse af eksisterende `LiveActivity`-komponent
- **Format:** tidslinje af events — én række per event med `when` (relative date) + ikon + tekst
- **Ikoner:** ✎ skrift, ⚙ commit, ✦ /now-update
- Beholder den eksisterende 30-dages activity-graf nederst i feedet
- Limit: 8-10 nyeste events på forsiden; "Alle aktivitets-events →" link til separat side hvis ønsket senere

### Skrifter-sektion
- Behold eksisterende; viser 4-5 nyeste posts (efter hero-skrift) med titel + dato
- Marginalia for skrifter på selve skrift-siden, ikke i forsidens skrifter-liste

### Projekter (sekundær)
- Ned-prioriteret — ingen store ProjectCards længere
- 3 pills med kort beskrivelse: `birkenborg-agents`, `ChainHub`, `birkenborg.dev`
- Header: "Andre ting jeg bygger" (signalerer det er sekundært til hovedaktiviteten)

## 4. Marginalia — visuel signatur

### Funktion
Højre-side marginalia-spalte med Philips håndskrift-style noter, timestamps, og opdateringer. Som at læse Philips arbejdskopi af teksten. Tilstede både på forsiden (knyttet til hero-skriftet) og på skrift-siderne (`/skrifter/<slug>`).

### Hybrid data-model
- **Auto-trækning fra commits:** Når en skrift har `slug: foo-bar` i frontmatter, scanner build-time-pipelinen `birkenborg-agents` + `birkenborg-dev` commit-history fra samme uge for commits hvis message indeholder slug-fragmenter eller keywords fra skriftet. Auto-tilføjer 0-3 noter per skrift som suggestions (Philip kan slette via Telegram-kommando hvis irrelevant).
- **Telegram-bot integration:** Ny `/note <slug> <tekst>`-kommando på `@birkenborg_agents_bot` der lader Philip tilføje en marginalia-note via Telegram. Bot pusher noten til `content/posts/<slug>.md` frontmatter via samme `publish.ts`-flow som news-pipelinen bruger.
- **Ingen manuel frontmatter-redigering forventet** — alle noter kommer enten via auto-scan eller Telegram. Det holder editing-flowet i Philips eksisterende workflow.
- **Frontmatter-format:**
  ```yaml
  marginalia:
    - ts: "2026-05-08T14:32"
      text: "undersøgte det her i 3 dage før jeg gav op"
      source: telegram   # eller "auto-commit"
    - ts: "2026-05-09T09:01"
      text: "rettelse: agenten ramte 11 ud af 10 paragraffer — men spillede pas"
      source: telegram
  ```

### Visuel implementation
- Font: `Caveat` eller `Patrick Hand` (Google Fonts, fallback: `Segoe Script`, `cursive`)
- Layout: højre-margin på desktop (~170px); under hero på mobil (kollapser elegant)
- Tekstfarve: `#8a6e3d` (varm brun, kontrasterer cream + clay)
- Pile/timestamps i clay-orange

## 5. Live-feed — udvidet implementation

### Event-kilder (alle 4)
1. **GitHub commits** (eksisterende via `/api/activity`)
2. **Skrift-publiseringer** — parse `content/posts/*.md` frontmatter, vis seneste publish_at som event
3. **/now status-updates** — parse `content/now.md` history (commit-log på filen) for tidligere /now-tags
4. **Manuel highlights via Telegram** — ny `/highlight <tekst>`-kommando der pinner en event som ekstra prominent (med ✦-ikon eller bold)

### Datafetch
- `/api/activity`-endpoint udvides til at returnere unified event-stream:
  ```typescript
  interface ActivityEvent {
    type: "commit" | "skrift" | "now" | "highlight";
    ts: number;
    text: string;
    icon: string;
    url?: string;
    pinned?: boolean;
  }
  ```
- Server-side merging + sortering efter ts desc, limit 10 til forside

## 6. Sekundære sider

| Side | Status |
|---|---|
| `/skrifter` | Behold; tilføj marginalia-render på enkelt-skrift-sider |
| `/skrifter/<slug>` | Render marginalia inline (højre margin på desktop, kollaps på mobil) |
| `/projekter` | Behold uændret |
| `/projekter/<slug>` | Behold uændret |
| `/cv` | Behold uændret |
| `/now` | Behold; feeder ind i hovedsidens live-feed |
| `/chat` | Behold uændret |
| `/klinikker` | **Behold som standalone, men FJERN fra hovednavigation.** Kun discoverable via direkte outreach-link. Footer-link OK. |
| `/konsulenter` | Samme behandling som `/klinikker` |
| `/kontakt` | Behold uændret; måske flyt til footer eller fjern fra nav (kontakt-info er i footer alligevel) |

## 7. SEO-baseline (del af opgaven)

- **JSON-LD structured data:**
  - `Person` på hovedsiden + `/cv`
  - `WebSite` global (med `name`, `url`, `description`)
  - `Article` på `/skrifter/<slug>`-sider
  - `BreadcrumbList` på dybe sider
- **OG + Twitter meta-tags** på alle sider (tag, dato, beskrivelse, billede hvis muligt)
- **Sitemap** — `astro-sitemap`-integration (verificér eksisterer)
- **Alt-tekster** på alle eksisterende billeder

## 8. Performance + accessibility

**Separat fra denne opgave.** Efter relaunch:
- Kør Lighthouse-audit (mobil + desktop)
- Åbn issues for hver kategori der scorer <90
- Implementér i follow-up — typisk: image-lazy-loading, font-display, caching headers

## 9. Voice + tone (kopi-justering)

Eksisterende tone er allerede tæt på rigtig — den behøver kun mindre justering når vi flytter messaging fra hero til om-mig-sektionen. Behold:
- "deler hvad der virker, og præcist hvor det fejler" som kerneformulering
- selvironi + faglig tørhed
- ingen salgs-claims

## 10. Komponent-arkitektur

**Nye komponenter:**
- `HeroSkrift.astro` — variant A hero (erstatter `Hero.astro` på `index.astro`)
- `OmMig.astro` — kort om-mig-sektion
- `Marginalia.astro` — render marginalia-spalte (bruges på forside + skrift-sider)
- `ActivityFeed.astro` — udvidet aktivitets-feed (erstatter eller udbygger `LiveActivity.astro`)

**Modificerede komponenter:**
- `Header.astro` — nav-items uden /klinikker, /konsulenter, /kontakt
- `Footer.astro` — tilføj /klinikker, /konsulenter, /kontakt-links
- `Base.astro` — tilføj JSON-LD + OG-tags slots

**Modificerede worker-endpoints:**
- `/api/activity` — udvid til at returnere unified `ActivityEvent[]`-stream
- Bot-worker: tilføj `/note <slug> <tekst>` og `/highlight <tekst>`-kommandoer

**Modificeret content-pipeline:**
- Ny `scripts/build-marginalia.mjs` der scanner commits og auto-foreslår marginalia (build-time integration), pusher resultater til content frontmatter via PR eller direkte commit

## 11. Implementation-faser (forslag)

**Anbefaling: dekomponér i to planer** så hovedsiden kan relauncher hurtigt:

### Plan A — site-restrukturering (uger 1-2)
1. Hero-restrukturering (variant A: seneste skrift som hero) + Om-mig-sektion
2. Header-cleanup (fjern /klinikker, /konsulenter, /kontakt fra nav)
3. Footer-udvidelse (tilføj sekundære sider)
4. ActivityFeed-udvidelse (skrift + /now event-kilder; manuel highlights kommer i Plan B)
5. Marginalia-rendering (display-only — manuel frontmatter-data initialt)
6. SEO-baseline (JSON-LD + OG-tags på alle sider)
7. Mobile QA + relaunch

### Plan B — marginalia-pipeline (uger 3-4)
1. Telegram `/note <slug> <tekst>`-kommando på bot-worker
2. Telegram `/highlight <tekst>`-kommando (manuel feed-highlights)
3. Auto-commit-scanning (`scripts/build-marginalia.mjs`)
4. Integration: build-time PR-flow eller direct commit

Plan A leverer hele den synlige redesign og kan relauncher uden at vente på Plan B's pipeline-arbejde. Plan B udbygger automation efterfølgende.

### Plan C — performance follow-up (separat)
- Lighthouse-audit + targeted fixes per kategori der scorer <90

## 12. Out of scope

- Auto-deploy af site (eksisterer allerede via Cloudflare Pages)
- AI-chat-redesign (`/chat` forbliver som det er)
- Klinik/konsulent-landing-page-omskrivning (separat opgave hvis ønsket)
- Lighthouse-fixes (separat follow-up)
- Designmotiv-revolution (vi tilføjer marginalia, ikke redesigner alt)

## 13. Reference

- Implementation-plan: `docs/superpowers/plans/2026-05-10-site-personal-brand-redesign.md` (skrives efter spec-godkendelse)
- Relateret: `docs/superpowers/specs/2026-05-08-uafhaengigheds-strategi.md` (uafhængigheds-strategi — sitet understøtter ICP'erne via /klinikker, /konsulenter, men hovedfortællingen er Philip selv)
