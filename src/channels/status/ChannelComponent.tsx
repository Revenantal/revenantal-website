import "@fontsource/press-start-2p/latin-400.css";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import { CABINET, COLOURS, SPRITES, VIEW, ZOOM } from "./hardware";
import { age, clock, sourceCaption } from "./format";
import {
  NetworkSwitch,
  PatchCables,
  PatchPanel,
  SectionDisplay,
  Ups,
} from "./parts";
import { buildRack, cameraFor, clampCamera, initialCamera } from "./rack";
import type { RackUnit, Section } from "./rack";
import { GameServer, ProjectServer } from "./servers";
import styles from "./Status.module.css";

const SECTION_TITLE: Record<Section, string> = {
  projects: "PROJECTS",
  servers: "GAME SERVERS",
  power: "POWER",
};

/**
 * CH 10 Status: one tall server rack drawn live from data. Every project is a 1U server
 * (a link), every game server a 2U server (a button that copies its address). The rack pans
 * to whichever unit has focus or was clicked.
 *
 * @param props - Host props.
 * @returns The rack.
 */
export function ChannelComponent(props: ChannelProps) {
  const { projects, live, freshness, now, active, reducedMotion } = props;
  const servers = useMemo(() => props.servers ?? [], [props.servers]);
  const rack = useMemo(() => buildRack(projects, servers), [projects, servers]);
  const [camera, setCamera] = useState(() => initialCamera(rack));
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const pressedRef = useRef<string | null>(null);

  // Keep the camera inside a rack that shrank when data changed.
  useEffect(() => {
    setCamera((current) => clampCamera(current, rack.height));
  }, [rack.height]);

  const statusFresh = freshness.status.state === "fresh";
  const serversFresh = freshness.servers.state === "fresh";
  const up = projects.filter(
    (project) => project.status === "up" || project.status === "slow",
  ).length;
  const running = servers.filter((server) => server.state === "running");
  const players = serversFresh
    ? running.reduce((total, server) => total + (server.players ?? 0), 0)
    : null;
  const loads = running.flatMap((server) =>
    server.cpuPct === undefined ? [] : [server.cpuPct],
  );
  const load =
    serversFresh && loads.length > 0
      ? loads.reduce((total, value) => total + value, 0) / loads.length
      : null;

  const sections: Record<
    Section,
    { summary: string; units: number; caption: string; colour: string }
  > = {
    projects: {
      summary: statusFresh
        ? `${String(up)}/${String(projects.length)} UP`
        : "NO STATUS",
      units: projects.length,
      caption: sourceCaption(freshness.status, now),
      colour: COLOURS.projects,
    },
    servers: {
      summary: players === null ? "-- PLAYERS" : `${String(players)} PLAYERS`,
      units: servers.length,
      caption: sourceCaption(freshness.servers, now),
      colour: COLOURS.servers,
    },
    power: {
      summary: "ON LINE",
      units: 1,
      caption: "",
      colour: COLOURS.power,
    },
  };

  const select = (unit: RackUnit) => {
    setSelected(unit.key);
    setCamera(cameraFor(unit, rack.height));
  };

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setMessage(`Address copied: ${address}`);
    } catch {
      setMessage(`Copy failed. The address is ${address}`);
    }
  };

  const snapshot = live ? age(live.fetchedAt, now) : null;
  const footer = [
    clock(now),
    snapshot ? `snapshot ${snapshot} old` : "no snapshot",
    "Tab select · Enter open / copy",
  ].join(" · ");

  return (
    <div
      className={styles.root}
      data-active={active}
      data-motion={reducedMotion ? "reduced" : "full"}
      onWheel={(event) => {
        event.preventDefault();
        setCamera((current) =>
          clampCamera(current + event.deltaY / ZOOM, rack.height),
        );
      }}
    >
      <h2 className={styles["sr-only"]}>Status</h2>
      <div
        className={styles.zoom}
        style={{
          width: `${String(VIEW.width)}px`,
          height: `${String(VIEW.height)}px`,
          transform: `scale(${String(ZOOM)})`,
        }}
      >
        <div
          className={styles.rack}
          style={{
            left: `${String(CABINET.left)}px`,
            height: `${String(rack.height)}px`,
            transform: `translateY(${String(-camera)}px)`,
          }}
        >
          <img className={styles.cap} src={SPRITES.cabTop} alt="" />
          <div
            className={styles.rails}
            style={{ backgroundImage: `url(${SPRITES.cabMid})` }}
          />
          <div className={styles.units}>
            {rack.units.map((unit, position) => {
              const box = {
                top: `${String(unit.top)}px`,
                height: `${String(unit.height)}px`,
              };
              const seed = position + 1;
              const selection = {
                selected: selected === unit.key,
                top: unit.top,
                height: unit.height,
                seed,
                onSelect: () => {
                  select(unit);
                },
                wasSelected: () => pressedRef.current === unit.key,
                onPointerDown: () => {
                  pressedRef.current = selected;
                },
              };
              switch (unit.kind) {
                case "server1u":
                  return (
                    <ProjectServer
                      key={unit.key}
                      {...selection}
                      project={unit.project}
                      ms={live?.status?.[unit.project.id]?.ms}
                    />
                  );
                case "server2u":
                  return (
                    <GameServer
                      key={unit.key}
                      {...selection}
                      server={unit.server}
                      source={freshness.servers}
                      now={now}
                      onCopy={(address) => {
                        void copy(address);
                      }}
                    />
                  );
                case "display": {
                  const section = sections[unit.section];
                  return (
                    <div key={unit.key} className={styles.unit} style={box}>
                      {unit.section === "power" ? null : (
                        <h3 className={styles["sr-only"]}>
                          {`${SECTION_TITLE[unit.section]}: ${section.summary}, ${section.caption}`}
                        </h3>
                      )}
                      <div aria-hidden="true">
                        <SectionDisplay
                          title={SECTION_TITLE[unit.section]}
                          summary={section.summary}
                          units={section.units}
                          caption={section.caption}
                          colour={section.colour}
                          seed={seed}
                        />
                      </div>
                    </div>
                  );
                }
                case "patch":
                  return (
                    <div
                      key={unit.key}
                      className={styles.unit}
                      style={box}
                      aria-hidden="true"
                    >
                      <PatchPanel />
                    </div>
                  );
                case "switch":
                  return (
                    <div
                      key={unit.key}
                      className={styles.unit}
                      style={box}
                      aria-hidden="true"
                    >
                      <NetworkSwitch
                        linked={Math.min(24, projects.length + servers.length)}
                        traffic={statusFresh || serversFresh}
                      />
                    </div>
                  );
                case "blank":
                  return (
                    <div
                      key={unit.key}
                      className={styles.unit}
                      style={box}
                      aria-hidden="true"
                    >
                      <img
                        className={styles.sprite}
                        src={SPRITES.blank}
                        alt=""
                      />
                    </div>
                  );
                case "ups":
                  return (
                    <div
                      key={unit.key}
                      className={styles.unit}
                      style={box}
                      aria-hidden="true"
                    >
                      <Ups load={load} players={players} />
                    </div>
                  );
              }
            })}
            <PatchCables />
          </div>
        </div>
      </div>
      <div className={styles["fade-top"]} />
      <div className={styles["fade-bottom"]} />
      <p className={styles.footer}>{footer}</p>
      <p className={styles["sr-only"]} role="status">
        {message}
      </p>
    </div>
  );
}
