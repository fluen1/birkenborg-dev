# birkenborg.dev — Personal Hub & LinkedIn-Agent

**Forfatter:** Philip Birkenborg Andersen
**Dato:** 2026-05-05
**Status:** Design godkendt, klar til implementations-plan

---

## 1. Formål

Et personligt hub-website på `birkenborg.dev` plus en autonom indholds-pipeline der publicerer 2-3 LinkedIn-posts om ugen. Sitet og pipelinen samler Philips position som **in-house jurist i sundhedssektoren der bygger AI-systemer i produktion** — og giver et offentligt sted at vise det.

Sitet er ikke et CV. Det er en personlig redaktion (skrifter + projekter + kort CV-side) i Anthropic-inspireret æstetik.

LinkedIn-pipelinen kører fuld-autopilot med en Telegram-baseret kill-switch, så Philip kan have ferie eller travle uger uden at content-strømmen stopper.

## 2. Positionering & brand

**Tagline (intern):** *In-house jurist i en reguleret sektor der bygger produktionssystemer med AI — og deler præcist hvad der virker, og hvor det fejler. Substansen kommer fra rigtige sager, ikke teori.*

**Differentierende elementer:**
- Bygger ikke teoretisk men i drift (10 agents, dokument-pipeline, retsklar.dk, ChainHub i alpha)
- Substansen kommer fra reguleret sektor (sundhedsdata, GDPR, klinikkæder)
- Selvironisk-skæv tone "inden for normen" — ikke meme-jurist, ikke konsulent-spam

**Ikke-mål:**
- Jobsøgning (Philip er ikke i markedet)
- Konsulenthvervning (ingen lead-gen-strategi i version 1)
- International rækkevidde (kun dansk)

## 3. Arkitektur

To repositories. Ét offentligt site, ét privat agent-system.

```
┌──────────────────────────────────────────────────────────────┐
│  birkenborg-dev      [PUBLIC GitHub repo]                    │
│  ──────────────────                                          │
│  /site               Astro static site                       │
│  /content/posts      Markdown-posts (én fil = én publikation)│
│  /content/projekter  Projektsider (retsklar, ChainHub, ...)  │
│  /content/cv.md      CV-data (single source of truth)        │
│  .github/workflows   build, Lighthouse-audit, sitemap-check  │
│                                                              │
│  → auto-deploy til Cloudflare Pages (birkenborg.dev)         │
└──────────────────────────────────────────────────────────────┘
                            ▲
                            │ PR via PUBLIC_REPO_PAT
                            │
┌──────────────────────────────────────────────────────────────┐
│  birkenborg-agents   [PRIVAT GitHub repo]                    │
│  ──────────────────                                          │
│  /scripts/                                                   │
│    ├── generate_drafts.py    Claude API → markdown drafts    │
│    ├── publish_post.py       LinkedIn API → publicerer       │
│    ├── refresh_token.py      LinkedIn OAuth refresh          │
│    └── telegram_bot.py       inbox + kill-switch handler     │
│  /prompts/                                                   │
│    ├── tone.md               tone-profil + few-shot-eksempler│
│    ├── post_templates.md     mønstre for forskellige posts   │
│    └── privacy_classifier.md tjek for #tandlægen-tag         │
│  /knowledge/                                                 │
│    ├── inbox.md              Telegram-input (auto-appended)  │
│    ├── themes.yaml           20-30 vinkel-templates          │
│    └── forbidden_terms.txt   må aldrig publiceres            │
│  .github/workflows/                                          │
│    ├── sunday_drafts.yml     ugentlig draft-generering       │
│    ├── weekday_publish.yml   daglig publish + Telegram       │
│    ├── friday_nudge.yml      ugentlig context-prompt         │
│    └── token_refresh.yml     LinkedIn OAuth fornyelse        │
└──────────────────────────────────────────────────────────────┘
```

**Cross-repo flow:** `birkenborg-agents` har en `PUBLIC_REPO_PAT` (Personal Access Token med `contents:write` og `pull_requests:write` scope kun mod `birkenborg-dev`). Drafts åbnes som PR; auto-merge fra workflow merger om mandagen hvis ingen STOP er modtaget.

## 4. Site-struktur & visuel design

### 4.1 Sider
- `/` — forside (hero + featured projekter + seneste skrifter)
- `/skrifter/` — alle skrifter (paginated)
- `/skrifter/[slug]/` — enkelt skrift (læsevenlig + Open Graph + JSON-LD)
- `/projekter/` — alle projekter
- `/projekter/[slug]/` — case-side per projekt (retsklar.dk, ChainHub, document-package, agent-system)
- `/cv/` — CV med download-link (PDF auto-genereret fra `cv.md`)
- `/kontakt/` — e-mail + LinkedIn + (evt. retsklar.dk-link)

### 4.2 Visuel identitet
**Farve-tokens (Anthropic-paletten):**

| Token | Hex | Brug |
|---|---|---|
| `--cream` | `#faf9f5` | Primær baggrund |
| `--cream-warm` | `#f5f1e8` | Sektioner, cards |
| `--gray-100` | `#e8e6dc` | Borders, dividers |
| `--gray-200` | `#d8d5c6` | Subtile borders |
| `--gray-400` | `#b0aea5` | Hjælpetekst |
| `--gray-700` | `#5a584f` | Brødtekst-mute |
| `--ink` | `#141413` | Primær tekst, dark UI |
| `--clay` | `#d97757` | Signatur-accent (Anthropic clay-orange) |
| `--clay-deep` | `#b85d40` | Hover/active states |
| `--clay-soft` | `#e8a087` | Subtile accenter |
| `--slate` | `#6a9bcc` | Status: production |
| `--sage` | `#788c5d` | Status: shipped/live |

**Typografi:**

| Rolle | Font | Open-source pendant til |
|---|---|---|
| Display (overskrifter) | **Fraunces** (variable, italic, optical-size, SOFT) | Anthropic Copernicus |
| Body serif | **Source Serif 4** | Anthropic Tiempos |
| UI / sans | **Geist** | Anthropic Styrene |

Fonte loades fra Google Fonts (preconnect, display=swap).

**Komposition (forside):**
- Sticky header med backdrop-blur (`rgba(250,249,245,.85)`)
- Wordmark: `birkenborg/dev` med slash i clay-orange
- Hero med eyebrow-pill (pulserende dot + "10 agents i produktion")
- Stor italic Fraunces-headline (clamp 48-88px)
- Live-status panel under hero (cream-warm baggrund, sage-grøn dot)
- Projekt-grid: 1 featured (mørk) + 2 lyse, med pills (Shipped/Alpha/Internal)
- Skrifter-liste: dato | titel | læsetid; hover slider højre + farve-skift
- Footer med stor Fraunces-signatur og links

**Animationer:**
- Hero-elementer: staggered fadeUp ved load (8px translate, 0.8-1s ease)
- Eyebrow-dot: pulse keyframe (2s infinite)
- Cards: hover lift + box-shadow transition
- Arrows: translateX på hover

## 5. Content-pipeline

### 5.1 Livscyklus for én post

| Tid | Aktør | Handling |
|---|---|---|
| Søndag 20:00 | `sunday_drafts.yml` | Læser `knowledge/inbox.md` + `themes.yaml` + sidste 7 dages public commits + RSS. Genererer 3 drafts. Åbner PR mod `birkenborg-dev`. |
| Mandag 06:00 | auto-merge (workflow) | Hvis ingen STOP via Telegram → PR merges. Filer i `/content/posts/` med `status: scheduled` og `publish_at` fordelt over ugen — typisk Mandag/Onsdag/Fredag kl. 09:00 (= 3 posts/uge målet fra spec). |
| Hverdag 08:00 | `weekday_publish.yml` | Telegram DM'er Philip: *"📝 Næste post (publishes 09:00): [første 200 tegn]. Reply STOP for at aflyse."* |
| Hverdag 09:00 | `weekday_publish.yml` | Hvis ingen STOP → POST til LinkedIn `/v2/ugcPosts`. Opdaterer fil til `status: published` + `linkedin_url`. Telegram kvittering. |
| Fredag 17:00 | `friday_nudge.yml` | Telegram DM: *"Næste uges temaer: A, B, C. Vil du tilføje noget?"* — ignoreres lydløst hvis intet svar. |
| #tandlægen-tagged | `weekday_publish.yml` | Omvendt default — kræver eksplicit YES inden 09:00, ellers flyttes til `/aborted/`. |

### 5.2 Post-fil-format

```markdown
---
title: "Hvorfor min M&A-agent fejlede på paragraf 30"
slug: "ma-agent-paragraf-30"
publish_at: 2026-05-12T09:00:00+02:00
status: scheduled  # draft | scheduled | published | aborted
tags: [ai, m&a, fejl-rapport]
privacy_flag: false
linkedin_url: null
---

[Post-indhold i markdown — kan være længere på sitet end på LinkedIn]

<!-- linkedin:start -->
[Den version der publiceres til LinkedIn — kortere, tilpasset format]
<!-- linkedin:end -->
```

LinkedIn-versionen er den der posts; sitet viser hele markdown-indholdet med fuld typografi.

## 6. Knowledge & tone

### 6.1 Knowledge-kilder
1. `knowledge/inbox.md` — Telegram-beskeder appendes med tidsstempel
2. `knowledge/themes.yaml` — 20-30 vinkel-templates (rotation)
3. Public GitHub commit-history for `birkenborg-dev` (sidste 7 dage)
4. RSS-feeds: 3-5 danske + engelske legal-tech kilder
5. `content/cv.md` + `content/projekter/*.md` (statisk kontekst)

### 6.2 Tone-profil (initial)
Lagres i `prompts/tone.md` som regler + few-shot eksempler.

**Regler:**
- Åbn med konkret hændelse, aldrig abstrakt påstand
- Vis fejl før løsning
- Aldrig "AI changes everything"-fraser, "game-changer", "revolutionary"
- Aldrig emoji-spam (max 1 pr. post hvis overhovedet)
- Selvironi acceptabelt; selvfornedrelse ikke
- Slut åbent eller med præcis pointe — aldrig "what do you think? 👀"
- Skæve hooks accepteret men inden for normen (eksempel: *"Min M&A-agent kunne læse hele aftalen, men den kunne ikke tælle."*)

**Few-shot:** kalibreres iterativt i implementation. Første batch baseret på Philips egne tekst-eksempler fra brainstorm-samtalen.

### 6.3 Themes (eksempel-bibliotek)
- AI-fejl-rapporter (konkrete cases)
- Agent-arkitektur-deep-dives
- GDPR i sundhedsdata
- Selskabsret + AI
- M&A og dokument-automation
- "Hvorfor jeg ikke bruger X til Y"
- Tilbageblik på shipped projekter
- Læringer fra produktionsdrift

## 7. Privacy & sikkerhed

### 7.1 Secrets (GitHub Secrets på `birkenborg-agents`)
- `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_REFRESH_TOKEN`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `ANTHROPIC_API_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `PUBLIC_REPO_PAT`

### 7.2 Privacy-gate (#tandlægen-tag)
- Hver draft scannes af Claude med `prompts/privacy_classifier.md`: "Indeholder denne post Tandlægen.dk-specifik info, klient-detaljer, eller forretnings-følsomt materiale?"
- Hvis JA → frontmatter `privacy_flag: true` → omvendt YES-default i Telegram-flow
- `forbidden_terms.txt` — eksplicit deny-liste (kunde-navne, modparter, beløb-format som "9 mio. kr."): hvis match → draft afvises automatisk og logges

### 7.3 Tandlægen.dk-policy (afspejler bruger-præference)
- Tandlægen.dk må nævnes som arbejdsgiver
- Generaliserede typer af opgaver må omtales ("klinikopkøb", "regulatoriske spørgsmål")
- ALDRIG: tal, modparter, kunder, interne procedurer, specifikke kontraktdetaljer

### 7.4 LinkedIn ToS-overholdelse
- Kun officiel API (`/v2/ugcPosts`) — ingen browser-automation
- Scope: `w_member_social` (godkendt produkt "Share on LinkedIn")
- Token-refresh hver 60. dag via `token_refresh.yml`; advarsel via Telegram 7 dage før udløb

## 8. Tech stack

| Komponent | Valg |
|---|---|
| Site framework | Astro (statisk, MD/MDX-native, indbygget SEO) |
| Styling | Vanilla CSS + CSS variables (design-tokens fra mockup) |
| Fonts | Fraunces + Source Serif 4 + Geist (Google Fonts) |
| Hosting | Cloudflare Pages (gratis, custom domain) |
| Analytics | Cloudflare Web Analytics (gratis, GDPR-venligt) |
| Lighthouse | GitHub Action `treosh/lighthouse-ci-action` (ugentlig audit) |
| Agent runtime | Python 3.13 |
| HTTP-klient | `httpx` |
| Claude SDK | `anthropic` |
| Telegram | `python-telegram-bot` |
| Cron | GitHub Actions (gratis i privat repo) |

## 9. Setup-prerequisites

| # | Setup | Hvem | Anslået tid |
|---|---|---|---|
| 1 | To GitHub repos (public + private) | Philip | 5 min |
| 2 | LinkedIn Developer App + "Share on LinkedIn"-godkendelse | Philip (Claude guider) | 15 min |
| 3 | Telegram bot via @BotFather + chat_id | Philip | 5 min |
| 4 | Anthropic API key | Philip (har) | 0 min |
| 5 | Cloudflare account + Pages-projekt | Philip | 10 min |
| 6 | Domæne `birkenborg.dev` (Cloudflare Registrar / Porkbun) | Philip, valgfrit i v1 | 10 min, ~120 kr/år |

## 10. Out of scope (YAGNI)

Følgende er **ikke** med i version 1:
- Engelsk sprog-version
- Kommentar-system på skrifter
- E-mail-nyhedsbrev / RSS-newsletter
- Mørkt tema-toggle
- Søgefunktion på sitet
- Multi-platform posting (X/Twitter, Mastodon, Bluesky)
- Lead-gen / kontakt-formular med backend
- A/B-test af post-tone
- Engagement-analyse fra LinkedIn API tilbage til agent (måske v2)
- Auto-generering af visuelle assets / cover-billeder

## 11. Succeskriterier (for v1 launch)

- ✅ `birkenborg.dev` (eller `*.pages.dev` initial) viser forside, skrifter, projekter, CV
- ✅ Lighthouse 95+ på Performance, Accessibility, Best Practices, SEO
- ✅ Søndag-cron genererer 3 drafts uden fejl, åbner PR
- ✅ Hverdag-cron publishes en scheduled post til LinkedIn API succesfuldt
- ✅ Telegram bot modtager DM'er, processer STOP-kommando, processer #tandlægen-YES-flow
- ✅ Mindst én post live på Philips LinkedIn-profil via API
- ✅ Mindst tre skrifter på birkenborg.dev/skrifter/
- ✅ Mindst tre projekt-sider (retsklar.dk, ChainHub, agent-system eller document-package)

## 12. Risici & afhjælpning

| Risiko | Sandsynlighed | Konsekvens | Afhjælpning |
|---|---|---|---|
| LinkedIn API afviser app-godkendelse | Lav | Hele LinkedIn-pipeline ude af drift | "Share on LinkedIn"-produktet er auto-godkendt for personlige profiler. Plan B: pivotering til scheduled-only via LinkedIn-native scheduler (semi-manuel) |
| Privacy-gate misser et følsomt udtryk | Lav-medium | Tandlægen-følsom info publiceres | Lag-baseret beskyttelse: classifier-prompt + forbidden_terms + #tandlægen-default-YES + Philips egen Telegram-monitor |
| Claude-genereret tone bliver generisk | Medium | Brand bliver utydeligt | Iterativ tone-justering via STOP-mønster-analyse efter første 4 ugers drift |
| GitHub Actions-cron kvoter overskrides | Meget lav | Pipeline pauser | Privat repo har 2000 min/md, vi bruger ~50 min/md |
| LinkedIn token-refresh fejler | Medium (hver 60. dag) | Posts kan ikke publishes | Telegram-advarsel 7 dage før udløb, manuel re-auth-flow dokumenteret |

## 13. Næste skridt

Efter approval af denne spec:
1. Invokér `superpowers:writing-plans` for detaljeret implementations-plan med opgave-rækkefølge og acceptance-kriterier per trin
2. Setup-prerequisites (afsnit 9) håndteres parallelt med kode-arbejde
3. Implementation foreslås opdelt i 3 milestones:
   - **M1: Site MVP** — Astro-skelet, design-tokens, forside + skrifter + projekter + cv. Live på `*.pages.dev`.
   - **M2: Pipeline core** — generate_drafts + publish_post + Telegram bot uden #tandlægen-gate. Første post live på LinkedIn.
   - **M3: Privacy gate + nudges** — privacy_classifier, forbidden_terms, friday_nudge, token_refresh.
