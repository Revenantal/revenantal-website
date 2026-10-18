# CH 04 — Night Drive

## Summary

An OutRun-style pseudo-3D drive at dusk. Projects are highway exit signs; take an exit to open one.

- **Kind:** game · **Folder:** `night-drive` · **Build:** task 5.2 · **Status:** design done (v2); art direction needs a lift at build

## Concept

A curving road toward a big low sun and a city skyline, with palms along the shoulder. Green highway signs roll toward the player: "EXIT 3 · PROJECT C · c.revenantal.com · ¼ MILE". Change lanes to line up and take the exit to open the project. A billboard shows what's playing on Steam. A radio widget names the music track.

## Data Shown

| Element          | Props                                            |
| ---------------- | ------------------------------------------------ |
| Exit signs       | `projects`, in order, one exit each              |
| Billboard        | `live.steam` now playing                         |
| Stage / progress | Exits passed out of total projects               |
| Radio            | Current music track name (from the credits list) |
| HUD              | Speed in km/h, time, score                       |

## Interaction

- PRESS START to capture keys (see `channel-rules.md`).
- ←/→ or A/D change lane; ↑ or Enter takes the exit when the sign is close; Space boosts.
- Mouse: click a sign to take that exit.
- Taking an exit opens the project in a new tab and keeps the game running when the viewer comes back.

## Look

- Dusk palette: magenta and orange sky, purple hills, cyan road lines, green signs.
- Feedback was that the mockup "looks like it was made in Paint". The build must look polished: smooth gradients, a proper sun with scanline bands, light glow on signs, motion blur on roadside objects, no flat MS-Paint fills.
- Fonts: Archivo Black (signs, billboard), Press Start 2P (HUD).
- Display profile: scan 0.8, flicker, glow 1. Full-bleed (`safe: false`).

## Sound

Synthwave loop, engine drone, sign whoosh, indicator tick, exit chime. See `soundscapes.md` → Night Drive.

## Build Notes

- Classic segment-based pseudo-3D road on a 2D canvas (no 3D library). Project segments, scale sprites by depth.
- Fixed-step update loop with interpolated render; pause when `active` is false.
- Signs cycle when there are more projects than exits on screen.
- Budget: ≤ 80 KB code, ≤ 120 KB art.

## Acceptance

- Every project reachable; works with 1 and 30 projects (0 projects → empty highway with a "No exits yet" sign).
- Keyboard-only play works; Esc releases.
- Holds frame rate on a 2020-era laptop.

## References

- `docs/reference/mockups/ch04-night-drive.png`
- Prototype source: `docs/reference/prototypes/boards/ChDrive.dc.html`
