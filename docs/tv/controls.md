# TV Controls

Every control maps to one store action, so mouse, touch, keyboard and URL all behave the same. Timings are the prototype's tuned values. Positions are in `art-and-assets.md` → Anchor Points.

## Controls

| Control                               | Input                                                                   | Result                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Channel dial                          | Click knob                                                              | Next position; knob turns one configured step the short way with an overshoot                                                           |
|                                       | Scroll over knob                                                        | ±1 position, throttled to one step per 140 ms                                                                                           |
|                                       | Drag knob                                                               | Knob follows the pointer; picture tunes live (below); snaps to the nearest detent on release                                            |
|                                       | ↑/→, ↓/← (TV focused)                                                   | Next, previous                                                                                                                          |
| Volume knob                           | Drag round the knob (27° per step), click left/right half, scroll, keys | Volume 0–10; indicator tick turns ±135°; the knob photo never rotates                                                                   |
| Panel buttons                         | Click / Enter                                                           | Face sinks 4 px into its cavity; press and release sounds; link opens in a new tab or value is copied (label shows "COPIED!" for 1.4 s) |
| Settings door                         | Click                                                                   | Door swings down on its hinges; reveals 5 toggle switches + credits button; click its bottom edge to close                              |
| Credits button (inside settings door) | Click / Enter                                                           | Close the door and tune to Credits (channel ID `credits`, position 11); restart the roll from the top                                   |
| Power LED                             | Click                                                                   | Off: picture collapses, afterglow dot fades over 3.2 s, TV fades out, List mode fades in                                                |
| Hint note                             | Click, or any channel change                                            | Tape peels, note falls off screen (1.4 s); returns on the next page load                                                                |

The dial is unnumbered at every viewport size. Its position count and step angle come from the configured channel slots, including blanks; see [dial configuration](dial-configuration.md). No UHF dial.

Do not render numeral buttons, numeral hit zones or their Tab stops. The knob supports click, drag, wheel and arrow keys. The OSD and accessible dial label identify the current channel or NO SIGNAL.

## Panel Buttons

From `content/buttons.json`: STEAM (link), GITHUB (link), DISCORD (copies the username), SERVERS (tunes to channel 10). With four buttons the stack shrinks each to 72% size to fit. Tune buttons are hidden in List mode.

## Credits Button

The settings-door Credits button tunes to the channel ID `credits` through the same host/store action path as other channel changes. Resolve its assigned position from the registry; do not hard-code the number into the control. The initial position is 11. Close the settings door so it does not cover the roll, and begin the roll at the top. After activation, move focus to the channel Pause control, or its heading in the static reduced-motion view, so focus is not left inside the closed door. If already tuned to Credits, the button leaves the current roll in place; the channel provides its own Restart control.

This replaces the settings-door credits panel. Until the Credits channel is built, the button tunes to position 11 and shows NO SIGNAL (owner decision, 2026-10-19). Once the channel exists, focus moves to its Pause control instead of the door button. In List mode, keep the readable credits section rather than turning the TV on.

## Channel Change

1. Knob turns, detent click plays, OSD shows `CH 03` + channel name in green for 1.7 s.
2. If the target's transition is `static` and the viewer's FX switch is on: 460 ms of soft, blurred snow, a faint roll bar and the static burst sound, then the new channel snaps in from a quick blur (0.22 s). No scale-from-line or brightness flash between channels (owner decision, 2026-10-19).
3. If `cut`, or FX is off: the channel swaps immediately.
4. Positions with no channel show animated snow and a NO SIGNAL card, with a soft hiss.

## Drag-Tuning

While dragging, the channel nearest the knob is shown. Distance from the nearest detent drives blur (up to 3 px), horizontal ghosting (up to 7 px), contrast loss and a snow overlay. Releasing on a detent settles with no static.

## Power

- First load: quick 0.9 s power-on, no warm-up wait.
- Power on by the viewer: 3.3 s warm-up (line → dim, soft, desaturated → sharp), then a 0.6 s degauss wobble at 3.0 s, synced to the degauss thump in the power-on sound.
- While off, the dial and channel keys do nothing.

## Volume OSD

Green `VOLUME` + 10 bars (or `MUTE`) along the bottom for 1.7 s after any change.

## Store Actions

`setChannel`, `setVolume`, `setPower`, `toggleSetting`, `setCaptions`, `setDoor`, `dismissHint`. Controls never change state any other way. Channel callbacks `host.tune` and `host.powerOff` adapt these same actions; see `docs/channels/host-interface.md`.
