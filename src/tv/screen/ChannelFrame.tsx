import {
  useEffect,
  useErrorBoundary,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import type { ComponentType } from "preact";
import type {
  ChannelHost,
  ChannelManifest,
  ChannelProps,
} from "@channels/_shared/types";
import type { ChannelAudio } from "@data/types";
import styles from "./Screen.module.css";

/** The part of an audio scope a channel frame drives. */
export type AudioScope = {
  play: ChannelProps["play"];
  setLoop: ChannelProps["setLoop"];
  setActive: (active: boolean) => void;
  dispose: () => void;
};

/** One mounted channel scope. Remount (key by position) to start a new scope. */
export type ChannelFrameProps = {
  manifest: ChannelManifest;
  props: Omit<ChannelProps, "host">;
  onTune: (id: string) => boolean;
  onPowerOff: () => void;
  /** Creates this channel's sound scope; omitted in tests without audio. */
  createAudioScope?: (audio: ChannelAudio | undefined) => AudioScope;
  /** Move focus into the channel once it is loaded and active (after a panel tune). */
  takeFocus?: boolean;
  /** Called once focus has moved into the channel. */
  onFocusTaken?: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Load =
  | { status: "loading" }
  | { status: "ready"; Component: ComponentType<ChannelProps> }
  | { status: "failed" };

/**
 * Loads a channel's named component lazily and renders it with a scoped host. Callbacks
 * stop working once the scope is gone or the channel is inactive, a load that finishes
 * after the scope ends is discarded, and load or render failures show a recoverable error
 * while the TV controls keep working.
 *
 * @param props - Manifest, channel props and TV actions.
 * @param props.manifest - The tuned channel's manifest.
 * @param props.props - Every channel prop except the host.
 * @param props.onTune - Tunes the TV to a channel ID; returns whether it was accepted.
 * @param props.onPowerOff - Turns the TV off through the normal power action.
 * @param props.createAudioScope - Creates the scoped play/setLoop for this channel.
 * @param props.takeFocus - Move focus into the channel once it is ready and active.
 * @param props.onFocusTaken - Called after focus moves in.
 * @returns The channel, a loading state or an error state.
 */
export function ChannelFrame({
  manifest,
  props,
  onTune,
  onPowerOff,
  createAudioScope,
  takeFocus = false,
  onFocusTaken,
}: ChannelFrameProps) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [renderError, resetRenderError] = useErrorBoundary() as [
    unknown,
    () => void,
  ];
  const disposedRef = useRef(false);
  const latestRef = useRef({ active: props.active, onTune, onPowerOff });
  useEffect(() => {
    latestRef.current = { active: props.active, onTune, onPowerOff };
  });
  useEffect(
    () => () => {
      disposedRef.current = true;
    },
    [],
  );

  useEffect(() => {
    let current = true;
    setLoad({ status: "loading" });
    manifest
      .load()
      .then((module) => {
        if (current && !disposedRef.current)
          setLoad({ status: "ready", Component: module.ChannelComponent });
      })
      .catch(() => {
        if (current && !disposedRef.current) setLoad({ status: "failed" });
      });
    return () => {
      current = false;
    };
  }, [manifest, attempt]);

  // One sound scope per mounted channel: active only while the channel is, gone on unmount.
  const scopeRef = useRef<AudioScope | null>(null);
  useEffect(() => {
    const scope = createAudioScope?.(manifest.audio) ?? null;
    scopeRef.current = scope;
    return () => {
      scope?.dispose();
      scopeRef.current = null;
    };
  }, [createAudioScope, manifest]);
  useEffect(() => {
    scopeRef.current?.setActive(props.active && load.status === "ready");
  }, [props.active, load.status]);
  const sound = useMemo(
    () => ({
      play: (id: string, options?: Parameters<ChannelProps["play"]>[1]) => {
        scopeRef.current?.play(id, options);
      },
      setLoop: (
        id: string,
        playing: boolean,
        options?: Parameters<ChannelProps["setLoop"]>[2],
      ) => {
        scopeRef.current?.setLoop(id, playing, options);
      },
    }),
    [],
  );

  // After a panel tune, focus the channel's marked control (data-focus-first) or its first one.
  const pictureRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!takeFocus || !props.active || load.status !== "ready") return;
    const picture = pictureRef.current;
    const target =
      picture?.querySelector<HTMLElement>("[data-focus-first]") ??
      picture?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus({ preventScroll: true });
    onFocusTaken?.();
  }, [takeFocus, props.active, load.status, onFocusTaken]);

  const host = useMemo<ChannelHost>(
    () => ({
      tune: (id) => {
        const latest = latestRef.current;
        return !disposedRef.current && latest.active && latest.onTune(id);
      },
      powerOff: () => {
        const latest = latestRef.current;
        if (!disposedRef.current && latest.active) latest.onPowerOff();
      },
    }),
    [],
  );

  if (load.status === "failed" || renderError)
    return (
      <div className={styles.picture} style={{ background: manifest.bg }}>
        <div className={styles.message} role="alert">
          <p>{manifest.name} is unavailable.</p>
          <button
            type="button"
            onClick={() => {
              resetRenderError();
              setAttempt((count) => count + 1);
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  if (load.status === "loading")
    return (
      <div className={styles.picture} style={{ background: manifest.bg }} />
    );
  const { Component } = load;
  return (
    <div
      ref={pictureRef}
      className={styles.picture}
      data-anim="on"
      data-channel={manifest.id}
    >
      <Component
        {...props}
        {...sound}
        volume={props.active ? props.volume : 0}
        host={host}
      />
    </div>
  );
}
