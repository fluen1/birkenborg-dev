# Survey-motoren Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lovlig lead-motor: nøgen survey-side på birkenborg.dev + worker-endpoint der gemmer besvarelser og DM'er Philip + neutralt mail-materiale — inkl. CORS-fix der får browser-submits til overhovedet at virke.

**Architecture:** Siden er statisk Astro uden site-nav (juridisk krav). Den POSTer JSON cross-origin til bot-workeren (`bot.birkenborg.dev`), som i dag HELT mangler CORS-håndtering — preflight OPTIONS rammer auth-checket og får 401, og svar bærer ingen `Access-Control-Allow-Origin` (live-verificeret 10/7). Task 1 fikser CORS for de offentlige endpoints; Task 2 tilføjer `/internal/survey` efter `handleLead`-mønstret; Task 3 bygger siden; Task 4 er mail-materiale (ingen kode).

**Tech Stack:** Cloudflare Worker (TypeScript, vitest pool-workers), Astro 6 + Playwright E2E, markdown-materiale.

**Spec:** `docs/superpowers/specs/2026-07-10-survey-motor-design.md`

## Global Constraints

- **Juridisk (§ 10) — ufravigeligt:** survey-siden må IKKE indeholde site-navigation, links til andre sider på birkenborg.dev, ydelses-omtale eller ambitions-sprog. Mail-materialet må kun indeholde: sagligt formål, tidsforbrug/anonymitet, link til skemaet, neutral signatur. Ingen præmie (Philips fravalg).
- **Samtykke-tekst verbatim:** "Ja — send mig undersøgelsens resultater, og kontakt mig gerne med opfølgning, der er relevant for mine svar. Samtykket kan til enhver tid trækkes tilbage."
- **Anonymitet håndhævet server-side:** email gemmes KUN når `samtykke === true`; ellers droppes den bevidst.
- **CORS-allowlist:** præcis `https://birkenborg.dev` og `http://localhost:4321` (dev). Ingen `*`.
- **Payload-kontrakt (Task 2 og 3 SKAL matche):** se Task 2's interface-blok — nøgler `svar.q1`-`svar.q8`, `samtykke`, `email`, `kilde`.
- **Repos:** worker-arbejde i `C:\Users\birke\Projects\birkenborg-agents`, side-arbejde i `C:\Users\birke\Projects\birkenborg-dev`. Commits på `main`. **INGEN push og INGEN deploy — Philips eksplicitte OK kræves** (push af agents auto-deployer workeren).
- **DoD birkenborg-dev:** `npm test` (root) + `cd site && npm test` + `cd site && npm run build` + `cd site && npm run e2e` grønne. Worker: fuld vitest-suite grøn (NB: repoets `tsc` har ~86 præeksisterende fejl i urelaterede filer — vitest er gaten).
- Dansk fuld ortografi i al brugervendt tekst.

---

### Task 1: CORS-fix for offentlige internal-endpoints (birkenborg-agents)

**Files:**
- Modify: `worker/src/internal.ts` (top + `handleInternal` + `handleLead`-responses)
- Test: `worker/tests/internal.test.ts` (følg eksisterende lead-test-stil: telegram-fetch mockes)

**Interfaces:**
- Produces: `corsFor(req: Request): Record<string, string>` — returnerer CORS-headers hvis `Origin` er i allowlisten, ellers `{}`. `PUBLIC_PATHS = new Set(["/internal/lead", "/internal/survey"])`. Task 2's endpoint genbruger begge.

- [ ] **Step 1: Skriv fejlende tests**

Tilføj i `worker/tests/internal.test.ts` (samme describe-stil/mocks som eksisterende lead-tests):

```ts
it("preflight OPTIONS på /internal/lead svarer 204 med CORS-headers", async () => {
  const res = await worker.fetch(new Request("https://bot.birkenborg.dev/internal/lead", {
    method: "OPTIONS",
    headers: { Origin: "https://birkenborg.dev", "Access-Control-Request-Method": "POST" },
  }), env);
  expect(res.status).toBe(204);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://birkenborg.dev");
  expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  expect(res.headers.get("Access-Control-Allow-Headers")).toContain("content-type");
});

it("POST /internal/lead med kendt Origin bærer Access-Control-Allow-Origin", async () => {
  // brug samme gyldige lead-payload + telegram-mock som eksisterende happy-path-test
  // og assert derudover:
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://birkenborg.dev");
});

it("preflight fra ukendt Origin får ingen ACAO-header", async () => {
  const res = await worker.fetch(new Request("https://bot.birkenborg.dev/internal/lead", {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" },
  }), env);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
});
```

(Tilpas kald-formen til hvordan eksisterende tests invokerer worker/handleInternal — genbrug deres helpers.)

- [ ] **Step 2: Kør fokuseret test — verificér FAIL**

Run: `cd worker && npx vitest run tests/internal.test.ts -t "preflight"`
Expected: FAIL — OPTIONS rammer auth-check og får 401.

- [ ] **Step 3: Implementér**

I `worker/src/internal.ts`:

```ts
const CORS_ORIGINS = new Set(["https://birkenborg.dev", "http://localhost:4321"]);
const PUBLIC_PATHS = new Set(["/internal/lead", "/internal/survey"]);

export function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  if (!CORS_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
```

Øverst i `handleInternal`, FØR auth-checket (sammen med det eksisterende lead-branch):

```ts
if (PUBLIC_PATHS.has(path) && req.method === "OPTIONS") {
  return new Response(null, { status: 204, headers: corsFor(req) });
}
```

Og i `handleLead`: alle `Response.json(...)`-returer får `{ status: ..., headers: corsFor(req) }` —
dvs. signaturen ændres til at tage `req` med (den har den allerede). Eksempel:

```ts
return Response.json({ ok: true, lead_id: leadId }, { headers: corsFor(req) });
```

(Alle fejl-returer i handleLead får samme headers-argument — 400/429 skal også kunne læses af browseren.)

- [ ] **Step 4: Kør tests — verificér PASS + fuld suite**

Run: `cd worker && npx vitest run tests/internal.test.ts` → grøn. Derefter fuld suite: `npx vitest run` (fra roden eller worker/, som repoets scripts foreskriver) → ingen regressioner.

- [ ] **Step 5: Commit**

```bash
git add worker/src/internal.ts worker/tests/internal.test.ts
git commit -m "fix(worker): CORS-preflight + ACAO paa offentlige internal-endpoints — browser-submits var blokeret"
```

---

### Task 2: `/internal/survey`-endpoint (birkenborg-agents)

**Files:**
- Modify: `worker/src/internal.ts` (route-branch + ny `handleSurvey`)
- Test: `worker/tests/internal.test.ts`

**Interfaces:**
- Consumes: `corsFor(req)` + `PUBLIC_PATHS` fra Task 1; `sendDM` fra `./telegram`; `env.BOT_STATE` KV.
- Produces (payload-kontrakten Task 3 poster):

```json
{
  "svar": {
    "q1": "50-99",
    "q2": "nej-eksterne",
    "q3": ["advokatfirma", "ai-vaerktoejer"],
    "q4": ["kontrakter"],
    "q5": "enkelte",
    "q6": ["kundeservice"],
    "q7": "nej",
    "q8": ["jura-ansvar"]
  },
  "samtykke": true,
  "email": "x@firma.dk",
  "kilde": "mail1"
}
```

Whitelists (eneste gyldige værdier):
- q1: `"1-9" | "10-49" | "50-99" | "100-199" | "200+"`
- q2: `"fuldtid" | "deltid-kombineret" | "nej-eksterne" | "nej-selv"`
- q3 (array, må være tom): `"advokatfirma" | "revisor-raadgiver" | "brancheforening" | "googler-skabeloner" | "ai-vaerktoejer"`
- q4 (array, må være tom): `"kontrakter" | "ansaettelsesret" | "gdpr-data" | "selskabsforhold" | "tvister-inkasso" | "udbud"`
- q5: `"bredt" | "enkelte" | "nej-overvejer" | "nej"`
- q6 (array, må være tom): `"tekst-kommunikation" | "kundeservice" | "sagsbehandling" | "oekonomi-bogholderi" | "tilbud-salg"`
- q7: `"ja" | "delvist" | "nej" | "ved-ikke"`
- q8 (array, må være tom): `"datasikkerhed" | "fejl-i-output" | "jura-ansvar" | "medarbejder-accept" | "ikke-noget"`
- `samtykke`: boolean (default false). `email`: KRÆVES når samtykke=true (simpel `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`); DROPPES bevidst når samtykke=false. `kilde`: valgfri, `/^[a-z0-9-]{1,24}$/`, ellers droppes.
- Svar: `{ok:true, survey_id}` 200 / `{error:"invalid_json"|"invalid_answers"|"missing_email_for_consent"|"invalid_email"|"rate_limited"}` 400/429.
- KV-nøgle: `survey:<unix-ts>:<8-hex>`, INGEN TTL. Record: `{svar, samtykke, email?, kilde?, submitted_at, ip}`.
- Rate-limit: genbrug mønstret fra handleLead med egen nøgle `survey-rate:<ip>`, 5/60s, incrementeres kun ved succes.

- [ ] **Step 1: Skriv fejlende tests (6 cases)**

```ts
// 1. happy path anonym: gyldige svar, samtykke=false → 200 {ok:true, survey_id: /^survey:/},
//    KV-record uden email-felt, telegram-DM indeholder "anonym"
// 2. happy path samtykke: samtykke=true + email → 200, KV-record HAR email,
//    DM indeholder "SAMTYKKE" og emailen
// 3. samtykke=true UDEN email → 400 {error:"missing_email_for_consent"}
// 4. samtykke=false MED email → 200, men KV-record har IKKE email-feltet (anonymitet håndhævet)
// 5. ukendt svar-værdi (fx q1:"kæmpe") eller manglende q-nøgle → 400 {error:"invalid_answers"}
// 6. sjette request fra samme IP inden for vinduet → 429 {error:"rate_limited"}
```

Skriv dem fuldt ud i samme stil som lead-testene (telegram-fetch mocket, KV via test-env; kopiér deres opsætning af gyldig payload + IP-header `cf-connecting-ip`).

- [ ] **Step 2: Kør — verificér FAIL** (`npx vitest run tests/internal.test.ts -t "survey"` → 404-fejl, endpoint findes ikke)

- [ ] **Step 3: Implementér `handleSurvey`**

Route-branch i `handleInternal` FØR auth-check, ved siden af lead-branchen:

```ts
if (path === "/internal/survey" && req.method === "POST") {
  return handleSurvey(req, env);
}
```

Implementation (følg handleLead-strukturen: parse → validér → rate-limit-read → gem → DM → rate-limit-increment):

```ts
const SURVEY_WHITELISTS: Record<string, { multi: boolean; values: Set<string> }> = {
  q1: { multi: false, values: new Set(["1-9", "10-49", "50-99", "100-199", "200+"]) },
  q2: { multi: false, values: new Set(["fuldtid", "deltid-kombineret", "nej-eksterne", "nej-selv"]) },
  q3: { multi: true, values: new Set(["advokatfirma", "revisor-raadgiver", "brancheforening", "googler-skabeloner", "ai-vaerktoejer"]) },
  q4: { multi: true, values: new Set(["kontrakter", "ansaettelsesret", "gdpr-data", "selskabsforhold", "tvister-inkasso", "udbud"]) },
  q5: { multi: false, values: new Set(["bredt", "enkelte", "nej-overvejer", "nej"]) },
  q6: { multi: true, values: new Set(["tekst-kommunikation", "kundeservice", "sagsbehandling", "oekonomi-bogholderi", "tilbud-salg"]) },
  q7: { multi: false, values: new Set(["ja", "delvist", "nej", "ved-ikke"]) },
  q8: { multi: true, values: new Set(["datasikkerhed", "fejl-i-output", "jura-ansvar", "medarbejder-accept", "ikke-noget"]) },
};

function validateSvar(svar: unknown): svar is Record<string, string | string[]> {
  if (typeof svar !== "object" || svar === null) return false;
  const obj = svar as Record<string, unknown>;
  for (const [key, rule] of Object.entries(SURVEY_WHITELISTS)) {
    const v = obj[key];
    if (rule.multi) {
      if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !rule.values.has(x))) return false;
    } else {
      if (typeof v !== "string" || !rule.values.has(v)) return false;
    }
  }
  return true;
}

async function handleSurvey(req: Request, env: Env): Promise<Response> {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const cors = corsFor(req);

  let payload: { svar?: unknown; samtykke?: unknown; email?: unknown; kilde?: unknown };
  try { payload = await req.json(); } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: cors });
  }

  if (!validateSvar(payload.svar)) {
    return Response.json({ error: "invalid_answers" }, { status: 400, headers: cors });
  }
  const samtykke = payload.samtykke === true;
  let email: string | undefined;
  if (samtykke) {
    if (typeof payload.email !== "string" || payload.email.length === 0) {
      return Response.json({ error: "missing_email_for_consent" }, { status: 400, headers: cors });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email) || payload.email.length > 254) {
      return Response.json({ error: "invalid_email" }, { status: 400, headers: cors });
    }
    email = payload.email;
  }
  // samtykke=false → email droppes bevidst: anonymitetsløftet håndhæves server-side
  const kilde = typeof payload.kilde === "string" && /^[a-z0-9-]{1,24}$/.test(payload.kilde)
    ? payload.kilde : undefined;

  const rateKey = `survey-rate:${ip}`;
  const countStr = await env.BOT_STATE.get(rateKey);
  const count = countStr ? parseInt(countStr, 10) : 0;
  if (count >= RATE_LIMIT_PER_IP) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: cors });
  }

  const now = Math.floor(Date.now() / 1000);
  const rnd = new Uint8Array(4);
  crypto.getRandomValues(rnd);
  const hex = Array.from(rnd).map((b) => b.toString(16).padStart(2, "0")).join("");
  const surveyId = `survey:${now}:${hex}`;
  const record = { svar: payload.svar, samtykke, ...(email ? { email } : {}), ...(kilde ? { kilde } : {}), submitted_at: now, ip };
  await env.BOT_STATE.put(surveyId, JSON.stringify(record)); // ingen TTL — rapport-data

  const notifyChatId = env.LEAD_NOTIFY_CHAT_ID ?? env.TELEGRAM_CHAT_ID;
  const svarObj = payload.svar as Record<string, string | string[]>;
  const fmt = (v: string | string[]) => Array.isArray(v) ? (v.length ? v.join(", ") : "—") : v;
  const dmText = [
    `📋 Ny survey-besvarelse ${samtykke ? "— ✅ SAMTYKKE" : "— anonym"}`,
    ...(email ? [`Email: ${email}`] : []),
    ...(kilde ? [`Kilde: ${kilde}`] : []),
    ``,
    `Ansatte: ${fmt(svarObj.q1)} · Jurist: ${fmt(svarObj.q2)}`,
    `Jura løses af: ${fmt(svarObj.q3)}`,
    `Fylder mest: ${fmt(svarObj.q4)}`,
    `AI i drift: ${fmt(svarObj.q5)} · Bruges til: ${fmt(svarObj.q6)}`,
    `Overblik AI-aftaler: ${fmt(svarObj.q7)} · Bekymring: ${fmt(svarObj.q8)}`,
  ].join("\n");
  await sendDM(env.TELEGRAM_BOT_TOKEN, notifyChatId, dmText);

  await env.BOT_STATE.put(rateKey, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  return Response.json({ ok: true, survey_id: surveyId }, { headers: cors });
}
```

- [ ] **Step 4: Kør — verificér PASS + fuld suite uden regressioner** (`npx vitest run`)

- [ ] **Step 5: Commit**

```bash
git add worker/src/internal.ts worker/tests/internal.test.ts
git commit -m "feat(worker): /internal/survey — valideret survey-endpoint m. samtykke-haandhaevelse og DM"
```

---

### Task 3: `/undersoegelse`-siden (birkenborg-dev)

**Files:**
- Create: `site/src/pages/undersoegelse.astro`
- Test: `site/src/tests/pages.spec.ts` (tilføj 2 tests nederst)

**Interfaces:**
- Consumes: `Base.astro` (nav-fri layout, `title`-prop + head-slot), site-CSS-tokens (`--cream`, `--clay`, `--clay-deep`, `--ink`, `--gray-200`, `--gray-700`, `--font-display`, `--r-sm`, `--r-md`), Task 2's payload-kontrakt VERBATIM (nøgler + whitelist-værdier).
- Produces: live side som Task 4's mail linker til (`https://birkenborg.dev/undersoegelse?k=mail1`).

- [ ] **Step 1: Skriv fejlende E2E-tests**

Tilføj nederst i `site/src/tests/pages.spec.ts`:

```ts
test('/undersoegelse er nøgen: noindex, ingen nav, 8 spørgsmål, samtykke-blok', async ({ page }) => {
  await page.goto('/undersoegelse/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('nav')).toHaveCount(0);
  // ingen interne links væk fra siden (kun eksterne/ingen): alle <a> skal pege på # eller mailto
  const badLinks = await page.locator('a[href^="/"], a[href*="birkenborg.dev/"]').count();
  expect(badLinks).toBe(0);
  await expect(page.locator('[data-q]')).toHaveCount(8);
  await expect(page.locator('#samtykke')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('/undersoegelse submitter payload og viser tak-tilstand', async ({ page }) => {
  let posted: any = null;
  await page.route('**/internal/survey', async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/undersoegelse/?k=e2e-test');
  // vælg én radio pr. radiospørgsmål (q1, q2, q5, q7)
  for (const q of ['q1', 'q2', 'q5', 'q7']) {
    await page.locator(`[data-q="${q}"] input[type="radio"]`).first().check();
  }
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.tak')).toBeVisible();
  expect(posted.svar.q1).toBe('1-9');
  expect(posted.samtykke).toBe(false);
  expect(posted.email).toBeUndefined();
  expect(posted.kilde).toBe('e2e-test');
});
```

- [ ] **Step 2: Kør — verificér FAIL** (`cd site && npm run e2e -- --grep "undersoegelse"` → 404, siden findes ikke)

- [ ] **Step 3: Byg siden**

Opret `site/src/pages/undersoegelse.astro` (komplet — spørgsmål/værdier SKAL matche Task 2's whitelists tegn for tegn):

```astro
---
import Base from '../layouts/Base.astro';

const PAGE_TITLE = 'Undersøgelse: jura og AI i danske SMV\'er · birkenborg.dev';

type Q = { id: string; nr: number; titel: string; multi: boolean; note?: string; opts: [string, string][] };
const questions: Q[] = [
  { id: 'q1', nr: 1, titel: 'Hvor mange ansatte er I?', multi: false, opts: [
    ['1-9', '1-9'], ['10-49', '10-49'], ['50-99', '50-99'], ['100-199', '100-199'], ['200+', '200+'],
  ]},
  { id: 'q2', nr: 2, titel: 'Har I en jurist ansat i virksomheden?', multi: false, opts: [
    ['fuldtid', 'Ja, på fuld tid'],
    ['deltid-kombineret', 'Ja, på deltid / kombineret rolle'],
    ['nej-eksterne', 'Nej — vi bruger eksterne, når det brænder på'],
    ['nej-selv', 'Nej — vi klarer det meste selv'],
  ]},
  { id: 'q3', nr: 3, titel: 'Hvem løser jeres juridiske opgaver i dag?', multi: true, note: 'vælg gerne flere', opts: [
    ['advokatfirma', 'Advokatfirma'],
    ['revisor-raadgiver', 'Revisor / rådgiver'],
    ['brancheforening', 'Brancheforening'],
    ['googler-skabeloner', 'Vi googler og bruger skabeloner'],
    ['ai-vaerktoejer', 'AI-værktøjer (fx ChatGPT)'],
  ]},
  { id: 'q4', nr: 4, titel: 'Hvilke juridiske opgaver fylder mest hos jer?', multi: true, note: 'vælg gerne flere', opts: [
    ['kontrakter', 'Kontrakter'], ['ansaettelsesret', 'Ansættelsesret'], ['gdpr-data', 'GDPR / data'],
    ['selskabsforhold', 'Selskabsforhold'], ['tvister-inkasso', 'Tvister / inkasso'], ['udbud', 'Udbud'],
  ]},
  { id: 'q5', nr: 5, titel: 'Bruger I AI-værktøjer i driften i dag?', multi: false, opts: [
    ['bredt', 'Ja, bredt i flere afdelinger'],
    ['enkelte', 'Ja, men kun enkelte værktøjer / enkelte medarbejdere'],
    ['nej-overvejer', 'Nej, men vi overvejer det'],
    ['nej', 'Nej, og det er ikke på tegnebrættet'],
  ]},
  { id: 'q6', nr: 6, titel: 'Hvad bruger I (eller overvejer I) AI til?', multi: true, note: 'vælg gerne flere', opts: [
    ['tekst-kommunikation', 'Tekst & kommunikation'], ['kundeservice', 'Kundeservice'],
    ['sagsbehandling', 'Sagsbehandling'], ['oekonomi-bogholderi', 'Økonomi / bogholderi'], ['tilbud-salg', 'Tilbud & salg'],
  ]},
  { id: 'q7', nr: 7, titel: 'Har I overblik over jeres aftaler med AI-leverandører — hvem der ejer data, og hvem der har ansvaret, hvis noget går galt?', multi: false, opts: [
    ['ja', 'Ja, det er på plads'], ['delvist', 'Delvist'],
    ['nej', 'Nej — det har vi ikke kigget på'], ['ved-ikke', 'Ved ikke'],
  ]},
  { id: 'q8', nr: 8, titel: 'Hvad ville bekymre jer mest ved at bruge (mere) AI?', multi: true, note: 'vælg gerne flere', opts: [
    ['datasikkerhed', 'Datasikkerhed'], ['fejl-i-output', 'Fejl i output'], ['jura-ansvar', 'Jura & ansvar'],
    ['medarbejder-accept', 'Medarbejdernes accept'], ['ikke-noget', 'Ikke noget'],
  ]},
];
---
<Base title={PAGE_TITLE}>
  <Fragment slot="head">
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="8 spørgsmål om hvordan danske SMV'er bruger jura og AI. Anonymt, ca. 3 minutter, ingen cookies." />
  </Fragment>
  <main class="survey">
    <div class="container">
      <p class="ident">Philip Birkenborg Andersen · cand.merc.(jur.)</p>
      <h1>Hvordan bruger danske SMV'er jura og AI i 2026?</h1>
      <p class="intro">
        8 spørgsmål om, hvordan jeres virksomhed løser juridiske opgaver, og hvor AI er på vej ind
        i driften. Svarene behandles anonymt og indgår kun i samlet, statistisk form.
      </p>
      <p class="meta">ca. 3 minutter · anonymt · ingen cookies</p>

      <form id="surveyForm" novalidate>
        {questions.map((q) => (
          <fieldset class="q" data-q={q.id} data-multi={q.multi ? '1' : '0'}>
            <legend><span class="nr">{q.nr}.</span> {q.titel}{q.note && <span class="note"> ({q.note})</span>}</legend>
            <div class="opts">
              {q.opts.map(([value, label]) => (
                <label class="opt">
                  <input type={q.multi ? 'checkbox' : 'radio'} name={q.id} value={value} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div class="consent">
          <p class="c-head">Frivilligt · må vi følge op?</p>
          <label class="opt">
            <input type="checkbox" id="samtykke" name="samtykke" />
            <span>Ja — send mig undersøgelsens resultater, og kontakt mig gerne med opfølgning,
            der er relevant for mine svar. Samtykket kan til enhver tid trækkes tilbage.</span>
          </label>
          <label class="emailfield" for="email">
            E-mail (kun hvis du har sagt ja tak ovenfor)
            <input type="email" id="email" name="email" autocomplete="email" disabled />
          </label>
        </div>

        <button type="submit">Send besvarelse</button>
        <p class="status" aria-live="polite"></p>
        <p class="foot">Besvarelser uden e-mail er fuldt anonyme. Ingen cookies, ingen tracking.</p>
      </form>

      <div class="tak" hidden>
        <h2>Tak for hjælpen</h2>
        <p>Din besvarelse er modtaget. Har du bedt om resultaterne, hører du fra mig, når undersøgelsen er gjort op.</p>
      </div>
    </div>
  </main>
</Base>

<script>
  const form = document.getElementById('surveyForm') as HTMLFormElement;
  const consent = document.getElementById('samtykke') as HTMLInputElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const status = form.querySelector('.status') as HTMLElement;
  const tak = document.querySelector('.tak') as HTMLElement;

  consent.addEventListener('change', () => {
    emailInput.disabled = !consent.checked;
    if (!consent.checked) emailInput.value = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const svar: Record<string, string | string[]> = {};
    let missing = '';
    for (const fs of Array.from(form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-q]'))) {
      const id = fs.dataset.q as string;
      if (fs.dataset.multi === '1') {
        svar[id] = Array.from(fs.querySelectorAll<HTMLInputElement>('input:checked')).map((i) => i.value);
      } else {
        const sel = fs.querySelector<HTMLInputElement>('input:checked');
        if (!sel) { missing = missing || id; fs.classList.add('mangler'); } else { fs.classList.remove('mangler'); svar[id] = sel.value; }
      }
    }
    if (missing) {
      status.textContent = 'Udfyld venligst de markerede spørgsmål — kun ét kryds pr. spørgsmål.';
      document.querySelector(`[data-q="${missing}"]`)?.scrollIntoView({ block: 'center' });
      return;
    }
    if (consent.checked && !emailInput.value) {
      status.textContent = 'Skriv din e-mail, eller fjern krydset i samtykke-feltet.';
      return;
    }

    const kildeParam = new URLSearchParams(location.search).get('k') ?? '';
    const payload: Record<string, unknown> = {
      svar,
      samtykke: consent.checked,
      ...(consent.checked && emailInput.value ? { email: emailInput.value } : {}),
      ...(/^[a-z0-9-]{1,24}$/.test(kildeParam) ? { kilde: kildeParam } : {}),
    };

    const button = form.querySelector('button') as HTMLButtonElement;
    button.disabled = true;
    status.textContent = 'Sender…';
    try {
      const res = await fetch('https://bot.birkenborg.dev/internal/survey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      form.hidden = true;
      tak.hidden = false;
      tak.scrollIntoView({ block: 'center' });
    } catch {
      status.textContent = 'Noget gik galt — prøv igen om et øjeblik.';
      button.disabled = false;
    }
  });
</script>

<style>
  .survey { padding: 56px 0 96px; }
  .container { max-width: 680px; margin: 0 auto; padding: 0 20px; }
  .ident { font-size: 13px; letter-spacing: .06em; color: var(--gray-700); margin: 0 0 28px; }
  h1 { font-family: var(--font-display); font-weight: 380; font-size: clamp(30px, 5vw, 44px); line-height: 1.12; letter-spacing: -.015em; margin: 0 0 14px; }
  .intro { font-size: 16.5px; line-height: 1.55; color: var(--gray-700); margin: 0 0 6px; }
  .meta { font-size: 13px; font-weight: 600; color: var(--clay); margin: 0 0 36px; }
  .q { border: 1px solid var(--gray-200); border-radius: var(--r-md); padding: 18px 20px; margin: 0 0 18px; }
  .q.mangler { border-color: var(--clay); }
  legend { font-weight: 650; font-size: 15px; padding: 0 6px; }
  .nr { color: var(--clay); }
  .note { font-weight: 400; color: var(--gray-700); font-size: 13px; }
  .opts { display: flex; flex-direction: column; gap: 9px; margin-top: 10px; }
  .opt { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; line-height: 1.45; cursor: pointer; }
  .opt input { margin-top: 3px; accent-color: var(--clay); }
  .consent { border: 1.5px solid var(--clay); border-radius: var(--r-md); padding: 18px 20px; margin: 28px 0 0; }
  .c-head { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--clay); margin: 0 0 10px; }
  .emailfield { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; font-size: 13.5px; color: var(--gray-700); }
  .emailfield input { max-width: 340px; padding: 9px 12px; border: 1px solid var(--gray-200); border-radius: var(--r-sm); background: var(--cream); color: var(--ink); font-size: 15px; }
  .emailfield input:disabled { opacity: .5; }
  button[type="submit"] { margin-top: 26px; background: var(--clay); color: white; border: none; border-radius: var(--r-sm); padding: 12px 26px; font-size: 16px; font-family: inherit; cursor: pointer; }
  button[type="submit"]:hover { background: var(--clay-deep); }
  button[type="submit"]:disabled { opacity: .5; cursor: not-allowed; }
  .status { font-size: 14px; color: var(--clay); min-height: 1.4em; margin: 10px 0 0; }
  .foot { font-size: 12.5px; color: var(--gray-700); margin: 14px 0 0; }
  .tak h2 { font-family: var(--font-display); font-weight: 400; font-size: 30px; margin: 0 0 10px; }
  .tak p { color: var(--gray-700); }
</style>
```

- [ ] **Step 4: Kør E2E — verificér PASS** (`cd site && npm run e2e -- --grep "undersoegelse"`), derefter fuld DoD: `npm test` (rod) + `cd site && npm test` + `npm run build` + fuld `npm run e2e`.
NB: 200-tjek-testen ("alle sider returnerer 200") skal IKKE udvides med /undersoegelse — bevidst: siden er noindex-kampagneside; tilføj den kun hvis testen fejler uden.

- [ ] **Step 5: Visual check** — `npm run dev`, åbn `http://localhost:4321/undersoegelse/?k=test`: 8 spørgsmål, samtykke-blok med disabled email-felt der aktiveres ved kryds, submit-validering (manglende radio markeres). Dark mode-toggle findes ikke på siden (ingen Header) — tjek at `data-theme`-persistens fra localStorage ikke ødelægger læsbarheden i mørk tilstand.

- [ ] **Step 6: Commit**

```bash
git add site/src/pages/undersoegelse.astro site/src/tests/pages.spec.ts
git commit -m "feat(site): /undersoegelse — noegen survey-side m. samtykke-blok (noindex, ingen nav)"
```

---

### Task 4: Mail-materiale + tracker (birkenborg-agents, ingen kode)

**Files:**
- Create: `outreach/survey-mail-2026-07.md`
- Modify: `outreach/tracker.csv` (status på de 10 freelance-rækker: `arkiveret-mfl10` → `survey-klar`)

**Interfaces:**
- Consumes: modtagerne fra `outreach/batch-2026-07-10.md` (navn + email pr. lead, allerede gate-verificeret).
- Produces: send-klar mail-tekst til Philips ordlyds-QA. Philip sender selv.

- [ ] **Step 1: Skriv `outreach/survey-mail-2026-07.md`**

```markdown
# Survey-invitation — jura & AI i danske SMV'er (juli 2026)

> ⚖️ **§ 10-REGLERNE (må ikke fraviges uden re-check mod FO's spamvejledning 2021, s. 17-19):**
> Ingen omtale af ydelser/pakker/priser. Intet ambitions- eller kvalitetssprog om afsenderen.
> Link KUN til skemaet. Neutral signatur (navn, titel, birkenborg.dev som ren tekst-identitet —
> IKKE som link til forsiden/salgssider). Ingen vedhæftninger. Ingen præmie (fravalgt).
> Personalisering KUN [fornavn] — ingen firma-specifikke åbningslinjer.
> Juridisk grundlag: neutral markedsundersøgelse er uden for MFL § 10 (FO-vejledningen 2021 +
> sager 15/08087, 10/09158, 15/11580 modsætningsvis).

## Mail (samme tekst til alle 10 — send 2-3 pr. dag fra egen mail)

**Emne:** Kort undersøgelse: hvordan bruger danske SMV'er jura og AI?

Hej [fornavn],

Jeg er ved at kortlægge, hvordan danske virksomheder i praksis løser deres juridiske opgaver,
og hvor AI-værktøjer er på vej ind i driften.

Det tager cirka 3 minutter at svare. Besvarelserne behandles anonymt, og alle deltagere kan få
tilsendt resultaterne, når undersøgelsen er gjort op:

https://birkenborg.dev/undersoegelse?k=mail1

De bedste hilsner
Philip Birkenborg Andersen
cand.merc.(jur.)
birkenborg.dev

## Modtagere (fra batch-2026-07-10.md — gates allerede verificeret)

| # | Kontaktperson | Firma | E-mail |
| (udfyld de 10 rækker fra batch-filen: navn, firma, email — IKKE pakke-match/variant; de er irrelevante for survey-mailen) |

## Efter afsendelse
- Opdatér tracker.csv: status → `survey-sendt` + kontaktet_dato pr. modtager.
- Besvarelser lander som Telegram-DM (📋). Samtykke-markerede = varme kontakter (lovlig opfølgning).
```

- [ ] **Step 2: Opdatér tracker** — de 10 rækker med status `arkiveret-mfl10` → `survey-klar` (kolonneantal uændret, 16 kolonner).

- [ ] **Step 3: Verificér** — `python -c "import csv; rows=list(csv.reader(open('outreach/tracker.csv',encoding='utf-8'))); assert all(len(r)==16 for r in rows), 'kolonnefejl'; print(sum(1 for r in rows if 'survey-klar' in r), 'survey-klar')"` → `10 survey-klar`. Grep at mail-filen IKKE indeholder "pakke", "kr.", "arbejd-sammen": `grep -c -i -E "pakke|kr\.|arbejd-sammen" outreach/survey-mail-2026-07.md` → forventet 0 hits i mail-sektionen (regelblokken øverst må gerne nævne dem som forbud — flyt evt. forbudsordene i regelblokken til omskrivninger som "ydelses-/prisomtale" så grep'en er ren).

- [ ] **Step 4: Commit**

```bash
git add outreach/survey-mail-2026-07.md outreach/tracker.csv
git commit -m "outreach: survey-invitation (neutral, §10-sikret) + tracker → survey-klar"
```

---

## Self-review (kørt 2026-07-10)

- **Spec-dækning:** Del A → Task 3 (noindex, ingen nav, 8 spørgsmål verbatim, samtykke-blok, kilde-param, client-validering). Del B → Task 2 (whitelists, samtykke/email-håndhævelse, KV uden TTL, DM, rate-limit) + Task 1 (CORS, som spec'en forudsatte fandtes — live-tjek 10/7 viste den IKKE findes, deraf ny Task 1). Del C → Task 4. Gates (ingen push/deploy) i Global Constraints. Succeskriteriernes live-kæde-test ligger EFTER Philips push/deploy-OK — bevidst uden for planen.
- **Placeholder-scan:** ingen TBD/TODO; alle kode-steps har komplet kode; Task 4's modtager-tabel er en udfyldnings-instruks mod en navngiven kilde (batch-filen), ikke en placeholder.
- **Konsistens:** whitelist-værdier i Task 2 (`SURVEY_WHITELISTS`) og Task 3 (`questions[].opts`) er identiske tegn for tegn (kontrolleret parvis). Payload-nøgler (`svar`, `samtykke`, `email`, `kilde`) ens i Task 2-validator, Task 3-JS og E2E-testens assertions. `corsFor`/`PUBLIC_PATHS` defineret i Task 1, forbrugt i Task 2. Samtykke-teksten identisk med Global Constraints.
