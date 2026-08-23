---
title: Moms på digitale ydelser til udlandet — hvor lander den egentlig?
slug: moms-paa-digitale-ydelser-til-udlandet-hvor-lander-den
publish_at: 2026-08-21T07:02:07.000Z
status: published
tags:
  - moms-afgifter
  - digitale ydelser
  - oss-ordningen
  - saas
  - leveringssted
excerpt: >-
  Sælger du SaaS eller digitale ydelser til udlandet? Leveringsstedsreglerne
  afgør, hvor momsen lander — og OSS kan spare dig for momsregistrering i hvert
  EU-land.
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: '2026-08-21T07:02:08Z'
    text: publish moms-paa-digitale-ydelser-til-udlandet-hvor-lander-den
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/2e62cec6fb00fee77f9d21fb87f7898077f16e5e
  - ts: '2026-08-12T07:02:23Z'
    text: publish earn-out-aftaler-hvorfor-de-ender-i-konflikt-og-hvordan-du
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/7d5a01982986a603cbd0b2cc393ae70f6d78a3d1
  - ts: '2026-08-07T07:02:06Z'
    text: publish ai-agenter-paa-juridisk-arbejde-hvad-der-faktisk-sker-i
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/0b7ff669dded1af7971395c7df4a7f7c014a7038
  - ts: '2026-08-03T07:01:58Z'
    text: publish whistleblowerordning-hvorfor-en-doed-postkasse-er-vaerre-end
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-dev/commit/4f64c4abd886b55e1b396911c22cea9f16f39a56
  - ts: '2026-07-27T15:43:06Z'
    text: afsender besluttet (hotmail) + routing/DMARC paa plads
    source: auto-commit
    commit_url: >-
      https://github.com/fluen1/birkenborg-agents/commit/d261ae2ae335e1ffc5aaaf9ca0f9453a7e32ba2c
---

Du sælger software, adgang til en platform eller en anden digital ydelse. Kunderne sidder i Tyskland, Frankrig, måske USA. Du fakturerer, pengene tikker ind, og alt ser fint ud — indtil nogen spørger, om I har styr på momsen. Det spørgsmål har det med at komme på et ubehageligt tidspunkt, typisk når virksomheden er vokset forbi det punkt, hvor man bare kunne håbe på at ingen kiggede.

For digitale ydelser er momsreglerne faktisk ret logiske, når man først forstår hovedprincippet. Men de kræver, at du ved, hvem kunden er — og det er sjovt nok dér, det meste af kompleksiteten bor.

## Hovedreglen: momsen følger kunden

For ydelser — modsat varer — bestemmer leveringsstedsreglerne, hvilket land der har beskatningsretten. Og for digitale ydelser er grundreglen enkel: momsen lander der, hvor kunden er.

Når kunden er en virksomhed (B2B), er leveringsstedet det land, hvor kunden er etableret. Det gælder generelt for alle ydelser, ikke kun digitale. I praksis betyder det, at du som dansk sælger fakturerer uden dansk moms, og kunden afregner momsen i sit eget land via reverse charge-mekanismen. Du skal blot sikre dig, at kunden faktisk er momsregistreret, og det verificerer du via VIES-systemet. Har kunden et gyldigt momsnummer, er du i udgangspunktet på sikker grund.

Når kunden er en privatperson (B2C), gælder en særregel for elektronisk leverede ydelser, telekommunikation og radio- og tv-spredningstjenester. Her er leveringsstedet også der, hvor kunden befinder sig — ikke hvor du som leverandør sidder. Det er en undtagelse fra den generelle B2C-regel, som ellers peger på leverandørens etableringsland. For digitale ydelser ville den generelle regel betyde, at al moms havnede i Danmark, uanset hvor kunderne sad, og det syntes EU-landene med store forbrugermarkeder forståeligt nok ikke var rimeligt.

Resultatet er, at du som dansk SaaS-virksomhed med private kunder i f.eks. Spanien i princippet skal opkræve spansk moms og afregne den til Spanien. Gang det med tyve eller flere EU-lande, og du kan se problemet.

## OSS: én registrering i stedet for femogtyve

Det er her One Stop Shop-ordningen — OSS — kommer ind. OSS er EU's svar på det åbenlyse praktiske problem: at en lille virksomhed i København ikke skal momsregistreres i hvert eneste EU-land, bare fordi den sælger et abonnement til en privatperson i Lissabon.

Med OSS registrerer du dig ét sted — i Danmark, via Skattestyrelsen — og indberetter og betaler momsen for alle dine B2C-salg af digitale ydelser til andre EU-lande gennem den ene registrering. Skattestyrelsen fordeler derefter pengene til de relevante lande. Du skal stadig opkræve momssatsen for det land, kunden sidder i, og det kræver, at du holder styr på de forskellige satser. Men du slipper for at have en momsregistrering i hvert enkelt land, og det er en massiv administrativ lettelse.

OSS er frivillig. Alternativet er at momsregistrere sig i hvert forbrugsland, og det er der ingen fornuftig grund til, medmindre du har andre aktiviteter i landet, der alligevel kræver registrering.

Der fandtes tidligere en bagatelgrænse — en tærskel på 10.000 euro i samlet B2C-fjernsalg og digitale ydelser til andre EU-lande — hvor du under grænsen kunne nøjes med at opkræve dansk moms. Logikken var, at de helt små virksomheder ikke skulle belastes med ordningen. Overskrider du grænsen, eller vælger du aktivt at registrere dig i OSS, så gælder forbrugslandets sats fra første krone. De fleste SaaS-virksomheder med bare en smule international omsætning rammer den grænse hurtigt.

## Kunder uden for EU: en anden verden

Når kunden sidder uden for EU, afhænger behandlingen igen af, om kunden er en virksomhed eller privatperson.

B2B-salg til virksomheder uden for EU er forholdsvist ligetil. Leveringsstedet er kundens land, og ydelsen falder uden for EU's momssystem. Du fakturerer uden moms. Det er i praksis det, de fleste SaaS-virksomheder med amerikanske eller britiske erhvervskunder gør, og det er korrekt.

B2C-salg til privatpersoner uden for EU er mere broget. Hovedreglen for digitale ydelser peger igen mod kundens land, hvilket betyder, at ydelsen heller ikke er momspligtig i Danmark. Men her rammer du et andet problem: du kan have pligter i kundens land. USA har f.eks. sales tax-regler, der varierer fra stat til stat, og en række lande uden for EU har indført egne regler for moms eller tilsvarende afgifter på digitale ydelser. Det er et separat og noget uoverskueligt felt, som ligger uden for OSS-ordningens rækkevidde. OSS dækker kun EU.

## Det praktiske: hvad du faktisk skal have styr på

Den vigtigste beslutning er at finde ud af, hvem dine kunder er. Ikke deres navn, men deres momsretlige status. Er kunden en virksomhed med momsnummer, eller er det en privatperson? Det afgør hele den momsmæssige behandling.

For mange SaaS-virksomheder er svaret "næsten udelukkende B2B", og så er livet relativt enkelt: verificér momsnumre, fakturér uden moms til EU-kunder med gyldigt nummer, og sørg for at fakturaerne indeholder de oplysninger, der skal til. Sælger du også til privatpersoner — og det gør en del, især ved lavpris-abonnementer og freemium-modeller — skal du tage stilling til OSS.

Du skal også have en mekanisme til at bestemme, hvor kunden befinder sig. For B2C-salg kræver reglerne, at du kan dokumentere kundens lokation med mindst to uafhængige beviser — typisk betalingsadresse, IP-adresse, bankland eller lignende. De fleste betalingsudbydere leverer de data, men du skal sikre, at de faktisk bliver opsamlet og gemt.

Et par ting, der ofte overses:

For det første skal dine fakturaer og din bogføring afspejle den korrekte momsbehandling. Det lyder selvfølgeligt, men jeg ser jævnligt virksomheder, der fakturerer med dansk moms til udenlandske erhvervskunder, fordi bogføringssystemet aldrig blev sat op til andet. Det er forkert, og det skaber bøvl i begge ender.

For det andet har OSS kvartalsvise indberetningsfrister, og de er ikke synkrone med den almindelige momsangivelse. Hvis du tilmelder dig OSS, skal din økonomiproces indrettes efter det.

For det tredje dækker OSS kun ydelser, ikke varer. Sælger du en kombination af fysiske produkter og digitale ydelser, har du potentielt to forskellige regelsæt i spil.

## Risikoen ved at lade stå til

Det her er ikke et område, hvor risikoen er teoretisk. EU-landene udveksler oplysninger, og automatiserede kontrolmekanismer bliver bedre. Konsekvensen af manglende eller forkert momsafregning er efteropkrævning, renter og potentielt bøder — i det land, der mener at have beskatningsretten. At skulle håndtere en momssag med en udenlandsk skattemyndighed er præcis så besværligt, som det lyder.

Den gode nyhed er, at reglerne for digitale ydelser faktisk hænger nogenlunde sammen, og at OSS-ordningen fungerer som en reel forenkling. Det kræver en indsats at sætte det op rigtigt — men det er en overskuelig indsats, der typisk kan klares sammen med en rådgiver i løbet af en kort proces. Alternativet er at vokse sig ind i et problem, der bliver dyrere at løse for hver måned der går.

<!-- linkedin:start -->

<!-- linkedin:end -->
