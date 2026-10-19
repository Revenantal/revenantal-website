# Forecast and Radar

Optional TV Guide weather. These are requirements for tasks 3.3/3.5; deployment verification remains pending. The directory works without weather.

## Requests and Location

The browser calls only same-origin GET /api/forecast while the active forecast segment is visible. No browser location permission or third-party browser requests. DNT: 1 or Save-Data: on skips all weather/radar requests; the service checks these headers before lookup too. Abort on tune-away/hidden tabs; no background polling.

Use the local DB-IP Lite city database and city-centre coordinates rounded to two decimals. Never accept a browser-supplied IP or coordinates. Return only city/country, units, rounded coordinates, observation time and required forecast fields. No IP, lookup record or provider diagnostics. Use °C except °F for US visitors. Unknown/non-public addresses, lookup failures or upstream failures skip the segment; never fall back to a fixed city.

## Trusted Proxy Boundary

Use one ingress: Coolify edge proxy → app Caddy → private weather service. The edge overwrites incoming Forwarded/X-Forwarded-For/X-Real-IP with the socket client address. Caddy trusts only the configured edge address/CIDR and overwrites X-Real-IP toward the service with that validated address. The service accepts X-Real-IP only from the configured Caddy peer and ignores other address headers. Missing/malformed addresses fail closed.

Expose neither the weather port nor the internal Caddy listener directly. Never trust every private-network address or blindly take the first forwarded address. Provision exact peers during deployment; unknown topology leaves weather unavailable. Later CDN/proxy changes require trust-chain review and spoofing checks before weather is enabled.

## Caching and Limits

Every forecast/radar response, including errors, has Cache-Control: private, no-store. Edge, Caddy, service workers and CDN rules bypass these routes. Do not persist forecasts, city or coordinates in browser storage. Browser weather state lives only in memory during the visit.

The separate upstream forecast cache uses rounded city-centre coordinates plus units, TTL 30 minutes, LRU maximum 1,000 entries/32 MiB; evict at either limit. Never key by IP. Coalesce city requests. Use a five-second deadline, 256 KiB forecast response limit, no redirects and no per-request retries. Bound upstream concurrency to eight and upstream traffic to 30 requests/minute globally across forecast/radar. Expired data or exhausted limits shows the panel's unavailable state, never stale data shown as current.

Limit forecast requests to ten/minute and radar requests to 120/minute per transient client bucket. Buckets use an HMAC of the normalized IP with a random in-memory service secret, expire after ten minutes and are capped at 10,000; reject excess new buckets. No raw IP retention after request processing. Restart clears buckets. Rate limits also apply to cache hits.

## Logs and Privacy Text

Disable request/access logs for weather routes at the edge, Caddy and service, including failures/rate limits. Disable URL/header/body capture and tracing/error-reporting breadcrumbs. Record only aggregate counts and bounded error codes. Inspect actual platform logs before enabling weather; an application logging switch alone is insufficient.

Panel text: “Local weather uses your network address briefly to estimate your city. We do not save it. Our server requests forecasts and radar for your approximate area from Open-Meteo and RainViewer.” Link provider privacy pages. Providers receive the server address and approximate area/tile requests and apply their own policies; do not promise they retain nothing. The browser never contacts them directly.

## Radar and Base Map

Bundle a simplified Natural Earth 1:110m land/coastline map locally, styled dark and projected to match radar tiles. This regional overview has no streets or live base-map tile provider. Pin the source/version and record its URL, public-domain terms and processing in the asset record. Include compressed output in channel art budgets; simplify further if needed.

The weather service also serves GET /api/radar/frames and GET /api/radar/tiles/<frame>/<z>/<x>/<y>.png. Fetch the fixed RainViewer manifest server-side; expose validated recent past frames only. Fix HTTPS upstream hosts to api.rainviewer.com and tilecache.rainviewer.com. Reject redirects, arbitrary URLs/paths, invalid frame membership, zoom outside integer 0–7 and tile coordinates outside 0 through 2^z−1. Fix size/colour/options server-side. Never forward visitor headers/addresses upstream.

Cache the validated global manifest for five minutes and tiles by frame/z/x/y in a separate LRU capped at 64 MiB/2,000 entries, TTL ten minutes. Use five-second deadlines, a 1 MiB tile limit and PNG validation. Share upstream concurrency/rate limits with forecasts. Internal caches do not change HTTP no-store responses. Require same-origin browser fetch metadata and reject foreign Origin values; do not enable CORS. DNT/Save-Data suppress radar too.

Load at most three recent past frames and nine tiles/frame per display, with two browser requests in flight. No pan/zoom UI or nowcast assumption. Cancel on leaving the segment. Missing coverage or failed tiles shows the local base map, “Radar unavailable” and current conditions; never portray missing coverage as clear skies.

## Visible Credits

Reserve a stationary, readable footer inside the forecast/radar panel, outside the moving ticker and effects that impair legibility. Provide keyboard-reachable links:

- Weather data by [Open-Meteo.com](https://open-meteo.com/).
- Radar by [RainViewer](https://www.rainviewer.com/).
- IP location by [DB-IP](https://db-ip.com/).
- Map: [Natural Earth](https://www.naturalearthdata.com/).

Retain required licence/change notices and the same entries in shared credits and CREDITS.md. Wrap the footer when needed; never hide it or rely on Credits alone.

Sources checked 2026-10-18: [Open-Meteo attribution](https://github.com/open-meteo/open-meteo), [Open-Meteo terms/privacy](https://open-meteo.com/en/terms), [RainViewer terms](https://www.rainviewer.com/api.html), [RainViewer tile limits](https://www.rainviewer.com/api/weather-maps-api.html), [DB-IP attribution](https://db-ip.com/db/lite.php), [Natural Earth public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/). Recheck during implementation.

## Acceptance Before Enabling Weather

Test two visitors in different cities through real ingress; responses cannot be shared by HTTP caches. Try forged address headers, direct access, malformed/private addresses and DNT/Save-Data; the latter performs no lookup/upstream requests. Inspect edge/app/service logs after successes, failures and rate limits; no identifying fields may appear.

Exercise cache eviction/expiry, coalescing, limits, aborts, timeouts, oversized/invalid upstream data, denied redirects/hosts, invalid tiles/frames and missing coverage. Browser requests must remain same-origin. Check credits visually and by keyboard at authored panel size. Gate 3 requires these checks; failure leaves weather disabled while the guide works.

## Implementation (task 3.3)

The service is built and stays off until the 3.7 checks pass. Code is in `api/forecast/`: `client-address.ts` (trusted peer and public-address checks), `locate.ts` (DB-IP lookup), `forecast.ts` (Open-Meteo), `radar.ts` (RainViewer), `upstream.ts` (the only outbound client), `limits.ts`, `lru.ts` and `handler.ts`. Response types `Forecast` and `RadarFrames` are in `src/data/types.ts` for the TV Guide.

- **Settings:** the service reads `PORT` (8090), `TRUSTED_PEERS` (the site Caddy's exact address or range; unset trusts nobody) and `DBIP_PATH`. The site's Caddy reads `TRUSTED_EDGE` (the edge proxy; unset trusts nobody) and `FORECAST_UPSTREAM` (unset sends weather routes to a closed port, so they answer `{"error":"weather_unavailable"}` 503). See `deploy/compose.example.yml`.
- **Responses:** 200 with the forecast, frames or a PNG tile; 204 for DNT or Save-Data (before any lookup); 403 `cross_origin` without same-origin fetch metadata; 429 `rate_limited`; 503 `unavailable` (no trusted public address or no city) or `upstream`; 404 for invalid tiles or frames. The TV Guide treats anything but 200 as "skip the segment".
- **City database:** `pnpm fetch:dbip` downloads this month's DB-IP Lite city MMDB (or last month's) into `.cache/forecast/`; the deploy workflow runs it before building `revenantal-forecast`. Without it the service starts and answers every forecast as unavailable.
- **Logs:** a startup line and hourly aggregate counts by route and bounded code. No addresses, places or request details.
- **Verified locally (2026-10-19):** the bundled service with the real database and providers (8.8.8.8 → Mountain View in °F and mph; a UK address → London in °C and km/h; three radar frames; a real PNG tile); then edge → Caddy 2.11.7 → service with a trusted and an untrusted edge, a forged `X-Real-IP`, a missing address and DNT. Logs held no addresses. CI builds the image without the database and checks that it starts read-only as user 10001 and fails closed.
- **Pending (3.7):** two real visitors through the real ingress, platform log inspection, and the exact edge and Caddy peers.
- DB-IP's requested attribution text is "IP Geolocation by DB-IP"; the panel footer (3.5) uses that wording.

## Local Time

Clocks use the viewer’s time zone and locale through Intl, independent of location lookup. 12- or 24-hour format follows the locale.
