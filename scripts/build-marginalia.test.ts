import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractKeywords,
  matchCommit,
  fetchCommits,
  isNoiseCommit,
  buildSuggestions,
  assignCommitsToPosts,
  dedupAgainstExisting,
  spliceMarginalia,
  writePostWithMarginalia,
  runAutoMarginalia,
} from "./build-marginalia.mjs";
import matter from "gray-matter";
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

  // Med delstrengs-match landede vilkårlige commits på vilkårlige artikler:
  // "din" fra slug'et hvad-sker-der-naar-DIN-bestyrelse ramte "LinkedIn",
  // "readiness" og "gradient". Det var hovedkilden til ubrugelige forslag.
  it("matcher IKKE et keyword der blot optræder inde i et andet ord", () => {
    expect(matchCommit("add remark-strip-linkedin plugin", ["din"])).toEqual([]);
    expect(matchCommit("add project CLAUDE.md for auto-mode readiness", ["din"])).toEqual([]);
    expect(matchCommit("drop-caps on posts, gradient dividers", ["din", "tab"])).toEqual([]);
  });

  it("matcher stadig et keyword der står som eget ord i en sammensætning", () => {
    expect(matchCommit("feat: agent-fix til paragraf", ["agent", "paragraf"]))
      .toEqual(["agent", "paragraf"]);
  });
});

describe("fetchCommits", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("henter commits og returnerer normaliseret format", async () => {
    const fixtureDate = new Date(Date.now() - 5 * 86400_000).toISOString();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          sha: "abc",
          commit: {
            message: "feat: ny feature",
            author: { date: fixtureDate },
          },
          html_url: "https://github.com/fluen1/birkenborg-dev/commit/abc",
        },
      ]), { status: 200 }),
    );

    const commits = await fetchCommits("fluen1/birkenborg-dev", "ghp_test", 30);
    expect(commits).toHaveLength(1);
    expect(commits[0]).toEqual({
      message: "feat: ny feature",
      authorDate: fixtureDate,
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
    const postWithMatch = { ...post, title: "a".repeat(200) };
    const suggestions = buildSuggestions(postWithMatch, commits);
    expect(suggestions[0].text.length).toBeLessThanOrEqual(80);
    expect(suggestions[0].text).not.toMatch(/^feat\(scope\):/);
  });
});

describe("isNoiseCommit", () => {
  // En margin-note skal fortælle læseren noget om arbejdet bag artiklen.
  // Sitets egne udgivelses-commits fortæller kun at sitet udgav noget — de
  // udgjorde 104 af 363 forslag i PR #14 og gjorde bunken ulæselig.
  it("kasserer sitets egne publish-commits", () => {
    expect(isNoiseCommit("publish gdpr-og-ai-i-klinikker-hvad-du-faktisk-skal")).toBe(true);
    expect(isNoiseCommit("news: publish bestyrelsesansvar-naar-ai-leverer")).toBe(true);
  });

  it("kasserer merge-commits", () => {
    expect(isNoiseCommit("Merge branch 'main' of https://github.com/fluen1/birkenborg-agents")).toBe(true);
    expect(isNoiseCommit("Merge pull request #12 from fluen1/x")).toBe(true);
    expect(isNoiseCommit("Merge remote-tracking branch 'origin/main'")).toBe(true);
  });

  it("kasserer scriptets egne commits, så bunken ikke fodrer sig selv", () => {
    expect(isNoiseCommit("auto-marginalia: ugens noter (2026-08-30)")).toBe(true);
  });

  it("beholder rigtige arbejds-commits", () => {
    expect(isNoiseCommit("feat: agent-fix til paragraf 30")).toBe(false);
    expect(isNoiseCommit("opretSag sluger også KV-fejl")).toBe(false);
    // Ordet 'publish' inde i en sætning er ikke et publish-commit.
    expect(isNoiseCommit("fix: retry når publish-endpoint svarer 502")).toBe(false);
  });
});

describe("assignCommitsToPosts", () => {
  const posts = [
    { slug: "ma-agent-paragraf-30", tags: [], title: "M&A-agenten fejlede på paragraf 30", marginalia: [] },
    { slug: "agent-priser", tags: [], title: "Hvad koster en AI-agent", marginalia: [] },
  ];

  // Kernen i fejlen: dedup'en var pr. post, så en commit der matchede to
  // artiklers keywords blev foreslået begge steder. Én commit = én note.
  it("giver en commit til præcis én post, ikke til alle der matcher", () => {
    const commits = [
      { message: "feat: agent virker", authorDate: "2026-07-01T10:00:00Z", htmlUrl: "https://x/1" },
    ];
    const byPost = assignCommitsToPosts(posts, commits);
    const total = [...byPost.values()].reduce((n, v) => n + v.length, 0);
    expect(total).toBe(1);
  });

  it("vælger den post der matcher mest af commit-teksten", () => {
    const commits = [
      { message: "fix: paragraf-tjek i agenten", authorDate: "2026-07-01T10:00:00Z", htmlUrl: "https://x/1" },
    ];
    const byPost = assignCommitsToPosts(posts, commits);
    expect(byPost.get("ma-agent-paragraf-30")).toHaveLength(1);
    expect(byPost.get("agent-priser")).toHaveLength(0);
  });

  it("frasorterer støj-commits før fordelingen", () => {
    const commits = [
      { message: "publish ma-agent-paragraf-30", authorDate: "2026-07-01T10:00:00Z", htmlUrl: "https://x/1" },
      { message: "Merge branch 'main'", authorDate: "2026-07-01T11:00:00Z", htmlUrl: "https://x/2" },
    ];
    const byPost = assignCommitsToPosts(posts, commits);
    expect([...byPost.values()].reduce((n, v) => n + v.length, 0)).toBe(0);
  });

  it("foreslår ikke en tekst der allerede står som note på en ANDEN post", () => {
    const withExisting = [
      { ...posts[0], marginalia: [{ ts: "x", text: "agent virker", source: "manual" }] },
      posts[1],
    ];
    const commits = [
      { message: "feat: agent virker", authorDate: "2026-07-01T10:00:00Z", htmlUrl: "https://x/1" },
    ];
    const byPost = assignCommitsToPosts(withExisting, commits);
    expect([...byPost.values()].reduce((n, v) => n + v.length, 0)).toBe(0);
  });

  it("er deterministisk uanset postenes rækkefølge", () => {
    const commits = [
      { message: "feat: agent virker", authorDate: "2026-07-01T10:00:00Z", htmlUrl: "https://x/1" },
    ];
    const a = assignCommitsToPosts(posts, commits);
    const b = assignCommitsToPosts([...posts].reverse(), commits);
    const winner = (m: Map<string, unknown[]>) =>
      [...m.entries()].find(([, v]) => v.length > 0)?.[0];
    expect(winner(a)).toBe(winner(b));
  });
});

describe("spliceMarginalia", () => {
  // matter.stringify() skrev hele frontmatteren om: titler skiftede
  // citationstegn og lange felter blev til '>-'. Resultatet var en PR hvor 31
  // artikler så ændrede ud selvom kun marginalia-feltet var nyt.
  const raw = `---
title: "Hvorfor min M&A-agent fejlede på paragraf 30"
slug: ma-agent-paragraf-30
excerpt: En lang linje der ellers ville blive foldet om til et blok-scalar af YAML-serializeren når den skrives tilbage
status: published
privacy_flag: false
---

# Body

Tekst.
`;

  it("rører intet andet end marginalia-feltet", () => {
    const out = spliceMarginalia(raw, [
      { ts: "2026-07-01T10:00:00Z", text: "ny note", source: "auto-commit", commit_url: "https://x/1" },
    ]);
    expect(out).toContain(`title: "Hvorfor min M&A-agent fejlede på paragraf 30"`);
    expect(out).toContain("excerpt: En lang linje der ellers ville blive foldet");
    expect(out).not.toContain(">-");
    expect(out).toContain("# Body");
    expect(out).toContain("text: 'ny note'");
  });

  it("lader Philips egne, håndskrevne noter stå tegn for tegn", () => {
    const withManual = `---
title: "Test"
slug: test
status: published
marginalia:
  - ts: "8/5 14:32"
    text: "undersøgte det her i 3 dage før jeg gav op"
    source: manual
---

Body.
`;
    const out = spliceMarginalia(withManual, [
      { ts: "b", text: "ny auto-note", source: "auto-commit" },
    ]);
    expect(out).toContain(`  - ts: "8/5 14:32"`);
    expect(out).toContain(`    text: "undersøgte det her i 3 dage før jeg gav op"`);
    expect(out).toContain("    source: manual");
    expect(out.match(/^marginalia:/gm)).toHaveLength(1);
    expect(matter(out).data.marginalia).toHaveLength(2);
    expect(matter(out).data.marginalia[1].text).toBe("ny auto-note");
  });

  it("erstatter en tom 'marginalia: []' med en rigtig blok", () => {
    const empty = `---
title: "Test"
slug: test
marginalia: []
status: published
---

Body.
`;
    const out = spliceMarginalia(empty, [{ ts: "b", text: "ny", source: "auto-commit" }]);
    expect(out).not.toContain("marginalia: []");
    expect(out).toContain("status: published");
    expect(matter(out).data.marginalia).toHaveLength(1);
  });

  it("returnerer filen uændret når der ikke er nye noter", () => {
    expect(spliceMarginalia(raw, [])).toBe(raw);
  });

  it("escaper apostroffer så YAML ikke knækker", () => {
    const out = spliceMarginalia(raw, [
      { ts: "a", text: "Merge branch 'main' i agenten", source: "auto-commit" },
    ]);
    expect(out).toContain("text: 'Merge branch ''main'' i agenten'");
    expect(matter(out).data.marginalia[0].text).toBe("Merge branch 'main' i agenten");
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
    expect(updated).toContain("source: 'auto-commit'");
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
