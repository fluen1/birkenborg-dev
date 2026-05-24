import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkStripLinkedin from './remark-strip-linkedin.mjs';

async function process(input: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkStripLinkedin)
    .use(remarkStringify)
    .process(input);
  return String(file);
}

describe('remarkStripLinkedin', () => {
  it('removes content from <!-- linkedin:start --> onwards', async () => {
    const input = [
      'Web essay text.',
      '',
      '<!-- linkedin:start -->',
      'LinkedIn version here.',
      '<!-- linkedin:end -->',
      '',
    ].join('\n');
    const output = await process(input);
    expect(output).toContain('Web essay text.');
    expect(output).not.toContain('LinkedIn version here.');
    expect(output).not.toContain('linkedin:start');
    expect(output).not.toContain('linkedin:end');
  });

  it('leaves documents without the marker unchanged', async () => {
    const input = 'Essay only.\n\nNo LinkedIn here.\n';
    const output = await process(input);
    expect(output.trim()).toBe('Essay only.\n\nNo LinkedIn here.'.trim());
  });
});
