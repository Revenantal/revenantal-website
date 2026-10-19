import { readFile } from "node:fs/promises";
import { liveSchema } from "../../src/data/schemas.ts";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { publicSite, readContent } from "./read-content.ts";
import type { Site } from "../../src/data/types.ts";

/**
 * Emits validated content for builds and serves the same payload during development.
 *
 * @returns A Vite plugin with a single shared site.json boundary.
 */
export function contentPlugin(): Plugin {
  let root = process.cwd();
  let site: Site | undefined;
  return {
    name: "revenantal-content",
    configResolved(config) {
      root = config.root;
    },
    async buildStart() {
      site = await readContent(root);
    },
    generateBundle() {
      if (!site) throw new Error("Shared content was not built.");
      this.emitFile({
        type: "asset",
        fileName: "site.json",
        source: JSON.stringify(publicSite(site)),
      });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const route = request.url?.split("?")[0];
        if (route !== "/site.json" && route !== "/live.json") {
          next();
          return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.statusCode = 405;
          response.end();
          return;
        }
        const content =
          route === "/live.json"
            ? readFile(
                resolve(root, ".cache/live-preview/live.json"),
                "utf8",
              ).then((text) => liveSchema.parse(JSON.parse(text) as unknown))
            : readContent(resolve(root)).then(publicSite);
        void content
          .then((content) => {
            response.setHeader("Content-Type", "application/json");
            response.setHeader(
              "Cache-Control",
              route === "/live.json" ? "max-age=60" : "no-cache",
            );
            response.end(
              request.method === "HEAD" ? undefined : JSON.stringify(content),
            );
          })
          .catch(() => {
            response.statusCode = route === "/live.json" ? 404 : 500;
            response.setHeader("Content-Type", "application/json");
            response.end('{"error":"site_unavailable"}');
          });
      });
    },
  };
}
