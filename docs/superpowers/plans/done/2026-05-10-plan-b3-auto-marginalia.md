# Plan B3 — Auto-commit-scanning + PR-flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ugentlig GitHub Action der scanner commits fra `birkenborg-dev` + `birkenborg-agents` repos, matcher dem mod publicerede skrifter via keyword-overlap, og åbner PR mod `birkenborg-dev/main` med foreslåede marginalia-entries.

**Architecture:** Node-baseret script `scripts/build-marginalia.mjs` der læser content/posts/, fetcher commits via GitHub Commits API, kører pure-function keyword-match-heuristik, bygger marginalia-suggestions, dedupliker mod eksisterende, skriver ændrede frontmatter via gray-matter, og opener PR via `gh` CLI. Workflow trigger ugentligt (søndag aften) + manuel via `workflow_dispatch`.

**Tech Stack:** Node.js 22, gray-matter (allerede dep), Vitest (env: node), GitHub Actions, gh CLI, GitHub Commits API.

**Spec:** `docs/superpowers/specs/2026-05-10-marginalia-pipeline-design.md` sektion 4.

**Working dir:** `C:\Users\birke\Projects\birkenborg-dev`

---

## File Structure

### Skab
- `scripts/build-marginalia.mjs` — orchestrator + helpers (~200 linjer)
- `scripts/build-marginalia.test.ts` — unit tests for pure funktioner + integration tests for orchestrator
- `scripts/build-marginalia.fixtures/` — sample post-files til integration tests
- `.github/workflows/auto-marginalia.yml` — ugentlig cron-trigger

### Modificer
- (ingen — Plan B3 tilføjer kun nye filer)

---

## Task 1: Pure helpers — keyword-extraction + match-heuristik (TDD)

**Files:**
- Create: `scripts/build-marginalia.mjs` (initial skeleton)
- Create: `scripts/build-marginalia.test.ts`

**Goal:** To pure helpers — `extractKeywords(slug, tags, title)` og `matchCommit(commitMessage, keywords)` — der laver det meste af heuristik-arbejdet.

- [ ] **Step 1: Write failing tests**

Create `scripts/build-marginalia.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  extractKeywords,
  matchCommit,
} from "./build-marginalia.mjs";

describe("extractKeywords", () => {
  it("extraherer slug-fragmenter, tags, og title-keywords", () => {
    const result = extractKeywords({
      slug: "ma-agent-paragraf-30",
      tags: ["jura", "kode"],
      title: "M&A-agenten fejlede på paragraf 30",
    });
    expect(result).toContain("agent");
    expect(result).toContain("paragraf");
    expect(result).toContain("jura");
    expect(result).toContain("kode");
    expect(result).toContain("fejlede");
  });

  it("filtrerer stop-words og korte ord (<3 chars)", () => {
    const result = extractKeywords({
      slug: "x-en-og-eller",
      tags: [],
      title: "Et og eller på",
    });
    expect(result).not.toContain("en");
    expect(result).not.toContain("og");
    expect(result).not.toContain("og");
    expect(result).not.toContain("på");
    expect(result).not.toContain("et");
    expect(result).not.toContain("eller");
  });

  it("lowercase + dedup", () => {
    const result = extractKeywords({
      slug: "agent-agent",
      tags: ["AGENT"],
      title: "Agent agent agent",
    });
    expect(result.filter((k) => k === "agent")).toHaveLength(1);
  });

  it("håndterer tomme inputs", () => {
    expect(extractKeywords({ slug: "", tags: [], title: "" })).toEqual([]);
  });
});

describe("matchCommit", () => {
  it("returnerer matched keywords for commit-message", () => {
    const matches = matchCommit(
      "feat(news): Marginalia-komponent fixet til paragraf",
      ["marginalia", "paragraf", "agent", "kode"],
    );
    expect(matches).toContain("marginalia");
    expect(matches).toContain("paragraf");
    expect(matches).not.toContain("agent");
    expect(matches).not.toContain("kode");
  });

  it("returnerer tom array hvis ingen match", () => {
    expect(matchCommit("chore: bump deps", ["agent", "jura"])).toEqual([]);
  });

  it("matcher case-insensitive", () => {
    expect(matchCommit("FEAT: AGENT virker", ["agent"])).toEqual(["agent"]);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
npx vitest run scripts/build-marginalia.test.ts
```

Expected: FAIL — `Cannot find module './build-marginalia.mjs'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/build-marginalia.mjs`:

```javascript
const STOP_WORDS_DA = new Set([
  "og", "eller", "men", "som", "der", "det", "den", "de", "en", "et",
  "at", "for", "til", "med", "af", "på", "i", "var", "er", "have", "har",
  "kan", "skal", "vil", "ikke", "ja", "nej", "hvis", "når", "også",
  "være", "blev", "bliver", "fra", "om", "ud", "ind", "op", "ned",
]);

const MIN_KEYWORD_LENGTH = 3;

export function extractKeywords({ slug, tags, title }) {
  const all = new Set();
  const addTokens = (text) => {
    if (!text) return;
    const tokens = text.toLowerCase().split(/[^a-zA-ZæøåÆØÅ0-9]+/).filter(Boolean);
    for (const t of tokens) {
      if (t.length < MIN_KEYWORD_LENGTH) continue;
      if (STOP_WORDS_DA.has(t)) continue;
      all.add(t);
    }
  };
  addTokens(slug);
  addTokens(title);
  for (const tag of tags ?? []) addTokens(tag);
  return [...all];
}

export function matchCommit(commitMessage, keywords) {
  const lower = commitMessage.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw));
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
npx vitest run scripts/build-marginalia.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add scripts/build-marginalia.mjs scripts/build-marginalia.test.ts
git commit -m "feat(scripts): build-marginalia helpers — extractKeywords + matchCommit"
```

---

## Task 2: GitHub commit-fetcher (TDD)

**Files:**
- Modify: `scripts/build-marginalia.mjs`
- Modify: `scripts/build-marginalia.test.ts`

**Goal:** `fetchCommits(repo, githubToken, sinceDays)` henter commits fra GitHub via Commits API, returnerer normaliseret format `{ message, author_date, html_url }`.

- [ ] **Step 1: Add failing test**

Modify `scripts/build-marginalia.test.ts` — add new describe-block at end:

```typescript
import { fetchCommits } from "./build-marginalia.mjs";
import { vi, beforeEach } from "vitest";

describe("fetchCommits", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("henter commits og returnerer normaliseret format", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          sha: "abc",
          commit: {
            message: "feat: ny feature",
            author: { date: "2026-05-09T14:00:00Z" },
          },
          html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc",
        },
      ]), { status: 200 }),
    );

    const commits = await fetchCommits("fluen1/birkenborg-dev", "ghp_test", 30);
    expect(commits).toHaveLength(1);
    expect(commits[0]).toEqual({
      message: "feat: ny feature",
      authorDate: "2026-05-09T14:00:00Z",
      htmlUrl: "https://github.com/fluen1/birkenborg-dev/commit/abc",
    });
  });

  it("kaster fejl ved 4xx-respons fra GitHub", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("forbidden", { status: 403 }),
    );
    await expect(fetchCommits("fluen1/private", "bad-token", 30)).rejects.toThrow(/github.*403/i);
  });

  it("filterer commits ældre end sinceDays", async () => {
    const recentTs = new Date(Date.now() - 5 * 86400_000).toISOString();
    const oldTs = new Date(Date.now() - 60 * 86400_000).toISOString();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          sha: "new",
          commit: { message: "ny", author: { date: recentTs } },
          html_url: "https://example.com/new",
        },
        {
          sha: "old",
          commit: { message: "gammel", author: { date: oldTs } },
          html_url: "https://example.com/old",
        },
      ]), { status: 200 }),
    );

    const commits = await fetchCommits("fluen1/repo", "ghp", 30);
    expect(commits).toHaveLength(1);
    expect(commits[0].message).toBe("ny");
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: 3 new tests FAIL — `fetchCommits is not exported`.

- [ ] **Step 3: Add implementation**

Modify `scripts/build-marginalia.mjs` — add at end of file:

```javascript
const GITHUB_API = "https://api.github.com";

export async function fetchCommits(repo, githubToken, sinceDays) {
  const res = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=100`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "build-marginalia",
    },
  });
  if (!res.ok) {
    throw new Error(`github_${res.status}: ${repo}`);
  }
  const arr = await res.json();
  const cutoffMs = Date.now() - sinceDays * 86400_000;
  return arr
    .map((c) => ({
      message: c.commit.message.split("\n")[0],
      authorDate: c.commit.author.date,
      htmlUrl: c.html_url,
    }))
    .filter((c) => Date.parse(c.authorDate) >= cutoffMs);
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: alle 10 tests PASS (7 + 3 new).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add scripts/build-marginalia.mjs scripts/build-marginalia.test.ts
git commit -m "feat(scripts): fetchCommits — GitHub Commits API med sinceDays-filter"
```

---

## Task 3: Marginalia builder + dedup (TDD)

**Files:**
- Modify: `scripts/build-marginalia.mjs`
- Modify: `scripts/build-marginalia.test.ts`

**Goal:** `buildSuggestions(post, commits)` returnerer marginalia-entries for matchede commits. `dedupAgainstExisting(post, suggestions)` filtrerer suggestions der allerede er i post.marginalia.

- [ ] **Step 1: Failing tests**

Modify `scripts/build-marginalia.test.ts` — add at end:

```typescript
import { buildSuggestions, dedupAgainstExisting } from "./build-marginalia.mjs";

describe("buildSuggestions", () => {
  it("bygger marginalia-entries for matched commits", () => {
    const post = {
      slug: "ma-agent-paragraf-30",
      tags: [],
      title: "M&A-agenten",
      marginalia: [],
    };
    const commits = [
      {
        message: "feat: agent-fix til paragraf",
        authorDate: "2026-05-09T14:00:00Z",
        htmlUrl: "https://github.com/x/y/commit/abc",
      },
      {
        message: "chore: ikke relateret",
        authorDate: "2026-05-09T15:00:00Z",
        htmlUrl: "https://github.com/x/y/commit/def",
      },
    ];
    const suggestions = buildSuggestions(post, commits);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toEqual({
      ts: "2026-05-09T14:00:00Z",
      text: "feat: agent-fix til paragraf",
      source: "auto-commit",
      commit_url: "https://github.com/x/y/commit/abc",
    });
  });

  it("trimmer commit-message til max 80 chars + stripper conventional-commit-prefix", () => {
    const post = { slug: "x", tags: [], title: "", marginalia: [] };
    const longMessage = "feat(scope): " + "a".repeat(200);
    const commits = [
      { message: longMessage, authorDate: "2026-05-09T00:00:00Z", htmlUrl: "https://x.com/c" },
    ];
    // Force keyword-match by setting title-keyword that's in the message
    const postWithMatch = { ...post, title: "aaaaa" };
    const suggestions = buildSuggestions(postWithMatch, commits);
    expect(suggestions[0].text.length).toBeLessThanOrEqual(80);
    expect(suggestions[0].text).not.toMatch(/^feat\(scope\):/);
  });
});

describe("dedupAgainstExisting", () => {
  it("filtrerer suggestions der matcher eksisterende marginalia (text-equality)", () => {
    const post = {
      slug: "x", tags: [], title: "",
      marginalia: [
        { ts: "2026-05-08", text: "allerede tilføjet", source: "manual" },
      ],
    };
    const suggestions = [
      { ts: "2026-05-09", text: "allerede tilføjet", source: "auto-commit", commit_url: "x" },
      { ts: "2026-05-09", text: "ny note", source: "auto-commit", commit_url: "y" },
    ];
    const filtered = dedupAgainstExisting(post, suggestions);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].text).toBe("ny note");
  });

  it("returnerer alle hvis post mangler marginalia-felt", () => {
    const post = { slug: "x", tags: [], title: "" };
    const suggestions = [
      { ts: "2026-05-09", text: "ny", source: "auto-commit", commit_url: "x" },
    ];
    expect(dedupAgainstExisting(post, suggestions)).toEqual(suggestions);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: 4 new FAIL.

- [ ] **Step 3: Add implementation**

Modify `scripts/build-marginalia.mjs` — add at end:

```javascript
const MAX_TEXT_LENGTH = 80;

function stripConventionalPrefix(message) {
  const m = message.match(/^[a-z]+(\([^)]+\))?:\s*(.+)$/);
  return m?.[2] ?? message;
}

export function buildSuggestions(post, commits) {
  const keywords = extractKeywords({
    slug: post.slug,
    tags: post.tags ?? [],
    title: post.title ?? "",
  });
  if (keywords.length === 0) return [];

  const suggestions = [];
  for (const c of commits) {
    const matched = matchCommit(c.message, keywords);
    if (matched.length === 0) continue;
    const cleanText = stripConventionalPrefix(c.message).trim().slice(0, MAX_TEXT_LENGTH);
    suggestions.push({
      ts: c.authorDate,
      text: cleanText,
      source: "auto-commit",
      commit_url: c.htmlUrl,
    });
  }
  return suggestions;
}

export function dedupAgainstExisting(post, suggestions) {
  const existing = new Set((post.marginalia ?? []).map((m) => m.text));
  return suggestions.filter((s) => !existing.has(s.text));
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: alle 14 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add scripts/build-marginalia.mjs scripts/build-marginalia.test.ts
git commit -m "feat(scripts): buildSuggestions + dedupAgainstExisting helpers"
```

---

## Task 4: File-writer (TDD)

**Files:**
- Modify: `scripts/build-marginalia.mjs`
- Modify: `scripts/build-marginalia.test.ts`
- Create: `scripts/build-marginalia.fixtures/sample-post.md` (test-fixture)

**Goal:** `writePostWithMarginalia(filePath, suggestions)` læser en post-fil, parser frontmatter, appender suggestions til marginalia-array, skriver tilbage. Bruger gray-matter for round-trip.

- [ ] **Step 1: Create test fixture**

Create `scripts/build-marginalia.fixtures/sample-post.md`:

```markdown
---
title: Test post
slug: test-post
publish_at: 2026-05-08
status: published
tags: [test, kode]
privacy_flag: false
linkedin_url: null
---

# Test post

Body content.
```

- [ ] **Step 2: Failing test**

Modify `scripts/build-marginalia.test.ts` — add at end:

```typescript
import { writePostWithMarginalia } from "./build-marginalia.mjs";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "build-marginalia.fixtures", "sample-post.md");

describe("writePostWithMarginalia", () => {
  let tmpPath: string;

  beforeEach(async () => {
    const tmpDir = join(__dirname, ".tmp-test");
    await mkdir(tmpDir, { recursive: true });
    tmpPath = join(tmpDir, "test-post.md");
    const fixture = await readFile(FIXTURE_PATH, "utf-8");
    await writeFile(tmpPath, fixture);
  });

  it("appender suggestions til marginalia-array i frontmatter", async () => {
    const suggestions = [
      {
        ts: "2026-05-09T14:00:00Z",
        text: "feat: ny feature",
        source: "auto-commit",
        commit_url: "https://github.com/x/y/commit/abc",
      },
    ];
    await writePostWithMarginalia(tmpPath, suggestions);
    const updated = await readFile(tmpPath, "utf-8");
    expect(updated).toContain("marginalia:");
    expect(updated).toContain("ny feature");
    expect(updated).toContain("source: auto-commit");
    expect(updated).toContain("commit_url:");
    // Body bevaret
    expect(updated).toContain("# Test post");
    expect(updated).toContain("Body content.");
  });

  it("appender til eksisterende marginalia hvis array allerede findes", async () => {
    const fixtureWithMarg = `---
title: Test
slug: test
publish_at: 2026-05-08
status: published
tags: []
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: "8/5"
    text: eksisterende note
    source: manual
---

Body.
`;
    await writeFile(tmpPath, fixtureWithMarg);

    const suggestions = [
      { ts: "2026-05-09", text: "ny", source: "auto-commit", commit_url: "https://x.com" },
    ];
    await writePostWithMarginalia(tmpPath, suggestions);
    const updated = await readFile(tmpPath, "utf-8");
    expect(updated).toContain("eksisterende note");
    expect(updated).toContain("ny");
  });
});
```

- [ ] **Step 3: Verify RED**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: 2 new FAIL.

- [ ] **Step 4: Add implementation**

Modify `scripts/build-marginalia.mjs` — add at top with existing imports + at end:

```javascript
// Top of file: add imports if not already there
import matter from "gray-matter";
import { readFile as readFileNode, writeFile as writeFileNode } from "node:fs/promises";
```

(If `import matter from "gray-matter"` already exists from earlier task, skip the duplicate.)

Then add at end:

```javascript
export async function writePostWithMarginalia(filePath, suggestions) {
  const raw = await readFileNode(filePath, "utf-8");
  const parsed = matter(raw);
  const existing = parsed.data.marginalia ?? [];
  const updated = {
    ...parsed.data,
    marginalia: [...existing, ...suggestions],
  };
  const newContent = matter.stringify(parsed.content, updated);
  await writeFileNode(filePath, newContent, "utf-8");
}
```

- [ ] **Step 5: Verify GREEN**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: alle 16 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add scripts/build-marginalia.mjs scripts/build-marginalia.test.ts scripts/build-marginalia.fixtures/sample-post.md
git commit -m "feat(scripts): writePostWithMarginalia — gray-matter round-trip frontmatter-update"
```

---

## Task 5: Top-level orchestrator + dry-run (TDD)

**Files:**
- Modify: `scripts/build-marginalia.mjs`
- Modify: `scripts/build-marginalia.test.ts`

**Goal:** `runAutoMarginalia({ postsDir, repos, githubToken, sinceDays, dryRun })` orchestrerer hele pipelinen. Returnerer summary `{ filesChanged: number, totalSuggestions: number, perPost: Array<{slug, count}> }`. I dry-run-mode skrives intet til disk; bare summary returneres.

- [ ] **Step 1: Failing test**

Modify `scripts/build-marginalia.test.ts` — add at end:

```typescript
import { runAutoMarginalia } from "./build-marginalia.mjs";

describe("runAutoMarginalia (orchestrator)", () => {
  let postsDir: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    postsDir = join(__dirname, ".tmp-orchestrator-posts");
    await rm(postsDir, { recursive: true, force: true });
    await mkdir(postsDir, { recursive: true });
    // Create a sample post
    const content = `---
title: Auto-test
slug: auto-test
publish_at: 2026-05-08
status: published
tags: [marginalia]
privacy_flag: false
linkedin_url: null
---

Body.
`;
    await writeFile(join(postsDir, "auto-test.md"), content);
  });

  it("returnerer summary uden at skrive i dry-run-mode", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          sha: "abc",
          commit: {
            message: "feat: marginalia komponent fixet",
            author: { date: new Date().toISOString() },
          },
          html_url: "https://github.com/x/y/commit/abc",
        },
      ]), { status: 200 }),
    );

    const summary = await runAutoMarginalia({
      postsDir,
      repos: ["fluen1/birkenborg-dev"],
      githubToken: "ghp",
      sinceDays: 30,
      dryRun: true,
    });

    expect(summary.filesChanged).toBe(1);
    expect(summary.totalSuggestions).toBeGreaterThan(0);
    expect(summary.perPost).toHaveLength(1);
    expect(summary.perPost[0].slug).toBe("auto-test");

    // Filen er IKKE ændret i dry-run
    const after = await readFile(join(postsDir, "auto-test.md"), "utf-8");
    expect(after).not.toContain("auto-commit");
  });

  it("skriver ændringer hvis dryRun = false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          sha: "abc",
          commit: {
            message: "feat: marginalia komponent fixet",
            author: { date: new Date().toISOString() },
          },
          html_url: "https://github.com/x/y/commit/abc",
        },
      ]), { status: 200 }),
    );

    await runAutoMarginalia({
      postsDir,
      repos: ["fluen1/birkenborg-dev"],
      githubToken: "ghp",
      sinceDays: 30,
      dryRun: false,
    });

    const after = await readFile(join(postsDir, "auto-test.md"), "utf-8");
    expect(after).toContain("auto-commit");
  });

  it("skipper privacy_flag-true posts og non-published", async () => {
    const draftContent = `---
title: Draft
slug: draft-post
publish_at: 2026-05-08
status: draft
tags: [marginalia]
privacy_flag: false
linkedin_url: null
---

Body.
`;
    await writeFile(join(postsDir, "draft-post.md"), draftContent);

    const privateContent = `---
title: Private
slug: private-post
publish_at: 2026-05-08
status: published
tags: [marginalia]
privacy_flag: true
linkedin_url: null
---

Body.
`;
    await writeFile(join(postsDir, "private-post.md"), privateContent);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          sha: "abc",
          commit: { message: "feat: marginalia", author: { date: new Date().toISOString() } },
          html_url: "https://x.com/c",
        },
      ]), { status: 200 }),
    );

    const summary = await runAutoMarginalia({
      postsDir,
      repos: ["fluen1/birkenborg-dev"],
      githubToken: "ghp",
      sinceDays: 30,
      dryRun: true,
    });

    // Kun auto-test (status:published + privacy_flag:false) bør være processeret
    expect(summary.perPost.map((p) => p.slug)).toEqual(["auto-test"]);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: 3 new FAIL.

- [ ] **Step 3: Add implementation**

Modify `scripts/build-marginalia.mjs` — add at end:

```javascript
import { readdir } from "node:fs/promises";

export async function runAutoMarginalia({ postsDir, repos, githubToken, sinceDays, dryRun }) {
  // 1. Læs alle posts der er published + ikke privacy_flag
  const files = await readdir(postsDir);
  const posts = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const filePath = `${postsDir}/${f}`;
    const raw = await readFileNode(filePath, "utf-8");
    const parsed = matter(raw);
    if (parsed.data.status !== "published") continue;
    if (parsed.data.privacy_flag === true) continue;
    posts.push({
      filePath,
      slug: parsed.data.slug ?? f.replace(/\.md$/, ""),
      tags: parsed.data.tags ?? [],
      title: parsed.data.title ?? "",
      marginalia: parsed.data.marginalia ?? [],
    });
  }

  // 2. Fetch commits fra alle repos
  const allCommits = [];
  for (const repo of repos) {
    const commits = await fetchCommits(repo, githubToken, sinceDays);
    allCommits.push(...commits);
  }

  // 3. For hver post: byg suggestions + dedup + (skriv hvis ikke dry-run)
  const perPost = [];
  let filesChanged = 0;
  let totalSuggestions = 0;
  for (const post of posts) {
    const raw = buildSuggestions(post, allCommits);
    const filtered = dedupAgainstExisting(post, raw);
    if (filtered.length === 0) continue;
    perPost.push({ slug: post.slug, count: filtered.length });
    totalSuggestions += filtered.length;
    filesChanged++;
    if (!dryRun) {
      await writePostWithMarginalia(post.filePath, filtered);
    }
  }

  return { filesChanged, totalSuggestions, perPost };
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
npx vitest run scripts/build-marginalia.test.ts
```

Expected: alle 19 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add scripts/build-marginalia.mjs scripts/build-marginalia.test.ts
git commit -m "feat(scripts): runAutoMarginalia orchestrator + dry-run mode"
```

---

## Task 6: CLI entry-point + npm script

**Files:**
- Modify: `scripts/build-marginalia.mjs`
- Modify: `package.json` (root)

**Goal:** Script kan køres fra CLI med `node scripts/build-marginalia.mjs --dry-run` eller live. Brug env-vars for auth.

- [ ] **Step 1: Add CLI block**

Modify `scripts/build-marginalia.mjs` — add at the very end (after all exports):

```javascript
// CLI entry point
if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");

  const githubToken = process.env.GITHUB_TOKEN ?? process.env.PUBLIC_REPO_PAT;
  if (!githubToken) {
    console.error("FEJL: GITHUB_TOKEN eller PUBLIC_REPO_PAT skal være sat");
    process.exit(1);
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const postsDir = join(__dirname, "..", "content", "posts");

  const summary = await runAutoMarginalia({
    postsDir,
    repos: ["fluen1/birkenborg-dev", "fluen1/birkenborg-agents"],
    githubToken,
    sinceDays: 30,
    dryRun,
  });

  console.log(JSON.stringify(summary, null, 2));
  if (dryRun) {
    console.log("\n(dry-run — ingen filer ændret)");
  } else {
    console.log(`\nÆndrede ${summary.filesChanged} filer.`);
  }
}
```

(Note: `dirname`, `fileURLToPath`, `resolve`, `join` skal være importeret fra node:path og node:url. Hvis ikke allerede importeret fra tidligere tasks, tilføj imports øverst:)

```javascript
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
```

- [ ] **Step 2: Verify dry-run kører lokalt**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
$env:GITHUB_TOKEN = (npx wrangler secret list 2>&1 | Select-String "GITHUB_TOKEN") -ne $null  # eller manuelt:
# Skip hvis ikke nem at få token lokalt — vi tester via CI
```

For local testing (hvis du har en gh-token):
```powershell
$env:GITHUB_TOKEN = "ghp_XXXX"  # din PAT
node scripts/build-marginalia.mjs --dry-run
```

Expected output (eksempel):
```json
{
  "filesChanged": 0,
  "totalSuggestions": 0,
  "perPost": []
}

(dry-run — ingen filer ændret)
```

(Hvis private repo birkenborg-agents fejler 403/404 pga. token-permissions, så er det ventet — workflow vil bruge `PUBLIC_REPO_PAT` der har cross-repo-access.)

- [ ] **Step 3: Add npm script**

Modify `package.json` (root) — tilføj til `"scripts"`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build:corpus": "node scripts/build-corpus.mjs",
    "build:marginalia": "node scripts/build-marginalia.mjs"
  }
}
```

- [ ] **Step 4: Verify all tests still pass**

```powershell
npx vitest run
```

Expected: alle tests pass.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add scripts/build-marginalia.mjs package.json
git commit -m "feat(scripts): CLI entry + npm run build:marginalia"
```

---

## Task 7: GitHub Action workflow

**Files:**
- Create: `.github/workflows/auto-marginalia.yml`

**Goal:** Ugentlig cron der kører `build-marginalia.mjs`, åbner PR via `gh` CLI hvis der er ændringer, notifier via Telegram.

- [ ] **Step 1: Create workflow file**

Create `.github/workflows/auto-marginalia.yml`:

```yaml
name: Auto-marginalia

# Søndag 19:00 dansk sommer-tid (CEST, UTC+2) = 17:00 UTC.
# DST-NOTE: Ved CET (vintertid, UTC+1) skal cron ændres til '0 18 * * 0'.

on:
  schedule:
    - cron: '0 17 * * 0'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Kør dry-run (ingen ændringer pushed)'
        required: false
        default: 'false'
        type: choice
        options:
          - 'false'
          - 'true'

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.PUBLIC_REPO_PAT }}

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install dependencies
        run: npm install --no-audit --no-fund

      - name: Run auto-marginalia
        id: run
        env:
          GITHUB_TOKEN: ${{ secrets.PUBLIC_REPO_PAT }}
        run: |
          if [ "${{ github.event.inputs.dry_run }}" = "true" ]; then
            node scripts/build-marginalia.mjs --dry-run
          else
            node scripts/build-marginalia.mjs
          fi

      - name: Commit + open PR if changes
        if: github.event.inputs.dry_run != 'true'
        env:
          GH_TOKEN: ${{ secrets.PUBLIC_REPO_PAT }}
        run: |
          if [ -z "$(git status --porcelain content/posts/)" ]; then
            echo "Ingen ændringer — skipper PR-opening"
            exit 0
          fi
          DATE=$(date -u +%Y-%m-%d)
          BRANCH="auto-marginalia/$DATE"
          git config user.name "birkenborg-agents"
          git config user.email "philip+agents@birkenborg.dev"
          git checkout -b "$BRANCH"
          git add content/posts/
          git commit -m "auto-marginalia: ugens noter ($DATE)"
          git push -u origin "$BRANCH"
          gh pr create \
            --title "auto-marginalia: ugens commits → marginalia ($DATE)" \
            --body "Auto-genereret af build-marginalia.mjs. Review hvert forslag og slet de irrelevante FØR merge." \
            --base main \
            --head "$BRANCH"

      - name: Notify Telegram
        if: success() && github.event.inputs.dry_run != 'true'
        env:
          BOT_INTERNAL_TOKEN: ${{ secrets.BOT_INTERNAL_TOKEN }}
        run: |
          if [ -z "$(git log origin/main..HEAD 2>/dev/null)" ]; then
            exit 0
          fi
          curl -s -X POST "https://bot.birkenborg.dev/internal/notify" \
            -H "Authorization: Bearer $BOT_INTERNAL_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"text":"🤖 Auto-marginalia PR åben — review når du har lyst."}'

      - name: Notify on failure
        if: failure()
        env:
          BOT_INTERNAL_TOKEN: ${{ secrets.BOT_INTERNAL_TOKEN }}
        run: |
          curl -s -X POST "https://bot.birkenborg.dev/internal/notify" \
            -H "Authorization: Bearer $BOT_INTERNAL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"⚠️ Auto-marginalia fejlede. Tjek loggen: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}"
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add .github/workflows/auto-marginalia.yml
git commit -m "ci: auto-marginalia workflow — ugentlig scan + PR + Telegram notify"
```

---

## Task 8: Push branch + manuel smoke test (workflow_dispatch dry-run)

**Files:** (ingen)

**Goal:** Push branch, trigger workflow manuelt med `dry_run=true` for at verificere at det virker uden faktisk at åbne PR.

- [ ] **Step 1: Push feature branch**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git push origin <feature-branch>
```

(Branch-navn besluttes ved execution — sandsynligvis `plan-b3-auto-marginalia`.)

- [ ] **Step 2: Trigger workflow manuelt med dry-run**

På GitHub:
1. Gå til https://github.com/fluen1/birkenborg-dev/actions/workflows/auto-marginalia.yml
2. Klik **"Run workflow"**
3. Vælg branch: din feature-branch
4. Sæt `dry_run` til `true`
5. Klik **Run workflow**

ELLER via CLI:
```bash
gh workflow run auto-marginalia.yml --ref <feature-branch> -f dry_run=true
gh run watch
```

- [ ] **Step 3: Verify dry-run output**

```bash
gh run view --log
```

Expected:
- `node scripts/build-marginalia.mjs --dry-run` kørte
- Output: JSON-summary med `filesChanged`, `totalSuggestions`, `perPost`
- Ingen PR åbnet
- Ingen Telegram-notify

- [ ] **Step 4: Merge til main**

Hvis dry-run ser fornuftig ud:

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git checkout main
git pull --rebase origin main
git merge --no-ff <feature-branch> -m "merge: Plan B3 — auto-commit-scanning + PR-flow"
git push origin main
git branch -d <feature-branch>
git push origin --delete <feature-branch>
```

- [ ] **Step 5: (Optional) Trigger live-run for at verificere PR-flow**

```bash
gh workflow run auto-marginalia.yml -f dry_run=false
gh run watch
```

Expected:
- Workflow lykkes
- Hvis der er suggestions: ny PR åbnet på `auto-marginalia/<date>`-branch
- Telegram-DM modtaget
- Hvis ingen suggestions: workflow lykkes med "Ingen ændringer — skipper PR-opening"

---

## Self-Review tjekliste (run efter alle tasks)

- [ ] Spec §4 step 1 (læs alle posts med status:published) → Task 5 ✅
- [ ] Spec §4 step 2 (extract slug + tags + title-keywords, stop-words filtered) → Task 1 ✅
- [ ] Spec §4 step 3 (Query Commits API for begge repos, sidste 30 dage) → Task 2 + Task 5 ✅
- [ ] Spec §4 step 4 (scan commit-message for keyword-overlap) → Task 1 (matchCommit) ✅
- [ ] Spec §4 step 5 (build suggested marginalia entry med ts, text, source, commit_url) → Task 3 ✅
- [ ] Spec §4 step 6 (deduplicer mod eksisterende marginalia på text-equality) → Task 3 ✅
- [ ] Spec §4 step 7 (skriv ændrede posts) → Task 4 ✅
- [ ] Spec §4 step 8 (åbn PR via gh CLI) → Task 7 ✅
- [ ] Spec §4 step 9 (DM Philip via Telegram) → Task 7 ✅
- [ ] Spec §4 heuristik for keyword-match (slug-fragmenter + tags + commit lowercase includes) → Task 1 ✅
- [ ] Spec §4 mindste-krav 1 match (lavt threshold) → Task 1 (`keywords.filter` returnerer alle matches; buildSuggestions kræver minimum 1) ✅
- [ ] Spec §6 Auto-scan tests: keyword-extraction → Task 1, dedup → Task 3, integration → Task 5 ✅
- [ ] Spec §5 PUBLIC_REPO_PAT brugt for cross-repo + PR → Task 7 (workflow env) ✅
- [ ] Type consistency: `Suggestion`-shape `{ ts, text, source, commit_url }` på tværs af tasks 3, 4, 5 ✅
- [ ] Type consistency: `Commit`-shape `{ message, authorDate, htmlUrl }` på tværs af task 2, 3, 5 ✅

---

## Out of scope (mulig Plan B4 senere)

- Smartere match-heuristik (TF-IDF, fuzzy keywords, ignore conventional-commit prefixes when extracting keywords)
- LinkedIn-cross-post når marginalia tilføjes til viral skrift
- Auto-merge af PR hvis kun en bestemt confidence-niveau matches
- Notify-DM med inline preview af suggestions (i stedet for bare PR-URL)
