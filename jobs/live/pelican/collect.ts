import { serverSnapshotSchema } from "../../../src/data/schemas.ts";
import type { LiveServer, ServerOverride } from "../../../src/data/types.ts";
import type { PanelClient } from "./client.ts";
import { mapServer, queryTarget } from "./mapping.ts";
import type { CounterSample } from "./mapping.ts";
import type { QueryResult } from "./schemas.ts";
/** One collection returns strictly public output and private in-memory rate baselines. */
export type Collection = {
  snapshot: { fetchedAt: string; servers: LiveServer[] };
  counters: Map<string, CounterSample>;
  unavailable: number;
};
/**
 * Discovers assigned servers each cycle and isolates failures without carrying old telemetry forward.
 * @param client - Authenticated read-only panel transport.
 * @param policies - Current shared publication overrides.
 * @param previous - Counters from the preceding successful collection.
 * @param now - Collection start; public age is conservative across the whole cycle.
 * @param query - Injectable game-query transport.
 * @param defaultHost - Optional shared public game hostname for allocation ports.
 * @returns Public server snapshot, current rate baselines and bounded failure count.
 */
export async function collectServers(
  client: PanelClient,
  policies: ServerOverride[],
  previous: Map<string, CounterSample>,
  now: Date,
  query: (target: {
    host: string;
    port: number;
    type: string;
  }) => Promise<QueryResult | null>,
  defaultHost?: string,
): Promise<Collection> {
  const servers = await client.list();
  const output: LiveServer[] = [];
  const counters = new Map<string, CounterSample>();
  let unavailable = 0;
  const queue = servers.entries();
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (const [, metadata] of queue) {
        const policy = policies.find(
          (item) => item.pelicanId === metadata.identifier,
        );
        if (policy?.hidden) continue;
        let raw: unknown = null;
        try {
          raw = await client.resources(metadata.uuid);
        } catch {
          unavailable++;
        }
        const mapped = mapServer(
          metadata,
          raw,
          now.getTime(),
          previous.get(metadata.identifier),
          policy,
        );
        if (mapped.server.state === "running") {
          const target = queryTarget(metadata, policy, defaultHost);
          if (target) {
            const result = await query(target).catch(() => null);
            if (result) {
              const withQuery = mapServer(
                metadata,
                raw,
                now.getTime(),
                previous.get(metadata.identifier),
                policy,
                result,
              );
              Object.assign(mapped.server, withQuery.server);
            }
          }
        }
        output.push(mapped.server);
        if (mapped.counter) counters.set(metadata.identifier, mapped.counter);
      }
    }),
  );
  output.sort((a, b) => a.id.localeCompare(b.id));
  return {
    snapshot: serverSnapshotSchema.parse({
      fetchedAt: now.toISOString(),
      servers: output,
    }),
    counters,
    unavailable,
  };
}
