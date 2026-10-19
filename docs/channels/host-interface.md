# Channel Host Interface

The boundary between a channel and the TV. These are the agreed interfaces to implement during the existing build tasks; this document does not approve any individual channel build.

## Ownership

- `src/data/types.ts` owns serializable content and manifest metadata, including playlists and sound asset descriptions.
- `src/channels/_shared/types.ts` owns the types below. Channels import them as types; they do not import a store, audio engine or TV module.
- `src/tv/Screen.tsx` supplies props and scoped callbacks. The store owns preferences/actions, the audio module owns sound nodes, and the shared broadcast player owns its video element.

## Shared Types

```ts
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
```

A manifest loader adapts its named export as `load: async () => ({ ChannelComponent: (await import('./ChannelComponent')).ChannelComponent })`; importing a manifest must not eagerly import that component or its heavy dependencies. The loader itself is defined in that channel’s manifest, and only the host calls it.

## Data and Lifecycle

The host passes visible, ordered projects and the freshness-filtered live view described in [Live Data](../architecture/live-data.md), plus `freshness`: each source's state (fresh, stale or unavailable) and observation time, so channels label ages without recomputing them. Shared links and credits come from `site.json`. `broadcast` is `site.broadcast[manifest.id] ?? null` for a broadcast manifest and null for every other kind. Channels must not mutate the supplied data.

`active` combines tune state, power, transition state and tab visibility. All channel loops, timers and shared media pause when false. The TV input/lifecycle layer owns visibility listeners; channels do not add global listeners. `reducedMotion` is supplied even when a viewer manually enables TV mode, so Credits and other channels can choose their static version.

Each mounted channel gets a host scope. On leaving it, the host releases captured keys, stops its audio/media and invalidates its callbacks. Old asynchronous work cannot retune the TV, change captions or restart audio after its scope is gone. If a lazy import finishes after the viewer tunes elsewhere, discard that result instead of mounting it. A load/render failure shows a recoverable channel error while the TV controls and List mode remain usable.

## TV Actions

- `host.powerOff()` calls the normal `setPower(false)` action. Rev OS uses it for Shut Down. It does not manipulate the cabinet DOM or invent a power URL.
- `host.tune(id)` resolves the stable channel ID through the registry and uses the same `setChannel` path as the dial. It returns false for an unregistered ID, inactive/stale scope or powered-off TV, with no URL/state change. It returns true for a registered target, including the current channel.
- These mutations are accepted only from the current active channel. Navigating to a project remains a normal link; internal tune controls use the callback. Existing external `#chN` links remain supported by the TV URL layer.

## Captions and Broadcasts

`captions` is the single preference from `rv-settings`, defaulting to true when there is no stored preference. `setCaptions` calls the host/store action and persists through the same guarded storage path as volume. The host input layer handles C once for an active broadcast channel, except while typing in an input. A visible caption control uses the same callback; channels do not register another C listener.

The shared broadcast player receives `broadcast`, `active`, `volume` and `captions`. It owns HLS loading, the video element, seeking and caption tracks. Video audio is the explicit media exception to host-owned Web Audio buffers; it follows the supplied effective volume and is silent until the first viewer interaction. On inactive/hidden state, pause it immediately. On return, recompute schedule position from wall-clock time and seek before resuming. The 20-second `now` prop is for labels and clocks, not exact playback synchronization.

A null playlist shows an unavailable programme state with no media request. An empty/invalid playlist is rejected at the content boundary, never used as a zero-length schedule. Captions apply immediately and persist across tuning between both broadcast channels and across reloads. Playlist timing and source choices still receive their individual channel review.

## Audio

Manifest `audio.sounds` and `audio.loops` map local IDs to assets. The audio module loads only the tuned channel’s assets and returns the `play`/`setLoop` adapters. IDs cannot address another channel’s sounds or accept arbitrary URLs. Shared recordings can be referenced by the manifest without importing another channel.

- `play(id, options)` plays one one-shot. It ignores unknown IDs, inactive/stale scopes and locked/muted playback; requests made before unlock are not queued. Gain/rate options are validated and clamped to the documented ranges.
- `setLoop(id, playing, options)` declares whether a registered loop should run and updates its local gain/rate. Repeating the call updates one existing loop; it never stacks voices.
- Manifest loops default to `start: on-active`. `start: manual` loops, such as an engine whose intensity changes, start only after `setLoop(id, true, ...)`. `setLoop(id, false)` stops that loop and clears its requested state.
- The host gates every loop by active state, power, SND, volume and audio unlock. It suspends output while inactive/hidden/muted. Within a still-mounted scope it retains playback position/requested state and recreates stopped nodes on resume; disposing the scope clears both. No channel audio survives disposal.
- Music fades in over 0.6 seconds after the static clears and ducks to 30% under the OSD. Ambient loops do not use music ducking. Viewer volume and SND still affect all output.
- When power turns off, the tab hides or tuning begins, channel output stops immediately; fades must not leave sound playing in List mode. Each sound uses its asset gain × requested local gain × the effective viewer gain. Apply the viewer gain once.

The effective `volume` prop is zero when inactive, power is off, SND is off, volume is zero or audio is locked. Otherwise it is the knob level divided by ten. HTML video uses that value; buffer audio applies the same gate through its host mixer. No channel creates AudioContext, Audio nodes or its own audio element. Only the shared broadcast player owns a video element with audio.

## Input and Saves

`requestCapture()` is accepted only for an explicit user activation within the current active glass. It supports games/toys, Status selection and keyboard-driven Rev OS toys without granting global event access. The host keeps Esc, outside clicks, tune-away, power-off and hidden-tab release. `releaseCapture()` is safe to call repeatedly. Focused text inputs keep their own editing keys without needing game capture.

Saves are always scoped to `rv-save-<manifest.id>`. `load(version, parse)` validates the versioned envelope and runs the supplied parser on unknown data, returning null for absent, mismatched, malformed or rejected saves. `store` accepts finite JSON data and returns false for invalid values or blocked/quota-limited storage. `reset` removes only that channel’s save. All storage and parser failures are contained; they never break tuning. Save flushing and capture release are allowed during cleanup of the owned scope; obsolete scopes cannot write after disposal.

## Required Verification

During tasks 2.4/2.6 and 3.1, verify:

- Fixtures supply every required prop, with null playlist, no audio manifest, empty credits/projects and missing/stale live data.
- Named component loaders remain lazy, duplicate IDs and invalid position keys fail validation, and late load results cannot replace the selected channel.
- Rev OS shutdown takes the same path as the power control, and tune callbacks respect skipped channels and stable IDs.
- Caption UI and C change one shared persisted preference; blocked storage does not break playback. Missing playlists make no media requests.
- Repeated loop requests create one voice; unknown sound IDs are harmless; music ducking, manual loops, mute/unlock and gain multiplication behave as specified.
- Tune-away, hidden tabs and power-off pause video and stop every sound, release keys and reject stale callbacks. Media resumes at schedule position.
- Versioned saves reject malformed values, cannot access another namespace, and handle quota/storage/parser errors.

Type-check the contract and positive/negative consumer examples under strict TypeScript with `noUncheckedIndexedAccess`. Runtime assertions above remain required when the host is implemented; a type check cannot prove lifecycle cleanup.

Historical verification before the expandable-dial revision on 2026-10-18: extracted the actual data-model and host-interface TypeScript blocks into an ignored scratch directory and compiled them against Preact under strict mode with `noUncheckedIndexedAccess`. Valid consumers compiled, and ten `@ts-expect-error` assertions confirmed rejection of invalid IDs/types, non-JSON save values, positions outside the former fixed range, the wrong lazy-module shape and unavailable host/audio APIs. No application or individual channel was implemented for this check.

Task 3.1 verification on 2026-10-19: the reusable contract suite (`src/channels/_shared/testing/`) supplies full fixtures and checks rendering, project links, side effects, inactive pausing and scope cleanup for any channel; its own tests prove it fails channels that break each rule. `src/tv/host-actions.test.tsx` checks `host.tune` (unknown IDs refused, reserved and current IDs accepted, stale scopes refused) and `host.powerOff` through the real TV and store. The registry now rejects manifests with an invalid kind, colours, display profile or audio. Capture, saves, captions and media checks remain with tasks 4.3 and 4.5.

Expandable-dial verification on 2026-10-18: re-extracted the revised types and passed strict TypeScript checking with noUncheckedIndexedAccess. Positive fixtures include a channel at position 14 and a null slot at 15; ten negative assertions still reject invalid API/data/module shapes and nonnumeric registry keys. Positive safe-integer position validation is a runtime boundary requirement, not something the number alias proves.
