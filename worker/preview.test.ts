import { describe, it, expect, vi, beforeEach } from "vitest";
import { handlePreview } from "./preview";

interface MockEnv {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  BOT_INTERNAL_TOKEN: string;
}

function makeEnv(): MockEnv {
  return {
    ASSETS: {
      fetch: async () =>
        new Response(
          `<html><head><link rel="stylesheet" href="/_astro/skrifter.AbCdEf.css"></head><body></body></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
    },
    BOT_INTERNAL_TOKEN: "tok-test",
  };
}

describe("handlePreview", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renderer markdown med sitets CSS-link inkluderet", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("bot.birkenborg.dev/internal/preview/")) {
        return new Response(JSON.stringify({
          draft: "# Hej verden\n\nDette er en preview.",
          slug: "hej-verden",
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const url = new URL("https://birkenborg.dev/skrifter/hej-verden?preview=" + "a".repeat(32));
    const res = await handlePreview(url, makeEnv() as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("<h1>Hej verden</h1>");
    expect(html).toContain("Dette er en preview.");
    expect(html).toContain('href="/_astro/skrifter.AbCdEf.css"');
    expect(html).toContain("preview-banner");
  });

  it("returnerer 404 for ukendt token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    const url = new URL("https://birkenborg.dev/skrifter/x?preview=" + "b".repeat(32));
    const res = await handlePreview(url, makeEnv() as never);
    expect(res.status).toBe(404);
  });

  it("returnerer 404 for ugyldig token-format", async () => {
    const url = new URL("https://birkenborg.dev/skrifter/x?preview=ikke-hex");
    const res = await handlePreview(url, makeEnv() as never);
    expect(res.status).toBe(404);
  });
});
