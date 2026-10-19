/** The only hosts the service ever contacts. */
export const UPSTREAM_HOSTS = new Set([
  "api.open-meteo.com",
  "api.rainviewer.com",
  "tilecache.rainviewer.com",
]);

/** Why an upstream request did not return data. Bounded codes only. */
export type UpstreamError =
  | "host_denied"
  | "busy"
  | "rate_limited"
  | "timeout"
  | "redirect_denied"
  | "bad_status"
  | "too_large"
  | "network";

/** A failed upstream request, carrying only its bounded code. */
export class UpstreamFailure extends Error {
  readonly code: UpstreamError;

  /**
   * Records the bounded failure code as the message too.
   *
   * @param code - The bounded failure code.
   */
  constructor(code: UpstreamError) {
    super(code);
    this.code = code;
  }
}

/** Upstream limits shared by forecasts and radar. */
export type UpstreamOptions = {
  maxConcurrent?: number;
  perMinute?: number;
  timeoutMs?: number;
  now?: () => number;
  fetch?: typeof globalThis.fetch;
};

/** The shared upstream client. */
export type Upstream = {
  /** Fetches a fixed-host HTTPS URL; rejects with UpstreamFailure. */
  get: (url: URL, maxBytes: number) => Promise<Uint8Array>;
};

async function readCapped(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new UpstreamFailure("too_large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Creates the upstream client: fixed HTTPS hosts only, no redirects, no retries, a deadline
 * per request, a response size cap, at most eight requests in flight and 30 per minute
 * across the whole service. Visitor headers and addresses are never forwarded.
 *
 * @param options - Concurrency (8), requests per minute (30), deadline (5 s), clock and
 *   fetch; tests replace them.
 * @returns The client.
 */
export function createUpstream(options: UpstreamOptions = {}): Upstream {
  const {
    maxConcurrent = 8,
    perMinute = 30,
    timeoutMs = 5000,
    now = Date.now,
    fetch = globalThis.fetch,
  } = options;
  let inFlight = 0;
  const recent: number[] = [];
  return {
    async get(url, maxBytes) {
      if (url.protocol !== "https:" || !UPSTREAM_HOSTS.has(url.hostname))
        throw new UpstreamFailure("host_denied");
      if (inFlight >= maxConcurrent) throw new UpstreamFailure("busy");
      const time = now();
      while (recent.length > 0 && time - (recent[0] ?? 0) >= 60_000)
        recent.shift();
      if (recent.length >= perMinute) throw new UpstreamFailure("rate_limited");
      recent.push(time);
      inFlight += 1;
      try {
        let response: Response;
        try {
          response = await fetch(url, {
            redirect: "manual",
            signal: AbortSignal.timeout(timeoutMs),
            headers: { Accept: "application/json, image/png" },
          });
        } catch (error) {
          throw new UpstreamFailure(
            error instanceof Error && error.name === "TimeoutError"
              ? "timeout"
              : "network",
          );
        }
        if (response.status >= 300 && response.status < 400) {
          await response.body?.cancel();
          throw new UpstreamFailure("redirect_denied");
        }
        if (!response.ok) {
          await response.body?.cancel();
          throw new UpstreamFailure("bad_status");
        }
        const declared = Number(response.headers.get("content-length"));
        if (Number.isFinite(declared) && declared > maxBytes) {
          await response.body?.cancel();
          throw new UpstreamFailure("too_large");
        }
        try {
          return await readCapped(response.body, maxBytes);
        } catch (error) {
          if (error instanceof UpstreamFailure) throw error;
          throw new UpstreamFailure(
            error instanceof Error && error.name === "TimeoutError"
              ? "timeout"
              : "network",
          );
        }
      } finally {
        inFlight -= 1;
      }
    },
  };
}

/**
 * Shares one in-flight request per key, so many visitors from one city cause one fetch.
 *
 * @returns A function that runs `work` once per key at a time.
 */
export function createCoalescer() {
  const pending = new Map<string, Promise<unknown>>();
  return <T>(key: string, work: () => Promise<T>): Promise<T> => {
    const existing = pending.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = work().finally(() => {
      pending.delete(key);
    });
    pending.set(key, promise);
    return promise;
  };
}
