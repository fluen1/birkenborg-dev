# /arbejd-sammen v2 + outreach-batch #1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Opgradér `/arbejd-sammen` til en pakkeside med 3 fastpris-pakker + timepris, og klargør første outreach-batch (10 freelance-leads) der peger på pakkerne.

**Architecture:** Del A er en ren statisk side-ændring i `birkenborg-dev` (Astro SSG, CF Pages auto-deploy ved push). Del B er operationelt arbejde i `birkenborg-agents` — ingen ny kode, kun template-opdatering, lead-mining efter eksisterende playbook og udkast via eksisterende `draft_outreach.py`. Ingen worker-ændringer.

**Tech Stack:** Astro 6, Playwright (E2E i `site/`), Python 3 (`scripts/draft_outreach.py`, kræver `ANTHROPIC_API_KEY` i `birkenborg-agents/.env`).

**Spec:** `docs/superpowers/specs/2026-07-09-arbejd-sammen-pakker-outreach-design.md`

## Global Constraints

- **Priser (verbatim, ekskl. moms):** AI-kontrakt-tjek **7.500 kr.** · AI+jura sundhedstjek **12.500 kr.** · Automatiserings-audit **20.000 kr.** · Ad-hoc sparring **1.800 kr./t**. "Alle priser er ekskl. moms" skal stå på siden.
- **Tone:** `feedback_content_tone` — bygger-fortælleren, ingen consultant-fraser ("skræddersyet", "værdiskabende", "løftestang" er forbudte). Ingen sælger-flow-sprog.
- **Bevares urørt:** `LeadForm.astro`, worker (`/internal/lead`), URL `/arbejd-sammen/`, `_redirects` (`/smv/ → /arbejd-sammen/` 301 består).
- **Trust boundary:** intet outreach sendes af agenten — alt klargøres, Philip sender selv fra egen mail.
- **Git:** commits på `main` (begge repos, normal praksis her). **Ingen push uden Philips eksplicitte OK** (push til birkenborg-dev deployer sitet).
- **DoD birkenborg-dev (repo-CLAUDE.md):** `npm test` (root) + `cd site && npm test` + `cd site && npm run build` grønne; E2E via `cd site && npm run e2e`; visual check på `http://localhost:4321`.
- **Freelance-gate:** alle 10 leads SKAL være ikke-reklamebeskyttede (tjekket på datacvr.virk.dk-detaljeside, felt "Reklamebeskyttelse: Nej") og dansk-ejede (ingen udenlandsk moder).

---

### Task 1: /arbejd-sammen v2 — pakkeside (birkenborg-dev)

**Files:**
- Modify: `site/src/pages/arbejd-sammen.astro` (hele filen erstattes, se Step 3)
- Modify: `site/src/tests/pages.spec.ts` (tilføj 1 test nederst)

**Interfaces:**
- Consumes: `LeadForm.astro` (`<LeadForm niche="smv" />` — Props: `niche: 'klinik' | 'konsulent' | 'smv'`), `Base`/`Header`/`Footer`/`MetaTags` som i dag.
- Produces: live side med `.pakker article`-kort (3 stk.) og `.adhoc`-linje — Task 2's template-links peger hertil med UTM.

- [ ] **Step 1: Skriv fejlende E2E-test**

Tilføj nederst i `site/src/tests/pages.spec.ts`:

```ts
test('/arbejd-sammen viser 3 pakker med faste priser + timepris', async ({ page }) => {
  await page.goto('/arbejd-sammen/');
  const cards = page.locator('.pakker article');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('AI-kontrakt-tjek');
  await expect(cards.nth(0)).toContainText('7.500 kr.');
  await expect(cards.nth(1)).toContainText('AI+jura sundhedstjek');
  await expect(cards.nth(1)).toContainText('12.500 kr.');
  await expect(cards.nth(2)).toContainText('Automatiserings-audit');
  await expect(cards.nth(2)).toContainText('20.000 kr.');
  await expect(page.locator('.adhoc')).toContainText('1.800 kr./t');
  await expect(page.locator('main')).toContainText('ekskl. moms');
  await expect(page.locator('form.lead-form')).toBeVisible();
});
```

- [ ] **Step 2: Kør testen — verificér FAIL**

Run: `cd site && npm run e2e -- --grep "3 pakker"`
Expected: FAIL — `.pakker article` count er 0 (siden har i dag `.value-props`, ingen priser).

- [ ] **Step 3: Erstat sidens indhold**

Erstat HELE `site/src/pages/arbejd-sammen.astro` med:

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import LeadForm from '../components/LeadForm.astro';
import MetaTags from '../components/MetaTags.astro';

const SITE_URL = 'https://birkenborg.dev';
const PAGE_URL = `${SITE_URL}/arbejd-sammen/`;
const PAGE_TITLE = 'Jura + anvendt AI — faste pakker · birkenborg.dev';
const PAGE_DESC =
  'Tre faste pakker i krydsfeltet jura og AI: kontrakt-tjek, sundhedstjek og automatiserings-audit. Faste priser, ingen sælger-flow.';

const pakker = [
  {
    navn: 'AI-kontrakt-tjek',
    pris: '7.500 kr.',
    hvad: 'Jeres AI- eller SaaS-leverandøraftale gennemgået: ansvar, data, IP og exit.',
    faar: 'Rød/gul/grøn-rapport med konkrete rettelser — klar til forhandlingen.',
    tid: 'Levering: 5 hverdage.',
    til: 'Til jer der skal skrive under på en AI-aftale — eller allerede har gjort det.',
  },
  {
    navn: 'AI+jura sundhedstjek',
    pris: '12.500 kr.',
    hvad: 'Jeres AI-brug holdt op mod GDPR, AI Act og jeres kontraktgrundlag.',
    faar: 'Prioriteret handlingsliste: hvad der haster, hvad der kan vente, hvad der er fint.',
    tid: 'Levering: 2 uger.',
    til: 'Til jer der bruger AI i driften og vil vide, om det holder.',
  },
  {
    navn: 'Automatiserings-audit',
    pris: '20.000 kr.',
    hvad: '2-3 gentagne arbejdsgange kortlagt med automatiseringsforslag og juridisk risikovurdering.',
    faar: 'Beslutningsklar rapport: hvad der kan automatiseres, hvad det kræver, og hvor jura sætter grænser.',
    tid: 'Levering: 3 uger.',
    til: 'Til jer der bruger for mange timer på det samme — og vil have løsning og lovlighed vurderet ét sted.',
  },
];
---
<Base title={PAGE_TITLE}>
  <Fragment slot="head">
    <MetaTags title={PAGE_TITLE} description={PAGE_DESC} url={PAGE_URL} type="website" />
  </Fragment>
  <Header />
  <main class="page">
    <div class="container">
      <header class="page-head">
        <p class="meta">Jura + anvendt AI</p>
        <h1>En jurist, der også bygger løsningen</h1>
        <p class="lead">
          Jeg er cand.merc.(jur.) og Legal Counsel — og jeg bygger selv de AI- og
          automatiseringsløsninger, der fjerner det gentagne arbejde. Tre faste pakker,
          faste priser. Rådgivning og eksekvering i én profil.
        </p>
      </header>

      <section class="pakker" aria-label="Pakker med fast pris">
        {pakker.map((p) => (
          <article>
            <h2>{p.navn}</h2>
            <p class="pris">{p.pris}</p>
            <p>{p.hvad}</p>
            <p><strong>I får:</strong> {p.faar}</p>
            <p class="detalje">{p.tid}</p>
            <p class="detalje">{p.til}</p>
          </article>
        ))}
      </section>

      <p class="adhoc">
        Andet på hjerte? Ad-hoc sparring til <strong>1.800 kr./t</strong> — kontrakter,
        selskabsret, compliance eller det tekniske. Alle priser er ekskl. moms.
      </p>

      <section class="contact">
        <h2>Tag en kort samtale</h2>
        <p>
          Skriv hvilken pakke (eller hvilket problem) det handler om. Jeg vender tilbage
          inden for 24 timer på hverdage. Ingen sælger-flow.
        </p>
        <LeadForm niche="smv" />
      </section>
    </div>
  </main>
  <Footer />
</Base>

<style>
  .page { padding: 64px 0 96px; }
  .page-head { max-width: 720px; margin: 0 auto 48px; }
  .meta { font-size: 12px; letter-spacing: .15em; text-transform: uppercase; color: var(--gray-700); margin: 0 0 16px; }
  .page-head h1 { font-family: var(--font-display); font-size: clamp(36px, 5vw, 56px); font-weight: 350; letter-spacing: -.02em; margin: 0 0 16px; }
  .lead { font-size: 18px; line-height: 1.5; color: var(--gray-700); }
  .pakker { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 48px 0 24px; }
  .pakker article { padding: 24px; border: 1px solid var(--gray-200); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 10px; }
  .pakker h2 { font-size: 18px; margin: 0; }
  .pakker p { margin: 0; color: var(--gray-700); font-size: 15px; line-height: 1.5; }
  .pakker .pris { font-family: var(--font-display); font-size: 26px; color: var(--ink); }
  .pakker .detalje { font-size: 13px; }
  .adhoc { max-width: 720px; margin: 0 0 24px; color: var(--gray-700); font-size: 15px; }
  .contact { margin-top: 48px; max-width: 720px; }
  .contact h2 { font-size: 24px; margin: 0 0 16px; }
</style>
```

- [ ] **Step 4: Kør E2E — verificér PASS**

Run: `cd site && npm run e2e -- --grep "3 pakker"`
Expected: PASS. Kør derefter fuld E2E: `cd site && npm run e2e` — alle tests grønne (200-tjekket i `alle sider returnerer 200` dækker `/arbejd-sammen/` allerede).

- [ ] **Step 5: Fuld DoD-verifikation**

Run (fra repo-rod): `npm test` → grøn. `cd site && npm test` → grøn. `cd site && npm run build` → succeeds.
Expected: alle tre grønne — citér output, ikke løfter.

- [ ] **Step 6: Visual check**

Run: `cd site && npm run dev` → åbn `http://localhost:4321/arbejd-sammen/` (screenshot via browser-tool eller Playwright `page.screenshot`). Tjek: 3 kort side om side på desktop, stakket på mobil-bredde, priser tydelige, LeadForm intakt nederst. Dark mode: toggle og tjek kontrast på `.pris`.

- [ ] **Step 7: Commit**

```bash
git add site/src/pages/arbejd-sammen.astro site/src/tests/pages.spec.ts
git commit -m "feat(site): /arbejd-sammen v2 — 3 fastpris-pakker + timepris"
```

---

### Task 2: Freelance-template peger på pakkerne (birkenborg-agents)

**Files:**
- Modify: `C:\Users\birke\Projects\birkenborg-agents\outreach\smv-freelance-template.md`

**Interfaces:**
- Consumes: pakkenavne + priser fra Task 1 (verbatim fra Global Constraints).
- Produces: opdateret template som Task 4's udkast følger (UTM-format `utm_source=email&utm_campaign=smv-freelance-a|b`).

- [ ] **Step 1: Opdatér template**

Tre ændringer i `smv-freelance-template.md`:

1. **Link-linjen (top):** erstat
   `Link altid til birkenborg.dev med UTM: https://birkenborg.dev/smv?utm_source=email&utm_campaign=smv-variant-a (eller -b)`
   med
   `Link altid direkte til pakkesiden med UTM: https://birkenborg.dev/arbejd-sammen/?utm_source=email&utm_campaign=smv-freelance-a (eller -b)`

2. **Begge varianter (A + B):** erstat sætningen `Eksempler: birkenborg.dev` med:
   `Jeg har tre faste pakker (fx AI-kontrakt-tjek til 7.500 kr. og automatiserings-audit til 20.000 kr.) — se birkenborg.dev/arbejd-sammen`
   (i udkastene indsættes den pakke der matcher lead'et, jf. Task 4 Step 2).

3. **Tilføj sektion nederst:**

```markdown
## Pakke-match (vælg i udkastet — nævn ÉN pakke, ikke alle tre)

- Lead har AI-/SaaS-leverandører eller er ved at købe AI ind → **AI-kontrakt-tjek, 7.500 kr.**
- Lead bruger synligt AI i drift/produkt (jobopslag, site, presse) → **AI+jura sundhedstjek, 12.500 kr.**
- Lead har mange ens sager/manuelle flows (service-virksomhed, multi-site) → **Automatiserings-audit, 20.000 kr.**
- Uklart match → nævn ad-hoc sparring 1.800 kr./t i stedet for at gætte.
```

- [ ] **Step 2: Verificér**

Run: `grep -n "arbejd-sammen\|7.500\|smv-freelance-" outreach/smv-freelance-template.md`
Expected: UTM-linjen + pakke-priser til stede; `grep -n "birkenborg.dev/smv?" outreach/smv-freelance-template.md` giver 0 hits.

- [ ] **Step 3: Commit**

```bash
git add outreach/smv-freelance-template.md
git commit -m "docs(outreach): freelance-template peger paa /arbejd-sammen-pakker med UTM"
```

---

### Task 3: Lead-mining — 10 kvalificerede freelance-leads (birkenborg-agents)

**Files:**
- Create: `C:\Users\birke\Projects\birkenborg-agents\outreach\batch-2026-07-10.md`
- Modify: `C:\Users\birke\Projects\birkenborg-agents\outreach\tracker.csv` (10 nye rækker)

**Interfaces:**
- Consumes: `outreach/lead-finding-playbook.md` (ICP, hårde gates, kanaler — LÆS DEN FØRST, afvig aldrig fra gates).
- Produces: 10 leads i `batch-2026-07-10.md` med felterne: firma, CVR-nr, kontaktperson+rolle, email/LinkedIn, kilde (PE-fond/portefølje), site-URL, reklamebeskyttet=Nej (verificeret dato), ejerskab=dansk (verificeret), pakke-match (én af de tre + begrundelse i én linje), variant (A/B). Task 4 læser denne fil.

- [ ] **Step 1: Læs playbook + genopfrisk gates**

Læs `outreach/lead-finding-playbook.md` komplet. Hårde gates: ikke-reklamebeskyttet (datacvr-detaljeside), dansk-ejet (ingen udenlandsk moder), zone Lyngby+30km (kommunekoder i playbook), ~20-200 ansatte. Kanal-prioritet: PE-portfolio-mining (CataCap/Capidea/GRO m.fl. — bevist 23/6) > Gazelle-lister > datacvr-filter.

- [ ] **Step 2: Mine kandidater (web-research)**

Gennemgå 3-4 PE-fondes porteføljesider + evt. Gazelle-listen. Saml ~20 kandidater (navn, site, hvorfor interessant) — forvent ~50% frafald i kvalificering.

- [ ] **Step 3: Kvalificér mod gates på datacvr.virk.dk**

For hver kandidat: slå op på datacvr → tjek "Reklamebeskyttelse: Nej", dansk ejerskab (reelle ejere/legal ejer), antal ansatte, adresse i zone. Notér CVR-nr + verifikationsdato. Stop ved 10 godkendte. **Falder en kandidat på ÉN gate: ud — ingen undtagelser.**

- [ ] **Step 4: Pakke-match + variant-fordeling**

For hver af de 10: vælg pakke efter Task 2's pakke-match-tabel (én linjes begrundelse). Fordel varianter: lead 1-5 → variant A, lead 6-10 → variant B (deterministisk, så A/B-målingen er ren).

- [ ] **Step 5: Skriv batch-fil + tracker-rækker**

`outreach/batch-2026-07-10.md`: sektion pr. lead med alle Produces-felter. `tracker.csv`: 10 rækker med kolonnerne `navn,niche,firma,kontakt_info,kilde,nuvarende_site,reklamebeskyttet_tjekket,status,kontaktet_dato,follow_up_dato,samtale_resultat,noter,segment,variant,kanal,klik` — status=`klargjort`, segment=`freelance`, kanal=`email`, kontaktet_dato/follow_up/resultat/klik tomme.

- [ ] **Step 6: Commit**

```bash
git add outreach/batch-2026-07-10.md outreach/tracker.csv
git commit -m "outreach: batch #1 — 10 kvalificerede freelance-leads (PE-portfolio)"
```

---

### Task 4: 10 personaliserede udkast + Send-klar (birkenborg-agents)

**Files:**
- Modify: `C:\Users\birke\Projects\birkenborg-agents\outreach\batch-2026-07-10.md` (udkast tilføjes pr. lead)

**Interfaces:**
- Consumes: `batch-2026-07-10.md` (Task 3), opdateret template (Task 2), `scripts/draft_outreach.py` (CLI: `--name --firm --site --niche smv --variant A|B --segment freelance`; kræver `ANTHROPIC_API_KEY` i `.env`).
- Produces: send-klar udkast (emne + brødtekst) pr. lead i batch-filen — Philips eneste job er kopiér/indsæt/send.

- [ ] **Step 1: Generér udkast pr. lead**

For hver af de 10 leads:

```bash
python scripts/draft_outreach.py --name "<kontaktperson>" --firm "<firma>" --site "<site-url>" --niche smv --variant <A|B> --segment freelance
```

- [ ] **Step 2: Efterbehandl hvert udkast (manuel kvalitetsgate)**

For hvert udkast, verificér/ret:
1. Åbningslinjen nævner en KONKRET detalje om firmaet (fra deres site/nyheder) — ingen generisk smiger.
2. Pakke-referencen matcher lead'ets pakke-match fra Task 3 (én pakke + pris, verbatim priser fra Global Constraints).
3. Linket er `https://birkenborg.dev/arbejd-sammen/?utm_source=email&utm_campaign=smv-freelance-a` (variant A) eller `...-b` (variant B).
4. Tone: bygger-fortælleren — ingen consultant-fraser, ingen "jeg tillader mig at…".
5. Privacy: Tandlægen.dk må nævnes som arbejdsgiver, ALDRIG tal/modparter/sager.

- [ ] **Step 3: Skriv udkastene ind i batch-filen**

Under hvert leads sektion i `batch-2026-07-10.md`: `### Udkast (send-klar)` med **Emne:**-linje + brødtekst, klar til copy-paste.

- [ ] **Step 4: Commit**

```bash
git add outreach/batch-2026-07-10.md
git commit -m "outreach: 10 send-klar udkast med pakke-match og UTM (batch #1)"
```

- [ ] **Step 5: Afslutningsrapport til Philip**

Ingen fil — sidste besked i sessionen skal indeholde: (1) sti til batch-filen, (2) send-instruks (send fra egen mail, 2-3 pr. dag frem for alle 10 på én gang — undgå spam-mønster i lille marked), (3) opfølgningsdisciplin: opdatér `tracker.csv` status→`sendt`+dato ved afsendelse, (4) mindeord: CVR oprettes ved første varme lead, (5) succeskriterie: ≥1 svar på 10 = signal; 0 svar → pitch justeres FØR batch #2. **NB: push af birkenborg-dev (Task 1) kræver Philips OK — uden push er pakkesiden ikke live, og UTM-links lander på den gamle side.**

---

## Self-review (kørt 2026-07-10)

- **Spec-dækning:** Del A → Task 1 (pakker, priser, tone, LeadForm urørt, DoD). Del B → Task 2 (template/UTM), Task 3 (mining+gates), Task 4 (udkast+send-flow). Succeskriterier → Task 1 Step 5 + Task 4 Step 5. Fravalg respekteret (ingen betalingsflow/nyhedsbrev/auto-send/worker-ændringer). Ingen huller fundet.
- **Placeholder-scan:** ingen TBD/TODO; alle kode-steps har komplet kode; operationelle steps har konkrete felter og kommandoer.
- **Konsistens:** priser identiske i Global Constraints, Task 1-kode, Task 2-template og Task 4-gate. UTM-format identisk i Task 2 og Task 4. `.pakker article`/`.adhoc`-selektorer matcher mellem test (Step 1) og kode (Step 3).
