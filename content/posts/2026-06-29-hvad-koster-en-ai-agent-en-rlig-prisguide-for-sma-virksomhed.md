---
title: "Hvad koster en AI-agent? En ærlig prisguide for små virksomheder"
slug: hvad-koster-en-ai-agent-en-rlig-prisguide-for-sma-virksomhed
publish_at: 2026-06-29T09:02:12+02:00
status: published
tags: ["ai-agent", "prissætning", "open-source", "smv", "selvhosting"]
excerpt: "En AI-agent koster fra ører per interaktion til sekscifrede udviklingsbudgetter. Forskellen afhænger af om du vælger API eller selvhosting — og af om du bygger til den rigtige opgave."
privacy_flag: false
linkedin_url: null
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
