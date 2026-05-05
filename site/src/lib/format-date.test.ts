import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort } from './format-date';

describe('formatDate', () => {
  it('formaterer dato på dansk lang form', () => {
    const d = new Date('2026-05-12T09:00:00+02:00');
    expect(formatDate(d)).toBe('12. maj 2026');
  });

  it('håndterer streng-input', () => {
    expect(formatDate('2026-05-04T09:00:00+02:00')).toBe('4. maj 2026');
  });
});

describe('formatDateShort', () => {
  it('formaterer "12 · MAJ" til skrifter-liste', () => {
    const d = new Date('2026-05-12T09:00:00+02:00');
    expect(formatDateShort(d)).toBe('12 · MAJ');
  });

  it('viser to-cifrede dage som de er', () => {
    const d = new Date('2026-04-04T09:00:00+02:00');
    expect(formatDateShort(d)).toBe('4 · APR');
  });
});
