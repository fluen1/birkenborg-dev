---
title: >-
  Prisalgoritmer og konkurrenceret: hvornår dynamisk prissætning bliver et
  kartelproblem
slug: prisalgoritmer-og-konkurrenceret-hvornar-dynamisk-priss-tnin
publish_at: 2026-07-08T07:02:20.000Z
status: published
tags:
  - konkurrenceret
  - prisalgoritmer
  - dynamisk prissætning
  - e-commerce
  - kartelret
excerpt: >-
  Prisalgoritmer kan skabe kartelagtig adfærd uden nogen aftale. Her er de
  konkurrenceretlige faldgruber ved dynamisk prissætning — og hvad du skal have
  styr på.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-07-08T07:02:21Z'
    text: publish prisalgoritmer-og-konkurrenceret-hvornar-dynamisk-priss-tnin
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/101b6a4e7b27af5aa01989b947b1eebcbb30ff53
  - ts: '2026-07-31T07:02:25Z'
    text: publish beslutningsoplaeg-til-bestyrelsen-det-dokument-der-afgoer-om
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/9e8b2c106fff5fda39a52df733f8ba6b1b17f39a
  - ts: '2026-08-26T07:01:36Z'
    text: publish bestyrelsesansvar-naar-ai-leverer-beslutningsgrundlaget
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/8cf89094a92843f72a7b9ba00cd0d367cec60de9
---

Du har en prisalgoritme. Den overvåger konkurrenternes priser og justerer dine egne — op eller ned, afhængigt af hvad markedet gør. Måske har du bygget den selv, måske køber du den som en del af dit e-commerce-setup. Den er effektiv, den reagerer hurtigere end noget menneske, og den sikrer at du aldrig ligger markant over eller under markedet.

Og så en dag får du et brev fra Konkurrence- og Forbrugerstyrelsen.

Det scenarie er ikke hypotetisk. Konkurrencemyndigheder i både EU og resten af verden interesserer sig i stigende grad for algoritmisk prissætning, og det spørgsmål de stiller er enkelt: kan algoritmer skabe kartelagtig adfærd uden at nogen mennesker nogensinde har siddet i et rum og aftalt noget?

Svaret er ja. Og det er værd at forstå hvorfor, inden din algoritme gør det for dig.

## Grundreglen: aftaler behøver ikke et håndtryk

Konkurrencerettens kartelregler forbyder aftaler og samordnet praksis mellem virksomheder, der begrænser konkurrencen. Det gælder i dansk ret og i EU-retten. Prisaftaler er den mest klassiske overtrædelse — to konkurrenter der aftaler at holde priserne på et bestemt niveau.

Men her er det afgørende: en "aftale" i konkurrenceretlig forstand kræver ikke en underskrevet kontrakt. Den kræver ikke engang en mundtlig forståelse. Samordnet praksis — det mildere begreb — dækker situationer hvor virksomheder erstatter konkurrencens usikkerhed med indbyrdes koordinering. Og den koordinering kan være implicit.

Det klassiske eksempel er signalering. Én virksomhed annoncerer en prisforhøjelse i god tid, en konkurrent følger efter, og begge ender på et højere prisniveau end markedet isoleret set ville have båret. Ingen har aftalt noget. Men begge har ageret ud fra en forventning om den andens reaktion.

Algoritmer gør præcis det samme. Bare hurtigere.

## Tre scenarier — fra uproblematisk til brandfarligt

Det er nyttigt at skelne mellem tre typer algoritmisk prissætning, fordi de er vidt forskellige i et konkurrenceretligt perspektiv.

Det første scenarie er ensidig prisovervågning. Din algoritme holder øje med konkurrenternes priser og justerer dine egne ud fra en strategi du selv har defineret. Du følger markedet. Det er i udgangspunktet lovligt. Konkurrenceretten forbyder ikke at du reagerer på markedsinformation — den forbyder at du koordinerer med dine konkurrenter. At vælge at matche en konkurrents pris er en ensidig beslutning, ikke en aftale.

Det andet scenarie er delt algoritme. Flere konkurrenter bruger samme prisalgoritme-udbyder, og algoritmen har adgang til samtlige kunders prisdata. Ikke nødvendigvis fordi nogen har planlagt det — men fordi den dominerende software på markedet tilfældigvis bruges af de fleste spillere. Her begynder det at blive ubehageligt. Algoritmen fungerer i praksis som en koordineringsmekanisme, fordi den optimerer priser på tværs af konkurrenter med fælles datagrundlag. EU-Kommissionen har udtalt sig om det her scenarie, og signalet er klart: det at informationen løber gennem en tredjeparts algoritme i stedet for direkte mellem konkurrenterne gør den ikke lovlig.

Det tredje scenarie er det der virkelig bekymrer konkurrencemyndighederne: algoritmisk kollusion. To eller flere konkurrenters algoritmer lærer over tid at samarbejde — ikke fordi de er programmeret til det, men fordi det er den strategi der maksimerer profit for dem begge. I et marked med få aktører, høj pristransparens og hurtige justeringer kan algoritmer nå en stiltiende ligevægt, der ligner resultatet af en prisaftale, uden at noget menneske har taget en bevidst beslutning om at koordinere.

Det er her den juridiske gråzone er størst, og den er langt fra afklaret.

## Hub-and-spoke: den skjulte risiko ved din softwareleverandør

Det andet scenarie fortjener særskilt opmærksomhed, fordi det rammer bredere end de fleste tror.

Foresstil dig at du og tre af dine største konkurrenter alle bruger den samme repricing-software. Softwaren trækker data fra alle fire kunder for at optimere priser. I har aldrig talt sammen. I ved måske ikke engang at I bruger samme udbyder. Men resultatet er at jeres priser konvergerer, fordi de alle justeres af samme system mod samme datapunkt.

I konkurrenceretlig terminologi ligner det en hub-and-spoke-aftale — en konstruktion hvor konkurrenter koordinerer via en fælles tredjepart uden direkte kontakt indbyrdes. Det kræver ikke ond vilje. Det kræver bare en udbyder med en tilstrækkelig stor markedsandel og en optimeringslogik der belønner priskonvergens.

Den juridiske vurdering afhænger af hvad udbyderen konkret gør med data. Deler algoritmen individualiserede prisdata på tværs af konkurrenter? Bruger den aggregerede data? Optimerer den for den enkelte kundes profit isoleret, eller for systemets samlede output? De svar finder du i udbyderens tekniske dokumentation — som du sandsynligvis aldrig har læst.

Og det er et problem i sig selv. For din compliance-risiko afhænger af funktioner i en software du ikke nødvendigvis forstår på det niveau.

## Hvad myndighederne faktisk kan gøre

EU-Kommissionen og de nationale konkurrencemyndigheder har endnu ikke ført mange sager specifikt om algoritmisk kollusion. Men retningen er tydelig. Kommissionen har gentagne gange signaleret at den betragter algoritmer som virksomhedens ansvar — du kan ikke outsource din konkurrenceretlige forpligtelse til en maskine. Hvis din algoritme koordinerer priser med en konkurrents algoritme, er det din overtrædelse.

De sager der har været, har typisk handlet om mere klassiske scenarier: virksomheder der bevidst har brugt software til at implementere en prisaftale. Én konkret sag fra det amerikanske justitsministerium involverede sælgere på en online markedsplads der brugte en fælles algoritme til at holde priserne på plakater oppe. Det var ikke sofistikeret maskinlæring — det var et banalt priskartel faciliteret af software. Men det etablerede princippet: algoritmen er midlet, ikke undskyldningen.

Den store ubesvarede juridiske udfordring er den rene algoritmiske kollusion — den tredje type — hvor ingen mennesker har truffet en beslutning om at koordinere. Kan du sanktionere en virksomhed for noget dens algoritme gjorde af sig selv? Teknisk set kræver samordnet praksis en form for viljesbestemt kontakt mellem parterne. Hvis to algoritmer konvergerer mod samme pris uden menneskelig instruks, er det tvivlsomt om det eksisterende begrebsapparat rækker.

Men det er en akademisk trøst. I praksis vil en konkurrencemyndighed der finder priskonvergens i et oligopol-marked næppe tøve med at undersøge, og bevisbyrden for at dine algoritmer handlede helt autonomt uden nogen form for tilskyndelse er tung at løfte.

## Hvad du som e-commerce-leder konkret skal beslutte

Den første beslutning er at finde ud af hvad din algoritme faktisk gør. Det lyder selvfølgeligt, men de fleste virksomheder jeg taler med kan beskrive resultatet ("vores priser følger markedet") uden at kunne beskrive mekanismen. Trækker algoritmen kun offentligt tilgængelige data, eller har den adgang til konkurrenters backend-information via en delt udbyder? Optimerer den prisen isoleret for dig, eller indgår du i et netværk? Er der datadeling involveret?

Den anden beslutning handler om din udbyder. Hvis du bruger en tredjeparts prisoptimering, har du brug for at forstå — og kontraktuelt regulere — hvad udbyderen gør med dine data. En konkret klausul om at dine prisdata ikke deles med eller bruges til optimering for konkurrerende kunder er ikke paranoia. Det er forsigtig forretningsførelse. Du vil gerne kunne dokumentere at du har taget aktivt stilling til risikoen, hvis en myndighed ringer.

Den tredje beslutning er om grænser. De fleste repricing-algoritmer kan konfigureres med gulve og lofter — mindste- og maksimumsgrænser for prisjusteringer. Det er ikke bare et kommercielt værktøj. Det er også din forsikring mod at algoritmen driver priserne i en retning der ligner koordinering. En algoritme der automatisk matcher enhver prisforhøjelse hos konkurrenten inden for sekunder, uden begrænsning, producerer en adfærd der fra myndighedens perspektiv er vanskelig at skelne fra en aftale.

Og den fjerde: dokumentation. Bevar logfiler over prisændringer og de data der udløste dem. Hvis du nogensinde skal forklare hvorfor dine priser ligner konkurrenternes, er "algoritmen gjorde det" ikke et svar. "Algoritmen fulgte denne logik, baseret på disse inputs, inden for disse parametre" er et svar.

## Risikoen er asymmetrisk

Her er det der gør emnet relevant for ledelsen og ikke bare for compliance-afdelingen: sanktionerne i konkurrenceretten er ikke symbolske. Bøder for kartelovertrædelser beregnes som en procentdel af virksomhedens omsætning. I EU kan det løbe op i ti procent af den globale årsomsætning. For en e-commerce-virksomhed med stramme marginer er det potentielt eksistentielt.

Og risikoen er ulige fordelt. Store platforme med dedikerede compliance-teams har ressourcer til at forstå og dokumentere deres algoritmer. Mellemstore e-commerce-virksomheder der bare har købt et repricing-plugin og aldrig set under motorhjelmen, har præcis samme juridiske risiko — og langt færre ressourcer til at håndtere den.

Det er ikke et argument for at droppe dynamisk prissætning. Det er et stærkt argument for at vide hvad du har købt, og hvad det gør. Din prisalgoritme er et fantastisk kommercielt værktøj. Den er også en potentiel konkurrenceretlig forpligtelse. De to ting kan sagtens eksistere samtidig — men kun hvis du behandler dem som det de er.

<!-- linkedin:start -->

<!-- linkedin:end -->
