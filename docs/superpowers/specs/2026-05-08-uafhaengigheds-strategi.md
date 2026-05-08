# Uafhængigheds-strategi — birkenborg.dev som indtægtskilde

**Forfatter:** Philip Birkenborg Andersen
**Dato:** 2026-05-08
**Status:** Aktivt

## 1. Vision

Trin mod uafhængighed fra fuldtidsjobbet hos Tandlægen.dk gennem en service-virksomhed der bygger autoritets-sites og AI-værktøjer til specialister i regulerede sektorer (primært ikke-juridiske). Eksekveres som single leverandør med fast prissætning på pakker og timepris-mulighed for ad-hoc.

**Hvad det IKKE er:**
- Klassisk juridisk rådgivning som hovedforretning (kedeligt for Philip; ikke afvises som ad-hoc)
- Legal-tech-konsulent for advokatfirmaer (kulturkonflikt)
- Provokerende konsulent-positionering (LinkedIn er for at dele passion ved håndværket, ikke for debat)
- Agency med ansatte (single leverandør indtil andet besluttes)

## 2. ICP — to nicher i parallel-validering

**Primære kandidater:**

### A. Privatpraksis-klinikker (ikke-tandlæge)
Læger, fysioterapeuter, psykologer, kiropraktorer og lignende. 1-5 personer. Patient-trust = høj WTP. Ofte "skod sider" som standard.

**Konkret value-add:** AI-chatbot der svarer på *"har I tider?"*, *"tager I mit forsikringsselskab?"*, *"hvad koster en konsultation?"* uden at klinik-ejer skal være online.

### B. SMV-konsulenter
Strategi-, forretningsudviklings-, compliance-rådgivere. 1-10 personer. Site = deres credibility.

**Konkret value-add:** Autoritets-system: hub-design + AI-chat trænet på deres content + LinkedIn-content-strategi.

**Eksplicit fravalgt:**
- Tandlæger (konflikt med Tandlægen.dk)
- Advokater (kulturel aversion; ikke afvises hvis de spørger om ad-hoc)
- Finans/fintech (for tung og regulerings-kompleks)
- Offentlig administration (for langsom procurement)
- Indie hackers / DIY-segment (lavt match, prishaglning)

**Reklamebeskyttelses-disciplin:** Reklamebeskyttede CVR-numre udelukkes fra ALL outreach — automatisk via CVR-scriptet, manuelt tjekket ved direkte fundne leads.

## 3. Service-portefølje

| Pakke | Indhold | Indikativ pris (DKK) |
|--|--|--|
| **Pilot-tier** (første 2-3 case studies) | Hub eller business-site, AI-chat på deres content, basic onboarding | 15-20.000 (case-study-rabat) |
| **Standard "Authority-system"** | Hub/business-site med custom design, AI-chat trænet på deres content + produkter, 30-dages support | 25-40.000 |
| **Premium "Multi-page authority-system"** | Multi-side rollout, integration med eksisterende systemer (booking, CRM), avanceret AI-chat med rolle-baseret routing | 50-80.000 |
| **Juridisk sparring** (ad-hoc, ikke aktivt promoveret) | AI/regulering/GDPR-spørgsmål — *ikke* generel advokatpraksis | 1500-2500 DKK/t |

**Pris-argumentation baseret på dansk markedsdata 2026:**
- Markedet for "god hjemmeside" spænder 6.700-135.000 DKK
- Niche-konkurrenter findes (fx webdesigntilpsykologer.dk med 30+ psykolog-sider)
- Standard-tier ligger i markedets mellem-felt — ikke for billigt til at undergrave kvalitets-signal, ikke for dyrt til at lukke for SMV-segmentet
- Differentiering mod niche-konkurrenter: *bedre æstetik + AI-integration baked in + content-strategi inkluderet*

## 4. Faser med exit-criteria (ikke tids-bundet)

Fremgang vurderes på opnåelse af exit-criteria, ikke kalender. Næste fase påbegyndes først når exit-criteria er tjekket af.

### Fase 1 — Foundation + validation

**Eksisterer for at:** etablere infrastrukturen til outreach + landing-conversion, validere mod begge ICP'er parallelt, vælge primær niche datadrevet.

**Exit-criteria (alle skal være opfyldt):**
- [ ] Outreach-pack klar (templates + tracker + positioneringer)
- [ ] CVR-script genererer kvalificerede leads med reklamebeskyttelses-filter
- [ ] `philip@birkenborg.dev` email-alias live via Cloudflare Email Routing
- [ ] Landing pages `/klinikker` og `/konsulenter` live på birkenborg.dev med UTM-tracking
- [ ] Lead-form-endpoint i bot-worker integreret (POST → KV → Telegram-DM)
- [ ] AI-draft-helper kan generere personaliserede outreach-openers
- [ ] **20 samtaler gennemført** (10 per niche)
- [ ] **1-2 pilot-aftaler underskrevet** (selv på rabat)
- [ ] **Niche-narrowing-beslutning truffet** — primær niche valgt baseret på data, ikke gæt

### Fase 2 — First revenue + repeatability

**Eksisterer for at:** levere de første 1-2 pilot-cases ordentligt, dokumentere process til gentagelse, hæve pris efter case-studies.

**Exit-criteria:**
- [ ] 1-2 pilot-cases leveret og live
- [ ] Case-studies publiceret på `/projekter` på birkenborg.dev (med kunde-godkendelse)
- [ ] Niche-demo-site bygget (til den primære niche valgt i Fase 1) — bruges på landing-page som visuelt salgsargument
- [ ] Standardiseret leverance-process dokumenteret (intake-form, scope-template, kontrakt-template, deploy-checklist)
- [ ] Standard-tier-pris (25-40k) hævet og prøvet på 2-3 nye leads
- [ ] SEO-step tilføjet til news-pipelinen (auto-keyword-optimering)

### Fase 3 — Scale + pipeline

**Eksisterer for at:** gå fra manuel outreach + reaktiv pipeline til semi-autonom system. Konsekvent inbound + repeatable outbound.

**Exit-criteria:**
- [ ] Semi-autonom outreach-pipeline live (Claude Code + email-API som Resend/Postmark + reply-detektion)
- [ ] Pipeline genererer konsistent ≥3 kvalificerede leads/uge uden manuel input
- [ ] Reply-rate ≥8% på outreach (i tråd med Claude Code-cold-email-benchmarks)
- [ ] Site har content-cluster-strategi (5+ pillar-posts + supporting posts) der ranker organisk
- [ ] Månedligt niveau af 2+ paid kunder konsistent over flere perioder
- [ ] Beslutning truffet: stay solo (boutique premium pricing) eller skalér (hire/agency)

### Fase 4 — Independence-path

**Eksisterer for at:** afgøre om service-virksomheden kan erstatte Tandlægen.dk-løn, og udføre overgangen hvis svaret er ja.

**Exit-criteria:**
- [ ] Konsekvent månedlig revenue der matcher eller overstiger nuværende løn
- [ ] Buffer på 6-12 måneders driftsomkostninger + privat-økonomi
- [ ] Aftale med Tandlægen.dk om opsigelse / overgang aftalt
- [ ] Selvstændig CVR/IVS/ApS oprettet (afhængigt af omsætning)
- [ ] Skat/moms/forsikrings-setup på plads

## 5. Risici og mitigation

| Risiko | Sandsynlighed | Konsekvens | Mitigation |
|--|--|--|--|
| Konkurrenceklausul i Tandlægen.dk-kontrakt | Medium | Høj — kunne forhindre legal-tech-arbejde | Tjek kontrakt før første juridisk-rådgivning-kunde. Hold som ad-hoc, ikke aktivt promoveret. |
| ICP-narrowing til forkert niche | Medium | Medium — bremser Fase 2 | Gate-check efter 20 samtaler tvinger datadrevet beslutning. Den anden niche bliver "også for X"-henvisning, ikke kasseret. |
| Auto-outreach skader brand i lille marked | Lav-medium (kun hvis vi automatiserer for tidligt) | Høj — Danmark er for lille | Fase 1 manuel + AI-draft-assistance. Auto-pipeline først i Fase 3 efter validation. |
| GDPR/reklamebeskyttelse-overtrædelse | Lav (med disciplin) | Medium-høj | Hard filter i CVR-script. Manuelt tjek for direkte fundne leads. Outreach er research-pitched, ikke salg. |
| Personalisering-kvalitet falder ved auto-pipeline | Medium | Medium — sænker reply-rate | Claude Code-pipelinen baseres på rolle-specifik kontekst + firma-signaler (per Salesforge MCP-mønstret), ikke generic merge-tags. |
| Pilot-priser bliver permanent loft | Medium | Høj — låser indtjening | Pilot-aftaler indeholder eksplicit case-study-rettighed mod rabat. Standard-tier prøvet på 2-3 NYE leads inden Fase 2 lukkes. |
| Side-business-tid sluger Tandlægen.dk-job | Medium | Høj — risiko for begge spor | Sæt arbejdstid-grænser per dag/uge. Vurdér løbende om kvaliteten af Tandlægen-arbejdet falder. |

## 6. Beslutninger truffet under brainstorm 2026-05-08

- **ICP**: Privatpraksis (ikke-tandlæge) + SMV-konsulenter parallelt i Fase 1, primær niche valgt efter 20 samtaler
- **Tone**: 8-tone-essens kalibreret i tone.md (commit `03c168f`) gælder også for landing-pages og service-content
- **Provokerende ≠ spasmager**: LinkedIn-positionering forbliver "deler hvad jeg er glad for at lave", ikke "vil have læseren op af stolen"
- **Pricing-floor**: 15k for pilot, 25k for standard. Ikke under det.
- **Email-afsender**: `philip@birkenborg.dev` via Cloudflare Email Routing → Hotmail forwarding
- **Tracker**: Standalone Google Sheet i Fase 1, ingen integration med bot-worker indtil Fase 3
- **Outreach**: Manuel afsendelse + AI-draft-helper i Fase 1-2. Auto-pipeline i Fase 3.
- **Niche-demo-sites**: Først bygges efter Fase 1 (bruger feedback fra samtaler som input)
- **SEO-extension**: Tilføjes til news-pipelinen i Fase 2, ikke før (premature optimization indtil ICP er valgt)

## 7. Reference til implementation

- **Fase 1 implementation plan**: `docs/superpowers/plans/2026-05-08-uafhaengighed-fase-1.md`
- **Senere fase-plans skrives ved fase-overgang**, ikke før — undgår spildt arbejde hvis tidligere fase ændrer retning
