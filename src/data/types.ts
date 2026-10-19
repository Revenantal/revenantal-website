/** One directory project shared by every view. */
export type Project = {
  id: string; // slug, stable
  name: string;
  type: "site" | "tool" | "sandbox";
  url: string;
  host: string; // shown text, e.g. "x.revenantal.com"
  desc: string; // one line
  status?: "up" | "slow" | "down"; // from live data when available
  order?: number;
  hidden?: boolean;
};

/** Public display and address policy for a Pelican server. */
export type ServerOverride = {
  pelicanId: string; // short identifier from the panel URL, e.g. "1a2b3c4d"
  name?: string; // display name if the panel name is not wanted
  gamedig?: string; // GameDig type when the egg name doesn't map automatically
  showAddress?: boolean; // publish the connect address on Status (default false)
  hidden?: boolean;
};

/** One shared cabinet or List-mode action. */
export type PanelButton = {
  label: string;
  face: "cream" | "grey" | "dark";
  href?: string; // opens in a new tab
  action?: "copy" | "tune"; // copy: copies `copyValue` · tune: jumps the dial to `channel`
  copyValue?: string;
  copiedLabel?: string;
  channel?: string; // channel id for `tune`; List mode links a "status" tune button to its servers section and hides the rest
};

/** One shared source attribution. */
export type Credit = {
  title: string;
  author: string;
  url: string;
  license: string;
  edits?: string;
  usedFor: string;
};

/** One WebVTT caption track. */
export type BroadcastCaptions = {
  src: string;
  language: string;
  label: string;
};

/** One finite programme in a broadcast schedule. */
export type BroadcastItem = {
  id: string;
  title: string;
  src: string; // HLS playlist URL
  durationSec: number; // positive, finite; matches the encoded media
  captions: BroadcastCaptions[]; // at least one WebVTT track
};

/** A repeating channel playlist anchored to UTC. */
export type BroadcastPlaylist = {
  startsAt: string; // ISO timestamp with explicit UTC offset
  items: BroadcastItem[];
};

/** Validated static content shared by every view. */
export type Site = {
  projects: Project[];
  directory?: {
    source: "curated" | "github";
    limit: number;
    exclude?: string[]; // GitHub repository names; private to the live job, stripped from public site.json
  };
  buttons: PanelButton[]; // the stack re-spaces itself; 4 fit at 72% size
  servers: ServerOverride[];
  links: { steam: string; github: string; discord: string };
  credits: Credit[];
  broadcast: Record<string, BroadcastPlaylist>; // keyed by stable channel id; defaults to {}
};

/** A positive safe-integer dial position validated at the boundary. */
export type DialPosition = number;

/** The interaction category of a channel. */
export type ChannelKind =
  "directory" | "game" | "toy" | "broadcast" | "credits";

/** Channel requests that may only soften viewer display effects. */
export type DisplayProfile = {
  scan?: number | false; // 0..1, default 1
  flicker?: boolean; // default true
  glow?: number | false; // 0..1, default 1
  bloom?: boolean; // default true
  transition?: "static" | "cut"; // how the TV changes INTO this channel
};

/** One manifest-owned sound asset. */
export type SoundAsset = {
  src: string;
  gain?: number; // 0..1, default 1
};

/** Host-owned loop playback metadata. */
export type LoopAsset = SoundAsset & {
  kind: "music" | "ambient";
  start?: "on-active" | "manual"; // default on-active
};

/** Serializable sound and loop declarations. */
export type ChannelAudio = {
  sounds?: Record<string, SoundAsset>;
  loops?: Record<string, LoopAsset>;
};

/** Serializable channel manifest metadata. */
export type Channel = {
  id: string; // folder name under channels/
  name: string; // OSD + dial label, e.g. "TV GUIDE"
  kind: ChannelKind;
  bg: string; // screen colour behind the safe area; also drives room light level
  glow: string; // rgba used for the room light spill
  safe: boolean; // inset content to the title-safe area + stronger edge falloff
  display?: DisplayProfile;
  audio?: ChannelAudio;
};

/** An independently refreshed observation source. */
export type LiveSource = "steam" | "github" | "status" | "servers";

/** Observation and attempt metadata for one live source. */
export type SourceFreshness = {
  lastAttemptAt: string; // ISO time of this source attempt
  lastSuccessAt: string | null; // ISO time of the retained observation; null if none
  failed: boolean; // latest attempt failed; retained values are stale
};

/** How current one live source is, as shown to viewers. */
export type SourceState = {
  state: "fresh" | "stale" | "unavailable";
  observedAt: string | null; // ISO time of the retained observation
};

/** The state of every live source after freshness filtering. */
export type LiveFreshness = Record<LiveSource, SourceState>;

/** The raw public snapshot before freshness filtering. */
export type Live = {
  fetchedAt: string; // ISO time this aggregate was written
  sources: Partial<Record<LiveSource, SourceFreshness>>;
  steam?: {
    status: "online" | "offline" | "away" | "in-game";
    level: number;
    gamesOwned: number;
    hoursPast2Weeks: number;
    recent: {
      appId: number;
      name: string;
      hours2w: number;
      hoursTotal: number;
    }[];
  };
  github?: {
    projects?: Project[]; // navigation identities may remain when activity is stale
    repos: { name: string; pushedAt: string; lang: string; url: string }[];
  };
  status?: Record<
    string /* project id */,
    { state: "up" | "slow" | "down"; ms?: number }
  >;
  servers?: LiveServer[]; // from scheduled Pelican API collection
  errors?: string[]; // bounded public error codes; no raw diagnostics
};

/** One sanitized public server observation. */
export type LiveServer = {
  id: string;
  name: string;
  game: string;
  state:
    "running" | "starting" | "stopping" | "offline" | "maintenance" | "unknown";
  players?: number;
  maxPlayers?: number;
  map?: string;
  uptimeSec?: number;
  address?: string; // only when showAddress is true
  pingMs?: number; // GameDig
  passworded?: boolean; // GameDig
  version?: string; // GameDig / startup variables
  cpuPct?: number; // Pelican resources
  memMb?: number; // Pelican resources
  memLimitMb?: number; // Pelican limits
  netRxBps?: number; // Pelican resources; drives tray light speed
  netTxBps?: number;
  nextRestart?: string; // Pelican schedules (extra permission)
  lastBackup?: string; // Pelican backups (extra permission)
};
