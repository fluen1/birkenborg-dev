import { describe, it, expect } from 'vitest';
import { checkRateLimit, incrementCounters } from './rate-limit';
import { createMockKV } from './test-helpers';

const NOW = new Date('2026-05-07T10:30:00Z');
const HOUR_BUCKET = Math.floor(NOW.getTime() / 3600_000);

describe('checkRateLimit', () => {
  it('tillader første request fra ny IP', async () => {
    const kv = createMockKV();
    const result = await checkRateLimit(kv, 'iphash123', NOW, 500);
    expect(result.allowed).toBe(true);
  });

  it('tillader 20. request inden for timen', async () => {
    const kv = createMockKV();
    kv._store.set(`rl:iphash:${HOUR_BUCKET}`, '19');
    const result = await checkRateLimit(kv, 'iphash', NOW, 500);
    expect(result.allowed).toBe(true);
  });

  it('blokerer 21. request inden for timen', async () => {
    const kv = createMockKV();
    kv._store.set(`rl:iphash:${HOUR_BUCKET}`, '20');
    const result = await checkRateLimit(kv, 'iphash', NOW, 500);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe('per_ip');
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(3600);
    }
  });

  it('summerer current + previous bucket (sliding window)', async () => {
    const kv = createMockKV();
    kv._store.set(`rl:iphash:${HOUR_BUCKET}`, '10');
    kv._store.set(`rl:iphash:${HOUR_BUCKET - 1}`, '15');
    const result = await checkRateLimit(kv, 'iphash', NOW, 500);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('per_ip');
  });

  it('blokerer ved daily cap selv hvis IP har plads', async () => {
    const kv = createMockKV();
    kv._store.set(`cap:2026-05-07`, '500');
    const result = await checkRateLimit(kv, 'iphash', NOW, 500);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('daily_cap');
  });

  it('respekterer custom daily cap', async () => {
    const kv = createMockKV();
    kv._store.set(`cap:2026-05-07`, '100');
    const result = await checkRateLimit(kv, 'iphash', NOW, 100);
    expect(result.allowed).toBe(false);
  });

  it('tillader på dag-skifte (anden date-key)', async () => {
    const kv = createMockKV();
    kv._store.set(`cap:2026-05-06`, '500');
    const result = await checkRateLimit(kv, 'iphash', NOW, 500);
    expect(result.allowed).toBe(true);
  });
});

describe('incrementCounters', () => {
  it('opretter både IP og cap counter ved første kald', async () => {
    const kv = createMockKV();
    await incrementCounters(kv, 'iphash', NOW);
    expect(kv._store.get(`rl:iphash:${HOUR_BUCKET}`)).toBe('1');
    expect(kv._store.get('cap:2026-05-07')).toBe('1');
  });

  it('inkrementerer eksisterende counters', async () => {
    const kv = createMockKV();
    kv._store.set(`rl:iphash:${HOUR_BUCKET}`, '5');
    kv._store.set('cap:2026-05-07', '50');
    await incrementCounters(kv, 'iphash', NOW);
    expect(kv._store.get(`rl:iphash:${HOUR_BUCKET}`)).toBe('6');
    expect(kv._store.get('cap:2026-05-07')).toBe('51');
  });
});
