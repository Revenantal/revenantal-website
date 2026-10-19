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
import styles from "./Screen.module.css";

/** One mounted channel scope. Remount (key by position) to start a new scope. */
export type ChannelFrameProps = {
  manifest: ChannelManifest;
  props: Omit<ChannelProps, "host">;
  onTune: (id: string) => boolean;
  onPowerOff: () => void;
};

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
 * @returns The channel, a loading state or an error state.
 */
export function ChannelFrame({
  manifest,
  props,
  onTune,
  onPowerOff,
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
    <div className={styles.picture} data-anim="on">
      <Component {...props} host={host} />
    </div>
  );
}
