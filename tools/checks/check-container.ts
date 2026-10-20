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
let composeArgs: string[] = [];

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

  // The Coolify compose file end to end, with these images standing in for the published
  // ones: the scheduled job writes live.json into the shared volume, the site serves it, and
  // the site reaches weather over the private network as its one trusted peer.
  const liveContext = join(root, "live");
  await mkdir(join(liveContext, ".cache"), { recursive: true });
  await cp(".cache/live", join(liveContext, ".cache", "live"), {
    recursive: true,
  });
  await cp("jobs/live/Dockerfile", join(liveContext, "Dockerfile"));
  const tag = `smoke-${String(Date.now())}`;
  const published = (name: string) =>
    `ghcr.io/revenantal/revenantal-${name}:${tag}`;
  images.push(published("live"), published("site"), published("forecast"));
  docker(["build", "--tag", published("live"), liveContext]);
  docker(["tag", `${prefix}:a1b2c3d4`, published("site")]);
  docker(["tag", forecastImage, published("forecast")]);
  const override = join(root, "compose.test.yml");
  await writeFile(
    override,
    'services:\n  site:\n    ports: ["127.0.0.1::8080"]\n',
  );
  Object.assign(process.env, {
    SITE_TAG: tag,
    PELICAN_URL: "https://panel.example.invalid",
    PELICAN_KEY: "smoke",
    FORECAST_UPSTREAM: "forecast:8090",
    // Test only: the Docker gateway stands in for Coolify's proxy, so the forwarded public
    // address reaches weather as the visitor's.
    TRUSTED_EDGE: "private_ranges",
  });
  composeArgs = [
    "compose",
    "--project-name",
    `${prefix}-compose`,
    "--file",
    "deploy/coolify.compose.yml",
    "--file",
    override,
  ];
  const compose = (args: string[]) => docker([...composeArgs, ...args]);
  compose(["up", "--detach", "--pull", "never", "--wait"]);
  // What the Coolify Scheduled Task runs. Providers are unreachable here; the job still
  // writes a snapshot with each source marked unavailable.
  spawnSync(
    "docker",
    [...composeArgs, "exec", "-T", "live", "node", "/app/main.mjs"],
    { encoding: "utf8", timeout: 120_000 },
  );
  const sitePort = /127\.0\.0\.1:(\d+)/.exec(
    compose(["port", "site", "8080"]),
  )?.[1];
  assert(sitePort, "The compose site must publish a loopback test port.");
  const siteBase = `http://127.0.0.1:${sitePort}`;
  const snapshot = await fetch(`${siteBase}/live.json`);
  assert.equal(
    snapshot.status,
    200,
    "The site must serve the job's live.json.",
  );
  assert.equal(typeof ((await snapshot.json()) as object), "object");
  // Weather allows 10 forecasts a minute per visitor, and only a trusted peer's visitor
  // reaches that limit: the 11th answer through the site proves it trusts the site by name.
  const statuses: number[] = [];
  for (let request = 0; request < 11; request += 1) {
    const answer = await fetch(`${siteBase}/api/forecast`, {
      headers: {
        "Sec-Fetch-Site": "same-origin",
        "X-Forwarded-For": "8.8.8.8",
      },
    });
    statuses.push(answer.status);
  }
  assert.equal(statuses.at(-1), 429, `Weather answers: ${statuses.join(",")}`);
  // Any other container on the network can connect but is never trusted: 11 requests that
  // name a visitor all stay unavailable and never reach the limit.
  const other = spawnSync(
    "docker",
    [
      ...composeArgs,
      "exec",
      "-T",
      "live",
      "node",
      "-e",
      "(async () => { const codes = []; for (let i = 0; i < 11; i += 1) codes.push((await fetch('http://forecast:8090/api/forecast', { headers: { 'Sec-Fetch-Site': 'same-origin', 'X-Real-IP': '1.1.1.1' } })).status); console.log(codes.join(',')); })()",
    ],
    { encoding: "utf8" },
  );
  assert.equal(
    other.stdout.trim(),
    Array.from({ length: 11 }, () => "503").join(","),
    `Only the site may name a visitor to weather: ${other.stdout}${other.stderr}`,
  );
  assert.doesNotMatch(compose(["logs", "forecast"]), /8\.8\.8\.8/);

  console.log(
    "Container checks passed: image updates/rollback preserve live data, writes are denied, runtime routes/cache headers are correct, the weather service starts locked down and fails closed, and the Coolify compose shares live.json and lets only the site name a visitor to weather.",
  );
} finally {
  if (composeArgs.length > 0)
    spawnSync("docker", [...composeArgs, "down", "--volumes"], {
      stdio: "ignore",
    });
  for (const id of containers)
    spawnSync("docker", ["rm", "--force", id], { stdio: "ignore" });
  for (const image of images)
    spawnSync("docker", ["image", "rm", image], { stdio: "ignore" });
}
