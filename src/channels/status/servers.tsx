import type { TargetedMouseEvent } from "preact";
import type { LiveServer, Project, SourceState } from "../../data/types";
import { ANCHORS, COLOURS, SPRITES } from "./hardware";
import {
  STATE_WORD,
  projectState,
  readout,
  serverActivity,
  uptimeWords,
} from "./format";
import type { ProjectState } from "./format";
import { At, Led, insetBox, percentBox } from "./parts";
import styles from "./Status.module.css";

/** Shared selection wiring: selection follows focus; the first mouse click only selects. */
export type Selectable = {
  selected: boolean;
  top: number;
  height: number;
  seed: number;
  onSelect: () => void;
  /** Whether this unit was already selected when the pointer went down. */
  wasSelected: () => boolean;
  onPointerDown: () => void;
};

const PROJECT_COLOUR: Record<ProjectState, string | null> = {
  up: COLOURS.up,
  slow: COLOURS.slow,
  down: COLOURS.down,
  unknown: null,
};

const TYPE_LABEL: Record<Project["type"], string> = {
  site: "Site",
  tool: "Tool",
  sandbox: "Sandbox",
};

const MARQUEE_AFTER = 44;

/**
 * True for a click that came from a pointer rather than Enter or Space.
 *
 * @param event - The click.
 * @returns Whether a pointer made the click.
 */
function pointerClick(event: TargetedMouseEvent<HTMLElement>): boolean {
  return event.detail > 0;
}

/**
 * One project as a 1U server: a link that opens the project in a new tab.
 *
 * @param props - The project, its response time (while the status source is fresh) and
 *   selection wiring.
 * @returns The 1U server.
 */
export function ProjectServer(
  props: Selectable & { project: Project; ms: number | undefined },
) {
  const {
    project,
    ms,
    selected,
    top,
    height,
    seed,
    onSelect,
    wasSelected,
    onPointerDown,
  } = props;
  const state = projectState(project);
  const colour = PROJECT_COLOUR[state];
  const active = state === "up" || state === "slow";
  const { display, leds, readout: window } = ANCHORS.server1u;
  const text = readout(ms, state);
  const spoken = [
    project.name,
    state === "unknown" ? "status unknown" : state,
    ms !== undefined && active
      ? `${String(Math.round(ms))} milliseconds`
      : null,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <a
      className={styles.server}
      data-selected={selected}
      style={{ top: `${String(top)}px`, height: `${String(height)}px` }}
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      onFocus={onSelect}
      onPointerDown={onPointerDown}
      onClick={(event) => {
        if (pointerClick(event) && !wasSelected()) event.preventDefault();
      }}
    >
      <span className={styles["sr-only"]}>
        {`${spoken}. ${project.desc} (opens in a new tab)`}
      </span>
      <span className={styles.visual} aria-hidden="true">
        <img className={styles.sprite} src={SPRITES.server1u} alt="" />
        {leds.map((anchor, index) => (
          <At key={index} anchor={anchor}>
            {index === 0 ? (
              <Led colour={colour} size={5} />
            ) : (
              <Led
                colour={active ? COLOURS.activity : null}
                size={4}
                animation="flicker"
                seed={seed * 3 + index}
              />
            )}
          </At>
        ))}
        <span className={styles.vfd} style={percentBox(display)}>
          <span className={styles.line1}>
            <span className={styles.name}>{project.name.toUpperCase()}</span>
            <span
              className={styles.state}
              style={{ color: colour ?? "#4d6a55" }}
            >
              ● {STATE_WORD[state]}
            </span>
          </span>
          <span className={styles.line2}>
            <span className={styles.dim}>
              {project.host} · {TYPE_LABEL[project.type]} ·
            </span>{" "}
            <span
              className={styles.marquee}
              data-long={project.desc.length > MARQUEE_AFTER}
            >
              {project.desc}
            </span>
          </span>
        </span>
        <span
          className={styles.lcd}
          data-tone={state === "up" ? undefined : state}
          style={percentBox(window)}
        >
          {text}
        </span>
      </span>
    </a>
  );
}

const SERVER_COLOUR: Record<LiveServer["state"], string | null> = {
  running: COLOURS.up,
  starting: COLOURS.slow,
  stopping: COLOURS.slow,
  maintenance: COLOURS.slow,
  offline: null,
  unknown: null,
};

/**
 * Spoken players and uptime for a running server.
 *
 * @param server - A running server.
 * @returns For example "3 of 20 players, up 4 days".
 */
function spokenActivity(server: LiveServer): string {
  const players =
    server.players === undefined
      ? "player count unknown"
      : `${String(server.players)} of ${String(server.maxPlayers ?? "?")} players`;
  return server.uptimeSec === undefined
    ? players
    : `${players}, up ${uptimeWords(server.uptimeSec)}`;
}

/**
 * One game server as a 2U server: a button that copies its published address.
 *
 * @param props - The server, the servers source state, the display clock, the copy action
 *   and selection wiring.
 * @returns The 2U server.
 */
export function GameServer(
  props: Selectable & {
    server: LiveServer;
    source: SourceState;
    now: Date;
    onCopy: (address: string) => void;
  },
) {
  const {
    server,
    source,
    now,
    onCopy,
    selected,
    top,
    height,
    seed,
    onSelect,
    wasSelected,
    onPointerDown,
  } = props;
  const colour = SERVER_COLOUR[server.state];
  const running = server.state === "running";
  const lit = server.state !== "offline" && server.state !== "unknown";
  const { display, leds, trays } = ANCHORS.server2u;
  const traffic = (server.netRxBps ?? 0) + (server.netTxBps ?? 0);
  // Faster tray lights with more traffic: about 1.2 s idle down to 0.15 s busy.
  const trayPeriod = Math.min(
    1.2,
    Math.max(0.15, 1.2 - Math.log10(1 + traffic) / 6),
  );
  const activity = serverActivity(server, source, now);
  const state =
    server.state === "unknown"
      ? "status unknown"
      : STATE_WORD[server.state].toLowerCase();
  const spoken = [
    server.name,
    server.game,
    state,
    running
      ? spokenActivity(server)
      : server.state === "unknown"
        ? activity
        : null,
  ]
    .filter(Boolean)
    .join(", ");
  const [statusLed, blinkLed, spareLed] = leds;
  return (
    <button
      type="button"
      className={styles.server}
      data-selected={selected}
      data-dim={!lit}
      style={{ top: `${String(top)}px`, height: `${String(height)}px` }}
      onFocus={onSelect}
      onPointerDown={onPointerDown}
      onClick={(event) => {
        if (pointerClick(event) && !wasSelected()) return;
        if (server.address) onCopy(server.address);
      }}
    >
      <span className={styles["sr-only"]}>
        {`${spoken}. ${
          server.address
            ? `Press to copy the address ${server.address}`
            : "No public address"
        }`}
      </span>
      <span className={styles.visual} aria-hidden="true">
        <img className={styles.sprite} src={SPRITES.server2u} alt="" />
        <At anchor={statusLed}>
          <Led colour={colour} size={6} />
        </At>
        <At anchor={blinkLed}>
          <Led
            colour={running ? COLOURS.activity : null}
            size={5}
            animation="blink"
            seed={seed * 5}
            period={0.4 + (seed % 5) * 0.12}
          />
        </At>
        <At anchor={spareLed}>
          <Led colour={null} size={5} />
        </At>
        <span
          className={styles.vfd}
          data-off={!lit}
          style={percentBox(display)}
        >
          <span className={styles.line1}>
            <span className={styles.name}>{server.name.toUpperCase()}</span>
            <span className={styles.game}>· {server.game}</span>
            <span
              className={styles.state}
              style={{ color: colour ?? "#6a7a70" }}
            >
              ● {STATE_WORD[server.state]}
            </span>
          </span>
          <span className={styles.line2}>{activity}</span>
          <span className={styles.line2}>
            {server.address ? (
              <>
                <span className={styles.dim}>CONNECT</span>{" "}
                <span className={styles.bright}>{server.address}</span>
              </>
            ) : (
              <span className={styles.dim}>no public address</span>
            )}
          </span>
          <span className={styles.line2}>
            {selected && server.address ? (
              <span className={styles.bright}>[ENTER] COPY ADDRESS</span>
            ) : (
              <span className={styles.dim}>connect from your game client</span>
            )}
          </span>
        </span>
        <span className={styles.trays} style={insetBox(trays)}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={styles.tray}>
              <img src={SPRITES.tray} alt="" />
              <At anchor={ANCHORS.tray.led}>
                <Led
                  colour={
                    running
                      ? colour
                      : server.state === "starting"
                        ? colour
                        : null
                  }
                  size={2}
                  animation={running ? "blink" : "steady"}
                  seed={seed * 11 + index}
                  period={trayPeriod * (0.7 + ((seed + index) % 4) * 0.15)}
                />
              </At>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
