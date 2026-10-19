import { z } from "zod";
import {
  githubSchema,
  liveServerSchema,
  statusSchema,
  steamSchema,
} from "../../src/data/schemas.ts";
import type { Live, LiveSource, Site } from "../../src/data/types.ts";

/** Injectable collectors return observations rather than mutating shared output. */
export type SourceReaders = Record<
  LiveSource,
  () => Promise<{ data: unknown; observedAt?: string }>
>;

/**
 * Refreshes each source independently while retaining its original successful timestamp on failure.
 *
 * @param previous - Last validated snapshot, if available.
 * @param readers - Provider-specific readers, injectable for isolated tests.
 * @param site - Current server publication policy.
 * @param now - The aggregate write/attempt time.
 * @returns A new public snapshot with bounded source error codes only.
 */
export async function collectSnapshot(
  previous: Live | null,
  readers: SourceReaders,
  site: Site,
  now: Date,
): Promise<Live> {
  const timestamp = now.toISOString();
  const next: Live = { fetchedAt: timestamp, sources: {}, errors: [] };
  const attempt = async <T>(
    source: LiveSource,
    schema: z.ZodType<T>,
    old: T | undefined,
  ): Promise<T | undefined> => {
    try {
      const result = await readers[source]();
      const data = schema.parse(result.data);
      const observedAt = result.observedAt ?? timestamp;
      const observed = Date.parse(observedAt);
      if (!Number.isFinite(observed) || observed > now.getTime())
        throw new Error("Invalid observation time.");
      next.sources[source] = {
        lastAttemptAt: timestamp,
        lastSuccessAt: observedAt,
        failed: false,
      };
      return data;
    } catch {
      next.sources[source] = {
        lastAttemptAt: timestamp,
        lastSuccessAt: previous?.sources[source]?.lastSuccessAt ?? null,
        failed: true,
      };
      next.errors?.push(`${source}_unavailable`);
      return old;
    }
  };

  const [steam, github, status, servers] = await Promise.all([
    attempt("steam", steamSchema, previous?.steam),
    attempt("github", githubSchema, previous?.github),
    attempt("status", statusSchema, previous?.status),
    attempt("servers", z.array(liveServerSchema), previous?.servers),
  ]);
  if (steam !== undefined) next.steam = steam;
  if (github !== undefined) next.github = github;
  if (status !== undefined) next.status = status;
  if (servers !== undefined) {
    next.servers = servers
      .filter(
        (server) =>
          !site.servers.find((policy) => policy.pelicanId === server.id)
            ?.hidden,
      )
      .map((server) => {
        const policy = site.servers.find(
          (entry) => entry.pelicanId === server.id,
        );
        const clean = { ...server, name: policy?.name ?? server.name };
        delete clean.address;
        if (policy?.showAddress && server.address)
          clean.address = server.address;
        return clean;
      });
  }
  next.errors?.sort();
  return next;
}
