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
  - ts: '2026-06-22T18:04:28Z'
    text: /smv landingsside (jura + anvendt AI)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/685832f83af43c95123cf19d71db5f3b6429e292
  - ts: '2026-06-20T16:39:36Z'
    text: tag-filtrering med chip-bar + deep-link
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/0ff4305b1c56c1ad764cbdb82521b2a7074dcc61
  - ts: '2026-06-24T16:07:25Z'
    text: tre-trins motor (generer->dom->omskriv->publicer live)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/66dc54f36c4a1e260f834bb6f25a14df1c472146
  - ts: '2026-06-22T22:01:16Z'
    text: reklamebeskyttelse gater kun freelance + PE-kanal bevist
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/232342c66321afd4b03c276c954096129645a832
  - ts: '2026-06-22T21:50:55Z'
    text: 'lead-finding playbook (ICP, kanaler, kvalificering)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/62c370544727ee5d428cea12fc5d3ceeb8be5231
  - ts: '2026-06-22T20:10:42Z'
    text: README peger på datacvr.virk.dk i stedet for cvrapi.dk
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/1e62318876c74820beb51771e99dd9f6284fe0ee
  - ts: '2026-06-22T20:10:15Z'
    text: 'drop cvrapi.dk-tooling (single-lookup, ikke bulk)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/769afc184f927d9f36a3a8b7b3459f2d447afa8d
  - ts: '2026-06-22T18:13:53Z'
    text: 'arkivér authority-sites-templates, opdatér README'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/59f881fdacdcc0c7f1f716e51bfb18a056f03372
  - ts: '2026-06-22T18:11:06Z'
    text: SMV-templates for ansættelse + freelance (A/B)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/4478560d851992000c8f3b93442b3a79f0b8cc4e
  - ts: '2026-06-22T18:08:32Z'
    text: SMV-prompt med A/B-variant + segment i draft_outreach
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/9ab240fb9880beea465353a2c686ba094010703e
  - ts: '2026-06-22T18:04:49Z'
    text: SMV-segmenter + A/B-kolonner i cvr_leads + tracker
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/d97fb9e6000490b5287c172fe67c5064cdd81b06
  - ts: '2026-06-22T18:02:36Z'
    text: SMV-outreach (jura + anvendt AI) implementeringsplan
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/56a8d063d64509e51889209ab574ba225852ee82
  - ts: '2026-06-22T17:52:55Z'
    text: SMV-outreach (jura + anvendt AI)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/2f29f7a58b3ef80c2e5128b8c470f86c56958db0
  - ts: '2026-06-17T20:37:16Z'
    text: 'scorer favoriserer AI+jura-identitet, filtrerer generisk fra'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/589063dce8a2f6a978de40b3f6487ef645a64a70
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

