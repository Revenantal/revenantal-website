import type { ChannelAudio } from "@data/types";
import { createChannelScope } from "./channel-scope";
import type { ChannelScope } from "./channel-scope";

/** The TV's own recorded sounds, by event. */
export type TvSound =
  | "btn_down"
  | "btn_up"
  | "dial"
  | "vol"
  | "toggle"
  | "static"
  | "power_btn"
  | "crt_on"
  | "door_open"
  | "door_close";

/** What the ambient bed follows. */
export type AmbientState = {
  power: boolean;
  snd: boolean;
  /** Viewer volume, 0..10. */
  volume: number;
  /** NO SIGNAL hiss. */
  noSignal: boolean;
  /** Drag-tuning distance from a detent, 0..1, adds hiss. */
  detune: number;
};

type Synth = "down" | "up" | "dial" | "vol" | "door" | "static";

/** Per-event gain factor and the synthesized fallback used if its file is missing. */
export const TV_SOUNDS: Record<TvSound, { gain: number; fallback: Synth }> = {
  btn_down: { gain: 1, fallback: "down" },
  btn_up: { gain: 0.8, fallback: "up" },
  dial: { gain: 0.9, fallback: "dial" },
  vol: { gain: 0.55, fallback: "vol" },
  toggle: { gain: 0.75, fallback: "vol" },
  static: { gain: 0.7, fallback: "static" },
  power_btn: { gain: 1, fallback: "down" },
  crt_on: { gain: 0.85, fallback: "static" },
  door_open: { gain: 1, fallback: "door" },
  door_close: { gain: 1, fallback: "door" },
};

const SOUND_URL = (name: TvSound) => `/assets/sounds/${name}.m4a`;

/** Options for the engine's browser boundaries, injectable for tests. */
export type AudioEngineOptions = {
  fetcher?: typeof fetch;
  createContext?: () => AudioContext;
};

/**
 * Host-owned audio for the TV: recorded one-shots (with synthesized fallbacks), and the
 * ambient hum, tube whine and hiss. Files download on preload, but no AudioContext exists
 * until the first viewer gesture calls unlock; nothing plays before that.
 *
 * @param options - Injectable fetch and AudioContext factory.
 * @returns The engine.
 */
export function createAudioEngine(options: AudioEngineOptions = {}) {
  const fetcher = options.fetcher ?? fetch.bind(globalThis);
  const createContext =
    options.createContext ??
    (() => new AudioContext({ latencyHint: "interactive" }));
  const files = new Map<TvSound, Promise<ArrayBuffer | null>>();
  const buffers = new Map<TvSound, AudioBuffer>();
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let ambient: { hum: GainNode; whine: GainNode; hiss: GainNode } | null = null;
  let state: AmbientState = {
    power: false,
    snd: true,
    volume: 5,
    noSignal: false,
    detune: 0,
  };
  let hidden = false;
  let ducked = false;
  const scopes = new Set<ChannelScope>();
  const refreshScopes = () => {
    for (const scope of scopes) scope.refresh();
  };

  const audible = () => state.power && state.snd && state.volume > 0 && !hidden;

  function preload() {
    for (const name of Object.keys(TV_SOUNDS) as TvSound[]) {
      if (files.has(name)) continue;
      files.set(
        name,
        fetcher(SOUND_URL(name))
          .then((response) => (response.ok ? response.arrayBuffer() : null))
          .catch(() => null),
      );
    }
  }

  function startAmbient(ctx: AudioContext, out: GainNode) {
    const hum = ctx.createGain();
    hum.gain.value = 0;
    hum.connect(out);
    for (const [frequency, level] of [
      [60, 1],
      [120, 0.6],
      [180, 0.35],
      [240, 0.2],
    ] as const) {
      const oscillator = ctx.createOscillator();
      oscillator.frequency.value = frequency;
      const gain = ctx.createGain();
      gain.gain.value = level;
      oscillator.connect(gain);
      gain.connect(hum);
      oscillator.start();
    }
    const whine = ctx.createGain();
    whine.gain.value = 0;
    whine.connect(out);
    const tone = ctx.createOscillator();
    tone.frequency.value = 15625;
    tone.connect(whine);
    tone.start();
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 2, () => 1);
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 3000;
    band.Q.value = 0.4;
    const hiss = ctx.createGain();
    hiss.gain.value = 0;
    noise.connect(band);
    band.connect(hiss);
    hiss.connect(out);
    noise.start();
    return { hum, whine, hiss };
  }

  function updateAmbient() {
    if (!context || !ambient) return;
    const now = context.currentTime;
    const on = audible();
    const level = state.volume / 10;
    ambient.hum.gain.setTargetAtTime(
      on ? 0.006 * level : 0,
      now,
      on ? 0.6 : 0.15,
    );
    ambient.whine.gain.setTargetAtTime(
      on ? 0.0018 * level : 0,
      now,
      on ? 0.9 : 0.12,
    );
    const hiss = (state.noSignal ? 0.035 : 0) + state.detune * 0.06;
    ambient.hiss.gain.setTargetAtTime(on ? hiss * level : 0, now, 0.08);
  }

  /**
   * Creates or resumes the AudioContext; call from the first pointer-down or key press.
   *
   * @returns Resolves once the context exists and buffers are decoded.
   */
  async function unlock() {
    if (!context) {
      try {
        context = createContext();
      } catch {
        return;
      }
      master = context.createGain();
      master.connect(context.destination);
      ambient = startAmbient(context, master);
      updateAmbient();
      const ctx = context;
      preload();
      await Promise.all(
        [...files].map(async ([name, file]) => {
          const data = await file;
          if (!data) return;
          try {
            buffers.set(name, await ctx.decodeAudioData(data.slice(0)));
          } catch {
            /* A missing or broken file falls back to its synthesized sound. */
          }
        }),
      );
    }
    if (context.state === "suspended" && !hidden) await context.resume();
    refreshScopes();
  }

  /**
   * Plays one TV sound at the viewer's volume; silent when locked, off, muted or hidden.
   *
   * @param name - The event's sound.
   */
  function play(name: TvSound) {
    if (!context || !master) return;
    if (!state.snd || state.volume === 0 || hidden) return;
    const { gain, fallback } = TV_SOUNDS[name];
    const buffer = buffers.get(name);
    if (buffer) {
      const source = context.createBufferSource();
      source.buffer = buffer;
      const level = context.createGain();
      level.gain.value = (state.volume / 10) * 0.9 * gain;
      source.connect(level);
      level.connect(master);
      source.start();
      return;
    }
    synth(context, master, fallback, 0.05 + (state.volume / 10) * 0.22);
  }

  return {
    preload,
    unlock,
    play,
    /**
     * Updates what the ambient bed follows.
     *
     * @param next - Power, SND, volume, NO SIGNAL and drag distance.
     */
    setAmbient(next: AmbientState) {
      state = next;
      updateAmbient();
      refreshScopes();
    },
    /**
     * Ducks channel music to 30% while the OSD shows.
     *
     * @param next - Whether the OSD is showing.
     */
    setDucked(next: boolean) {
      if (ducked === next) return;
      ducked = next;
      refreshScopes();
    },
    /**
     * Creates a sound scope for one mounted channel. Dispose it when the channel unmounts.
     *
     * @param audio - The channel manifest's sound and loop declarations.
     * @returns The scope.
     */
    createScope(audio: ChannelAudio | undefined) {
      const scope = createChannelScope(audio, {
        context: () => context,
        output: () => master,
        audible,
        level: () => state.volume / 10,
        ducked: () => ducked,
        fetcher,
      });
      scopes.add(scope);
      return {
        ...scope,
        dispose: () => {
          scope.dispose();
          scopes.delete(scope);
        },
      };
    },
    /**
     * Stops all output immediately while the tab is hidden, and resumes when shown.
     *
     * @param isHidden - Whether the tab is hidden.
     */
    setHidden(isHidden: boolean) {
      hidden = isHidden;
      if (!context) return;
      if (hidden) void context.suspend();
      else void context.resume();
      updateAmbient();
      refreshScopes();
    },
    /**
     * Whether the first gesture has unlocked audio.
     *
     * @returns True once the AudioContext exists.
     */
    get unlocked() {
      return context !== null;
    },
  };
}

/** The engine surface the TV uses. */
export type AudioEngine = ReturnType<typeof createAudioEngine>;

function noiseBuffer(
  ctx: AudioContext,
  seconds: number,
  envelope: (progress: number) => number,
) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index++)
    data[index] = (Math.random() * 2 - 1) * envelope(index / length);
  return buffer;
}

function hit(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  [from, to, duration, gain]: [number, number, number, number],
  type: OscillatorType = "sine",
) {
  const oscillator = ctx.createOscillator();
  const level = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);
  oscillator.frequency.exponentialRampToValueAtTime(to, at + duration * 0.8);
  level.gain.setValueAtTime(gain, at);
  level.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(level);
  level.connect(out);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

function click(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  [length, frequency, q, gain]: [number, number, number, number],
) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, length, (progress) => (1 - progress) ** 4);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const level = ctx.createGain();
  level.gain.value = gain;
  source.connect(filter);
  filter.connect(level);
  level.connect(out);
  source.start(at);
}

// Synthesized fallbacks from the prototype, used only when a recording is unavailable.
function synth(ctx: AudioContext, out: AudioNode, kind: Synth, v: number) {
  const t = ctx.currentTime;
  if (kind === "down") {
    hit(ctx, out, t, [95, 38, 0.2, v * 2.6]);
    hit(ctx, out, t, [220, 90, 0.06, v * 0.8], "triangle");
    click(ctx, out, t, [0.05, 700, 1.1, v * 3]);
  } else if (kind === "up") {
    click(ctx, out, t, [0.02, 2300, 2, v * 2]);
    hit(ctx, out, t, [150, 80, 0.05, v * 0.9]);
  } else if (kind === "dial") {
    click(ctx, out, t, [0.025, 2600, 2.5, v * 2.4]);
    click(ctx, out, t + 0.035, [0.03, 1900, 2, v * 2.6]);
    hit(ctx, out, t + 0.035, [170, 60, 0.12, v * 1.8]);
  } else if (kind === "vol") {
    click(ctx, out, t, [0.012, 3600, 3, v * 1.6]);
  } else if (kind === "door") {
    hit(ctx, out, t, [70, 30, 0.28, v * 2.4]);
    click(ctx, out, t, [0.09, 500, 0.8, v * 2]);
    click(ctx, out, t + 0.18, [0.03, 1400, 2, v * 1.6]);
  } else {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 0.5, (progress) => 1 - progress);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 700;
    const level = ctx.createGain();
    level.gain.value = v * 0.6;
    source.connect(filter);
    filter.connect(level);
    level.connect(out);
    source.start(t);
  }
}
