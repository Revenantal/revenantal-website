import type { ComponentType } from "preact";
import type {
  BroadcastPlaylist,
  Channel,
  DialPosition,
  Live,
  LiveFreshness,
  Project,
  Site,
} from "../../data/types";

/** JSON-only values stored in channel saves. */
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/** Host-provided save access, already scoped to this channel id. */
export type ChannelSave = {
  load: <T>(version: number, parse: (value: unknown) => T | null) => T | null;
  store: (version: number, value: JsonValue) => boolean;
  reset: () => boolean;
};

/** Bounded playback controls; these never change the viewer volume setting. */
export type SoundOptions = {
  gain?: number; // 0..1, default 1
  rate?: number; // 0.5..2, default 1
};

/** Limited TV commands for a currently active channel. */
export type ChannelHost = {
  tune: (channelId: string) => boolean;
  powerOff: () => void;
};

/** Everything a channel can read or request from its host. */
export type ChannelProps = {
  projects: Project[];
  servers: Live["servers"];
  live: Live | null;
  freshness: LiveFreshness; // per-source fresh/stale/unavailable, from the host's filter
  links: Site["links"];
  credits: Site["credits"];
  broadcast: BroadcastPlaylist | null; // only this channel’s playlist
  now: Date; // shared 20-second display clock, not a media playback clock
  active: boolean; // false during static, while away/off, or with the tab hidden
  reducedMotion: boolean;
  volume: number; // effective 0..1 after viewer volume, SND and playback gating
  play: (soundId: string, options?: SoundOptions) => void;
  setLoop: (loopId: string, playing: boolean, options?: SoundOptions) => void;
  captions: boolean;
  setCaptions: (enabled: boolean) => void;
  host: ChannelHost;
  captured: boolean;
  requestCapture: () => void;
  releaseCapture: () => void;
  save: ChannelSave;
};

/** The loader adapts a named component export; no default exports are needed. */
export type ChannelModule = {
  ChannelComponent: ComponentType<ChannelProps>;
};

/** The registry can read metadata without loading component code or heavy dependencies. */
export type ChannelManifest = Channel & {
  load: () => Promise<ChannelModule>;
};

/** Missing position keys show NO SIGNAL. */
export type ChannelRegistry = Readonly<
  Partial<Record<DialPosition, ChannelManifest | null>>
>;
