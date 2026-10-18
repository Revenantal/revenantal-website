# CH 05 — Side Quest

## Summary

An original pixel platformer at sunset. Run, jump and enter doors to open projects. "Mario vibe" in feel only; every asset is original.

- **Kind:** game · **Folder:** `side-quest` · **Build:** task 5.1 · **Status:** design done (v2, livelier)

## Concept

The hero is an original red cube-bot with a scarf. The level runs past a castle on the hill and a waterfall, over moving platforms above water. Projects appear as buildings with doors: a storefront, a tower and a portal. Walk up and press ↑ to enter. A progress bar at the top shows projects A–H as they're visited.

## Data Shown

| Element      | Props                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| Doors        | `projects`, one door each, styled by type (site = storefront, tool = tower, sandbox = portal) |
| NEW! tag     | Projects pushed to recently (from `live.github`, matched by name)                             |
| Progress bar | Visited projects                                                                              |
| HUD          | Hearts, coins, score, time, level                                                             |

## Interaction

- PRESS START to capture keys.
- ←/→ move, Space jump, ↑ or Enter enters a door. Esc releases.
- Entering a door opens the project in a new tab and marks it visited.

## Things in the Level

- **Coins** to collect.
- **SAVE** floppy power-ups.
- **Bugs** — the "404" enemies; stomp them.
- **Lag spike** drones that float and stutter.

## Look

- Sunset palette, chunky pixel art, parallax hills.
- Font: Press Start 2P.
- Display profile: scan 0.6, flicker, glow 0.9. Full-bleed.

## Sound

Upbeat chiptune loop; jump, coin, stomp, power-up, door and checkpoint sounds made in ChipTone or jsfxr. See `soundscapes.md` → Side Quest.

## Build Notes

- Own small tile map and AABB collision. No physics library.
- The level is generated from the project list: one building per project, spaced along the run, with platform sections between.
- Saves (coins, visited) in `rv-save-side-quest`.
- Budget: ≤ 80 KB code, ≤ 120 KB art.
- Original only: no Nintendo characters, blocks, pipes, sounds or fonts.

## Acceptance

- Every project reachable; level generates for 1 and 30 projects.
- Falling in water respawns at the last checkpoint; no way to soft-lock.
- Pause and resume when tuning away.

## References

- `docs/reference/mockups/ch05-side-quest.png`
- Prototype source: `docs/reference/prototypes/boards/ChQuest.dc.html`
