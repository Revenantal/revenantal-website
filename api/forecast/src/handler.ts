import type { IncomingMessage, ServerResponse } from "node:http";
import type { BlockList } from "node:net";
import { clientAddress } from "./client-address.ts";
import type { ForecastSource } from "./forecast.ts";
import type { ClientLimiter } from "./limits.ts";
import type { Locator } from "./locate.ts";
import { parseTilePath } from "./radar.ts";
import type { RadarSource } from "./radar.ts";

/** Everything the handler needs; tests pass fakes. */
export type Services = {
  trusted: BlockList;
  locate: Locator | null;
  forecast: ForecastSource;
  radar: RadarSource;
  forecastLimit: ClientLimiter;
  radarLimit: ClientLimiter;
  /** Aggregate outcome counts by route and bounded code; never addresses or places. */
  counts: Map<string, number>;
};

type Route = "forecast" | "frames" | "tile";

const COMMON_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function routeOf(path: string): Route | null {
  if (path === "/api/forecast") return "forecast";
  if (path === "/api/radar/frames") return "frames";
  if (path.startsWith("/api/radar/tiles/")) return "tile";
  return null;
}

/**
 * True for a same-origin browser request: Sec-Fetch-Site is "same-origin", and any Origin
 * header names this host. There is no CORS.
 *
 * @param request - The incoming request.
 * @returns Whether the request may proceed.
 */
export function sameOrigin(request: IncomingMessage): boolean {
  if (request.headers["sec-fetch-site"] !== "same-origin") return false;
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

/**
 * True when the visitor asked for less tracking or data: DNT: 1 or Save-Data: on.
 *
 * @param request - The incoming request.
 * @returns Whether to skip weather entirely, before any lookup.
 */
export function optedOut(request: IncomingMessage): boolean {
  const saveData = request.headers["save-data"];
  return (
    request.headers.dnt === "1" ||
    (typeof saveData === "string" && saveData.toLowerCase() === "on")
  );
}

/**
 * Creates the request handler for /api/forecast, /api/radar/frames and
 * /api/radar/tiles/<frame>/<z>/<x>/<y>.png. Every response is private and no-store, nothing
 * is logged, and failures give a bounded error code so the TV Guide skips the segment.
 *
 * @param services - Lookup, sources, limits and counters.
 * @returns The Node request handler.
 */
export function createHandler(services: Services) {
  const count = (key: string) => {
    services.counts.set(key, (services.counts.get(key) ?? 0) + 1);
  };

  return async (request: IncomingMessage, response: ServerResponse) => {
    const send = (
      status: number,
      body: string | Uint8Array | null,
      type = "application/json",
    ) => {
      response.writeHead(status, {
        ...COMMON_HEADERS,
        ...(body === null ? {} : { "Content-Type": type }),
      });
      response.end(request.method === "HEAD" ? undefined : (body ?? undefined));
    };
    const fail = (status: number, code: string, route: string) => {
      count(`${route}:${code}`);
      send(status, JSON.stringify({ error: code }));
    };

    const path = new URL(request.url ?? "/", "http://service").pathname;
    if (path === "/healthz") {
      send(200, "ok", "text/plain");
      return;
    }
    const route = routeOf(path);
    if (!route) {
      fail(404, "not_found", "other");
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      fail(405, "method", route);
      return;
    }
    if (!sameOrigin(request)) {
      fail(403, "cross_origin", route);
      return;
    }
    if (optedOut(request)) {
      count(`${route}:opted_out`);
      send(204, null);
      return;
    }
    const tile = route === "tile" ? parseTilePath(path) : null;
    if (route === "tile" && !tile) {
      fail(404, "bad_tile", route);
      return;
    }
    const address = clientAddress(
      request.socket.remoteAddress,
      request.headers["x-real-ip"],
      services.trusted,
    );
    if (!address) {
      fail(503, "unavailable", route);
      return;
    }
    const limiter =
      route === "forecast" ? services.forecastLimit : services.radarLimit;
    if (!limiter.take(address)) {
      fail(429, "rate_limited", route);
      return;
    }

    if (route === "forecast") {
      const place = services.locate?.(address) ?? null;
      if (!place) {
        fail(503, "unavailable", route);
        return;
      }
      const forecast = await services.forecast(place);
      if (!forecast) {
        fail(503, "upstream", route);
        return;
      }
      count("forecast:ok");
      send(200, JSON.stringify(forecast));
      return;
    }
    if (route === "frames") {
      const frames = await services.radar.frames();
      if (!frames) {
        fail(503, "upstream", route);
        return;
      }
      count("frames:ok");
      send(200, JSON.stringify(frames));
      return;
    }
    if (!tile) return;
    const bytes = await services.radar.tile(tile);
    if (!bytes) {
      fail(404, "no_tile", route);
      return;
    }
    count("tile:ok");
    send(200, bytes, "image/png");
  };
}
