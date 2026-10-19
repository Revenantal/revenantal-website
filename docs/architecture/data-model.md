# Data Model

All content lives in `site.json` (built from hand-edited `content/*.json`) and `live.json` (generated). Every view renders from these two. Nothing is hard-coded in components.

Types live in `src/data/types.ts`. Each `content/` file has a zod schema, so a typo fails the build instead of the page.

## Content Compilation

content/directory.json selects github or curated navigation and a limit of 1–30 (default ten). Curated entries live in projects.json; GitHub entries arrive in live.github.projects through the scheduled job. The store selects one source for all views. Retained repository links stay available with stale metadata, while old current-state telemetry is removed.

links.json owns profile values. buttons.json refers to link/copy keys that the build resolves once; tune actions stay symbolic channel IDs. Optional server overrides default to an empty array and missing playlists to an empty map. Nonempty playlists must target registered broadcast channels. Hidden curated projects are removed from public site.json. credits.json also generates CREDITS.md; builds reject mismatched credits.

## Content Types

```ts
type Project = {
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

/** Optional per-server overrides; which servers appear is decided in Pelican. */
type ServerOverride = {
  pelicanId: string; // short identifier from the panel URL, e.g. "1a2b3c4d"
  name?: string; // display name if the panel name is not wanted
  gamedig?: string; // GameDig type when the egg name doesn't map automatically
  showAddress?: boolean; // publish the connect address on Status (default false)
  hidden?: boolean;
};

type PanelButton = {
  label: string;
  face: "cream" | "grey" | "dark";
  href?: string; // opens in a new tab
  action?: "copy" | "tune"; // copy: copies `copyValue` · tune: jumps the dial to `channel`
  copyValue?: string;
  copiedLabel?: string;
  channel?: string; // channel id for `tune`; tune buttons are hidden in List mode
};

type Credit = {
  title: string;
  author: string;
  url: string;
  license: string;
  edits?: string;
  usedFor: string;
};

/** Captions for one playlist item. */
type BroadcastCaptions = {
  src: string;
  language: string;
  label: string;
};

/** One finite programme in a repeating broadcast schedule. */
type BroadcastItem = {
  id: string;
  title: string;
  src: string; // HLS playlist URL
  durationSec: number; // positive, finite; matches the encoded media
  captions: BroadcastCaptions[]; // at least one WebVTT track
};

/** Shared start time and ordered programmes for one broadcast channel. */
type BroadcastPlaylist = {
  startsAt: string; // ISO timestamp with explicit UTC offset
  items: BroadcastItem[];
};

/** Built from content/*.json at build time. */
type Site = {
  projects: Project[];
  directory?: { source: "curated" | "github"; limit: number };
  buttons: PanelButton[]; // the stack re-spaces itself; 4 fit at 72% size
  servers: ServerOverride[];
  links: { steam: string; github: string; discord: string };
  credits: Credit[];
  broadcast: Record<string, BroadcastPlaylist>; // keyed by stable channel id; defaults to {}
};
```

## Channel Types

These live in each channel's `manifest.ts`, not in `content/`.

```ts
/** Positive safe integer; validated at the registry boundary. */
type DialPosition = number;

type ChannelKind = "directory" | "game" | "toy" | "broadcast" | "credits";

type DisplayProfile = {
  scan?: number | false; // 0..1, default 1
  flicker?: boolean; // default true
  glow?: number | false; // 0..1, default 1
  bloom?: boolean; // default true
  transition?: "static" | "cut"; // how the TV changes INTO this channel
};

/** A host-loaded, channel-scoped sound asset. */
type SoundAsset = {
  src: string;
  gain?: number; // 0..1, default 1
};

/** Loop behavior is declared in the manifest; the host owns playback. */
type LoopAsset = SoundAsset & {
  kind: "music" | "ambient";
  start?: "on-active" | "manual"; // default on-active
};

/** Audio metadata does not create audio nodes or fetch assets on import. */
type ChannelAudio = {
  sounds?: Record<string, SoundAsset>;
  loops?: Record<string, LoopAsset>;
};

type Channel = {
  id: string; // folder name under channels/
  name: string; // OSD + dial label, e.g. "TV GUIDE"
  kind: ChannelKind;
  bg: string; // screen colour behind the safe area; also drives room light level
  glow: string; // rgba used for the room light spill
  safe: boolean; // inset content to the title-safe area + stronger edge falloff
  display?: DisplayProfile;
  audio?: ChannelAudio;
};
```

`Channel` is serializable manifest metadata. The component loader and position-keyed `ChannelRegistry` are defined in the [host interface](../channels/host-interface.md), keeping Preact/runtime types out of the data module. Sound IDs are local to a manifest; asset metadata is validated at the registry boundary and files load only when tuned.

`content/broadcast.json` builds into `Site.broadcast`. Until broadcast channels are configured, the file may be omitted and the build supplies `{}`. Validate positive finite durations, unique item IDs, valid start times, same-origin or HTTPS HLS/WebVTT URLs (reject executable schemes), and non-empty caption tracks. Configured playlists must contain at least one item. The build checks that playlist keys identify registered broadcast channels; data loaders do not import the channel registry. Missing configuration reaches the channel as `broadcast: null`.

## Live Type

Written by the live job. See `live-data.md` for sources and `pelican-agent.md` for the server fields.

```ts
type LiveSource = "steam" | "github" | "status" | "servers";

type SourceFreshness = {
  lastAttemptAt: string; // ISO time of this source attempt
  lastSuccessAt: string | null; // ISO time of the retained observation; null if none
  failed: boolean; // latest attempt failed; retained values are stale
};

type Live = {
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

type LiveServer = {
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
```

`maintenance` covers suspended or installing servers and shows as amber on Status. Final field set is confirmed when channel 10 is built (see `project-decisions.md`).

## Rules

- `channels/index.ts` is an object keyed by explicit `DialPosition` values, with manifest or null entries. Its highest configured key defines the dial range; validate keys and metadata before computing it. See [dial configuration](../tv/dial-configuration.md). Missing keys show NO SIGNAL, including gaps between built channels. Object insertion order never determines dial position.
- Channels may be deferred or omitted. Adding or removing one never renumbers another. Channel IDs stay stable; tune buttons resolve IDs through the registry.
- The store derives freshness from `sources` and the current time before passing data to any view. See `live-data.md` for age limits and stale-value handling.
- Projects never add channels. Every directory and game channel renders the full visible project list in its own style.
- Channels must render sensibly when `live` is `null`, and with 0, 1 and 30 projects.
- Broadcast playlists live in `content/broadcast.json` (see `docs/channels/channel-rules.md`).
