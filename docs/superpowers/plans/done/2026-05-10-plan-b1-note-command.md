# Plan B1 — `/note <slug> <tekst>` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj Telegram-kommando `/note <slug> <tekst>` til bot-worker der pusher en marginalia-note til en publiceret skrift på `birkenborg-dev`-repoet via GitHub Contents API.

**Architecture:** Ny command-handler i `birkenborg-agents/worker/src/commands/note.ts` der: (1) parser slug + tekst, (2) henter `https://birkenborg.dev/api/_corpus.json` for slug-validering, (3) hvis ikke valid: DM med top-8 slug-suggestions, (4) hvis valid: læser post via `github.ts:readFile()`, parser YAML-frontmatter med `js-yaml`, appender ny entry til `marginalia`-array, re-encoder, og pusher tilbage via `github.ts:writeFile()`. Dispatch fra `index.ts`-router følger eksisterende mønster fra `/help`/`/now`/`/ship`.

**Tech Stack:** TypeScript, Cloudflare Workers, `js-yaml` (ny dep), Vitest pool-workers, eksisterende `github.ts` helpers.

**Spec:** `docs/superpowers/specs/2026-05-10-marginalia-pipeline-design.md` sektion 2.

**Working dir for all tasks:** `C:\Users\birke\Projects\birkenborg-agents`

---

## File Structure

### Skab
- `birkenborg-agents/worker/src/commands/note.ts` — `/note` command-handler (~120 linjer)
- `birkenborg-agents/worker/src/frontmatter.ts` — frontmatter parse/mutate/serialize helpers (~70 linjer)
- `birkenborg-agents/worker/src/corpus.ts` — slug-suggestions fetcher (~30 linjer)
- `birkenborg-agents/worker/tests/frontmatter.test.ts`
- `birkenborg-agents/worker/tests/corpus.test.ts`
- `birkenborg-agents/worker/tests/commands.note.test.ts`

### Modificer
- `birkenborg-agents/worker/package.json` — tilføj `js-yaml` + `@types/js-yaml`
- `birkenborg-agents/worker/src/index.ts` — dispatch `/note`-kommando
- `birkenborg-agents/worker/tests/webhook.test.ts` — én ny integration-test for `/note`-end-to-end via SELF.fetch

---

## Task 1: Tilføj `js-yaml` dependency

**Files:**
- Modify: `birkenborg-agents/worker/package.json`

**Goal:** Bot-worker har brug for et YAML-parse-library. `gray-matter` (brugt i Plan A) har Node-dependencies — vi bruger `js-yaml` der er Worker-kompatibel.

- [ ] **Step 1: Install dependency**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npm install js-yaml
npm install --save-dev @types/js-yaml
```

- [ ] **Step 2: Verify package.json + lock-file updated**

```powershell
Get-Content package.json | Select-String "js-yaml"
```

Expected: `"js-yaml": "^4.1.0"` (eller nyeste) under `dependencies`, og `"@types/js-yaml"` under `devDependencies`.

- [ ] **Step 3: Verify build still works**

```powershell
npx wrangler deploy --dry-run --outdir dist-check 2>&1 | Select-String "Total Upload"
```

(Eller kør test-suite for at bekræfte ingen build-issues.)

```powershell
npx vitest run
```

Expected: alle tests pass.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/package.json worker/package-lock.json
git commit -m "chore(worker): add js-yaml for frontmatter parsing"
```

---

## Task 2: Frontmatter helpers (TDD)

**Files:**
- Create: `worker/src/frontmatter.ts`
- Create: `worker/tests/frontmatter.test.ts`

**Goal:** Pure helpers der parser markdown-content med YAML-frontmatter, append til `marginalia`-array, og serialiserer tilbage.

- [ ] **Step 1: Write failing tests**

Create `worker/tests/frontmatter.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  parseFrontmatter,
  appendMarginalia,
  serializeContent,
  type ParsedContent,
} from "../src/frontmatter";

const SAMPLE_POST = `---
title: Min skrift
slug: min-skrift
publish_at: 2026-05-08
status: published
tags: [jura, kode]
privacy_flag: false
linkedin_url: null
marginalia:
  - ts: "8/5 14:32"
    text: "første note"
    source: manual
---

# Min skrift

Dette er kropsteksten.
`;

const NO_MARGINALIA_POST = `---
title: Anden skrift
slug: anden-skrift
publish_at: 2026-05-09
status: published
tags: []
privacy_flag: false
linkedin_url: null
---

Body.
`;

describe("parseFrontmatter", () => {
  it("parser eksisterende frontmatter med marginalia-array", () => {
    const result = parseFrontmatter(SAMPLE_POST);
    expect(result.data.title).toBe("Min skrift");
    expect(result.data.slug).toBe("min-skrift");
    expect(Array.isArray(result.data.marginalia)).toBe(true);
    expect(result.data.marginalia).toHaveLength(1);
    expect(result.body.trim()).toBe("# Min skrift\n\nDette er kropsteksten.");
  });

  it("parser frontmatter uden marginalia-felt", () => {
    const result = parseFrontmatter(NO_MARGINALIA_POST);
    expect(result.data.title).toBe("Anden skrift");
    expect(result.data.marginalia).toBeUndefined();
  });

  it("kaster fejl hvis content ikke har frontmatter-delimiter", () => {
    expect(() => parseFrontmatter("ingen frontmatter her")).toThrow(/frontmatter/i);
  });
});

describe("appendMarginalia", () => {
  it("appender til eksisterende marginalia-array", () => {
    const parsed = parseFrontmatter(SAMPLE_POST);
    const updated = appendMarginalia(parsed, {
      ts: "10/5 09:00",
      text: "ny note",
      source: "telegram",
    });
    expect(updated.data.marginalia).toHaveLength(2);
    expect(updated.data.marginalia[1].text).toBe("ny note");
  });

  it("opretter marginalia-array hvis det mangler", () => {
    const parsed = parseFrontmatter(NO_MARGINALIA_POST);
    const updated = appendMarginalia(parsed, {
      ts: "10/5",
      text: "første",
      source: "telegram",
    });
    expect(updated.data.marginalia).toHaveLength(1);
    expect(updated.data.marginalia[0].source).toBe("telegram");
  });
});

describe("serializeContent", () => {
  it("round-trip preserves body uændret", () => {
    const parsed = parseFrontmatter(SAMPLE_POST);
    const serialized = serializeContent(parsed);
    const reparsed = parseFrontmatter(serialized);
    expect(reparsed.body.trim()).toBe(parsed.body.trim());
    expect(reparsed.data.title).toBe("Min skrift");
  });

  it("inkluderer ny marginalia efter append+serialize", () => {
    const parsed = parseFrontmatter(NO_MARGINALIA_POST);
    const updated = appendMarginalia(parsed, {
      ts: "10/5",
      text: "telegram-note",
      source: "telegram",
    });
    const serialized = serializeContent(updated);
    expect(serialized).toContain("marginalia:");
    expect(serialized).toContain("telegram-note");
    expect(serialized).toContain("source: telegram");
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/frontmatter.test.ts
```

Expected: FAIL — `Cannot find module '../src/frontmatter'`.

- [ ] **Step 3: Write minimal implementation**

Create `worker/src/frontmatter.ts`:

```typescript
import yaml from "js-yaml";

export interface MarginaliaNote {
  ts: string;
  text: string;
  source: "telegram" | "auto-commit" | "manual";
}

export interface FrontmatterData {
  title?: string;
  slug?: string;
  publish_at?: string | Date;
  status?: string;
  tags?: string[];
  privacy_flag?: boolean;
  linkedin_url?: string | null;
  excerpt?: string;
  marginalia?: MarginaliaNote[];
  [key: string]: unknown;
}

export interface ParsedContent {
  data: FrontmatterData;
  body: string;
}

const DELIMITER = "---";

export function parseFrontmatter(content: string): ParsedContent {
  const lines = content.split("\n");
  if (lines[0] !== DELIMITER) {
    throw new Error("ingen frontmatter-delimiter i starten af filen");
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === DELIMITER) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) {
    throw new Error("manglende afsluttende frontmatter-delimiter");
  }
  const yamlText = lines.slice(1, endIdx).join("\n");
  const data = (yaml.load(yamlText) ?? {}) as FrontmatterData;
  const body = lines.slice(endIdx + 1).join("\n");
  return { data, body };
}

export function appendMarginalia(
  parsed: ParsedContent,
  note: MarginaliaNote,
): ParsedContent {
  const existing = parsed.data.marginalia ?? [];
  return {
    data: { ...parsed.data, marginalia: [...existing, note] },
    body: parsed.body,
  };
}

export function serializeContent(parsed: ParsedContent): string {
  const yamlText = yaml.dump(parsed.data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
  return `${DELIMITER}\n${yamlText}${DELIMITER}\n${parsed.body}`;
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/frontmatter.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/frontmatter.ts worker/tests/frontmatter.test.ts
git commit -m "feat(worker): frontmatter helpers — parse/append/serialize"
```

---

## Task 3: Corpus-fetcher for slug-suggestions (TDD)

**Files:**
- Create: `worker/src/corpus.ts`
- Create: `worker/tests/corpus.test.ts`

**Goal:** Pure helper der fetcher `https://birkenborg.dev/api/_corpus.json` og returnerer top-8 senest publicerede slugs (sorteret desc efter `publish_at`).

- [ ] **Step 1: Write failing tests**

Create `worker/tests/corpus.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRecentSlugs, type CorpusEntry } from "../src/corpus";

describe("fetchRecentSlugs", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("henter _corpus.json og returnerer top-8 slugs sortet desc efter publish_at", async () => {
    const corpus: CorpusEntry[] = [
      { slug: "old", title: "Old", publish_at: "2026-01-01T00:00:00Z" },
      { slug: "new", title: "New", publish_at: "2026-05-10T00:00:00Z" },
      { slug: "mid", title: "Mid", publish_at: "2026-03-15T00:00:00Z" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(corpus), { status: 200 }),
    );

    const slugs = await fetchRecentSlugs();
    expect(slugs).toEqual(["new", "mid", "old"]);
  });

  it("limit til 8 hvis flere end 8 posts", async () => {
    const corpus: CorpusEntry[] = Array.from({ length: 15 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      publish_at: `2026-${String(i + 1).padStart(2, "0")}-01T00:00:00Z`,
    }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(corpus), { status: 200 }),
    );

    const slugs = await fetchRecentSlugs();
    expect(slugs).toHaveLength(8);
    expect(slugs[0]).toBe("post-14");
  });

  it("returnerer tom array hvis fetch fejler", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not found", { status: 404 }),
    );
    const slugs = await fetchRecentSlugs();
    expect(slugs).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/corpus.test.ts
```

Expected: FAIL — `Cannot find module`.

- [ ] **Step 3: Write minimal implementation**

Create `worker/src/corpus.ts`:

```typescript
const CORPUS_URL = "https://birkenborg.dev/api/_corpus.json";
const MAX_SUGGESTIONS = 8;

export interface CorpusEntry {
  slug: string;
  title: string;
  publish_at: string;
}

export async function fetchRecentSlugs(): Promise<string[]> {
  try {
    const res = await fetch(CORPUS_URL);
    if (!res.ok) return [];
    const corpus = (await res.json()) as CorpusEntry[];
    return corpus
      .slice()
      .sort((a, b) => b.publish_at.localeCompare(a.publish_at))
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => entry.slug);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/corpus.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/corpus.ts worker/tests/corpus.test.ts
git commit -m "feat(worker): corpus.fetchRecentSlugs for /note slug-suggestions"
```

---

## Task 4: `/note`-command handler (TDD)

**Files:**
- Create: `worker/src/commands/note.ts`
- Create: `worker/tests/commands.note.test.ts`

**Goal:** Handler der orchestrerer flowet: parser args, validerer slug, læser post, appender marginalia, pusher tilbage, DM'er Philip.

- [ ] **Step 1: Write failing test for argument-parsing**

Create `worker/tests/commands.note.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { env as cfEnv } from "cloudflare:test";
import { handleNote, parseNoteArgs } from "../src/commands/note";

describe("parseNoteArgs", () => {
  it("splitter slug og tekst på første whitespace", () => {
    const result = parseNoteArgs("ma-agent-paragraf-30 jeg har lukket sagen");
    expect(result).toEqual({
      slug: "ma-agent-paragraf-30",
      text: "jeg har lukket sagen",
    });
  });

  it("returnerer null hvis kun slug og ingen tekst", () => {
    expect(parseNoteArgs("ma-agent-paragraf-30")).toBeNull();
  });

  it("returnerer null hvis tom input", () => {
    expect(parseNoteArgs("")).toBeNull();
    expect(parseNoteArgs("   ")).toBeNull();
  });

  it("trimmer whitespace omkring tekst", () => {
    const result = parseNoteArgs("foo   tekst med spaces  ");
    expect(result?.slug).toBe("foo");
    expect(result?.text).toBe("tekst med spaces");
  });
});

describe("handleNote", () => {
  beforeEach(() => vi.restoreAllMocks());

  function makeEnv() {
    return {
      BOT_STATE: cfEnv.BOT_STATE,
      TELEGRAM_BOT_TOKEN: "tg-test",
      PUBLIC_REPO_PAT: "ghp-test",
    };
  }

  it("DM'er fejlbesked + slug-forslag når slug ikke findes", async () => {
    const sentDMs: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const u = url.toString();
      if (u.includes("birkenborg.dev/api/_corpus.json")) {
        return new Response(JSON.stringify([
          { slug: "ma-agent-paragraf-30", title: "M&A", publish_at: "2026-05-08T00:00:00Z" },
          { slug: "jurist-bygger-dokumentation", title: "Doks", publish_at: "2026-05-05T00:00:00Z" },
        ]), { status: 200 });
      }
      if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/contents/")) {
        return new Response("not found", { status: 404 });
      }
      if (u.includes("api.telegram.org") && u.includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        sentDMs.push(body.text);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("?", { status: 404 });
    });

    await handleNote(makeEnv() as never, 12345, "ukendt-slug en note");

    expect(sentDMs).toHaveLength(1);
    expect(sentDMs[0]).toMatch(/ikke fundet/i);
    expect(sentDMs[0]).toContain("ma-agent-paragraf-30");
    expect(sentDMs[0]).toContain("jurist-bygger-dokumentation");
  });

  it("appender marginalia og pusher til GitHub når slug findes", async () => {
    let putBody: { content?: string; message?: string; sha?: string } | null = null;
    const sentDMs: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const u = url.toString();
      if (u.includes("birkenborg.dev/api/_corpus.json")) {
        return new Response(JSON.stringify([
          { slug: "ma-agent-paragraf-30", title: "M&A", publish_at: "2026-05-08T00:00:00Z" },
        ]), { status: 200 });
      }
      if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/contents/content/posts/ma-agent-paragraf-30.md")) {
        if ((init as RequestInit | undefined)?.method === "PUT") {
          putBody = JSON.parse((init as RequestInit).body as string);
          return new Response(JSON.stringify({
            commit: { html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc" },
          }), { status: 201 });
        }
        const original = `---
title: "M&A"
slug: ma-agent-paragraf-30
publish_at: 2026-05-08
status: published
tags: []
privacy_flag: false
linkedin_url: null
---

Body.
`;
        return new Response(JSON.stringify({
          content: btoa(unescape(encodeURIComponent(original))),
          sha: "old-sha",
          encoding: "base64",
        }), { status: 200 });
      }
      if (u.includes("api.telegram.org") && u.includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        sentDMs.push(body.text);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("?", { status: 404 });
    });

    await handleNote(makeEnv() as never, 12345, "ma-agent-paragraf-30 har lukket sagen — grænse-værdi-bug");

    expect(putBody).not.toBeNull();
    expect(putBody!.sha).toBe("old-sha");
    expect(putBody!.message).toContain("ma-agent-paragraf-30");
    const decoded = decodeURIComponent(escape(atob(putBody!.content!.replace(/\s/g, ""))));
    expect(decoded).toContain("marginalia:");
    expect(decoded).toContain("har lukket sagen");
    expect(decoded).toContain("source: telegram");
    expect(sentDMs[0]).toMatch(/note tilf.*?jet/i);
    expect(sentDMs[0]).toContain("ma-agent-paragraf-30");
  });

  it("DM'er fejl ved tom tekst", async () => {
    const sentDMs: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        sentDMs.push(body.text);
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleNote(makeEnv() as never, 12345, "ma-agent-paragraf-30");

    expect(sentDMs[0]).toMatch(/tom note|skriv .* med faktisk indhold/i);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.note.test.ts
```

Expected: FAIL — `Cannot find module '../src/commands/note'`.

- [ ] **Step 3: Write minimal implementation**

Create `worker/src/commands/note.ts`:

```typescript
import { sendDM } from "../telegram";
import { readFile, writeFile } from "../github";
import { fetchRecentSlugs } from "../corpus";
import { parseFrontmatter, appendMarginalia, serializeContent } from "../frontmatter";

const REPO = "fluen1/birkenborg-dev";

export interface NoteEnv {
  TELEGRAM_BOT_TOKEN: string;
  PUBLIC_REPO_PAT: string;
}

export interface ParsedNoteArgs {
  slug: string;
  text: string;
}

export function parseNoteArgs(input: string): ParsedNoteArgs | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const firstSpace = trimmed.search(/\s/);
  if (firstSpace === -1) return null;
  const slug = trimmed.slice(0, firstSpace);
  const text = trimmed.slice(firstSpace + 1).trim();
  if (!slug || !text) return null;
  return { slug, text };
}

function formatTimestamp(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m} ${hh}:${mm}`;
}

export async function handleNote(
  env: NoteEnv,
  chatId: number,
  args: string,
): Promise<void> {
  const parsed = parseNoteArgs(args);
  if (!parsed) {
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      "Tom note. Skriv `/note <slug> <tekst>` med faktisk indhold.",
    );
    return;
  }

  const path = `content/posts/${parsed.slug}.md`;
  const file = await readFile(env.PUBLIC_REPO_PAT, REPO, path);

  if (!file) {
    const slugs = await fetchRecentSlugs();
    const list = slugs.length
      ? slugs.map((s) => `  • ${s}`).join("\n")
      : "  (ingen slugs fundet)";
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `Slug "${parsed.slug}" ikke fundet.\n\nSenere skrifter:\n${list}`,
    );
    return;
  }

  let updatedContent: string;
  try {
    const parsedContent = parseFrontmatter(file.text);
    const withNote = appendMarginalia(parsedContent, {
      ts: formatTimestamp(new Date()),
      text: parsed.text,
      source: "telegram",
    });
    updatedContent = serializeContent(withNote);
  } catch (e) {
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `Frontmatter-parse fejlede for ${parsed.slug}: ${(e as Error).message}`,
    );
    return;
  }

  const commitMsg = `note: ${parsed.slug} — ${parsed.text.slice(0, 40)}`;

  try {
    await writeFile(env.PUBLIC_REPO_PAT, REPO, path, updatedContent, file.sha, commitMsg);
  } catch (e) {
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `Push fejlede: ${(e as Error).message}`,
    );
    return;
  }

  await sendDM(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `✅ Note tilføjet til ${parsed.slug}.\n\nLive om ~30s: https://birkenborg.dev/skrifter/${parsed.slug}`,
  );
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.note.test.ts
```

Expected: 7 tests PASS (4 parseNoteArgs + 3 handleNote).

- [ ] **Step 5: Verify full worker test suite**

```powershell
npx vitest run
```

Expected: alle tests pass (no regressions).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/commands/note.ts worker/tests/commands.note.test.ts
git commit -m "feat(worker): /note <slug> <tekst> command-handler"
```

---

## Task 5: Wire `/note` i webhook-dispatcher

**Files:**
- Modify: `worker/src/index.ts`
- Modify: `worker/tests/webhook.test.ts`

**Goal:** Webhook-dispatcher genkender `/note` og delegerer til `handleNote`.

- [ ] **Step 1: Write failing integration test**

Modify `worker/tests/webhook.test.ts` — tilføj nyt describe-block efter eksisterende:

```typescript
describe("POST /webhook — /note command", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatcher /note til handleNote (verificeret via Telegram-API kald)", async () => {
    let dmSent: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const u = url.toString();
      if (u.includes("api.telegram.org") && u.includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmSent = body.text;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (u.includes("birkenborg.dev/api/_corpus.json")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (u.includes("api.github.com")) {
        return new Response("not found", { status: 404 });
      }
      return new Response("?", { status: 404 });
    });

    await setLastUpdateId(env.BOT_STATE, 0);
    const ctx = createExecutionContext();
    const req = makeRequest({
      update_id: 12345,
      message: { date: 1700000000, text: "/note ikke-eksisterer en note", chat: { id: 42 } },
    });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(200);
    await waitOnExecutionContext(ctx);

    expect(dmSent).not.toBeNull();
    expect(dmSent).toMatch(/ikke fundet/i);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/webhook.test.ts -t "/note command"
```

Expected: FAIL — `/note` matches generic command-fallback "Forstår ikke. /help" (eller routes til inbox), så DM matcher ikke `/ikke fundet/`.

- [ ] **Step 3: Add /note dispatch i index.ts**

Modify `worker/src/index.ts` — tilføj en `if`-blok i `dispatch`-funktionen, EFTER `/now`-handler-blokken og FØR news-routing:

```typescript
  if (/^\/note\b/i.test(trimmed)) {
    const { handleNote } = await import("./commands/note");
    const args = trimmed.replace(/^\/note\s*/i, "");
    await handleNote(env, chatId, args);
    return;
  }
```

(Dette mønster matcher hvordan `/help`/`/status`/`/ship`/`/now` allerede er dispatchet — same shape.)

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/webhook.test.ts
```

Expected: alle webhook tests PASS, inkl. nyt `/note`-test.

- [ ] **Step 5: Verify full worker suite**

```powershell
npx vitest run
```

Expected: alle tests pass.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/index.ts worker/tests/webhook.test.ts
git commit -m "feat(worker): dispatch /note via webhook router"
```

---

## Task 6: Update `/help` command + deploy + smoke test

**Files:**
- Modify: `worker/src/commands/help.ts`

**Goal:** Help-teksten dokumenterer den nye `/note`-kommando. Plus deploy + manuel smoke test.

- [ ] **Step 1: Update help-tekst**

Modify `worker/src/commands/help.ts`:

```typescript
import { sendDM } from "../telegram";

export const HELP_TEXT =
  "Sådan kan du tale til mig:\n\n" +
  "/status        — hvor langt er vi?\n" +
  "/ship <tekst>  — sæt det her på dit CV\n" +
  "/now <tekst>   — opdater hvad du er optaget af\n" +
  "/note <slug> <tekst> — tilføj marginalia-note til en skrift\n" +
  "STOP           — aflys morgendagens post\n" +
  "YES            — bekræft en privacy-flagged post\n\n" +
  "Eller bare skriv en tanke. Det ender som inspiration til søndagens drafts.";

export async function handleHelp(botToken: string, chatId: number): Promise<void> {
  await sendDM(botToken, chatId, HELP_TEXT);
}
```

- [ ] **Step 2: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run
```

Expected: alle tests pass.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/commands/help.ts
git commit -m "docs(worker): /note dokumenteret i /help-output"
```

- [ ] **Step 4: Push branch til main**

```bash
git push origin main
```

CI auto-deployer bot-worker (per Plan A's token-fix).

- [ ] **Step 5: Smoke test live**

Send i Telegram til `@birkenborg_agents_bot`:

```
/note ikke-eksisterer-skrift en test-note
```

Expected: bot DM'er fejlbesked med "Slug 'ikke-eksisterer-skrift' ikke fundet" + liste af senere skrifter.

Send dernæst:

```
/note <eksisterende-slug> en rigtig test-note
```

(brug en slug fra fejlbeskedens forslag-liste)

Expected: bot DM'er ✅ "Note tilføjet til <slug>". Vent 30s og refresh `https://birkenborg.dev/skrifter/<slug>` — den nye marginalia-note skulle dukke op i højre margin.

Hvis OK: cleanup test-noten manuelt ved at editere `content/posts/<slug>.md` og fjerne den (eller lad den stå hvis testen er meningsfuld).

---

## Self-Review tjekliste

- [ ] Spec §2 step 1 (parser slug + tekst) → Task 4 step 3 ✅
- [ ] Spec §2 step 2 (split på første whitespace) → Task 4 step 1 (parseNoteArgs.it) ✅
- [ ] Spec §2 step 3 (læs fra GitHub Contents API) → Task 4 step 3 (readFile call) ✅
- [ ] Spec §2 step 4 (slug-suggestions fra _corpus.json) → Task 3 + Task 4 step 3 ✅
- [ ] Spec §2 step 5 (parse frontmatter med js-yaml) → Task 1 + Task 2 ✅
- [ ] Spec §2 step 6 (append til marginalia-array) → Task 2 (appendMarginalia) ✅
- [ ] Spec §2 step 7 (re-encode frontmatter+body) → Task 2 (serializeContent) ✅
- [ ] Spec §2 step 8 (push tilbage med commit-message) → Task 4 step 3 (writeFile call) ✅
- [ ] Spec §2 step 9 (DM Philip succes-besked) → Task 4 step 3 (sendDM ved success) ✅
- [ ] Spec §2 fejlhåndtering: slug ikke fundet → Task 4 step 1 + 3 ✅
- [ ] Spec §2 fejlhåndtering: tom tekst → Task 4 step 1 + 3 ✅
- [ ] Spec §6 unit tests for command-parser → Task 4 step 1 ✅
- [ ] Spec §6 integration test (mocked GitHub Contents API) → Task 4 step 1 + Task 5 step 1 ✅
- [ ] Type consistency: `MarginaliaNote`-shape identisk i Task 2 (frontmatter.ts) og Task 4 (commands/note.ts importerer den) ✅
- [ ] Type consistency: `NoteEnv`-felter (TELEGRAM_BOT_TOKEN, PUBLIC_REPO_PAT) matcher eksisterende `Env` i index.ts ✅

---

## Out of scope (Plan B2 + B3)

**Plan B2 — `/highlight` family:**
- `/highlight <tekst>`-kommando i bot-worker
- `/highlights` lister aktive highlights
- `/unhighlight <num>` + `/unhighlight all`
- Internal endpoint `bot.birkenborg.dev/internal/highlights`
- Site-worker buildEvents merger highlights med commits/skrifter

**Plan B3 — Auto-commit-scanning:**
- `birkenborg-dev/scripts/build-marginalia.mjs`
- `birkenborg-dev/.github/workflows/auto-marginalia.yml` cron
- Cross-repo commit-scanning med PUBLIC_REPO_PAT
- PR-flow med multi-file edits
