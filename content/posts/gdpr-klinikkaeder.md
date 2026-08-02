---
title: GDPR i klinikkæder — tre ting jeg lærte på den hårde måde
slug: gdpr-klinikkaeder
publish_at: 2026-05-04T07:00:00.000Z
status: published
tags:
  - jura
  - gdpr
  - sundhedsret
privacy_flag: false
excerpt: >-
  Persondata-reglerne ser meget anderledes ud når man håndterer patientdata på
  tværs af 50 klinikker.
marginalia:
  - ts: '2026-07-10T08:48:19Z'
    text: 'implementeringsplan for /arbejd-sammen v2 + outreach-batch #1'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/3ab9fce7dd79ff750c1b849bf7e341b0d5e10483
  - ts: '2026-07-09T20:25:37Z'
    text: '/arbejd-sammen v2 pakker + outreach-batch #1 design'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/b01895d77d98210a5391ee1a64a3e4301cb2d376
  - ts: '2026-07-29T14:20:29Z'
    text: Altinget-kilden peger nu på hoved-feedet
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e7e9aac0ac8c2a2ca9b9fdcd2653567b3d351963
  - ts: '2026-07-27T21:48:55Z'
    text: loeftet om resultater gjort holdbart ved ethvert antal svar
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/c2f9031f47b63fb02c2388fe9afeef783d3c1245
  - ts: '2026-07-27T15:43:06Z'
    text: afsender besluttet (hotmail) + routing/DMARC paa plads
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/d261ae2ae335e1ffc5aaaf9ca0f9453a7e32ba2c
  - ts: '2026-07-27T14:13:29Z'
    text: 'ordlyds-QA af survey-batch #1 + nulstil aldrig-sendt status'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/f4584a52862cac793fe125f20a3c976361d51c58
  - ts: '2026-07-12T17:51:11Z'
    text: 'batch #1 planlagt i Outlook (13-15/7) — tracker → survey-planlagt'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/f4b55becc63cda6377754cbc268690e4305cf678
  - ts: '2026-07-12T16:42:21Z'
    text: 10 copy-paste-klare survey-mails (fornavn indsat)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/7da2ee4636b529436084dfdcdc1fed51614eedbf
  - ts: '2026-07-10T14:47:21Z'
    text: 'survey-invitation (neutral, §10-sikret) + tracker → survey-klar'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/959c1549d0386a54d43365e251fd5f7674942e5f
  - ts: '2026-07-10T12:44:27Z'
    text: >-
      arkivér batch #1 — kold e-mail = MFL §10-spam (Philips vurdering),
      udsendelse st
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/d3ba386638e0361081429d230c7e32d212aa26a4
  - ts: '2026-07-10T12:04:28Z'
    text: fix presse-inbox-udkast + GUBI-formulering (final review)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/5b5fe06c70b5149400e935757c666f7d46aae5c0
  - ts: '2026-07-10T11:50:10Z'
    text: 'variér udkastene — unikke emnelinjer + omskrevne afsnit (batch #1)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/5fb8886f91e8f1d0d818485e8c183e6c0fe3924a
  - ts: '2026-07-10T11:40:22Z'
    text: '10 send-klar udkast med pakke-match og UTM (batch #1)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e4e5d06ebaa4938afeb63dee9f87ce9e41379a92
  - ts: '2026-07-10T11:25:52Z'
    text: 'batch #1 — 10 kvalificerede freelance-leads (PE-portfolio)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/c39d39aa6e795150d3c2387f31c0d952114d7666
  - ts: '2026-07-10T10:52:53Z'
    text: LinkedIn-DM peger ogsaa paa pakkesiden
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/9fa09ff80db3c2f669f7fdcfeb6088a5e7190e58
  - ts: '2026-07-10T10:51:12Z'
    text: freelance-template peger paa /arbejd-sammen-pakker med UTM
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/c7d0a37af3955ace07022adea50c2042ac514b54
---

Forestil dig en situation: to klinikker i samme kæde vil dele patientjournaler — ikke fordi det er praktisk, men fordi det er nødvendigt for behandlingskontinuitet. Fornuftigt. Begge klinikker er ejet af samme holdingselskab. Begge bruger samme journalsystem. Begge kalder sig selv del af samme organisation.

Og alligevel er overførslen ulovlig, som den er sat op.

Det var min første rigtige lektion i, hvad GDPR faktisk betyder på tværs af klinikkæder — og den kom på det tidspunkt, der er allermest ubelejligt: når nogen allerede har delt.

---

## 1. Dataansvar deles ikke automatisk

Jeg troede i et stykke tid, at fælles ejerskab betød fælles dataansvar. Det giver intuitiv mening: samme moderselskab, samme IT-infrastruktur, samme brand. Selvfølgelig er I "en organisation".

Databeskyttelsesforordningen ser det anderledes.

To juridiske enheder er to dataansvarlige, uanset hvor tæt de er forbundet i praksis. Og en overførsel af personoplysninger — herunder patientdata — fra én juridisk enhed til en anden er en overladelse, der kræver et behandlingsgrundlag. Ikke bare en intern mail. Ikke bare en fælles server. Et grundlag.

I klinikkæder, hvor mange klinikker drives som selvstændige selskaber under en paraplyorganisation, betyder det, at overførsler af patientdata på tværs af klinikker er dataoverførsler i forordningens forstand — med alt det medfører af dokumentationskrav, aftalegrundlag og i visse tilfælde aftaler om fælles dataansvar efter artikel 26.

Hvad jeg lærte: Start med at kortlægge juridiske enheder, ikke organisationsdiagrammer. De to ting er sjældent ens. Og hvis de ikke er ens, har du sandsynligvis overførsler, du ikke har behandlingsgrundlag for — endnu.

---

## 2. Samtykke er ikke en magisk løsning

Når jurister ikke kan finde et behandlingsgrundlag, er der en fristende refleks: "Lad os bare bede om samtykke."

Samtykke er synligt, dokumenterbart og føles proaktivt. Det er også det forkerte valg i de fleste sundhedsretlige sammenhænge.

Problemet er ikke, at samtykke er ugyldigt — det kan godt være gyldigt. Problemet er, at en behandling baseret på samtykke kræver, at patienten kan tilbagekalde det til enhver tid, uden at det får konsekvenser for vedkommendes behandling. Prøv at opretholde det krav i praksis, når en patients journaldata er spredt over tre systemer og fem år.

I sundhedssektoren er den saglige hjemmel næsten altid sundhedslovgivningen, databeskyttelseslovens § 7 stk. 4 eller en kombination — ikke samtykke. Patienten behøver ikke samtykke til, at en tandlæge journalfører en undersøgelse. Det sker med hjemmel i loven.

Samtykke er det rigtige grundlag i meget specifikke situationer: frivillig brug af data til formål, patienten ikke forventer, og som ikke er nødvendige for behandlingen. Markedsføring er det klassiske eksempel. Behandlingsdokumentation er det klassiske modeksempel.

Den hårde måde: Jeg har set processer, der var bygget oven på samtykke-løsninger, som aldrig burde have brugt samtykke. Det er ikke bare en teoretisk fejl — det betyder, at systemet skal bygges om, og at der potentielt er data, der er behandlet uden gyldigt grundlag, i den mellemliggende periode.

---

## 3. Sletning er sværere end gemning

Den tredje lektion er den, der overrasker folk mest, fordi den handler om noget, der lyder enkelt.

Sletning.

I teorien: en patient anmoder om sletning (eller opbevaringsfristen udløber), og systemet sletter. Enkelt.

I praksis: patientdata er i journalsystemet, i backup-databasen, i den lokale IT-support-kopi af backuppen, i et regneark en leder eksporterede for seks måneder siden til en intern analyse, i e-mails, i et ældre system, der ikke er fuldt afviklet, og i et tredjepartssystem, der integrerer med journalsystemet og selv gemmer data.

Klinikkæder akkumulerer skygge-kopier med den samme stille selvfølgelighed, som de akkumulerer alt andet — lidt ad gangen, uden at nogen besluttede det.

Problemet er ikke ondsindet. Det er det, der sker, når mange systemer integrerer over mange år, og ingen har ansvaret for at kortlægge, hvad der gemmer hvad. En databehandleraftale med journalleverandøren dækker journalleverandøren. Den dækker ikke det regneark.

Hvad der faktisk virker — eller i hvert fald virker bedre — er at kortlægge systemer og dataflows, *inden* man lover noget til en patient eller tilsynsmyndighed. Ikke en gang. Løbende. Fordi systemlandskabet ændrer sig, og kortlægningen forældes hurtigere end man tror.

Sletning er ikke en knap. Det er en proces, der kræver, at man ved, hvad man har — og det gør de fleste organisationer ikke præcist nok.

---

Tre læringer, og ingen af dem er overraskende, når man læser forordningsteksten med tilstrækkelig opmærksomhed. Det var bare svært at forudse, præcis *hvor* de ville slå til, og hvornår.

Det er måske det mest ærlige, jeg kan sige om GDPR i klinikkæder: Reglerne er ikke urimelige. Kompleksiteten opstår ikke fordi lovgivningen er dårlig — den opstår fordi organisationer er komplicerede, IT-systemer er komplicerede, og compliance-arbejde er den type arbejde, der nemt skrider, når klinikdrift presser sig på.

Det ændrer ikke på, hvad Datatilsynet forventer.

