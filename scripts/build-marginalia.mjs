import matter from "gray-matter";
import { readFile as readFileNode, writeFile as writeFileNode, readdir } from "node:fs/promises";

const STOP_WORDS_DA = new Set([
  "og", "eller", "men", "som", "der", "det", "den", "de", "en", "et",
  "at", "for", "til", "med", "af", "på", "i", "var", "er", "have", "har",
  "kan", "skal", "vil", "ikke", "ja", "nej", "hvis", "når", "også",
  "være", "blev", "bliver", "fra", "om", "ud", "ind", "op", "ned",
]);

const MIN_KEYWORD_LENGTH = 3;

// Commits der IKKE er noter om arbejdet, men sitets egen mekanik.
// De udgjorde 108 af 363 forslag i PR #14 (104 "publish <slug>", 4 merges).
const NOISE_PATTERNS = [
  /^(?:[a-z]+(?:\([^)]+\))?:\s*)?publish\s/i,
  /^Merge branch\b/i,
  /^Merge pull request\b/i,
  /^Merge remote-tracking branch\b/i,
  /^auto-marginalia:/i,
];

export function isNoiseCommit(message) {
  const m = (message ?? "").trim();
  if (!m) return true;
  return NOISE_PATTERNS.some((re) => re.test(m));
}

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

// Match på hele ord, ikke delstrenge. Med includes() matchede keyword "din"
// inde i "LinkedIn", "readiness" og "gradient", så vilkårlige commits landede
// på artikler de intet havde med at gøre. Commit-teksten tokeniseres på samme
// måde som keywords, så de to sider er sammenlignelige.
export function matchCommit(commitMessage, keywords) {
  const tokens = new Set(
    (commitMessage ?? "").toLowerCase().split(/[^a-zA-ZæøåÆØÅ0-9]+/).filter(Boolean),
  );
  return keywords.filter((kw) => tokens.has(kw));
}

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

const MAX_TEXT_LENGTH = 80;

function stripConventionalPrefix(message) {
  const m = message.match(/^[a-z]+(\([^)]+\))?:\s*(.+)$/);
  return m?.[2] ?? message;
}

function commitToEntry(c) {
  return {
    ts: c.authorDate,
    text: stripConventionalPrefix(c.message).trim().slice(0, MAX_TEXT_LENGTH),
    source: "auto-commit",
    commit_url: c.htmlUrl,
  };
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
    if (isNoiseCommit(c.message)) continue;
    if (matchCommit(c.message, keywords).length === 0) continue;
    suggestions.push(commitToEntry(c));
  }
  return suggestions;
}

// Én commit hører til ÉN artikel. Uden dette landede samme commit på hver post
// hvis keywords matchede — i PR #14 op til 12 gange for den samme tekst, fordi
// dedup'en kun kiggede inden for den enkelte post.
export function assignCommitsToPosts(posts, commits) {
  const keywordsBySlug = new Map(
    posts.map((p) => [
      p.slug,
      extractKeywords({ slug: p.slug, tags: p.tags ?? [], title: p.title ?? "" }),
    ]),
  );

  // Tekster der allerede står som note et sted, foreslås ikke igen nogen steder.
  const seenText = new Set();
  for (const p of posts) {
    for (const m of p.marginalia ?? []) seenText.add(m.text);
  }

  const byPost = new Map(posts.map((p) => [p.slug, []]));
  for (const c of commits) {
    if (isNoiseCommit(c.message)) continue;
    const entry = commitToEntry(c);
    if (!entry.text || seenText.has(entry.text)) continue;

    let best = null;
    let bestScore = 0;
    for (const p of posts) {
      const matched = matchCommit(c.message, keywordsBySlug.get(p.slug));
      if (matched.length === 0) continue;
      // Flest tegn matchet vinder; ved lige stilling den alfabetisk første slug,
      // så kørslen er deterministisk uanset filsystemets rækkefølge.
      const score = matched.reduce((n, k) => n + k.length, 0);
      if (score > bestScore || (score === bestScore && best !== null && p.slug < best.slug)) {
        bestScore = score;
        best = p;
      }
    }
    if (!best) continue;
    seenText.add(entry.text);
    byPost.get(best.slug).push(entry);
  }
  return byPost;
}

export function dedupAgainstExisting(post, suggestions) {
  const existing = new Set((post.marginalia ?? []).map((m) => m.text));
  return suggestions.filter((s) => !existing.has(s.text));
}

function yamlScalar(value) {
  if (value === null || value === undefined) return "null";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function serializeMarginalia(entries) {
  const lines = ["marginalia:"];
  for (const e of entries) {
    const keys = Object.keys(e);
    keys.forEach((k, i) => {
      lines.push(`${i === 0 ? "  - " : "    "}${k}: ${yamlScalar(e[k])}`);
    });
  }
  return lines;
}

// Indsætter KUN de nye noter. matter.stringify() genformaterede hele
// frontmatteren (titler skiftede citationstegn, lange felter blev til '>-',
// Philips håndskrevne noter fik nye citationstegn), så en PR med 30 nye noter
// så ud som 31 ændrede artikler. Alt eksisterende bevares tegn for tegn.
export function spliceMarginalia(raw, newEntries) {
  if (newEntries.length === 0) return raw;
  const m = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) throw new Error("frontmatter_ikke_fundet");
  const eol = m[1].includes("\r\n") ? "\r\n" : "\n";
  const lines = m[2].split(/\r?\n/);
  const added = serializeMarginalia(newEntries);

  const start = lines.findIndex((l) => /^marginalia\s*:/.test(l));
  let merged;
  if (start === -1) {
    merged = [...lines, ...added];
  } else if (/^marginalia\s*:\s*\[\s*\]\s*$/.test(lines[start])) {
    // "marginalia: []" er en tom liste, ikke en blok der skal bevares.
    merged = [...lines.slice(0, start), ...added, ...lines.slice(start + 1)];
  } else {
    let end = start + 1;
    while (end < lines.length && /^[ \t]/.test(lines[end])) end++;
    merged = [...lines.slice(0, end), ...added.slice(1), ...lines.slice(end)];
  }

  return m[1] + merged.join(eol) + m[3] + raw.slice(m[0].length);
}

export async function writePostWithMarginalia(filePath, suggestions) {
  const raw = await readFileNode(filePath, "utf-8");
  await writeFileNode(filePath, spliceMarginalia(raw, suggestions), "utf-8");
}

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

  // 3. Fordel commits globalt (én commit → én post) og skriv (hvis ikke dry-run)
  const assigned = assignCommitsToPosts(posts, allCommits);
  const perPost = [];
  let filesChanged = 0;
  let totalSuggestions = 0;
  for (const post of posts) {
    const filtered = assigned.get(post.slug) ?? [];
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

// CLI entry point
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
