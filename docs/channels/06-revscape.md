# CH 06 — Revscape

## Summary

A real-time low-poly 3D town in the style of classic RuneScape, with its interface. Projects are buildings to visit. The most complex channel, built last.

- **Kind:** game · **Folder:** `revscape` · **Build:** task 5.3 · **Status:** 3D prototype done

## Concept

A small town square on a tile grid with black fog at the draw distance, like the original game. Each project is a building on a plot around the square. The Server Hall holds the game servers. A guide NPC greets first-time visitors. The classic interface surrounds the view: hover text, right-click menu, minimap with orbs, inventory and chat box.

## Data Shown

| Element     | Props                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Buildings   | `projects`, one each, in project order                                   |
| Server Hall | `servers`                                                                |
| Orbs        | Steam level, servers up, uptime, projects                                |
| Inventory   | Items are links: logs = git log, coins = games owned, scrolls = projects |
| Chat box    | Streams live data (pushes, now playing, server changes)                  |
| Skills      | Exploring XP from visits                                                 |

## Interaction

- PRESS START to capture keys.
- Click a tile to walk there (A* on the tile grid; a yellow X marks the spot).
- Right-click opens Visit / Examine / Walk here / Cancel. Hover text sits top-left.
- Camera: fixed pitch about 40°. ←/→ (while captured) or middle-drag rotates; wheel zooms within limits; click the compass to face north.
- Visiting a building opens the project in a new tab and awards XP (XP drop + level-up).
- Chat box filter buttons (All, Game, Public, …) filter the live feed.

## Look

- Low-poly, flat-shaded models with a muted, earthy palette.
- Interface in stone-and-parchment style, drawn for this project.
- Font: Pixelify Sans.
- Display profile: scan 0.4, no flicker, glow 0.7. Full-bleed.

## Sound

Calm medieval folk loop; walk, door, XP, original level-up fanfare, chat blip. See `soundscapes.md` → Revscape.

## Build Notes

- **Engine:** three.js, lazy-loaded with the channel. Models built in code or small glTF files. World about 40×40 tiles.
- **Performance:** render at 512×334 and scale up for a crisp low-res look; under 5,000 triangles; pause when inactive.
- **Fallback:** without WebGL, or when the perf probe trips, show a pre-rendered still (made from the same scene at build time) with clickable hotspots.
- **Budget:** about 150 KB gzip for three.js plus ≤ 60 KB for the scene. This is an agreed exception to the 80 KB game budget.
- **Saves:** XP and visited buildings in `rv-save-revscape`.
- **Original only:** the name is Revscape. No Jagex logos, fonts, models, textures, sounds or music.
- Interface panels are DOM over the canvas (accessible, crisp text); the 3D view is the canvas only.

## Acceptance

- Every project reachable by walking and by right-click → Visit; also by Tab through a hidden list for keyboard users.
- Works with 1 and 30 projects (plots grow outward).
- WebGL-off fallback works.
- Holds frame rate on a 2020-era laptop.

## References

- `docs/reference/mockups/ch06-revscape.png` — mockup with the full interface.
- `docs/reference/assets/revscape/revscape-3d.webp` — render from the prototype scene.
- `docs/reference/prototypes/revscape-scene.html` — the three.js prototype.
- `docs/reference/mockups/archive/town-v1-2d.png` — earlier 2D town (replaced).
