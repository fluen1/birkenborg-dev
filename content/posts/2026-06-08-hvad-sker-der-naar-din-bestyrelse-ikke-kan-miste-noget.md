---
title: Hvad sker der når din bestyrelse ikke kan miste noget
slug: hvad-sker-der-naar-din-bestyrelse-ikke-kan-miste-noget
publish_at: 2026-06-08T06:59:49.000Z
status: published
tags:
  - ai
  - ledelse
  - beslutninger
  - agenter
excerpt: >-
  Bo Martinsen har bygget fem AI-agenter som bestyrelse og bedt dem om at sige
  ubehageligheder. Problemet er hvem der har defineret hvad der er ubehageligt
  at høre.
privacy_flag: false
linkedin_url: 'https://www.linkedin.com/feed/update/urn:li:share:7469775279184461824/'
marginalia:
  - ts: '2026-06-22T18:04:28Z'
    text: /smv landingsside (jura + anvendt AI)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/685832f83af43c95123cf19d71db5f3b6429e292
  - ts: '2026-06-08T15:40:10Z'
    text: backfill linkedin_url for seed-c203f3db
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/1c8afe87e8ddbad394734d39cd8868f315f3422a
  - ts: '2026-06-07T13:39:45Z'
    text: onboarding-runbook for synlighedsabonnement (GSC-løftet + kendte gaps)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/0028b100f446da056f8a3015af9ab8d287bc5922
  - ts: '2026-06-22T21:50:55Z'
    text: 'lead-finding playbook (ICP, kanaler, kvalificering)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/62c370544727ee5d428cea12fc5d3ceeb8be5231
  - ts: '2026-06-17T22:14:38Z'
    text: LinkedIn v2 increment 1 — autoritets-motor
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/b845d3c4457b79c20d3ff7766681ea1583098745
  - ts: '2026-06-17T19:41:15Z'
    text: 'LinkedIn v2 increment 1 implementeringsplan (10 tasks, TDD)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/514ec1e0cd1bbf0e3a3e1504086348eac9f3ec22
  - ts: '2026-06-17T19:36:25Z'
    text: 'resolve LinkedIn v2 open questions (Tue/Thu ~09:30, D1, fidelity-loosen)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/76474fe92d3108e5ef1af052a771db492c2f32fb
  - ts: '2026-06-17T19:33:42Z'
    text: LinkedIn v2 autoritets-motor design (increment 1)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/41cba795e840d8893854448931edb9d04c492046
  - ts: '2026-06-11T00:18:45Z'
    text: Array.isArray-guard i backfillLinkedInUrl
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/eb7a1319adb74f4300a8e3fc8d7f9edc6fb7e984
  - ts: '2026-06-08T16:21:49Z'
    text: deterministisk tic-gate på LinkedIn-versionen
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/1ff7ae3f17cb0131d1dfaa195c888b315e47dcce
  - ts: '2026-06-08T15:30:12Z'
    text: tilføj requeue_linkedin for at gendanne BOM-fejlede krydsposter
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e48a8d9139f283660189792d7e64b574ff3e4b13
  - ts: '2026-06-08T15:22:24Z'
    text: strip BOM/whitespace fra author-URN før publish
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e9d77ed199a4a0925695d86820e7b2b4370fa0dd
  - ts: '2026-06-07T20:05:59Z'
    text: /linkedin-kø migreret til HTML-render — sidste spec-hul lukket
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/48b5f127fce15407a307fc16bf812ec6511d00dc
  - ts: '2026-06-07T19:58:00Z'
    text: ensartet fejlbesked-konvention — hvad gik galt + næste skridt
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/25489507fa34f3d2fae3becda802e2c1788a5d79
  - ts: '2026-06-07T19:20:26Z'
    text: LinkedIn-notify med HTML og tydelig privacy-advarsel
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/39ee7a8b61afc517f177139b340fa318b82b7a49
  - ts: '2026-06-07T19:08:07Z'
    text: /status med HTML-hierarki — skrifter/site/linkedin-sektioner
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/670b732a855c3547bf1d6b7c18ac466f472f998c
  - ts: '2026-06-07T14:34:27Z'
    text: anti-stivnakket — form-variation + humor-krav i LinkedIn-stemmen
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/5724ca85a73b49a106079f098f2a92a8d5d91809
---

Bo Martinsen, ejer og CEO i Norriq, har bygget fem AI-agenter med adgang til samtlige data i virksomheden og bedt dem om at være ubehagelige over for ham. Han kalder det bestyrelseserfaring på steroider.

Det er en god pointe. Og den afslører præcis det problem den forsøger at løse.

En bestyrelse er ikke primært værdifuld fordi den har adgang til data. Den er værdifuld fordi de mennesker i den kan tage personlige konsekvenser af at sige det forkerte. Et bestyrelsesmedlem der advarer imod et opkøb og har ret, har bevist sin vurdering i et forum der husker det. Et bestyrelsesmedlem der er uenig i direktørens strategi og siger det højt, sætter sit eget ry på spil. Det er ikke en mulighed — det er mekanikken bag hvad der gør advarslerne troværdige.

AI-agenten har ikke et ry. Den kan ikke blive personligt brændt inde. Den kan sige ordene. Men ordene vejer anderledes når der ingen hud er i spillet.

Martinsens konstruktion afhænger af at han selv definerer hvad der skal være ubehageligt at høre. Han har valgt hvilke dimensioner agenterne er kritiske langs. Hvilke data de har adgang til. Hvilke spørgsmål de stiller. En menneskelig bestyrelse med egne interesser kan stille spørgsmål der ikke var på dagsordenen. Den kan bemærke det der ikke er i regnskabet. Den kan insistere på at tale om det emne direktøren helst ville have sprunget over.

En AI-agent kan kun arbejde med den ramme den er givet. Og rammen er givet af Martinsen selv.

Det er ikke en kritik af Martinsen. Det er en præcis beskrivelse af hvad konstruktionen er: et avanceret redskab til at stresse-teste egne beslutninger mod de parametre man selv har defineret som relevante. Det er nyttigt. Jeg kan sagtens forestille mig at bruge noget lignende.

Men det er ikke en bestyrelse. Det er struktureret selverkendelse med ekstra trin.

Bestyrelsens klassiske funktion er ikke at bekræfte at direktøren tænker klart. Det er at repræsentere interesser der ikke er identiske med direktørens — aktionærer, kreditorer, medarbejdere, markedet. En agent der er instrueret af direktøren og kun eksisterer i den kontekst direktøren har sat op, har ingen selvstændig interesserepræsentation. Den er per konstruktion loyal mod den ramme den er givet.

Den kan producere ubehagelige svar. Den kan ikke producere uventede dagsordener.

Der er en anden dimension. En menneskelig bestyrelse kan sige ting der er ubehagelige på måder AI-agenten ikke kan modellere — ikke fordi den mangler data, men fordi ubehagelighedernes kraft delvist kommer fra hvem der siger dem og i hvilken social kontekst. En erfaren bestyrelsesformand der siger: dette minder mig om et forløb jeg var tæt på for ti år siden, og det endte dårligt — bringer noget ind i rummet som ikke er datareduktion. Det er inkorporeret erfaring med eget tab som referenceramme.

AI-agenten bringer ikke tab med sig. Den bringer mønstre.

Det Martinsen har bygget ligner mere en avanceret djævlens advokat-funktion end en bestyrelse. Og djævlens advokat er et godt redskab. Men den bedste djævlens advokat ved at rollen er en rolle. En AI-agent ved ikke hvornår den skal holde op med at være djævlens advokat og begynde at sige hvad den faktisk mener.

Den har ikke noget den faktisk mener. Den har parametre.

Bestyrelseserfaring på steroider. Måske. Men steroider forstørrer det der allerede er der. Hvis det der er der er direktørens egne antagelser om hvad der er værd at teste, er det det der bliver forstørret.

<!-- linkedin:start -->
En bestyrelse er ikke værdifuld fordi den har adgang til data. Den er værdifuld fordi de mennesker i den kan miste noget ved at tage fejl.

Bo Martinsen, CEO i Norriq, har bygget fem AI-agenter med adgang til samtlige virksomhedsdata og bedt dem om at sige ubehageligheder højt. "Bestyrelseserfaring på steroider," kalder han det.

Men agenterne er instrueret af Martinsen. De arbejder inden for den ramme han har sat op. De kan stresse-teste hans beslutninger langs de dimensioner han selv har defineret som relevante. De kan ikke stille spørgsmål der ikke var på dagsordenen.

Det er ikke en bestyrelse. Det er struktureret selverkendelse med ekstra trin.

Steroider forstørrer det der allerede er der. Hvis det der er der er direktørens egne antagelser — er det dem der vokser.

🔗 birkenborg.dev/skrifter/hvad-sker-der-naar-din-bestyrelse-ikke-kan-miste-noget
<!-- linkedin:end -->
