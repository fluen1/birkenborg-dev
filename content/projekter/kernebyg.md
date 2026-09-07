---
title: "Kernebyg"
status: alpha
pill_label: "Alpha · 2026"
summary: "AI-tilbudsplatform for danske håndværkere — udbudsradar, AI-genererede tilbud og forbrugerjura på private sager. Bygget sammen med CopenAI, kørende i produktion på Vercel, endnu ingen brugere."
featured: true
order: 15
---

# Kernebyg

Håndværkere taber udbud på tid, ikke på pris — fristen er overskredet, før tilbuddet er skrevet. Kernebyg finder relevante udbud automatisk, trækker tilbudsfrist og krav ud af udbudsmaterialet, og genererer et førsteudkast til tilbud med AI. På private sager håndterer den også forbrugerjuraen: fortrydelsesret, seks-dages-reglen, korrekt sidefod.

## Status

- Udbudsradar, AI-tilbudsgenerering og privat-sagsflow bygget og testet
- Backend- og frontendtest kører grønt i produktionsgrenen
- Databasemigrationerne er kørt mod produktion
- Ingen brugere endnu — produktet er ikke færdigbygget

## Hvad jeg lærer undervejs

- Fristhåndtering slår priskonkurrence som differentiator i udbudsværktøjer
- Forbrugerjura i genereret tekst skal valideres af et menneske, ikke antages korrekt
- At bygge sammen med en samarbejdspartner i samme repo kræver eksplicit koordinering af hvem der rører hvad
