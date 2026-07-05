---
title: Hvad koster en AI-agent? En ærlig prisguide for små virksomheder
slug: hvad-koster-en-ai-agent-en-rlig-prisguide-for-sma-virksomhed
publish_at: 2026-06-29T07:02:12.000Z
status: published
tags:
  - ai-agent
  - prissætning
  - open-source
  - smv
  - selvhosting
excerpt: >-
  En AI-agent koster fra ører per interaktion til sekscifrede
  udviklingsbudgetter. Forskellen afhænger af om du vælger API eller selvhosting
  — og af om du bygger til den rigtige opgave.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-07-01T07:01:32Z'
    text: publish gdpr-og-ai-i-klinikker-hvad-du-faktisk-skal-have-styr-pa
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/a4c704c51579365e53e9b394202a811a9a07d8ac
  - ts: '2026-06-29T07:02:12Z'
    text: publish hvad-koster-en-ai-agent-en-rlig-prisguide-for-sma-virksomhed
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/4d21403cd33b46d1523163481520af6cfc082c59
  - ts: '2026-06-24T17:01:07Z'
    text: goer konverteringssiden synlig — /smv/ -> /arbejd-sammen/ i nav
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/c88bfe9634364d0999f4d205077736d45dc088b3
  - ts: '2026-06-22T18:04:28Z'
    text: /smv landingsside (jura + anvendt AI)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/685832f83af43c95123cf19d71db5f3b6429e292
  - ts: '2026-06-20T16:11:27Z'
    text: load-tids health-probe så badgen er ærlig ved page-load
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/e390affb7ea4f192d598a77f96a06b850115287c
  - ts: '2026-07-02T18:17:03Z'
    text: 'Merge branch ''main'' of https://github.com/fluen1/birkenborg-agents'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/1061e1c045312a9e716ad5a0d019718a94babd6b
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
  - ts: '2026-06-17T20:57:05Z'
    text: selvbærende default + ægte-spørgsmål-slut + artikel-deling som valg
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/f3578b608eae0f6187ac5206fb4ebec8ad9e5a0b
  - ts: '2026-06-17T19:36:25Z'
    text: 'resolve LinkedIn v2 open questions (Tue/Thu ~09:30, D1, fidelity-loosen)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/76474fe92d3108e5ef1af052a771db492c2f32fb
  - ts: '2026-06-07T19:58:00Z'
    text: ensartet fejlbesked-konvention — hvad gik galt + næste skridt
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/25489507fa34f3d2fae3becda802e2c1788a5d79
---

Det korte svar: det afhænger af. Det lidt længere svar: det afhænger af noget helt andet end du tror.

De fleste der googler det her spørgsmål forestiller sig en pris som et stykke software. En licens. Et abonnement. Noget man kan sætte ind i et budget og glemme. Virkeligheden er mere mudret, og den er mudret på en måde der faktisk spiller til din fordel — hvis du forstår hvad du betaler for.

## De tre lag du betaler for

En AI-agent har tre omkostningslag, og de opfører sig meget forskelligt.

Det første er modellen — den sprogmodel der driver agentens tænkning. Det kan være en af de store kommercielle API'er fra OpenAI, Anthropic eller Google, eller det kan være en open source-model du selv hoster. Det andet er infrastrukturen: servere, databaser, den kode der binder det hele sammen. Det tredje er udviklingstiden: nogen skal bygge agenten, teste den, tilpasse den til din opgave.

De fleste prissamtaler handler kun om det første lag. Det er en fejl. Men lad os starte der alligevel.

## API-kald: den løbende regning

Hvis du bruger en kommerciel API, betaler du per token — groft sagt per ord agenten læser og skriver. Priserne varierer voldsomt mellem modeller og udbydere, og de ændrer sig løbende. Men størrelsesordenen er vigtig at forstå: for en simpel agent der besvarer kundehenvendelser baseret på din FAQ, taler vi typisk om ører per interaktion. Ikke kroner. Ører.

En agent der kører nogle hundrede interaktioner om måneden kan sagtens lande under et par hundrede kroner i rene API-omkostninger. Det overrasker folk. De har hørt at AI er dyrt, og det kan det være — men det er dyrt på bestemte måder, ikke generelt.

Der hvor regningen stiger er når agenten er kompleks. En agent der planlægger, kalder værktøjer, fejler, re-planlægger og kalder igen bruger mange gange flere tokens end en der bare svarer på et spørgsmål. Og den adfærd er svær at forudsige på forhånd. Du ved ikke om din agent bruger ti tokens eller ti tusind på en given opgave før du har kørt den mange gange.

Det er det egentlige prisproblem ved API-modellen: ikke at det er dyrt, men at det er uforudsigeligt.

## Open source og selvhosting: billigere end det lyder

Her bliver det interessant for en SMV-ejer der gerne vil have kontrol over budgettet.

Der findes open source-modeller — Llama, Mistral, Qwen og mange andre — som du kan køre selv. Gratis. Ingen API-kald, ingen tokenregning, ingen overraskelser. Du betaler kun for den server modellen kører på.

Den server kan være en cloud-instans til nogle hundrede kroner om måneden. For de mindste modeller kan den endda være en computer du allerede ejer. Det lyder for godt til at være sandt, og der er en hage: du skal selv sætte det op, vedligeholde det, og du får ikke den allerbedste model. Du får en der er god nok.

Og "god nok" er et nøgleord her. De fleste SMV-opgaver — kategorisering af mails, udkast til standardsvar, udtræk af data fra dokumenter, simpel kundeservice — kræver ikke den mest avancerede model på markedet. En mindre model klarer det fint. Ofte bedre, fordi den er hurtigere og billigere at køre, og fordi du kan finjustere den til præcis din opgave.

Den branchemyte der skal dø er at du altid har brug for den nyeste, største model. Det har du ikke. Du har brug for den rigtige model til opgaven. Og for de fleste opgaver i en lille virksomhed er den rigtige model en lille en.

## Udviklingstiden: den usynlige post

Så er der byggeriet. Nogen skal designe agenten, koble den til dine systemer, teste den, justere den når den gør noget dumt. Det er den dyreste del, og det er den de fleste glemmer at budgettere.

Hvis du hyrer en udvikler eller et bureau til at bygge en agent til dig, koster selve udviklingen typisk fra et par tusind kroner for noget simpelt til sekscifrede beløb for noget komplekst. Spredningen er enorm, og den afhænger primært af hvor rodet din data er og hvor mange systemer agenten skal tale med.

Hvis du selv kan lidt kode — eller er villig til at lære — kan du komme langt med frameworks som LangChain, CrewAI eller lignende, der gør det overkommeligt at bygge simple agenter uden at starte fra nul. Kurven fra "ingen erfaring" til "fungerende simpel agent" er kortere end de fleste tror.

## Hvad det faktisk koster i praksis

Lad mig give nogle grove pejlemærker, vel vidende at de er omtrentlige.

En simpel agent der besvarer kundespørgsmål baseret på dit eget materiale, hostet via en kommerciel API: forvent en driftsomkostning i størrelsesordenen et par hundrede kroner om måneden for en typisk SMV-volumen, plus udviklingsomkostningen ved opsætning.

Samme agent på en selvhostet open source-model: serveromkostningen i samme boldgade, men ingen token-regning oveni. Mere arbejde at sætte op, mere kontrol bagefter.

En kompleks agent der integrerer med dit CRM, trækker data fra regnskabssystemet og selv tager beslutninger: her taler vi en helt anden størrelse, både i udvikling og drift. Det er et projekt, ikke et værktøj.

Mit råd til en SMV-ejer der overvejer det for første gang: start med den simpleste version. Brug en kommerciel API til at teste om opgaven overhovedet kan løses af en agent. Sæt et budget-loft på API-kontoen — de fleste udbydere tilbyder det. Når du har bevist at det virker og kender dit forbrug, kan du beslutte om det giver mening at flytte til selvhosting.

Den beslutning afhænger af volumen. Under et par tusind interaktioner om måneden er det sjældent besværet værd at selvhoste. Over det tal begynder regnestykket at tippe.

## Det der faktisk er dyrt

Det dyreste ved en AI-agent er ikke teknologien. Det er at bygge den til den forkerte opgave. En agent der automatiserer noget ingen alligevel brugte tid på sparer ingenting. En agent der automatiserer noget der kræver menneskelig vurdering skaber problemer der er dyrere end den tid den sparede.

Find den opgave der er kedelig, gentages ofte, og har et klart rigtigt svar. Start der. Prisen for selve agenten er sandsynligvis lavere end du frygter.

<!-- linkedin:start -->

<!-- linkedin:end -->
