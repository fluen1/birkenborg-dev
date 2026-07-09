# /arbejd-sammen v2: produktiserede pakker + outreach-batch #1 — design

**Dato:** 2026-07-09
**Status:** godkendt af Philip (design-samtale 9/7)
**Repos:** `birkenborg-dev` (del A) + `birkenborg-agents` (del B — ingen ny kode)

## Baggrund og mål

birkenborg.dev har reelt nul organisk trafik (GSC: 1 klik / 8 visninger totalt over juni+juli).
Jura-generalist-SEO-motoren er 1 uge gammel og bygger fundamentet langsigtet, men på kort
sigt er den eneste realistiske indtjeningsvej **freelance/ad-hoc jura+AI solgt via outreach**,
med sitet som konverteringsflade og bevis — ikke som trafikkilde.

Landkortet over indtjeningsveje blev gennemgået 9/7; Philip valgte spor **#1+#2: freelance +
produktiserede pakker**. Digitale produkter/nyhedsbrev genbesøges når SEO-motoren har leveret
målbar trafik (tidligst august). Affiliate/sponsorering på birkenborg.dev er fravalgt permanent
(undergraver karriere-/autoritets-positioneringen).

**Afklarede gates (9/7):**
- Konkurrenceklausul/bibeskæftigelse: **tjekket — fri bane.**
- CVR: oprettes **først ved første varme lead** (Philips egen handling; ingen flaskehals — outreach
  starter samtaler, sælger ikke).

## Del A — /arbejd-sammen v2 (birkenborg-dev)

`site/src/pages/arbejd-sammen.astro` opgraderes fra generisk "tag en samtale" til en konkret
hylde med tre pakke-kort med fast pris + en timepris-bundlinje:

| Pakke | Pris (ekskl. moms) | Leverance |
|---|---|---|
| AI-kontrakt-tjek | 7.500 kr | Gennemgang af AI-/SaaS-leverandøraftale (ansvar, data, IP, exit) → rød/gul/grøn-rapport med konkrete rettelser |
| AI+jura sundhedstjek | 12.500 kr | Virksomhedens AI-brug holdt op mod GDPR/AI Act + kontraktgrundlag → prioriteret handlingsliste |
| Automatiserings-audit | 20.000 kr | 2-3 gentagne arbejdsgange kortlagt med automatiseringsforslag + juridisk risikovurdering af løsningen |
| Ad-hoc sparring | 1.800 kr/t | Uafgrænsede spørgsmål — bundlinje under pakkerne, må ikke stjæle billedet |

**Krav til hvert pakke-kort:** hvad du får (leverance + format), leveringstid, hvem det er til.
Automatiserings-audit fremhæves som differentiatoren (jura + bygger i én profil).

**Bevares urørt:** `LeadForm` (niche="smv") → worker `/internal/lead` → Telegram-DM;
Header/Footer/MetaTags-mønstre; eksisterende URL `/arbejd-sammen/`.

**Tone:** `feedback_content_tone` — bygger-fortælleren, ingen consultant-fraser. Priserne står
åbent (transparens-signal, filtrerer useriøse fra).

**Ingen** nye systemer, worker-ændringer, betalingsflow eller nye afhængigheder.

**DoD (repo-CLAUDE.md):** `npm test` (root) + `cd site && npm test` + `npm run build` grønne;
visual check på localhost:4321; Lighthouse-CI må ikke regressere.

## Del B — outreach-batch #1 (birkenborg-agents, ingen ny kode)

Eksisterende maskine affyres for første gang, freelance-segmentet:

1. **Lead-finding:** PE-portfolio-mining efter `outreach/lead-finding-playbook.md`
   → **10 kvalificerede leads**: ikke-reklamebeskyttet (gater freelance-benet), dansk-ejet
   (ingen udenlandsk moder), zone Lyngby+30km, ~20-200 ansatte.
2. **Udkast:** `scripts/draft_outreach.py --segment freelance` (A/B-positionering som designet
   22/6) — personaliserede udkast der nu peger på en **konkret pakke med pris** i stedet for
   abstrakt "jura+AI". Pakkevalg matches til lead'ets situation.
3. **Måling:** UTM-links til `/arbejd-sammen` i hvert udkast; LeadForm-submits lander som
   Telegram-DM (eksisterende).
4. **Send-flow:** alt klargøres i Send-klar-stil + `outreach/tracker.csv` opdateres.
   **Philip sender selv fra egen mail** — agenten rører aldrig send-knappen (trust boundary:
   tredjepart). GDPR-/brand-disciplin: manuel afsendelse, lille marked.

**Rækkefølge:** Del A først (outreach skal have noget at pege på), derefter Del B i samme session.

## Succeskriterier

- `/arbejd-sammen` live med 3 pakker + timepris, alle DoD-tjek grønne.
- 10 personaliserede udkast klargjort med UTM, tracker opdateret, klar i Send-klar-stil.
- Efter afsendelse (Philip): ≥1 svar = læringssignal der former batch #2.
  **0 svar på 10 → pitch justeres før der skaleres — vi skalerer ikke støj.**

## Eksplicit fravalgt (YAGNI)

- Betalingsflow/checkout på sitet (fakturering sker manuelt efter aftale).
- Nyhedsbrev-opsamling (eget spor, genbesøges ved målbar SEO-trafik).
- Digitale produkter/skabeloner (kræver publikum + ansvarsafklaring).
- Auto-send af outreach (Fase 3-territorium; kræver valideret pitch først).
- Ændringer i SEO-motor, LinkedIn-pipeline eller worker.
