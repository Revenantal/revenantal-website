import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createSiteFixture, verifySite, waitForSite } from "./site-smoke.ts";

const docker = (args: string[]) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
docker(["info"]);
await mkdir(resolve(".cache"), { recursive: true });
const root = await mkdtemp(resolve(".cache/container-smoke-"));
const { runtime } = await createSiteFixture(root);
const prefix = `revenantal-smoke-${String(Date.now())}`;
const images: string[] = [];
const containers: string[] = [];

try {
  for (const marker of ["a1b2c3d4", "e5f6a7b8"]) {
    const context = join(root, marker);
    await mkdir(join(context, "deploy"), { recursive: true });
    await cp("dist", join(context, "dist"), { recursive: true });
    await cp("Dockerfile", join(context, "Dockerfile"));
    await cp("deploy/Caddyfile", join(context, "deploy/Caddyfile"));
    await writeFile(
      join(context, "dist", "index.html"),
      `<!doctype html><title>smoke</title>${marker}`,
    );
    await writeFile(
      join(context, "dist", "assets", `smoke-${marker}.js`),
      marker,
    );
    const image = `${prefix}:${marker}`;
    images.push(image);
    docker(["build", "--tag", image, context]);
  }

  for (const marker of ["a1b2c3d4", "e5f6a7b8", "a1b2c3d4"]) {
    const id = docker([
      "run",
      "--detach",
      "--read-only",
      "--tmpfs",
      "/tmp",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--publish",
      "127.0.0.1::8080",
      "--mount",
      `type=bind,source=${runtime},target=/srv/revenantal-live,readonly`,
      `${prefix}:${marker}`,
    ]);
    containers.push(id);
    let binding: string;
    try {
      binding = docker(["port", id, "8080/tcp"]);
    } catch (error) {
      const logs = spawnSync("docker", ["logs", id], { encoding: "utf8" });
      console.error(logs.stdout, logs.stderr);
      throw error;
    }
    const port = /127\.0\.0\.1:(\d+)/.exec(binding)?.[1];
    assert(port, "Container must expose only a loopback test port.");
    const base = `http://127.0.0.1:${port}`;
    await waitForSite(base);
    await verifySite(base, runtime, marker);
    assert.equal(docker(["exec", id, "id", "-u"]), "10001");
    for (const target of [
      "/srv/revenantal-live/forbidden",
      "/srv/site/forbidden",
    ]) {
      const attempt = spawnSync("docker", ["exec", id, "touch", target], {
        encoding: "utf8",
      });
      assert.notEqual(attempt.status, 0, `Container must not write ${target}`);
    }
    docker(["rm", "--force", id]);
    containers.pop();
  }
  // The weather service image, built without the city database: it must start locked down
  // and fail closed, answering every forecast as unavailable with private, no-store headers.
  const forecastContext = join(root, "forecast");
  await mkdir(join(forecastContext, ".cache", "forecast"), { recursive: true });
  await mkdir(join(forecastContext, "api", "forecast"), { recursive: true });
  await cp(
    ".cache/forecast/main.mjs",
    join(forecastContext, ".cache", "forecast", "main.mjs"),
  );
  await cp(
    "api/forecast/Dockerfile",
    join(forecastContext, "api", "forecast", "Dockerfile"),
  );
  const forecastImage = `${prefix}:forecast`;
  images.push(forecastImage);
  docker([
    "build",
    "--tag",
    forecastImage,
    "--file",
    join(forecastContext, "api", "forecast", "Dockerfile"),
    forecastContext,
  ]);
  const forecastId = docker([
    "run",
    "--detach",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--publish",
    "127.0.0.1::8090",
    forecastImage,
  ]);
  containers.push(forecastId);
  const forecastPort = /127\.0\.0\.1:(\d+)/.exec(
    docker(["port", forecastId, "8090/tcp"]),
  )?.[1];
  assert(
    forecastPort,
    "The forecast container must expose only a loopback test port.",
  );
  const forecastBase = `http://127.0.0.1:${forecastPort}`;
  let health: Response | undefined;
  for (let attempt = 0; attempt < 50 && !health?.ok; attempt += 1) {
    health = await fetch(`${forecastBase}/healthz`).catch(() => undefined);
    if (!health?.ok) await new Promise((done) => setTimeout(done, 200));
  }
  assert(health?.ok, "The forecast service must start.");
  const forecast = await fetch(`${forecastBase}/api/forecast`, {
    headers: { "Sec-Fetch-Site": "same-origin", "X-Real-IP": "8.8.8.8" },
  });
  assert.equal(forecast.status, 503);
  assert.equal(forecast.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await forecast.json(), { error: "unavailable" });
  assert.equal(docker(["exec", forecastId, "id", "-u"]), "10001");
  const forecastLogs = spawnSync("docker", ["logs", forecastId], {
    encoding: "utf8",
  });
  assert.doesNotMatch(forecastLogs.stdout + forecastLogs.stderr, /8\.8\.8\.8/);
  docker(["rm", "--force", forecastId]);
  containers.pop();

  console.log(
    "Container checks passed: image updates/rollback preserve live data, writes are denied, runtime routes/cache headers are correct, and the weather service starts locked down and fails closed.",
  );
} finally {
  for (const id of containers)
    spawnSync("docker", ["rm", "--force", id], { stdio: "ignore" });
  for (const image of images)
    spawnSync("docker", ["image", "rm", image], { stdio: "ignore" });
}
