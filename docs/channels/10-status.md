# CH 10 — Status

## Summary

One tall photo-real 19-inch server rack. Every project is a server, every game server is a bigger server, and every light and display is drawn live from data. The SERVERS panel button tunes here.

- **Kind:** directory · **Folder:** `status` · **Build:** task 3.2 (launch) · **Status:** built (approved 2026-10-19)

## Concept

The view is a close-up of one rack that pans up and down as the selection moves. There is no side map and no nav bar.

From top to bottom:

1. **Network gear:** a patch panel with realistic patch cables running down into a 24-port switch. Port lights flicker with traffic.
2. **Projects section:** a 1U blank, then a 2U display unit, then one 1U server per project.
3. **Game servers section:** a 1U blank, then a 2U display unit, then one 2U server per Pelican server.
4. **Power section:** a 1U blank, a 2U display unit, then the UPS at the bottom.

### Section display unit (2U)

The 2U server chassis, mirrored. On the left, in the recessed bay, an LED dot-matrix sign (Press Start 2P, amber) shows the section name and a live total (e.g. "GAME SERVERS / 10 PLAYERS"). On the right are a small LCD showing the unit count ("04 UNITS") and the status LEDs.

### Project server (1U)

- Status LED plus two activity LEDs (flickering).
- A VFD-style front display over the grille shows the project name, a LIVE/NEW tag, status ("● UP") on line one, and "host · type · description" on line two. When the server is selected, the description scrolls as a marquee.
- A readout window shows response time (e.g. "121ms").

### Game server (2U)

- Status LED plus two LEDs.
- A 4-line display:
  1. Name · game · state ("● RUNNING", amber "STARTING", grey "OFFLINE", amber "MAINTENANCE").
  2. Players · uptime ("3/20 players · up 4d"), or "booting…", or "sample 2 days old" when stale.
  3. CONNECT address, only when `showAddress` is true.
  4. When selected: "[ENTER] COPY ADDRESS"; otherwise "connect from your game client".
- 8 drive trays whose lights blink faster with network traffic.

### Footer

A small line: local time, snapshot age ("snapshot 8 min old"), and key hints ("Tab select · Enter open / copy"). Each section display shows its own source caption under the unit count ("checked 3 min ago", "STALE · 5 h old" or "NO DATA"), from the host's `freshness` prop. Do not show a next-poll countdown: this page does not poll.

## Data Shown

| Element                    | Props                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| Project servers            | `projects` with `live.status` (state, ms)                              |
| Game servers               | `servers` (fields in `docs/architecture/pelican-agent.md`)             |
| Section signs              | Counts: projects up, total players, power/uptime summary               |
| Clock, snapshot/source age | `now`, `live.fetchedAt`, `live.sources.status`, `live.sources.servers` |

Missing or stale data shows as unknown (dim LEDs, "—"), never as down. Follow the shared freshness rules in `docs/architecture/live-data.md`: omit stale telemetry and player totals, and stop traffic-driven LEDs. Do not interpret sample age as the time a server was last online. Player names are never shown.

## Interaction

- Every project is a link and every game server a button, in Tab order. Selection follows focus. The arrow keys keep turning the dial (no key capture at launch; arrow selection may come with task 4.3).
- Enter on a project opens it in a new tab. Enter on a game server copies its address (if published), announced in a polite live region; a failed copy announces the address instead.
- Click any server to select it; click again to open/copy.
- The camera eases to centre the selected unit. The mouse wheel pans the rack.

## Look

- Dark server-room background, cool steel rack, warm LEDs.
- Fonts: Press Start 2P (LED signs, loaded only with this channel) and VT323 (displays and readouts).
- Display profile: no scan, no flicker, glow 0.4, `transition: 'cut'`. `safe: false` (owner request): the rack is drawn at mockup size and zoomed 1.4× (`ZOOM` in `hardware.ts`) so the servers fill the glass and the cabinet sides crop off; the footer stays 6% in from the edges.

## Sound

None yet. A quiet server-room hum loop awaits owner approval of a CC0 recording. There is no refresh tick: the page fetches data once.

## Art Pipeline

- Each hardware piece is a photo generated on plain white with flat recessed areas where patterns go: 1U server, 2U server, drive tray, 24-port switch, patch panel, UPS, 1U blank and the empty cabinet.
- A script in `tools/assets` keys the background by flood-fill from the edges, makes only rack-ear holes see-through (blobs in the outer 3.5% that are wider than tall, so silver handles stay solid), crops, and exports WebP at 2× display width.
- **Patterns are drawn, not generated.** Honeycomb grilles, switch ports, keystone jacks and drive trays (one tray image, tiled) are drawn in code on top of the photos, because image models can't keep them regular.
- **Cabinet:** the top cap is one image; below it a 28 px-period rail slice repeats, so the rack can be any height.
- **Lights:** every LED, readout and display window is placed from the measured table below, kept in `channels/status/hardware.ts`. Light wrappers use `display: flex; line-height: 0` and are centred on the measured hole, so nothing drifts.
- **Flicker:** activity LEDs use several keyframe sets (`flick1/2/3`) with random offsets so they don't pulse together.

## Measured Hardware Anchors

Percent of each sprite's width / height.

| Part            | Feature                     | Position                                         |
| --------------- | --------------------------- | ------------------------------------------------ |
| 1U server       | Status + 2 activity LEDs    | x 10.63; y 33.5 / 51.4 / 69.5                    |
| 1U server       | Readout window              | x 80.8, y 26, 9 × 47                             |
| 1U server       | Front display (over grille) | x 15.5–76.5, y 17–83                             |
| 2U server       | Status + 2 LEDs             | x 11.35; y 33.2 / 49.2 / 65.0                    |
| 2U server       | Readout window / bay recess | x 21–35.5 × y 32–67 / x 45.3–91.9 × y 9–91       |
| 2U display unit | Same chassis, mirrored      | LEDs x 88.65; LED sign in recess x 8.5–45.9      |
| Drive tray      | Activity LED                | x 49.5, y 7.8                                    |
| Switch          | Power LED / port strip      | x 8.16, y 51 / x 12.1–93.5 × y 21–81             |
| Patch panel     | Label strip / jack strip    | y 8–24 / y 36–90 (x 7.9–92.2)                    |
| UPS             | Readout / buttons           | x 10.9–27.7 × y 25–75 / x 32.25, y 37.1 and 64.7 |
| Cabinet         | Rail ear span / first unit  | x 9.7–90.3 / y 10.5 from top                     |

## Build Notes

- Lay out the rack from data: a list of units (`blank`, `display`, `server1u`, `server2u`, `switch`, `patch`, `ups`), each with a height in U. The rack height and camera range come from the list.
- Patch cables are SVG paths with a soft shadow, generated per port, with slight sag.
- Use `transform` for the camera pan, eased.
- Copy uses the Clipboard API with a fallback, and an `aria-live` "Address copied".

## Acceptance

- Every project and server reachable and announced to screen readers ("Project C, up, 121 milliseconds").
- Works with 0 servers (section shows "00 UNITS" and a blank), 30 projects, and `live = null`.
- A stopped agent or job, and an open page aging past a freshness limit, show unknown state and no stale counters. Source ages remain distinct from snapshot age.
- Addresses only for `showAddress: true`; placeholders never ship.
- LEDs line up with their holes at every scale.

## References

- `docs/reference/mockups/ch10-status-projects.png` — approved, projects view.
- `docs/reference/mockups/ch10-status-game-servers.png` — approved, game servers view.
- `docs/reference/mockups/archive/` — options A (dashboard), C (departures board), D (control console), not chosen.
- `docs/reference/assets/rack/` — cleaned sprites.
- `docs/reference/prototypes/build_rack.py` — the rack generator used for the mockups.
