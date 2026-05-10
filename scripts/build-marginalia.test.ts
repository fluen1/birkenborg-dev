import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractKeywords,
  matchCommit,
  fetchCommits,
  buildSuggestions,
  dedupAgainstExisting,
  writePostWithMarginalia,
  runAutoMarginalia,
} from "./build-marginalia.mjs";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "build-marginalia.fixtures", "sample-post.md");

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
      text: "agent-fix til paragraf",
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

describe("runAutoMarginalia (orchestrator)", () => {
  let postsDir: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    postsDir = join(__dirname, ".tmp-orchestrator-posts");
    await rm(postsDir, { recursive: true, force: true });
    await mkdir(postsDir, { recursive: true });
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

    expect(summary.perPost.map((p) => p.slug)).toEqual(["auto-test"]);
  });
});
