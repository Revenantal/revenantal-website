# CH 02 — Rev OS

## Summary

A faithful Windows 98-style desktop where projects are programs and folders. Full of easter eggs.

- **Kind:** directory · **Folder:** `rev-os` · **Build:** task 4.2 · **Status:** design done (v3)

## Concept

A teal desktop with bevelled grey windows, a Start button and a taskbar clock. It should feel like a real 98 desktop, with nothing taken from Microsoft. The name is Rev OS, the start chord is original, and there are no Windows logos.

## Data Shown

| Area                | Props                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| Explorer window     | `projects` as folders/icons; a web-view side panel shows name, host, desc, type, status |
| Task Manager        | `servers` as processes: name, game, state, players                                      |
| Taskbar             | `now` clock (viewer's time zone), a Steam tray icon from `live.steam`                   |
| My Computer / About | Steam level, games owned, latest GitHub push                                            |

## Interaction

- Double-click (or Enter) opens. Single-click selects. Windows can be dragged, minimised and closed.
- The Start menu lists Programs (projects), Games (toys), Links (Steam, GitHub, Discord) and Shut Down. Shut Down calls `host.powerOff()` from props, using the normal TV power action without a store import.
- Keyboard: Tab through desktop icons and windows; Esc closes menus.

## Easter Eggs and Toys

- **Mines** — a playable minesweeper.
- **Rev Solitaire** — solitaire with the card-bounce win.
- **Paint** — a small canvas.
- **Dial-Up** — a fake connection with the modem sound.
- `homework` folder — a joke folder.
- `secret.txt` — a Konami-code hint.
- `DO_NOT_OPEN.exe` — "Task failed successfully."
- **Flop** — a floppy-disk assistant who pops up with tips.

Keep each toy in its own module under `rev-os/apps/` and lazy-load the bigger ones (Solitaire, Paint).

## Look

- Teal wallpaper, grey bevelled chrome, navy title bars.
- Font: system Tahoma / Segoe UI stack; Pixelify Sans for pixel icons where needed.
- Display profile: scan 0.35, no flicker, glow 0.8. `safe: true`.

## Sound

Original startup chord on first tune; clicks, window sounds, error ding, CD-ROM, modem. See `soundscapes.md` → Rev OS.

## Build Notes

- One window manager (z-order, focus, drag) shared by all apps in the channel.
- Icons are drawn for the project (SVG or small pixel art), not taken from Windows.
- Mines and Solitaire use the scoped `save.load`, `save.store` and `save.reset` helpers for `rv-save-rev-os`. Keyboard-driven toys may call `requestCapture()` after explicit activation and `releaseCapture()` on exit.

## Acceptance

- Every project opens from Explorer and the Start menu.
- Works with 0, 1 and 30 projects and `live = null` (Task Manager shows "No servers").
- All toys are keyboard-reachable and close cleanly.
- No Microsoft names, logos or sounds.

## References

- `docs/reference/mockups/ch02-rev-os.png`
- Prototype source: `docs/reference/prototypes/boards/ChOS.dc.html`
