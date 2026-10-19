import { describe, expect, it, vi } from "vitest";
import { createAudioEngine } from "./engine";

// A minimal Web Audio stand-in that records what the engine asks for.
function fakeContext() {
  const started: { buffer: unknown; gain: number }[] = [];
  const targets: number[][] = [];
  const param = (initial = 0) => {
    const record: number[] = [];
    targets.push(record);
    return {
      value: initial,
      setTargetAtTime: (value: number) => record.push(value),
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };
  };
  const node = () => ({ connect: vi.fn() });
  const context = {
    state: "suspended" as AudioContextState,
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    createGain: () => {
      const gain = { ...node(), gain: param(1) };
      return gain;
    },
    createOscillator: () => ({
      ...node(),
      type: "sine",
      frequency: param(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createBiquadFilter: () => ({
      ...node(),
      type: "lowpass",
      frequency: param(),
      Q: param(),
    }),
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => {
      const source = {
        ...node(),
        buffer: null as unknown,
        loop: false,
        connect: (target: { gain?: { value: number } }) => {
          source.target = target;
        },
        target: null as { gain?: { value: number } } | null,
        start: () => {
          started.push({
            buffer: source.buffer,
            gain: source.target?.gain?.value ?? -1,
          });
        },
      };
      return source;
    },
    decodeAudioData: (data: ArrayBuffer) =>
      Promise.resolve({ decoded: data.byteLength }),
    resume: vi.fn(() => {
      context.state = "running";
      return Promise.resolve();
    }),
    suspend: vi.fn(() => Promise.resolve()),
  };
  return { context, started, targets };
}

function engine(missing: string[] = []) {
  const fake = fakeContext();
  const fetcher = vi.fn((url: string) =>
    Promise.resolve(
      missing.some((name) => url.includes(name))
        ? new Response(null, { status: 404 })
        : new Response(new ArrayBuffer(4)),
    ),
  );
  const audio = createAudioEngine({
    fetcher: fetcher as unknown as typeof fetch,
    createContext: () => fake.context as unknown as AudioContext,
  });
  return { audio, fetcher, ...fake };
}

describe("audio engine", () => {
  it("downloads files on preload but creates no context and plays nothing before unlock", () => {
    const { audio, fetcher, started } = engine();
    audio.preload();
    expect(fetcher).toHaveBeenCalledTimes(10);
    audio.play("dial");
    expect(audio.unlocked).toBe(false);
    expect(started).toHaveLength(0);
  });

  it("plays recordings at volume / 10 × 0.9 × the event factor after unlock", async () => {
    const { audio, started, context } = engine();
    audio.setAmbient({
      power: true,
      snd: true,
      volume: 10,
      noSignal: false,
      detune: 0,
    });
    await audio.unlock();
    expect(context.resume).toHaveBeenCalled();
    const before = started.length;
    audio.play("dial");
    const sound = started.at(-1);
    expect(started.length).toBe(before + 1);
    expect(sound?.buffer).toEqual({ decoded: 4 });
    expect(sound?.gain).toBeCloseTo(0.9 * 0.9);
  });

  it("is silent with SND off, volume 0 or the tab hidden", async () => {
    const { audio, started } = engine();
    await audio.unlock();
    const count = () => started.length;
    const base = count();
    audio.setAmbient({
      power: true,
      snd: false,
      volume: 5,
      noSignal: false,
      detune: 0,
    });
    audio.play("dial");
    audio.setAmbient({
      power: true,
      snd: true,
      volume: 0,
      noSignal: false,
      detune: 0,
    });
    audio.play("dial");
    audio.setAmbient({
      power: true,
      snd: true,
      volume: 5,
      noSignal: false,
      detune: 0,
    });
    audio.setHidden(true);
    audio.play("dial");
    expect(count()).toBe(base);
  });

  it("falls back to a synthesized sound when a recording is missing", async () => {
    const { audio, started } = engine(["static"]);
    audio.setAmbient({
      power: true,
      snd: true,
      volume: 5,
      noSignal: false,
      detune: 0,
    });
    await audio.unlock();
    const before = started.length;
    audio.play("static");
    const synthesized = started.slice(before);
    expect(synthesized.length).toBeGreaterThan(0);
    expect(synthesized.every((sound) => sound.buffer !== null)).toBe(true);
    expect(
      synthesized.some(
        (sound) => (sound.buffer as { decoded?: number }).decoded,
      ),
    ).toBe(false);
  });

  it("sets the hum, whine and hiss from power, volume, NO SIGNAL and drag distance", async () => {
    const { audio, targets } = engine();
    await audio.unlock();
    audio.setAmbient({
      power: true,
      snd: true,
      volume: 10,
      noSignal: true,
      detune: 0.5,
    });
    const latest = targets
      .filter((record) => record.length)
      .map((record) => record.at(-1));
    expect(latest).toEqual(expect.arrayContaining([0.006, 0.0018]));
    expect(
      latest.some((value) => Math.abs((value ?? 0) - (0.035 + 0.03)) < 1e-9),
    ).toBe(true);

    audio.setAmbient({
      power: false,
      snd: true,
      volume: 10,
      noSignal: true,
      detune: 0,
    });
    const off = targets
      .filter((record) => record.length)
      .map((record) => record.at(-1));
    expect(off.slice(-3)).toEqual([0, 0, 0]);
  });
});
