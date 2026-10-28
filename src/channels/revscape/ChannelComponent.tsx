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
  wheel,
} from "./camera";
import type { CameraState, HeldKeys } from "./camera";
import { SPAWN, buildGrid } from "./grid";
import { pickTile } from "./picking";
import {
  animatePlayer,
  createPlayer,
  isMoving,
  position,
  updatePlayer,
  walkTo,
} from "./player";
import { VIEW, createScene } from "./scene";
import type { SceneView } from "./scene";
import { layoutTown } from "./town";
import { buildWorld, flatRadius, surfaceHeight } from "./world";
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
/** A press that moves less than this many glass pixels is a click, not a drag. */
const CLICK_SLOP = 4;
const FRAME_FALLBACK_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.25;

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
 * CH 06 Revscape, milestones 1 and 2: a low-poly town to look around and walk in. The 3D view
 * is a canvas drawn at 512×384 and scaled up pixelated; the compass is DOM over it. Drag to
 * turn and tilt (or the arrow keys after PRESS START), wheel to zoom, click the ground to
 * walk there. The camera follows the player. Frames are drawn only while something moves,
 * and only while active.
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
  const draggingRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: number;
  } | null>(null);
  const grid = useMemo(() => buildGrid(town), [town]);
  const flat = useMemo(() => flatRadius(town), [town]);
  const playerRef = useRef(createPlayer(SPAWN));
  // A new world puts the player back at the start.
  useEffect(() => {
    playerRef.current = createPlayer(SPAWN);
    shownRef.current = { ...START, x: SPAWN.i + 0.5, z: SPAWN.j + 0.5 };
    wantedRef.current = { ...shownRef.current };
  }, [grid]);
  const liveRef = useRef({
    active,
    reducedMotion,
    half: town.half,
    grid,
    flat,
  });
  useEffect(() => {
    liveRef.current = { active, reducedMotion, half: town.half, grid, flat };
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
      const player = playerRef.current;
      updatePlayer(player, seconds * 1000);
      animatePlayer(player, seconds);
      const at = position(player, !settings.reducedMotion);
      // The camera follows the player; dragging and keys still turn, tilt and zoom it.
      wantedRef.current = limit(
        {
          ...applyKeys(wantedRef.current, keysRef.current, seconds),
          x: at.x,
          z: at.z,
        },
        reach,
      );
      const next = ease(
        shownRef.current,
        wantedRef.current,
        seconds,
        settings.reducedMotion,
      );
      shownRef.current = next.state;
      const height = (x: number, z: number) =>
        surfaceHeight(x, z, settings.flat);
      const goal = player.goal;
      scene.render(shownRef.current, {
        player: {
          ...at,
          y: height(at.x, at.z),
          facing: player.facing,
          swing: player.swing,
          phase: player.phase,
        },
        marker: goal
          ? {
              x: goal.i + 0.5,
              y: height(goal.i + 0.5, goal.j + 0.5) + 0.03,
              z: goal.j + 0.5,
            }
          : null,
      });
      if (needleRef.current)
        needleRef.current.style.transform = `rotate(${shownRef.current.yaw.toFixed(1)}deg)`;
      if (rootRef.current) {
        const stats = scene.stats();
        rootRef.current.dataset["triangles"] = String(stats.triangles);
        rootRef.current.dataset["calls"] = String(stats.calls);
      }
      if (!next.settled || anyKey(keysRef.current) || isMoving(player)) {
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
      startX: event.clientX,
      startY: event.clientY,
      moved: 0,
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
    draggingRef.current = {
      ...start,
      x: event.clientX,
      y: event.clientY,
      moved: Math.hypot(
        (event.clientX - start.startX) / scale,
        (event.clientY - start.startY) / scale,
      ),
    };
    if (draggingRef.current.moved > CLICK_SLOP)
      change(drag(wantedRef.current, dx, dy));
  };
  const onPointerCancel = (event: TargetedPointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = null;
    delete event.currentTarget.dataset["dragging"];
  };
  const onPointerUp = (event: TargetedPointerEvent<HTMLCanvasElement>) => {
    const press = draggingRef.current;
    onPointerCancel(event);
    // A left press that barely moved is a click: walk to the tile under it.
    if (!press || event.button !== 0 || press.moved > CLICK_SLOP) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const settings = liveRef.current;
    if (!settings.active) return;
    const tile = pickTile(
      shownRef.current,
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2,
      VIEW.width / VIEW.height,
      (x, z) => surfaceHeight(x, z, settings.flat),
    );
    if (tile && walkTo(playerRef.current, settings.grid, tile)) schedule();
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
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
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
        Click: walk · Drag: turn and tilt · Wheel: zoom
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
