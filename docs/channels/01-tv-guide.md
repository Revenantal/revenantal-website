# CH 01 — TV Guide

## Summary

The home channel and the first thing new visitors see, so it sets the quality bar. A 90s cable guide channel built from glossy broadcast graphics, a mix of Prevue Channel and the Weather Channel.

- **Kind:** directory · **Folder:** `tv-guide` · **Build:** tasks 3.4–3.5 (launch) · **Status:** built: listings, clock, ticker and station box (3.4); forecast and radar panel (3.5)

## Concept

The screen is split like a real guide channel. The top half has a large Local Forecast window for the visitor's own city over a Doppler radar map. The top right shows the visitor's own clock and date and the other channels on the dial. The bottom half is a scrolling listings grid, one row per project, and a live news ticker runs along the bottom.

It should look like broadcast graphics, not a cartoon: bevelled glossy panels, gradients, drop shadows, thin rules.

## Data Shown

| Area           | Props                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Listings grid  | `projects` (one row each: time slot, icon, name, host, desc, status), then servers, Steam and GitHub rows |
| Clock and date | `now`, formatted with `Intl` in the viewer's time zone and locale                                         |
| Listing times  | `now` rounded to the half hour in the viewer's time zone                                                  |
| Ticker         | `live.github` latest pushes, `live.steam` now playing, server counts, project status changes              |
| Forecast       | From `/api/forecast` (see `docs/architecture/forecast-and-radar.md`)                                      |
| On the dial    | `dial.json` in this folder, kept in step with the registry by a check                                     |

The forecast is the one place a channel fetches data. That fetch lives in a small helper inside this channel folder. While it is unavailable (not built yet, DNT or Save-Data, no city, or a failure), the window shows soft static and "Forecast not available". It never falls back to a fixed city.

## Interaction

- The grid auto-scrolls. Hover or focus pauses it, and a focused row is moved into view. Reduced motion shows a still, manually scrollable list.
- ↑/↓ inside the channel are not captured (the dial keeps them). Tab moves through rows; Enter opens the project in a new tab.
- Click a row to open it. Server, Steam and GitHub rows are information only. Rows for other channels ("on the dial") tune to them.
- Rows for other channels tune with `host.tune(channelId)`; the host resolves the position and updates the normal hash. Do not import the store or hard-code a position.
- The station box lists the channels on the dial.
- Projects that are up carry a LIVE badge. The ticker reports the current state only: what's playing on Steam, the latest pushes, running servers and their players, and projects that are down or slow.

## Look

- Navy and blue-violet gradient panels with glossy highlights; yellow and white type; red LIVE badges.
- Each row gets a small coloured icon by project type.
- Fonts: Archivo Narrow (listings), Archivo Black (headers, temperatures).
- Display profile: scan 1, flicker, glow 0.8, no bloom (the default; its filter blurs text). `safe: false` (owner request): the background and ticker bar bleed to the glass edges, while the panels, time header and listings are drawn at mockup size and scaled to 90% inside a padded box (38 px sides, 24 px top), and the ticker text sits inside the same padding.

## Sound

Music: "Weather Forecast Type Beat" by YellowTree (CC BY 4.0), inspired by the 80s and 90s weather channel. It plays to its natural ending and restarts, fades in after the static and ducks under the OSD (`public/assets/music/tv-guide.m4a`). A row tick and promo stinger may be proposed later (see `soundscapes.md` → TV Guide).

## Build Notes

- Grid scroll uses `transform` on one element, driven by `requestAnimationFrame`, and pauses when `active` is false.
- The forecast window (`ForecastWindow.tsx`, `RadarMap.tsx`, `weather.ts`) fetches `/api/forecast` while the channel is active, at most once per 30 minutes per visit (memory only, never storage), and aborts on tune-away. Do Not Track or Save-Data skip it with no request.
- It shows the current temperature and conditions, "Feels · Humidity · Wind", three days (Today and the next two), and same-origin RainViewer radar (three recent frames at zoom 5, at most two tile requests in flight, looping only while active; the newest frame only with reduced motion) over the bundled Natural Earth base map (`public/assets/tv-guide/base-map.json`: land, lakes, country borders, and state and province lines; fetched only when the forecast shows). A city marker sits on the map. Missing coverage or failed tiles show "Radar unavailable".
- A stationary footer credits "Weather data by Open-Meteo.com · Radar by RainViewer · IP Geolocation by DB-IP · Map: Natural Earth" with links, plus a Privacy button that shows the panel's privacy note and provider privacy links. Screen readers get one spoken summary of the forecast.
- The contract allows only these requests (`WEATHER_PATHS` in `weather.ts`). Follow the request, privacy, caching and fallback rules in `docs/architecture/forecast-and-radar.md`.
- °C by default, °F for US visitors (from the endpoint).
- Add each newly built channel to `dial.json` (ID, label, title, one-line blurb); `tools/checks/tv-guide-dial.test.ts` fails until it matches the registry.
- Keep the forecast fetch, radar and promo rotation in separate modules so the grid can ship first (3.4) and the forecast after (3.5).

## Acceptance

- Renders with 0, 1 and 30 projects, and with `live = null`.
- Forecast missing → the window shows soft static and "Forecast not available", no errors, no fixed city.
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
