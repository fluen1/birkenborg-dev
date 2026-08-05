import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
// Shared with the site renderer's remark-strip-linkedin plugin so the
// marker contract lives in one place. This couples scripts/ to site/src/
// on disk — if either moves, this import path must be updated.
import { stripLinkedinBlock } from '../site/src/lib/linkedin-block.mjs';

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
    const body = stripLinkedinBlock(content).trim();

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

// ⚠️ MÅ IKKE BRUGES TIL voice-samples.json — se loadCuratedVoiceSamples nedenfor.
//
// Denne funktion valgte de N NYESTE posts som stemme-eksempler til bot-workeren.
// Problemet: posterne er bot'ens egne. Den læste sin egen prosa som facit på Philips
// stemme og konvergerede mod eget gennemsnit i stedet for mod ham. Målt 5/8-2026 var
// alle tre samples SEO-motorens automatiske jura-artikler (publiceret 09:02, ingen
// menneskehånd). Flagget som åbent problem 7/6, kørte i to måneder.
//
// Funktionen står tilbage fordi den er testet og kan bruges til andet end stemme —
// men koble den ALDRIG til voice-samples igen.
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

// Læser det KURATEREDE stemme-korpus: tekster Philip selv har godkendt i en
// lugtetest, eksporteret fra `.claude/skills/linkedin-stemme/rettelser.jsonl`.
// Dette er den eneste lovlige kilde til voice-samples.json — den bryder
// cirkulariteten, fordi intet bot-output kan snige sig ind i facittet.
//
// Fail loud (Rule 12): en tom eller manglende stemme må ALDRIG passere i stilhed.
// Uden samples skriver bot'en videre uden stemme-anker, og ingen opdager det før
// output'et er forkert.
export async function loadCuratedVoiceSamples(korpusFil) {
  let raw;
  try {
    raw = await readFile(korpusFil, 'utf-8');
  } catch (e) {
    throw new Error(`voice-korpus kunne ikke læses (${korpusFil}): ${e.message}`);
  }

  let samples;
  try {
    samples = JSON.parse(raw);
  } catch (e) {
    throw new Error(`voice-korpus er ikke gyldig JSON (${korpusFil}): ${e.message}`);
  }

  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error(`voice-korpus er tomt (${korpusFil}) — bot'en ville skrive uden stemme`);
  }

  samples.forEach((s, i) => {
    for (const felt of ['slug', 'title', 'body', 'publishAt']) {
      if (!s[felt]) {
        throw new Error(`voice-korpus[${i}] mangler felt "${felt}" (${korpusFil})`);
      }
    }
  });

  return samples;
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
  const voiceKorpusFile = join(__dirname, '..', 'content', 'voice-korpus.json');

  const corpus = await buildCorpus(postsDir);
  const citations = buildCitations(corpus);
  // Kurateret korpus — IKKE buildVoiceSamples(corpus, 3). Se advarslen ved den
  // funktion: de 3 nyeste posts er bot'ens egne, og den lærte sin egen stemme af
  // sig selv. Kilden er Philip-godkendte tekster, eksporteret fra
  // .claude/skills/linkedin-stemme/ via eksporter-korpus.mjs.
  const voice = await loadCuratedVoiceSamples(voiceKorpusFile);

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
    tags: p.tags ?? [],
  }));
  await mkdir(apiCorpusDir, { recursive: true });
  await writeFile(apiCorpusFile, JSON.stringify(apiCorpus), 'utf-8');

  console.log(`Wrote ${corpus.length} posts to ${corpusFile}`);
  console.log(`Wrote ${Object.keys(citations).length} citations to ${citationsFile}`);
  console.log(`Wrote ${voice.length} voice-samples to ${voiceFile}`);
  console.log(`Wrote ${apiCorpus.length} posts to ${apiCorpusFile}`);
}
