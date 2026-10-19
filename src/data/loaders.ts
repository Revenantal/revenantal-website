import { siteSchema } from "./schemas";
import { decodeLive } from "./decode-live";
import type { Live, Site } from "./types";

async function fetchJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(url, {
    cache: "no-cache",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Shared data request failed.");
  if (
    !(response.headers.get("content-type") ?? "").includes("application/json")
  )
    throw new Error("Shared data must be JSON.");
  if (Number(response.headers.get("content-length")) > 1_048_576)
    throw new Error("Shared data exceeded its size limit.");
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > 1_048_576)
    throw new Error("Shared data exceeded its size limit.");
  return JSON.parse(body) as unknown;
}

/**
 * Loads the required static content and rejects malformed site data.
 *
 * @param fetcher - Browser fetch or an isolated test transport.
 * @returns Validated shared site content.
 */
export async function loadSite(fetcher: typeof fetch = fetch): Promise<Site> {
  return siteSchema.parse(await fetchJson("/site.json", fetcher));
}

/**
 * Loads one optional live snapshot without blocking a useful directory.
 *
 * @param fetcher - Browser fetch or an isolated test transport.
 * @returns A sanitized raw snapshot, or null when unavailable.
 */
export async function loadLive(
  fetcher: typeof fetch = fetch,
): Promise<Live | null> {
  try {
    return decodeLive(await fetchJson("/live.json", fetcher));
  } catch {
    return null;
  }
}
