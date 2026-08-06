---
title: Ingen ved hvad en AI-agent koster
slug: ingen-ved-hvad-en-ai-agent-koster
publish_at: 2026-06-02T10:55:17.000Z
status: published
tags:
  - ai
  - agenter
  - prissætning
  - jura
  - indkøb
excerpt: >-
  Ingen har bestemt sig for om AI-agenter faktureres per kald, per beslutning
  eller per resultat. Herbert Nathan kalder det 'det store spørgsmål lige nu'.
  Han har ret.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-06-20T16:11:27Z'
    text: load-tids health-probe så badgen er ærlig ved page-load
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/e390affb7ea4f192d598a77f96a06b850115287c
  - ts: '2026-06-07T13:54:52Z'
    text: Telegram-alarm ved deploy-fejl + Node 24 opt-in + checkout/setup-node v5
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/d8fecf3f5858f5800e5e58977969c7f359158d14
  - ts: '2026-05-25T09:38:01Z'
    text: write full ma-agent-paragraf-30 article
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/90e5cc290724022e092ba41521e82163e8325e73
  - ts: '2026-05-25T09:37:29Z'
    text: write full 10-agents-i-produktion article
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/68a07ab706f2e6f3ab892d7198e4cb7370a49c08
  - ts: '2026-06-17T21:27:35Z'
    text: første-kommentar-oplæg vedhæftet JA-beskeden
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/c3707fa202f20ce0d4e2cb9661561e21f390e9de
  - ts: '2026-06-17T20:37:16Z'
    text: 'scorer favoriserer AI+jura-identitet, filtrerer generisk fra'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/589063dce8a2f6a978de40b3f6487ef645a64a70
  - ts: '2026-06-10T23:20:35Z'
    text: 'fail loud ved manglende ''# Titel'' i udkast, publicér aldrig placeholder'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/fb3cb2ef1400cdc387f0bf97b098dbf7963e71b8
  - ts: '2026-06-07T19:58:00Z'
    text: ensartet fejlbesked-konvention — hvad gik galt + næste skridt
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/25489507fa34f3d2fae3becda802e2c1788a5d79
  - ts: '2026-06-07T19:40:26Z'
    text: dashboard-besked opdateres ved alle state-transitions
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/754b02e4fa7d9f81ef9b0e174851e11da8e143ad
---

Herbert Nathan kalder det 'det store spørgsmål lige nu'. Det er en præcis beskrivelse.

Computerworld-artiklen fra juni 2026 handler om noget tilsyneladende teknisk: hvordan virksomheder kommer til at blive faktureret for AI-agenter. Det er ikke et teknisk spørgsmål. Det er et regnskabsmæssigt og forretningskulturelt spørgsmål som vi har udskudt fordi det er ubehageligt.

Ingen har bestemt sig endnu. Per request? Per query? Per decision? En flad årlig fee som ingen rigtig forstår hvad dækker? Vi låner prisbilledet fra mennesker — timehonorar, konsulentdage, fastprisaftaler — og forsøger at klistre det på noget der opfører sig fundamentalt anderledes.

Et menneske fakturerer for den tid de bruger. En AI-agent fakturerer hvad præcis? Den tid serveren kører? Antallet af kald til en underliggende model? Den beslutning den traf, uanset om den var rigtig? Resultatet den producerede, uanset hvad det kostede at nå dertil?

De spørgsmål er ikke akademiske. De er det der bestemmer om AI-agenter ender som en forudsigelig driftsomkostning eller som den slags overraskelse der dukker op i et regnskab og får nogen til at ringe til leverandøren.

Nathan advarer direkte om skjulte omkostninger — at AI kan blive langt dyrere end forventet. Det ryger let i kategorien 'det siger eksperter altid om ny teknologi'. Men mekanikken her er anderledes end ved tidligere teknologiskifter.

Når et ERP-system kørte for dyrt, var det typisk fordi implementeringen var gået galt eller licensen var dyrere end antaget. Omkostningen var engangs eller forudsigelig på månedsbasis. En AI-agent der kører juridisk gennemgang, sagsbehandling eller kontraktvurdering kan — hvis den er sat forkert op — generere hundredvis af kald til underliggende modeller for en enkelt opgave. Ikke fordi den er defekt. Fordi det er sådan agenter er bygget: de planlægger, de opdager at planen ikke holdt, de re-planlægger, de kalder et værktøj, resultatet er uventet, de kalder et andet. Bestilling, re-planlægning, kald, fejl, kald igen.

Hver af de operationer har en pris. Prisen er ikke synlig i det øjeblik man godkender at agenten skal løse en opgave.

Det er fremmed for alle eksisterende prismodeller i juridisk arbejde. En advokat der bruger tre timer på at gennemgå en aftale fakturerer tre timer. Hvis gennemgangen viser sig at tage fem timer fordi aftalen var mere kompliceret end ventet, er der som minimum en samtale om det. En AI-agent der bruger fem gange så mange ressourcer som forventet gør det uden at ringe.

Den konsekvens er ikke hypotetisk. Den er embedded i den måde nuværende prismodeller for AI-API'er fungerer. Du betaler per token, per kald, per completion. Agentstrukturer multiplicerer det antal — på en måde der er svær at forudsige uden at have kørt opgaven mange gange og opbygget et statistisk billede af gennemsnitsomkostningen.

Det juridiske arbejde er et godt eksempel netop fordi kompleksiteten varierer så meget. En standardkontrakt på ti sider og en due diligence-pakke på 800 sider er ikke bare kvantitativt forskellige — de er kvalitativt forskellige opgaver for en agent. Prismodellen der fungerer for den ene vil sandsynligvis ikke fungere for den anden. Klienten der godkender 'AI-gennemgang af kontrakt' som en ydelse har ingen anelse om hvilken af de to kategorier de betaler for.

Den samtale om prissætning er svær fordi den kræver ærlighed om hvad vi ikke ved endnu. Leverandørerne af AI-platforme har en åbenlys interesse i at gøre prissætningen så enkel som mulig — og i at skjule kompleksiteten i flade abonnementer der ser forudsigelige ud. Virksomhederne der køber ind på teknologien har en interesse i at undgå at stille spørgsmål der forsinker beslutningen. Konsulenter der implementerer systemerne har typisk en interesse i at løse det tekniske problem, ikke det kontraktuelle.

Resultatet minder om de tidlige cloud-kontrakter: alle ved at der er noget de ikke forstår fuldt ud, ingen siger det højt, og regningen ankommer et år inde i kontrakten.

Nathan har ret i at det er det store spørgsmål. Det er det store spørgsmål præcis fordi det ikke bliver stillet i udbudsmaterialet.

<!-- linkedin:start -->
AI-agenter fakturerer ikke for den tid de bruger. De fakturerer for noget vi endnu ikke har besluttet hvad er.

Herbert Nathan fra HNCO kalder det 'det store spørgsmål lige nu' i Computerworld. Han har ret. Vi har lånt prisbilledet fra mennesker — timehonorar, konsulentdage — og klistret det på noget der opfører sig fundamentalt anderledes. En agent der løser en opgave kan generere hundredvis af kald til underliggende modeller undervejs. Planlægning, re-planlægning, fejl, kald igen. Hver operation har en pris. Ingen af dem er synlige da du godkendte opgaven.

Det minder mig om de tidlige cloud-kontrakter. Alle vidste der var noget de ikke forstod. Ingen sagde det. Regningen ankom et år inde.

Spørgsmålet om hvad en AI-agent koster at køre er ikke teknisk. Det er det spørgsmål vi undlader at stille i udbudsmaterialet.

🔗 birkenborg.dev/skrifter/ingen-ved-hvad-en-ai-agent-koster
<!-- linkedin:end -->
