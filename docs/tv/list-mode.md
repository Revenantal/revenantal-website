# List Mode

List mode is a full product, not a fallback. It is the whole site for phones and low-motion visitors, built from the same data. Code: `src/list/`.

## When It Shows

| Condition                           | Mode                       | "Turn on the TV" button |
| ----------------------------------- | -------------------------- | ----------------------- |
| Viewport under 900 px wide          | List only; TV not rendered | Hidden                  |
| `prefers-reduced-motion: reduce`    | Starts in List             | Shown                   |
| Viewer turned the TV off last visit | Starts in List             | Shown                   |
| Otherwise                           | TV                         | Power LED turns it off  |

## Layout

Single column, max 640 px, 20 px gutters.

1. Wordmark "REVENANTAL" (Michroma, 0.24em tracking) + "SOLID STATE · MODEL RV-404".
2. **Right now:** Steam card, latest push card.
3. **Projects:** status text, name, desc · host, type.
4. **Game servers:** name, game, state, players; address only where published.
5. **Elsewhere:** the panel buttons as flat buttons. The SERVERS tune button links to the Game servers section; other tune buttons are hidden.
6. **Recent pushes:** 5.
7. **Credits:** collapsible, with the snapshot write time.

Broadcast channels don't appear in List mode.

List mode ships first, in phase 1. Until the TV shell is implemented in phase 2, it is the site at every width and the Turn on the TV control is hidden. Phase 2 adds the mode-selection rules and transitions described here.

## Transitions

- TV → List: picture collapse (0.55 s), TV fades and scales to 0.97 after 0.5 s (0.7–0.9 s), List fades in after 0.9 s.
- List → TV: List fades out in 0.25 s, TV fades in and runs the full warm-up.
- Reduced motion: no warm-up wait (use the 0.9 s boot), no flicker; static becomes a cut.

## Rules

- Body text contrast ≥ 4.5:1.
- Works with `live = null`: navigation and profiles remain; live sections show explicit unavailable/empty labels.
- Apply the shared freshness rules in `docs/architecture/live-data.md`. Label each live section with its own observation age and stale/unavailable state; omit stale current-state indicators and counters. Ages update locally on the shared clock and tab resume, without polling.
- Passes axe with no serious issues.

## Local Implementation (2026-10-18)

List mode currently renders at every width. Fonts are self-hosted, buttons have 44 px targets, status uses readable words and the project section has a skip link. Clipboard denial leaves selectable text and announced feedback. Shared credits are collapsible. GitHub navigation may remain stale while its activity disappears; project availability has a separate source-age label. Browser checks cover 0/1/30 projects and missing/malformed snapshots on desktop/mobile, with no axe violations. TV transitions remain phase 2 work.
