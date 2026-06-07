# Onboarding-runbook — synlighedsabonnement / content-motor

> Gælder både birkenborg.dev-varianten (4 art./md, 2.495 kr) og CopenAI-varianten
> (8-10 art./md, 4.495 kr). Oprettet 2026-06-07 efter content-reviewer-fund:
> **"månedlig rapport med jeres egne søgetal" er et offentligt leveranceløfte —
> GSC-opsætningen SKAL ske i uge 1, ellers kan rapporten ikke leveres måned 1.**

## Uge 1 — opstart (trigger: kunden har sagt ja)

1. **Opstartsmøde (30-45 min):** forretning, målgruppe, tone, no-go-emner,
   eksisterende indhold/bureau-aftaler (undgå overlap).
2. **Adgange indhentes:**
   - CMS-adgang (eller aftale om at vi opsætter blog)
   - Google Search Console: kundens property (helst domæne-property,
     `sc-domain:`-format — lærdom fra fabrikken!), vores service-account
     tilføjes som **Fuld bruger**
3. **Søgeordsanalyse + indholdsplan** for måned 1-3. Kunden godkender
   emneliste og tone-eksempel FØR produktion starter.
4. **⚠️ GSC-pipeline pr. kunde (rapport-løftet):**
   - Udvid GSC-config med kundens property (jf. fabrikkens worker:
     GSC_SITES + service-account-mønster fra birkenborg-sites)
   - Verificér første data-sync INDEN måned 1 udløber
   - Rapportformat: genbrug det rige Telegram/HTML-rapportmønster fra
     affiliate-worker (visninger, kliks, placeringer, næste måneds plan)
5. **Kvalitetsgate kalibreres pr. kunde:**
   - Branchespecifikke regler (fx INGEN sundhedspåstande for klinikker —
     samme regel som kæledyrssitet håndhæver)
   - Kundens tone + forbudte claims/konkurrentomtale
   - Gate-kriterierne dokumenteres så de kan genbruges
6. **Det formelle:** kontrakt m. 1 måneds opsigelse + "indhold tilhører
   kunden", faktureringsflow. Databehandleraftale er IKKE nødvendig for
   rent content-flow (ingen persondata) — genbesøg hvis leadforms/analytics
   indgår.

## Løbende drift

7. Artikler produceres → gennem gate → publiceres (kadence efter pakke).
8. **Månedlig rapport** (løftet!): GSC-tal + hvad der justeres næste måned.
9. Løbende optimering: artikler på position 8-20 opdateres målrettet
   (content-gap-mønstret fra fabrikkens optimizer).

## Ved opsigelse

10. Alt publiceret indhold bliver hos kunden (lovet på salgssiderne).
    Eksportér evt. kilde-markdown. GSC-adgang fjernes, config ryddes op.

## Kendte tekniske gaps (før første kunde)

- **CMS-adapter:** Fabrikken publicerer til egne Astro-repos. Kundeleverance
  kræver adapter pr. CMS (WordPress REST API er den sandsynlige første;
  alternativt opsætter vi selv en blog på vores stack = nul adapter-arbejde
  → foretræk DET som default i salgsdialogen).
- **Prompt-/gate-profil pr. kunde:** fabrikkens content-agent og gate er
  single-tenant; der skal en kunde-profil-struktur til (kopiér
  birkenborg-sites' mønster: én config-fil pr. site).
