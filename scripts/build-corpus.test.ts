import { describe, it, expect } from 'vitest';
import { buildCorpus } from './build-corpus.mjs';
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

  it('bevarer kun title, slug, tags, body i output', async () => {
    const corpus = await buildCorpus(FIXTURES);
    const post = corpus.find(p => p.title === 'Test Post Clean');
    expect(post).toBeDefined();
    expect(Object.keys(post!).sort()).toEqual(['body', 'slug', 'tags', 'title']);
  });

  it('returnerer tom array når mappen er tom', async () => {
    const empty = join(__dirname, 'build-corpus.fixtures', 'empty');
    mkdirSync(empty, { recursive: true });
    const corpus = await buildCorpus(empty);
    expect(corpus).toEqual([]);
  });
});
