# Uafhængighed — Fase 1 Foundation + Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Etabler infrastrukturen til outreach + lead-conversion så Philip kan validere mod begge ICP'er (privatpraksis-klinikker + SMV-konsulenter) parallelt og narrowe niche datadrevet efter 20 samtaler.

**Architecture:** To repos samarbejder. `birkenborg-agents` får outreach-værktøjer (templates, CVR-script, AI-draft-helper) + lead-form-endpoint på eksisterende bot-worker. `birkenborg-dev` får to landing-pages (`/klinikker`, `/konsulenter`) på det eksisterende Astro-site med UTM-tracking og lead-form der POSTer til bot-worker. Email-alias `philip@birkenborg.dev` opsættes via Cloudflare Email Routing (forwarder til Hotmail).

**Tech Stack:** Python 3.13 (CVR-script, AI-draft-helper), Astro v6 (landing-pages), TypeScript + Vitest (bot-worker endpoint), Cloudflare Workers + KV + Email Routing, Telegram Bot API.

**Spec:** `docs/superpowers/specs/2026-05-08-uafhaengigheds-strategi.md`

---

## Repository Setup

Plan'en involverer to repos:

```
C:\Users\birke\Projects\
├── birkenborg-dev\          (offentlig — site)
│   ├── site/                (Astro, hvor landing-pages bygges)
│   ├── worker/              (site-worker, ikke berørt i Fase 1)
│   └── docs/superpowers/specs/, plans/
└── birkenborg-agents\       (privat — bot + scripts)
    ├── outreach/            (NY mappe — templates + tracker)
    ├── scripts/             (CVR-script + AI-draft-helper)
    └── worker/src/internal.ts  (lead-endpoint tilføjes)
```

**Hver task angiver `Repo:` så det er klart hvor du arbejder.**

---

## File Structure

### birkenborg-agents

**Skabes:**
- `outreach/README.md` — workflow-beskrivelse
- `outreach/tracker.csv` — tom skabelon til Google Sheet
- `outreach/klinik-template.md` — outreach-besked til klinikker
- `outreach/konsulent-template.md` — outreach-besked til konsulenter
- `outreach/positionering.md` — to positionerings-statements
- `scripts/cvr_leads.py` — CVR-API CLI med reklamebeskyttelses-filter
- `tests/test_cvr_leads.py` — pytest tests for cvr_leads.py
- `scripts/draft_outreach.py` — AI-draft-helper (Claude API)
- `tests/test_draft_outreach.py` — pytest tests
- `docs/email-alias-setup.md` — DNS-guide til Cloudflare Email Routing

**Modificeres:**
- `worker/src/index.ts` — tilføj `Env`-felt for `LEAD_NOTIFY_CHAT_ID`
- `worker/src/internal.ts` — ny `POST /internal/lead`-endpoint
- `worker/tests/internal.test.ts` — tests for nyt endpoint
- `requirements.txt` — pytest hvis ikke allerede der; requests for cvr_leads.py

### birkenborg-dev

**Skabes:**
- `site/src/pages/klinikker.astro` — landing-page for klinik-niche
- `site/src/pages/konsulenter.astro` — landing-page for konsulent-niche
- `site/src/components/LeadForm.astro` — genbrugelig lead-form-komponent

**Modificeres:**
- `site/src/pages/index.astro` — tilføj diskret henvisning til `/tjenester` eller direkte til `/klinikker`/`/konsulenter`
- `site/src/components/Footer.astro` — tilføj links til de to landing-pages

---

## Design-beslutninger

**Lead-form payload struktur:**

```json
{
  "niche": "klinik" | "konsulent",
  "name": "string",
  "company": "string (valgfri)",
  "email": "string",
  "phone": "string (valgfri)",
  "message": "string",
  "utm_source": "string (valgfri)",
  "utm_campaign": "string (valgfri)",
  "submitted_at": 1747693200
}
```

**Telegram-DM format ved nyt lead:**
```
🆕 Nyt lead — [niche]
Navn: [name]
Firma: [company eller "—"]
Email: [email]
Telefon: [phone eller "—"]

Besked:
[message]

UTM: [utm_source/utm_campaign eller "direct"]
```

**Lead-storage:** KV-key `lead:<timestamp>:<random>` → JSON. TTL 90 dage (uger nok til opfølgning, undgår uendelig opbygning).

**CVR-API:** `cvrapi.dk` (gratis, ingen registrering). Felt `protected: bool` er reklamebeskyttelses-flaget — filter `protected == false`. Endpoint: `https://cvrapi.dk/api?country=dk&search=<branchekode>&format=json`. NB: pagination kan kræve flere kald.

**Branche-koder for ICP:**
- Privatpraksis: 86.21, 86.22, 86.23 (læge), 86.90.1 (psykolog), 86.90.2 (kiropraktor), 86.90.5 (fysioterapi)
- Konsulenter: 70.21, 70.22 (rådgivning), 74.90.9 (anden faglig service)

---

## Task 1: Outreach-pack (filer, ingen kode)

**Repo:** `birkenborg-agents`

**Files:**
- Create: `outreach/README.md`
- Create: `outreach/tracker.csv`
- Create: `outreach/klinik-template.md`
- Create: `outreach/konsulent-template.md`
- Create: `outreach/positionering.md`

**Goal:** Filer du copy-paster fra. Ingen logik, ingen integration. Klar til Google Sheet import + email-templates klar til brug.

- [ ] **Step 1: Lav outreach-mappen**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
mkdir -p outreach
```

- [ ] **Step 2: Skriv `outreach/README.md`**

```markdown
# Outreach — pilot-validering for selvstændighed

Workflow til at finde og kontakte de første 40 pilot-leads (20 privatpraksis-klinikker + 20 SMV-konsulenter), holde styr på samtaler, og narrowe niche efter første 20 calls.

## Filer

- `tracker.csv` — tom skabelon. Importer som Google Sheet eller Excel.
- `klinik-template.md` — outreach-skabelon for privatpraksis (læge, fysio, psykolog — ikke tandklinik pga konflikt med Tandlægen.dk)
- `konsulent-template.md` — outreach-skabelon for SMV-konsulenter
- `positionering.md` — begge positionerings-statements

## Workflow

1. **Find leads:** kør `scripts/cvr_leads.py --branche <kode> --region 1500-2999 > leads.csv` (CVR-baseret) eller manuel research via sundhed.dk, LinkedIn, Krak. **Reklamebeskyttede CVR-numre udelukkes automatisk af scriptet.**
2. **Tilføj til tracker:** importer `leads.csv` til Google Sheet, sæt status = `ny`.
3. **Kvalificér manuelt:** kig på deres nuværende site. Hvis allerede pænt → status = `forkastet (god side)`.
4. **Draft personaliseret opener:** `scripts/draft_outreach.py --lead-name "X" --lead-firm "Y" --lead-site "Z"` → Claude foreslår personaliseret første-linje.
5. **Send manuelt** fra `philip@birkenborg.dev` (email) eller LinkedIn DM. Sæt status = `kontaktet`, dato.
6. **Opfølgning:** ingen svar efter 7 dage → én reminder. Fortsat intet → status = `cold`.
7. **Samtale booket:** status = `samtale_booket`. Efter samtale, opdater `samtale_resultat`.

## Hard kvota — niche-narrowing

Efter 20 samtaler (10 i hver niche) — vælg ÉN niche som primær. Den anden bliver "også for X"-henvisning, ikke et primært spor.

## Reklamebeskyttelses-disciplin

Selv om scriptet filtrerer reklamebeskyttede CVR-numre fra, **dobbelt-tjek manuelt** ved leads fra ikke-CVR-kilder (LinkedIn, Krak, sundhed.dk):
- CVR-opslag på cvrapi.dk for hver lead du tilføjer manuelt
- Hvis `protected: true` → udelad
- Dokumentér i tracker (kilde + dato for tjek)
```

- [ ] **Step 3: Skriv `outreach/tracker.csv` (header-only)**

```csv
navn,niche,firma,kontakt_info,kilde,nuvarende_site,reklamebeskyttet_tjekket,status,kontaktet_dato,follow_up_dato,samtale_resultat,noter
```

- [ ] **Step 4: Skriv `outreach/klinik-template.md`**

```markdown
# Klinik-outreach — research-pitch (ikke salg)

Til: privatpraksis-klinikker (læge, fysioterapeut, psykolog, kiropraktor — IKKE tandlæge)

## Email-version

**Emne:** Forskning om hvad der virker på klinik-hjemmesider

Hej [navn],

Jeg bygger AI-baserede hjemmeside-systemer til private klinikker og prøver at forstå hvad der faktisk virker for jer. Inden jeg kontakter folk med tilbud, vil jeg gerne lære.

Har du 20 minutter på telefon eller video i den næste uge? Jeg sælger ikke noget i denne samtale — jeg lærer.

Min egen side, hvis du vil se hvad jeg laver: [birkenborg.dev](https://birkenborg.dev)

Mvh,
Philip Birkenborg

## LinkedIn DM-version (kortere)

Hej [navn], jeg bygger AI-baserede hjemmesider til private klinikker. Jeg samler viden om hvad der irriterer klinik-ejere ved deres nuværende site før jeg kontakter med tilbud. Har du 20 min på en samtale? Jeg sælger ikke noget — jeg lærer. Min egen side: birkenborg.dev

## Personalisering — det første-linje du SKAL tilpasse

Erstat åbnings-sætningen med ÉN konkret detalje fra deres site eller LinkedIn-bio. Eksempel:
- "Jeg så I har specialiseret jer i [behandling] — det er præcis den slags klinikker jeg gerne vil snakke med."
- "Jeg lagde mærke til at jeres bookingflow stadig er telefon-only — det er den slags pain jeg prøver at forstå."

`scripts/draft_outreach.py` kan generere forslag til denne første-linje givet en URL.
```

- [ ] **Step 5: Skriv `outreach/konsulent-template.md`**

```markdown
# Konsulent-outreach — research-pitch (ikke salg)

Til: SMV-konsulenter (strategi, forretningsudvikling, compliance — IKKE advokater eller agency-folk)

## Email-version

**Emne:** Forskning om hvad konsulenter frustreres over ved deres digital tilstedeværelse

Hej [navn],

Jeg bygger autoritets-sites til konsulenter — den slags der ikke ligner alle de andre. Inden jeg går aktivt ud med tilbud, vil jeg gerne forstå hvad konsulenter som dig faktisk frustreres over ved jeres nuværende digital tilstedeværelse.

Har du 20 min på telefon eller video i den næste uge? Jeg sælger ikke noget i denne samtale — jeg lærer.

Min egen side: [birkenborg.dev](https://birkenborg.dev)

Mvh,
Philip Birkenborg

## LinkedIn DM-version

Hej [navn], jeg bygger autoritets-sites til konsulenter — distinkte, ikke template-agtige. Inden jeg lancerer aktivt vil jeg forstå hvad jer der bruger sites som credibility-værktøj rent faktisk frustreres over. 20 min samtale? Jeg sælger ikke noget. Min egen side: birkenborg.dev

## Personalisering

Som ovenfor: erstat åbnings-sætningen med en konkret detalje fra deres site/LinkedIn. Konsulent-specifikke vinkler:
- "Jeg så du har skrevet om [emne] — det er den slags substans-tæt content jeg prøver at hjælpe folk præsentere bedre."
- "Jeg lagde mærke til at dit site mangler [konkret element] — det er præcis den pain jeg prøver at forstå."
```

- [ ] **Step 6: Skriv `outreach/positionering.md`**

```markdown
# Positionerings-statements

## Klinikker
> Jeg bygger hjemmesider og AI-chat til private klinikker. Patienter får svar på det de plejer at ringe om — du får et site der ser professionelt ud uden at du skal tage tekniske beslutninger.

## Konsulenter
> Jeg bygger autoritets-sites til konsulenter der vil have et personligt brand der ikke ligner alle andre. Tilpasset æstetik, AI-chat der kender dit arbejde, og content-system der gør det nemt at holde det levende.

## Brug

- Pitch-åbning på telefonsamtaler
- Header-tekst på `/klinikker` og `/konsulenter` landing-pages
- Bio på LinkedIn-posts der refererer til services
- Tilpasses gerne i ordlyd til kontekst — kernemeddelelsen forbliver

## Hvad de IKKE er

- Salgs-claims ("jeg er den bedste...")
- Konsulent-LinkedIn-fraser ("I help X achieve Y")
- Bio-frame om Philip ("med min juridiske baggrund...")
- Provokerende ("de fleste klinikker fatter ikke...")
```

- [ ] **Step 7: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add outreach/
git commit -m "feat(outreach): pack med templates + tracker.csv + positioneringer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: CVR-script med reklamebeskyttelses-filter

**Repo:** `birkenborg-agents`

**Files:**
- Create: `scripts/cvr_leads.py`
- Create: `tests/test_cvr_leads.py`
- Modify: `requirements.txt` (tilføj `requests` og `pytest` hvis ikke der)

**Goal:** Python CLI der fetcher fra cvrapi.dk, filtrerer reklamebeskyttede, output CSV. Testbart end-to-end med mocked HTTP.

- [ ] **Step 1: Tjek om requests + pytest er i requirements.txt**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
cat requirements.txt
```

Hvis `requests` mangler, tilføj `requests>=2.31.0`. Hvis `pytest` mangler, tilføj `pytest>=8.0.0` og `pytest-mock>=3.12.0`.

```bash
pip install -r requirements.txt
```

- [ ] **Step 2: Skriv failing test**

Opret `tests/test_cvr_leads.py`:

```python
"""Tests for cvr_leads.py."""
from __future__ import annotations

import csv
import io
import json
from unittest.mock import Mock, patch

import pytest

from scripts.cvr_leads import (
    fetch_companies,
    filter_reklamebeskyttede,
    to_csv_row,
    Company,
)


SAMPLE_API_RESPONSE = {
    "vat": 12345678,
    "name": "Klinik for Fysioterapi ApS",
    "address": "Hovedgaden 1",
    "zipcode": "2100",
    "city": "København Ø",
    "industrycode": 869050,
    "industrydesc": "Fysioterapi",
    "protected": False,
    "phone": "12345678",
    "email": "info@klinikfysioterapi.dk",
    "employees": "5",
}


def test_fetch_companies_returns_list_from_api():
    with patch("scripts.cvr_leads.requests.get") as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = SAMPLE_API_RESPONSE
        mock_get.return_value = mock_response

        companies = fetch_companies(branche="869050", search_term="fysio")
        assert len(companies) == 1
        assert companies[0].name == "Klinik for Fysioterapi ApS"
        assert companies[0].vat == 12345678
        assert companies[0].protected is False


def test_filter_reklamebeskyttede_removes_protected_true():
    companies = [
        Company(vat=1, name="A", protected=False, address="", zipcode="", city="", industrycode=0, industrydesc="", phone=None, email=None, employees=None),
        Company(vat=2, name="B", protected=True, address="", zipcode="", city="", industrycode=0, industrydesc="", phone=None, email=None, employees=None),
        Company(vat=3, name="C", protected=False, address="", zipcode="", city="", industrycode=0, industrydesc="", phone=None, email=None, employees=None),
    ]
    filtered = filter_reklamebeskyttede(companies)
    assert len(filtered) == 2
    assert all(not c.protected for c in filtered)
    assert {c.vat for c in filtered} == {1, 3}


def test_to_csv_row_produces_outreach_tracker_format():
    company = Company(
        vat=12345678,
        name="Klinik X",
        protected=False,
        address="Hovedgaden 1",
        zipcode="2100",
        city="København Ø",
        industrycode=869050,
        industrydesc="Fysioterapi",
        phone="12345678",
        email="info@x.dk",
        employees="5",
    )
    row = to_csv_row(company, niche="klinik")
    assert row["navn"] == "Klinik X"
    assert row["niche"] == "klinik"
    assert row["firma"] == "Klinik X"
    assert "info@x.dk" in row["kontakt_info"]
    assert "12345678" in row["kontakt_info"]
    assert row["kilde"] == "cvrapi.dk"
    assert row["reklamebeskyttet_tjekket"] == "true"
    assert row["status"] == "ny"


def test_to_csv_row_handles_missing_email_phone():
    company = Company(
        vat=12345678,
        name="Klinik Y",
        protected=False,
        address="",
        zipcode="",
        city="",
        industrycode=0,
        industrydesc="",
        phone=None,
        email=None,
        employees=None,
    )
    row = to_csv_row(company, niche="klinik")
    assert row["kontakt_info"] == "—"
```

- [ ] **Step 3: Verify RED**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
python -m pytest tests/test_cvr_leads.py -v
```

Forventet: 4 tests FAIL — `ModuleNotFoundError: No module named 'scripts.cvr_leads'` eller import-fejl.

- [ ] **Step 4: Skriv minimal implementation**

Opret `scripts/cvr_leads.py`:

```python
"""CVR-API lead-fetcher med reklamebeskyttelses-filter.

Brug:
    python scripts/cvr_leads.py --branche 869050 --niche klinik --search fysio > klinik_leads.csv
    python scripts/cvr_leads.py --branche 702200 --niche konsulent --search "rådgivning" > konsulent_leads.csv
"""
from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from typing import Optional

import requests


CVR_API_URL = "https://cvrapi.dk/api"


@dataclass
class Company:
    vat: int
    name: str
    protected: bool
    address: str
    zipcode: str
    city: str
    industrycode: int
    industrydesc: str
    phone: Optional[str]
    email: Optional[str]
    employees: Optional[str]


def fetch_companies(branche: str, search_term: str) -> list[Company]:
    """Fetch companies fra cvrapi.dk. cvrapi returnerer ét resultat ad gangen for /api,
    men /api?branchekode=X&format=json kan returnere flere. Vi normaliserer respons til list."""
    params = {
        "country": "dk",
        "search": search_term,
        "branchekode": branche,
        "format": "json",
    }
    response = requests.get(CVR_API_URL, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    raw_list = data if isinstance(data, list) else [data]
    return [_to_company(item) for item in raw_list if item]


def _to_company(item: dict) -> Company:
    return Company(
        vat=item.get("vat", 0),
        name=item.get("name", ""),
        protected=item.get("protected", False),
        address=item.get("address", ""),
        zipcode=str(item.get("zipcode", "")),
        city=item.get("city", ""),
        industrycode=item.get("industrycode", 0),
        industrydesc=item.get("industrydesc", ""),
        phone=item.get("phone"),
        email=item.get("email"),
        employees=item.get("employees"),
    )


def filter_reklamebeskyttede(companies: list[Company]) -> list[Company]:
    """Returnér kun companies der IKKE er reklamebeskyttede."""
    return [c for c in companies if not c.protected]


def to_csv_row(company: Company, niche: str) -> dict:
    """Konvertér company til outreach/tracker.csv-format."""
    contact_parts = []
    if company.email:
        contact_parts.append(company.email)
    if company.phone:
        contact_parts.append(company.phone)
    contact_info = " | ".join(contact_parts) if contact_parts else "—"

    return {
        "navn": company.name,
        "niche": niche,
        "firma": company.name,
        "kontakt_info": contact_info,
        "kilde": "cvrapi.dk",
        "nuvarende_site": "",
        "reklamebeskyttet_tjekket": "true",
        "status": "ny",
        "kontaktet_dato": "",
        "follow_up_dato": "",
        "samtale_resultat": "",
        "noter": f"CVR: {company.vat} | Branche: {company.industrydesc} | Ansatte: {company.employees or '—'}",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branche", required=True, help="CVR branchekode")
    parser.add_argument("--search", default="", help="Søgeterm (firma-navn-fragment)")
    parser.add_argument("--niche", choices=["klinik", "konsulent"], required=True)
    args = parser.parse_args()

    print(f"Fetcher fra cvrapi.dk: branche={args.branche} search='{args.search}'", file=sys.stderr)
    companies = fetch_companies(args.branche, args.search)
    print(f"Fundet {len(companies)} firmaer total", file=sys.stderr)

    filtered = filter_reklamebeskyttede(companies)
    excluded = len(companies) - len(filtered)
    print(f"Ekskluderet {excluded} reklamebeskyttede. {len(filtered)} tilbage.", file=sys.stderr)

    fieldnames = [
        "navn", "niche", "firma", "kontakt_info", "kilde", "nuvarende_site",
        "reklamebeskyttet_tjekket", "status", "kontaktet_dato", "follow_up_dato",
        "samtale_resultat", "noter",
    ]
    writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
    writer.writeheader()
    for company in filtered:
        writer.writerow(to_csv_row(company, args.niche))


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Verify GREEN**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
python -m pytest tests/test_cvr_leads.py -v
```

Forventet: 4 tests PASS.

- [ ] **Step 6: Manuel smoke-test (kun læse-call, ingen kunde-data forstyrres)**

```bash
python scripts/cvr_leads.py --branche 869050 --search "fysio" --niche klinik | head -20
```

Forventet: CSV-output starter med header, derefter 1+ rækker. Stderr siger fundet/ekskluderet.

Hvis cvrapi.dk er down eller rate-limiter: scriptet kaster en HTTPError. Det er OK — manuelt retry senere.

- [ ] **Step 7: Commit**

```bash
git add scripts/cvr_leads.py tests/test_cvr_leads.py requirements.txt
git commit -m "feat(outreach): CVR-script med reklamebeskyttelses-filter

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Email-alias setup (DNS-guide, ingen kode)

**Repo:** `birkenborg-agents`

**Files:**
- Create: `docs/email-alias-setup.md`

**Goal:** Skriftlig guide til at sætte `philip@birkenborg.dev` op via Cloudflare Email Routing → forwarding til Hotmail. Du udfører selv setup'et i Cloudflare-dashboardet (ikke automatisable via wrangler/API i denne sammenhæng).

- [ ] **Step 1: Skriv guide**

Opret `docs/email-alias-setup.md`:

```markdown
# Email-alias setup — philip@birkenborg.dev

Mål: receive på `philip@birkenborg.dev`, forwarder til personal Hotmail. Send fra Hotmail med "Send som"-alias.

## Cloudflare Email Routing setup (modtager-side)

1. Log ind på Cloudflare-dashboardet
2. Vælg `birkenborg.dev`-zonen
3. Gå til **Email** → **Email Routing**
4. Klik **Get started** hvis ikke allerede aktiveret
5. Cloudflare guider dig til at tilføje 3 DNS-records (MX + TXT). Bekræft.
6. Vent 5-10 min på DNS-propagering. Cloudflare verificerer.
7. Gå til **Routing rules**:
   - **Custom address:** `philip@birkenborg.dev`
   - **Action:** Send to email address
   - **Destination:** `birkenborg.p@hotmail.com` (din Hotmail)
   - Save
8. Cloudflare sender en bekræftelses-email til Hotmail. Klik link i den email.
9. Status er nu "Active". Test: send mail fra ekstern adresse til `philip@birkenborg.dev` — den skal lande i Hotmail-indbakken.

## "Send som"-alias i Outlook/Hotmail (afsender-side)

Cloudflare Email Routing supporterer KUN modtagelse, ikke afsendelse. For at SENDE fra `philip@birkenborg.dev` bruges Hotmail's "Send mail as":

**Option A: Send via Hotmail med custom From-header**
- Hotmail/Outlook supporterer "Send som" hvis du verificerer aliaset via SPF/DKIM. Det kræver ekstra DNS-konfig der overlapper med Cloudflare Email Routing's MX-records.
- Risiko: Hotmail's SPF + Cloudflare's MX kan stride mod hinanden. Test grundigt.

**Option B (anbefalet): Send via SMTP fra dedikeret SMTP-tjeneste som ProtonMail Bridge eller Resend**
- Resend tilbyder gratis 100 mails/dag, supporterer custom domain
- Tilføj DNS-records for SPF + DKIM som Resend instruerer
- Brug Resend's web UI eller SMTP til at sende fra `philip@birkenborg.dev`
- Modtager-side forbliver Cloudflare → Hotmail (uændret)

**Option C (simpleste, lavt volume): Brug Cloudflare's "Send via Email Routing API"**
- Beta-feature på Cloudflare. Tjek om aktiveret for din konto.
- Opret API-token, send via Cloudflare API. Kvota: ~100 mails/dag.

## Anbefaling for Fase 1

Brug **Option C** (Cloudflare API) hvis aktiveret, ellers **Option B** (Resend). Begge giver dig professionel afsender uden ekstra månedlig omkostning. Volume i Fase 1 er <50 mails total — alle tre options dækker nemt.

## Verifikation efter setup

- [ ] Send testmail fra Gmail til `philip@birkenborg.dev` → lander i Hotmail
- [ ] Send testmail FRA `philip@birkenborg.dev` til Gmail → kommer korrekt frem (ikke i spam)
- [ ] Tjek SPF/DKIM ved at sende til mail-tester.com og se score (skal være ≥9/10)

## Tid forbrugt
DNS-arbejde: 10-20 min. SMTP-side (Option B/C): 15-30 min.
```

- [ ] **Step 2: Commit**

```bash
git add docs/email-alias-setup.md
git commit -m "docs: email-alias setup-guide for philip@birkenborg.dev

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3 (manuel ops-task): Følg guiden og verificér**

Du udfører dette i Cloudflare-dashboardet selv. Verificér at testmail både modtages og kan sendes. Det er en blokker for at sende første outreach. Markér tasken færdig først når begge testmails er bekræftet.

---

## Task 4: Landing pages /klinikker + /konsulenter (Astro)

**Repo:** `birkenborg-dev`

**Files:**
- Create: `site/src/components/LeadForm.astro`
- Create: `site/src/pages/klinikker.astro`
- Create: `site/src/pages/konsulenter.astro`
- Modify: `site/src/components/Footer.astro` (tilføj links)

**Goal:** To landing-pages targeted per niche. Hver med headline, value-props, mini-pris-info ("fra X kr"), og lead-form. UTM-tracking via query-params der inkluderes i lead-form-submit.

- [ ] **Step 1: Skriv `LeadForm.astro` (genbrugelig komponent)**

Opret `site/src/components/LeadForm.astro`:

```astro
---
interface Props {
  niche: 'klinik' | 'konsulent';
  ctaLabel?: string;
}
const { niche, ctaLabel = 'Send' } = Astro.props;
---

<form class="lead-form" data-niche={niche}>
  <input type="hidden" name="niche" value={niche} />
  <input type="hidden" name="utm_source" id="utm_source" />
  <input type="hidden" name="utm_campaign" id="utm_campaign" />

  <label>
    Navn
    <input type="text" name="name" required autocomplete="name" />
  </label>

  <label>
    Firma / klinik (valgfri)
    <input type="text" name="company" autocomplete="organization" />
  </label>

  <label>
    Email
    <input type="email" name="email" required autocomplete="email" />
  </label>

  <label>
    Telefon (valgfri)
    <input type="tel" name="phone" autocomplete="tel" />
  </label>

  <label>
    Hvad har du på hjerte?
    <textarea name="message" rows="4" required></textarea>
  </label>

  <button type="submit">{ctaLabel}</button>
  <p class="status" aria-live="polite"></p>
</form>

<script>
  // UTM-tracking: kopier URL-params til hidden form fields
  const params = new URLSearchParams(window.location.search);
  const utmSource = document.getElementById('utm_source') as HTMLInputElement;
  const utmCampaign = document.getElementById('utm_campaign') as HTMLInputElement;
  if (utmSource) utmSource.value = params.get('utm_source') ?? '';
  if (utmCampaign) utmCampaign.value = params.get('utm_campaign') ?? '';

  // Submit-handler: POST til bot-worker
  const form = document.querySelector('.lead-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = form.querySelector('.status') as HTMLElement;
    const button = form.querySelector('button') as HTMLButtonElement;
    button.disabled = true;
    status.textContent = 'Sender…';

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('https://bot.birkenborg.dev/internal/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      status.textContent = 'Tak — jeg vender tilbage hurtigst muligt.';
      form.reset();
    } catch (err) {
      status.textContent = 'Noget gik galt. Skriv direkte til philip@birkenborg.dev.';
      button.disabled = false;
    }
  });
</script>

<style>
  .lead-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 540px;
    margin: 32px 0;
  }
  .lead-form label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: var(--gray-700);
  }
  .lead-form input,
  .lead-form textarea {
    padding: 10px 12px;
    border: 1px solid var(--gray-300);
    border-radius: 6px;
    background: var(--bg);
    font-family: inherit;
    font-size: 16px;
    color: var(--text);
  }
  .lead-form input:focus,
  .lead-form textarea:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .lead-form button {
    align-self: flex-start;
    padding: 12px 24px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    font-family: inherit;
  }
  .lead-form button:hover { opacity: 0.9; }
  .lead-form button:disabled { opacity: 0.5; cursor: not-allowed; }
  .lead-form .status {
    margin: 0;
    font-size: 14px;
    color: var(--gray-700);
  }
</style>
```

NOTE: dette antager at `--accent`, `--bg`, `--text`, `--gray-300`, `--gray-700` er defineret i `site/src/styles/tokens.css`. Tjek at de er der; hvis ikke, brug eksisterende variabel-navne fra projektet.

- [ ] **Step 2: Skriv `klinikker.astro`**

Opret `site/src/pages/klinikker.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import LeadForm from '../components/LeadForm.astro';
---
<Base
  title="Hjemmesider og AI-chat til private klinikker · birkenborg.dev"
  description="Patienter får svar på det de plejer at ringe om. Du får et site der ser professionelt ud uden at du skal tage tekniske beslutninger."
>
  <Header />
  <main class="page">
    <div class="container">
      <header class="page-head">
        <p class="meta">For klinikker</p>
        <h1>Hjemmesider og AI-chat til private klinikker</h1>
        <p class="lead">
          Patienter får svar på det de plejer at ringe om — har I tider, tager I mit forsikringsselskab,
          hvad koster en konsultation. Du får et site der ser professionelt ud uden at du skal tage tekniske beslutninger.
        </p>
      </header>

      <section class="value-props">
        <article>
          <h2>AI-chat trænet på jeres egne svar</h2>
          <p>Patienter får svar døgnet rundt. Du opdaterer et dokument, chatten lærer det.</p>
        </article>
        <article>
          <h2>Site der virker på telefon først</h2>
          <p>De fleste patienter åbner jeres side på en mobil mens de venter i bil eller bus. Det skal virke der.</p>
        </article>
        <article>
          <h2>Ingen tekniske beslutninger fra dig</h2>
          <p>Jeg vælger stack, deploy, hosting. Du leverer indhold og feedback.</p>
        </article>
      </section>

      <section class="pricing">
        <h2>Pris</h2>
        <p>
          Standard authority-pakke: <strong>fra 25.000 kr</strong> (hjemmeside, AI-chat, 30 dages support).
          Pilot-pakke for første 2 case studies: <strong>15.000 kr</strong> mod case-study-rettigheder.
        </p>
      </section>

      <section class="contact">
        <h2>Få et tilbud eller stil et spørgsmål</h2>
        <p>Jeg vender tilbage inden for 24 timer på hverdage. Ingen sælger-flow.</p>
        <LeadForm niche="klinik" />
      </section>
    </div>
  </main>
  <Footer />
</Base>

<style>
  .page { padding: 64px 0 96px; }
  .page-head { max-width: 720px; margin: 0 auto 48px; }
  .meta {
    font-size: 12px; letter-spacing: .15em; text-transform: uppercase;
    color: var(--gray-700); margin: 0 0 16px;
  }
  .page-head h1 {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 350; letter-spacing: -.02em; margin: 0 0 16px;
  }
  .lead { font-size: 18px; line-height: 1.5; color: var(--gray-700); }
  .value-props {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin: 48px 0;
  }
  .value-props article { padding: 24px; border: 1px solid var(--gray-300); border-radius: 8px; }
  .value-props h2 { font-size: 18px; margin: 0 0 8px; }
  .value-props p { margin: 0; color: var(--gray-700); }
  .pricing, .contact { margin-top: 48px; max-width: 720px; }
  .pricing h2, .contact h2 { font-size: 24px; margin: 0 0 16px; }
</style>
```

- [ ] **Step 3: Skriv `konsulenter.astro`**

Opret `site/src/pages/konsulenter.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import LeadForm from '../components/LeadForm.astro';
---
<Base
  title="Autoritets-sites til konsulenter · birkenborg.dev"
  description="Et site der ikke ligner alle andre konsulent-sites. Tilpasset æstetik, AI-chat der kender dit arbejde, og content-system der gør det nemt at holde det levende."
>
  <Header />
  <main class="page">
    <div class="container">
      <header class="page-head">
        <p class="meta">For konsulenter</p>
        <h1>Autoritets-sites til konsulenter der vil have et personligt brand</h1>
        <p class="lead">
          De fleste konsulent-sites ligner hinanden. Det her er ikke en. Tilpasset æstetik, AI-chat
          der kender dit arbejde, og content-system der gør det nemt at holde det levende.
        </p>
      </header>

      <section class="value-props">
        <article>
          <h2>Site der ikke ligner alle andre</h2>
          <p>Custom design baseret på dit faktiske arbejde, ikke et template-galleri.</p>
        </article>
        <article>
          <h2>AI-chat der kender dine skrifter og cases</h2>
          <p>Læsere kan stille spørgsmål til dit arbejde og få svar med citationer tilbage til kilden.</p>
        </article>
        <article>
          <h2>Content-system der vedligeholdes</h2>
          <p>Telegram-baseret pipeline der gør det nemt at producere LinkedIn-posts og blog-indhold uden friktion.</p>
        </article>
      </section>

      <section class="pricing">
        <h2>Pris</h2>
        <p>
          Standard authority-system: <strong>fra 30.000 kr</strong> (custom site, AI-chat,
          content-pipeline, 30 dages support). Pilot-pris for første 2 case studies: <strong>20.000 kr</strong>
          mod case-study-rettigheder.
        </p>
      </section>

      <section class="contact">
        <h2>Få et tilbud eller stil et spørgsmål</h2>
        <p>Jeg vender tilbage inden for 24 timer på hverdage. Ingen sælger-flow.</p>
        <LeadForm niche="konsulent" />
      </section>
    </div>
  </main>
  <Footer />
</Base>

<style>
  /* Identisk styling som klinikker.astro */
  .page { padding: 64px 0 96px; }
  .page-head { max-width: 720px; margin: 0 auto 48px; }
  .meta {
    font-size: 12px; letter-spacing: .15em; text-transform: uppercase;
    color: var(--gray-700); margin: 0 0 16px;
  }
  .page-head h1 {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 350; letter-spacing: -.02em; margin: 0 0 16px;
  }
  .lead { font-size: 18px; line-height: 1.5; color: var(--gray-700); }
  .value-props {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin: 48px 0;
  }
  .value-props article { padding: 24px; border: 1px solid var(--gray-300); border-radius: 8px; }
  .value-props h2 { font-size: 18px; margin: 0 0 8px; }
  .value-props p { margin: 0; color: var(--gray-700); }
  .pricing, .contact { margin-top: 48px; max-width: 720px; }
  .pricing h2, .contact h2 { font-size: 24px; margin: 0 0 16px; }
</style>
```

- [ ] **Step 4: Tilføj Footer-links til de to nye sider**

Find `site/src/components/Footer.astro`. Tilføj to nye links til navigation. Eksempel-tilføjelse (tilpas så det matcher eksisterende footer-struktur):

```astro
<a href="/klinikker">For klinikker</a>
<a href="/konsulenter">For konsulenter</a>
```

- [ ] **Step 5: Test lokalt**

```bash
cd /c/Users/birke/Projects/birkenborg-dev/site
npm run dev
```

Åbn `http://localhost:4321/klinikker` og `http://localhost:4321/konsulenter`. Verificér:
- Begge sider rendrer
- Lead-form vises
- Form-styling matcher resten af sitet
- UTM-tracking fungerer (besøg `/klinikker?utm_source=test&utm_campaign=foo`, inspect form via DevTools, tjek hidden fields populated)
- Submit fejler stadigvæk (endpoint kommer i Task 5) — det er forventet

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/LeadForm.astro site/src/pages/klinikker.astro site/src/pages/konsulenter.astro site/src/components/Footer.astro
git commit -m "feat(site): landing pages /klinikker og /konsulenter med lead-form

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Lead-form-endpoint på bot-worker

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/src/internal.ts` (tilføj `POST /internal/lead`)
- Modify: `worker/src/index.ts` (tilføj `LEAD_NOTIFY_CHAT_ID` til Env)
- Modify: `worker/tests/internal.test.ts` (tests for nyt endpoint)
- Modify: `worker/wrangler.toml` (KV-binding hvis ekstra namespace, ellers genbrug BOT_STATE)

**Goal:** POST `/internal/lead` modtager JSON fra landing-page lead-form, gemmer i KV, sender Telegram-DM til Philip. Genbruger eksisterende BOT_STATE KV.

**OBS:** Dette endpoint er IKKE auth-beskyttet (modsat andre `/internal/*`-endpoints) — det skal kunne kaldes anonymt fra browseren. Vi rate-limiter på IP-niveau via Cloudflare's eksisterende DDoS-beskyttelse + simpel KV-counter.

- [ ] **Step 1: Skriv failing tests**

Tilføj i `worker/tests/internal.test.ts` efter eksisterende `describe`-blokke:

```typescript
describe("POST /internal/lead", () => {
  it("modtager JSON, gemmer i KV, sender Telegram-DM, returnerer 200", async () => {
    let dmSent: { chatId: string; text: string } | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const u = url.toString();
      if (u.includes("api.telegram.org")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmSent = { chatId: body.chat_id, text: body.text };
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const payload = {
      niche: "klinik",
      name: "Anne Hansen",
      company: "Klinik Anne",
      email: "anne@klinikanne.dk",
      phone: "12345678",
      message: "Hej, jeg vil gerne høre om jeres priser",
      utm_source: "linkedin",
      utm_campaign: "spring",
    };

    const res = await SELF.fetch("https://bot.birkenborg.dev/internal/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; lead_id: string };
    expect(body.ok).toBe(true);
    expect(body.lead_id).toMatch(/^lead:\d+:[0-9a-f]+$/);

    // Telegram-DM sendt
    expect(dmSent).not.toBeNull();
    expect(dmSent!.chatId).toBe(env.TELEGRAM_CHAT_ID);
    expect(dmSent!.text).toContain("Anne Hansen");
    expect(dmSent!.text).toContain("klinik");
    expect(dmSent!.text).toContain("anne@klinikanne.dk");
    expect(dmSent!.text).toContain("linkedin");

    // KV gemmer lead
    const stored = await env.BOT_STATE.get(body.lead_id);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.email).toBe("anne@klinikanne.dk");
  });

  it("returnerer 400 ved manglende required fields", async () => {
    const res = await SELF.fetch("https://bot.birkenborg.dev/internal/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ niche: "klinik" }),  // mangler name, email, message
    });
    expect(res.status).toBe(400);
  });

  it("returnerer 400 ved ugyldig niche-værdi", async () => {
    const res = await SELF.fetch("https://bot.birkenborg.dev/internal/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        niche: "ugyldig",
        name: "X",
        email: "x@x.dk",
        message: "y",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rate-limiter ved >5 requests fra samme IP på 60s", async () => {
    // Fire requests først
    for (let i = 0; i < 5; i++) {
      const r = await SELF.fetch("https://bot.birkenborg.dev/internal/lead", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": "9.9.9.9" },
        body: JSON.stringify({
          niche: "klinik", name: `T${i}`, email: `t${i}@x.dk`, message: "m",
        }),
      });
      expect(r.status).toBe(200);
    }
    // Sjette skal blokeres
    const blocked = await SELF.fetch("https://bot.birkenborg.dev/internal/lead", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "9.9.9.9" },
      body: JSON.stringify({
        niche: "klinik", name: "T6", email: "t6@x.dk", message: "m",
      }),
    });
    expect(blocked.status).toBe(429);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/internal.test.ts -t "POST /internal/lead"
```

Forventet: 4 tests FAIL.

- [ ] **Step 3: Tilføj `LEAD_NOTIFY_CHAT_ID` til Env-typen**

Modify `worker/src/index.ts` — `Env` interface tilføj **valgfrit** felt:

```typescript
LEAD_NOTIFY_CHAT_ID?: string;  // chat_id der får DM ved nyt lead. Default = TELEGRAM_CHAT_ID hvis ikke sat.
```

- [ ] **Step 4: Implementér endpoint i internal.ts**

Modify `worker/src/internal.ts` — **Vigtigt: endpointet skal placeres FØR auth-checket** så det er offentligt tilgængeligt. Refactor `handleInternal`:

```typescript
import { listInboxSince, isKilled, getKillReason, savePendingYes, isYesPending } from "./kv";
import { sendDM } from "./telegram";
import type { Env } from "./index";

const VALID_NICHES = new Set(["klinik", "konsulent"]);
const RATE_LIMIT_PER_IP = 5;  // requests per window
const RATE_LIMIT_WINDOW_SECONDS = 60;
const LEAD_TTL_SECONDS = 90 * 86400;  // 90 dage

interface LeadPayload {
  niche?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  message?: string;
  utm_source?: string;
  utm_campaign?: string;
}

export async function handleInternal(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Public lead-endpoint (FØR auth-check)
  if (path === "/internal/lead" && req.method === "POST") {
    return handleLead(req, env);
  }

  // Auth-check for alle andre /internal/*-endpoints
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${env.BOT_INTERNAL_TOKEN}`) {
    return new Response("unauthorized", { status: 401 });
  }

  // ... resten af eksisterende endpoints (uændret)
  if (path === "/internal/inbox" && req.method === "GET") {
    const since = parseInt(url.searchParams.get("since") ?? "0", 10);
    const messages = await listInboxSince(env.BOT_STATE, since);
    return Response.json({ messages });
  }

  if (path === "/internal/kill" && req.method === "GET") {
    const date = url.searchParams.get("date");
    if (!date) return new Response("missing date", { status: 400 });
    const killed = await isKilled(env.BOT_STATE, date);
    const reason = killed ? await getKillReason(env.BOT_STATE, date) : null;
    return Response.json({ killed, reason });
  }

  if (path === "/internal/yes-pending" && req.method === "POST") {
    const body = await req.json() as { post_id?: string; text?: string };
    if (!body.post_id || !body.text) return new Response("missing post_id/text", { status: 400 });
    await savePendingYes(env.BOT_STATE, body.post_id, body.text);
    return Response.json({ ok: true });
  }

  if (path === "/internal/yes-status" && req.method === "GET") {
    const postId = url.searchParams.get("post_id");
    if (!postId) return new Response("missing post_id", { status: 400 });
    const pending = await isYesPending(env.BOT_STATE, postId);
    return Response.json({ confirmed: !pending });
  }

  if (path === "/internal/notify" && req.method === "POST") {
    const body = await req.json() as { text?: string };
    if (!body.text) return new Response("missing text", { status: 400 });
    await sendDM(env.TELEGRAM_BOT_TOKEN, parseInt(env.TELEGRAM_CHAT_ID, 10), body.text);
    return Response.json({ ok: true });
  }

  // Preview-route fra Task 4 i M2-plan (eksisterende, bevares uændret)
  if (path.startsWith("/internal/preview/") && req.method === "GET") {
    const token = path.slice("/internal/preview/".length);
    if (!/^[0-9a-f]{32}$/.test(token)) {
      return new Response("invalid token", { status: 404 });
    }
    const { lookupPreviewToken } = await import("./news/preview");
    const entry = await lookupPreviewToken(env.BOT_STATE, token);
    if (!entry) return new Response("not found", { status: 404 });

    const { getSeed } = await import("./news/state");
    const seed = await getSeed(env.BOT_STATE, entry.chatId, entry.seedId);
    if (!seed?.draft) return new Response("draft missing", { status: 404 });

    return Response.json({
      draft: seed.draft,
      slug: entry.slug,
      expiresAt: entry.expiresAt,
    });
  }

  return new Response("Not found", { status: 404 });
}

async function handleLead(req: Request, env: Env): Promise<Response> {
  // Rate-limit per IP
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const rateKey = `lead-rate:${ip}`;
  const currentCountStr = await env.BOT_STATE.get(rateKey);
  const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
  if (currentCount >= RATE_LIMIT_PER_IP) {
    return new Response("rate_limited", { status: 429 });
  }
  await env.BOT_STATE.put(rateKey, String(currentCount + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });

  // Parse + validate payload
  let payload: LeadPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  if (!payload.niche || !VALID_NICHES.has(payload.niche)) {
    return new Response("invalid_niche", { status: 400 });
  }
  if (!payload.name || !payload.email || !payload.message) {
    return new Response("missing_required_fields", { status: 400 });
  }

  // Gem lead i KV
  const now = Math.floor(Date.now() / 1000);
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  const leadId = `lead:${now}:${randomHex}`;

  const leadRecord = {
    ...payload,
    submitted_at: now,
    ip,
  };
  await env.BOT_STATE.put(leadId, JSON.stringify(leadRecord), { expirationTtl: LEAD_TTL_SECONDS });

  // Send Telegram-DM
  const notifyChatId = env.LEAD_NOTIFY_CHAT_ID ?? env.TELEGRAM_CHAT_ID;
  const utmInfo = payload.utm_source || payload.utm_campaign
    ? `${payload.utm_source ?? "—"}/${payload.utm_campaign ?? "—"}`
    : "direct";
  const dmText = [
    `🆕 Nyt lead — ${payload.niche}`,
    `Navn: ${payload.name}`,
    `Firma: ${payload.company || "—"}`,
    `Email: ${payload.email}`,
    `Telefon: ${payload.phone || "—"}`,
    ``,
    `Besked:`,
    payload.message,
    ``,
    `UTM: ${utmInfo}`,
  ].join("\n");
  await sendDM(env.TELEGRAM_BOT_TOKEN, parseInt(notifyChatId, 10), dmText);

  return Response.json({ ok: true, lead_id: leadId });
}
```

- [ ] **Step 5: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"; npx vitest run tests/internal.test.ts
```

Forventet: alle internal-tests PASS (eksisterende + 4 nye).

- [ ] **Step 6: Verify hele worker-suiten**

```powershell
npx vitest run
```

Forventet: alle tests PASS (~125+).

- [ ] **Step 7: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/internal.ts worker/src/index.ts worker/tests/internal.test.ts
git commit -m "feat(bot): public POST /internal/lead endpoint med rate-limit + Telegram-notif

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 8: Deploy bot-worker** (manuel, du vurderer)

```powershell
cd /c/Users/birke/Projects/birkenborg-agents/worker
npx wrangler deploy
```

Forventet: deploy OK. Lead-endpoint live på `https://bot.birkenborg.dev/internal/lead`.

---

## Task 6: AI-draft-helper script

**Repo:** `birkenborg-agents`

**Files:**
- Create: `scripts/draft_outreach.py`
- Create: `tests/test_draft_outreach.py`

**Goal:** CLI der tager lead-info (navn, firma, site-URL eller LinkedIn-URL) og genererer 2-3 forslag til personaliseret første-linje til outreach. Bruger Claude API. Du copy-paster den valgte ind i template og sender manuelt.

- [ ] **Step 1: Skriv failing test (mocker Claude API)**

Opret `tests/test_draft_outreach.py`:

```python
"""Tests for draft_outreach.py."""
from __future__ import annotations

from unittest.mock import Mock, patch

import pytest

from scripts.draft_outreach import (
    build_prompt,
    parse_response,
    LeadInfo,
)


def test_build_prompt_includes_lead_info():
    lead = LeadInfo(
        name="Anne Hansen",
        firm="Klinik Anne",
        site_url="https://klinikanne.dk",
        site_excerpt="Vi tilbyder fysioterapi i hjertet af København.",
        niche="klinik",
    )
    prompt = build_prompt(lead)
    assert "Anne Hansen" in prompt
    assert "Klinik Anne" in prompt
    assert "klinikanne.dk" in prompt
    assert "fysioterapi" in prompt
    assert "klinik" in prompt.lower()


def test_build_prompt_handles_missing_excerpt():
    lead = LeadInfo(
        name="Bo",
        firm="Bo Konsulent ApS",
        site_url=None,
        site_excerpt=None,
        niche="konsulent",
    )
    prompt = build_prompt(lead)
    assert "Bo" in prompt
    assert "Bo Konsulent ApS" in prompt
    assert "ingen site-info" in prompt.lower() or "uden site" in prompt.lower()


def test_parse_response_extracts_numbered_options():
    response = """1. Jeg så I har specialiseret jer i sportsskader — det er præcis den slags klinikker jeg gerne vil snakke med.

2. Jeg lagde mærke til at jeres bookingflow stadig er telefon-only.

3. I beskriver jeres tilgang som "evidensbaseret og pragmatisk" — det er ikke en sætning man ser ofte."""
    options = parse_response(response)
    assert len(options) == 3
    assert "sportsskader" in options[0]
    assert "telefon-only" in options[1]
    assert "evidensbaseret" in options[2]


def test_parse_response_handles_single_option():
    response = "Jeg så I lige har lanceret jeres nye site — flot rebranding."
    options = parse_response(response)
    assert len(options) == 1
    assert "rebranding" in options[0]
```

- [ ] **Step 2: Verify RED**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
python -m pytest tests/test_draft_outreach.py -v
```

Forventet: 4 tests FAIL — module not found.

- [ ] **Step 3: Skriv minimal implementation**

Opret `scripts/draft_outreach.py`:

```python
"""AI-draft-helper: generér personaliserede outreach-openers.

Brug:
    python scripts/draft_outreach.py \\
        --name "Anne Hansen" \\
        --firm "Klinik Anne" \\
        --site https://klinikanne.dk \\
        --niche klinik

Output: 2-3 forslag til første-linje. Du vælger og indsætter i email/LinkedIn-template.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import anthropic
import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / ".env"
TONE_PATH = REPO_ROOT / "prompts" / "tone.md"
MODEL = "claude-sonnet-4-6"


@dataclass
class LeadInfo:
    name: str
    firm: str
    site_url: Optional[str]
    site_excerpt: Optional[str]
    niche: str


def fetch_site_excerpt(url: str, max_chars: int = 1500) -> Optional[str]:
    """Fetch site og returnér første ~1500 tegn af brødtekst.
    Bruger r.jina.ai's reader-API for clean markdown-output."""
    try:
        reader_url = f"https://r.jina.ai/{url}"
        res = requests.get(reader_url, timeout=10)
        if res.status_code != 200:
            return None
        return res.text[:max_chars]
    except Exception:
        return None


def build_prompt(lead: LeadInfo) -> str:
    """Konstruér prompt til Claude — beder om 2-3 personaliserede åbnings-linjer."""
    tone = ""
    if TONE_PATH.exists():
        tone = TONE_PATH.read_text(encoding="utf-8")

    site_section = ""
    if lead.site_excerpt:
        site_section = f"## Deres site-indhold\n\n{lead.site_excerpt}\n"
    else:
        site_section = "## Deres site-indhold\n\n(ingen site-info — outreach uden site-specifik åbning)\n"

    return f"""Du er Philip Birkenborgs assistent. Philip skriver outreach-emails til potentielle kunder. Du skal foreslå 2-3 personaliserede åbnings-linjer til hans email-template.

# Tone-profil

{tone}

# Lead-info

- Navn: {lead.name}
- Firma/klinik: {lead.firm}
- Niche: {lead.niche}
- Site: {lead.site_url or "(ingen)"}

{site_section}

# Opgave

Foreslå 2-3 åbnings-linjer Philip kan starte sin email med. Hver linje skal:
- Referere til en KONKRET detalje fra deres site (eller fra firma-navn hvis intet site)
- Være kort (max 25 ord)
- Lyde som Philip — ikke salgsagent
- Vise at han faktisk har set deres arbejde, ikke bare massesendt
- Lede naturligt ind i resten af templaten ("...det er den slags klinikker jeg gerne vil snakke med")

Returnér KUN de 2-3 forslag, nummererede (1., 2., 3.). Ingen forklaring, ingen indledning."""


def call_claude(prompt: str, api_key: str) -> str:
    """Kald Claude API og returnér text."""
    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(b.text for b in response.content if b.type == "text")
    return text


def parse_response(text: str) -> list[str]:
    """Parse 1./2./3.-formaterede svar til liste."""
    lines = []
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        # Match "1.", "2.", "3." prefix
        m = re.match(r"^\d+\.\s*(.+)$", line)
        if m:
            lines.append(m.group(1).strip())
        elif lines:
            # Fortsættelse af forrige punkt
            lines[-1] += " " + line
        else:
            # Single-option svar uden nummerering
            lines.append(line)
    return lines


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--firm", required=True)
    parser.add_argument("--site", default=None, help="URL til deres hjemmeside (valgfri)")
    parser.add_argument("--niche", choices=["klinik", "konsulent"], required=True)
    args = parser.parse_args()

    load_dotenv(ENV_PATH)
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("FEJL: ANTHROPIC_API_KEY mangler", file=sys.stderr)
        return 1

    excerpt = fetch_site_excerpt(args.site) if args.site else None
    if args.site and not excerpt:
        print(f"Bemærk: kunne ikke hente {args.site} — fortsætter uden site-info", file=sys.stderr)

    lead = LeadInfo(
        name=args.name,
        firm=args.firm,
        site_url=args.site,
        site_excerpt=excerpt,
        niche=args.niche,
    )

    prompt = build_prompt(lead)
    print(f"Kalder Claude...", file=sys.stderr)
    response = call_claude(prompt, api_key)
    options = parse_response(response)

    print(f"\n=== {len(options)} forslag til åbnings-linje for {args.name} ===\n")
    for i, opt in enumerate(options, 1):
        print(f"{i}. {opt}\n")
    print(f"\nKopiér din favorit ind i outreach/{args.niche}-template.md som åbnings-linje.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Verify GREEN**

```bash
python -m pytest tests/test_draft_outreach.py -v
```

Forventet: 4 tests PASS.

- [ ] **Step 5: Manuel smoke-test (koster ~$0.02)**

```bash
python scripts/draft_outreach.py \
    --name "Test Test" \
    --firm "Test Klinik" \
    --site "https://birkenborg.dev" \
    --niche klinik
```

Forventet: 2-3 forslag til åbnings-linje udskrevet. Site-excerpt fetched fra birkenborg.dev (hvis r.jina.ai virker).

- [ ] **Step 6: Commit**

```bash
git add scripts/draft_outreach.py tests/test_draft_outreach.py
git commit -m "feat(outreach): AI-draft-helper for personaliserede outreach-openers

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Operational milestones (efter infrastruktur er live)

Disse er IKKE kode-tasks, men hvor du går fra infrastructure til validation. De afslutter Fase 1 per spec'en.

- [ ] **OM-1: Email-alias fuldført og testet** (ende-til-ende test af Cloudflare Email Routing)
- [ ] **OM-2: Bot-worker deployed med lead-endpoint** (Task 5 step 8 udført)
- [ ] **OM-3: Site re-deployed med landing-pages** (push til main, GH Actions auto-deploy)
- [ ] **OM-4: Generér første batch leads via CVR-script** (10 klinikker + 10 konsulenter, importér til Google Sheet)
- [ ] **OM-5: Send 20 outreaches** (10 per niche, brug AI-draft-helper for personalisering, send manuelt)
- [ ] **OM-6: Gennemfør 20 samtaler** (forskningssamtaler, ikke pitches)
- [ ] **OM-7: Niche-narrowing-beslutning truffet** baseret på respons-data — primær niche valgt
- [ ] **OM-8: 1-2 pilot-aftaler underskrevet**

Når OM-1 til OM-8 er gennemført, er Fase 1 done. Fase 2-implementation plan skrives da, baseret på erfaringer fra Fase 1.

---

## Self-review tjekliste

- [ ] Spec section 4 Fase 1 exit-criteria — alle dækket af enten kode-task (Task 1-6) eller operational milestones (OM-1 til OM-8)? ✅
- [ ] Reklamebeskyttelses-disciplin (spec section 2) — implementeret i Task 2 (CVR-script filter) og dokumenteret i outreach/README.md ✅
- [ ] Pricing (spec section 3) — vist i landing-pages (Task 4) ✅
- [ ] Tone-profil følger 8-tone-essens fra `prompts/tone.md` — referenceret i Task 6 (build_prompt indlæser tone.md) ✅
- [ ] Ingen tids-bundne estimater i tasks — exit-criteria-baseret ✅
- [ ] Type-konsistens: `LeadInfo`-felter (name, firm, site_url, site_excerpt, niche) er ens på tværs af build_prompt og main ✅
- [ ] Lead-form payload matcher endpoint-validering (niche, name, email, message required; rest optional) ✅
