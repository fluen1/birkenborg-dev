import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, type CorpusPost } from './persona';

describe('buildSystemPrompt', () => {
  it('inkluderer persona-instruks', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('Philip Birkenborg');
    expect(prompt).toContain('birkenborg.dev/chat');
  });

  it('håndterer tom korpus uden at crashe', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('ingen kilder tilgængelige');
  });

  it('interpolerer post med title, slug, tags, body', () => {
    const corpus: CorpusPost[] = [{
      slug: 'test-slug',
      title: 'Test Title',
      tags: ['jura', 'kode'],
      body: 'Posten har dette indhold.',
    }];
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toContain('## Test Title');
    expect(prompt).toContain('slug: test-slug');
    expect(prompt).toContain('tags: jura, kode');
    expect(prompt).toContain('Posten har dette indhold.');
  });

  it('separerer flere posts med ---', () => {
    const corpus: CorpusPost[] = [
      { slug: 'a', title: 'A', tags: [], body: 'a-body' },
      { slug: 'b', title: 'B', tags: [], body: 'b-body' },
    ];
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toContain('a-body');
    expect(prompt).toContain('b-body');
    expect(prompt).toContain('\n\n---\n\n');
    expect(prompt.match(/^---$/gm)?.length).toBe(1);
  });

  it('indeholder grænser-instruks (jura, Tandlægen.dk)', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('ALDRIG juridisk rådgivning');
    expect(prompt).toContain('Tandlægen.dk');
  });

  it('indeholder citation-format-instruks', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('→ /skrifter/<slug>');
  });
});
