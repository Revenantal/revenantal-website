# CH 12 — Coin Drop

## Summary

A physics incremental toy. Coins fall through pegs into multiplier bins; spend coins on upgrades. Just for fun.

- **Kind:** toy · **Folder:** `coin-drop` · **Build:** task 4.5 (first physics, saves and input capture; moved from position 7 on 2026-10-20) · **Status:** design done

## Concept

A Plinko-style board. Press Space or click to drop a coin. It bounces through pegs, hits ×2/×3 bumpers and a spinner, and lands in a bin from ×1 to ×10. Coins add up, and the shop sells upgrades. It keeps going (slowly) while you browse.

## Data Shown

Doesn't list projects. Optional flavour: a bin label or bumper can show the latest project name, but no project data is required.

## Interaction

- PRESS START to capture keys. Space drops; click on the board drops at that spot.
- Upgrades panel (buttons, keyboard-reachable):
  - Add ×2 bumper (250) — place it anywhere on the board.
  - Faster dropper (600) — 1 coin every 0.8 s.
  - Spinner (1.2K) — flings coins sideways, +3 each.
  - Auto-drop (5K) — keeps dropping while you browse.
- Reset button clears the save.

## Look

- Bright arcade board, gold coins, chunky numbers.
- Font: Bungee.
- Display profile: no scan, no flicker, glow 0.8. Full-bleed.

## Sound

Lounge/arcade loop; peg clinks at varied pitch, bumper boing rising with the multiplier, payout jingle, register on purchase. See `soundscapes.md` → Coin Drop.

## Build Notes

- Matter.js (or similar small 2D engine), loaded only with this channel.
- Cap live coins (e.g. 60) and throttle peg sounds so many coins don't flood the audio.
- When `active` is false, stop the physics; on return, credit auto-drop earnings for the time away at a fixed rate (capped), instead of simulating.
- Save coins, upgrades and best drop in `rv-save-coin-drop`, versioned.
- Budget: ≤ 80 KB code (including the physics library), ≤ 120 KB art.

## Acceptance

- Save survives reload and a version bump (migrates or resets cleanly).
- Esc releases keys; dial works again.
- No runaway CPU with auto-drop on.

## References

- `docs/reference/mockups/ch07-coin-drop.png`
- Prototype source: `docs/reference/prototypes/boards/ChCoins.dc.html`
