# Channels

A channel is a self-contained 760×570 UI with its own look. It gets data by props and declares how the TV should present it. Twelve are planned for v1, in five kinds. Individual optional channels may be deferred or omitted; Credits is required for launch:

- **directory** — browse the projects
- **game** — play to reach the projects
- **toy** — just for fun
- **broadcast** — video on a schedule
- **credits** — a movie-style attribution roll

Before building a channel, read `channel-rules.md`, then its own doc, then its row in `soundscapes.md`. Review the concrete plan with the project owner and obtain explicit confirmation for that individual channel before implementation; see [the approval gate](channel-rules.md#before-building-a-channel). Existing designs and mockups do not satisfy this gate.

The shared data and callbacks are defined in [the host interface](host-interface.md): channel-scoped playlists, credits, captions, tuning/shutdown, audio, input and saves.

## v1 Lineup

| Dial | Channel          | Folder             | Kind      | Display profile                               | Build task | Doc                      |
| ---- | ---------------- | ------------------ | --------- | --------------------------------------------- | ---------- | ------------------------ |
| 1    | TV Guide         | `tv-guide`         | directory | scan 1, flicker, glow 0.8                     | 3.4–3.5    | `01-tv-guide.md`         |
| 2    | Rev OS           | `rev-os`           | directory | scan 0.35, no flicker, glow 0.8               | 4.3        | `02-rev-os.md`           |
| 3    | Terminal         | `terminal`         | directory | scan 1, flicker, glow 0.7                     | 4.2        | `03-terminal.md`         |
| 4    | Night Drive      | `night-drive`      | game      | scan 0.8, flicker, glow 1, full-bleed         | 5.2        | `04-night-drive.md`      |
| 5    | Side Quest       | `side-quest`       | game      | scan 0.6, flicker, glow 0.9, full-bleed       | 5.1        | `05-side-quest.md`       |
| 6    | Revscape         | `revscape`         | game      | scan 0.4, no flicker, glow 0.7, full-bleed    | 5.3        | `06-revscape.md`         |
| 7    | XBOX             | `xbox`             | toy       | TV defaults, no bloom                         | 4.1        | `07-xbox.md`             |
| 8    | The Late Show    | `late-show`        | broadcast | scan 1, flicker, glow 0.6                     | 4.7        | `08-late-show.md`        |
| 9    | Paid Programming | `paid-programming` | broadcast | scan 0.8, flicker, glow 0.8                   | 4.8        | `09-paid-programming.md` |
| 10   | Status           | `status`           | directory | no scan, no flicker, glow 0.4, cut transition | 3.2        | `10-status.md`           |
| 11   | Credits          | `credits`          | credits   | TV defaults (bloom off)                       | 3.6        | `11-credits.md`          |
| 12   | Coin Drop        | `coin-drop`        | toy       | no scan, no flicker, glow 0.8, full-bleed     | 4.5        | `12-coin-drop.md`        |

"Full-bleed" means `safe: false`. Others use `safe: true`.

Positions are assigned explicitly in `channels/index.ts`, using an object keyed by positive integer positions. At launch it contains `{ 1: tvGuide, 10: status, 11: credits }`; positions 2–9 show NO SIGNAL. Position 12 joins the dial when Coin Drop is built. Use explicit null entries for additional intentional blank slots, including trailing blanks.

Until a channel is built, or if it is skipped, its position stays empty and shows NO SIGNAL. Adding or removing a channel never shifts another position. Turning the dial still visits every position through the highest configured key; empty positions are not automatically bypassed. There is no fixed capacity or numeral ring. See [dial configuration](../tv/dial-configuration.md).

## Channel Doc Template

Each `NN-<id>.md` has the same sections, so an agent can find things fast:

1. **Summary** — one paragraph, kind, dial, build task, status.
2. **Concept** — the idea and the vibe.
3. **Data shown** — which props it uses and how.
4. **Interaction** — mouse, keyboard, captured keys.
5. **Look** — layout, palette, fonts, display profile.
6. **Sound** — pointer to its `soundscapes.md` row, plus notes.
7. **Build notes** — structure, libraries, budgets, gotchas.
8. **Acceptance** — what must be true to ship.
9. **References** — mockups and prototypes in `docs/reference/`.

## Removed

The House channel was dropped. A hidden channel is still an open question (`docs/project/project-decisions.md`).
