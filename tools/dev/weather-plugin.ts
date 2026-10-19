import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { request } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const PORT = 8091;
const FORWARDED = ["host", "origin", "sec-fetch-site", "dnt", "save-data"];

/**
 * Development only: runs the private forecast service and proxies the weather routes to it,
 * the way the production Caddy does. Locally every request comes from a private address,
 * which the service refuses, so the proxy names the public address in FORECAST_DEV_IP
 * (set it in the git-ignored .env.local). Without that setting, or without the city
 * database from `pnpm fetch:dbip`, weather stays unavailable.
 *
 * @param visitorAddress - The public address to look up, from FORECAST_DEV_IP.
 * @returns The Vite plugin.
 */
export function weatherPlugin(visitorAddress: string | undefined): Plugin {
  const database = resolve(".cache/forecast/dbip-city-lite.mmdb");
  let service: ChildProcess | undefined;
  return {
    name: "revenantal-dev-weather",
    apply: "serve",
    configureServer(server) {
      if (!visitorAddress || !existsSync(database)) return;
      service = spawn(process.execPath, ["api/forecast/main.ts"], {
        stdio: "ignore",
        env: {
          ...process.env,
          PORT: String(PORT),
          TRUSTED_PEERS: "127.0.0.1,::1",
          DBIP_PATH: database,
        },
      });
      server.httpServer?.once("close", () => service?.kill());
      server.middlewares.use((incoming, outgoing, next) => {
        const path = incoming.url ?? "";
        if (!/^\/api\/(forecast|radar)(\/|\?|$)/.test(path)) {
          next();
          return;
        }
        const headers: Record<string, string> = { "x-real-ip": visitorAddress };
        for (const name of FORWARDED) {
          const value = incoming.headers[name];
          if (typeof value === "string") headers[name] = value;
        }
        const proxied = request(
          {
            host: "127.0.0.1",
            port: PORT,
            path,
            method: incoming.method,
            headers,
          },
          (answer) => {
            outgoing.writeHead(answer.statusCode ?? 502, answer.headers);
            answer.pipe(outgoing);
          },
        );
        proxied.on("error", () => {
          outgoing.writeHead(503, {
            "Content-Type": "application/json",
            "Cache-Control": "private, no-store",
          });
          outgoing.end(JSON.stringify({ error: "weather_unavailable" }));
        });
        proxied.end();
      });
    },
  };
}
