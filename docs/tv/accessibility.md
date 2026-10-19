# Accessibility

Everything the TV does must be possible without a mouse, and List mode is one keystroke away. Target: WCAG 2.2 AA.

## Rules

- **Skip link:** the first Tab stop is "Skip to the simple list" (visible on focus), which powers the TV off into List mode.
- **Focus:** every control shows a 3 px red (`#ff2a36`) outline on `:focus-visible`. Tab order follows the panel top to bottom: dial, volume, buttons, door, switches, power. While the hint note shows, it sits between the dial and volume. The dial has one focus stop at every viewport size.
- **Focus never drops to the page:** dismissing the hint note moves focus to the dial; Credits closes the door and returns focus to the door button; turning the TV off focuses List mode's heading; turning it on from List mode focuses the dial.
- **Semantics:**
  - Dial = button labelled "Channel dial, now CH 03, TV GUIDE", with how to turn it as its description.
  - No numeral buttons, hidden hit zones or numeral focus stops. The knob target remains at least 44 screen pixels at the minimum supported viewport.
  - Volume = slider (`role="slider"`, 0–10, "Muted" at 0) with its own arrow keys.
  - Door = button with `aria-expanded`.
  - Switches = buttons whose label includes ON/OFF, plus "limited by this channel" when the override lamp is lit.
  - Power = button with `aria-pressed`.
- **Announcements:** channel and volume OSDs are `aria-live="polite"`.
- **Keys on the TV:** ↑/→ next, ↓/← previous, +/− volume. Text inputs inside channels keep their own keys.
- **Game and toy channels:** keys go to the game only after PRESS START; Esc always releases (see `docs/channels/channel-rules.md`).
- **Motion:** honour `prefers-reduced-motion` (start in List; in TV mode no flicker, static, warm-up or tune snap, and the NO SIGNAL snow holds one frame).
- **Contrast:** List mode body text ≥ 4.5:1; channel UIs follow the same rule for their primary text.
- **Credits roll:** provide keyboard-accessible pause/restart controls and real attribution links. Pause on hover/focus, keep entries in semantic DOM order, and use a static scrollable view with reduced motion. Do not announce each moving line through an aria-live region.
- **Sound:** never required; nothing autoplays.
- **Captions:** every broadcast film and clip has WebVTT captions. The host handles C once (outside text inputs) through `setCaptions`; the player reads the same persistent `captions` state as its visible controls.

## Checks

- `eslint-plugin-jsx-a11y` in lint.
- axe on List mode and on each channel in tests or the launch check.
- A keyboard-only run through the TV before each gate.
