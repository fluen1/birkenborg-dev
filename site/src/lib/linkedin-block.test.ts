import { describe, it, expect } from 'vitest';
import { LINKEDIN_MARKER_START, stripLinkedinBlock } from './linkedin-block.mjs';

describe('LINKEDIN_MARKER_START', () => {
  it('matches the agreed marker string', () => {
    expect(LINKEDIN_MARKER_START).toBe('<!-- linkedin:start -->');
  });
});

describe('stripLinkedinBlock', () => {
  it('returns input unchanged when marker is absent', () => {
    const input = 'Web essay text.\n\nMore text.';
    expect(stripLinkedinBlock(input)).toBe(input);
  });

  it('strips everything from the marker onwards', () => {
    const input = [
      'Web essay text.',
      '',
      '<!-- linkedin:start -->',
      'LinkedIn version here.',
      '<!-- linkedin:end -->',
    ].join('\n');
    expect(stripLinkedinBlock(input)).toBe('Web essay text.\n\n');
  });

  it('returns empty string when marker is at position 0', () => {
    const input = '<!-- linkedin:start -->\nOnly LinkedIn.';
    expect(stripLinkedinBlock(input)).toBe('');
  });
});
