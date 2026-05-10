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
