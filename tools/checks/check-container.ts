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
      "--rm",
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
    const binding = docker(["port", id, "8080/tcp"]);
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
    docker(["stop", id]);
    containers.pop();
  }
  console.log(
    "Container checks passed: image updates/rollback preserve live data, writes are denied, runtime routes/cache headers are correct.",
  );
} finally {
  for (const id of containers)
    spawnSync("docker", ["stop", id], { stdio: "ignore" });
  for (const image of images)
    spawnSync("docker", ["image", "rm", image], { stdio: "ignore" });
}
