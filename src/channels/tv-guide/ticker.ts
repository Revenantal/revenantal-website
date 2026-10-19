import type { Live, LiveFreshness, Project } from "../../data/types";
import { timeAgo } from "./time";

/**
 * The LIVE ticker: what is true right now. The page holds one snapshot, so there are no
 * "changed" items; stale sources say nothing.
 *
 * @param input - Data from props.
 * @param input.projects - Visible projects, with status merged when fresh.
 * @param input.live - The freshness-filtered live data.
 * @param input.freshness - Per-source state.
 * @param input.now - The display clock.
 * @returns Ticker items, never empty.
 */
export function tickerItems({
  projects,
  live,
  freshness,
  now,
}: {
  projects: Project[];
  live: Live | null;
  freshness: LiveFreshness;
  now: Date;
}): string[] {
  const items: string[] = [];
  const steam = live?.steam;
  const recent = steam?.recent[0];
  if (freshness.steam.state === "fresh" && recent)
    items.push(
      steam.status === "in-game"
        ? `revenantal is playing ${recent.name}`
        : `revenantal has been playing ${recent.name} lately`,
    );
  const pushes = [...(live?.github?.repos ?? [])]
    .sort((left, right) => right.pushedAt.localeCompare(left.pushedAt))
    .slice(0, 2);
  for (const repo of pushes) {
    const ago = timeAgo(repo.pushedAt, now);
    if (ago) items.push(`${repo.name} pushed ${ago}`);
  }
  if (freshness.servers.state === "fresh")
    for (const server of live?.servers ?? []) {
      if (server.state !== "running") continue;
      items.push(
        server.players === undefined
          ? `${server.name} is running`
          : `${server.name}: ${String(server.players)} ${server.players === 1 ? "player" : "players"} online`,
      );
    }
  for (const project of projects)
    if (project.status === "down" || project.status === "slow")
      items.push(`${project.name} is ${project.status}`);
  return items.length > 0 ? items : ["Welcome to the revenantal guide"];
}
