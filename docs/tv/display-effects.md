# Display Effects

The CRT look: scanlines, flicker, static, room glow and phosphor bloom. The viewer controls them in the settings door; each channel can tone them down for itself.

## Precedence

Effects resolve in a fixed order: **viewer OFF > channel OFF > channel strength > default.** A channel can switch an effect off or turn it down, never back on.

```ts
const eff = {
  scan: viewer.scan ? (p.scan === false ? 0 : (p.scan ?? 1)) : 0,
  flicker: viewer.flicker && p.flicker !== false && perf < 2,
  glow: viewer.glow && power ? (p.glow === false ? 0 : (p.glow ?? 1)) : 0,
  bloom: p.bloom !== false && perf < 1,
  static: viewer.fx && (target.display?.transition ?? "static") === "static",
};
```

`p` is the current channel's `DisplayProfile` (see `docs/architecture/data-model.md`). Each channel's profile is listed in `docs/channels/README.md`.

## Effects

| Effect            | What it is                                                                                       | Viewer switch               |
| ----------------- | ------------------------------------------------------------------------------------------------ | --------------------------- |
| Scanlines         | 1 px dark lines every 3 px, opacity = strength; fades 0.3 s between channels                     | SCAN                        |
| Flicker           | Faint white flicker over the picture; also makes the room light breathe                          | FLK                         |
| Static transition | Snow + roll bar between channels                                                                 | FX                          |
| Room glow         | Screen-coloured light on the bezel and control panel; level = glow × picture brightness          | GLOW                        |
| Phosphor bloom    | SVG filter: ±0.9 px red/blue split + 2.4 px glow                                                 | none (channel or perf only) |
| Safe area         | Content scaled to 1.30 with a 52/38 px inset, plus heavy edge falloff; off = full-bleed at 1.437 | none (channel only)         |

The fifth switch, SND, is sound (see `audio.md`).

- **Picture brightness** comes from the channel's `bg` luminance (0.55–1.3×), and jumps to 1.35× during static.
- **Override lamps:** each switch has a small amber lamp that lights when the current channel limits that effect, so the switches never misrepresent what is on screen.
- **Always on:** vignette, glass dust (masked to the upper-left), the off-tube colour (dark grey-green) and the afterglow dot.

## Performance Fallback

1.2 s after boot, count frames for 1.5 s. Under 42 fps → `perf = 1` (drop bloom) and re-measure. Still under → `perf = 2` (drop flicker). Silent and session-only.

## Reduced Motion

If the TV is turned on with reduced motion: no flicker, static becomes a cut, no warm-up wait.

## Removed — Do Not Reintroduce

Window reflection, oval glare highlight, mouse tilt.

## Tests

Unit-test the precedence table: every combination of viewer switch, channel value and perf level.
