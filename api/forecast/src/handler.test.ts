import { createServer, request } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Forecast } from "../../../src/data/types.ts";
import { parsePeers } from "./client-address.ts";
import { createHandler } from "./handler.ts";
import type { Services } from "./handler.ts";
import { createClientLimiter } from "./limits.ts";

const forecast: Forecast = {
  city: "Toronto",
  country: "CA",
  units: "C",
  windUnit: "km/h",
  latitude: 43.65,
  longitude: -79.38,
  observedAt: "2026-10-19T18:15:00.000Z",
  current: { temperature: 12, weatherCode: 3, windSpeed: 14, isDay: true },
  daily: [],
};
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const browser = {
  host: "revenantal.test",
  "sec-fetch-site": "same-origin",
  "x-real-ip": "8.8.8.8",
};

let close: (() => void) | undefined;
afterEach(() => {
  close?.();
});

async function start(overrides: Partial<Services> = {}) {
  const services: Services = {
    // Requests in these tests arrive from loopback, standing in for the app Caddy.
    trusted: parsePeers("127.0.0.1,::1"),
    locate: vi.fn(() => ({
      city: "Toronto",
      country: "CA",
      latitude: 43.65,
      longitude: -79.38,
    })),
    forecast: vi.fn(() => Promise.resolve(forecast)),
    radar: {
      frames: vi.fn(() =>
        Promise.resolve({
          frames: [{ id: "1", time: "2026-10-19T18:00:00.000Z" }],
        }),
      ),
      tile: vi.fn(() => Promise.resolve(png)),
    },
    forecastLimit: createClientLimiter(10),
    radarLimit: createClientLimiter(120),
    counts: new Map(),
    ...overrides,
  };
  const server = createServer((req, res) => {
    void createHandler(services)(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  const { port } = server.address() as AddressInfo;
  const call = (
    path: string,
    headers: Record<string, string> = browser,
    method = "GET",
  ) =>
    new Promise<{
      status: number;
      headers: Record<string, unknown>;
      body: Buffer;
    }>((resolve, reject) => {
      const req = request(
        { host: "127.0.0.1", port, path, method, headers },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: Buffer.concat(chunks),
            });
          });
        },
      );
      req.on("error", reject);
      req.end();
    });
  return { services, call };
}

describe("weather service routes", () => {
  it("returns the forecast privately, with no caching, CORS or extra fields", async () => {
    const { call, services } = await start();
    const response = await call("/api/forecast");
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(JSON.parse(response.body.toString())).toEqual(forecast);
    expect(services.locate).toHaveBeenCalledWith("8.8.8.8");
  });

  it("refuses cross-origin requests and missing fetch metadata", async () => {
    const { call } = await start();
    expect(
      (
        await call("/api/forecast", {
          ...browser,
          "sec-fetch-site": "cross-site",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await call("/api/forecast", {
          host: browser.host,
          "x-real-ip": "8.8.8.8",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await call("/api/forecast", {
          ...browser,
          origin: "https://evil.example",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await call("/api/forecast", {
          ...browser,
          origin: "https://revenantal.test",
        })
      ).status,
    ).toBe(200);
  });

  it("skips everything for Do Not Track and Save-Data, before any lookup", async () => {
    const { call, services } = await start();
    const optOuts: Record<string, string>[] = [
      { dnt: "1" },
      { "save-data": "on" },
    ];
    for (const extra of optOuts) {
      const response = await call("/api/forecast", { ...browser, ...extra });
      expect(response.status).toBe(204);
      expect(response.headers["cache-control"]).toBe("private, no-store");
    }
    expect(
      (await call("/api/radar/frames", { ...browser, dnt: "1" })).status,
    ).toBe(204);
    expect(services.locate).not.toHaveBeenCalled();
    expect(services.forecast).not.toHaveBeenCalled();
    expect(services.radar.frames).not.toHaveBeenCalled();
  });

  it("ignores forged address headers and fails closed without a trusted public address", async () => {
    const { call, services } = await start();
    const forged = {
      ...browser,
      "x-forwarded-for": "1.1.1.1",
      forwarded: "for=1.1.1.1",
    };
    await call("/api/forecast", forged);
    expect(services.locate).toHaveBeenLastCalledWith("8.8.8.8");
    expect(
      (await call("/api/forecast", { ...browser, "x-real-ip": "10.0.0.1" }))
        .status,
    ).toBe(503);
    expect(
      (await call("/api/forecast", { ...browser, "x-real-ip": "" })).status,
    ).toBe(503);

    const untrusted = await start({ trusted: parsePeers("10.9.9.9") });
    expect((await untrusted.call("/api/forecast")).status).toBe(503);
    expect(untrusted.services.locate).not.toHaveBeenCalled();
  });

  it("limits each client, including cache hits", async () => {
    const { call } = await start({ forecastLimit: createClientLimiter(2) });
    expect((await call("/api/forecast")).status).toBe(200);
    expect((await call("/api/forecast")).status).toBe(200);
    expect((await call("/api/forecast")).status).toBe(429);
    expect(
      (await call("/api/forecast", { ...browser, "x-real-ip": "1.1.1.1" }))
        .status,
    ).toBe(200);
  });

  it("skips the segment when the city or forecast is unavailable, never using a fixed city", async () => {
    const noCity = await start({ locate: () => null });
    expect((await noCity.call("/api/forecast")).status).toBe(503);
    expect(noCity.services.forecast).not.toHaveBeenCalled();
    const noDatabase = await start({ locate: null });
    expect((await noDatabase.call("/api/forecast")).status).toBe(503);
    const down = await start({ forecast: () => Promise.resolve(null) });
    const response = await down.call("/api/forecast");
    expect(response.status).toBe(503);
    expect(JSON.parse(response.body.toString())).toEqual({ error: "upstream" });
  });

  it("serves radar frames and validated tiles only", async () => {
    const { call, services } = await start();
    expect(
      JSON.parse((await call("/api/radar/frames")).body.toString()),
    ).toEqual({
      frames: [{ id: "1", time: "2026-10-19T18:00:00.000Z" }],
    });
    const tile = await call("/api/radar/tiles/1/3/2/5.png");
    expect(tile.status).toBe(200);
    expect(tile.headers["content-type"]).toBe("image/png");
    expect(tile.headers["cache-control"]).toBe("private, no-store");
    expect((await call("/api/radar/tiles/1/9/0/0.png")).status).toBe(404);
    expect(services.radar.tile).toHaveBeenCalledTimes(1);
  });

  it("answers HEAD, rejects other methods and unknown routes, and counts without identifying anyone", async () => {
    const { call, services } = await start();
    const head = await call("/api/forecast", browser, "HEAD");
    expect(head.status).toBe(200);
    expect(head.body).toHaveLength(0);
    expect((await call("/api/forecast", browser, "POST")).status).toBe(405);
    expect((await call("/api/other")).status).toBe(404);
    expect((await call("/healthz", {})).status).toBe(200);
    const counted = JSON.stringify([...services.counts]);
    expect(counted).not.toContain("8.8.8.8");
    expect(counted).not.toContain("Toronto");
  });
});
