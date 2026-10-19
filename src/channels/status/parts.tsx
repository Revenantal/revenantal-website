import type { ComponentChildren } from "preact";
import { ANCHORS, CABLE_COLOURS, SPRITES, UNIT_HEIGHT } from "./hardware";
import type { Anchor } from "./hardware";
import styles from "./Status.module.css";

/**
 * A repeatable pseudo-random number in [0, 1), so lights don't pulse together yet render
 * the same on every pass.
 *
 * @param seed - Any number.
 * @returns A value in [0, 1).
 */
export function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

/** How a light animates. */
export type LedAnimation = "steady" | "blink" | "flicker";

/**
 * One LED: unlit when it has no colour, otherwise glowing, blinking or flickering.
 *
 * @param props - Light settings.
 * @param props.colour - Lit colour, or null for unlit.
 * @param props.size - Diameter in pixels.
 * @param props.animation - Steady, blink or flicker.
 * @param props.seed - Varies the timing between lights.
 * @param props.period - Animation length in seconds.
 * @returns The light.
 */
export function Led({
  colour,
  size,
  animation = "steady",
  seed = 0,
  period,
}: {
  colour: string | null;
  size: number;
  animation?: LedAnimation;
  seed?: number;
  period?: number;
}) {
  const lit = colour !== null;
  const anim =
    !lit || animation === "steady"
      ? undefined
      : animation === "blink"
        ? "blink"
        : `flick${String(1 + Math.floor(noise(seed) * 3))}`;
  const duration =
    period ?? (animation === "blink" ? 1.6 : 0.45 + noise(seed + 1) * 0.65);
  return (
    <i
      className={styles.led}
      data-lit={lit}
      data-anim={anim}
      style={{
        width: `${String(size)}px`,
        height: `${String(size)}px`,
        "--c": colour ?? "transparent",
        "--s": `${String(size)}px`,
        "--d": `${duration.toFixed(2)}s`,
        "--o": `-${noise(seed + 2).toFixed(2)}s`,
      }}
    />
  );
}

/**
 * Places a child centred on a measured anchor.
 *
 * @param props - Anchor and content.
 * @param props.anchor - Percent position on the sprite.
 * @param props.children - What sits there.
 * @returns The positioned wrapper.
 */
export function At({
  anchor,
  children,
}: {
  anchor: Anchor;
  children: ComponentChildren;
}) {
  return (
    <span
      className={styles.at}
      style={{ left: `${String(anchor.x)}%`, top: `${String(anchor.y)}%` }}
    >
      {children}
    </span>
  );
}

/**
 * A box in percent of its sprite.
 *
 * @param box - Left, top, width and height in percent.
 * @param box.left - Left edge.
 * @param box.top - Top edge.
 * @param box.width - Width.
 * @param box.height - Height.
 * @returns Inline style.
 */
export function percentBox(box: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    left: `${String(box.left)}%`,
    top: `${String(box.top)}%`,
    width: `${String(box.width)}%`,
    height: `${String(box.height)}%`,
  };
}

/**
 * A box in percent inset from each edge.
 *
 * @param box - Insets in percent.
 * @param box.left - Left inset.
 * @param box.right - Right inset.
 * @param box.top - Top inset.
 * @param box.bottom - Bottom inset.
 * @returns Inline style.
 */
export function insetBox(box: {
  left: number;
  right: number;
  top: number;
  bottom: number;
}) {
  return {
    left: `${String(box.left)}%`,
    right: `${String(box.right)}%`,
    top: `${String(box.top)}%`,
    bottom: `${String(box.bottom)}%`,
  };
}

/**
 * The patch panel with its jacks.
 *
 * @returns The patch panel artwork.
 */
export function PatchPanel() {
  const { jacks, label } = ANCHORS.patch;
  return (
    <>
      <img className={styles.sprite} src={SPRITES.patch} alt="" />
      <span
        className={styles.strip}
        style={{ left: `${String(label.left)}%`, top: `${String(label.top)}%` }}
      >
        PATCH · 1–24
      </span>
      <span className={styles.row} style={insetBox(jacks)}>
        {Array.from({ length: 24 }, (_, index) => (
          <i key={index} className={styles.key}>
            {index % 2 === 0 ? <i className={styles.plug} /> : null}
          </i>
        ))}
      </span>
    </>
  );
}

/**
 * The 24-port switch. Link lights show which ports carry a unit; activity lights flicker
 * only while the data is fresh.
 *
 * @param props - Port state.
 * @param props.linked - How many ports carry a unit (up to 24).
 * @param props.traffic - Whether activity lights flicker.
 * @returns The switch artwork and lights.
 */
export function NetworkSwitch({
  linked,
  traffic,
}: {
  linked: number;
  traffic: boolean;
}) {
  const { led, ports } = ANCHORS.switch;
  return (
    <>
      <img className={styles.sprite} src={SPRITES.switch} alt="" />
      <At anchor={led}>
        <Led colour="#39ff6e" size={5} />
      </At>
      <span className={styles.ports} style={insetBox(ports)}>
        {[0, 1].map((row) => (
          <span key={row} className={styles["port-row"]}>
            {Array.from({ length: 12 }, (_, column) => {
              const port = row * 12 + column;
              const on = port < linked;
              return (
                <span key={column} className={styles.port}>
                  <span className={styles["port-leds"]}>
                    <Led colour={on ? "#39ff6e" : null} size={3} />
                    <Led
                      colour={on && traffic ? "#ffae1a" : null}
                      size={3}
                      animation="flicker"
                      seed={port + 100}
                    />
                  </span>
                  <i className={styles.rj} />
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </>
  );
}

const UNIT_WIDTH = 500;

/**
 * Patch cables from the panel's jacks down to the switch's top row, each with its own sag.
 *
 * @returns The cable drawing.
 */
export function PatchCables() {
  const patchHeight = UNIT_HEIGHT.patch;
  const jackY = patchHeight * 0.63;
  const keyStep = (UNIT_WIDTH * (1 - 2 * 0.086) - 15) / 23;
  const portStep = (UNIT_WIDTH * (1 - 0.13 - 0.075) - 18) / 11;
  const portY = patchHeight + 1 + UNIT_HEIGHT.switch * 0.22 + 5;
  return (
    <svg
      className={styles.cables}
      viewBox={`0 0 ${String(UNIT_WIDTH)} 130`}
      width={UNIT_WIDTH}
      height={130}
      aria-hidden="true"
    >
      <defs>
        <filter
          id="status-cable-shadow"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <linearGradient id="status-cable-boot" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".35" />
          <stop offset=".4" stop-color="#fff" stop-opacity="0" />
          <stop offset="1" stop-color="#000" stop-opacity=".35" />
        </linearGradient>
      </defs>
      {CABLE_COLOURS.map((colour, index) => {
        const x1 = UNIT_WIDTH * 0.086 + 2 * index * keyStep + 7.5;
        const x2 = UNIT_WIDTH * 0.13 + index * portStep + 11.5;
        const drop = 34 - 5 + noise(index + 7) * 13;
        const path = `M${x1.toFixed(1)} ${(jackY + 5).toFixed(1)} C ${x1.toFixed(1)} ${(jackY + drop + 18).toFixed(1)}, ${x2.toFixed(1)} ${(portY + drop).toFixed(1)}, ${x2.toFixed(1)} ${(portY + 5).toFixed(1)}`;
        return (
          <g key={index}>
            <path
              d={path}
              transform="translate(2 3)"
              stroke="rgba(0,0,0,.5)"
              stroke-width="5"
              fill="none"
              filter="url(#status-cable-shadow)"
            />
            <path
              d={path}
              stroke="#000"
              stroke-opacity=".6"
              stroke-width="4.6"
              fill="none"
            />
            <path d={path} stroke={colour} stroke-width="3.4" fill="none" />
            <path
              d={path}
              transform="translate(-.8 0)"
              stroke="rgba(255,255,255,.4)"
              stroke-width=".9"
              fill="none"
            />
            {[
              [x1, jackY],
              [x2, portY],
            ].map(([x = 0, y = 0], end) => (
              <g
                key={end}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
              >
                <rect
                  x="-4"
                  y="-4.5"
                  width="8"
                  height="10"
                  rx="1.6"
                  fill={colour}
                  stroke="#000"
                  stroke-opacity=".55"
                  stroke-width=".6"
                />
                <rect
                  x="-4"
                  y="-4.5"
                  width="8"
                  height="10"
                  rx="1.6"
                  fill="url(#status-cable-boot)"
                />
                <rect
                  x="-2.6"
                  y="-3"
                  width="5.2"
                  height="2.4"
                  rx=".6"
                  fill="rgba(0,0,0,.45)"
                />
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * A 2U section display: LED sign on the left, unit count and freshness on the right.
 *
 * @param props - Sign content.
 * @param props.title - Section name.
 * @param props.summary - Live total, such as "7/8 UP".
 * @param props.units - How many units the section holds.
 * @param props.caption - Freshness, such as "checked 3 min ago".
 * @param props.colour - Sign and light colour.
 * @param props.seed - Varies the blink timing.
 * @returns The display unit artwork.
 */
export function SectionDisplay({
  title,
  summary,
  units,
  caption,
  colour,
  seed,
}: {
  title: string;
  summary: string;
  units: number;
  caption: string;
  colour: string;
  seed: number;
}) {
  const { leds, lcd, sign } = ANCHORS.display;
  const [steady, blinking] = leds;
  return (
    <>
      <img
        className={styles.sprite}
        data-mirrored="true"
        src={SPRITES.server2u}
        alt=""
      />
      <At anchor={steady}>
        <Led colour={colour} size={6} />
      </At>
      <At anchor={blinking}>
        <Led colour={colour} size={5} animation="blink" seed={seed} />
      </At>
      <span className={styles.lcd} data-tone="units" style={percentBox(lcd)}>
        {String(units).padStart(2, "0")} {units === 1 ? "UNIT" : "UNITS"}
      </span>
      <span
        className={styles.caption}
        style={{
          left: `${String(lcd.left)}%`,
          top: `${String(lcd.top + lcd.height + 6)}%`,
        }}
      >
        {caption}
      </span>
      <span
        className={styles.sign}
        style={{ ...insetBox(sign), "--c": colour }}
      >
        <span className={styles["sign-glow"]}>
          <span className={styles["sign-text"]}>
            <span>{title}</span>
            <span>{summary}</span>
          </span>
        </span>
      </span>
    </>
  );
}

/**
 * The UPS at the foot of the rack.
 *
 * @param props - Readouts.
 * @param props.load - Average CPU load of running servers, or null when unknown.
 * @param props.players - Players online, or null when unknown.
 * @returns The UPS artwork.
 */
export function Ups({
  load,
  players,
}: {
  load: number | null;
  players: number | null;
}) {
  const { button, meter, readout } = ANCHORS.ups;
  const bars = load === null ? 0 : Math.round(load / 10);
  return (
    <>
      <img className={styles.sprite} src={SPRITES.ups} alt="" />
      <span
        className={styles.vfd}
        style={{ ...percentBox(readout), justifyContent: "center" }}
      >
        <span className={styles.line2}>ON LINE</span>
        <span className={styles.line2}>BATT 100%</span>
      </span>
      <At anchor={button}>
        <i className={styles.ring} />
      </At>
      <span
        className={styles.meter}
        style={{ left: `${String(meter.left)}%`, top: `${String(meter.top)}%` }}
      >
        {Array.from({ length: 10 }, (_, index) => (
          <i key={index} className={styles.bar} data-on={index < bars} />
        ))}
      </span>
      <span
        className={styles.small}
        style={{ left: `${String(meter.left)}%`, top: "62%" }}
      >
        {load === null ? "LOAD —" : `LOAD ${String(Math.round(load))}%`}
        {players === null ? "" : ` · ${String(players)} PLAYERS ONLINE`}
      </span>
    </>
  );
}
