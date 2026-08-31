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
  - ts: '2026-05-24T15:17:52Z'
    text: spec + plan for LinkedIn block strip in markdown pipeline
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/e4ef28383e7b9c1cd0c1105379efd56a85a30d00
  - ts: '2026-05-24T15:20:10Z'
    text: add shared LinkedIn block strip util
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/84f9e0b605af55e59ebddba00b7996297df32e21
  - ts: '2026-05-24T15:23:23Z'
    text: add remark-strip-linkedin plugin
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/b559927b2fdb981c010adb583ec5f68769fb674f
  - ts: '2026-05-24T15:27:35Z'
    text: wire remark-strip-linkedin into markdown pipeline
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/801d8c1f127e1bf06b70bf8e3c65fd0e592f0f21
  - ts: '2026-05-24T15:30:19Z'
    text: share LinkedIn strip util with site renderer
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/a98a45bc3c9b19c4be52e41836d8b7f910b02378
  - ts: '2026-05-24T15:36:36Z'
    text: 'tighten plugin match, document cross-dir import'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/536bd394d9917819991e53638486d7f7f6cd54a4
  - ts: '2026-05-24T21:16:34Z'
    text: add project CLAUDE.md for auto-mode readiness
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/a8419d348c4b3e2f8eea5a9edb06a81347177da9
  - ts: '2026-05-25T00:59:26Z'
    text: add /linkedin command showing pending queue
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/84d1d9c85235b5ccf96f314b7dec2eb20d6125ba
  - ts: '2026-05-25T09:37:12Z'
    text: 'update frontmatter title, slug, marginalia and LinkedIn link'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/8e31c376c6ae911ec4fa207a2bc69d69173c9511
  - ts: '2026-05-25T10:17:57Z'
    text: read publish_at (snake_case) from KV
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/c18beb876a1da562e202c140b45932eef8bd0fd0
  - ts: '2026-05-25T10:18:05Z'
    text: 'workflow failure env, preview_linkedin tone guard, coauthor SDK params'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/6f6332dce02a810551fd5b801a4f5d67ff24682b
  - ts: '2026-05-25T10:52:24Z'
    text: backfill linkedin_url to post frontmatter after publish
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e2f6058a5288a65ea26a56f113e60fcecd977620
  - ts: '2026-05-25T11:28:14Z'
    text: dynamic reading time from word count
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/174e534b9cc1b586590a370bb122a3c7046425e7
  - ts: '2026-05-25T16:06:43Z'
    text: >-
      reading progress, parallax marginalia, header compression, stat counters,
      bar en
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/fbff909a2509f3f190a5335f6cfc43df6fe52973
  - ts: '2026-05-26T14:19:06Z'
    text: spec for worker-native LinkedIn publish
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/9fca7a2e3a07ecc0ede14165368d3d5622665d1a
  - ts: '2026-05-26T14:22:10Z'
    text: implementation plan for worker-native LinkedIn publish
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/69b04bb695f46f9b5a25f6e65082b5e0ab3a81ec
  - ts: '2026-05-26T14:28:36Z'
    text: add LinkedIn notify/stop state helpers
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/92b73047e730de7d835b4ccd06cf15d71d0bf04f
  - ts: '2026-05-26T14:30:23Z'
    text: add LinkedIn API client + URL builder
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/28dbf130611257473d1216594c26cedd1f7a90a1
  - ts: '2026-05-26T14:34:15Z'
    text: processLinkedInQueue state machine with notify/stop/publish
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/fe23b98d1cd99e824623fb23fa4165cf7d846915
  - ts: '2026-05-26T14:38:40Z'
    text: wire processLinkedInQueue into cron + callback handlers
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/c7ab34624c1bcb9db875da8bd453f3365e6407cf
  - ts: '2026-05-26T14:46:33Z'
    text: add LinkedIn test bindings to vitest config
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/00fa474c2194684f53cb5889fd8b5596935e6572
  - ts: '2026-05-28T22:20:07Z'
    text: 'cron-streng match, fjern dobbelt-ack, slug-specifik pending_yes'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/8cea9aabdac3eaa5d3559b0ee67f29f83d9d12a3
  - ts: '2026-06-07T13:39:45Z'
    text: onboarding-runbook for synlighedsabonnement (GSC-løftet + kendte gaps)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/0028b100f446da056f8a3015af9ab8d287bc5922
  - ts: '2026-06-07T14:34:27Z'
    text: anti-stivnakket — form-variation + humor-krav i LinkedIn-stemmen
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/5724ca85a73b49a106079f098f2a92a8d5d91809
  - ts: '2026-06-07T19:08:07Z'
    text: /status med HTML-hierarki — skrifter/site/linkedin-sektioner
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/670b732a855c3547bf1d6b7c18ac466f472f998c
  - ts: '2026-06-07T19:20:26Z'
    text: LinkedIn-notify med HTML og tydelig privacy-advarsel
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/39ee7a8b61afc517f177139b340fa318b82b7a49
  - ts: '2026-06-07T19:58:00Z'
    text: ensartet fejlbesked-konvention — hvad gik galt + næste skridt
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/25489507fa34f3d2fae3becda802e2c1788a5d79
  - ts: '2026-06-07T20:05:59Z'
    text: /linkedin-kø migreret til HTML-render — sidste spec-hul lukket
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/48b5f127fce15407a307fc16bf812ec6511d00dc
  - ts: '2026-06-08T15:22:24Z'
    text: strip BOM/whitespace fra author-URN før publish
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e9d77ed199a4a0925695d86820e7b2b4370fa0dd
  - ts: '2026-06-08T15:30:12Z'
    text: tilføj requeue_linkedin for at gendanne BOM-fejlede krydsposter
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e48a8d9139f283660189792d7e64b574ff3e4b13
  - ts: '2026-06-08T15:40:10Z'
    text: backfill linkedin_url for seed-c203f3db
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/1c8afe87e8ddbad394734d39cd8868f315f3422a
  - ts: '2026-06-08T16:21:49Z'
    text: deterministisk tic-gate på LinkedIn-versionen
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/1ff7ae3f17cb0131d1dfaa195c888b315e47dcce
  - ts: '2026-06-11T00:18:45Z'
    text: Array.isArray-guard i backfillLinkedInUrl
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/eb7a1319adb74f4300a8e3fc8d7f9edc6fb7e984
  - ts: '2026-06-17T19:33:42Z'
    text: LinkedIn v2 autoritets-motor design (increment 1)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/41cba795e840d8893854448931edb9d04c492046
  - ts: '2026-06-17T19:36:25Z'
    text: 'resolve LinkedIn v2 open questions (Tue/Thu ~09:30, D1, fidelity-loosen)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/76474fe92d3108e5ef1af052a771db492c2f32fb
  - ts: '2026-06-17T19:41:15Z'
    text: 'LinkedIn v2 increment 1 implementeringsplan (10 tasks, TDD)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/514ec1e0cd1bbf0e3a3e1504086348eac9f3ec22
  - ts: '2026-06-17T22:14:38Z'
    text: LinkedIn v2 increment 1 — autoritets-motor
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/b845d3c4457b79c20d3ff7766681ea1583098745
  - ts: '2026-06-22T18:04:28Z'
    text: /smv landingsside (jura + anvendt AI)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/685832f83af43c95123cf19d71db5f3b6429e292
  - ts: '2026-06-22T21:50:55Z'
    text: 'lead-finding playbook (ICP, kanaler, kvalificering)'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/62c370544727ee5d428cea12fc5d3ceeb8be5231
  - ts: '2026-06-29T07:02:12Z'
    text: publish hvad-koster-en-ai-agent-en-rlig-prisguide-for-sma-virksomhed
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/4d21403cd33b46d1523163481520af6cfc082c59
  - ts: '2026-07-01T07:01:32Z'
    text: publish gdpr-og-ai-i-klinikker-hvad-du-faktisk-skal-have-styr-pa
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/a4c704c51579365e53e9b394202a811a9a07d8ac
  - ts: '2026-07-06T07:02:22Z'
    text: publish due-diligence-med-ai-hvad-maskinen-faktisk-flytter-i-datarum
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/fc0b359a3a8fb212468911971f7a55b58f53743c
  - ts: '2026-07-10T10:52:53Z'
    text: LinkedIn-DM peger ogsaa paa pakkesiden
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/9fa09ff80db3c2f669f7fdcfeb6088a5e7190e58
  - ts: '2026-07-13T07:03:11Z'
    text: publish kundeklausuler-og-konkurrenceklausuler-hvad-der-skal-til-for
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/8b1042d13dfc600c05c4e71355d0947f2f5cf2e6
  - ts: '2026-07-24T14:42:21Z'
    text: autopilot-pause bag KV-flag (T6 fase 1)
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/a87ad9b95c2044a864ab14c7f433d3e573d061d7
  - ts: '2026-07-24T16:06:41Z'
    text: afkobl LinkedIn-generering fra historie-pipeline naar pauset
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/ffbad6cd39cc578ca25c2be09ba609eaa16f0c56
  - ts: '2026-07-27T23:39:45Z'
    text: 'Cloudflare Email Sending som primaer vej, Resend som fallback'
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/3921d7334ca2f7296f56f3cb9101d809ecf88323
  - ts: '2026-07-28T15:19:12Z'
    text: >-
      worker-klient m. KV-kø-fallback + dagligt LinkedIn-token-tjek som første
      forbrug
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/1da3961bf8b80e46defc9ef44575bc3c89ff5dff
  - ts: '2026-07-28T15:55:41Z'
    text: final-review C1 — dedup LinkedIn-token-sag pr. expiresAt-generation
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/340a7c7e9685717ef108e6587cdfbfb1a8a7bd49
  - ts: '2026-07-30T16:33:52Z'
    text: >-
      LinkedIn-generering kasseres ved kilden naar pauset + spoergsmaal spises
      ikke
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/6fa0db5d51487b4b132ba94dbcace875356e2f87
  - ts: '2026-07-31T07:02:25Z'
    text: publish beslutningsoplaeg-til-bestyrelsen-det-dokument-der-afgoer-om
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/9e8b2c106fff5fda39a52df733f8ba6b1b17f39a
  - ts: '2026-08-05T07:03:03Z'
    text: publish omstoedelse-i-konkurs-den-betaling-du-troede-var-din
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/b8afa99ce8d21c79ce5605bb859ef06b8fb7d299
  - ts: '2026-08-06T22:15:39Z'
    text: LinkedIn i eget kald + tic-cap 0 + humor som krav
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/e25f4211cf33c8c3295a82de12ce12f0c14c9c5e
  - ts: '2026-08-07T07:02:06Z'
    text: publish ai-agenter-paa-juridisk-arbejde-hvad-der-faktisk-sker-i
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/0b7ff669dded1af7971395c7df4a7f7c014a7038
  - ts: '2026-08-26T07:01:36Z'
    text: publish bestyrelsesansvar-naar-ai-leverer-beslutningsgrundlaget
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/8cf89094a92843f72a7b9ba00cd0d367cec60de9
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
