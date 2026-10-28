# CH 03 — Terminal

## Summary

A phosphor shell called `revenantal.sh`. Visitors type commands or click command chips to browse projects. Approved by the owner on 2026-10-28 as the second Phase 4 build (task 4.2).

- **Kind:** directory · **Dial:** 3 · **Folder:** `terminal` · **Build:** task 4.2 · **Status:** approved 2026-10-28

## Concept

It boots with fake BIOS lines and an ASCII logo, then drops to a `guest@revenantal:~$` prompt. It's playful, with jokes in the output, but it works as a real directory.

## Data Shown

| Command                                        | Output                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `help`                                         | Command list and descriptions                                     |
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
- Mouse clicks anywhere in the terminal window focus the input.

## Look

- Near-black background (`#070303`) with red prompt (`#ff2a36`), blue folders (`#7cc4ff`), green executables (`#5ef28a`), yellow highlights (`#ffb347`), and error text (`#ff6b6b`).
- Font: VT323 (monospaced CRT style).
- Display profile: scan 1, flicker, glow 0.7. `safe: true`.

## Content Note

The original sketch included gothic references (`cd /graveyard`, `/dev/ghost`). Per the project brief, these are replaced with non-gothic jokes:

- Boot line: `[ OK ] mounting /dev/nvme0n1`
- `cd /secret` → `bash: cd: /secret: permission denied — nice try.`
- `sudo <cmd>` → `guest is not in the sudoers file. This incident will be reported.`
- `rm -rf /` → `nice try, rm is read-only here.`

## Sound

None at launch; the mains hum and CRT whine carry the channel. Mechanical key presses at random and an error beep may be proposed later.

## Build Notes

- Commands are a table of `{ name, run(args, props, ctx) }` in `terminal/commands.ts`, so adding one is one entry.
- Output is plain DOM text with `role="log"` and `aria-live="polite"`, not canvas, so screen readers can read it.
- Scrollback buffer capped at 200 lines.
- Autocomplete matches commands and project slugs on `Tab`.

## Acceptance

- Every project reachable with `ls` + `open` and with the chips alone (no typing required).
- `servers` never shows addresses unless `showAddress: true`.
- Works with `live = null` without error (live commands print "no signal from upstream").
- Shared channel contract tests pass.

## References

- `docs/reference/mockups/ch03-terminal.png`
- Prototype source: `docs/reference/prototypes/boards/Terminal.dc.html`
