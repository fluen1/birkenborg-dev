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
