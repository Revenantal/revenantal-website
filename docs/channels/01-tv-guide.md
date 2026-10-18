# CH 01 — TV Guide

## Summary

The home channel and the first thing new visitors see, so it sets the quality bar. A 90s cable guide channel built from glossy broadcast graphics, a mix of Prevue Channel and the Weather Channel.

- **Kind:** directory · **Folder:** `tv-guide` · **Build:** tasks 3.4–3.5 (launch) · **Status:** design done (v3)

## Concept

The screen is split like a real guide channel. The top half has a promo window that alternates between "Coming up" (a still of another channel) and a Local Forecast for the visitor's own city over a Doppler radar map. The top right shows the visitor's own clock and date. The bottom half is a scrolling listings grid, one row per project, and a live news ticker runs along the bottom.

It should look like broadcast graphics, not a cartoon: bevelled glossy panels, gradients, drop shadows, thin rules.

## Data Shown

| Area           | Props                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Listings grid  | `projects` (one row each: time slot, icon, name, host, desc, status), then servers, Steam and GitHub rows |
| Clock and date | `now`, formatted with `Intl` in the viewer's time zone and locale                                         |
| Listing times  | `now` rounded to the half hour in the viewer's time zone                                                  |
| Ticker         | `live.github` latest pushes, `live.steam` now playing, server counts, project status changes              |
| Forecast       | From `/api/forecast` (see `docs/architecture/forecast-and-radar.md`)                                      |
| Coming up      | Build-time stills of other channels from `public/assets/promos/`                                          |

The forecast is the one place a channel fetches data. That fetch lives in a small helper inside this channel folder. If it fails, the forecast segment is skipped and the promo window shows only "Coming up". It never falls back to a fixed city.

## Interaction

- The grid auto-scrolls. Hover or focus pauses it.
- ↑/↓ inside the channel are not captured (the dial keeps them). Tab moves through rows; Enter opens the project in a new tab.
- Click a row to open it. Clicking a server or Steam row tunes nothing; it's information only.
- "Coming up" can be clicked to tune to that channel. Call `host.tune(channelId)` from props; the host resolves its assigned position and updates the normal hash. Do not import the store or hard-code a position in this control.

## Look

- Navy and blue-violet gradient panels with glossy highlights; yellow and white type; red LIVE badges.
- Each row gets a small coloured icon by project type.
- Fonts: Archivo Narrow (listings), Archivo Black (headers, temperatures).
- Display profile: scan 1, flicker, glow 0.8. `safe: true`.

## Sound

Smooth-jazz loop, a row tick and a promo stinger. See `soundscapes.md` → TV Guide.

## Build Notes

- Grid scroll uses `transform` on one element, driven by `requestAnimationFrame`, and pauses when `active` is false.
- Same-origin RainViewer radar over bundled Natural Earth land/coastlines loads only during the active forecast segment. Keep readable Open-Meteo, RainViewer, DB-IP and Natural Earth links in the panel footer. Follow the request, privacy, caching and fallback rules in `docs/architecture/forecast-and-radar.md`.
- °C by default, °F for US visitors (from the endpoint).
- "Coming up" stills are captured from each built channel at build time with Playwright. Unbuilt channels are skipped.
- Keep the forecast fetch, radar and promo rotation in separate modules so the grid can ship first (3.4) and the forecast after (3.5).

## Acceptance

- Renders with 0, 1 and 30 projects, and with `live = null`.
- Forecast missing → promo shows only "Coming up", no errors, no fixed city.
- Clock shows the viewer's own time and format.
- Every project and visible weather attribution reachable by keyboard.
- Weather uses only same-origin requests; DNT/Save-Data skips lookup/radar, missing coverage is labelled, and cancellation/limits follow the weather specification.
- Ticker and grid pause when tuned away.

## References

- `docs/reference/mockups/ch01-tv-guide.png` — v3, the approved design.
- `docs/reference/mockups/ch01-tv-guide-forecast-v2.png` — earlier forecast layout (superseded).
- `docs/reference/mockups/ch01-tv-guide-ref-b-teletext.png`, `-ref-c-magazine.png`, `-ref-d-cable-epg.png` — alternative flat directions kept for reference.
- `docs/reference/assets/guide/` — mockup radar and promo still.
- Prototype source: `docs/reference/prototypes/boards/ChGuide.dc.html`.
