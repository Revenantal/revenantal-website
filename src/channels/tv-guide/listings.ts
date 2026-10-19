import type { Live, LiveServer, Project, SourceState } from "../../data/types";
import type { DialChannel } from "./dial";
import { timeAgo } from "./time";

/** Which icon a row's channel cell shows. */
export type RowIcon =
  "site" | "tool" | "sandbox" | "server" | "steam" | "git" | "dial";

/** One programme block in a row; spans fill the three half-hour columns. */
export type Block = {
  title: string;
  detail: string;
  span: 1 | 2 | 3;
  tag?: string;
};

/** One listings row. */
export type Row = {
  key: string;
  icon: RowIcon;
  callsign: string;
  sub: string;
  blocks: Block[];
  /** Projects open in a new tab; other channels tune the TV; the rest is information only. */
  action:
    | { kind: "link"; url: string }
    | { kind: "tune"; channelId: string }
    | { kind: "none" };
  /** Spoken summary for the row. */
  label: string;
};

const TYPE_LABEL: Record<Project["type"], string> = {
  site: "Site",
  tool: "Tool",
  sandbox: "Sandbox",
};

/**
 * A four-character call sign from a name, like a cable channel: "PRJA" for "Project A".
 *
 * @param name - The name.
 * @param fallback - Used when the name has no letters or digits.
 * @returns Up to four upper-case characters.
 */
export function callsign(name: string, fallback: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (letters.slice(0, 4) || fallback).padEnd(2, fallback);
}

/**
 * A project's row. A project that is up gets a LIVE badge; the block layout varies by
 * position so the grid reads like real listings.
 *
 * @param project - The project.
 * @param index - Its position in the list.
 * @returns The row.
 */
export function projectRow(project: Project, index: number): Row {
  const live = project.status === "up";
  const main: Block = {
    title: project.name,
    detail: project.desc,
    span: 3,
    ...(live ? { tag: "LIVE" } : {}),
  };
  const blocks: Block[] =
    index % 3 === 0
      ? [
          { ...main, span: 2 },
          { title: project.name, detail: "(cont'd)", span: 1 },
        ]
      : index % 3 === 1
        ? [
            { title: project.name, detail: TYPE_LABEL[project.type], span: 1 },
            { ...main, span: 2 },
          ]
        : [
            {
              ...main,
              detail: `${TYPE_LABEL[project.type]} · ${project.desc}`,
            },
          ];
  const state =
    project.status === undefined ? "status unknown" : project.status;
  return {
    key: `project-${project.id}`,
    icon: project.type,
    callsign: callsign(project.name, "PRJ"),
    sub: project.host,
    blocks,
    action: { kind: "link", url: project.url },
    label: `${project.name}, ${state}. ${project.desc} (opens in a new tab)`,
  };
}

const STATE_WORD: Record<LiveServer["state"], string> = {
  running: "running",
  starting: "starting",
  stopping: "stopping",
  offline: "offline",
  maintenance: "maintenance",
  unknown: "status unknown",
};

/**
 * A game server's row: information only. Player counts appear only when observed.
 *
 * @param server - The server, reduced to identity when its data is stale.
 * @param index - Its position, for the call sign.
 * @returns The row.
 */
export function serverRow(server: LiveServer, index: number): Row {
  const players =
    server.state === "running" && server.players !== undefined
      ? `${String(server.players)}/${String(server.maxPlayers ?? "?")}`
      : undefined;
  const detail =
    server.state === "running"
      ? players
        ? `${players.replace("/", " of ")} players`
        : "Running now"
      : server.state === "unknown"
        ? "Status unknown"
        : `Currently ${STATE_WORD[server.state]}`;
  return {
    key: `server-${server.id}`,
    icon: "server",
    callsign: `SRV${String(index + 1)}`,
    sub: "game server",
    blocks: [
      {
        title: `${server.name} · ${STATE_WORD[server.state]}`,
        detail: `${server.game} · ${detail}`,
        span: 3,
        ...(players ? { tag: players } : {}),
      },
    ],
    action: { kind: "none" },
    label: `${server.name}, ${server.game}, ${STATE_WORD[server.state]}${players ? `, ${players.replace("/", " of ")} players` : ""}`,
  };
}

/**
 * The listing rows: projects, game servers, what's playing on Steam, the latest GitHub
 * push, then the other channels on the dial.
 *
 * @param input - Data from props.
 * @param input.projects - Visible projects.
 * @param input.servers - Game servers.
 * @param input.live - The freshness-filtered live data.
 * @param input.steam - Freshness of the Steam source.
 * @param input.dial - The other channels on the dial.
 * @param input.now - The display clock.
 * @returns The rows, in order.
 */
export function buildRows({
  projects,
  servers,
  live,
  steam,
  dial,
  now,
}: {
  projects: Project[];
  servers: LiveServer[];
  live: Live | null;
  steam: SourceState;
  dial: DialChannel[];
  now: Date;
}): Row[] {
  const rows = [...projects.map(projectRow), ...servers.map(serverRow)];
  const recent = live?.steam?.recent[0];
  if (recent && steam.state === "fresh")
    rows.push({
      key: "steam",
      icon: "steam",
      callsign: "STM",
      sub: "now playing",
      blocks: [
        {
          title: recent.name,
          detail: `${recent.hours2w.toFixed(1)} hours in the past two weeks`,
          span: 3,
        },
      ],
      action: { kind: "none" },
      label: `Steam: ${recent.name}, ${recent.hours2w.toFixed(1)} hours in the past two weeks`,
    });
  const push = [...(live?.github?.repos ?? [])].sort((left, right) =>
    right.pushedAt.localeCompare(left.pushedAt),
  )[0];
  const ago = push ? timeAgo(push.pushedAt, now) : null;
  if (push && ago)
    rows.push({
      key: "github",
      icon: "git",
      callsign: "GIT",
      sub: "latest push",
      blocks: [{ title: push.name, detail: `Pushed ${ago}`, span: 3 }],
      action: { kind: "none" },
      label: `GitHub: ${push.name}, pushed ${ago}`,
    });
  for (const channel of dial)
    rows.push({
      key: `dial-${channel.id}`,
      icon: "dial",
      callsign: channel.label,
      sub: "on the dial",
      blocks: [{ title: channel.title, detail: channel.blurb, span: 3 }],
      action: { kind: "tune", channelId: channel.id },
      label: `${channel.label}, ${channel.title}: ${channel.blurb}. Tune to this channel`,
    });
  return rows;
}
