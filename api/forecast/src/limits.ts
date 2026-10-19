import { createHmac, randomBytes } from "node:crypto";

/** Per-client request limits, keyed by a keyed hash of the address, never the address itself. */
export type ClientLimiter = {
  /** Counts one request; false when the client is over its limit or no bucket is free. */
  take: (address: string) => boolean;
  readonly buckets: number;
};

const WINDOW_MS = 60_000;

/**
 * Creates per-client buckets: a fixed one-minute window per client, keyed by an HMAC of the
 * address with a random in-memory secret. Buckets expire after ten idle minutes; at most
 * `maxBuckets` exist, and new clients are refused when full. Restarting clears them all.
 *
 * @param perMinute - Requests allowed per client per minute.
 * @param options - Bucket cap, idle expiry, clock and secret.
 * @param options.maxBuckets - Most clients tracked at once.
 * @param options.idleMs - Idle time before a bucket expires.
 * @param options.now - Clock.
 * @param options.secret - HMAC secret; random by default.
 * @returns The limiter.
 */
export function createClientLimiter(
  perMinute: number,
  {
    maxBuckets = 10_000,
    idleMs = 10 * 60_000,
    now = Date.now,
    secret = randomBytes(32),
  }: {
    maxBuckets?: number;
    idleMs?: number;
    now?: () => number;
    secret?: Buffer;
  } = {},
): ClientLimiter {
  const buckets = new Map<
    string,
    { start: number; count: number; seen: number }
  >();
  const sweep = (time: number) => {
    for (const [key, bucket] of buckets)
      if (time - bucket.seen >= idleMs) buckets.delete(key);
  };
  return {
    take(address) {
      const time = now();
      const key = createHmac("sha256", secret)
        .update(address)
        .digest("base64url");
      let bucket = buckets.get(key);
      if (bucket && time - bucket.seen >= idleMs) {
        buckets.delete(key);
        bucket = undefined;
      }
      if (!bucket) {
        if (buckets.size >= maxBuckets) sweep(time);
        if (buckets.size >= maxBuckets) return false;
        bucket = { start: time, count: 0, seen: time };
        buckets.set(key, bucket);
      }
      if (time - bucket.start >= WINDOW_MS) {
        bucket.start = time;
        bucket.count = 0;
      }
      bucket.seen = time;
      bucket.count += 1;
      return bucket.count <= perMinute;
    },
    get buckets() {
      return buckets.size;
    },
  };
}
