import { describe, it, expect } from 'vitest';
import { validateMessages } from './validate';

describe('validateMessages', () => {
  it('accepterer en enkelt user-besked', () => {
    const result = validateMessages([{ role: 'user', content: 'hej' }]);
    expect(result.ok).toBe(true);
  });

  it('accepterer alternerende user/assistant tråd', () => {
    const result = validateMessages([
      { role: 'user', content: 'hej' },
      { role: 'assistant', content: 'hej selv' },
      { role: 'user', content: 'hvad så' },
    ]);
    expect(result.ok).toBe(true);
  });

  it('afviser hvis ikke array', () => {
    const result = validateMessages('hej');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/array/);
  });

  it('afviser tom array', () => {
    const result = validateMessages([]);
    expect(result.ok).toBe(false);
  });

  it('afviser hvis flere end 10 turns', () => {
    const messages = Array.from({ length: 11 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x',
    }));
    const result = validateMessages(messages);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/10 turns/);
  });

  it('afviser content over 2000 tegn', () => {
    const result = validateMessages([
      { role: 'user', content: 'a'.repeat(2001) },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/2000/);
  });

  it('accepterer content præcis på 2000 tegn', () => {
    const result = validateMessages([
      { role: 'user', content: 'a'.repeat(2000) },
    ]);
    expect(result.ok).toBe(true);
  });

  it('afviser tom content-streng', () => {
    const result = validateMessages([{ role: 'user', content: '' }]);
    expect(result.ok).toBe(false);
  });

  it('afviser ugyldig role', () => {
    const result = validateMessages([{ role: 'system', content: 'hej' }]);
    expect(result.ok).toBe(false);
  });

  it('afviser hvis ikke alternerende', () => {
    const result = validateMessages([
      { role: 'user', content: 'a' },
      { role: 'user', content: 'b' },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/alternate/);
  });

  it('afviser hvis starter med assistant', () => {
    const result = validateMessages([{ role: 'assistant', content: 'hej' }]);
    expect(result.ok).toBe(false);
  });

  it('afviser hvis content mangler', () => {
    const result = validateMessages([{ role: 'user' }]);
    expect(result.ok).toBe(false);
  });
});
