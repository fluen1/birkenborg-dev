# birkenborg-dev — project rules

Inherits all global rules fra `C:\Users\birke\.claude\CLAUDE.md`. Tilføjelserne herunder gælder kun dette projekt.

## Arkitektur-kontekst
Autonom Telegram-til-LinkedIn pipeline + statisk site. Worker kører i Cloudflare Workers, site er statisk SSG. Indholdsfacader kobles via deterministiske transforms i `worker/`; sproglig vurdering kobles via LLM-kald.

## Rule 5 — Use the model only for judgment calls
LLM-kald i pipelinen skal kun bruges til:
- Klassifikation (er denne Telegram-besked værd at poste?)
- Udkast (generér LinkedIn-post-tekst fra rå seed)
- Opsummering, ekstraktion, ton-kalibrering

LLM-kald må IKKE bruges til:
- Routing (hvilken Telegram-kanal → hvilken handler) — det er code med en lookup-tabel
- Retry-logik på 5xx / rate-limits — det er deterministisk backoff
- Status-code handling, schema-validering, ID-genkendelse — det er code
- Deterministiske transforms (dato-formatering, slug-generering, frontmatter-merging)

**Hvorfor:** En tidligere version af pipelinen brugte LLM til at beslutte retry-policy; det flakede efter 2 ugers stabilitet. Kode der kan svare deterministisk skal svare deterministisk.

**Praktisk:** Hvis du tilføjer et nyt LLM-kald, dokumentér i koden hvilken af de fire kategorier ovenfor det falder i. Hvis ingen passer, brug kode i stedet.

## Privacy
Følg `feedback_privacy_tandlaegen` i auto-memory: Tandlægen.dk må nævnes som arbejdsgiver, aldrig tal/modparter/sager. Posts med #tandlægen-tag i frontmatter skal manuelt review'es før publish.

## Content tone
Følg `feedback_content_tone` — bygger-fortælleren, skæv inden for normen, ingen consultant-fraser. De 8 kalibrerede toner er dokumenteret i auto-memory.

## Repo-layout i én linje
`site/` = Astro 6 SSG; `worker/` = Cloudflare Worker (site-assets + `/api/chat` + `/api/activity`); `scripts/` = build-tid pipeline (corpus, marginalia); `content/` = markdown-posts + projekter; `docs/superpowers/` = specs + plans. NB: Telegram-til-LinkedIn-botten kører i en SEPARAT worker (`bot.birkenborg.dev`, repo `birkenborg-agents`) — ikke i dette repo; her kaldes den kun via `/internal/highlights`.

## Content-format-kontrakt for `content/posts/*.md`

Hver post kan indeholde to versioner adskilt af HTML-kommentar-markører:

```markdown
Web-essay her…

<!-- linkedin:start -->
LinkedIn-version her…
<!-- linkedin:end -->
```

- Markør-konstanten lever i `site/src/lib/linkedin-block.mjs` (eksporteret som `LINKEDIN_MARKER_START`). Alt fra `<!-- linkedin:start -->` og frem strippes både af site-rendering (via `site/src/lib/remark-strip-linkedin.mjs`) og af `scripts/build-corpus.mjs`.
- `privacy_flag: false` skal eksplicit være sat for at posten kommer med i RAG-corpus (default-deny).
- `status: 'published'` skal være sat for at posten rendres på `/skrifter`.
- Kun `linkedin_url` (frontmatter) styrer "Læs også på LinkedIn →"-link i footer — ikke body-content.

## Generated files — rør ALDRIG direkte

Disse filer bygges af `scripts/build-corpus.mjs` (kører som npm `predev` / `prebuild`-hook). Manuelle edits overskrives ved næste build:

- `worker/data/chat-corpus.json`
- `site/src/data/chat-citations.json`
- `site/public/voice-samples.json`
- `site/public/api/_corpus.json`

Hvis content skal opdateres: edit kilde-markdown i `content/posts/`, kør `node scripts/build-corpus.mjs`.

Tilsvarende for marginalia: `scripts/build-marginalia*` er kilden — output må ikke editeres direkte.

## Definition of Done

Før en task markeres complete:

1. `npm test` (repo-root) — worker + scripts tests grønne.
2. `cd site && npm test` — site tests grønne.
3. `cd site && npm run build` — succeeds uden fejl.
4. Hvis `content/posts/` ændret: bekræft at `npm run prebuild` (som er `node scripts/build-corpus.mjs`) genererer corpus uden fejl.
5. Hvis UI-ændringer: visual check via `cd site && npm run dev` på `http://localhost:4321`.
6. Hvis worker-ændringer: tests dækker det, eller manuelt verificér med `wrangler dev` før push.

Verifikationen skal være _evidens_, ikke et løfte — kør kommandoerne, læs output, citér resultatet før "done"-claim.

## Test-konventioner

- Root `vitest.config.ts` picker `worker/**/*.test.ts` + `scripts/**/*.test.ts` (Node-env).
- `site/vitest.config.ts` picker `site/src/**/*.test.ts` (happy-dom-env).
- E2E er Playwright i `site/`: `cd site && npm run e2e`.
- Lighthouse CI kører via GitHub Actions (`.github/workflows/lighthouse.yml`); rør ikke `lighthouserc.json` uden grund.

## Cross-directory imports

`scripts/build-corpus.mjs` importerer fra `../site/src/lib/linkedin-block.mjs`. Det er bevidst — markør-kontrakten skal leve ét sted. Hvis enten `scripts/` eller `site/` flyttes/refaktoreres, skal denne import opdateres samtidig. Begge er kommenterede in-line; lad være med at "rense op" ved at duplikere logikken.

## Branch & deploy

- Arbejder normalt direkte på `main` (personlig site, ingen team). Auto-mode bør stadig respektere: ingen `git push --force`, ingen `git reset --hard`, ingen edits i `.github/workflows/*.yml` uden eksplicit bekræftelse.
- Deploy af site: Cloudflare Pages bygger `main` automatisk via push.
- Deploy af worker: `wrangler deploy` — kræver eksplicit bekræftelse, aldrig auto.
- Secrets ligger i `wrangler secret`-store, ikke i repo. `.env` er kun lokal dev.

## Skrifter — privatlivshygiejne ved nye posts

Når du opretter en ny post under `content/posts/`:
- Sæt `privacy_flag: true` som default; flip til `false` først efter manuel review.
- Tags som `#tandlægen` triggrer manuel review (jf. Privacy-sektionen ovenfor).
- LinkedIn-blok er valgfri — ikke alle posts skal have én. Hvis tilstede, hold under markørerne og lad være med at duplikere essay-teksten ordret.
