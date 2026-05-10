# Plan B2 — `/highlight` family + activity-feed integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telegram-kommando-familie `/highlight <tekst>` + `/highlights` + `/unhighlight <num>` + `/unhighlight all` der pinner manuelle events ekstra prominent i `birkenborg.dev`-activity-feed med ✦-ikon. Persisteret i KV (permanent indtil eksplicit fjernet).

**Architecture:** Bot-worker tilføjer 3 nye KV-helpers + 3 nye command-handlers + 1 internal endpoint (`GET /internal/highlights`). Site-worker `buildEvents` udvides til at fetche highlights fra bot-worker via internal-API og merger dem som `type: 'highlight'` events der altid placeres øverst i feed. ActivityFeed-komponent renderer highlight-rows med distinct ✦-ikon i clay-color (i stedet for opacity 0.5 grå).

**Tech Stack:** TypeScript, Cloudflare Workers + KV, Vitest pool-workers, Astro (site-side).

**Spec:** `docs/superpowers/specs/2026-05-10-marginalia-pipeline-design.md` sektion 3.

**Touches both repos:**
- `C:\Users\birke\Projects\birkenborg-agents` (bot-worker — Tasks 1-5)
- `C:\Users\birke\Projects\birkenborg-dev` (site-worker + ActivityFeed — Tasks 6-7)

---

## File Structure

### `birkenborg-agents` (bot-worker)

**Skab:**
- `worker/src/commands/highlight.ts` — handlers for `/highlight`, `/highlights`, `/unhighlight`
- `worker/tests/commands.highlight.test.ts`

**Modificer:**
- `worker/src/kv.ts` — tilføj `saveHighlight`, `listHighlights`, `deleteHighlight`, `clearAllHighlights`
- `worker/tests/kv.test.ts` — tests for highlight-helpers
- `worker/src/internal.ts` — `GET /internal/highlights`-endpoint
- `worker/tests/internal.test.ts` — test for nyt endpoint
- `worker/src/index.ts` — dispatch `/highlight`, `/highlights`, `/unhighlight`
- `worker/tests/webhook.test.ts` — integration-test for nye dispatch
- `worker/src/commands/help.ts` — dokumentér nye kommandoer

### `birkenborg-dev` (site-worker + UI)

**Modificer:**
- `worker/index.ts` — `buildEvents` fetcher highlights fra bot-worker, merger som `type: 'highlight'` events, dedup mod commits
- `worker/activity.test.ts` — test for highlights-merging + dedup
- `site/src/components/ActivityFeed.astro` — render highlight-rows med ✦-styling

---

## Task 1: KV-helpers for highlights (TDD)

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/src/kv.ts`
- Modify: `worker/tests/kv.test.ts`

**Goal:** Pure KV-helpers der gemmer/lister/sletter highlights. KV-key-format: `highlight:<unix-ts>` → JSON `{ text, ts }`. Permanent — ingen TTL.

- [ ] **Step 1: Skriv failing tests**

Modify `worker/tests/kv.test.ts` — tilføj nye describe-blocks i slutningen af filen (efter eksisterende):

```typescript
import { saveHighlight, listHighlights, deleteHighlight, clearAllHighlights } from "../src/kv";

describe("kv: highlights", () => {
  beforeEach(async () => {
    // Cleanup any leftover highlights from earlier tests
    await clearAllHighlights(env.BOT_STATE);
  });

  it("gemmer og lister highlights sortet desc efter ts", async () => {
    await saveHighlight(env.BOT_STATE, { ts: 1000, text: "ældre" });
    await saveHighlight(env.BOT_STATE, { ts: 2000, text: "nyere" });
    const highlights = await listHighlights(env.BOT_STATE);
    expect(highlights).toHaveLength(2);
    expect(highlights[0]).toEqual({ ts: 2000, text: "nyere" });
    expect(highlights[1]).toEqual({ ts: 1000, text: "ældre" });
  });

  it("sletter en specifik highlight ud fra ts", async () => {
    await saveHighlight(env.BOT_STATE, { ts: 1000, text: "behold" });
    await saveHighlight(env.BOT_STATE, { ts: 2000, text: "slet" });
    await deleteHighlight(env.BOT_STATE, 2000);
    const highlights = await listHighlights(env.BOT_STATE);
    expect(highlights).toEqual([{ ts: 1000, text: "behold" }]);
  });

  it("clearAllHighlights fjerner alle", async () => {
    await saveHighlight(env.BOT_STATE, { ts: 1, text: "a" });
    await saveHighlight(env.BOT_STATE, { ts: 2, text: "b" });
    await clearAllHighlights(env.BOT_STATE);
    expect(await listHighlights(env.BOT_STATE)).toEqual([]);
  });

  it("listHighlights returnerer tom array når ingen findes", async () => {
    expect(await listHighlights(env.BOT_STATE)).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/kv.test.ts -t "kv: highlights"
```

Expected: FAIL — `saveHighlight is not exported`.

- [ ] **Step 3: Skriv minimal implementation**

Modify `worker/src/kv.ts` — tilføj nederst i filen:

```typescript
export interface Highlight {
  ts: number;
  text: string;
}

const HIGHLIGHT_PREFIX = "highlight:";

export async function saveHighlight(kv: KVNamespace, highlight: Highlight): Promise<void> {
  const key = `${HIGHLIGHT_PREFIX}${String(highlight.ts).padStart(15, "0")}`;
  await kv.put(key, JSON.stringify(highlight));
}

export async function listHighlights(kv: KVNamespace): Promise<Highlight[]> {
  const list = await kv.list({ prefix: HIGHLIGHT_PREFIX });
  if (list.list_complete === false) {
    throw new Error("highlights er truncated (>1000 entries) — pagination ikke implementeret");
  }
  const results: Highlight[] = [];
  for (const k of list.keys) {
    const raw = await kv.get(k.name);
    if (!raw) continue;
    results.push(JSON.parse(raw) as Highlight);
  }
  return results.sort((a, b) => b.ts - a.ts);
}

export async function deleteHighlight(kv: KVNamespace, ts: number): Promise<void> {
  const key = `${HIGHLIGHT_PREFIX}${String(ts).padStart(15, "0")}`;
  await kv.delete(key);
}

export async function clearAllHighlights(kv: KVNamespace): Promise<void> {
  const list = await kv.list({ prefix: HIGHLIGHT_PREFIX });
  await Promise.all(list.keys.map((k) => kv.delete(k.name)));
}
```

(Note: `padStart(15)` på ts giver lexikographisk sortering på tværs af KV-keys, men selve listHighlights-resultatet sorteres alligevel desc — padding er bare for konsistens.)

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/kv.test.ts
```

Expected: alle kv-tests pass (eksisterende + 4 nye highlights-tests).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/kv.ts worker/tests/kv.test.ts
git commit -m "feat(worker): KV-helpers for highlights — save/list/delete/clearAll"
```

---

## Task 2: `/highlight <tekst>` command-handler (TDD)

**Repo:** `birkenborg-agents`

**Files:**
- Create: `worker/src/commands/highlight.ts`
- Create: `worker/tests/commands.highlight.test.ts`

**Goal:** Handler der modtager `/highlight <tekst>`-args, gemmer i KV med current ts, DM'er Philip success-besked.

- [ ] **Step 1: Skriv failing test**

Create `worker/tests/commands.highlight.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { env as cfEnv } from "cloudflare:test";
import { handleHighlight } from "../src/commands/highlight";
import { listHighlights, clearAllHighlights } from "../src/kv";

function makeEnv() {
  return {
    BOT_STATE: cfEnv.BOT_STATE,
    TELEGRAM_BOT_TOKEN: "tg-test",
  };
}

describe("handleHighlight", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await clearAllHighlights(cfEnv.BOT_STATE);
  });

  it("gemmer highlight i KV og DM'er bekræftelse", async () => {
    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleHighlight(makeEnv() as never, 12345, "Multi-agent compliance live på første kunde");

    const stored = await listHighlights(cfEnv.BOT_STATE);
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("Multi-agent compliance live på første kunde");
    expect(stored[0].ts).toBeGreaterThan(0);
    expect(dmText).toMatch(/✦.*Pinned/i);
    expect(dmText).toContain("Multi-agent compliance");
  });

  it("DM'er fejl ved tom tekst", async () => {
    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleHighlight(makeEnv() as never, 12345, "");

    const stored = await listHighlights(cfEnv.BOT_STATE);
    expect(stored).toHaveLength(0);
    expect(dmText).toMatch(/tom|skriv .* med faktisk indhold/i);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.highlight.test.ts
```

Expected: FAIL — `Cannot find module '../src/commands/highlight'`.

- [ ] **Step 3: Skriv minimal implementation**

Create `worker/src/commands/highlight.ts`:

```typescript
import { sendDM } from "../telegram";
import { saveHighlight, listHighlights, deleteHighlight, clearAllHighlights } from "../kv";

export interface HighlightEnv {
  BOT_STATE: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
}

export async function handleHighlight(
  env: HighlightEnv,
  chatId: number,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      "Tom highlight. Skriv `/highlight <tekst>` med faktisk indhold.",
    );
    return;
  }

  const ts = Math.floor(Date.now() / 1000);
  await saveHighlight(env.BOT_STATE, { ts, text: trimmed });
  await sendDM(env.TELEGRAM_BOT_TOKEN, chatId, `✦ Pinned: ${trimmed}`);
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.highlight.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/commands/highlight.ts worker/tests/commands.highlight.test.ts
git commit -m "feat(worker): /highlight <tekst> command-handler"
```

---

## Task 3: `/highlights` (list) command (TDD)

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/src/commands/highlight.ts`
- Modify: `worker/tests/commands.highlight.test.ts`

**Goal:** `handleHighlightsList` viser nummereret liste af aktive highlights, sorteret nyeste først, med relativ tid (i dag, i går, dato).

- [ ] **Step 1: Skriv failing test**

Modify `worker/tests/commands.highlight.test.ts` — tilføj nyt describe-block efter eksisterende:

```typescript
import { handleHighlightsList } from "../src/commands/highlight";
import { saveHighlight } from "../src/kv";

describe("handleHighlightsList", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await clearAllHighlights(cfEnv.BOT_STATE);
  });

  it("lister aktive highlights nummereret med ✦-prefix", async () => {
    const now = Math.floor(Date.now() / 1000);
    await saveHighlight(cfEnv.BOT_STATE, { ts: now - 100, text: "nyeste" });
    await saveHighlight(cfEnv.BOT_STATE, { ts: now - 86400, text: "i går" });

    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleHighlightsList(makeEnv() as never, 12345);

    expect(dmText).toContain("✦ Aktive highlights:");
    expect(dmText).toContain("1.");
    expect(dmText).toContain("nyeste");
    expect(dmText).toContain("2.");
    expect(dmText).toContain("i går");
    // Nyeste først
    expect(dmText!.indexOf("nyeste")).toBeLessThan(dmText!.indexOf("i går"));
  });

  it("DM'er 'Ingen aktive' når listen er tom", async () => {
    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleHighlightsList(makeEnv() as never, 12345);

    expect(dmText).toMatch(/ingen aktive/i);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.highlight.test.ts -t "handleHighlightsList"
```

Expected: FAIL — `handleHighlightsList is not exported`.

- [ ] **Step 3: Tilføj implementation**

Modify `worker/src/commands/highlight.ts` — tilføj nederst i filen:

```typescript
function formatRelativeTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 3600) return "lige nu";
  if (diff < 86400) return "i dag";
  if (diff < 2 * 86400) return "i går";
  const d = new Date(ts * 1000);
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${d.getDate()}. ${months[d.getMonth()]}`;
}

export async function handleHighlightsList(
  env: HighlightEnv,
  chatId: number,
): Promise<void> {
  const highlights = await listHighlights(env.BOT_STATE);
  if (highlights.length === 0) {
    await sendDM(env.TELEGRAM_BOT_TOKEN, chatId, "Ingen aktive highlights.");
    return;
  }
  const lines = highlights.map((h, i) =>
    `${i + 1}. (${formatRelativeTime(h.ts)}) ${h.text}`,
  );
  const msg = `✦ Aktive highlights:\n\n${lines.join("\n")}`;
  await sendDM(env.TELEGRAM_BOT_TOKEN, chatId, msg);
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.highlight.test.ts
```

Expected: alle 4 tests PASS (2 + 2 nye).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/commands/highlight.ts worker/tests/commands.highlight.test.ts
git commit -m "feat(worker): /highlights list-kommando med relativ tid"
```

---

## Task 4: `/unhighlight <num>` + `/unhighlight all` (TDD)

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/src/commands/highlight.ts`
- Modify: `worker/tests/commands.highlight.test.ts`

**Goal:** `handleUnhighlight` accepterer enten nummer (1-baseret index i listHighlights-rækkefølge) eller `all`. Sletter en specifik eller alle.

- [ ] **Step 1: Skriv failing test**

Modify `worker/tests/commands.highlight.test.ts` — tilføj nyt describe-block:

```typescript
import { handleUnhighlight } from "../src/commands/highlight";

describe("handleUnhighlight", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await clearAllHighlights(cfEnv.BOT_STATE);
  });

  it("sletter specifik highlight ved nummer (1-baseret)", async () => {
    const now = Math.floor(Date.now() / 1000);
    await saveHighlight(cfEnv.BOT_STATE, { ts: now - 100, text: "nyeste" });
    await saveHighlight(cfEnv.BOT_STATE, { ts: now - 200, text: "ældre" });

    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleUnhighlight(makeEnv() as never, 12345, "1");

    const remaining = await listHighlights(cfEnv.BOT_STATE);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].text).toBe("ældre");
    expect(dmText).toMatch(/✗.*Fjernet/i);
    expect(dmText).toContain("nyeste");
  });

  it("sletter alle highlights ved 'all'", async () => {
    const now = Math.floor(Date.now() / 1000);
    await saveHighlight(cfEnv.BOT_STATE, { ts: now, text: "a" });
    await saveHighlight(cfEnv.BOT_STATE, { ts: now - 1, text: "b" });

    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleUnhighlight(makeEnv() as never, 12345, "all");

    expect(await listHighlights(cfEnv.BOT_STATE)).toEqual([]);
    expect(dmText).toMatch(/alle.*fjernet|cleared/i);
  });

  it("DM'er fejl ved ugyldigt nummer", async () => {
    const now = Math.floor(Date.now() / 1000);
    await saveHighlight(cfEnv.BOT_STATE, { ts: now, text: "kun én" });

    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleUnhighlight(makeEnv() as never, 12345, "5");

    expect(dmText).toMatch(/ugyldigt|out of range|nummer/i);
    expect(await listHighlights(cfEnv.BOT_STATE)).toHaveLength(1);
  });

  it("DM'er hjælp ved tom argument", async () => {
    let dmText: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmText = body.text;
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await handleUnhighlight(makeEnv() as never, 12345, "");

    expect(dmText).toMatch(/skriv .* eller/i);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.highlight.test.ts -t "handleUnhighlight"
```

Expected: FAIL — `handleUnhighlight is not exported`.

- [ ] **Step 3: Tilføj implementation**

Modify `worker/src/commands/highlight.ts` — tilføj nederst:

```typescript
export async function handleUnhighlight(
  env: HighlightEnv,
  chatId: number,
  arg: string,
): Promise<void> {
  const trimmed = arg.trim().toLowerCase();
  if (!trimmed) {
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      "Skriv `/unhighlight <num>` for at fjerne én, eller `/unhighlight all` for alle.",
    );
    return;
  }

  if (trimmed === "all") {
    await clearAllHighlights(env.BOT_STATE);
    await sendDM(env.TELEGRAM_BOT_TOKEN, chatId, "✗ Alle highlights fjernet.");
    return;
  }

  const num = parseInt(trimmed, 10);
  if (Number.isNaN(num) || num < 1) {
    await sendDM(env.TELEGRAM_BOT_TOKEN, chatId, "Ugyldigt nummer. Brug `/highlights` for at se listen.");
    return;
  }

  const highlights = await listHighlights(env.BOT_STATE);
  if (num > highlights.length) {
    await sendDM(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `Ugyldigt nummer — der er kun ${highlights.length} aktiv${highlights.length === 1 ? "" : "e"}.`,
    );
    return;
  }

  const target = highlights[num - 1];
  await deleteHighlight(env.BOT_STATE, target.ts);
  await sendDM(env.TELEGRAM_BOT_TOKEN, chatId, `✗ Fjernet: ${target.text}`);
}
```

- [ ] **Step 4: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/commands.highlight.test.ts
```

Expected: alle 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/commands/highlight.ts worker/tests/commands.highlight.test.ts
git commit -m "feat(worker): /unhighlight <num> + /unhighlight all"
```

---

## Task 5: Internal endpoint `GET /internal/highlights` + dispatch + help (TDD)

**Repo:** `birkenborg-agents`

**Files:**
- Modify: `worker/src/internal.ts`
- Modify: `worker/tests/internal.test.ts`
- Modify: `worker/src/index.ts` (dispatch)
- Modify: `worker/tests/webhook.test.ts` (integration test)
- Modify: `worker/src/commands/help.ts`

**Goal:** Eksponer highlights til site-worker via internal-API. Plus wire dispatch så `/highlight`, `/highlights`, `/unhighlight` ruter til handlers. Plus dokumentér i `/help`.

- [ ] **Step 1: Skriv failing tests for internal endpoint**

Modify `worker/tests/internal.test.ts` — tilføj nyt describe-block i slutningen:

```typescript
import { saveHighlight as saveH, clearAllHighlights as clearH } from "../src/kv";

describe("GET /internal/highlights", () => {
  beforeEach(async () => {
    await clearH(env.BOT_STATE);
  });

  it("returnerer highlights-array sorteret desc", async () => {
    await saveH(env.BOT_STATE, { ts: 100, text: "ældre" });
    await saveH(env.BOT_STATE, { ts: 200, text: "nyere" });

    const res = await SELF.fetch("https://bot.birkenborg.dev/internal/highlights", {
      headers: { Authorization: VALID },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { highlights: Array<{ ts: number; text: string }> };
    expect(data.highlights).toEqual([
      { ts: 200, text: "nyere" },
      { ts: 100, text: "ældre" },
    ]);
  });

  it("returnerer 401 uden Bearer-token", async () => {
    const res = await SELF.fetch("https://bot.birkenborg.dev/internal/highlights");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/internal.test.ts -t "highlights"
```

Expected: FAIL — endpoint returnerer 404.

- [ ] **Step 3: Tilføj endpoint i internal.ts**

Modify `worker/src/internal.ts` — find rækken `if (path.startsWith("/internal/preview/")` (omkring linje 72). Tilføj NYT block lige FØR den:

```typescript
  if (path === "/internal/highlights" && req.method === "GET") {
    const { listHighlights } = await import("./kv");
    const highlights = await listHighlights(env.BOT_STATE);
    return Response.json({ highlights });
  }
```

- [ ] **Step 4: Verify endpoint GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/internal.test.ts
```

Expected: alle internal-tests PASS.

- [ ] **Step 5: Skriv failing webhook-integration test for /highlight dispatch**

Modify `worker/tests/webhook.test.ts` — tilføj nyt describe-block i slutningen:

```typescript
describe("POST /webhook — /highlight family", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatcher /highlight til handleHighlight", async () => {
    let dmSent: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmSent = body.text;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("?", { status: 404 });
    });

    await setLastUpdateId(env.BOT_STATE, 0);
    const ctx = createExecutionContext();
    const req = makeRequest({
      update_id: 50001,
      message: { date: 1700000000, text: "/highlight Multi-agent compliance live", chat: { id: 42 } },
    });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(200);
    await waitOnExecutionContext(ctx);

    expect(dmSent).toMatch(/✦.*Pinned/i);
    expect(dmSent).toContain("Multi-agent compliance live");
  });

  it("dispatcher /highlights (plural) til handleHighlightsList", async () => {
    let dmSent: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmSent = body.text;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("?", { status: 404 });
    });

    await setLastUpdateId(env.BOT_STATE, 0);
    const ctx = createExecutionContext();
    const req = makeRequest({
      update_id: 50002,
      message: { date: 1700000000, text: "/highlights", chat: { id: 42 } },
    });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(200);
    await waitOnExecutionContext(ctx);

    expect(dmSent).toMatch(/aktive highlights|ingen aktive/i);
  });

  it("dispatcher /unhighlight til handleUnhighlight", async () => {
    let dmSent: string | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (url.toString().includes("api.telegram.org") && url.toString().includes("sendMessage")) {
        const body = JSON.parse((init as RequestInit).body as string);
        dmSent = body.text;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("?", { status: 404 });
    });

    await setLastUpdateId(env.BOT_STATE, 0);
    const ctx = createExecutionContext();
    const req = makeRequest({
      update_id: 50003,
      message: { date: 1700000000, text: "/unhighlight all", chat: { id: 42 } },
    });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(200);
    await waitOnExecutionContext(ctx);

    expect(dmSent).toMatch(/alle.*fjernet|cleared/i);
  });
});
```

- [ ] **Step 6: Verify RED for webhook tests**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/webhook.test.ts -t "/highlight family"
```

Expected: 3 FAIL — alle dispatcher matcher generic-fallback ("Forstår ikke. /help") i stedet for highlight-handlers.

- [ ] **Step 7: Wire dispatch i index.ts**

Modify `worker/src/index.ts` — find dispatch-funktionen, find `/note`-blok, tilføj NYT efter:

```typescript
  // /unhighlight skal matches FØR /highlights for at undgå prefix-match
  if (/^\/unhighlight\b/i.test(trimmed)) {
    const { handleUnhighlight } = await import("./commands/highlight");
    const arg = trimmed.replace(/^\/unhighlight\s*/i, "");
    await handleUnhighlight(env, chatId, arg);
    return;
  }
  if (/^\/highlights\b/i.test(trimmed)) {
    const { handleHighlightsList } = await import("./commands/highlight");
    await handleHighlightsList(env, chatId);
    return;
  }
  if (/^\/highlight\b/i.test(trimmed)) {
    const { handleHighlight } = await import("./commands/highlight");
    const text = trimmed.replace(/^\/highlight\s*/i, "");
    await handleHighlight(env, chatId, text);
    return;
  }
```

(Note: rækkefølgen matter — `/highlight` er prefix af `/highlights` så vi tjekker længste-først. `/unhighlight` er separat.)

- [ ] **Step 8: Verify webhook GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run tests/webhook.test.ts
```

Expected: alle webhook-tests PASS.

- [ ] **Step 9: Update help-tekst**

Modify `worker/src/commands/help.ts`:

```typescript
import { sendDM } from "../telegram";

export const HELP_TEXT =
  "Sådan kan du tale til mig:\n\n" +
  "/status        — hvor langt er vi?\n" +
  "/ship <tekst>  — sæt det her på dit CV\n" +
  "/now <tekst>   — opdater hvad du er optaget af\n" +
  "/note <slug> <tekst> — tilføj marginalia-note til en skrift\n" +
  "/highlight <tekst>   — pin et event øverst i activity-feed\n" +
  "/highlights          — list aktive highlights\n" +
  "/unhighlight <num>   — fjern en specifik highlight (eller 'all')\n" +
  "STOP           — aflys morgendagens post\n" +
  "YES            — bekræft en privacy-flagged post\n\n" +
  "Eller bare skriv en tanke. Det ender som inspiration til søndagens drafts.";

export async function handleHelp(botToken: string, chatId: number): Promise<void> {
  await sendDM(botToken, chatId, HELP_TEXT);
}
```

- [ ] **Step 10: Verify full worker suite**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-agents\worker"
npx vitest run
```

Expected: alle tests PASS, ingen regressioner.

- [ ] **Step 11: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git add worker/src/internal.ts worker/tests/internal.test.ts worker/src/index.ts worker/tests/webhook.test.ts worker/src/commands/help.ts
git commit -m "feat(worker): /internal/highlights endpoint + dispatch + help-update"
```

---

## Task 6: Site-worker `buildEvents` udvidelse (TDD)

**Repo:** `birkenborg-dev`

**Files:**
- Modify: `worker/index.ts`
- Modify: `worker/activity.test.ts`

**Goal:** Site-worker `/api/activity` fetcher highlights fra `bot.birkenborg.dev/internal/highlights` (auth: `BOT_INTERNAL_TOKEN`), merger som `type: 'highlight'` events. Highlights placeres ALTID øverst i feed (uafhængigt af ts), dedup mod commits hvis text matcher.

- [ ] **Step 1: Skriv failing test**

Modify `worker/activity.test.ts` — tilføj nyt test efter eksisterende:

```typescript
it("inkluderer highlights øverst i events-array (uafhængigt af ts)", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = url.toString();
    if (u.includes("api.github.com/users/fluen1/events/public")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/commits")) {
      return new Response(JSON.stringify([
        {
          sha: "abc",
          commit: { message: "feat: ny feature", author: { date: "2026-05-09T14:00:00Z" } },
          html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc",
        },
      ]), { status: 200 });
    }
    if (u.includes("bot.birkenborg.dev/internal/inbox")) {
      return new Response(JSON.stringify({ messages: [] }), { status: 200 });
    }
    if (u.includes("bot.birkenborg.dev/internal/highlights")) {
      return new Response(JSON.stringify({
        highlights: [
          { ts: 1746000000, text: "ÆLDRE highlight" },
        ],
      }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  });

  const { default: worker } = await import("./index");
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify([])) } as Fetcher,
    CHAT_STATE: {} as KVNamespace,
    ANTHROPIC_API_KEY: "sk-test",
    IP_HASH_SALT: "salt",
    BOT_INTERNAL_TOKEN: "tok",
  };
  const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

  const req = new Request("https://birkenborg.dev/api/activity");
  const res = await worker.fetch!(req, env as never, ctx);
  const data = await res.json() as { events: Array<{ type: string; text: string; icon: string }> };

  // Highlight skal være FØRST, selv om commit er nyere ts
  expect(data.events[0].type).toBe("highlight");
  expect(data.events[0].text).toBe("ÆLDRE highlight");
  expect(data.events[0].icon).toBe("✦");
});

it("dedupliker highlight mod commit hvis text matcher", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = url.toString();
    if (u.includes("api.github.com/users/fluen1/events/public")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (u.includes("api.github.com/repos/fluen1/birkenborg-dev/commits")) {
      return new Response(JSON.stringify([
        {
          sha: "abc",
          commit: { message: "feat: dubletten", author: { date: "2026-05-09T14:00:00Z" } },
          html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc",
        },
      ]), { status: 200 });
    }
    if (u.includes("bot.birkenborg.dev/internal/inbox")) {
      return new Response(JSON.stringify({ messages: [] }), { status: 200 });
    }
    if (u.includes("bot.birkenborg.dev/internal/highlights")) {
      return new Response(JSON.stringify({
        highlights: [{ ts: 1746000000, text: "dubletten" }],
      }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  });

  const { default: worker } = await import("./index");
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify([])) } as Fetcher,
    CHAT_STATE: {} as KVNamespace,
    ANTHROPIC_API_KEY: "sk-test",
    IP_HASH_SALT: "salt",
    BOT_INTERNAL_TOKEN: "tok",
  };
  const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

  const req = new Request("https://birkenborg.dev/api/activity");
  const res = await worker.fetch!(req, env as never, ctx);
  const data = await res.json() as { events: Array<{ type: string; text: string }> };

  // Kun ÉN entry med text "dubletten" — commit-versionen er filtreret væk
  const matching = data.events.filter(e => e.text === "dubletten");
  expect(matching).toHaveLength(1);
  expect(matching[0].type).toBe("highlight");
});
```

- [ ] **Step 2: Verify RED**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
npx vitest run worker/activity.test.ts
```

Expected: 2 FAIL — `data.events[0].type` er "commit" (ikke "highlight"), og dedup virker ikke.

- [ ] **Step 3: Udvid `ActivityEvent`-type i index.ts**

Modify `worker/index.ts` — find `interface ActivityEvent`. Sikrer at union inkluderer `'highlight'`:

```typescript
interface ActivityEvent {
  type: 'commit' | 'skrift' | 'now' | 'highlight';
  ts: number;
  text: string;
  icon: string;
  url?: string;
}
```

- [ ] **Step 4: Tilføj highlights-fetch i `buildEvents`**

Modify `worker/index.ts` — find `buildEvents`-funktionen. Find blokken der laver `events.sort((a, b) => b.ts - a.ts)` og `events.slice(0, 5)`. Tilføj NYT block FØR `events.sort`:

```typescript
  // Fetch highlights fra bot-worker (placeres øverst, ikke ts-sorteret)
  const highlightTexts = new Set<string>();
  const highlights: ActivityEvent[] = [];
  try {
    const r = await fetch(`${BOT_BASE}/internal/highlights`, {
      headers: { Authorization: `Bearer ${env.BOT_INTERNAL_TOKEN}` },
    });
    if (r.ok) {
      const data = (await r.json()) as { highlights: Array<{ ts: number; text: string }> };
      for (const h of data.highlights) {
        highlights.push({
          type: 'highlight',
          ts: h.ts,
          text: h.text,
          icon: '✦',
        });
        highlightTexts.add(h.text);
      }
    }
  } catch (e) {
    console.error('events_highlights', e);
  }

  // Dedup commits/skrifter mod highlights
  const dedupedRest = events.filter(e => !highlightTexts.has(e.text));
  dedupedRest.sort((a, b) => b.ts - a.ts);

  // Highlights ALTID øverst, derefter sorted commits/skrifter
  const finalEvents = [...highlights, ...dedupedRest].slice(0, 5);
```

Modify den efterfølgende `return` så den bruger `finalEvents`:

```typescript
  return finalEvents;
```

(Replace existing `events.sort(...)` + `return events.slice(0, 5)` med disse to ændringer.)

- [ ] **Step 5: Verify GREEN**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
npx vitest run worker/activity.test.ts
```

Expected: alle activity-tests PASS.

- [ ] **Step 6: Verify full worker-suite**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev"
npx vitest run
```

Expected: alle tests pass.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add worker/index.ts worker/activity.test.ts
git commit -m "feat(api): /api/activity inkluderer highlights øverst med dedup"
```

---

## Task 7: ActivityFeed-komponent — distinct ✦-styling

**Repo:** `birkenborg-dev`

**Files:**
- Modify: `site/src/components/ActivityFeed.astro`

**Goal:** Render highlight-rows (events.type === 'highlight') med ekstra prominent styling: ✦-ikon i clay-color (ikke opacity-grå), let federe tekst, lille border-left-accent.

- [ ] **Step 1: Tilføj `data-type`-attribut til row-rendering**

Modify `site/src/components/ActivityFeed.astro` — find `renderEvents`-funktionen. Find linjen `li.className = 'row';` og tilføj efter den:

```typescript
        li.dataset.type = e.type;
```

- [ ] **Step 2: Tilføj highlight-styling**

Modify `site/src/components/ActivityFeed.astro` — find `<style is:global>`-blokken. Find `.row .ic { ... }`-reglen. Tilføj NYE regler EFTER den:

```css
  .row[data-type="highlight"] {
    background: rgba(217, 119, 87, 0.06);
    padding-left: 12px;
    border-left: 2px solid var(--clay);
    border-radius: 0 6px 6px 0;
  }
  .row[data-type="highlight"]:hover {
    background: rgba(217, 119, 87, 0.10);
  }
  .row[data-type="highlight"] .ic {
    opacity: 1;
    color: var(--clay);
    font-weight: 600;
  }
  .row[data-type="highlight"] .what {
    font-weight: 500;
  }
```

- [ ] **Step 3: Verify build**

```powershell
Set-Location "C:\Users\birke\Projects\birkenborg-dev\site"
npm run build
```

Expected: build passes, no errors.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git add site/src/components/ActivityFeed.astro
git commit -m "feat(site): ActivityFeed render highlights med distinct ✦-styling"
```

---

## Task 8: Final QA — push + smoke test live

**Repo:** Begge.

**Goal:** Push begge branches til main, verify CI deploys, smoke-test `/highlight`-flow end-to-end via Telegram.

- [ ] **Step 1: Push birkenborg-agents**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
git push origin <feature-branch>
```

(Erstat `<feature-branch>` med navnet på den feature-branch der er checked-out — sandsynligvis `plan-b2-highlight`.)

- [ ] **Step 2: Push birkenborg-dev**

```bash
cd /c/Users/birke/Projects/birkenborg-dev
git push origin <feature-branch>
```

- [ ] **Step 3: Verify CI deploy af bot-worker**

```bash
cd /c/Users/birke/Projects/birkenborg-agents
gh run list --workflow=deploy_worker.yml --limit 1
```

Expected: senest run er `success`. Hvis `in_progress`, vent og kør igen.

- [ ] **Step 4: Smoke test live — /highlight cycle**

Send i Telegram til `@birkenborg_agents_bot`:

```
/highlights
```
Expected: `Ingen aktive highlights.`

```
/highlight Multi-agent compliance live på første kunde
```
Expected: `✦ Pinned: Multi-agent compliance live på første kunde`

```
/highlights
```
Expected:
```
✦ Aktive highlights:

1. (lige nu) Multi-agent compliance live på første kunde
```

Refresh `https://birkenborg.dev` — activity-feed øverst skulle vise det nye highlight-event med ✦-ikon i clay-color (mere prominent end commits).

- [ ] **Step 5: Smoke test — /unhighlight**

```
/unhighlight 1
```
Expected: `✗ Fjernet: Multi-agent compliance live på første kunde`

```
/highlights
```
Expected: `Ingen aktive highlights.`

Refresh birkenborg.dev — highlight er væk.

- [ ] **Step 6: Smoke test — /unhighlight all**

```
/highlight Test 1
/highlight Test 2
/unhighlight all
/highlights
```
Expected: alle fjernet, sidste output `Ingen aktive highlights.`

---

## Self-Review tjekliste

- [ ] Spec §3 KV-format `feed-highlight:<unix-ts>` (note: vi brugte `highlight:<padded-ts>` — funktionelt ækvivalent, padded for lex-sort) ✅
- [ ] Spec §3 ingen TTL → permanent ✅
- [ ] Spec §3 `/highlight <tekst>` ✅
- [ ] Spec §3 `/highlights` lister numrered med relativ tid ✅
- [ ] Spec §3 `/unhighlight <num>` ✅
- [ ] Spec §3 `/unhighlight all` ✅
- [ ] Spec §3 internal endpoint på bot-worker ✅
- [ ] Spec §3 Site-worker `buildEvents` fetcher highlights ✅
- [ ] Spec §3 Highlights ALTID øverst i feed ✅
- [ ] Spec §3 Dedup hvis text matcher commit/skrift ✅
- [ ] Spec §3 ActivityFeed render highlight med ✦-ikon i clay-color (ikke opacity 0.5 grå) ✅
- [ ] Type consistency: `Highlight`-shape `{ ts, text }` på tværs af kv.ts, internal.ts, buildEvents ✅
- [ ] Type consistency: `ActivityEvent.type` union inkluderer `'highlight'` ✅

---

## Out of scope (Plan B3)

**Plan B3 — Auto-commit-scanning:**
- `birkenborg-dev/scripts/build-marginalia.mjs`
- `birkenborg-dev/.github/workflows/auto-marginalia.yml` cron
- Cross-repo commit-scanning med PUBLIC_REPO_PAT
- PR-flow med multi-file edits og keyword-matching heuristikker
