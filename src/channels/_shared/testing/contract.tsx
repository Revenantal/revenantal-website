import { readFileSync } from "node:fs";
import { act, cleanup, render } from "@testing-library/preact";
import type { ComponentType } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { manifestProblems } from "../manifest-check";
import type { ChannelKind } from "../../../data/types";
import type { ChannelManifest, ChannelProps } from "../types";
import {
  FIXTURE_CASES,
  channelProps,
  deepFreeze,
  fixtureProjects,
} from "./fixtures";

/** What a channel may do that the default contract forbids. */
export type ContractOptions = {
  /** Network requests this channel may make, such as the TV Guide forecast helpers. */
  allowNetwork?: (url: string) => boolean;
  /** The manifest file, from the repository root. Defaults to `src/channels/<id>/manifest.ts`. */
  manifestPath?: string;
  /** A decorative background: the channel may play muted `<video>` elements, and nothing audible. */
  allowMutedVideo?: boolean;
};

type Channel = ComponentType<ChannelProps>;

const TIMERS = [
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "Date",
] as const;

/**
 * Fixture props with the data frozen, so a channel that mutates them throws; callbacks stay spies.
 *
 * @param overrides - Props to replace.
 * @returns Props for one render.
 */
function frozenProps(overrides: Partial<ChannelProps> = {}): ChannelProps {
  const props = channelProps(overrides);
  for (const key of [
    "projects",
    "servers",
    "live",
    "links",
    "credits",
    "broadcast",
  ] as const)
    deepFreeze(props[key]);
  return props;
}

/**
 * Checks the manifest: a valid ID, kind, colours, display profile and audio.
 *
 * @param manifest - The channel manifest.
 */
export function checkManifest(manifest: ChannelManifest) {
  expect(manifestProblems(manifest), "manifest problems").toEqual([]);
}

/**
 * Checks that importing the manifest does not import the channel's own code, so the registry
 * reads metadata without loading the component. Only type imports and shared helpers may be
 * static.
 *
 * @param manifestPath - The channel's manifest.ts, from the repository root.
 */
export function checkLazyManifest(manifestPath: string) {
  const source = readFileSync(manifestPath, "utf8");
  expect(
    eagerImports(source),
    "static imports of channel code in manifest.ts",
  ).toEqual([]);
}

/**
 * Finds static, non-type imports of the channel's own files in manifest source.
 *
 * @param source - manifest.ts source text.
 * @returns The eagerly imported relative paths.
 */
export function eagerImports(source: string): string[] {
  return [
    ...source.matchAll(
      /^\s*import\s+(?!type\b)(?:[^;]*?from\s+)?["']([^"']+)["']/gm,
    ),
  ]
    .map((match) => match[1] ?? "")
    .filter((path) => path.startsWith("./"));
}

/**
 * Loads the channel through its manifest, as the host does.
 *
 * @param manifest - The channel manifest.
 * @returns The named channel component.
 */
export async function loadChannel(manifest: ChannelManifest): Promise<Channel> {
  const module = await manifest.load();
  expect(typeof module.ChannelComponent, "ChannelComponent export").toBe(
    "function",
  );
  return module.ChannelComponent;
}

/**
 * Renders every fixture case: fresh data, live = null, stale sources, 0/1/30 projects, no
 * credits, reduced motion and muted. Data props are frozen, so mutation throws.
 *
 * @param Channel - The channel component.
 */
export function checkRendersEveryCase(Channel: Channel) {
  for (const fixture of FIXTURE_CASES) {
    const { container, unmount } = render(
      <Channel {...frozenProps(fixture.props)} />,
    );
    expect(
      container.childElementCount,
      `renders something with ${fixture.name}`,
    ).toBeGreaterThan(0);
    unmount();
  }
}

/**
 * Lists every project as a link that opens its URL in a new tab, with 30 projects.
 *
 * @param Channel - The channel component.
 */
export function checkProjectLinks(Channel: Channel) {
  const projects = fixtureProjects(30);
  const { container, unmount } = render(
    <Channel {...frozenProps({ projects })} />,
  );
  for (const project of projects) {
    const link = container.querySelector<HTMLAnchorElement>(
      `a[href="${project.url}"]`,
    );
    expect(link, `a link to ${project.name}`).not.toBeNull();
    expect(link?.target, `${project.name} opens in a new tab`).toBe("_blank");
    expect(link?.rel, `${project.name} link rel`).toContain("noopener");
  }
  unmount();
}

/**
 * Runs the channel through a full lifecycle (active, inactive, active again, unmounted) and
 * records forbidden side effects: global listeners, network, direct storage and audio or
 * media of its own.
 *
 * @param Channel - The channel component.
 * @param kind - The channel's kind; only broadcast channels own a video element.
 * @param options - Allowed exceptions.
 */
export function checkSideEffects(
  Channel: Channel,
  kind: ChannelKind,
  options: ContractOptions = {},
) {
  const requests: string[] = [];
  const record = (url: unknown) => {
    const text =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.href
          : url instanceof Request
            ? url.url
            : "unknown";
    if (!options.allowNetwork?.(text)) requests.push(text);
  };
  const windowListeners = vi.spyOn(window, "addEventListener");
  const documentListeners = vi.spyOn(document, "addEventListener");
  const storage = [
    vi.spyOn(Storage.prototype, "getItem"),
    vi.spyOn(Storage.prototype, "setItem"),
    vi.spyOn(Storage.prototype, "removeItem"),
  ];
  const played: HTMLMediaElement[] = [];
  const media = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(function (this: HTMLMediaElement) {
      played.push(this);
      return Promise.resolve();
    });
  const audioNodes = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: unknown) => {
      record(url);
      return Promise.reject(new Error("blocked by the channel contract"));
    }),
  );
  vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(
    (_method: string, url: string | URL) => {
      record(url);
    },
  );
  const blocked = vi.fn(function (url?: unknown) {
    record(url);
  });
  vi.stubGlobal("WebSocket", blocked);
  vi.stubGlobal("EventSource", blocked);
  vi.stubGlobal("AudioContext", audioNodes);
  vi.stubGlobal("Audio", audioNodes);
  vi.useFakeTimers({ toFake: [...TIMERS] });
  try {
    const props = frozenProps();
    const { rerender, unmount } = render(<Channel {...props} />);
    void act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<Channel {...props} active={false} />);
    void act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<Channel {...props} />);
    void act(() => {
      vi.advanceTimersByTime(2000);
    });
    unmount();
    expect(
      [...windowListeners.mock.calls, ...documentListeners.mock.calls].map(
        ([type]) => type,
      ),
      "global listeners",
    ).toEqual([]);
    expect(requests, "network requests").toEqual([]);
    expect(
      storage.flatMap((spy) => spy.mock.calls.map(([key]) => key)),
      "direct storage access (use the save prop)",
    ).toEqual([]);
    expect(
      audioNodes,
      "own audio nodes (use play and setLoop)",
    ).not.toHaveBeenCalled();
    if (kind !== "broadcast")
      if (options.allowMutedVideo)
        expect(
          played.filter(
            (element) =>
              !(element instanceof HTMLVideoElement && element.muted),
          ),
          "own audible media playback (only muted video is allowed)",
        ).toEqual([]);
      else expect(media, "own media playback").not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
}

function expectQuiet(props: ChannelProps, when: string) {
  expect(props.play, `play() ${when}`).not.toHaveBeenCalled();
  expect(
    vi.mocked(props.setLoop).mock.calls.filter(([, playing]) => playing),
    `setLoop(id, true) ${when}`,
  ).toEqual([]);
  expect(props.host.tune, `host.tune() ${when}`).not.toHaveBeenCalled();
  expect(props.host.powerOff, `host.powerOff() ${when}`).not.toHaveBeenCalled();
  expect(
    props.requestCapture,
    `requestCapture() ${when}`,
  ).not.toHaveBeenCalled();
  expect(props.save.store, `save.store() ${when}`).not.toHaveBeenCalled();
  expect(vi.getTimerCount(), `timers or animation frames ${when}`).toBe(0);
}

function clearCalls(props: ChannelProps) {
  for (const spy of [
    props.play,
    props.setLoop,
    props.host.tune,
    props.host.powerOff,
    props.requestCapture,
    props.save.store,
  ])
    vi.mocked(spy).mockClear();
}

/**
 * Pauses when inactive: once `active` is false, no timers or animation frames stay
 * scheduled and nothing plays, tunes, captures or saves. Coming back still works.
 *
 * @param Channel - The channel component.
 */
export function checkPausesWhenInactive(Channel: Channel) {
  vi.useFakeTimers({ toFake: [...TIMERS] });
  try {
    const props = frozenProps();
    const { rerender, unmount } = render(<Channel {...props} />);
    void act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<Channel {...props} active={false} />);
    // Let the framework finish its own after-render work before measuring.
    void act(() => {
      vi.advanceTimersByTime(100);
    });
    clearCalls(props);
    void act(() => {
      vi.advanceTimersByTime(5000);
    });
    expectQuiet(props, "while inactive");
    rerender(<Channel {...props} />);
    void act(() => {
      vi.advanceTimersByTime(2000);
    });
    unmount();
  } finally {
    vi.useRealTimers();
  }
}

/**
 * Leaves nothing behind: after unmounting (tune-away), no timers or frames remain and no
 * callback fires, so a stale scope can never act.
 *
 * @param Channel - The channel component.
 */
export function checkStopsOnUnmount(Channel: Channel) {
  vi.useFakeTimers({ toFake: [...TIMERS] });
  try {
    const props = frozenProps();
    const { unmount } = render(<Channel {...props} />);
    void act(() => {
      vi.advanceTimersByTime(2000);
    });
    unmount();
    void act(() => {
      vi.advanceTimersByTime(100);
    });
    clearCalls(props);
    void act(() => {
      vi.advanceTimersByTime(5000);
    });
    expectQuiet(props, "after unmount");
  } finally {
    vi.useRealTimers();
  }
}

/**
 * The shared contract every channel passes. Call it from the channel's own test file (with
 * `// @vitest-environment jsdom`), so `pnpm test:channel <id>` runs it alone.
 *
 * @param manifest - The channel manifest.
 * @param options - Allowed exceptions.
 */
export function describeChannelContract(
  manifest: ChannelManifest,
  options: ContractOptions = {},
) {
  describe(`channel contract: ${manifest.id}`, () => {
    afterEach(() => {
      cleanup();
    });

    it("declares a valid manifest and loads its component lazily", async () => {
      checkManifest(manifest);
      checkLazyManifest(
        options.manifestPath ?? `src/channels/${manifest.id}/manifest.ts`,
      );
      await loadChannel(manifest);
    });

    it("renders from fixtures, without live data, with stale sources and with 0, 1 and 30 projects", async () => {
      checkRendersEveryCase(await loadChannel(manifest));
    });

    if (manifest.kind === "directory" || manifest.kind === "game")
      it("links every project in a new tab", async () => {
        checkProjectLinks(await loadChannel(manifest));
      });

    it("uses no global listeners, network, storage or audio of its own", async () => {
      checkSideEffects(await loadChannel(manifest), manifest.kind, options);
    });

    it("pauses when inactive", async () => {
      checkPausesWhenInactive(await loadChannel(manifest));
    });

    it("stops everything when its scope ends", async () => {
      checkStopsOnUnmount(await loadChannel(manifest));
    });
  });
}
