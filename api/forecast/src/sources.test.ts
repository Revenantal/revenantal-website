import { describe, expect, it, vi } from "vitest";
import {
  createForecastSource,
  openMeteoUrl,
  parseForecast,
  unitsFor,
} from "./forecast.ts";
import { toPlace } from "./locate.ts";
import type { Place } from "./locate.ts";
import {
  createRadarSource,
  isPng,
  parseManifest,
  parseTilePath,
} from "./radar.ts";
import type { Upstream } from "./upstream.ts";

const encode = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value));

const toronto: Place = {
  city: "Toronto",
  country: "CA",
  latitude: 43.65,
  longitude: -79.38,
};

const openMeteo = {
  utc_offset_seconds: -14_400,
  current: {
    time: "2026-10-19T14:15",
    temperature_2m: 11.6,
    apparent_temperature: 9.7,
    relative_humidity_2m: 64,
    weather_code: 3,
    wind_speed_10m: 14.2,
    wind_direction_10m: 315,
    is_day: 1,
  },
  daily: {
    time: ["2026-10-19", "2026-10-20", "2026-10-21"],
    temperature_2m_max: [13.1, 9.4, 8],
    temperature_2m_min: [5.2, 2.6, 1],
    weather_code: [3, 61, 0],
    precipitation_probability_max: [10, 80, null],
  },
};

describe("city lookup", () => {
  it("keeps only the city, country and rounded city-centre coordinates", () => {
    expect(
      toPlace({
        city: { names: { en: "Toronto" } },
        country: { iso_code: "CA", names: { en: "Canada" } },
        location: {
          latitude: 43.6532,
          longitude: -79.3832,
          accuracy_radius: 5,
        },
        postal: { code: "M5H" },
      }),
    ).toEqual(toronto);
    for (const record of [
      null,
      { country: { iso_code: "CA" }, location: { latitude: 1, longitude: 1 } },
      { city: { names: { en: "X" } }, country: { iso_code: "CA" } },
      {
        city: { names: { en: "X" } },
        country: { iso_code: "ca" },
        location: { latitude: 1, longitude: 1 },
      },
    ])
      expect(toPlace(record)).toBeNull();
  });
});

describe("forecast", () => {
  it("asks Open-Meteo for the rounded city centre in the visitor's units", () => {
    const url = openMeteoUrl(toronto);
    expect(url.hostname).toBe("api.open-meteo.com");
    expect(url.searchParams.get("latitude")).toBe("43.65");
    expect(url.searchParams.get("temperature_unit")).toBe("celsius");
    expect(
      openMeteoUrl({ ...toronto, country: "US" }).searchParams.get(
        "temperature_unit",
      ),
    ).toBe("fahrenheit");
    expect(unitsFor("US")).toEqual({ units: "F", windUnit: "mph" });
  });

  it("returns only the fields the panel shows, and rejects anything unexpected", () => {
    expect(parseForecast(encode(openMeteo), toronto)).toEqual({
      city: "Toronto",
      country: "CA",
      units: "C",
      windUnit: "km/h",
      latitude: 43.65,
      longitude: -79.38,
      observedAt: "2026-10-19T18:15:00.000Z",
      current: {
        temperature: 12,
        feelsLike: 10,
        humidity: 64,
        weatherCode: 3,
        windSpeed: 14,
        windDirection: 315,
        isDay: true,
      },
      daily: [
        {
          date: "2026-10-19",
          high: 13,
          low: 5,
          weatherCode: 3,
          precipitationChance: 10,
        },
        {
          date: "2026-10-20",
          high: 9,
          low: 3,
          weatherCode: 61,
          precipitationChance: 80,
        },
        {
          date: "2026-10-21",
          high: 8,
          low: 1,
          weatherCode: 0,
          precipitationChance: null,
        },
      ],
    });
    expect(parseForecast(new TextEncoder().encode("{"), toronto)).toBeNull();
    expect(
      parseForecast(
        encode({
          ...openMeteo,
          current: { ...openMeteo.current, weather_code: 500 },
        }),
        toronto,
      ),
    ).toBeNull();
  });

  it("caches per city centre for 30 minutes, coalesces, and never serves failures or stale data", async () => {
    let time = 0;
    const get = vi.fn(() => Promise.resolve(encode(openMeteo)));
    const source = createForecastSource({ get }, () => time);
    const [first, second] = await Promise.all([
      source(toronto),
      source({ ...toronto, city: "Toronto East" }),
    ]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(first?.city).toBe("Toronto");
    expect(second?.city).toBe("Toronto East");
    await source(toronto);
    expect(get).toHaveBeenCalledTimes(1);
    time = 30 * 60_000;
    await source(toronto);
    expect(get).toHaveBeenCalledTimes(2);

    const failing = createForecastSource({
      get: () => Promise.reject(new Error("upstream")),
    });
    expect(await failing(toronto)).toBeNull();
  });
});

describe("radar", () => {
  const manifest = {
    version: "2.0",
    generated: 1,
    host: "https://tilecache.rainviewer.com",
    radar: {
      past: [1, 2, 3, 4].map((step) => ({
        time: 1_760_000_000 + step * 600,
        path: `/v2/radar/abc${String(step)}`,
      })),
    },
  };
  const png = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1,
  ]);

  it("accepts only integer tiles at zoom 0–7 inside the grid", () => {
    expect(parseTilePath("/api/radar/tiles/1760001800/7/127/0.png")).toEqual({
      frame: "1760001800",
      z: 7,
      x: 127,
      y: 0,
    });
    for (const path of [
      "/api/radar/tiles/1760001800/8/0/0.png",
      "/api/radar/tiles/1760001800/2/4/0.png",
      "/api/radar/tiles/1760001800/2/0/4.png",
      "/api/radar/tiles/abc/2/0/0.png",
      "/api/radar/tiles/1760001800/2/0/0.jpg",
      "/api/radar/tiles/1760001800/2/-1/0.png",
      "/api/radar/tiles/1760001800/2/../0.png",
      "/api/radar/tiles/1760001800/1.5/0/0.png",
    ])
      expect(parseTilePath(path), path).toBeNull();
  });

  it("keeps the three newest frames from a manifest on the fixed tile host", () => {
    expect(parseManifest(encode(manifest))?.map((frame) => frame.id)).toEqual([
      "1760001200",
      "1760001800",
      "1760002400",
    ]);
    expect(
      parseManifest(encode({ ...manifest, host: "https://evil.example" })),
    ).toBeNull();
    expect(
      parseManifest(
        encode({
          ...manifest,
          radar: { past: [{ time: 1, path: "/../../etc/passwd" }] },
        }),
      ),
    ).toBeNull();
    expect(isPng(png)).toBe(true);
    expect(isPng(new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it("serves frames without upstream paths, and tiles only for current frames", async () => {
    const get = vi.fn<Upstream["get"]>((url) =>
      Promise.resolve(
        url.hostname === "api.rainviewer.com" ? encode(manifest) : png,
      ),
    );
    const radar = createRadarSource({ get });
    expect(await radar.frames()).toEqual({
      frames: [
        { id: "1760001200", time: "2025-10-09T09:13:20.000Z" },
        { id: "1760001800", time: "2025-10-09T09:23:20.000Z" },
        { id: "1760002400", time: "2025-10-09T09:33:20.000Z" },
      ],
    });
    expect(
      await radar.tile({ frame: "1760000600", z: 1, x: 0, y: 0 }),
    ).toBeNull();
    expect(await radar.tile({ frame: "1760002400", z: 3, x: 2, y: 5 })).toEqual(
      png,
    );
    await radar.tile({ frame: "1760002400", z: 3, x: 2, y: 5 });
    const tileCalls = get.mock.calls.filter(
      ([url]) => url.hostname === "tilecache.rainviewer.com",
    );
    expect(tileCalls).toHaveLength(1);
    expect(tileCalls[0]?.[0].pathname).toBe(
      "/v2/radar/abc4/256/3/2/5/2/1_1.png",
    );
    expect(
      get.mock.calls.filter(([url]) => url.hostname === "api.rainviewer.com"),
    ).toHaveLength(1);
  });

  it("refuses non-PNG tiles and survives a failed manifest", async () => {
    const bad = createRadarSource({
      get: (url) =>
        Promise.resolve(
          url.hostname === "api.rainviewer.com"
            ? encode(manifest)
            : new Uint8Array([1, 2, 3]),
        ),
    });
    expect(
      await bad.tile({ frame: "1760002400", z: 0, x: 0, y: 0 }),
    ).toBeNull();
    const down = createRadarSource({
      get: () => Promise.reject(new Error("x")),
    });
    expect(await down.frames()).toBeNull();
  });
});
