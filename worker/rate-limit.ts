import type { KVNamespace } from '@cloudflare/workers-types';

const PER_IP_LIMIT = 20;
const HOUR_BUCKET_TTL = 3600;
const DAY_TTL = 172800;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'per_ip'; retryAfterSeconds: number }
  | { allowed: false; reason: 'daily_cap' };

export async function checkRateLimit(
  kv: KVNamespace,
  ipHash: string,
  now: Date,
  dailyCap: number,
): Promise<RateLimitResult> {
  const dateKey = now.toISOString().slice(0, 10);
  const hourBucket = Math.floor(now.getTime() / 3600_000);
  const prevBucket = hourBucket - 1;

  const [currentRaw, prevRaw, capRaw] = await Promise.all([
    kv.get(`rl:${ipHash}:${hourBucket}`),
    kv.get(`rl:${ipHash}:${prevBucket}`),
    kv.get(`cap:${dateKey}`),
  ]);

  const dayCount = capRaw ? parseInt(capRaw, 10) : 0;
  if (dayCount >= dailyCap) {
    return { allowed: false, reason: 'daily_cap' };
  }

  const ipCount = (currentRaw ? parseInt(currentRaw, 10) : 0)
              + (prevRaw ? parseInt(prevRaw, 10) : 0);
  if (ipCount >= PER_IP_LIMIT) {
    const msToNextHour = (hourBucket + 1) * 3600_000 - now.getTime();
    return {
      allowed: false,
      reason: 'per_ip',
      retryAfterSeconds: Math.ceil(msToNextHour / 1000),
    };
  }

  return { allowed: true };
}

export async function incrementCounters(
  kv: KVNamespace,
  ipHash: string,
  now: Date,
): Promise<void> {
  const dateKey = now.toISOString().slice(0, 10);
  const hourBucket = Math.floor(now.getTime() / 3600_000);
  const ipKey = `rl:${ipHash}:${hourBucket}`;
  const capKey = `cap:${dateKey}`;

  const [ipRaw, capRaw] = await Promise.all([kv.get(ipKey), kv.get(capKey)]);
  const ipNext = (ipRaw ? parseInt(ipRaw, 10) : 0) + 1;
  const capNext = (capRaw ? parseInt(capRaw, 10) : 0) + 1;

  await Promise.all([
    kv.put(ipKey, String(ipNext), { expirationTtl: HOUR_BUCKET_TTL }),
    kv.put(capKey, String(capNext), { expirationTtl: DAY_TTL }),
  ]);
}
