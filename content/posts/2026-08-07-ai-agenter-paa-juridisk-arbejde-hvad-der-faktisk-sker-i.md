---
title: 'AI-agenter på juridisk arbejde: hvad der faktisk sker i produktion'
slug: ai-agenter-paa-juridisk-arbejde-hvad-der-faktisk-sker-i
publish_at: 2026-08-07T07:02:06.000Z
status: published
tags:
  - ai-maskinrum
  - ai-agenter
  - kontraktgennemgang
  - legal tech
  - in-house jura
excerpt: >-
  Hvad sker der egentlig når man sætter AI-agenter i produktion på juridiske
  opgaver? En in-house jurists erfaringer med kontraktgennemgang,
  hallucinationer og vedligeholdelse.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-08-07T07:02:06Z'
    text: publish ai-agenter-paa-juridisk-arbejde-hvad-der-faktisk-sker-i
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/0b7ff669dded1af7971395c7df4a7f7c014a7038
  - ts: '2026-07-13T07:03:11Z'
    text: publish kundeklausuler-og-konkurrenceklausuler-hvad-der-skal-til-for
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/8b1042d13dfc600c05c4e71355d0947f2f5cf2e6
  - ts: '2026-07-27T15:43:06Z'
    text: afsender besluttet (hotmail) + routing/DMARC paa plads
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/d261ae2ae335e1ffc5aaaf9ca0f9453a7e32ba2c
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
