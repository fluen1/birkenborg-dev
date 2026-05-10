import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractKeywords,
  matchCommit,
  fetchCommits,
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
