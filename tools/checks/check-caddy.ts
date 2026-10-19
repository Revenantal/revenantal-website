import { spawn, execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createSiteFixture, verifySite, waitForSite } from "./site-smoke.ts";

const binary = process.env.CADDY_BIN;
if (!binary)
  throw new Error(
    "Set CADDY_BIN to a locally installed official Caddy executable.",
  );
await mkdir(resolve(".cache"), { recursive: true });
const root = await mkdtemp(resolve(".cache/caddy-smoke-"));
const { site, runtime } = await createSiteFixture(root);
const port = process.env.SMOKE_PORT ?? "18943";
if (!/^\d{4,5}$/.test(port))
  throw new Error("SMOKE_PORT must be a local test port.");
const env = {
  ...process.env,
  SITE_ROOT: site.replaceAll("\\", "/"),
  LIVE_ROOT: runtime.replaceAll("\\", "/"),
  PORT: port,
};
execFileSync(
  binary,
  ["validate", "--config", "deploy/Caddyfile", "--adapter", "caddyfile"],
  { env, stdio: "pipe" },
);
const server = spawn(
  binary,
  ["run", "--config", "deploy/Caddyfile", "--adapter", "caddyfile"],
  { env, stdio: "pipe", windowsHide: true },
);
const base = `http://127.0.0.1:${port}`;

try {
  await waitForSite(base);
  for (const marker of ["a1b2c3d4", "e5f6a7b8", "a1b2c3d4"]) {
    await writeFile(
      join(site, "index.html"),
      `<!doctype html><title>smoke</title>${marker}`,
    );
    await writeFile(join(site, "assets", `smoke-${marker}.js`), marker);
    await verifySite(base, runtime, marker);
  }
  console.log(
    "Caddy checks passed: two site versions and rollback, stable runtime snapshots, atomic replacement, missing-file 404, cache headers and disabled weather.",
  );
} finally {
  const stopped = new Promise((done) => server.once("exit", done));
  server.kill();
  await stopped;
}
