---
title: "Hvorfor min M&A-agent fejlede på paragraf 30"
slug: "ma-agent-paragraf-30"
publish_at: 2026-05-12T09:00:00+02:00
status: published
tags: ["ai", "agenter", "jura", "m-and-a", "fejl-rapport"]
privacy_flag: false
excerpt: "Jeg fodrede den med en hel virksomhedsoverdragelsesaftale og bad den finde fejl. Den fandt 14 — og overså den ene der havde betydet noget."
marginalia:
  - ts: "8/5 14:32"
    text: "undersøgte det her i 3 dage før jeg gav op"
    source: manual
  - ts: "9/5 09:01"
    text: "rettelse: agenten ramte 11 ud af 10 paragraffer — men spillede pas"
    source: manual
---


Min M&A-agent kunne læse hele aftalen, men den kunne ikke tælle.

Det er den korte version. Her er den lange.

---

Jeg har skrevet om agenten i min Nybolig-artikel — den der lavede juridisk gennemgang af ejendomshandler. Den virkede nogenlunde. Så jeg tænkte: hvad sker der, hvis jeg smider en rigtig virksomhedsoverdragelsesaftale ind? Ikke en simpel ejendomshandel, men 68 sider med definitioner, garantier, konkurrenceklausuler og et provjusteringsbilag der alene fylder 11 sider.

Svaret: agenten fandt 14 problemer. Ingen af dem var paragraf 30.

## Hvad den fandt

Agenten var faktisk imponerende på overfladen. Den flagede en intern uoverensstemmelse i definitionen af "Virksomheden" — brugt i to forskellige betydninger i henholdsvis § 2 og § 12. Den påpegede at en garanti i § 19 om medarbejdernes ansættelsesforhold var formuleret bredere end hvad der normalt er muligt at garantere uden due diligence-forbehold. Den fandt en manglende cross-reference mellem et bilag og den paragraf der refererede til det.

Alt sammen korrekt. Alt sammen det slags fejl en erfaren juridisk øje ville nikke anerkendende til.

Men den overså paragraf 30.

## Paragraf 30 var en konkurrenceklausul

Ikke en kopi-pasta af en standardklausul, men en der var skrevet specifikt til denne transaktion — og skrevet dårligt. Det geografiske anvendelsesområde var defineret som "Danmark og nærliggende markeder." Sælger drev forretning i Sverige og Norge. "Nærliggende markeder" er ikke en juridisk definition — det er en hensigtserklæring forklædt som klausul.

I praksis betyder det at klausulen sandsynligvis ikke kan håndhæves i Sverige. Og sælger vidste det. Det er ikke en fejl, det er en feature — set fra sælgers side.

Det er den ene fejl der ville have haft kommerciel betydning. Agenten spillede pas.

## Hvorfor den missede det

Jeg brugte tre dage på at finde ud af præcis hvad der gik galt. Her er min bedste forklaring:

**Sproglig præcision er ikke det samme som juridisk præcision.**

Agenten er fantastisk til at finde uoverensstemmelser i sprog — to definitioner der ikke matcher, en reference der peger det forkerte sted hen, en sætning der grammatisk er tvetydig. Det er mønstergenkendelse, og LLM'er er gode til mønstergenkendelse.

Men paragraf 30 var ikke sprogligt forkert. "Danmark og nærliggende markeder" er grammatisk perfekt. Der er ingen intern uoverensstemmelse. Problemet er ikke i teksten — problemet er i forholdet mellem teksten og virkeligheden. Og virkeligheden kendte agenten ikke til: at sælger opererede i Sverige, at "nærliggende markeder" ikke er et juridisk begreb i dansk kontraktret, at en acquirer ville have en kommerciel interesse i at lukke det hul.

**LLM'er mangler forretningsmæssig kontekst.**

Jeg har givet agenten aftaleteksten. Jeg har ikke givet den due diligence-rapporten, sælgers regnskaber, en liste over sælgers eksisterende kunder i Norden, eller de forhandlingsnotater der forklarede at konkurrenceklausulen var et stridspunkt i tre runder.

En erfaren M&A-advokat ville have vidst alt det. Ikke fordi de er klogere end et LLM — men fordi de havde kontekst agenten ikke fik. Det er ikke agentens fejl. Det er min fejl i, hvad jeg fodrede den med.

Det er ikke en lille distinktion. Det er hele distinktionen.

**En tredje ting jeg lagde mærke til:** agenten var slet ikke dårlig til at prioritere. Den 14-punkts liste var sorteret efter, hvad den vurderede som alvorlighed. Paragraf 30 stod ikke på listen — ikke fordi den var blevet vurderet til lav prioritet, men fordi den aldrig blev genkendt som et problem overhovedet.

Det er anderledes end at prioritere forkert. Det er et blindt felt.

## Hvad der sker nu

Jeg bygger ikke en bedre prompt. Eller rettere: det er ikke det eneste jeg gør.

Det grundlæggende problem er at agenten mangler kontekst til at vurdere kommerciel relevans. Det kan man afhjælpe på to måder — og jeg er i gang med begge:

Først: struktureret kontekst-input. Ikke bare aftaleteksten, men en standardiseret template der tvinger brugeren til at specificere: hvad er sælgers kerneforretning, i hvilke geografier, hvilke paragraffer er kommercielt følsomme, hvad er parternes interessekonflikter. Det er mere arbejde for brugeren. Det er nødvendigt.

Dernæst: evals. Paragraf 30 er nu et eval-eksempel. Jeg har taget den konkrete fejl — det ukorrekte geografiske scope i en konkurrenceklausul — og lavet en syntetisk version af den der kan bruges til at teste fremtidige agentversioner. Ikke som en facitliste over rigtige svar, men som et mål: finder agenten dette, givet denne kontekst?

Hver fejl agenten laver er et nyt eval-eksempel. Det er den eneste måde at vide om næste version faktisk er bedre — eller bare bedre til at lyde overbevisende.

Jeg har foreløbig ni eksempler. Ingen af dem er fra sager agenten klarede fejlfrit.

---

Det er den lange version. Den korte er stadig den samme: agenten kunne læse hele aftalen, men den kunne ikke tælle — og det tal den missede var netop det der kostede.
