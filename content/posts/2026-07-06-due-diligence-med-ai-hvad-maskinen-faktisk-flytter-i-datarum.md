---
title: 'Due diligence med AI: hvad maskinen faktisk flytter i datarummet'
slug: due-diligence-med-ai-hvad-maskinen-faktisk-flytter-i-datarum
publish_at: 2026-07-06T07:02:21.000Z
status: published
tags:
  - ma-transaktioner
  - due diligence
  - ai-værktøjer
  - kontraktanalyse
  - virksomhedsoverdragelse
excerpt: >-
  AI kan scanne et datarum på timer i stedet for dage. Men den forstår ikke
  kontekst, og ansvaret for fejl lander hos dig. Sådan bruger du den rigtigt i
  en transaktion.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-07-13T07:03:11Z'
    text: publish kundeklausuler-og-konkurrenceklausuler-hvad-der-skal-til-for
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/8b1042d13dfc600c05c4e71355d0947f2f5cf2e6
  - ts: '2026-07-06T07:02:22Z'
    text: publish due-diligence-med-ai-hvad-maskinen-faktisk-flytter-i-datarum
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/fc0b359a3a8fb212468911971f7a55b58f53743c
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
---

Du sidder med et datarum på flere tusind dokumenter. Lejekontrakter, ansættelsesaftaler, leverandøraftaler, IP-licenser, selskabsdokumenter, garantierklæringer, forsikringspolicer og den bunke diverse som sælger har smidt i en mappe kaldet "Øvrige". Din opgave er at finde de ting der kan koste din klient penge — helst inden SPA'en bliver underskrevet.

Det er den klassiske due diligence-opgave, og den har altid været et spørgsmål om tid og øjne. Flere øjne, mere tid, bedre dækning. AI ændrer den ligning. Ikke ved at fjerne behovet for øjne, men ved at ændre hvad de bruger tiden på.

## Hvad AI rent faktisk kan i et datarum

Det AI-værktøjer gør godt — altså rigtig godt — er volumenarbejde med struktur. Ekstraktion af nøglevilkår fra standardkontrakter. Change of control-klausuler på tværs af hundredvis af leverandøraftaler. Opsigelsesfrister, konkurrenceklausuler i ansættelseskontrakter, minimumskøbsforpligtelser, renteklausuler i lånedokumenter. Den slags gentagelsestung gennemgang, hvor en juniorrådgiver traditionelt bruger dagevis på at fylde et regneark, kan en velkonfigureret AI-agent klare på timer.

Og det er ikke en teoretisk mulighed. Der findes allerede dedikerede due diligence-platforme der bruger sprogmodeller til netop det. Nogle er integreret direkte i de store datarumsløsninger. Andre er selvstændige værktøjer du peger mod et dokumentsæt. Fælles for dem er at de kan gennemgå volumen i et tempo ingen menneskelig rådgiver kan matche.

Den gevinst er reel. I en transaktion med stram tidsplan — og hvornår er tidsplanen ikke stram — kan det betyde forskellen mellem at gennemgå alle kontrakter og at nøjes med et udsnit. Og "vi kiggede kun på de væsentligste" er en sætning der aldrig har holdt ret godt i en voldgiftssag om manglende oplysninger.

## Hvad maskinen overser

Her bliver det vigtigt at være ærlig om begrænsningerne, for de er ikke trivielle.

AI-modeller arbejder med tekst. De er gode til at finde mønstre i tekst. De er markant dårligere til at forstå kontekst der ikke fremgår af dokumentet selv. Et eksempel: en leverandøraftale kan se uproblematisk ud isoleret set. Rimelige vilkår, standard opsigelsesklausul, ingen usædvanlige forpligtelser. Men hvis den leverandør leverer en komponent der er kritisk for targetselskabets primære produkt, og der kun findes to alternative leverandører globalt, er aftalen pludselig højrisiko — ikke på grund af sine vilkår, men på grund af sin kommercielle betydning. Den vurdering kræver forretningsforståelse, ikke tekstanalyse.

Samme mønster gælder for relationer mellem dokumenter. En ejeraftale der giver en minoritetsaktionær vetoret over visse beslutninger er interessant. Men den bliver kritisk hvis du sammenholder den med en planlagt omstrukturering efter closing. Den sammenkædning laver AI'en sjældent selv, medmindre du eksplicit instruerer den om det — og selv da er resultatet ustabilt.

Derefter er der det helt banale problem med kvaliteten af det materiale der ligger i datarummet. Scannede dokumenter med dårlig opløsning. Håndskrevne rettelser i margenen. Bilag der mangler. Dokumenter uploadet i forkerte mapper. En AI-agent tager det den får, og hvis det den får er et halvt ulæseligt PDF-scan af et tillæg til en lejekontrakt, producerer den enten en usikker ekstraktion eller — værre — en selvsikker forkert en. Sprogmodeller er notorisk dårlige til at sige "det her kan jeg ikke læse".

## Hvor ansvaret lander

Og det er her vi kommer til det juridiske spørgsmål som rådgivere og ejerledere begge bør tænke igennem: hvem bærer risikoen, når AI'en tager fejl?

Det korte svar er: det gør du. Eller rettere, det gør den rådgiver der afgiver due diligence-rapporten, eller den køber der undlader at opdage et problem som en rimelig undersøgelse burde have afdækket.

AI er et værktøj. Juridisk set er det ikke anderledes end at bruge en søgefunktion, et analyseredskab eller en praktikant. Resultatet er dit ansvar. Hvis din AI-agent overser en change of control-klausul der udløser opsigelsesret for targetselskabets største kunde, og den klausul ender med at koste din klient et tocifret millionbeløb, kan du ikke pege på softwaren. Din professionelle forpligtelse til at levere en forsvarlig rådgivning ændrer sig ikke fordi du har automatiseret dele af processen.

Det er ikke et argument mod at bruge AI. Det er et argument for at bruge den rigtigt — som et første lag, ikke som det eneste lag.

For sælgersiden er billedet lidt anderledes. En sælger der bruger AI til at gennemgå sit eget datarum inden det åbnes for køber kan faktisk reducere sin risiko. Du finder de problematiske klausuler selv, inden købers rådgivere gør det, og du kan vælge at adressere dem proaktivt i disclosure-processen. Overraskelser i et datarum er næsten altid dyrere for sælger end problemer der er kendt og håndteret på forhånd. Her er AI decideret værdifuld.

## Den praktiske opsætning der virker

Jeg har selv bygget workflows der bruger sprogmodeller til kontraktanalyse, og den opsætning der fungerer bedst er lagdelt.

Første lag er AI-drevet: maskinell gennemgang af samtlige dokumenter med ekstraktion af foruddefinerede datapunkter. Change of control, opsigelsesfrister, minimumsforpligtelser, garantier, pantsætninger, klausultyper du ved du leder efter. Resultatet er et struktureret overblik — et regneark, en database, en rapport — der giver dig et kort over datarummet.

Andet lag er menneskelig prioritering. Rådgiveren kigger på overblikket og identificerer de dokumenter der kræver nærmere gennemgang. Ikke alle — de væsentlige. AI'en har gjort udvælgelsen informeret i stedet for tilfældig.

Tredje lag er menneskelig analyse af de udvalgte dokumenter. Her læser nogen kontrakten. Forstår konteksten. Vurderer risikoen i lyset af transaktionens struktur, købers planer og markedets dynamik. Det lag kan AI ikke erstatte. Endnu, og sandsynligvis ikke foreløbig.

Den model sparer tid i første lag, forbedrer kvaliteten i andet lag og frigiver kapacitet til tredje lag. Det er ikke en revolution. Det er en bedre arbejdsgang.

## Hvad ledelsen skal beslutte

Hvis du er ejerleder i en salgsproces, er spørgsmålet ikke om du vil bruge AI til due diligence — din købers rådgiver gør det sandsynligvis allerede. Spørgsmålet er om du selv bruger det til at forberede dig.

En vendor due diligence, hvor sælger selv gennemgår sin virksomhed inden salgsprocessen, er i forvejen god praksis i de fleste transaktioner over en vis størrelse. AI gør den billigere og hurtigere at gennemføre, fordi den mekaniske del af kontraktgennemgangen koster mindre maskintid end rådgivertimer. Det ændrer ikke behovet for rådgiveren — det ændrer hvad rådgiveren bruger sin tid på.

Hvis du er køberrådgiver, er beslutningen mere taktisk. Hvilke dele af datarummet egner sig til AI-gennemgang? Hvor stoler du på output uden manuel kontrol, og hvor insisterer du på menneskelig gennemlæsning? Den grænse afhænger af risikoprofilen. Standardleverandøraftaler med lav værdi kan AI'en håndtere næsten alene. Aktionæraftaler, IP-overdragelser og regulatoriske tilladelser kræver øjne.

Og uanset hvilken side du sidder på: dokumentér hvad AI'en blev brugt til, og hvad den ikke blev brugt til. Den dag nogen spørger "hvordan gennemgik I datarummet" — og den dag kommer, typisk når noget er gået galt — vil du gerne kunne svare præcist. "Vi brugte AI til førstegennemgang af samtlige kontrakter og foretog manuel gennemgang af alle aftaler over en bestemt værditærskel" er et forsvarligt svar. "Vi lod en AI kigge på det hele" er det ikke.

## Det der faktisk er farligt

Den største risiko ved AI i due diligence er ikke at den overser noget. Det gør menneskelige rådgivere også, dagligt. Den største risiko er at den skaber en falsk tryghed. Et pænt output med strukturerede tabeller og grønne flueben giver indtryk af grundighed. Og grundighed er præcis det der dækker dig, når transaktionen viser sig at have en fejl.

Men grundighed kræver forståelse, ikke bare dækning. At have scannet ethvert dokument er ikke det samme som at have forstået de væsentlige. AI giver dig dækning. Forståelsen skal du stadig selv levere — eller betale nogen for at levere.

Det er ikke en svaghed ved teknologien. Det er bare dens natur. Og jo hurtigere du accepterer den skelnen, jo bedre bruger du værktøjet.

<!-- linkedin:start -->

<!-- linkedin:end -->
