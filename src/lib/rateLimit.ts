// Enkel in-memory rate limiter (sliding window per prosess).
//
// Begrensning: dette er per server-instans, ikke delt på tvers av flere
// samtidige serverless-instanser/regioner. Det er derfor et sekundært
// forsvarslag, ikke hovedbeskyttelsen - hovedforsvaret mot automatisert
// misbruk er Turnstile-verifiseringen kallene også krever. Hvis reelt
// misbruk oppstår i produksjon bør dette erstattes med en delt store
// (Upstash Redis / Vercel KV).
const hits = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < CLEANUP_INTERVAL_MS);
    if (recent.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, recent);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    const retryAfterMs = windowMs - (now - timestamps[0]);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  return { allowed: true, remaining: max - timestamps.length, retryAfterMs: 0 };
}
