import matter from "gray-matter";
import { readFile as readFileNode, writeFile as writeFileNode, readdir } from "node:fs/promises";

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

  // 3. For hver post: byg suggestions + dedup + skriv (hvis ikke dry-run)
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
