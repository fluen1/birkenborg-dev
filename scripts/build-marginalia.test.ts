import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractKeywords,
  matchCommit,
  fetchCommits,
  buildSuggestions,
  dedupAgainstExisting,
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
