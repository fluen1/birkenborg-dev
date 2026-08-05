import { describe, it, expect } from 'vitest';
import { buildCorpus, buildCitations, buildVoiceSamples, loadCuratedVoiceSamples } from './build-corpus.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const FIXTURES = join(__dirname, 'build-corpus.fixtures', 'posts');

describe('buildCorpus', () => {
  it('inkluderer published post med privacy_flag=false', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const titles = corpus.map(p => p.title);
    expect(titles).toContain('Test Post Clean');
  });

  it('ekskluderer privacy_flag=true (default-deny)', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const titles = corpus.map(p => p.title);
    expect(titles).not.toContain('Privat Post');
  });

  it('ekskluderer post uden privacy_flag-felt (default-deny)', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const titles = corpus.map(p => p.title);
    expect(titles).not.toContain('Ingen Flag');
  });

  it('ekskluderer scheduled post', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const titles = corpus.map(p => p.title);
    expect(titles).not.toContain('Scheduled Post');
  });

  it('inkluderer post uden status-felt (backwards compat)', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const titles = corpus.map(p => p.title);
    expect(titles).toContain('Old Style Post');
  });

  it('stripper <!-- linkedin:start --> blok og alt efter', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const post = corpus.find(p => p.title === 'Test Post With LinkedIn');
    expect(post).toBeDefined();
    expect(post!.body).not.toContain('LinkedIn-version');
    expect(post!.body).not.toContain('linkedin:start');
    expect(post!.body).toContain('Hovedteksten her.');
  });

  it('bevarer kun title, slug, tags, body, publishAt i output', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const post = corpus.find(p => p.title === 'Test Post Clean');
    expect(post).toBeDefined();
    expect(Object.keys(post!).sort()).toEqual(['body', 'publishAt', 'slug', 'tags', 'title']);
  });

  it('returnerer tom array når mappen er tom', async () => {
    const empty = join(__dirname, 'build-corpus.fixtures', 'empty');
    mkdirSync(empty, { recursive: true });
    const corpus = await buildCorpus(empty);
    expect(corpus).toEqual([]);
  });
});

describe('buildCitations', () => {
  it('mapper slug til title for hver post', () => {
    const corpus = [
      { slug: 'a', title: 'Title A', tags: [], body: 'a' },
      { slug: 'b', title: 'Title B', tags: [], body: 'b' },
    ];
    expect(buildCitations(corpus)).toEqual({
      a: 'Title A',
      b: 'Title B',
    });
  });

  it('returnerer tom objekt for tom korpus', () => {
    expect(buildCitations([])).toEqual({});
  });

  it('integrerer med buildCorpus output på fixtures', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const citations = buildCitations(corpus);
    expect(citations['test-clean']).toBe('Test Post Clean');
    expect(citations['test-linkedin']).toBe('Test Post With LinkedIn');
    expect(citations['test-privat']).toBeUndefined();
  });
});

describe('buildVoiceSamples', () => {
  it('returnerer 3 nyeste posts sorteret på publish_at desc', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const samples = buildVoiceSamples(corpus, 3);
    expect(samples).toHaveLength(3);
    const titles = samples.map(s => s.title);
    expect(titles).toContain('Test Post Clean');
    expect(titles).toContain('Test Post With LinkedIn');
  });

  it('returnerer max N samples selv hvis korpus er mindre', () => {
    const small = [
      { slug: 'a', title: 'A', tags: [], body: 'a-body', publishAt: '2026-01-01' },
    ];
    const samples = buildVoiceSamples(small, 5);
    expect(samples).toHaveLength(1);
  });

  it('hver sample har slug, title, body, publishAt', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const samples = buildVoiceSamples(corpus, 3);
    for (const s of samples) {
      expect(s).toHaveProperty('slug');
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('body');
      expect(s).toHaveProperty('publishAt');
    }
  });
});

// Hvorfor denne funktion findes: voice-samples.json blev tidligere bygget af
// buildVoiceSamples(corpus, 3) — de 3 NYESTE posts, som bot'en selv havde skrevet.
// Bot'en læste altså sin egen prosa som facit på Philips stemme og konvergerede mod
// eget gennemsnit. Målt 5/8: alle tre samples var SEO-motorens automatiske artikler.
// Nu læses et KURATERET korpus (Philip-godkendte tekster) i stedet, så nyt output
// aldrig kan snige sig ind i facittet.
describe('loadCuratedVoiceSamples', () => {
  const FIXTURE = join(__dirname, 'build-corpus.fixtures', 'voice-korpus-test.json');

  it('læser samples fra den kuraterede fil', async () => {
    const samples = await loadCuratedVoiceSamples(FIXTURE);
    expect(samples).toHaveLength(2);
    expect(samples.map(s => s.slug)).toContain('oevelse-test-1');
  });

  it('bevarer emojis og æøå ubeskadiget', async () => {
    const samples = await loadCuratedVoiceSamples(FIXTURE);
    const body = samples.find(s => s.slug === 'oevelse-test-1').body;
    expect(body).toContain('🔥');
    expect(body).toContain('føles');
  });

  it('hver sample har slug, title, body, publishAt', async () => {
    const samples = await loadCuratedVoiceSamples(FIXTURE);
    for (const s of samples) {
      expect(s).toHaveProperty('slug');
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('body');
      expect(s).toHaveProperty('publishAt');
    }
  });

  it('kaster hvis filen mangler — tom stemme må ALDRIG passere i stilhed', async () => {
    await expect(
      loadCuratedVoiceSamples(join(__dirname, 'findes-ikke.json'))
    ).rejects.toThrow(/voice-korpus/i);
  });

  it('kaster hvis korpus er tomt — ellers ville botten skrive uden stemme', async () => {
    const tom = join(__dirname, 'build-corpus.fixtures', 'voice-korpus-tom.json');
    await writeFile(tom, '[]', 'utf-8');
    await expect(loadCuratedVoiceSamples(tom)).rejects.toThrow(/tomt/i);
  });

  it('kaster hvis en sample mangler body', async () => {
    const defekt = join(__dirname, 'build-corpus.fixtures', 'voice-korpus-defekt.json');
    await writeFile(defekt, JSON.stringify([{ slug: 'a', title: 'A', publishAt: '2026-01-01' }]), 'utf-8');
    await expect(loadCuratedVoiceSamples(defekt)).rejects.toThrow(/body/i);
  });
});
