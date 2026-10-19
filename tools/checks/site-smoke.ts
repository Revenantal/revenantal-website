import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * Exercises static routes and atomic snapshots against an isolated test server.
 *
 * @param base - Base URL of the test server.
 * @param runtime - Writable host-side runtime fixture directory.
 * @param marker - Expected build marker in the fixture HTML.
 * @returns A promise that resolves after all HTTP assertions pass.
 */
export async function verifySite(
  base: string,
  runtime: string,
  marker: string,
) {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), new RegExp(marker));
  assert.equal(page.headers.get("cache-control"), "no-cache");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("server"), null);

  const asset = await fetch(`${base}/assets/smoke-${marker}.js`);
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), marker);
  assert.match(asset.headers.get("cache-control") ?? "", /immutable/);

  for (const route of [
    "/missing",
    "/assets/missing.js",
    "/servers.json",
    "/pelican-state.json",
    "/live.json.tmp",
    "/input/servers/servers.json",
    "/.env",
  ]) {
    assert.equal((await fetch(base + route)).status, 404, route);
  }

  const weather = await fetch(`${base}/api/forecast`);
  assert.equal(weather.status, 503);
  assert.equal(weather.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await weather.json(), { error: "weather_unavailable" });

  const snapshot = await fetch(`${base}/live.json`);
  assert.equal(snapshot.status, 200);
  assert.match(snapshot.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(snapshot.headers.get("cache-control"), "max-age=60");
  assert.deepEqual(
    await snapshot.json(),
    JSON.parse(await readFile(join(runtime, "live.json"), "utf8")),
  );

  await writeFile(join(runtime, "live.json.tmp"), '{"version":2}');
  await rename(join(runtime, "live.json.tmp"), join(runtime, "live.json"));
  assert.deepEqual(await (await fetch(`${base}/live.json`)).json(), {
    version: 2,
  });

  await unlink(join(runtime, "live.json"));
  assert.equal((await fetch(`${base}/live.json`)).status, 404);
  await writeFile(join(runtime, "live.json"), '{"version":2}');
}

/**
 * Creates small isolated build/runtime fixtures for deployment routing checks.
 *
 * @param root - An isolated workspace cache directory.
 * @returns Paths to the fixture site and runtime directories.
 */
export async function createSiteFixture(root: string) {
  const site = join(root, "site");
  const runtime = join(root, "runtime");
  await mkdir(join(site, "assets"), { recursive: true });
  await mkdir(runtime, { recursive: true });
  await writeFile(join(runtime, "live.json"), '{"version":1}');
  await writeFile(join(runtime, "servers.json"), '{"private":true}');
  await writeFile(join(runtime, "pelican-state.json"), '{"private":true}');
  return { site, runtime };
}

/**
 * Waits for a locally launched test server to report healthy.
 *
 * @param base - Base URL of the isolated test server.
 * @returns A promise that resolves once healthy, or rejects after ten seconds.
 */
export async function waitForSite(base: string) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      if (
        (await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(500) }))
          .ok
      )
        return;
    } catch {
      // Startup connection failures are expected until the test server is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("The deployment test server did not become healthy.");
}
