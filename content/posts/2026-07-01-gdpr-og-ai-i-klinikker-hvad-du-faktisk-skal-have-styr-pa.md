---
title: "GDPR og AI i klinikker: hvad du faktisk skal have styr på"
slug: gdpr-og-ai-i-klinikker-hvad-du-faktisk-skal-have-styr-pa
publish_at: 2026-07-01T09:01:32+02:00
status: published
tags: ["gdpr", "ai i sundhed", "klinikker", "persondata", "sundhedsdata"]
excerpt: "Sundhedsdata og AI i klinikker kræver mere end god vilje. Her er de konkrete GDPR-krav du skal have styr på — uden panik, men uden genveje."
privacy_flag: false
linkedin_url: null
---

Du driver en klinik — fysioterapi, tandlæge, psykolog, kiropraktik, hvad som helst — og du overvejer at bruge AI til noget med dine patientdata. Måske en agent der sorterer henvendelser, et værktøj der hjælper med journalnotater, eller noget der analyserer behandlingsforløb på tværs af patienter.

Og så tænker du: må jeg overhovedet det?

Det korte svar er ja. Det længere svar er ja, men du skal vide præcis hvad du gør med dataene, og du skal kunne forklare det. Ikke til mig. Til Datatilsynet, hvis de banker på.

Lad os tage det i de bidder der faktisk betyder noget.

## Sundhedsdata er ikke bare persondata

Det første du skal forstå er at persondataforordningen opererer med en særlig kategori af data der er ekstra beskyttet. Sundhedsoplysninger hører til den kategori. Det gælder journaler, diagnoser, behandlingsplaner, medicinlister — men også ting du måske ikke umiddelbart tænker over. En bookinghistorik hos en psykolog er en sundhedsoplysning, fordi den afslører at personen modtager psykologbehandling. En tandlæges røntgenbillede ligeså.

Hovedreglen for den slags følsomme data er et forbud mod behandling. Så finder man undtagelserne. Og undtagelserne findes — ellers kunne ingen klinik føre journal — men de er snævrere end for almindelige personoplysninger. Du kan typisk behandle sundhedsdata når det er nødvendigt for at yde sundhedsbehandling, eller når patienten har givet udtrykkeligt samtykke. Der er andre grunde der kan gælde, men de to er dem du oftest støder på i en klinik.

Nøgleordet er "nødvendigt". Og det er her AI-spørgsmålet bliver interessant.

## Nødvendigt til hvad, præcis?

At føre journal er nødvendigt for behandling. Ingen diskussion. Men at fodre en sprogmodel med journaldata for at se om den kan finde mønstre — er det nødvendigt for behandling? Det kommer voldsomt an på hvad du konkret gør og hvorfor.

Hvis din AI hjælper med at generere et udkast til journalnotat baseret på en diktering under konsultationen, bevæger du dig tæt på noget der understøtter selve behandlingen. Hvis den analyserer tværgående data for at optimere din forretning, er du et helt andet sted juridisk.

Den distinktion er vigtig, fordi dit behandlingsgrundlag — altså den juridiske begrundelse for at behandle dataene — skal matche det du rent faktisk bruger dem til. Du kan ikke påberåbe dig "nødvendigt for sundhedsbehandling" og så bruge dataene til markedsanalyse. Det er ikke en teknikalitet. Det er grundreglen.

## Hvor ender dataene henne?

Her er det punkt hvor de fleste klinikejere burde stoppe op og tænke en ekstra gang.

Hvis du bruger en cloud-baseret AI-tjeneste — og det gør du næsten med sikkerhed, medmindre du bevidst har valgt noget andet — sender du patientdata ud af din klinik. Til en server. Hos en udbyder. Muligvis i et andet land.

Det rejser flere spørgsmål på én gang. Først: er udbyderen din databehandler? Ja, det er den næsten altid. Og så skal du have en databehandleraftale på plads. Ikke en generisk en du fandt online, men en der beskriver præcis hvad udbyderen gør med dataene, hvor længe de opbevares, og hvad der sker med dem bagefter.

Derefter: hvor er serverne? Hvis data overføres til lande uden for EU/EØS — og det sker nemt med amerikanske AI-udbydere — skal du have et lovligt overførselsgrundlag. Det er ikke umuligt, men det kræver at du faktisk har taget stilling til det. Mange af de store API-udbydere tilbyder mulighed for at holde data inden for EU, men det er sjældent standardindstillingen. Du skal aktivt vælge det.

Og så er der det spørgsmål som overrasker folk: bruger udbyderen dine data til at træne sin model? Nogle gør. Hvis patientdata fra din klinik indgår i træningsdata for en generel sprogmodel, har du et massivt problem. Ikke bare juridisk, men i forhold til den tillid dine patienter har til dig. De fleste seriøse API-udbydere har efterhånden opt-out-muligheder eller garanterer at API-data ikke bruges til træning, men det er dit ansvar at verificere det. Stol ikke på antagelser.

## Konsekvensanalyse: det dokument ingen gider lave

Når du behandler sundhedsdata med ny teknologi, kræver persondataforordningen i mange tilfælde at du laver en konsekvensanalyse. På engelsk hedder det DPIA — Data Protection Impact Assessment. På dansk hedder det noget ingen frivilligt ville læse.

Men indholdet er faktisk ret fornuftigt. Du skal beskrive hvad du gør, hvorfor du gør det, hvilke risici det indebærer for patienterne, og hvordan du håndterer dem. Det er ikke et akademisk dokument. Det er en struktureret måde at tvinge dig selv til at tænke igennem om det du laver giver mening.

De fleste klinikker springer det over. Det er en fejl — ikke primært fordi Datatilsynet kan kritisere dig for det, men fordi processen med at lave den afslører problemer du ellers først opdager når det er for sent. Eksempelvis at den AI-udbyder du har valgt ikke kan slette specifikke patienters data på forespørgsel, hvilket du er forpligtet til at kunne.

## Patientens rettigheder forsvinder ikke fordi du bruger AI

Dine patienter har ret til indsigt i hvad du gør med deres data. De har ret til at få dem slettet under visse omstændigheder. De har ret til at gøre indsigelse mod visse former for behandling. Og de har ret til at vide om der træffes afgørelser om dem baseret udelukkende på automatiseret behandling.

Det sidste er særligt relevant. Hvis din AI-agent selvstændigt vurderer om en patient skal have en bestemt behandling, eller prioriterer patienter i en venteliste uden menneskelig mellemkomst, bevæger du dig ind i reglerne om automatiserede afgørelser. De regler giver patienten ret til menneskelig indblanding. Det er ikke noget du kan aftale dig ud af.

I praksis betyder det: lad AI'en hjælpe. Lad den foreslå, sortere, udarbejde udkast. Men lad et menneske træffe beslutningen. Det er god praksis uanset juraen, fordi AI-modeller laver fejl — og fejl med sundhedsdata har konsekvenser der ikke kan rulles tilbage med en undskyldning.

## Det handler ikke om at undgå AI

Jeg møder to typer reaktioner når jeg taler med klinikejere om det her. Den ene er fuldstændig ligegyldighed: "vi bruger bare ChatGPT til det hele, det går nok." Den anden er panik: "vi rører ikke AI med en ildtang før en advokat har sagt god for det."

Begge dele er forkerte. Den første ignorerer reelle risici. Den anden ignorerer reelle muligheder.

Den pragmatiske mellemvej: vælg en udbyder der kan holde data i EU og ikke bruger dem til træning. Få en databehandleraftale på plads. Lav en konsekvensanalyse — den behøver ikke være 40 sider, men den skal eksistere. Informér dine patienter om hvad du gør. Og hold et menneske i beslutningskæden.

Det er ikke uoverkommeligt. Det er bare noget du skal gøre bevidst i stedet for tilfældigt. Og det er sgu hele pointen med persondataregulering — ikke at forhindre dig i at bruge data, men at sikre at du har tænkt dig om inden du gør det.

<!-- linkedin:start -->

<!-- linkedin:end -->
