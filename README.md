# birkenborg.dev

Personligt hub-website. Anthropic-æstetik. Statisk Astro-site med markdown-content.

## Status

- **Site (M1):** ✅ Live på `*.pages.dev`
- **Pipeline (M2):** Planlagt
- **Privacy gate (M3):** Planlagt

## Lokal udvikling

```bash
cd site
npm install
npm run dev
# → http://localhost:4321
```

## Bygge til produktion

```bash
cd site
npm run build
```

Output: `site/dist/`

## Tests

```bash
cd site
npm run test          # vitest unit tests
npm run e2e           # playwright e2e
```

## Indholds-struktur

- `content/posts/` — skrifter (markdown med frontmatter)
- `content/projekter/` — projekt-cases
- `content/cv.md` — CV (sandheden, renderes på /cv)

## Designsystem

Se `docs/superpowers/specs/2026-05-05-birkenborg-dev-cv-linkedin-agent-design.md` afsnit 4 for komplette design-tokens, fonte og komposition.

## Hosting

Cloudflare Pages, auto-deploy fra `main`-branch. Custom domain `birkenborg.dev` pointes på Cloudflare når registreret.
