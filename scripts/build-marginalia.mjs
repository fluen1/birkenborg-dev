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
