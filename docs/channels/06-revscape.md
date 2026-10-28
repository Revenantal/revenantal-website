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

## Planning Notes (2026-10-28, draft, not approved)

Owner answers so far are in `project-decisions.md` → CH 06 Revscape: planning. Direction for the spec:

- **Tabs:** Inventory (project, GitHub and Steam links), Quest (GitHub activity), Stats (the servers, one tile each with players online; counts only, never names), Music (Revscape's own tracks, one plays at a time), plus Exploring XP and whichever other stones prove worthwhile.
- **Chat:** typed text shows in the chat box and above the player's head, fading after a few seconds. Local only, length-limited, plain text.
- **Guide:** "Visitor" is the player's name. Short click-to-continue dialogue with a joke, no personal details.
- **Camera:** yaw and pitch adjustable within limits, wheel zoom, compass resets north. This replaces the fixed 40° above.
- **Ambient:** wandering NPCs on the tile grid, no day and night. Walking only; run is a late revisit.
- **Code shape:** a three-free simulation (tick, grid, pathfinding, entities) that is unit-tested, a thin three.js renderer, and DOM panels.
- **Music:** Revscape gets its own library (owner decision, 2026-10-28), declared as loops in its manifest, so the host is unchanged. Tracks to source: the calm folk loop plus a handful of other town-style tunes, each CC0 or CC BY with a `content/credits.json` entry. One loop plays at a time, starting on tab selection.

## Engine Spike Plan (2026-10-28, draft, awaiting owner go-ahead)

A short, timeboxed build to answer the risky questions before the full channel is planned. It is milestones M1 and M2 below, built on a throwaway branch. It is not registered on the dial, and nothing from it ships unless it passes.

### Questions it must answer

1. **Size.** A minimal three.js scene (renderer, Lambert flat-shaded meshes, fog, lights) measured **132 KB gzip** on 2026-10-28 with three 0.186.1 and the repo's Vite. That fits the 150 KB budget with about 18 KB spare. The spike confirms it with the real scene and sim code. If it goes over, the fallback is a small hand-written WebGL renderer.
2. **Frame rate.** Does 512×334 hold 30+ fps with CPU throttling, and how many triangles does the town need?
3. **Feel.** Does walking, the camera and clicking feel like the original? The owner judges this; I cannot.
4. **Cleanup.** Does mounting and unmounting 20 times leak GPU memory or WebGL contexts?
5. **Overhead chat.** Is DOM text projected from 3D positions good enough for text above heads?

### Scope

Built on a throwaway branch (`spike/revscape-engine`) with a test page, in this order:

1. **Simulation core** (keeper code, unit-tested, no three.js): a 40×40 tile grid with blocked tiles, 8-direction pathfinding with the game's no-corner-cutting rule, a 600 ms tick, one tile per tick, and smooth movement between tiles.
2. **Renderer:** three.js with named imports only, drawn at 512×334 and scaled up with `image-rendering: pixelated`. Flat-shaded tile ground with gentle heights, black fog, the prototype's buildings, fountain and trees, a box-built player with a walk cycle.
3. **Camera:** yaw by arrow keys and middle-drag, pitch within limits, wheel zoom, compass that rotates and resets north. Eased, with the easing off under reduced motion.
4. **Picking and input:** the tile under the cursor by ray against the ground plane, box tests for buildings and NPCs, hover text top-left, left-click to walk with a yellow X, and a right-click menu with Visit, Examine, Walk here and Cancel (plain DOM, stub actions).
5. **Wandering NPCs:** three to five random walkers on the grid that avoid buildings.
6. **Overhead text:** a typed line appears above the player's head and fades after a few seconds.

### Out of scope

The interface panels, minimap, tabs, music, sounds, live data, saves, the fallback still, the hidden keyboard list and final art. These come after the plan is approved.

### Measurements

- gzip size of the lazy chunk, measured by `size-limit` as a channel chunk would be.
- Triangle count and draw calls from `renderer.info`.
- Frame time in headless Chromium with 4× CPU throttling. This VM has no GPU, so software rendering makes the numbers pessimistic and a pass here is a good sign.
- GPU memory after 20 mount/unmount cycles, and context-loss recovery.
- Unit tests for the grid, pathfinding, tick and camera maths.

### Pass criteria

- Chunk ≤ 150 KB gzip for three.js plus the sim, leaving ≤ 60 KB for the scene.
- 30+ fps throttled, under 5,000 triangles.
- No growth in GPU memory across cycles.
- The owner plays it and says the walking and camera feel right.

### After the spike

If it passes, the sim modules move into `src/channels/revscape/` and the test page is discarded. The full spec is then finished with the spike's findings, and the owner reviews it and gives the go-ahead before the channel is built. If three.js fails on size or speed, the owner chooses between a custom renderer and a lower-res or simpler scene.

## Build Milestones (2026-10-28, draft)

The channel is built in small, separate parts. Each one ends with something the owner can look at or play, with its own checks and PR. Later milestones assume the earlier ones are done and accepted. The owner approves each milestone before it is built (decided 2026-10-28), and a material scope change is re-reviewed first.

| #   | Milestone       | What you can do at the end                                                                                                                                                | Not yet there                      |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| M1  | Look around     | A still town: ground, a building for each project, the Server Hall, fountain, trees, fog and the low-res pixel look. Rotate, tilt and zoom the camera; the compass works. | Player, NPCs, clicks, interface    |
| M2  | Walk            | A player on the tile grid. Click ground to walk there with the yellow X, pathfinding around buildings, 600 ms ticks, hover tile.                                          | NPCs, menu, interface              |
| M3  | Point and visit | Hover text, right-click menu (Visit, Examine, Walk here, Cancel), Visit opens the project in a new tab. Keyboard users get the hidden list.                               | Interface frame, tabs, chat        |
| M4  | Interface frame | The stone-and-parchment frame: minimap, orbs, tab stones, chat box and the XP counter, with the game view sized to fit. Panels are static.                                | Working tabs, typing, guide        |
| M5  | Tabs with data  | Inventory (links), Quest (GitHub activity), Stats (servers; counts only), Exploring XP. All driven by the host's data.                                                    | Music, chat input                  |
| M6  | Chat and guide  | Typing in chat, text above the player's head, the live feed, and the guide NPC with click-to-continue dialogue.                                                           | Wandering NPCs, music              |
| M7  | Town life       | Wandering NPCs on the grid that avoid buildings and the player.                                                                                                           | Music, saves                       |
| M8  | Sound and music | Walk, door, XP, level-up and chat sounds, plus the Music tab with Revscape's own tracks.                                                                                  | Saves, fallback                    |
| M9  | XP and saves    | Exploring XP from visits, level-up, and `rv-save-revscape`.                                                                                                               | Fallback, final accessibility pass |
| M10 | Hardening       | The no-WebGL still with hotspots, the performance probe, reduced motion, accessibility pass, budgets, and the real-TV check. Run, if wanted.                              | —                                  |

Notes:

- **Where it lives while unfinished.** Each milestone merges to `main` without putting Revscape on the dial; it is added at position 6 only when the owner says it is ready. For viewing meanwhile, the channel loads in the dev server only.
- **Testing.** M1 and M2 are the risky ones (size, speed, feel), so they come first and are the spike. The simulation (grid, pathfinding, tick, camera maths) is pure code with unit tests; the renderer and panels are checked in the browser.
- **Reordering.** M6 and M7 can swap, and M8 can move earlier if you want music sooner. M1 to M3 stay first.

## References

- `docs/reference/mockups/ch06-revscape.png` — mockup with the full interface.
- `docs/reference/assets/revscape/revscape-3d.webp` — render from the prototype scene.
- `docs/reference/prototypes/revscape-scene.html` — the three.js prototype.
- `docs/reference/mockups/archive/town-v1-2d.png` — earlier 2D town (replaced).
