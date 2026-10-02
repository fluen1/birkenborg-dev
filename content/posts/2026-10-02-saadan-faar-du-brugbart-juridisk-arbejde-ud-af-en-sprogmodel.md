---
title: "Sådan får du brugbart juridisk arbejde ud af en sprogmodel"
slug: saadan-faar-du-brugbart-juridisk-arbejde-ud-af-en-sprogmodel
publish_at: 2026-10-02T09:02:04+02:00
status: published
tags: ["ai-maskinrum", "prompt engineering", "juridisk metode", "legal tech", "in-house jura"]
excerpt: "En sprogmodel giver brugbart juridisk output, når du prompter den som en opgavebeskrivelse — ikke et søgefelt. Her er disciplinen bag."
privacy_flag: false
linkedin_url: null
---

De fleste jurister har prøvet at smide en opgave ind i ChatGPT, fået noget der lignede et svar, og derefter brugt længere tid på at rette det end de ville have brugt på at skrive det selv. Det er ikke modellens skyld. Det er promptens.

En sprogmodel er ikke en jurist. Den er en ekstremt kompetent tekstmaskine, der forudsiger det mest sandsynlige næste ord baseret på mønstre i enorme mængder tekst. Det betyder, at den er exceptionelt god til at formulere ting der *lyder* rigtige — og fuldstændig ligeglad med om de *er* rigtige. Den skelner ikke mellem gældende ret og noget den har set i en australsk law review fra 2019. Forstår du dén mekanisme, kan du arbejde med den. Ignorerer du den, producerer du professionel risiko i markdown-format.

## Prompten er ikke et spørgsmål — den er en opgavebeskrivelse

Den mest udbredte fejl er at behandle en LLM som en søgemaskine. "Hvad siger erhvervslejeloven om opsigelse?" giver dig et generisk svar, der måske rammer dansk ret, måske ikke. Du har ikke bedt om kontekst, jurisdiktion, formål eller format — og modellen gætter gladeligt på alle fire.

Det der virker, er at prompte som du ville briefe en dygtig studentermedhjælper på sin første dag. Ikke fordi modellen er dum, men fordi den mangler alt det du tager for givet: hvilken jurisdiktion, hvilken kontekst, hvem der skal læse outputtet, og hvad du vil bruge det til. Jo mere du ekspliciterer, jo mindre skal modellen gætte. Og gæt er præcis det den gør, når du ikke fortæller den andet.

En brugbar juridisk prompt indeholder typisk fem elementer. Ikke som en tjekliste man slavisk gennemgår, men som discipliner man har tænkt igennem:

**Rolle og perspektiv.** Fortæl modellen hvem den er og hvem den skriver for. "Du er in-house jurist i en dansk mellemstor virksomhed. Skriv til virksomhedens CFO" sætter en helt anden ramme end intet. Modellen justerer kompleksitet, detaljeringsgrad og tone efter det du beder om.

**Jurisdiktion og retsområde.** Dansk ret. Ikke "international best practice", ikke "generel kontraktret" — dansk ret, og gerne det specifikke retsområde. Hvis du arbejder med en funktionskøbssituation, så sig det. Hvis det er entreprise, sig det. Modellen vil ellers trække på det bredest mulige korpus, og du ender med et svar der er lidt rigtigt overalt og helt rigtigt ingen steder.

**Opgavens karakter.** Er det et første udkast til et notat? En risikovurdering? En opsummering af argumenter for og imod? En kontraktklausul? Forskellen i output er enorm, og modellen vælger format og dybde baseret på hvad du beder om.

**Det du allerede ved.** Giv modellen de fakta den skal arbejde med. Kopiér den relevante kontraktbestemmelse ind. Beskriv situationen. Jo mere kontekst, jo mindre fyld. En model uden fakta producerer generelt stof. En model med fakta producerer specifikt stof. Det første er sjældent brugbart.

**Hvad den skal lade være med.** Det her er undervurderet. Sig eksplicit: "Opfind ikke paragrafnumre. Hvis du er usikker på om en regel gælder i dansk ret, så skriv det." Sprogmodeller hallucinerer mindre, når du gør det legitimt at sige "det ved jeg ikke". Uden den instruktion vil den altid producere noget der ligner sikkerhed — også når den burde tvivle.

## Iteration slår den perfekte prompt

Der er en udbredt forestilling om, at den rigtige prompt giver det rigtige svar i første forsøg. Det sker næsten aldrig med juridisk arbejde af nogen kompleksitet. Det der faktisk virker, er iteration: du læser outputtet kritisk, identificerer hvor modellen gik galt eller var for overfladisk, og prompter igen med korrektion.

Det er ikke et tegn på at værktøjet fejler. Det er præcis sådan du ville arbejde med en kollega der leverede et første udkast. Forskellen er, at modellen leverer udkastet på sekunder i stedet for timer, og at du kan køre tre-fire iterationer på den tid det tager at hente kaffe.

En konkret teknik: bed modellen om at strukturere sit svar med overskrifter, og bed den derefter om at uddybe eller korrigere ét afsnit ad gangen. Det holder kontekstvinduet fokuseret og reducerer tendensen til at svar bliver mere generiske jo længere samtalen bliver.

## Hvad modellen er god til, og hvad den ikke er god til

Her er det værd at være ærlig, for begejstring og skepsis er begge dårlige rådgivere.

En sprogmodel er stærk til at producere strukturerede førstekast af notater, kontrakter og mails. Den er god til at identificere emner du bør overveje — en slags brainstorm-partner der har læst ufatteligt meget. Den er rigtig god til at omformulere og tilpasse tekst til en bestemt modtager. Og den er overraskende brugbar til at finde huller i din egen argumentation, hvis du beder den spille modpart.

Den er derimod upålidelig når det gælder specifik retspraksis, præcise lovhenvisninger og gældende beløbsgrænser eller frister. Den opfinder domme. Den blander jurisdiktioner. Den præsenterer forældet ret med samme overbevisning som gældende. Hvis dit output skal indeholde konkrete retskilder, skal du verificere dem selv. Hver eneste én. Der er ingen genvej her, og det er ikke et problem der løses af en bedre prompt — det er en strukturel begrænsning ved teknologien i dens nuværende form.

## Hvor risikoen faktisk lander

Når du bruger en LLM til juridisk arbejde, ændrer det ikke hvem der er ansvarlig for resultatet. Det gør du stadig. Modellen er et værktøj, og outputtet er dit arbejdsprodukt i det øjeblik du sender det videre.

Det betyder, at disciplinen ikke ligger i prompten alene — den ligger i den kritiske læsning bagefter. Prompten bestemmer kvaliteten af råmaterialet. Din faglighed bestemmer kvaliteten af det færdige produkt. Forveksler du de to, har du et problem.

Den praktiske konsekvens er enkel: brug modellen til at accelerere det arbejde du allerede kan lave. Brug den ikke som erstatning for viden du ikke har. En erfaren kontraktjurist der prompter en LLM til at lave et første udkast til en SPA får et brugbart udgangspunkt. En projektleder uden juridisk baggrund der gør det samme får noget der ligner en SPA — og det er værre end ingenting, fordi det skaber en falsk tryghed.

## Byggestenene i praksis

Hvis du vil i gang seriøst, så start med opgaver du kender godt nok til at vurdere outputtet kritisk. Standardnotater, opsummeringer af komplekse aftaler, udkast til interne politikker. Byg en lille samling af prompts der virker for de opgavetyper du løser ofte, og justér dem løbende. Det er ikke raketvidenskab — det er håndværk, og som alt håndværk bliver det bedre med gentagelse.

Den egentlige gevinst er ikke at modellen erstatter din juridiske vurdering. Det er, at den fjerner de timer du bruger på at stirre på en blank side og formulere det du allerede ved. Det er frigjort tid til det arbejde der faktisk kræver en jurist: vurderingen, prioriteringen, rådgivningen. Resten er tekstproduktion, og tekstproduktion er præcis det en sprogmodel er bygget til.

<!-- linkedin:start -->

<!-- linkedin:end -->
