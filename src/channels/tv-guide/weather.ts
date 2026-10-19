import { useEffect, useState } from "preact/hooks";
import type { Forecast, RadarFrames } from "../../data/types";

/**
 * The TV Guide's only network requests: the same-origin weather routes and its own base map.
 * Nothing is stored in the browser; results live in memory for the visit.
 */
export const WEATHER_PATHS = [
  "/api/forecast",
  "/api/radar/",
  "/assets/tv-guide/land-110m.json",
];

const MEMORY_MS = 30 * 60_000;
let remembered: { forecast: Forecast; at: number } | null = null;

/**
 * Forgets the in-memory forecast (tests only).
 */
export function forgetForecast() {
  remembered = null;
}

/**
 * True when the visitor asked for less tracking or data (Do Not Track or Save-Data); weather
 * is then skipped entirely, with no request.
 *
 * @returns Whether to skip weather.
 */
export function weatherSkipped(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean };
    }
  ).connection;
  return navigator.doNotTrack === "1" || connection?.saveData === true;
}

function isForecast(value: unknown): value is Forecast {
  if (!value || typeof value !== "object") return false;
  const forecast = value as Partial<Forecast>;
  return (
    typeof forecast.city === "string" &&
    (forecast.units === "C" || forecast.units === "F") &&
    typeof forecast.latitude === "number" &&
    typeof forecast.longitude === "number" &&
    typeof forecast.current?.temperature === "number" &&
    Array.isArray(forecast.daily)
  );
}

/**
 * Fetches the visitor's forecast. Anything but a valid 200 answer means unavailable.
 *
 * @param signal - Aborts the request on tune-away.
 * @returns The forecast, or null.
 */
export async function fetchForecast(
  signal: AbortSignal,
): Promise<Forecast | null> {
  try {
    const response = await fetch("/api/forecast", {
      signal,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (response.status !== 200) return null;
    const body: unknown = await response.json();
    return isForecast(body) ? body : null;
  } catch {
    return null;
  }
}

/**
 * Fetches the recent radar frames.
 *
 * @param signal - Aborts the request on tune-away.
 * @returns Up to three frame IDs, oldest first, or null.
 */
export async function fetchFrames(
  signal: AbortSignal,
): Promise<string[] | null> {
  try {
    const response = await fetch("/api/radar/frames", {
      signal,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (response.status !== 200) return null;
    const body = (await response.json()) as Partial<RadarFrames>;
    const ids = (body.frames ?? [])
      .map((frame) => frame.id)
      .filter((id) => /^\d{1,12}$/.test(id))
      .slice(-3);
    return ids.length > 0 ? ids : null;
  } catch {
    return null;
  }
}

/** The forecast window's state. */
export type WeatherState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; forecast: Forecast };

/**
 * Loads the forecast while the channel is active, at most once per 30 minutes per visit, and
 * aborts on tune-away. No polling: an open, idle page keeps what it has.
 *
 * @param active - Whether the channel is tuned in and visible.
 * @returns The forecast state.
 */
export function useForecast(active: boolean): WeatherState {
  const [state, setState] = useState<WeatherState>(() =>
    remembered && Date.now() - remembered.at < MEMORY_MS
      ? { status: "ready", forecast: remembered.forecast }
      : { status: "loading" },
  );
  useEffect(() => {
    if (!active || state.status !== "loading") return;
    if (weatherSkipped()) {
      setState({ status: "unavailable" });
      return;
    }
    const controller = new AbortController();
    void fetchForecast(controller.signal).then((forecast) => {
      if (controller.signal.aborted) return;
      if (forecast) remembered = { forecast, at: Date.now() };
      setState(
        forecast ? { status: "ready", forecast } : { status: "unavailable" },
      );
    });
    return () => {
      controller.abort();
    };
  }, [active, state.status]);
  return state;
}

/** Map tiles: Web Mercator pixels at a zoom level (256 px tiles). */
export const TILE = 256;

/**
 * Projects a longitude and latitude to Web Mercator world pixels.
 *
 * @param longitude - Degrees east.
 * @param latitude - Degrees north.
 * @param zoom - Zoom level.
 * @returns [x, y] in world pixels.
 */
export function project(
  longitude: number,
  latitude: number,
  zoom: number,
): [number, number] {
  const size = TILE * 2 ** zoom;
  const clamped = Math.max(-85.0511, Math.min(85.0511, latitude));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return [
    ((longitude + 180) / 360) * size,
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  ];
}

/** One radar tile placed in the view. */
export type PlacedTile = {
  x: number;
  y: number;
  z: number;
  left: number;
  top: number;
};

/**
 * The tiles that cover a view with the city at a given point in it.
 *
 * @param city - The city's longitude and latitude.
 * @param city.longitude - Degrees east.
 * @param city.latitude - Degrees north.
 * @param zoom - Zoom level (0–7).
 * @param view - View size and where the city sits in it.
 * @param view.width - View width.
 * @param view.height - View height.
 * @param view.cityX - City position from the left.
 * @param view.cityY - City position from the top.
 * @returns The view origin in world pixels and at most nine tiles.
 */
export function tileLayout(
  city: { longitude: number; latitude: number },
  zoom: number,
  view: { width: number; height: number; cityX: number; cityY: number },
): { originX: number; originY: number; tiles: PlacedTile[] } {
  const [x, y] = project(city.longitude, city.latitude, zoom);
  const originX = x - view.cityX;
  const originY = y - view.cityY;
  const count = 2 ** zoom;
  const tiles: PlacedTile[] = [];
  for (
    let ty = Math.floor(originY / TILE);
    ty * TILE < originY + view.height;
    ty += 1
  )
    for (
      let tx = Math.floor(originX / TILE);
      tx * TILE < originX + view.width;
      tx += 1
    ) {
      if (ty < 0 || ty >= count) continue;
      tiles.push({
        x: ((tx % count) + count) % count,
        y: ty,
        z: zoom,
        left: tx * TILE - originX,
        top: ty * TILE - originY,
      });
    }
  return { originX, originY, tiles: tiles.slice(0, 9) };
}

/** What a WMO weather code looks like and is called. */
export type Condition = {
  label: string;
  icon: "clear" | "partly" | "cloudy" | "fog" | "rain" | "snow" | "storm";
};

/**
 * Describes a WMO weather code.
 *
 * @param code - The WMO code from the forecast.
 * @returns A short label and icon kind.
 */
export function describeWeather(code: number): Condition {
  if (code === 0) return { label: "Clear", icon: "clear" };
  if (code <= 2) return { label: "Partly cloudy", icon: "partly" };
  if (code === 3) return { label: "Cloudy", icon: "cloudy" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "rain" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { label: "Rain", icon: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: "Snow", icon: "snow" };
  if (code >= 95) return { label: "Storms", icon: "storm" };
  return { label: "Cloudy", icon: "cloudy" };
}

/**
 * A compass point for a wind direction.
 *
 * @param degrees - Direction the wind comes from.
 * @returns "N", "NE", "E" … "NW".
 */
export function compass(degrees: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? "N";
}
