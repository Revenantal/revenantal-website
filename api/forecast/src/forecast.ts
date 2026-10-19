import { z } from "zod";
import type { Forecast } from "../../../src/data/types.ts";
import type { Place } from "./locate.ts";
import { createLru } from "./lru.ts";
import { createCoalescer } from "./upstream.ts";
import type { Upstream } from "./upstream.ts";

const MAX_BYTES = 256 * 1024;
const DAYS = 3;

const number = z.number();
const openMeteoSchema = z.object({
  current: z.object({
    time: z.string().min(1).max(40),
    temperature_2m: number,
    apparent_temperature: number,
    relative_humidity_2m: number.min(0).max(100),
    weather_code: z.number().int().min(0).max(99),
    wind_speed_10m: number,
    wind_direction_10m: number.min(0).max(360),
    is_day: z.union([z.literal(0), z.literal(1)]),
  }),
  utc_offset_seconds: z.number().int(),
  daily: z.object({
    time: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
    temperature_2m_max: z.array(number),
    temperature_2m_min: z.array(number),
    weather_code: z.array(z.number().int().min(0).max(99)),
    precipitation_probability_max: z.array(number.nullable()),
  }),
});

type Units = Pick<Forecast, "units" | "windUnit">;

/**
 * °F and mph for US visitors, °C and km/h everywhere else.
 *
 * @param country - ISO country code.
 * @returns The display units.
 */
export function unitsFor(country: string): Units {
  return country === "US"
    ? { units: "F", windUnit: "mph" }
    : { units: "C", windUnit: "km/h" };
}

/**
 * The Open-Meteo request for a rounded city centre.
 *
 * @param place - The approximate city.
 * @returns The fixed-host request URL.
 */
export function openMeteoUrl(place: Place): URL {
  const { units } = unitsFor(place.country);
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: place.latitude.toFixed(2),
    longitude: place.longitude.toFixed(2),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    daily:
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    temperature_unit: units === "F" ? "fahrenheit" : "celsius",
    wind_speed_unit: units === "F" ? "mph" : "kmh",
    timezone: "auto",
    forecast_days: String(DAYS),
  }).toString();
  return url;
}

/**
 * Converts the provider's local current time ("2026-10-19T14:15") to an ISO instant.
 *
 * @param local - Local date-time without an offset.
 * @param offsetSeconds - The city's UTC offset.
 * @returns ISO time, or null when unreadable.
 */
function toInstant(local: string, offsetSeconds: number): string | null {
  const parsed = Date.parse(`${local.length === 16 ? `${local}:00` : local}Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed - offsetSeconds * 1000).toISOString();
}

/**
 * Validates an Open-Meteo response and keeps only the fields the panel shows.
 *
 * @param body - Raw response bytes.
 * @param place - The city it was requested for.
 * @returns The public forecast, or null for anything unexpected.
 */
export function parseForecast(body: Uint8Array, place: Place): Forecast | null {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  }
  const parsed = openMeteoSchema.safeParse(json);
  if (!parsed.success) return null;
  const { current, daily, utc_offset_seconds: offset } = parsed.data;
  const observedAt = toInstant(current.time, offset);
  if (!observedAt) return null;
  const days: Forecast["daily"] = [];
  for (const [index, date] of daily.time.slice(0, DAYS).entries()) {
    const high = daily.temperature_2m_max[index];
    const low = daily.temperature_2m_min[index];
    const weatherCode = daily.weather_code[index];
    if (high === undefined || low === undefined || weatherCode === undefined)
      return null;
    days.push({
      date,
      high: Math.round(high),
      low: Math.round(low),
      weatherCode,
      precipitationChance: daily.precipitation_probability_max[index] ?? null,
    });
  }
  return {
    city: place.city,
    country: place.country,
    ...unitsFor(place.country),
    latitude: place.latitude,
    longitude: place.longitude,
    observedAt,
    current: {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      weatherCode: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: Math.round(current.wind_direction_10m) % 360,
      isDay: current.is_day === 1,
    },
    daily: days,
  };
}

/** Forecasts by city, cached and coalesced. */
export type ForecastSource = (place: Place) => Promise<Forecast | null>;

/**
 * Creates the forecast source: one upstream request per rounded city centre and unit system
 * at a time, cached for 30 minutes (at most 1,000 cities and 32 MiB). Never keyed by address.
 * Upstream failures give null, and nothing stale is served.
 *
 * @param upstream - The shared upstream client.
 * @param now - Clock.
 * @returns The forecast source.
 */
export function createForecastSource(
  upstream: Upstream,
  now: () => number = Date.now,
): ForecastSource {
  const cache = createLru<string, Forecast>({
    maxEntries: 1000,
    maxBytes: 32 * 1024 * 1024,
    ttlMs: 30 * 60_000,
    size: (value) => JSON.stringify(value).length * 2,
    now,
  });
  const coalesce = createCoalescer();
  return async (place) => {
    const key = `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)},${unitsFor(place.country).units}`;
    const cached = cache.get(key);
    // The cache is per city centre; the city name always comes from this visitor's lookup.
    if (cached) return { ...cached, city: place.city, country: place.country };
    const shared = await coalesce(key, async () => {
      try {
        const forecast = parseForecast(
          await upstream.get(openMeteoUrl(place), MAX_BYTES),
          place,
        );
        if (forecast) cache.set(key, forecast);
        return forecast;
      } catch {
        return null;
      }
    });
    return shared && { ...shared, city: place.city, country: place.country };
  };
}
