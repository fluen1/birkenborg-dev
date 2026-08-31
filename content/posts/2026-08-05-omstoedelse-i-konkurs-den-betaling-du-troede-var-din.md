---
title: 'Omstødelse i konkurs: den betaling du troede var din'
slug: omstoedelse-i-konkurs-den-betaling-du-troede-var-din
publish_at: 2026-08-05T07:03:02.000Z
status: published
tags:
  - insolvens
  - omstødelse
  - konkurs
  - kreditrisiko
  - konkursret
excerpt: >-
  Omstødelsesreglerne lader kurator kræve betalinger og sikkerheder tilbage.
  Forstå logikken, tidsvinduerne og hvordan du beskytter dig som kreditor.
privacy_flag: false
linkedin_url: null
marginalia:
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
---

Din kunde har betalt sin faktura. Pengene står på kontoen, bogføringen er afstemt, og du har glemt alt om den uro der var omkring samhandlen de sidste måneder. Seks uger senere går kunden konkurs. Og tre måneder efter det lander der et brev fra kurator: betalingen skal tilbage.

Det er omstødelse. Og reaktionen er næsten altid den samme: det kan de da ikke. Jo. Det kan de. Konkurslovens omstødelsesregler giver et konkursbo ret til at kræve visse betalinger og dispositioner tilbageført, hvis de er foretaget i en periode op til konkursen. Formålet er at sikre at alle kreditorer behandles lige — at en enkelt kreditor ikke løber med kassen i de sidste desperate uger, mens resten sidder tilbage med en dividende på tre procent.

Logikken er fair nok. Men den rammer også kreditorer der bare fik hvad de havde til gode, til tiden, for en reel leverance. Og det er præcis derfor du skal forstå reglerne, før din samhandelspartners økonomi begynder at vakle.

## Grundtanken: ligebehandling af kreditorer

Konkursretten hviler på ét princip der overtrumfer næsten alt andet: kreditorer med samme prioritet skal behandles lige. Når en virksomhed er insolvent, er der per definition ikke nok til alle. Omstødelsesreglerne er det værktøj der håndhæver ligheden ved at rulle tiden tilbage — ved at omgøre de dispositioner der gav en enkelt kreditor en fordel på de øvriges bekostning.

Det vigtige at forstå er at omstødelse ikke forudsætter at nogen har gjort noget forkert. Du behøver ikke have handlet i ond tro. Du behøver ikke have presset din skyldner. Du behøver ikke engang have vidst at skyldneren var i vanskeligheder. Nogle af omstødelsesreglerne er rent objektive — de ser kun på hvad der skete, hvornår det skete, og om resultatet er en forskydning af kreditorernes indbyrdes stilling. Andre kræver at kurator påviser subjektive elementer som ond tro, men beviskravene er ikke nødvendigvis så tunge som du måske forestiller dig.

Den sondring mellem objektive og subjektive regler er nøglen til at forstå din risiko som kreditor.

## De objektive regler: tidsfrister og automatik

De objektive omstødelsesregler fungerer nærmest mekanisk. Ligger en disposition inden for en bestemt frist før konkursen — den såkaldte omstødelsesperiode — og opfylder den nogle faktuelle kriterier, kan den omstødes. Kurator behøver ikke bevise at du vidste noget som helst.

Den vigtigste regel for almindelige kreditorer angår betaling af gæld. En betaling kan omstødes hvis den er foretaget i en periode op til fristdagen — typisk det tidspunkt hvor skifteretten modtog konkursbegæringen — og betalingen enten er sket med usædvanlige betalingsmidler, er sket før forfaldstid, eller har forringet skyldnerens betalingsevne væsentligt. Det afgørende her er begrebet "usædvanlige betalingsmidler". En bankoverførsel for en forfalden faktura er som udgangspunkt et sædvanligt betalingsmiddel. Men hvis din skyldner pludselig betaler med en maskine fra produktionen, en bil fra flåden, eller ved at overdrage et tilgodehavende hos en tredjepart, så er det usædvanligt — og så ryger betalingen.

Betaling før normal forfaldstid er et andet objektivt kriterium. Har din kunde en betalingsfrist på tredive dage og betaler efter fem, kort før konkursen, vil kurator se på det med interesse. Tidlig betaling i en presset periode er sjældent et udtryk for god likviditetsstyring — det er et udtryk for at nogen har fået forrang.

Omstødelsesperioderne er relativt korte for de objektive regler. Vi taler typisk om tre måneder før fristdagen. Men — og det er væsentligt — perioden forlænges markant hvis du er nærtstående. Er skyldneren et selskab, og er du hovedaktionær, direktør, bestyrelsesmedlem, eller et selskab i samme koncern, udvides vinduet til op mod to år. Den udvidede frist for nærtstående er en af de mest effektive omstødelsesbestemmelser i praksis, fordi nærtstående pr. definition har adgang til information om skyldnerens reelle økonomiske situation.

## Sikkerhedsstillelse: den panteret der aldrig var sikker

Omstødelse rammer ikke kun betalinger. Den rammer også sikkerhedsstillelse — pant, virksomhedspant, kaution og andre former for sikkerhed der er stillet i en bestemt periode op til konkursen.

Hovedreglen er at en sikkerhed der er stillet for ældre gæld — altså gæld der allerede bestod da sikkerheden blev givet — kan omstødes hvis den er stillet inden for omstødelsesperioden. Det scenarie er ekstremt almindeligt: en leverandør mærker at kunden halter, kræver sikkerhed for det eksisterende mellemværende, og får pant i kundens varelager, udstyr eller tilgodehavender. Sikkerheden føles betryggende. Men den er givet for en allerede eksisterende fordring — det der kaldes "efterfølgende sikkerhedsstillelse" — og den er dermed sårbar over for omstødelse.

Den sikkerhed der typisk holder er den der er aftalt og stillet samtidig med at gælden opstår. Sælger du varer med ejendomsforbehold, og ejendomsforbeholdet er gyldigt aftalt ved leverancen, har du en sikkerhed der ikke er efterfølgende — den er samtidige med fordringens opståen. Det gør den væsentligt mere robust over for omstødelse. Samme logik gælder for den bank der betinger et nyt lån af pant i et aktiv: lånet og pantet opstår samtidig, og dispositionen er derfor ikke en begunstigelse af en eksisterende kreditor.

Virksomhedspant fortjener en særlig bemærkning. Virksomhedspant er et flydende pant i skiftende aktiver — typisk varelager, driftsinventar og tilgodehavender. Det etableres ved tinglysning og giver pantekreditoren en løbende sikkerhed i aktivmassen. Men konkurslovens regler gør at virksomhedspantet får en særlig behandling i konkurs: boet har en ret til at udtage en vis andel af de pantsatte aktiver til dækning af omkostninger. Og en udvidelse af et virksomhedspant til nye aktivtyper kort før konkurs kan rammes af omstødelsesreglerne på samme måde som enhver anden efterfølgende sikkerhedsstillelse.

## Den subjektive regel: utilbørlige dispositioner

Ved siden af de objektive regler har konkursloven en bredere, subjektiv omstødelsesregel der fanger dispositioner som er utilbørlige. Den regel har en længere tidsfrist — typisk et til to år — og rækker videre end de objektive regler. Til gengæld kræver den at kurator beviser at dispositionen var utilbørlig, og at modtageren — altså du — vidste eller burde have vidst at skyldneren var insolvent eller blev det som følge af dispositionen.

Den subjektive regel er kurators bredeste våben, men også det sværeste at bruge. "Utilbørlig" er en retlig standard, ikke et præcist kriterium, og vurderingen afhænger af sagens konkrete omstændigheder. En betaling af en forfaldent faktura med sædvanlige betalingsmidler er som udgangspunkt ikke utilbørlig, heller ikke selv om du godt vidste at kunden var presset. Men en betaling af en enkeltkreditors fulde tilgodehavende, foretaget i en situation hvor skyldneren åbenlyst ikke kan betale sine øvrige kreditorer, og hvor du aktivt har presset på for at blive betalt forud for andre — det kan krydse grænsen.

Grænsen er vanskelig at trække generelt, og det er meningen. Reglen er designet som en sikkerhedsventil der fanger de tilfælde som de objektive regler ikke rammer, men som alligevel strider mod den grundlæggende ligebehandling.

## Hvornår du skal skærpe opmærksomheden

Du får typisk ikke et brev fra din samhandelspartner der fortæller at de er insolvente. Men der er signaler. Betalinger der konsekvent falder efter forfald. Anmodninger om forlængede kreditvilkår. Omstruktureringer og ledelsesudskiftninger. Rygter i branchen. Stamavis-artikler om afskedigelsesrunder.

Når de signaler opstår, ændrer omstødelsesreglerne dit risikobillede fundamentalt. Ikke fordi reglerne ændrer sig — men fordi sandsynligheden for at de bliver relevante stiger drastisk. Og fordi din viden om kundens situation potentielt aktiverer den subjektive omstødelsesregel.

Det paradoksale er at den naturlige reaktion — at kræve hurtigere betaling, stramme kreditten, forlange sikkerhed — er præcis de dispositioner der er mest sårbare over for omstødelse. Du forsøger at beskytte dig. Og den beskyttelse er den kurator ruller tilbage.

Det betyder ikke at du bare skal læne dig tilbage og håbe på det bedste. Det betyder at du skal beskytte dig på de rigtige måder.

## Hvad du konkret kan gøre

Den mest robuste beskyttelse er samtidige aftaler. Stiller du nye leverancer betinget af forudbetaling eller betaling ved levering, er den betaling du modtager ikke en betaling af ældre gæld — den er vederlag for en ny leverance. Den transaktion flytter ikke midler væk fra de øvrige kreditorer, fordi boet også modtager en modydelse i form af varerne. Kurator kan stadig undersøge om prisen var rimelig, men en reel handel til markedspris er grundlæggende omstødelsessikker.

Ejendomsforbehold aftalt ved leverancen — ikke efterfølgende — er en sikkerhed der opstår samtidig med gælden og derfor er markant mere robust end et pant stillet for ældre mellemværender. Sørg for at ejendomsforbeholdet er gyldigt aftalt, helst skriftligt, og at det opfylder de krav der gælder for den pågældende type aktiv.

Undlad at modtage usædvanlige betalingsmidler fra en presset kunde. Får du tilbudt betaling i form af udstyr, køretøjer eller andre aktiver i stedet for penge, bør alarmklokkerne ringe. Uanset hvor attraktivt det virker i øjeblikket, er det præcis den type betaling der omstødes næsten automatisk.

Dokumentér din samhandel løbende. Hvis du ender i en omstødelsessag, vil kurator gennemgå korrespondance, fakturaer og betalingsmønstre. Din bedste forsvar er dokumentation der viser at samhandlen fulgte normale vilkår og mønstre — at der ikke var tale om et pludseligt brud med den hidtidige praksis.

## Hvad der sker når brevet lander

Kurator sender et krav om tilbagebetaling. Du er uenig. Hvad nu?

Du har ikke pligt til bare at betale. Omstødelseskrav er krav som enhver anden fordring — kurator skal kunne dokumentere at betingelserne er opfyldt, og du har ret til at bestride kravet. Men du skal tage det alvorligt og reagere hurtigt, fordi passivitet sjældent forbedrer din position.

Få juridisk rådgivning tidligt. Omstødelsesreglerne er tekniske, fristerne er korte, og konsekvenserne er binære: enten skylder du beløbet tilbage, eller også gør du ikke. Der er ikke meget mellemmål. En vurdering af om kravet holder kræver analyse af den konkrete disposition, tidspunktet, betalingsmidlet, og din viden om skyldnerens situation. Det er sjældent noget du kan vurdere selv.

Vær også opmærksom på at kurator ofte sender omstødelseskrav ud bredt — til alle kreditorer der har modtaget betalinger i omstødelsesperioden — som en slags standardøvelse. Ikke alle krav holder. Men de krav der holder, er kurator sjældent villig til at forhandle væk, fordi omstødte beløb er rene penge ind i boet til fordeling blandt kreditorerne.

## Det langsigtede perspektiv: kreditpolitik som forsvar

Omstødelsesrisikoen er ikke et problem du løser når konkursen rammer. Den er et risikoelement du håndterer i din løbende kreditpolitik. Virksomheder med en bevidst tilgang til kreditrisiko — løbende kreditvurdering af kunder, klare betingelser for sikkerhed, definerede procedurer for hvornår samhandlen stoppes — står bedre end dem der først reagerer når betalingerne udebliver.

Den vigtigste erkendelse er enkel: de penge du modtager fra en insolvent skyldner i de sidste måneder før en konkurs, er ikke nødvendigvis dine penge. De kan tilhøre den samlede kreditormasse. Og den bedste måde at undgå den situation er ikke at have et tilgodehavende hos en insolvent skyldner. Det kræver at du handler på signalerne tidligt — reducerer eksponeringen, strammer vilkårene for nye leverancer, og accepterer at den kortsigtede omkostning ved at miste en kunde er lavere end den langsigtede omkostning ved at miste både kunden og betalingen.

<!-- linkedin:start -->

<!-- linkedin:end -->
