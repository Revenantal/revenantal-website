import { dirname, join } from "node:path";
import type { Site } from "../../../src/data/types.ts";
import { createPanelClient } from "./client.ts";
import { collectServers } from "./collect.ts";
import { queryGame } from "./query.ts";
import { readCounters, writeCounters } from "./state.ts";
/**
 * Collects assigned servers directly inside the scheduled live job, with optional game queries.
 * @param site - Validated shared server visibility/address policy.
 * @param env - Private runtime configuration; no browser or build-time keys.
 * @param fetcher - Injectable token-only API transport.
 * @param observedAt - Shared scheduled-run start, before any source requests.
 * @returns Sanitized server data and its conservative collection observation time.
 */
export async function readPelican(
  site: Site,
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
  observedAt: Date = new Date(),
) {
  const client = createPanelClient(
    env.PELICAN_URL ?? "",
    env.PELICAN_KEY ?? "",
    fetcher,
  );
  const host = env.GAME_QUERY_HOST;
  if (host && !/^[a-zA-Z0-9.:-]{1,253}$/.test(host))
    throw new Error("Invalid game-query host.");
  const file =
    env.PELICAN_STATE_PATH === ""
      ? null
      : (env.PELICAN_STATE_PATH ??
        join(
          dirname(env.LIVE_PATH ?? "/data/live.json"),
          "pelican-state.json",
        ));
  const previous = await readCounters(file);
  const now = observedAt;
  const result = await collectServers(
    client,
    site.servers,
    previous,
    now,
    queryGame,
    host,
  );
  await writeCounters(file, result.counters);
  return {
    data: result.snapshot.servers,
    observedAt: result.snapshot.fetchedAt,
  };
}
