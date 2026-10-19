import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import {
  START,
  STATIC_MS,
  advance,
  groupCredits,
  revealOffset,
  rewind,
  rewindSpeed,
  rolledOff,
} from "./roll";
import type { CreditGroup } from "./roll";
import styles from "./Credits.module.css";

const VIEW_HEIGHT = 570;
const CONTROLS_MS = 2000;
const NOISE = { width: 190, height: 143, frames: 4, frameMs: 70 };

/**
 * The credits themselves: the title card, one section per department and the closing card.
 *
 * @param props - What to show.
 * @param props.groups - Credits grouped by department.
 * @param props.focusHeading - Make the heading the host's first focus target (static list).
 * @returns The credits in reading order.
 */
function CreditsBody({
  groups,
  focusHeading,
}: {
  groups: CreditGroup[];
  focusHeading: boolean;
}) {
  return (
    <>
      <header className={styles.opening}>
        <h2
          className={styles.title}
          tabIndex={focusHeading ? -1 : undefined}
          data-focus-first={focusHeading ? "" : undefined}
        >
          REVENANTAL
        </h2>
        <p className={styles.role}>Created by</p>
        <p className={styles.name}>revenantal</p>
      </header>
      {groups.length === 0 ? (
        <p className={styles.empty}>No credits yet.</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.department}
            className={styles.department}
            aria-label={group.department}
          >
            <h3 className={styles["department-name"]}>{group.department}</h3>
            <ul className={styles.entries}>
              {group.credits.map((credit) => (
                <li
                  key={`${credit.title}-${credit.url}`}
                  className={styles.entry}
                >
                  <span className={styles.role}>{credit.usedFor}</span>
                  <span className={styles.names}>
                    <a
                      href={credit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {credit.title}
                      <span className={styles["sr-only"]}>
                        {" "}
                        (opens in a new tab)
                      </span>
                    </a>
                    <span className={styles.author}>{credit.author}</span>
                    <span className={styles.meta}>
                      {credit.license}
                      {credit.edits ? ` · ${credit.edits}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <footer className={styles.closing}>
        <p className={styles.thanks}>Thanks for watching</p>
        <p className={styles.name}>revenantal.com</p>
      </footer>
    </>
  );
}

/**
 * Dim static between loops, drawn from a few pre-made low-resolution noise frames. It
 * changes frames only while running.
 *
 * @param props - Whether to animate.
 * @param props.running - True while the channel is active.
 * @returns The static canvas.
 */
function Noise({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const frames = Array.from({ length: NOISE.frames }, () => {
      const image = context.createImageData(NOISE.width, NOISE.height);
      for (let index = 0; index < image.data.length; index += 4) {
        const value = 30 + Math.floor(Math.random() * 150);
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = 255;
      }
      return image;
    });
    let frame = 0;
    const draw = () => {
      const image = frames[frame % NOISE.frames];
      if (image) context.putImageData(image, 0, 0);
      frame += 1;
    };
    draw();
    if (!running) return;
    const timer = window.setInterval(draw, NOISE.frameMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [running]);
  return (
    <canvas
      ref={canvasRef}
      className={styles.noise}
      width={NOISE.width}
      height={NOISE.height}
      aria-hidden="true"
    />
  );
}

/**
 * The top of an element within the credits track.
 *
 * @param element - A descendant of the track.
 * @param track - The moving credits container (positioned).
 * @returns Its distance from the track's top.
 */
function topWithin(element: HTMLElement, track: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== track) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * The rolling credits with VCR-style PLAY/PAUSE and REW. The roll moves on animation frames
 * only while active, unpaused and not hovered or focused; after the last line passes it
 * cuts to static for a second and starts again. REW winds back to the top in about a second.
 * The VCR bar fades in while the pointer moves over the picture (or a control has focus)
 * and hides two seconds after it stops.
 *
 * @param props - Credits and activity.
 * @param props.groups - Credits grouped by department.
 * @param props.active - Whether the channel is tuned in and visible.
 * @returns The roll.
 */
function Roll({ groups, active }: { groups: CreditGroup[]; active: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [phase, setPhase] = useState<"roll" | "static" | "rewind">("roll");
  const [controls, setControls] = useState(false);
  const hideRef = useRef<number | undefined>(undefined);
  const wake = () => {
    if (!active) return;
    setControls(true);
    window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => {
      setControls(false);
    }, CONTROLS_MS);
  };
  // No hide timer outlives the channel being active or mounted.
  useEffect(() => {
    if (active) return;
    window.clearTimeout(hideRef.current);
    setControls(false);
  }, [active]);
  useEffect(
    () => () => {
      window.clearTimeout(hideRef.current);
    },
    [],
  );

  const place = useCallback(() => {
    const track = trackRef.current;
    if (track)
      track.style.transform = `translate3d(0, ${String(START - offsetRef.current)}px, 0)`;
  }, []);
  useLayoutEffect(place, [place]);

  const moving = active && !paused && !hovered && !focused && phase === "roll";
  useEffect(() => {
    if (!moving) return;
    let last: number | null = null;
    let frame = 0;
    const step = (time: number) => {
      offsetRef.current = advance(
        offsetRef.current,
        last === null ? 0 : time - last,
      );
      last = time;
      place();
      if (rolledOff(offsetRef.current, trackRef.current?.offsetHeight ?? 0)) {
        setPhase("static");
        return;
      }
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [moving, place]);

  const restart = useCallback(() => {
    offsetRef.current = 0;
    place();
    setPhase("roll");
  }, [place]);

  // REW: wind back to the top, then hold or play as before.
  useEffect(() => {
    if (!active || phase !== "rewind") return;
    const speed = rewindSpeed(offsetRef.current);
    let last: number | null = null;
    let frame = 0;
    const step = (time: number) => {
      offsetRef.current = rewind(
        offsetRef.current,
        last === null ? 0 : time - last,
        speed,
      );
      last = time;
      place();
      if (offsetRef.current <= 0) {
        setPhase("roll");
        return;
      }
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [active, phase, place]);

  // The cut to static between loops; it waits while the channel is inactive.
  useEffect(() => {
    if (!active || phase !== "static") return;
    const timer = window.setTimeout(restart, STATIC_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active, phase, restart]);

  return (
    <div
      className={styles.root}
      data-phase={phase}
      data-active={active ? "" : undefined}
      onPointerMove={wake}
      onPointerDown={wake}
    >
      <section
        className={styles.viewport}
        aria-label="Credits"
        onPointerEnter={() => {
          setHovered(true);
        }}
        onPointerLeave={() => {
          setHovered(false);
        }}
        onFocusCapture={(event) => {
          setFocused(true);
          const track = trackRef.current;
          const target = event.target;
          if (!track || !(target instanceof HTMLElement)) return;
          offsetRef.current = revealOffset(
            offsetRef.current,
            topWithin(target, track),
            target.offsetHeight,
            VIEW_HEIGHT,
          );
          place();
          setPhase("roll");
        }}
        onBlurCapture={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node && event.currentTarget.contains(next)))
            setFocused(false);
        }}
      >
        <div
          ref={trackRef}
          className={styles.track}
          data-hidden={phase === "static" ? "" : undefined}
        >
          <CreditsBody groups={groups} focusHeading={false} />
        </div>
        {phase === "static" ? <Noise running={active} /> : null}
        {phase === "rewind" ? (
          <span className={styles.tracking} aria-hidden="true" />
        ) : null}
      </section>
      {phase === "rewind" || paused ? (
        <p className={styles.vcr} aria-hidden="true">
          {phase === "rewind" ? "◀◀ REW" : "❚❚ PAUSE"}
        </p>
      ) : null}
      <div className={styles.controls} data-shown={controls ? "" : undefined}>
        <button
          type="button"
          className={styles.button}
          aria-label="Rewind"
          onClick={() => {
            if (phase === "static") restart();
            else if (offsetRef.current > 0) setPhase("rewind");
          }}
        >
          <span aria-hidden="true">◀◀</span> REWIND
        </button>
        <button
          type="button"
          className={styles.button}
          data-focus-first=""
          aria-label={paused ? "Play" : "Pause"}
          onClick={() => {
            setPaused((value) => !value);
          }}
        >
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>{" "}
          {paused ? "PLAY" : "PAUSE"}
        </button>
      </div>
    </div>
  );
}

/**
 * CH 11 Credits: a movie-style roll of the shared credits, grouped by department. With
 * reduced motion it is a static list scrolled by hand.
 *
 * @param props - Channel props; only credits, activity and motion are read.
 * @param props.credits - The shared credit entries.
 * @param props.active - Whether the channel is tuned in and visible.
 * @param props.reducedMotion - Show the static list instead of the roll.
 * @returns The credits channel.
 */
export function ChannelComponent({
  credits,
  active,
  reducedMotion,
}: ChannelProps) {
  const groups = useMemo(() => groupCredits(credits), [credits]);
  if (reducedMotion)
    return (
      <div className={styles.root}>
        <div className={styles.list}>
          <CreditsBody groups={groups} focusHeading />
        </div>
      </div>
    );
  return <Roll groups={groups} active={active} />;
}
