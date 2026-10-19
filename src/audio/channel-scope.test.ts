import { describe, expect, it, vi } from "vitest";
import type { ChannelAudio } from "@data/types";
import { createChannelScope } from "./channel-scope";
import type { ScopeHost } from "./channel-scope";

type Voice = {
  buffer: unknown;
  loop: boolean;
  rate: number;
  gain: number;
  ramps: number[];
  targets: number[];
  stopped: boolean;
};

// A minimal Web Audio stand-in that records each started voice.
function fakeAudio() {
  const voices: Voice[] = [];
  const context = {
    currentTime: 0,
    createGain: () => {
      const ramps: number[] = [];
      const targets: number[] = [];
      const gain = {
        value: 1,
        setValueAtTime: (value: number) => {
          gain.value = value;
        },
        linearRampToValueAtTime: (value: number) => ramps.push(value),
        setTargetAtTime: (value: number) => targets.push(value),
      };
      return { gain, ramps, targets, connect: vi.fn() };
    },
    createBufferSource: () => {
      const node = {
        buffer: null as unknown,
        loop: false,
        playbackRate: { value: 1 },
        level: null as null | {
          gain: { value: number };
          ramps: number[];
          targets: number[];
        },
        voice: null as Voice | null,
        connect: (level: {
          gain: { value: number };
          ramps: number[];
          targets: number[];
        }) => {
          node.level = level;
        },
        disconnect: vi.fn(),
        start: () => {
          const level = node.level;
          node.voice = {
            buffer: node.buffer,
            loop: node.loop,
            rate: node.playbackRate.value,
            gain: level?.gain.value ?? -1,
            ramps: level?.ramps ?? [],
            targets: level?.targets ?? [],
            stopped: false,
          };
          voices.push(node.voice);
        },
        stop: () => {
          if (node.voice) node.voice.stopped = true;
        },
      };
      return node;
    },
    decodeAudioData: (data: ArrayBuffer) =>
      Promise.resolve({ bytes: data.byteLength }),
  };
  return { context: context as unknown as AudioContext, voices };
}

const audio: ChannelAudio = {
  sounds: {
    coin: { src: "/assets/channels/fixture/coin.m4a", gain: 0.5 },
    evil: { src: "https://example.invalid/evil.m4a" },
  },
  loops: {
    theme: {
      src: "/assets/channels/fixture/theme.m4a",
      kind: "music",
      gain: 0.8,
    },
    engine: {
      src: "/assets/channels/fixture/engine.m4a",
      kind: "ambient",
      start: "manual",
    },
  },
};

function setup(
  overrides: Partial<{
    unlocked: boolean;
    audible: boolean;
    ducked: boolean;
  }> = {},
) {
  const fake = fakeAudio();
  const state = { unlocked: true, audible: true, ducked: false, ...overrides };
  const fetcher = vi.fn((url: string) =>
    Promise.resolve(new Response(new ArrayBuffer(url ? 8 : 0))),
  );
  const host: ScopeHost = {
    context: () => (state.unlocked ? fake.context : null),
    output: () => (state.unlocked ? ({} as AudioNode) : null),
    audible: () => state.audible,
    level: () => 0.5,
    ducked: () => state.ducked,
    fetcher: (input) =>
      fetcher(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      ),
  };
  const scope = createChannelScope(audio, host);
  const ready = async () => {
    scope.setActive(true);
    await vi.waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(3);
    });
    await new Promise((done) => setTimeout(done, 0));
  };
  return { scope, state, fetcher, ready, ...fake };
}

describe("channel audio scope", () => {
  it("loads only its own safe assets once active, and plays one-shots at asset × local × viewer gain", async () => {
    const { scope, voices, fetcher, ready } = setup();
    expect(fetcher).not.toHaveBeenCalled();
    await ready();
    expect(fetcher.mock.calls.map(([url]) => url)).not.toContain(
      "https://example.invalid/evil.m4a",
    );
    const before = voices.length;
    scope.play("coin", { gain: 0.5, rate: 3 });
    const coin = voices.at(-1);
    expect(voices.length).toBe(before + 1);
    expect(coin?.gain).toBeCloseTo(0.5 * 0.5 * 0.5);
    expect(coin?.rate).toBe(2);

    scope.play("unknown");
    scope.play("evil");
    expect(voices.length).toBe(before + 1);
  });

  it("starts on-active loops when active, fades music in, and keeps one voice per loop", async () => {
    const { scope, voices, ready } = setup();
    await ready();
    const theme = voices.filter((voice) => voice.loop);
    expect(theme).toHaveLength(1);
    expect(theme[0]?.ramps.at(-1)).toBeCloseTo(0.8 * 0.5);

    scope.setLoop("theme", true, { gain: 0.5 });
    scope.setLoop("theme", true, { gain: 0.5 });
    expect(voices.filter((voice) => voice.loop)).toHaveLength(1);
    expect(theme[0]?.targets.at(-1)).toBeCloseTo(0.8 * 0.5 * 0.5);
  });

  it("starts manual loops only on request, and stops a loop when it is turned off", async () => {
    const { scope, voices, ready } = setup();
    await ready();
    const loops = () => voices.filter((voice) => voice.loop && !voice.stopped);
    expect(loops()).toHaveLength(1);
    scope.setLoop("engine", true, { rate: 1.5 });
    expect(loops()).toHaveLength(2);
    expect(loops().at(-1)?.rate).toBe(1.5);
    scope.setLoop("engine", false);
    expect(loops()).toHaveLength(1);
  });

  it("ducks music to 30% under the OSD but not ambient loops", async () => {
    const { scope, state, voices, ready } = setup();
    await ready();
    scope.setLoop("engine", true);
    state.ducked = true;
    scope.refresh();
    const [theme, engine] = voices.filter((voice) => voice.loop);
    expect(theme?.targets.at(-1)).toBeCloseTo(0.8 * 0.5 * 0.3);
    expect(engine?.targets.at(-1)).toBeCloseTo(0.5);
  });

  it("stops everything while inactive or muted, resumes on return, and goes silent for good on dispose", async () => {
    const { scope, state, voices, ready } = setup();
    await ready();
    const playing = () =>
      voices.filter((voice) => voice.loop && !voice.stopped);
    scope.setActive(false);
    expect(playing()).toHaveLength(0);
    scope.play("coin");
    expect(voices.filter((voice) => !voice.loop)).toHaveLength(0);

    scope.setActive(true);
    expect(playing()).toHaveLength(1);
    state.audible = false;
    scope.refresh();
    expect(playing()).toHaveLength(0);
    state.audible = true;
    scope.refresh();
    expect(playing()).toHaveLength(1);

    scope.dispose();
    expect(playing()).toHaveLength(0);
    scope.setActive(true);
    scope.setLoop("theme", true);
    scope.play("coin");
    expect(playing()).toHaveLength(0);
  });

  it("does nothing before audio is unlocked, and does not queue requests", () => {
    const { scope, voices, fetcher } = setup({ unlocked: false });
    scope.setActive(true);
    scope.play("coin");
    scope.setLoop("engine", true);
    expect(voices).toHaveLength(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
