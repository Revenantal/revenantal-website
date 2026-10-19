import { z } from "zod";
import {
  freshnessSchema,
  githubSchema,
  liveEnvelopeSchema,
  liveServerSchema,
  statusSchema,
  steamSchema,
} from "./schemas";
import type { Live, LiveSource } from "./types";

/**
 * Validates source sections independently so one malformed provider cannot hide the others.
 *
 * @param value - Untrusted JSON loaded from the public snapshot.
 * @returns A sanitized snapshot, or null when its outer envelope is invalid.
 */
export function decodeLive(value: unknown): Live | null {
  const envelope = liveEnvelopeSchema.safeParse(value);
  if (!envelope.success) return null;
  const input = envelope.data;
  const live: Live = { fetchedAt: input.fetchedAt, sources: {} };
  const sources: LiveSource[] = ["steam", "github", "status", "servers"];
  for (const source of sources) {
    const metadata = freshnessSchema.safeParse(input.sources[source]);
    if (metadata.success) live.sources[source] = metadata.data;
  }
  const steam = steamSchema.safeParse(input.steam);
  const github = githubSchema.safeParse(input.github);
  const status = statusSchema.safeParse(input.status);
  const servers = z.array(liveServerSchema).safeParse(input.servers);
  if (steam.success) live.steam = steam.data;
  if (github.success) live.github = github.data;
  if (status.success) live.status = status.data;
  if (servers.success) live.servers = servers.data;
  if (input.errors) live.errors = input.errors;
  return live;
}
