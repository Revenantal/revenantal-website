import type { LiveServer, Project } from "../../data/types";
import { CABINET, UNIT_GAP, UNIT_HEIGHT, VIEW } from "./hardware";
import type { UnitKind } from "./hardware";

/** A rack section with its own 2U display unit. */
export type Section = "projects" | "servers" | "power";

type Placed = { key: string; top: number; height: number };

type UnitData = { key: string } & (
  | { kind: Exclude<UnitKind, "display" | "server1u" | "server2u"> }
  | { kind: "display"; section: Section }
  | { kind: "server1u"; project: Project }
  | { kind: "server2u"; server: LiveServer }
);

/** One unit in the rack, placed from the top of the first rail. */
export type RackUnit = Placed & UnitData;

/** The rack laid out from data. */
export type Rack = {
  units: RackUnit[];
  /** Full rack height in channel pixels, cabinet cap included. */
  height: number;
};

/** The visible height in rack pixels. */
export const VIEW_HEIGHT = VIEW.height;
const BOTTOM_MARGIN = 60;

/**
 * Lays out the rack top to bottom: network gear, then the projects, game servers and power
 * sections, each opened by a 1U blank and a 2U display unit.
 *
 * @param projects - Visible projects, one 1U server each.
 * @param servers - Game servers, one 2U server each.
 * @returns The placed units and the rack height.
 */
export function buildRack(projects: Project[], servers: LiveServer[]): Rack {
  const units: RackUnit[] = [];
  let top = 0;
  const place = (unit: UnitData) => {
    const height = UNIT_HEIGHT[unit.kind];
    units.push({ ...unit, top, height });
    top += height + UNIT_GAP;
  };
  const section = (name: Section) => {
    place({ kind: "blank", key: `${name}-blank` });
    place({ kind: "display", key: `${name}-display`, section: name });
  };
  place({ kind: "patch", key: "patch" });
  place({ kind: "switch", key: "switch" });
  section("projects");
  for (const project of projects)
    place({ kind: "server1u", key: `project-${project.id}`, project });
  section("servers");
  for (const server of servers)
    place({ kind: "server2u", key: `server-${server.id}`, server });
  section("power");
  place({ kind: "ups", key: "ups" });
  return { units, height: CABINET.top + top + BOTTOM_MARGIN };
}

/**
 * Keeps the camera inside the rack.
 *
 * @param camera - Pixels the rack is moved up.
 * @param rackHeight - Full rack height.
 * @returns The camera within range.
 */
export function clampCamera(camera: number, rackHeight: number): number {
  return Math.min(Math.max(camera, 0), Math.max(rackHeight - VIEW_HEIGHT, 0));
}

/**
 * The camera position that centres a unit in view.
 *
 * @param unit - The unit to show.
 * @param rackHeight - Full rack height.
 * @returns Pixels to move the rack up.
 */
export function cameraFor(unit: Placed, rackHeight: number): number {
  const centre = CABINET.top + unit.top + unit.height / 2;
  return clampCamera(centre - VIEW_HEIGHT / 2, rackHeight);
}

/**
 * Where the camera starts: the projects sign near the top of the view, as in the mockup.
 *
 * @param rack - The laid-out rack.
 * @returns Pixels to move the rack up.
 */
export function initialCamera(rack: Rack): number {
  const sign = rack.units.find((unit) => unit.key === "projects-display");
  return clampCamera(CABINET.top + (sign?.top ?? 0) - 40, rack.height);
}
