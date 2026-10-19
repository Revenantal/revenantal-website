import { listingSchema, resourcesSchema } from "./schemas.ts";
import type { PanelServer } from "./schemas.ts";
/** Authenticated read-only transport for one panel; no cookie session is sent. */
export type PanelClient = {
  list: () => Promise<PanelServer[]>;
  resources: (uuid: string) => Promise<unknown>;
};
/**
 * Creates bounded, paginated Client API reads without browser cookies or redirects.
 * @param panel - Panel origin, including an optional installation prefix.
 * @param key - Restricted Client API key kept only in the private runtime.
 * @param fetcher - Injectable HTTP transport.
 * @returns Read-only server discovery and resource methods.
 */
export function createPanelClient(
  panel: string,
  key: string,
  fetcher: typeof fetch = fetch,
): PanelClient {
  const base = new URL(panel.endsWith("/") ? panel : panel + "/");
  if (
    base.protocol !== "https:" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !key.trim() ||
    /[\r\n]/.test(key)
  )
    throw new Error("Invalid private panel configuration.");
  const read = async (endpoint: string) => {
    const response = await fetcher(new URL("api/client/" + endpoint, base), {
      headers: { Authorization: "Bearer " + key, Accept: "application/json" },
      redirect: "error",
      credentials: "omit",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Panel request failed.");
    if (
      !(response.headers.get("content-type") ?? "").includes("application/json")
    )
      throw new Error("Panel response is not JSON.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty panel response.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > 1048576) throw new Error("Panel response too large.");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  };
  return {
    list: async () => {
      const servers: PanelServer[] = [];
      const seen = new Set<string>();
      for (let page = 1; page <= 20; page++) {
        const result = listingSchema.parse(
          await read("?include=egg&per_page=100&page=" + String(page)),
        );
        if (
          result.meta.pagination.current_page !== page ||
          result.meta.pagination.total_pages > 20
        )
          throw new Error("Invalid panel pagination.");
        for (const item of result.data) {
          if (seen.has(item.attributes.identifier))
            throw new Error("Duplicate panel server.");
          seen.add(item.attributes.identifier);
          servers.push(item.attributes);
        }
        if (page >= result.meta.pagination.total_pages) {
          if (servers.length !== result.meta.pagination.total)
            throw new Error("Incomplete server discovery.");
          return servers;
        }
      }
      throw new Error("Panel page limit exceeded.");
    },
    resources: async (uuid) => {
      if (!/^[a-f0-9-]{36}$/.test(uuid))
        throw new Error("Invalid server identifier.");
      return resourcesSchema.parse(
        await read("servers/" + uuid + "/resources"),
      );
    },
  };
}
