---
title: "AI kontraktgennemgang: hvad det faktisk kan — og hvor du stadig hænger på den selv"
slug: ai-kontraktgennemgang-hvad-det-faktisk-kan-og-hvor-du-stadig
publish_at: 2026-09-04T09:02:17+02:00
status: published
tags: ["ai-maskinrum", "kontrakter", "legal ops", "in-house juridisk"]
excerpt: "AI-kontraktgennemgang sparer dig for mekanisk læsearbejde, men ændrer ikke hvem der bærer ansvaret. Praktisk guide fra en in-house-jurist der bruger det dagligt."
privacy_flag: false
linkedin_url: null
---

Du kender situationen. Der ligger 40 kontrakter i indbakken, halvdelen er fornyelser ingen har kigget på i tre år, resten er nye leverandøraftaler som forretningen gerne vil have underskrevet i går. Du har ingen paralegal, ingen trainee og ingen magisk evne til at læse hurtigere end alle andre. Så du skimmer, prioriterer på mavefornemmelse og håber, at du fanger de klausuler, der faktisk kan gøre ondt.

Det er præcis det scenarie, AI-baseret kontraktgennemgang lover at løse. Og en del af løftet holder. Men en anden del er ren marketing, og forskellen mellem de to er vigtig at forstå, før du binder dig til et værktøj eller — værre — begynder at stole blindt på output.

Jeg bruger selv AI til kontraktgennemgang dagligt. Ikke som gadget, men som et konkret produktionsværktøj i en in-house-funktion, der håndterer alt fra lejemål til SaaS-aftaler. Det her er ikke en produktanmeldelse. Det er et ærligt blik på, hvad teknologien rent faktisk gør for dig lige nu, hvor den fejler, og hvad det betyder for den risiko, du sidder med.

## Hvad AI faktisk er god til

Store sprogmodeller er exceptionelt gode til at læse struktureret tekst hurtigt og trække mønstre ud. Det gør dem velegnede til tre ting i kontraktarbejdet.

For det første: at finde og kategorisere klausuler. Giv modellen en kontrakt og bed den identificere opsigelsesvilkår, ansvarsbegrænsninger, governing law, change-of-control-bestemmelser og hvad du ellers plejer at tjekke. Det tager sekunder. Den rammer rigtigt i langt de fleste tilfælde, og den glemmer ikke en klausul, fordi den blev træt på side 37.

For det andet: at sammenligne mod en standard. Hvis du har en playbook — en liste over acceptable og uacceptable positioner — kan du lade modellen holde et udkast op mod den og få en hurtig markering af, hvor kontrakten afviger. Det er ikke anderledes end det, dyre contract lifecycle management-platforme har solgt i årevis, men nu kan du gøre det med en generel sprogmodel og et velskrevet prompt i stedet for en sekscifret licens.

For det tredje: at opsummere. En 80-siders rammeaftale kogt ned til halvanden sides overblik over de kommercielle og juridiske kernepunkter. Det er enormt værdifuldt, når du skal give en CFO eller en indkøbschef et hurtigt billede uden at sende hele aftalen.

Ingen af de tre ting erstatter juridisk vurdering. Men de sparer dig for den mekaniske del af arbejdet — den del, der æder din tid uden at kræve din hjerne.

## Hvor det går galt

Her begynder den del af samtalen, som leverandørerne helst springer over.

Sprogmodeller hallucinerer. Det er ikke en fejl, der bliver patchet væk i næste version; det er en strukturel egenskab ved teknologien. Modellen genererer tekst, der er statistisk sandsynlig, og nogle gange er det statistisk sandsynlige forkert. I kontraktsammenhæng kan det betyde, at modellen "finder" en klausul, der ikke står i dokumentet, eller overser en bestemmelse, der er formuleret atypisk.

Det sker ikke ofte. Men det sker ofte nok til, at du ikke kan behandle outputtet som en endelig gennemgang. Du kan behandle det som et første udkast, der skal verificeres — hvilket stadig er en kæmpe tidsbesparelse, men en fundamentalt anden ting end "AI har gennemgået kontrakten".

Derudover mangler modellen kontekst. Den ved ikke, at du sidste år forhandlede en særlig cap på ansvar med netop den leverandør, eller at jeres forsikring ikke dækker den type indirekte tab, som kontrakten tillader. Den kender ikke jeres risikoappetit, jeres branchemæssige sædvaner, eller at den tilsyneladende uskyldige benchmarking-klausul i praksis giver modparten adgang til jeres prisstruktur. Den slags kræver en jurist, der kender forretningen. Det er der, du kommer ind.

Og så er der et tredje problem, som er mere lavpraktisk: fortrolighed. Når du fodrer en kontrakt ind i en cloud-baseret sprogmodel, sender du potentielt fortrolige forretningsoplysninger ud af huset. Det kan konflikte med fortrolighedsklausuler i eksisterende aftaler, og det stiller krav til, hvordan du vælger og konfigurerer dit setup. Lokalt hostede modeller eller enterprise-aftaler med databehandlingsvilkår er en mulighed, men det kræver en bevidst beslutning — ikke bare at smide en PDF ind i ChatGPT.

## Hvad ledelsen skal beslutte

Det strategiske spørgsmål er ikke "skal vi bruge AI til kontrakter" — det skib er sejlet; jeres jurister gør det sandsynligvis allerede. Spørgsmålet er, om I gør det bevidst og med en struktur, der faktisk reducerer risiko i stedet for at flytte den.

Der er tre beslutninger, der skal tages.

Den første er værktøjsvalg. Bruger I en dedikeret contract review-platform, en generel sprogmodel med custom prompts, eller noget I selv bygger oven på en API? Dedikerede platforme giver typisk bedre præcision på specifikke kontrakttyper, fordi de er finjusteret til formålet. Til gengæld er de dyrere og mindre fleksible. En generel model med gode prompts og en klar playbook kan nå langt for en brøkdel af prisen, men kræver mere af brugeren.

Den anden er procesintegration. AI-output skal ind i en arbejdsgang, hvor et menneske verificerer de kritiske punkter. Det lyder banalt, men i praksis kræver det, at du definerer, hvad "kritiske punkter" betyder for netop jeres forretning. En ansvarsfraskrivelse, der er fin i én branche, kan være katastrofal i en anden.

Den tredje er kompetenceopbygning. Dine jurister — eller dig selv, hvis du er eneste jurist — skal lære at prompte effektivt, vurdere output kritisk og vide, hvornår modellen er uden for sit kompetenceområde. Det er en ny færdighed, og den tager tid at opbygge. Men den er allerede mere værdifuld end endnu et kursus i kontraktfortolkning.

## Hvor risikoen lander

Her er den ubehagelige pointe: AI ændrer ikke, hvem der bærer ansvaret. Hvis du overser en konkurrenceklausul, fordi modellen ikke flagede den, er det stadig din gennemgang, der fejlede. Ingen domstol og ingen direktion kommer til at acceptere "men AI'en sagde det var fint" som forsvar.

Det betyder, at AI-kontraktgennemgang flytter din rolle, men ikke dit ansvar. Du går fra at være den, der læser hver linje, til den der designer processen, definerer kontrolpunkterne og foretager den endelige vurdering. Det er i virkeligheden en mere krævende rolle — men også en, der skalerer bedre.

Mit bedste råd er uambitiøst: begynd med de kedelige kontrakter. Fornyelser, standardaftaler, NDA'er. Lad modellen lave det første gennemløb, og brug din tid på at verificere output og forfine dine prompts. Når du har tillid til processen på de simple aftaler, udvider du gradvist til mere komplekse dokumenter.

Teknologien er ikke perfekt. Men den er god nok til, at den jurist der ignorerer den, bruger sin tid dårligere end den, der lærer at arbejde med den. Og i en in-house-funktion, hvor tid altid er den knappe ressource, er det en forskel, der mærkes hver eneste uge.

<!-- linkedin:start -->

<!-- linkedin:end -->
