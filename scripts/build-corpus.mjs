import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const LINKEDIN_MARKER = '<!-- linkedin:start -->';

export async function buildCorpus(postsDir) {
  const files = await readdir(postsDir);
  const corpus = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const raw = await readFile(join(postsDir, file), 'utf-8');
    const { data, content } = matter(raw);

    // Default-deny: privacy_flag skal eksplicit være false
    if (data.privacy_flag !== false) continue;

    // Status: published eller manglende (backwards compat)
    if (data.status !== undefined && data.status !== 'published') continue;

    // Strip LinkedIn-blok
    const linkedinIdx = content.indexOf(LINKEDIN_MARKER);
    const body = linkedinIdx === -1
      ? content.trim()
      : content.slice(0, linkedinIdx).trim();

    corpus.push({
      slug: data.slug ?? file.replace(/\.md$/, ''),
      title: data.title,
      tags: data.tags ?? [],
      body,
      publishAt: data.publish_at?.toISOString?.() ?? data.publish_at ?? null,
    });
  }

  return corpus;
}

// Extract slug→title map for client-side citation rendering.
export function buildCitations(corpus) {
  const out = {};
  for (const post of corpus) {
    out[post.slug] = post.title;
  }
  return out;
}

// Vælger N nyeste posts til voice-samples (bot-workerens prompt-context).
// Sortering: publishAt desc; null/manglende dates kommer sidst.
export function buildVoiceSamples(corpus, count = 3) {
  const sorted = [...corpus].sort((a, b) => {
    if (!a.publishAt && !b.publishAt) return 0;
    if (!a.publishAt) return 1;
    if (!b.publishAt) return -1;
    return b.publishAt.localeCompare(a.publishAt);
  });
  return sorted.slice(0, count).map(p => ({
    slug: p.slug,
    title: p.title,
    body: p.body,
    publishAt: p.publishAt,
  }));
}

// CLI entry point
if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const postsDir = join(__dirname, '..', 'content', 'posts');
  const corpusDir = join(__dirname, '..', 'worker', 'data');
  const corpusFile = join(corpusDir, 'chat-corpus.json');
  const citationsDir = join(__dirname, '..', 'site', 'src', 'data');
  const citationsFile = join(citationsDir, 'chat-citations.json');
  const voiceDir = join(__dirname, '..', 'site', 'public');
  const voiceFile = join(voiceDir, 'voice-samples.json');

  const corpus = await buildCorpus(postsDir);
  const citations = buildCitations(corpus);
  const voice = buildVoiceSamples(corpus, 3);

  await mkdir(corpusDir, { recursive: true });
  await writeFile(corpusFile, JSON.stringify(corpus, null, 2), 'utf-8');
  await mkdir(citationsDir, { recursive: true });
  await writeFile(citationsFile, JSON.stringify(citations, null, 2), 'utf-8');
  await mkdir(voiceDir, { recursive: true });
  await writeFile(voiceFile, JSON.stringify(voice, null, 2), 'utf-8');

  const apiCorpusDir = join(__dirname, '..', 'site', 'public', 'api');
  const apiCorpusFile = join(apiCorpusDir, '_corpus.json');
  const apiCorpus = corpus.map(p => ({
    slug: p.slug,
    title: p.title,
    publish_at: p.publishAt,
  }));
  await mkdir(apiCorpusDir, { recursive: true });
  await writeFile(apiCorpusFile, JSON.stringify(apiCorpus), 'utf-8');

  console.log(`Wrote ${corpus.length} posts to ${corpusFile}`);
  console.log(`Wrote ${Object.keys(citations).length} citations to ${citationsFile}`);
  console.log(`Wrote ${voice.length} voice-samples to ${voiceFile}`);
  console.log(`Wrote ${apiCorpus.length} posts to ${apiCorpusFile}`);
}
