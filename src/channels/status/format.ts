import type { LiveServer, Project, SourceState } from "../../data/types";

/** What a project's status light and text show. */
export type ProjectState = "up" | "slow" | "down" | "unknown";

/** Display words for project and server states. */
export const STATE_WORD: Record<ProjectState | LiveServer["state"], string> = {
  up: "UP",
  slow: "SLOW",
  down: "DOWN",
  unknown: "UNKNOWN",
  running: "RUNNING",
  starting: "STARTING",
  stopping: "STOPPING",
  offline: "OFFLINE",
  maintenance: "MAINTENANCE",
};

/**
 * A project's state; anything not freshly observed is unknown, never down.
 *
 * @param project - The project, with status merged by the host when fresh.
 * @returns Its state.
 */
export function projectState(project: Project): ProjectState {
  return project.status ?? "unknown";
}

/**
 * The response-time readout.
 *
 * @param ms - Milliseconds, if observed.
 * @param state - The project's state.
 * @returns "142ms", "1.9s", "DOWN" or "—".
 */
export function readout(ms: number | undefined, state: ProjectState): string {
  if (state === "down") return "DOWN";
  if (state === "unknown" || ms === undefined) return "—";
  return ms < 1000
    ? `${String(Math.round(ms))}ms`
    : `${(ms / 1000).toFixed(1)}s`;
}

/**
 * A short uptime: days, hours or minutes.
 *
 * @param seconds - Uptime in seconds.
 * @returns "4d", "11h", "35m" or "<1m".
 */
export function uptime(seconds: number): string {
  if (seconds >= 86_400) return `${String(Math.floor(seconds / 86_400))}d`;
  if (seconds >= 3600) return `${String(Math.floor(seconds / 3600))}h`;
  if (seconds >= 60) return `${String(Math.floor(seconds / 60))}m`;
  return "<1m";
}

/**
 * A spoken uptime.
 *
 * @param seconds - Uptime in seconds.
 * @returns "4 days", "11 hours", "35 minutes" or "under a minute".
 */
export function uptimeWords(seconds: number): string {
  const plural = (count: number, unit: string) =>
    `${String(count)} ${unit}${count === 1 ? "" : "s"}`;
  if (seconds >= 86_400) return plural(Math.floor(seconds / 86_400), "day");
  if (seconds >= 3600) return plural(Math.floor(seconds / 3600), "hour");
  if (seconds >= 60) return plural(Math.floor(seconds / 60), "minute");
  return "under a minute";
}

/**
 * How long ago something was observed, for "snapshot 8 min old" and "sample 2 days old".
 *
 * @param iso - Observation time.
 * @param now - The display clock.
 * @returns "under a minute", "8 min", "5 h" or "2 days"; null when unknown.
 */
export function age(iso: string | null | undefined, now: Date): string | null {
  const then = iso ? Date.parse(iso) : Number.NaN;
  if (!Number.isFinite(then)) return null;
  const minutes = Math.max(0, Math.floor((now.getTime() - then) / 60_000));
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${String(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${String(hours)} h`;
  return `${String(Math.floor(hours / 24))} days`;
}

/**
 * A section's freshness caption under its unit count.
 *
 * @param source - The section's live source state.
 * @param now - The display clock.
 * @returns "checked 3 min ago", "STALE · 5 h old" or "NO DATA".
 */
export function sourceCaption(source: SourceState, now: Date): string {
  const old = age(source.observedAt, now);
  if (source.state === "fresh") return old ? `checked ${old} ago` : "checked";
  if (source.state === "stale") return old ? `STALE · ${old} old` : "STALE";
  return "NO DATA";
}

/**
 * The second line of a game server's display.
 *
 * @param server - The server, reduced to identity with an unknown state when stale.
 * @param source - The servers source state.
 * @param now - The display clock.
 * @returns Players and uptime, a transition word, or the sample age.
 */
export function serverActivity(
  server: LiveServer,
  source: SourceState,
  now: Date,
): string {
  switch (server.state) {
    case "running": {
      const players =
        server.players === undefined
          ? "players —"
          : `${String(server.players)}/${String(server.maxPlayers ?? "?")} players`;
      return server.uptimeSec === undefined
        ? players
        : `${players} · up ${uptime(server.uptimeSec)}`;
    }
    case "starting":
      return "booting…";
    case "stopping":
      return "stopping…";
    case "offline":
      return "offline";
    case "maintenance":
      return "under maintenance";
    case "unknown": {
      const old = age(source.observedAt, now);
      return old ? `sample ${old} old` : "no data";
    }
  }
}

/**
 * The time of day in the viewer's locale and time zone.
 *
 * @param now - The display clock.
 * @returns For example "7:42 PM".
 */
export function clock(now: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
}
