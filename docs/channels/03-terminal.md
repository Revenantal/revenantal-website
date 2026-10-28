# CH 03 — Terminal

## Summary

A DOS-era machine called `revenantal.sh`. It runs a BIOS-style power-on test and a loading screen, then drops to a command prompt. Visitors type commands or click command chips to browse projects, and every key clicks like an old keyboard. Approved by the owner on 2026-10-28 as the second Phase 4 build (task 4.2); the boot sequence, VGA font and key sounds were added to the approved scope the same day (see `project-decisions.md`).

- **Kind:** directory · **Dial:** 3 · **Folder:** `terminal` · **Build:** task 4.2 · **Status:** built, awaiting the owner's look on the real TV

## Concept

Tune in and the TV is a PC that has just been switched on. A power-on self test counts memory up to 640K and detects its devices, the screen clears to a large block-letter REVENANTAL logo with a progress bar, then it cuts to a `guest@revenantal:~$` prompt. It's playful, with jokes in the output, but it works as a real directory.

## Boot sequence

About 6.1 seconds, as a pure timeline in `boot.ts` (`bootFrame(elapsed)`):

1. **Self test (0–3.9 s):** "REVENANTAL BIOS v4.04", a fictional copyright line, processor, a base-memory count-up to 640K, extended memory, then device detection (primary master and slave, floppy A:, keyboard, mouse "Not found (carrying on regardless)") and "Press DEL to enter SETUP, or ignore this and carry on."
2. **Blank beat (3.9–3.95 s):** the screen clears, like a video mode change.
3. **Loading screen (3.95–6.1 s):** a 24 px block-letter REVENANTAL logo, "Starting REVENANTAL.SH version 4.04...", a 40-cell progress bar, four `Loading … OK` lines and "Welcome."
4. **Hand-over:** the shell appears.

All names are original; no real BIOS vendors, no Microsoft or IBM marks. The boot clock runs only while the channel is active, so it starts after the tuning static clears and pauses when tuned away. A click, Enter, Space or any ordinary key skips it (Tab, Shift and the arrow keys do not, so the dial and focus order keep working). A skip puts the cursor in the input; a boot that ends by itself does not take the keyboard. Reduced motion goes straight to the shell. The boot plays on every tune-in.

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
- Command chips along the bottom (help, ls, open …, servers, git log, discord, credits) run the command when clicked. A long project name is shortened on its chip (`open some-long-p..`) but the command uses the full name.
- Every project is also a real new-tab link in the `ls` listing.

## Look

- Pure black background with the VGA text palette: light grey text, white for emphasis and typed commands, bright red prompt and errors, yellow for the path and highlights, green for executables and OK, blue folders.
- Font: **PxPlus IBM VGA 8x16** by VileR, from the Ultimate Oldschool PC Font Pack (CC BY-SA 4.0), bundled unmodified with the channel in `src/channels/terminal/fonts/` with its licence text, credited in the Typography Department. The `WebPlus` variant is used because the original-DOS set lacks the em dash, ellipsis and curly quotes the output uses. 20 px with 22 px lines gives 72 columns across the content box.
- Display profile: scan 1, flicker, glow 0.7. `safe: true`.

## Content Note

The original sketch included gothic references (`cd /graveyard`, `/dev/ghost`). Per the project brief these are replaced with non-gothic jokes: `cd /secret` (and `/graveyard`) → "permission denied — nice try.", `sudo …` → "guest is not in the sudoers file. This incident will be reported.", `rm …` → "nice try, filesystem is mounted read-only.", and the boot's "Mouse … Not found (carrying on regardless)".

## Sound

A key click on every keypress, through the host's `play` with the manifest's sounds (`soundscapes.md` → Terminal): six click variants picked at random and never the same twice in a row, a heavier `enter` thunk for Enter and Space (Space softer and higher), and a softer `back` for Backspace. Pitch and level vary slightly on every press, and presses closer than 35 ms apart are dropped so a held key stays a patter. Pressing a chip plays the Enter sound. Arrows, Escape, Shift and shortcuts such as Ctrl+C are silent, and nothing plays while the channel is inactive. The sounds follow the volume knob and SND switch. The boot itself is silent; the TV's mains hum and CRT whine carry it.

## Build Notes

- Commands are a table of `{ name, run(args, props, ctx) }` in `terminal/commands.ts`, so adding one is one entry.
- The shell is always mounted and a boot overlay (`Boot.tsx`) sits over it, so the shell's project links exist from the first render; the shell is `visibility: hidden` during the boot, which also keeps those links out of the tab order.
- `typing-sound.ts` (`keySoundFor`) decides which sound a key makes; it is pure and tested.
- Output is plain DOM text with `role="log"` and `aria-live="polite"`, not canvas. Scrollback is capped at 200 lines.
- The boot screen is one `role="button"` region; its animated text is `aria-hidden` and its accessible name is the visible "click or press Enter to skip" hint.
- Assets: `pnpm assets:terminal` (`tools/assets/terminal_sounds.py`) cuts eight clips, 25 KB in all, from five CC0 Freesound recordings kept in `docs/reference/assets/sounds/`; the font is 22 KB. Channel chunk about 6.4 kB gzipped of 30 kB.

## Acceptance

- Every project reachable with `ls` + `open` and with the chips alone (no typing required).
- `servers` never shows addresses unless `showAddress: true`.
- Works with `live = null` without error (live commands print "no signal from upstream").
- The boot runs about 6 s, can be skipped by click or key, pauses while inactive and is skipped with reduced motion.
- Typing makes key sounds only while active; arrows and shortcuts are silent; a held key is thinned.
- Shared channel contract tests pass; axe is clean on the boot and the shell.

## References

- `docs/reference/mockups/ch03-terminal.png` (the original sketch; the boot, font and palette have moved on)
- Prototype source: `docs/reference/prototypes/boards/Terminal.dc.html`
- [Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/)
