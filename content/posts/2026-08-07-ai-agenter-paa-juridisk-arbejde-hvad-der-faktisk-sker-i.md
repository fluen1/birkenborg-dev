---
title: "AI-agenter på juridisk arbejde: hvad der faktisk sker i produktion"
slug: ai-agenter-paa-juridisk-arbejde-hvad-der-faktisk-sker-i
publish_at: 2026-08-07T09:02:06+02:00
status: published
tags: ["ai-maskinrum", "ai-agenter", "kontraktgennemgang", "legal tech", "in-house jura"]
excerpt: "Hvad sker der egentlig når man sætter AI-agenter i produktion på juridiske opgaver? En in-house jurists erfaringer med kontraktgennemgang, hallucinationer og vedligeholdelse."
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-06-07T21:58:00+02:00'
    text: 'ensartet fejlbesked-konvention — hvad gik galt + næste skridt'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/25489507fa34f3d2fae3becda802e2c1788a5d79'
  - ts: '2026-06-17T22:37:16+02:00'
    text: 'scorer favoriserer AI+jura-identitet, filtrerer generisk fra'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/589063dce8a2f6a978de40b3f6487ef645a64a70'
  - ts: '2026-06-22T19:52:55+02:00'
    text: 'SMV-outreach (jura + anvendt AI)'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/2f29f7a58b3ef80c2e5128b8c470f86c56958db0'
  - ts: '2026-06-22T20:02:36+02:00'
    text: 'SMV-outreach (jura + anvendt AI) implementeringsplan'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/56a8d063d64509e51889209ab574ba225852ee82'
  - ts: '2026-06-22T20:04:28+02:00'
    text: '/smv landingsside (jura + anvendt AI)'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-dev/commit/685832f83af43c95123cf19d71db5f3b6429e292'
  - ts: '2026-06-24T18:41:00+02:00'
    text: 'piggyback paa */10-tick i stedet for dedikeret cron'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/3aa2e935a84058ef55ee41d29891a8ea251f5558'
  - ts: '2026-07-01T23:32:34+02:00'
    text: 'jura-generalist-indholdsstrategi for birkenborg.dev'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/4e24209fba84537e36339ddb0b02c20f92d685ff'
  - ts: '2026-07-01T23:42:55+02:00'
    text: 'implementeringsplan for jura-generalist-indholdsstrategi'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/f652008850fab37a3c4f0eea4016d435190442dd'
  - ts: '2026-07-01T23:54:45+02:00'
    text: '55 jura-generalist-emner i 11 klynger + round-robin-rotation'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/70222dbd83c684f9c2b74d2b9d8bcfd41e4ac248'
  - ts: '2026-07-02T00:03:38+02:00'
    text: 'in-house-analyse-prompts + faglig_trovaerdighed i dommer-verdict'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/5b2aae22ce418ac893d765a3a76a54362739fc13'
  - ts: '2026-07-10T12:52:53+02:00'
    text: 'LinkedIn-DM peger ogsaa paa pakkesiden'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/9fa09ff80db3c2f669f7fdcfeb6088a5e7190e58'
  - ts: '2026-07-10T16:05:08+02:00'
    text: 'CORS-preflight + ACAO paa offentlige internal-endpoints — browser-submits var bl'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-agents/commit/bfb848ad344e26a569afbefbe725259341c80f5b'
  - ts: '2026-07-10T16:43:45+02:00'
    text: 'undersoegelse — AT-fokus paa tak-blok + client-side email-validering'
    source: 'auto-commit'
    commit_url: 'https://github.com/fluen1/birkenborg-dev/commit/98fa0a6a6cb18cc814f652cc2a6b91b6c3a8f682'
---

De fleste artikler om AI i juridisk praksis handler om potentiale. Denne handler om hvad der sker når man rent faktisk bygger agenter, sætter dem på rigtige opgaver og lader dem køre dag efter dag. Ikke som tankeeksperiment, men som værktøj der skal levere noget brugbart til en forretning der ikke har tid til at vente.

Jeg bygger AI-agenter ved siden af mit daglige virke som in-house jurist. Ikke fordi det er trendy, men fordi en generalist der dækker alt fra selskabsret til moms simpelthen har for mange opgaver til for få timer. Spørgsmålet var aldrig om AI kunne hjælpe, men hvor hurtigt jeg kunne få det til at virke godt nok til at stole på outputtet.

Svaret er: hurtigere end du tror — men med langt flere forbehold end leverandørerne fortæller dig.

## Hvad en agent faktisk er

Lad os få terminologien på plads, for "AI-agent" bruges om alt fra en chatbot med logo til fuldautomatiske workflow-systemer. I min verden er en agent et stykke software der kan modtage en opgave, bryde den ned i trin, kalde værktøjer undervejs og levere et resultat — uden at jeg sidder og prompter hvert enkelt skridt.

Forskellen fra bare at bruge ChatGPT er orkestreringen. En agent kan trække kontraktudkast fra et dokumentbibliotek, sammenholde dem med en tjekliste, identificere afvigelser og formulere et overblik — i ét flow. Det er ikke magi. Det er en loop med betinget logik, noget der ligner den måde du selv arbejder på, bare uden kaffepauserne.

Det afgørende er at forstå hvad det ikke er: det er ikke en jurist. Det er et ekstremt hurtigt og utrætteligt værktøj der kan behandle tekst, finde mønstre og producere udkast. Kvaliteten af outputtet afhænger fuldstændig af hvor godt du har designet opgaven, valgt din model og struktureret de data agenten arbejder med.

## Hvor det virker — og hvor det falder fra hinanden

Der er opgaver hvor agenter allerede i dag sparer mig reel tid. Kontraktgennemgang mod standardvilkår er den oplagte. Jeg har sat en agent op der læser et modpartsudkast, sammenholder det med vores egne positioner på en række nøglepunkter — ansvarsbegrænsning, opsigelsesvilkår, IP-overdragelse, lovvalg — og producerer et overblik over afvigelser med et forslag til respons. Den rammer rigtigt i størstedelen af tilfældene. Den sparer mig ikke for at læse kontrakten, men den sparer mig for den mekaniske del af sammenligningen, og den glemmer aldrig et punkt på listen.

Due diligence-lignende opgaver fungerer også. At lade en agent gennemsøge et datarum for røde flag baseret på definerede kriterier er markant hurtigere end at gøre det manuelt, og den holder koncentrationen bedre end et menneske klokken 22 en torsdag aften.

Hvor det til gengæld falder fra hinanden er på alt der kræver egentlig juridisk vurdering. Agenten kan finde problemet; den kan ikke vurdere om problemet er vigtigt i den konkrete kommercielle kontekst. Den ved ikke at vores direktion er villig til at acceptere en bestemt risiko fordi relationen til modparten er strategisk vigtig. Den forstår ikke at en ansvarsbegrænsning teknisk set er utilstrækkelig, men i praksis irrelevant fordi kontraktværdien er marginal.

Den forskel er ikke triviel — den er hele pointen.

## Det ingen fortæller dig om produktion

At bygge en prototype der virker på tre eksempler tager en eftermiddag. At bygge noget der virker pålideligt på hundrede forskellige kontrakter tager uger. Forskellen er alt det kedelige: fejlhåndtering, edge cases, varierende dokumentformater, modeller der hallucinerer med overbevisende selvtillid.

Hallucinationer er det helt centrale risikoelement. En sprogmodel kan formulere et juridisk argument der lyder perfekt, med korrekt kadence og overbevisende struktur — og som er forkert. Ikke forkert på en måde der springer i øjnene, men forkert på en måde der kræver at du faktisk kender svaret for at opdage fejlen. Det er præcis den type risiko der bør bekymre en juridisk chef.

Min løsning er enkel og uambitiøs: agenten producerer udkast, aldrig slutprodukter. Alt der forlader min afdeling har et menneske — mig — som sidste kvalitetskontrol. Det lyder måske som om effektivitetsgevinsten forsvinder, men det gør den ikke. Der er markant forskel på at skrive et notat fra bunden og på at revidere et udkast der er 85 procent korrekt. Den forskel er flere timer om ugen.

Den anden ting ingen fortæller dig er vedligeholdelse. En agent er software, og software kræver løbende opmærksomhed. Modeller opdateres, API'er ændrer adfærd, og de instruktioner der virkede i januar virker subtilt anderledes i juni. Hvis du ikke har lyst til at vedligeholde et system, skal du ikke bygge det.

## Hvad ledelsen skal vide

Hvis du sidder som juridisk chef og overvejer om AI-agenter er noget for din afdeling, er her hvad du reelt skal forholde dig til.

For det første: gevinsterne er reelle, men de er inkrementelle. Ingen agent fjerner behovet for jurister. Det den gør er at flytte tid fra mekanisk tekstbehandling til vurdering og rådgivning — altså det du alligevel helst vil have dine folk til at bruge tiden på.

For det andet: du skal have nogen der kan bygge og vedligeholde. Enten en teknisk kompetent jurist eller et samarbejde mellem jura og IT der faktisk fungerer. Hyldeløsninger til juridisk AI findes i stigende grad, men de er generiske og sjældent tilpasset din organisations specifikke behov og risikoprofil. Det er ikke en kritik af produkterne — det er bare virkeligheden i at juridisk arbejde er kontekstafhængigt.

For det tredje: start med opgaver der har høj volumen og lav kompleksitet. Kontraktgennemgang mod kendte standarder. NDA-administration. Simpel compliance-screening. Lad være med at starte med det sværeste, mest følsomme arbejde. Det er ikke dér agenter beviser deres værd — det er dér de beviser deres begrænsninger.

Og for det fjerde: hav en ærlig samtale om kvalitetskontrol, inden du går i gang. Hvem reviderer agentens output? Hvad er acceptabel fejlrate? Hvad sker der når — ikke hvis — agenten laver en fejl der ikke bliver fanget? De spørgsmål er ikke hypotetiske. De er operationelle.

## Perspektivet herfra

Jeg er overbevist om at agenter bliver en fast del af juridisk arbejde. Ikke som erstatning for juridisk faglighed, men som et lag under den — på samme måde som søgedatabaser, skabelonbiblioteker og standardklausuler blev det. Værktøjer der gør den mekaniske del hurtigere, så den menneskelige vurdering kan fylde mere.

Men jeg er lige så overbevist om at de organisationer der får mest ud af det er dem der behandler det som et ingeniørprojekt med juridisk risikostyring, ikke som en IT-anskaffelse med en demodag og et håndtryk. Det kræver nogen der forstår begge sider godt nok til at bygge noget der faktisk holder i drift.

Det er hverken så svært som skeptikerne frygter eller så let som leverandørerne lover. Det er bare arbejde — en ny slags, men stadig arbejde.

<!-- linkedin:start -->

<!-- linkedin:end -->
