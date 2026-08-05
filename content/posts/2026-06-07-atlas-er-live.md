---
title: Atlas Assessments er live
slug: atlas-er-live
publish_at: 2026-06-07T00:31:43.000Z
status: published
tags:
  - konsulenter
  - ai
  - assessments
  - produkter
excerpt: >-
  Atlas Assessments er live — en platform der tager konsulentens egne
  spørgerammer og returnerer analyserede rapporter i deres eget brand. Uden
  Excel-timerne imellem.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-06-22T18:07:19Z'
    text: udfas authority-sider (klinikker/konsulenter)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/e11c94a17b9f869cfdf65ccf5c25052133f3b7cd
  - ts: '2026-06-16T20:40:03Z'
    text: tilføj Atlas Assessments som case-kort
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/eff2436050e4510d551cdb315988cc69ff97a6e7
  - ts: '2026-06-08T16:02:40Z'
    text: Atlas-post får rigtig titel + slug atlas-er-live
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/727a2707d46fe5d75b8f6039f1ed742422683e65
  - ts: '2026-06-24T16:07:25Z'
    text: tre-trins motor (generer->dom->omskriv->publicer live)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/66dc54f36c4a1e260f834bb6f25a14df1c472146
  - ts: '2026-06-08T16:32:39Z'
    text: wire tic-gate ind i simulate_draft for live-verifikation
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/3f4d27066a68626de0607497148bbb0389f7b07e
  - ts: '2026-06-07T19:28:06Z'
    text: live dashboard-besked — create/update med edit-fallback
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/90406597b1f32469c16d29357588bd178b28b174
  - ts: '2026-06-07T18:23:21Z'
    text: >-
      design-spec for Telegram-bot UX-opgradering (knapper, HTML, live
      pipeline-besked
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/b6bbd423394c9a6e81b1cb7425b914f0480148e4
---

Jeg har de seneste uger bygget Atlas Assessments. Det er en spørgeskemaplatform til konsulenter der lever af deres egen metode. Den er åben nu på atlas-app.dk med 30 dages gratis prøveperiode uden betalingskort.

Men lad mig starte med det problem den løser, for det er ikke "spørgeskemaer er besværlige".

---

Dygtige rådgivere bruger månedsvis på at udvikle spørgerammer. Hvilke dimensioner måler vi? Hvad er den rigtige skala? Hvilke opfølgningsspørgsmål afslører hvad respondenten egentlig mener, når de svarer "4 ud af 5" på et spørgsmål om procesmodenhed?

Det er den svære del. Det er metoden. Og den er personlig — det er rådgiverens faglige DNA pakket ind i en rækkefølge af spørgsmål.

Så sender de det ud. Som et regneark. Eller i et generisk survey-værktøj med et fremmed logo øverst.

Svarene kommer tilbage. Rå. 40 rækker i et Excel-ark, spredt over tre tabpages, med en kolonne der hedder "Andet (angiv venligst)" som 12 respondenter har brugt til at skrive halve sætninger i.

Derpå begynder det rigtige arbejde: tre timer i PowerPoint, et halvt i Excel, en time på at beslutte om man skal vise det som søjlediagram eller radarplot. Og en nagende fornemmelse af at dette ikke er det man egentlig er god til.

Problemet er ikke metoden. Problemet er leveringen.

---

Atlas løser et specifikt led i den kæde: fra rå svar til præsentabel rapport.

Konsulenten importerer eller bygger sit eget assessment i platformen. Det kan være eksisterende spørgsmål fra et regneark, eller noget bygget fra bunden. Kunden modtager et link. Undervejs stiller AI'en kalibrerede opfølgningsspørgsmål — ikke standardiserede, men tilpasset til hvad respondenten netop har svaret. Svarer nogen lavt på it-understøttelse, kan systemet spørge ind til det. Svarer de højt på noget der virker inkonsistent med et tidligere svar, kan det markeres.

Svarene kommer tilbage med modenhedsscore og en rapport i konsulentens eget brand. Logo. Farver. På de større planer også eget domæne.

Metoden er konsulentens. Atlas er leveringen.

---

Atlas erstatter ikke rådgiverens vurdering. AI'en stiller opfølgningsspørgsmål og analyserer svarene — den erstatter ikke den samtale der typisk følger efter, eller det faglige skøn konsulenten bringer ind i tolkningen. En modenhedsscore er et udgangspunkt for en samtale, ikke et facit.

Og det er ikke et generisk survey-værktøj med AI drysset ovenpå. Det er bygget til én type bruger: konsulenter der har en metode og vil have den leveret professionelt uden at bruge en arbejdsdag på efterbehandling.

Vil man have et fancy Typeform-alternativ, er der bedre muligheder. Vil man have et specialiseret analyseredskab til komplekse datamodeller, er det heller ikke Atlas. Afgrænsningen er bevidst.

---

Jeg åbner med 30 dages gratis adgang uden betalingskort — ikke fordi det er et standard SaaS-trick, men fordi platformen er ny og jeg har brug for at vide hvad der mangler.

Det jeg ikke kan finde ud af fra min egen skærm: om onboarding-flowet giver mening for en konsulent der aldrig har set det før. Om de kategorier og dimensioner Atlas foreslår som udgangspunkt svarer til noget der ligner det folk faktisk bruger. Om rapporten er præsentabel nok til at gå direkte til en kunde, eller om der mangler et redigeringslag.

Dem der melder sig nu former hvad Atlas bliver.

atlas-app.dk.

<!-- linkedin:start -->
Et assessment er ikke et spørgeskema. Det er bare altid blevet sendt som et.

Dygtige rådgivere bruger tid på at udvikle spørgerammer. Så sender de dem ud i et generisk survey-værktøj med et fremmed logo. Svarene kommer tilbage rå. Tre timer i PowerPoint følger.

Atlas Assessments løser det ene led: fra rå svar til rapport i konsulentens eget brand — logo, farver, kalibrerede opfølgningsspørgsmål undervejs fra AI'en. Metoden er stadig rådgiverens. Atlas er leveringen.

Det er det jeg har bygget de seneste uger. Den er live nu med 30 dages gratis adgang uden kort. Formålet er ikke at sælge — det er at få den i hænderne på konsulenter der kan sige hvad der mangler.

🔗 birkenborg.dev/skrifter/atlas-er-live
<!-- linkedin:end -->
