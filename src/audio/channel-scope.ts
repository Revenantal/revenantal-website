import type { ChannelAudio, LoopAsset, SoundAsset } from "@data/types";

/** Bounded playback controls a channel may pass. */
export type ScopeOptions = { gain?: number; rate?: number };

/** What a scope needs from the engine; read on every refresh, never cached. */
export type ScopeHost = {
  context: () => AudioContext | null;
  output: () => AudioNode | null;
  /** Power, SND, volume and tab visibility all allow sound. */
  audible: () => boolean;
  /** Viewer volume as 0..1, applied once per sound. */
  level: () => number;
  /** The OSD is showing; music ducks to 30%. */
  ducked: () => boolean;
  fetcher: typeof fetch;
};

type Loop = {
  asset: LoopAsset;
  requested: boolean;
  gain: number;
  rate: number;
  voice: { source: AudioBufferSourceNode; level: GainNode } | null;
};

const MUSIC_FADE_S = 0.6;
const DUCK = 0.3;

const clamp = (
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

// Channel assets must be same-origin files under /assets/; anything else is ignored.
const safeSource = (src: string) =>
  src.startsWith("/assets/") && !src.includes("..") && !src.includes("//");

/**
 * One channel's sound scope. It loads only that channel's declared assets, plays one-shots,
 * keeps one voice per loop, fades music in and ducks it under the OSD, and stops everything
 * while inactive. After dispose, every call is ignored.
 *
 * @param audio - The channel manifest's sound and loop declarations.
 * @param host - The engine's context, output and gating.
 * @returns The scope's play/setLoop adapters and lifecycle controls.
 */
export function createChannelScope(
  audio: ChannelAudio | undefined,
  host: ScopeHost,
) {
  const sounds = new Map<string, SoundAsset>(
    Object.entries(audio?.sounds ?? {}).filter(([, asset]) =>
      safeSource(asset.src),
    ),
  );
  const loops = new Map<string, Loop>(
    Object.entries(audio?.loops ?? {})
      .filter(([, asset]) => safeSource(asset.src))
      .map(([id, asset]) => [
        id,
        {
          asset,
          requested: (asset.start ?? "on-active") === "on-active",
          gain: 1,
          rate: 1,
          voice: null,
        },
      ]),
  );
  const buffers = new Map<string, AudioBuffer>();
  let active = false;
  let disposed = false;
  let loading: Promise<void> | null = null;

  const running = () =>
    active && !disposed && host.audible() && host.context() !== null;

  async function load() {
    const context = host.context();
    if (!context || loading) return loading ?? undefined;
    const sources = new Set(
      [
        ...sounds.values(),
        ...[...loops.values()].map((loop) => loop.asset),
      ].map((asset) => asset.src),
    );
    loading = Promise.all(
      [...sources].map(async (src) => {
        try {
          const response = await host.fetcher(src);
          if (!response.ok) return;
          buffers.set(
            src,
            await context.decodeAudioData(await response.arrayBuffer()),
          );
        } catch {
          /* A missing asset stays silent. */
        }
      }),
    ).then(() => {
      refresh();
    });
    return loading;
  }

  function loopGain(loop: Loop) {
    const duck = loop.asset.kind === "music" && host.ducked() ? DUCK : 1;
    return (loop.asset.gain ?? 1) * loop.gain * host.level() * duck;
  }

  function stopVoice(loop: Loop) {
    if (!loop.voice) return;
    try {
      loop.voice.source.stop();
    } catch {
      /* Already stopped. */
    }
    loop.voice.source.disconnect();
    loop.voice = null;
  }

  /** Starts, updates or stops every loop to match requests and gating. */
  function refresh() {
    const context = host.context();
    const output = host.output();
    for (const loop of loops.values()) {
      const buffer = buffers.get(loop.asset.src);
      if (!running() || !loop.requested || !buffer || !context || !output) {
        stopVoice(loop);
        continue;
      }
      const target = loopGain(loop);
      if (loop.voice) {
        loop.voice.level.gain.setTargetAtTime(
          target,
          context.currentTime,
          0.08,
        );
        loop.voice.source.playbackRate.value = loop.rate;
        continue;
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = loop.rate;
      const level = context.createGain();
      if (loop.asset.kind === "music") {
        level.gain.setValueAtTime(0, context.currentTime);
        level.gain.linearRampToValueAtTime(
          target,
          context.currentTime + MUSIC_FADE_S,
        );
      } else level.gain.value = target;
      source.connect(level);
      level.connect(output);
      source.start();
      loop.voice = { source, level };
    }
  }

  return {
    /**
     * Plays one declared one-shot; ignored when unknown, inactive, locked or muted.
     *
     * @param id - Sound ID from the manifest.
     * @param options - Local gain (0..1) and rate (0.5..2).
     */
    play(id: string, options: ScopeOptions = {}) {
      const asset = sounds.get(id);
      const context = host.context();
      const output = host.output();
      if (!asset || !running() || !context || !output) return;
      const buffer = buffers.get(asset.src);
      if (!buffer) return;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = clamp(options.rate, 0.5, 2, 1);
      const level = context.createGain();
      level.gain.value =
        (asset.gain ?? 1) * clamp(options.gain, 0, 1, 1) * host.level();
      source.connect(level);
      level.connect(output);
      source.start();
    },
    /**
     * Declares whether a loop should run and updates its local gain and rate.
     *
     * @param id - Loop ID from the manifest.
     * @param playing - Whether the loop should run.
     * @param options - Local gain (0..1) and rate (0.5..2).
     */
    setLoop(id: string, playing: boolean, options: ScopeOptions = {}) {
      const loop = loops.get(id);
      if (!loop || disposed) return;
      loop.requested = playing;
      loop.gain = clamp(options.gain, 0, 1, loop.gain);
      loop.rate = clamp(options.rate, 0.5, 2, loop.rate);
      refresh();
    },
    /**
     * Activates or pauses the scope; loops resume where requested.
     *
     * @param next - Whether the channel is active.
     */
    setActive(next: boolean) {
      if (disposed) return;
      active = next;
      if (active) void load();
      refresh();
    },
    /** Re-applies gating after engine changes (unlock, volume, SND, power, OSD, tab). */
    refresh() {
      if (disposed) return;
      if (active && host.context()) void load();
      refresh();
    },
    /** Stops everything and ignores all later calls. */
    dispose() {
      disposed = true;
      for (const loop of loops.values()) stopVoice(loop);
    },
  };
}

/** One channel's audio scope. */
export type ChannelScope = ReturnType<typeof createChannelScope>;
