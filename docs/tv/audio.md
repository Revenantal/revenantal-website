# TV Audio

Real recordings for every interaction, a synthesized ambient bed underneath, all through one Web Audio graph that follows the volume knob and the SND switch. Channel music and effects are in `docs/channels/soundscapes.md`.

## TV Sounds

| Event                                | File                      | Source                                           | Gain × |
| ------------------------------------ | ------------------------- | ------------------------------------------------ | ------ |
| Panel button press                   | `btn_down`                | joedeshon vcr_switch (first half)                | 1.0    |
| Panel button release                 | `btn_up`                  | joedeshon vcr_switch (second half)               | 0.8    |
| Dial detent                          | `dial`                    | joedeshon electrical_switch_02                   | 0.9    |
| Volume step                          | `vol`                     | joedeshon click_01                               | 0.55   |
| Settings switch, credits, note click | `toggle`                  | joedeshon rocker_switch                          | 0.75   |
| Channel static                       | `static`                  | LimitSnap_Creations Channel Switch               | 0.7    |
| Power LED                            | `power_btn`               | joedeshon push_button_switch_04                  | 1.0    |
| Power on (warm-up)                   | `crt_on`                  | Fission9 CRT TV Switches On (0.12–3.95 s)        | 0.85   |
| Door open / close                    | `door_open`, `door_close` | stecman Tapedeck open and closing, takes 1 and 2 | 1.0    |

Links and licences: `docs/reference/sound-credits.md`. Originals: `docs/reference/assets/sounds/`.

- Base gain = volume / 10 × 0.9 × the per-event factor. Volume 0 or SND off = silent.
- Files: mono, trimmed, peak-normalised to −1 dBFS, AAC 96 kbps `.m4a` (about 220 KB total). Decode all on load; play from buffers.
- If a buffer is missing, fall back to the synthesized version of that sound (from the prototype).

Built in task 2.6 (`src/audio/engine.ts`): the TV fetches the ten files when it mounts, creates and decodes nothing until the first pointer-down or key press (`tv/controls/audio-unlock.ts`), and suspends all output while the tab is hidden.

## Ambient Bed (synthesized, no files)

- **Mains hum:** 60/120/180/240 Hz at 0.006 × v, fades in over ~0.6 s.
- **CRT whine:** 15,625 Hz at 0.0018 × v, fades in over ~0.9 s as the tube warms; cut on power-off.
- **Hiss:** band-passed looping noise at 0.035 × v on NO SIGNAL, plus up to 0.06 × v while drag-tuning between detents.

Keep both the whine and the hum (decided).

## Unlock

Browsers block audio until a gesture. Create or resume the AudioContext on the first pointer-down or key press. Nothing plays on page load.

## Channels and Audio

Channels never create audio nodes. The host supplies `play(id, options)` for one-shots and `setLoop(id, playing, options)` for manifest-declared loops, scoped to the current channel. The audio module owns loading, the graph, fade-in, OSD music ducking and cleanup. Repeated loop requests update one voice rather than creating another.

`ChannelProps.volume` is the effective 0..1 level after power, active/visibility state, SND and audio unlock. The shared broadcast player applies it to its video element, the only media-audio exception. Old/inactive channel callbacks cannot restart sound. Tuning away, hiding the tab and powering off stop output immediately. The exact types, gain rules and resume behavior are in [the host interface](../channels/host-interface.md#audio).

## Credits

One `credits` array in `site.json` feeds four places:

1. The Credits channel, reached from the settings-door Credits button or the dial.
2. The Terminal `credits` command.
3. The List mode footer.
4. The repo's `CREDITS.md`.

The Credits channel uses the same entries through `ChannelProps.credits`; it replaces the old settings-door overlay. List mode retains its static credits section.

Format: title, author, link, licence, edits, used for. joedeshon files are CC BY 4.0; the rest are CC0. Every external asset is credited, CC0 included, but only once it ships: add its entry in the same change that adds the file. Sourced but unshipped assets stay in `docs/reference/sound-credits.md`. The same list carries weather, radar, font, film and clip credits.
