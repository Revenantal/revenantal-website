import type {
  TargetedKeyboardEvent,
  TargetedPointerEvent,
  TargetedWheelEvent,
} from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { CaptureOverlay, useCaptureFocus } from "../_shared/CaptureOverlay";
import type { ChannelProps } from "../_shared/types";
import {
  NO_KEYS,
  START,
  anyKey,
  applyKeys,
  drag,
  ease,
  limit,
  pan,
  wheel,
} from "./camera";
import type { CameraState, HeldKeys } from "./camera";
import { createScene } from "./scene";
import type { SceneView } from "./scene";
import { layoutTown } from "./town";
import { buildWorld } from "./world";
import styles from "./Revscape.module.css";

type Status = "loading" | "ready" | "unavailable";

const KEYS: Record<string, keyof HeldKeys> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  PageUp: "zoomIn",
  PageDown: "zoomOut",
};

const LINE_PIXELS = 16;
const GLASS_WIDTH = 760;
const FRAME_FALLBACK_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;

/**
 * The project links, in building order. Visible when 3D is unavailable, otherwise hidden
 * from sight but reachable by keyboard and screen reader.
 *
 * @param props - Props for the list.
 * @param props.projects - Projects in display order.
 * @param props.visible - Show it rather than hide it.
 * @returns The list.
 */
function ProjectList({
  projects,
  visible,
}: {
  projects: ChannelProps["projects"];
  visible: boolean;
}) {
  return (
    <ul
      className={visible ? styles.projects : styles["sr-only"]}
      aria-label="Projects"
    >
      {projects.map((project) => (
        <li key={project.id}>
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            {project.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * CH 06 Revscape, milestone 1: a still low-poly town to look around. The 3D view is a canvas
 * drawn at 512×384 and scaled up pixelated; the compass is DOM over it. The camera turns and
 * tilts by dragging (or the arrow keys after PRESS START), zooms with the wheel, and the
 * compass faces north. Frames are drawn only while something moves, and only while active.
 *
 * @param props - Host props.
 * @returns The channel.
 */
export function ChannelComponent(props: ChannelProps) {
  const { active, projects, reducedMotion, captured, requestCapture } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  const ids = projects.map((project) => project.id).join("\n");
  const town = useMemo(() => layoutTown(ids ? ids.split("\n") : []), [ids]);
  const chunks = useMemo(() => buildWorld(town), [town]);

  const sceneRef = useRef<SceneView | null>(null);
  const wantedRef = useRef<CameraState>({ ...START });
  const shownRef = useRef<CameraState>({ ...START });
  const keysRef = useRef<HeldKeys>({ ...NO_KEYS });
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const draggingRef = useRef<{ x: number; y: number; pan: boolean } | null>(
    null,
  );
  const liveRef = useRef({ active, reducedMotion, half: town.half });
  useEffect(() => {
    liveRef.current = { active, reducedMotion, half: town.half };
  });

  // Draws a frame, then keeps drawing only while the camera is still moving.
  const tickRef = useRef<(time: number) => void>(() => undefined);
  useEffect(() => {
    tickRef.current = (time: number) => {
      frameRef.current = null;
      const scene = sceneRef.current;
      const settings = liveRef.current;
      if (!scene || !settings.active) {
        lastTimeRef.current = null;
        return;
      }
      const seconds =
        lastTimeRef.current === null
          ? FRAME_FALLBACK_SECONDS
          : Math.min(MAX_FRAME_SECONDS, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;
      const reach = settings.half - 2;
      wantedRef.current = limit(
        applyKeys(wantedRef.current, keysRef.current, seconds),
        reach,
      );
      const next = ease(
        shownRef.current,
        wantedRef.current,
        seconds,
        settings.reducedMotion,
      );
      shownRef.current = next.state;
      scene.render(shownRef.current);
      if (needleRef.current)
        needleRef.current.style.transform = `rotate(${shownRef.current.yaw.toFixed(1)}deg)`;
      if (rootRef.current) {
        const stats = scene.stats();
        rootRef.current.dataset["triangles"] = String(stats.triangles);
        rootRef.current.dataset["calls"] = String(stats.calls);
      }
      if (!next.settled || anyKey(keysRef.current)) {
        frameRef.current = requestAnimationFrame(tickRef.current);
      } else {
        lastTimeRef.current = null;
      }
    };
  });
  const schedule = () => {
    if (frameRef.current === null && liveRef.current.active && sceneRef.current)
      frameRef.current = requestAnimationFrame(tickRef.current);
  };

  // Starts three.js for this world, and frees it all when the world changes or the channel goes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: SceneView;
    try {
      scene = createScene(canvas, chunks, () => {
        // The browser took the 3D view away: free it now and show the project links.
        sceneRef.current = null;
        scene.dispose();
        setStatus("unavailable");
      });
    } catch {
      setStatus("unavailable");
      return;
    }
    sceneRef.current = scene;
    setStatus("ready");
    schedule();
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [chunks]);

  // Draws the first frame when the scene is ready or the channel comes back, and stops
  // everything the moment it goes inactive or leaves.
  useEffect(() => {
    if (active && status === "ready") schedule();
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [active, status, reducedMotion]);

  // Releasing the keyboard lets go of any held camera key.
  useEffect(() => {
    if (!captured) keysRef.current = { ...NO_KEYS };
  }, [captured]);
  useCaptureFocus(surfaceRef, captured);

  const reach = () => liveRef.current.half - 2;
  const change = (next: CameraState) => {
    wantedRef.current = limit(next, reach());
    schedule();
  };

  const onPointerDown = (event: TargetedPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    draggingRef.current = {
      x: event.clientX,
      y: event.clientY,
      pan: event.shiftKey,
    };
    // jsdom and a few old browsers lack pointer capture.
    if (typeof event.currentTarget.setPointerCapture === "function")
      event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset["dragging"] = "";
  };
  const onPointerMove = (event: TargetedPointerEvent<HTMLCanvasElement>) => {
    const start = draggingRef.current;
    if (!start) return;
    // Drag in glass pixels, whatever size the TV scales the picture to.
    const scale =
      event.currentTarget.getBoundingClientRect().width / GLASS_WIDTH || 1;
    const dx = (event.clientX - start.x) / scale;
    const dy = (event.clientY - start.y) / scale;
    draggingRef.current = { ...start, x: event.clientX, y: event.clientY };
    change(
      start.pan
        ? pan(wantedRef.current, dx, dy)
        : drag(wantedRef.current, dx, dy),
    );
  };
  const endDrag = (event: TargetedPointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = null;
    delete event.currentTarget.dataset["dragging"];
  };
  const onWheel = (event: TargetedWheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const pixels =
      event.deltaMode === 1 ? event.deltaY * LINE_PIXELS : event.deltaY;
    change(wheel(wantedRef.current, pixels));
  };

  const setKey = (
    event: TargetedKeyboardEvent<HTMLDivElement>,
    down: boolean,
  ) => {
    const key = KEYS[event.key];
    if (!key || !captured || event.ctrlKey || event.metaKey || event.altKey)
      return;
    event.preventDefault();
    if (keysRef.current[key] === down) return;
    keysRef.current = { ...keysRef.current, [key]: down };
    schedule();
  };

  const faceNorth = () => {
    change({ ...wantedRef.current, yaw: 0 });
  };

  if (status === "unavailable")
    return (
      <div className={styles.root} ref={rootRef}>
        <div className={styles.fallback} role="status">
          <h2>Revscape</h2>
          <p>
            This browser is not providing the 3D graphics the town needs. The
            projects are still here:
          </p>
          <ProjectList projects={projects} visible />
        </div>
      </div>
    );

  return (
    <div className={styles.root} ref={rootRef}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- once PRESS START has captured the keyboard, this surface handles the camera keys */}
      <div
        ref={surfaceRef}
        className={styles.surface}
        tabIndex={-1}
        role="application"
        aria-label="Revscape town view"
        onKeyDown={(event) => {
          setKey(event, true);
        }}
        onKeyUp={(event) => {
          setKey(event, false);
        }}
        onBlur={() => {
          keysRef.current = { ...NO_KEYS };
        }}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={512}
          height={384}
          role="img"
          aria-label="A low-poly town square with a building for each project. The project list has a link for every building."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
        />
      </div>
      <button
        type="button"
        className={styles.compass}
        aria-label="Compass: face north"
        onClick={faceNorth}
      >
        <div ref={needleRef} className={styles.needle} />
      </button>
      <p className={styles.help} aria-hidden="true">
        Drag: turn and tilt · Wheel: zoom · Shift+drag: move
      </p>
      <ProjectList projects={projects} visible={false} />
      <CaptureOverlay
        captured={captured}
        onStart={requestCapture}
        hint="to use the arrow keys, Page Up and Page Down"
        compact
      />
    </div>
  );
}
