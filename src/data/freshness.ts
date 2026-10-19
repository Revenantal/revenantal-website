import type {
  Live,
  LiveServer,
  LiveSource,
  Project,
  Site,
  SourceFreshness,
} from "./types";

/** Freshness displayed alongside each independently observed source. */
export type SourceState = {
  state: "fresh" | "stale" | "unavailable";
  observedAt: string | null;
};

/** One sanitized view is shared by the directory and all future channels. */
export type DataView = {
  projects: Project[];
  servers: LiveServer[];
  live: Live | null;
  freshness: Record<LiveSource, SourceState>;
};

const maximumAge: Record<LiveSource, number> = {
  steam: 30 * 60_000,
  github: 30 * 60_000,
  status: 30 * 60_000,
  servers: 15 * 60_000,
};

function sourceState(
  metadata: SourceFreshness | undefined,
  present: boolean,
  source: LiveSource,
  now: number,
): SourceState {
  const observed = metadata?.lastSuccessAt
    ? Date.parse(metadata.lastSuccessAt)
    : Number.NaN;
  const attempted = metadata ? Date.parse(metadata.lastAttemptAt) : Number.NaN;
  if (
    !present ||
    !metadata ||
    !Number.isFinite(now) ||
    !Number.isFinite(observed) ||
    !Number.isFinite(attempted) ||
    observed > now ||
    attempted > now ||
    observed > attempted
  ) {
    return { state: "unavailable", observedAt: null };
  }
  return {
    state:
      metadata.failed || now - observed >= maximumAge[source]
        ? "stale"
        : "fresh",
    observedAt: metadata.lastSuccessAt,
  };
}

/**
 * Removes stale observations and applies current server visibility/address policy.
 *
 * @param site - Current validated static content.
 * @param raw - Validated raw snapshot retained for local aging.
 * @param now - The viewer clock, also refreshed immediately on tab resume.
 * @returns Public data and source ages safe to pass to any view.
 */
export function filterFreshData(
  site: Site,
  raw: Live | null,
  now: Date,
): DataView {
  const time = now.getTime();
  const freshness: Record<LiveSource, SourceState> = {
    steam: sourceState(
      raw?.sources.steam,
      raw?.steam !== undefined,
      "steam",
      time,
    ),
    github: sourceState(
      raw?.sources.github,
      raw?.github !== undefined,
      "github",
      time,
    ),
    status: sourceState(
      raw?.sources.status,
      raw?.status !== undefined,
      "status",
      time,
    ),
    servers: sourceState(
      raw?.sources.servers,
      raw?.servers !== undefined,
      "servers",
      time,
    ),
  };
  const sourceProjects =
    site.directory?.source === "github"
      ? (raw?.github?.projects ?? site.projects)
      : site.projects;
  const projects = sourceProjects
    .filter((project) => !project.hidden)
    .map((project) => {
      const clean = { ...project };
      delete clean.status;
      if (
        freshness.status.state === "fresh" &&
        raw?.status &&
        Object.hasOwn(raw.status, project.id)
      )
        clean.status = raw.status[project.id]?.state;
      return clean;
    })
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  const servers: LiveServer[] = [];
  for (const server of raw?.servers ?? []) {
    const policy = site.servers.find((entry) => entry.pelicanId === server.id);
    if (policy?.hidden) continue;
    const clean: LiveServer =
      freshness.servers.state === "fresh"
        ? { ...server }
        : {
            id: server.id,
            name: server.name,
            game: server.game,
            state: "unknown",
          };
    clean.name = policy?.name ?? clean.name;
    delete clean.address;
    if (policy?.showAddress && server.address) clean.address = server.address;
    servers.push(clean);
  }

  if (!raw) return { projects, servers, freshness, live: null };
  const live: Live = { fetchedAt: raw.fetchedAt, sources: raw.sources };
  if (freshness.steam.state === "fresh" && raw.steam) live.steam = raw.steam;
  if (freshness.github.state === "fresh" && raw.github)
    live.github = raw.github;
  if (freshness.status.state === "fresh" && raw.status)
    live.status = raw.status;
  if (raw.servers) live.servers = servers;
  return { projects, servers, freshness, live };
}
