---
title: "10 agents i produktion — sådan er de organiseret"
slug: "10-agents-i-produktion"
publish_at: 2026-04-28T09:00:00+02:00
status: published
tags: ["agenter", "arkitektur"]
privacy_flag: false
excerpt: "Et nørdet kig ind i mit Claude Code-setup: hvilke agenter, hvad de kan, og hvad jeg har lært om at orkestrere dem."
marginalia: []
---

Ti agents lyder som mange. Det er det også, i den forstand at det er ti ting der kan gå galt på ti forskellige måder. Men de kom til gradvist — én ad gangen, over omtrent et år — og det er nok den eneste grund til at de stadig kører.

Hvis jeg havde sat dem op samtidig, ville projektet være druknet i sin egen kompleksitet inden det kom i gang.

---

Grundstrukturen er enkel. Jeg har tre typer:

**Domæne-agenter** der forstår et specifikt retsområde og kan læse dokumenter inden for det. De fem er `ansaettelsesret`, `sundhedsret`, `selskabsret`, `udbud` og `m-and-a_diligence`. De deler ingen kode — de har hvert sit system-prompt, hvert sit eksempel-korpus og hver sin forventning om hvad der er normalt og hvad der er et problem. Det er bevidst. En agent der er god til alle retsområder er typisk ikke særlig god til nogen af dem.

**Tværgående analyse-agenter** der ikke kender ét retsområde dybt men kan se på tværs. `contract_review`, `gdpr_audit` og `compliance_scan` hører herhjemme. De processerer et dokument og returnerer struktureret output — altid. Ikke prosa. Ikke "det ser overordnet fornuftigt ud". Et JSON-objekt med fund, risici og references til de specifikke afsnit.

**Infrastruktur-agenter** der ikke analyserer men genererer eller verificerer. `doc_generator` skriver udkast baseret på skabeloner og parametriserede inputs. `citation_checker` tager et juridisk dokument, finder alle referencer til love, bekendtgørelser og domme, og tjekker om de faktisk eksisterer og siger det der påstås. Den sidst­nævnte er den jeg er mest glad for og den der tager længst tid at forklare til folk.

---

Orkestreringen er lavteknologisk. Jeg har ikke bygget et fancy pipeline-system. Det er et Python-script der kaldes med et dokument og en opgave, bestemmer hvilken agent (eller hvilke agenter) der er relevante, sender til Claude API'et og logger outputtet til en SQLite-database.

Det er bevidst ikke mere kompliceret end det. Jeg troede i starten at jeg havde brug for et orchestration-framework. Jeg har prøvet tre. Jeg er vendt tilbage til scriptet.

---

Her er det der ikke virkede, konkret:

`citation_checker` var i to måneder dårlig til at finde domme fra Højesteret citeret i det format advokater faktisk bruger. Formatet er ikke konsistent. Det er en menneskelig konvention der har akkumuleret variation over årtier, og min agent lærte kun én variant. Resultatet var at den returnerede "citation valid" på domme der ikke eksisterede — den matchede formateringen men validerede ikke mod den faktiske dombog.

Jeg opdagede det ved et tilfælde. Jeg læste output på et dokument jeg selv kendte godt nok til at vide at en bestemt dom ikke citerede det den angiveligt citerede. Agenten sagde "valid". Dommen eksisterede, men afsnittet den refererede til handlede om noget helt andet.

Det var et problem med mit valideringskriterie — ikke med modellen. Jeg valgte at tjekke om citationen var formateringsmæssigt korrekt. Det er ikke det samme som at tjekke om den er indholdsmæssigt korrekt. De to ting forveksler jeg stadig somme tider.

Jeg brugte tre weekender på at bygge en ordentlig integrationstjeneste til domsdatabasen. Den er stadig ikke perfekt, men den er bedre.

---

Det der overraskede mig mest ved at have ti agenter kørende er ikke kompleksiteten. Det er vedligeholdelsen.

Loven ændrer sig. Bekendtgørelser ændrer sig. EU-forordninger gennemføres og ændrer dansk ret. Hver gang det sker, er der sandsynligvis en agent der nu returnerer forkerte svar — ikke fordi koden er brudt, men fordi verden har ændret sig og agenten ikke ved det.

Jeg har ingen god løsning på det. Jeg har en reminder i min kalender der hedder "agent-review" og som aflyses oftere end den holdes.

---

`m-and-a_diligence` er teknisk set den mest avancerede — den kan håndtere due diligence-pakker på op til et par hundrede sider og returnerer et struktureret fund-indeks med risikovurderinger. Jeg brugte uforholdsmæssigt lang tid på den. Den bruges sjældnest.

`compliance_scan` er den mindst imponerende teknisk set. Den tjekker om et dokument har de klausuler GDPR kræver, siger "mangler" eller "til stede" for hver, og returnerer en samlet risikoprofil. Den bruges mest.

Det er ikke overraskende i bagklogskabens lys.

---

Jeg ved ikke hvad antallet af agenter siger om noget. Ti er ikke en rund lærdom — det er bare det antal problemer jeg har mødt der var veldefinerede nok til at automatisere og vigtige nok til at det var værd at bruge en weekend på.

Ellevte agent er i gang. Den handler om udbudsmaterialer og er allerede halvvejs ud af kontrol.
