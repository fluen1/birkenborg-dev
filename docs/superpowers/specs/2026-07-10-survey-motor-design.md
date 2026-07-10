# Survey-motoren: /undersoegelse + /internal/survey + neutral mail — design

**Dato:** 2026-07-10
**Status:** funktionelt design godkendt af Philip via visuelt artefakt (claude.ai artefakt d1768012, v2 uden præmie) + eksplicit "lad os gå i gang". Tekniske valg truffet af agenten jf. decision-authority-aftalen.
**Repos:** `birkenborg-dev` (siden) + `birkenborg-agents` (endpoint + mail-materiale)
**Juridisk grundlag:** FO's Spamforbuddet-vejledning 2021 s. 17-19 + sager 15/08087, 10/09158, 15/11580 (memory: `reference_mfl10_survey_praksis`). Neutral survey-mail B2B er uden for MFL § 10; branding-tærsklen er meget lav.

## Mål

Lovlig lead-motor: neutral mail-invitation → rent spørgeskema på birkenborg.dev → samtykke-kryds
forvandler anonyme svar til varme, lovligt kontaktbare leads. Batch #1's 10 leads (arkiveret som
e-mail-salgsbatch) genbruges som modtagere af den neutrale survey-invitation.

## Del A — `/undersoegelse` (birkenborg-dev)

- Ny side `site/src/pages/undersoegelse.astro`. **INGEN Header/Footer/site-nav** — juridisk krav:
  den linkede side må ikke indeholde markedsføring. Kun tekst-identitet øverst
  ("Philip Birkenborg Andersen · cand.merc.(jur.)"), ingen links til andre sider på sitet.
- `<meta name="robots" content="noindex">` — kampagneside, skal ikke ligge i SERP'er.
- Indhold = artefaktets station 2, verbatim: titel "Hvordan bruger danske SMV'er jura og AI i 2026?",
  intro (anonymitet, ~3 min., ingen cookies), 8 spørgsmål:
  1. Antal ansatte (radio: 1-9 / 10-49 / 50-99 / 100-199 / 200+)
  2. Jurist in-house? (radio: fuldtid / deltid-kombineret / nej-eksterne / nej-selv)
  3. Hvem løser juridiske opgaver? (checkbox: advokatfirma / revisor-rådgiver / brancheforening / googler-skabeloner / AI-værktøjer)
  4. Hvilke juridiske opgaver fylder mest? (checkbox-chips: kontrakter / ansættelsesret / GDPR-data / selskabsforhold / tvister-inkasso / udbud)
  5. Bruger I AI i driften? (radio: bredt / enkelte / nej-overvejer / nej)
  6. Hvad bruges/overvejes AI til? (checkbox-chips: tekst-kommunikation / kundeservice / sagsbehandling / økonomi-bogholderi / tilbud-salg)
  7. Overblik over AI-leverandøraftaler (data-ejerskab/ansvar)? (radio: ja / delvist / nej / ved-ikke)
  8. Største bekymring ved (mere) AI? (checkbox-chips: datasikkerhed / fejl-i-output / jura-ansvar / medarbejder-accept / ikke-noget)
  + samtykke-blok (fremhævet): checkbox "Ja — send mig undersøgelsens resultater, og kontakt mig
  gerne med opfølgning, der er relevant for mine svar. Samtykket kan til enhver tid trækkes tilbage."
  + e-mail-felt (kun aktivt/relevant ved kryds) + submit + fodnote "Besvarelser uden e-mail er fuldt
  anonyme. Ingen cookies, ingen tracking."
- Client-JS: samler svar → POST JSON til `https://bot.birkenborg.dev/internal/survey`; succes-tilstand
  ("Tak for hjælpen") erstatter formularen; fejl-tilstand med retry-tekst. E-mail-felt kræves når
  samtykke er krydset (client + server). Query-param `?k=<kilde>` (fx `mail1`, `li`) medsendes som
  `kilde` — kanal-måling, ikke persontracking.
- Æstetik: sitets egen (Fraunces/cream/clay-tokens) men standalone layout. Mobilvenlig.
- Sitemap: siden bør ikke optræde i sitemap (noindex-konsistens) — brug Astro-sitemap-exclude hvis
  integrationen kræver det; ellers accepteret som minor.

## Del B — `/internal/survey`-endpoint (birkenborg-agents worker)

- Nyt endpoint i `worker/src/internal.ts` (samme fil/mønster som `handleLead`): POST JSON.
- Validering: `svar` = objekt med q1-q8 (kendte nøgler, kendte værdier — whitelist, ikke fritekst;
  checkbox-felter = arrays af kendte værdier), `samtykke` boolean, `email` valgfri streng
  (kræves og valideres KUN hvis samtykke=true; **ignoreres/afvises hvis samtykke=false** —
  anonymitetsløftet håndhæves server-side), `kilde` valgfri kort streng (whitelist-agtig sanitering,
  max 24 tegn).
- Rate-limit som `/internal/lead` (genbrug eksisterende mekanisme).
- Lagring: KV `SURVEY:<timestamp>:<random>` (samme KV-namespace som leads, prefix `survey:`) med
  fuld besvarelse + consent + kilde + tidsstempel. **Ingen TTL** (data skal bruges til rapporten).
- Telegram-DM til Philip pr. besvarelse: kompakt svar-resumé + tydelig markering
  "✅ SAMTYKKE + email" eller "anonym".
- Svar: `{ok:true}` / 400 med fejlkode. CORS: siden er same-brand men andet origin
  (birkenborg.dev → bot.birkenborg.dev) — genbrug den CORS-håndtering `/internal/lead` har
  (LeadForm poster allerede cross-origin, så mønstret findes; kopiér det).
- TDD: happy path anonym, happy path m. samtykke+email, samtykke uden email → 400,
  email uden samtykke → email droppes (eller 400 — vælg og testfæst), ukendte svar-værdier → 400,
  rate-limit.

## Del C — mail-materiale (birkenborg-agents, ingen kode)

- Ny `outreach/survey-mail-2026-07.md`: den GRØNNE mail fra artefaktet verbatim (uden præmie):
  emne "Kort undersøgelse: hvordan bruger danske SMV'er jura og AI?", formålsbeskrivelse,
  3 minutter/anonymt, link KUN til `https://birkenborg.dev/undersoegelse?k=mail1`, neutral signatur
  (navn, cand.merc.(jur.), birkenborg.dev som ren tekst-identitet).
  **Bevidst IKKE personaliseret ud over [fornavn]** — ingen firma-specifik åbningslinje
  (personaliseret smiger nærmer sig markedsføring; neutral er både sikrere og enklere).
- §10-regelblok øverst i filen (må ikke ændres uden re-check mod vejledningen): ingen ydelses-omtale,
  intet ambitions-sprog, ingen links til andet end skemaet, ingen vedhæftninger.
- Modtagerliste: de 10 leads fra `batch-2026-07-10.md` (navn + email refereres, gates allerede
  verificeret). Tracker: ny status-værdi `survey-klar` på de 10 rækker.
- **Philip sender selv**, efter egen ordlyds-QA. Agenten sender ALDRIG.

## Rækkefølge og gates

1. Del B (endpoint, TDD) → 2. Del A (siden, E2E) → 3. Del C (materiale). Commits på main i begge
   repos. **Push + deploy kræver Philips eksplicitte OK** (push af agents auto-deployer workeren).
   Efter deploy: live-test af hele kæden (anonym + samtykke-besvarelse → Telegram-DM) FØR Philip
   sender noget.

## Succeskriterier

- Worker-tests grønne inkl. de 6 nye TDD-cases; fuld suite uden regressioner.
- Siden bygger, E2E-test bekræfter: ingen nav-links, 8 spørgsmål, samtykke-blok, noindex.
- Live-kæde bevist efter deploy (200 + DM for både anonym og samtykke-besvarelse).
- Mail-materiale klar til Philips QA med §10-regelblok.

## Eksplicit fravalgt (YAGNI)

- Præmie/lodtrækning (Philips fravalg 10/7 — lovligt men ingen præmie at give).
- Admin-UI/eksport af besvarelser (rapport-fasen henter fra KV når den kommer — separat spor).
- LinkedIn-distribution (afventer tone-/stil-arbejdet — eget spor).
- Multi-side-survey/progress-bar, D1-lagring, e-mail-bekræftelser.
