# CH 03 — Terminal

## Summary

A phosphor shell called `revenantal.sh`. Visitors type commands or click command chips to browse projects.

- **Kind:** directory · **Folder:** `terminal` · **Build:** task 4.2 · **Status:** approved sketch

## Concept

It boots with fake BIOS lines and an ASCII logo, then drops to a `guest@revenantal:~$` prompt. It's playful, with jokes in the output, but it works as a real directory.

## Data Shown

| Command                                        | Output                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `help`                                         | Command list                                                      |
| `ls`                                           | Projects as folders, servers as executables, `README.md`          |
| `cd <project> && cat README` / `cat <project>` | Name, desc, host, status                                          |
| `open <project>`                               | Opens the project in a new tab                                    |
| `servers`                                      | Server table: name, game, state, players, address where published |
| `git log`                                      | Latest pushes from `live.github`                                  |
| `steam` / `playing`                            | Now playing and library count from `live.steam`                   |
| `links`, `discord`, `drive`                    | Social links; `discord` copies the username                       |
| `credits`                                      | Shared `credits` prop, from `site.json`                           |
| `clear`                                        | Clears the screen                                                 |

Unknown commands get a friendly "command not found" with a suggestion.

## Interaction

- A real text input. Tab completes project and command names; ↑/↓ cycle history.
- The input keeps its own keys, so arrow keys don't turn the dial while it's focused. Esc blurs the input and gives the keys back.
- Command chips along the bottom (help, ls, open …, servers, git log, discord, drive) run the command when clicked.

## Look

- Near-black background with red prompt, blue folders, green executables, yellow highlights.
- Font: VT323.
- Display profile: scan 1, flicker, glow 0.7. `safe: true`.

## Content Note

The sketch includes `cd /graveyard` → "permission denied — let the dead rest" and boot lines like "mounting /dev/ghost". These lean toward the death theme the brief rules out. Swap them for non-gothic jokes at build time (e.g. `cd /secret` → "permission denied — nice try"), and record the final lines in `project-decisions.md`.

## Sound

Mechanical key presses at random, an error beep and a modem handshake on `connect`. See `soundscapes.md` → Terminal.

## Build Notes

- Commands are a table of `{ name, run(args, props) }` in `terminal/commands.ts`, so adding one is one entry.
- Output is plain DOM text, not canvas, so screen readers can read it. The output log is `aria-live="polite"`.
- Cap scrollback (e.g. 200 lines).

## Acceptance

- Every project reachable with `ls` + `open` and with the chips alone (no typing).
- `servers` never shows addresses unless published.
- Works with `live = null` (live commands print "no signal from upstream").

## References

- `docs/reference/mockups/ch03-terminal.png`
- Prototype source: `docs/reference/prototypes/boards/Terminal.dc.html`
