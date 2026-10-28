# CH 06 — Revscape

## Summary

A real-time low-poly 3D town in the style of classic RuneScape, with its interface. Projects are buildings to visit. The most complex channel, built last.

- **Kind:** game · **Folder:** `revscape` · **Build:** task 5.3 · **Status:** M1 (look around) built, dev-only; M2 to M10 not started

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
- Camera: pitch adjustable from 25° to 65°, starting at 40°. Dragging turns and tilts; ←/→ turn and ↑/↓ tilt while captured; wheel and Page Up/Down zoom within limits; click the compass to face north.
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

- **Where it lives while unfinished.** The whole of Revscape is built on one long-running branch, `feat/revscape` (owner decision, 2026-10-28). Milestones are commits on it, each approved by the owner before it is built; nothing merges to `main` until the owner says the channel is ready, and then it is one PR that also registers position 6. It stays dev-only on the branch (open `#ch6` in the dev server).
- **Testing.** M1 and M2 are the risky ones (size, speed, feel), so they come first and are the spike. The simulation (grid, pathfinding, tick, camera maths) is pure code with unit tests; the renderer and panels are checked in the browser.
- **Reordering.** M6 and M7 can swap, and M8 can move earlier if you want music sooner. M1 to M3 stay first.

## M1 Plan: Look Around (approved 2026-10-28, built)

**Goal:** a still low-poly town the visitor can look around. No player, NPCs, clicks or interface. It proves the three.js size, speed and pixel look before anything else is built.

### What you can do

- Rotate (drag with the middle or left mouse button, or ←/→ once PRESS START has captured the keys), tilt (drag up and down, or ↑/↓ while captured) and zoom (wheel) within limits.
- Click the compass to face north. The compass needle turns with the camera.
- See one building per project around the fountain square, the Server Hall, trees, a fence, a market stall, crates, and black fog at the draw distance.

### Layout and data

- Full-bleed 760×570 canvas rendered at 512×334 and scaled up with `image-rendering: pixelated`. Display profile: scan 0.4, no flicker, glow 0.7.
- Buildings come from `projects` in order. Plots are placed on rings around the square, so 0, 1 and 30 projects all work and the town grows outward. The Server Hall is always there; `servers` is not used until M5.
- Each building gets a small deterministic variation (wall colour, roof colour, size) from its project ID, so the town looks the same on every visit.
- No saves, sound or live data in M1.

### Technology

- three.js with named imports only, loaded with the channel. The size must come in at or under 150 KB gzip for three.js plus scene code, measured by `size-limit`.
- The world is generated in code (boxes, prisms, icospheres, vertex-coloured ground) and merged into a few meshes. Target under 5,000 triangles.
- Camera maths (yaw, pitch and zoom limits, easing) lives in a three-free module with unit tests. The channel is a thin renderer around it.
- The compass is a small DOM button over the canvas, so it is keyboard-reachable and has a label.
- Uses the shared PRESS START overlay. Without PRESS START, only mouse drag, wheel and the compass work, and the arrow keys keep turning the dial.

### Accessibility and fallback

- Every project is also in a visually hidden list of links, in the same order as the buildings, so keyboard and screen-reader visitors can reach each one. The contract's new-tab link check applies.
- Reduced motion turns off camera easing and fog drift; the camera snaps.
- Without WebGL, M1 shows a plain message plus the same list of project links. The pre-rendered still with hotspots comes in M10.
- The render loop runs only while `active`, and the renderer, geometries and materials are disposed on unmount and on context loss.

### M1 as built (2026-10-28)

- **Files:** `camera.ts` (orbit, drag, wheel, pan, held keys, easing and limits), `town.ts` (layout), `mesh-builder.ts` and `world.ts` (flat-shaded triangles in chunks), `scene.ts` (the only file that imports three.js), `ChannelComponent.tsx` and `Revscape.module.css`. Everything except `scene.ts` is three-free and unit-tested.
- **Opening it:** `pnpm dev`, then go to `http://localhost:5173/#ch6`. It is registered only in the dev server and in a preview build (`VITE_REVSCAPE_PREVIEW=1`), so the production site is unchanged. `pnpm size:revscape` builds the preview and checks the chunk.
- **Controls:** drag to turn and tilt, wheel to zoom, Shift+drag to move the view (a temporary aid; the camera will follow the player from M2), compass to face north. PRESS START is a strip along the bottom, not a full screen, because the mouse works without the keyboard. After it, ←/→ turn, ↑/↓ tilt, Page Up/Down zoom, Esc releases.
- **The town:** the Server Hall sits on the nearest plot (with a chimney), then each project in order on plots spiralling outward. Looks come from a hash of the project ID, so a project never changes. The world is 40×40 tiles, growing by two tiles at a time when 30 projects need more room. Ground, roofs, doors, windows, trees, a fountain, a market stall, crates and a fence are all generated in code.
- **Render:** a 512×384 canvas scaled up pixelated, flat-shaded Lambert with vertex colours, black fog from 6 to 10 tiles beyond the view's centre, one mesh per 10-tile chunk so chunks out of view are skipped.
- **Measured** (headless Chromium, software WebGL, 1920×1080): about 3,400 triangles and 9 to 14 draw calls per frame with 0 projects, 3,900 with 8 and 4,400 with 30, all under the 5,000 budget. Chunk: 135 KB gzip against 150 KB. Twenty tune-away and back cycles left one canvas and raised no WebGL context warnings. Under a 4× CPU throttle with no GPU, holding a key ran at about 16 fps, which says little about a real laptop.
- **No WebGL:** a plain message and the project links. A lost context frees the scene and shows the same.
- **Left for later milestones:** the visible build of PRESS START as the game's main menu (M4), the Pixelify Sans font (M4), the pre-rendered still with hotspots (M10).
- **To do on the real TV:** judge the look and the feel of the camera.

### Not in M1

The player, pathfinding, NPCs, hover text, menus, interface frame, minimap, tabs, chat, sounds, music, saves and the fallback still.

### Validation

- Unit tests for the camera maths and the town layout (0, 1 and 30 projects, no overlapping plots, deterministic).
- The shared contract test, with PRESS START.
- Size-limit entry for the Revscape chunk (150 KB).
- Browser checks in headless Chromium: it renders, the camera rotates, tilts and zooms, the compass resets north, there are no console errors, and 20 mount/unmount cycles leave no leaked WebGL contexts. `renderer.info` gives the triangle and draw-call counts. This VM has no GPU, so frame rates are pessimistic.
- You look at it on the real TV and judge the look.

### Choices (settled)

1. **Registration (decided 2026-10-28): dev-only.** Revscape stays off the dial until the owner says it is ready. A dev-only way to open it is part of M1.
2. **Pitch range (approved):** 25° to 65°, starting at 40°.
3. **Town size (approved):** a 40×40 tile world with a draw distance of about 12 tiles. The world grows in steps when there are more projects than fit.

## References

- `docs/reference/mockups/ch06-revscape.png` — mockup with the full interface.
- `docs/reference/assets/revscape/revscape-3d.webp` — render from the prototype scene.
- `docs/reference/prototypes/revscape-scene.html` — the three.js prototype.
- `docs/reference/mockups/archive/town-v1-2d.png` — earlier 2D town (replaced).
