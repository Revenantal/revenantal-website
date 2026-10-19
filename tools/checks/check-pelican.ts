import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import type { Socket } from "node:net";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { liveSchema, siteSchema } from "../../src/data/schemas.ts";
import { filterFreshData } from "../../src/data/freshness.ts";
const run = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), "rv-pelican-smoke-"));
assert(resolve(root).startsWith(resolve(tmpdir()) + requireSeparator()));
const sockets = new Set<Socket>();
const server = createServer((socket) => {
  sockets.add(socket);
  socket.once("close", () => sockets.delete(socket));
  socket.once("data", () => {
    const json = Buffer.from(
      JSON.stringify({
        version: { name: "Fixture", protocol: 47 },
        players: {
          max: 20,
          online: 4,
          sample: [
            { name: "fixture-private-player", id: "fixture-private-id" },
          ],
        },
        description: { text: "Fixture" },
      }),
    );
    const payload = Buffer.concat([
      Buffer.from([0]),
      varint(json.length),
      json,
    ]);
    socket.write(Buffer.concat([varint(payload.length), payload]));
  });
});
try {
  await cp(resolve(".cache/live"), join(root, "runtime"), {
    recursive: true,
  });
  await cp(resolve("jobs/live/pelican/__fixtures__"), join(root, "fixtures"), {
    recursive: true,
  });
  await writeFile(
    join(root, "mock-panel.mjs"),
    `import {readFile} from "node:fs/promises";
 globalThis.fetch=async(url,options)=>{if(new URL(url).hostname==="example.invalid"&&(options.credentials!=="omit"||options.redirect!=="error"||options.headers.Authorization!=="Bearer fixture-key"))throw new Error("Wrong authentication");const u=new URL(url);if(u.hostname!=="example.invalid")return new Response("[]",{headers:{"Content-Type":"application/json"}});const file=u.pathname.endsWith("/resources")?"resources-beta38.json":"servers-beta38.json";return new Response(await readFile(new URL("./fixtures/"+file,import.meta.url),"utf8"),{headers:{"Content-Type":"application/json"}});};`,
  );
  const output = join(root, "live.json");
  await run(
    process.execPath,
    [
      "--import",
      pathToFileURL(join(root, "mock-panel.mjs")).href,
      join(root, "runtime/main.mjs"),
      "--once",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_OPTIONS: "",
        NODE_PATH: "",
        PELICAN_URL: "https://example.invalid",
        PELICAN_KEY: "fixture-key",
        SITE_PATH: resolve(".cache/live/site.json"),
        LIVE_PATH: output,
        PELICAN_STATE_PATH: join(root, "pelican-state.json"),
        GAME_QUERY_HOST: "",
        STEAM_KEY: "",
        STEAM_ID: "",
        GITHUB_TOKEN: "",
      },
      timeout: 15000,
      windowsHide: true,
    },
  );
  const snapshot = liveSchema.parse(
    JSON.parse(await readFile(output, "utf8")) as unknown,
  );
  assert.equal(snapshot.servers?.length, 1);
  assert.equal(snapshot.servers[0]?.state, "running");
  assert.equal(snapshot.servers[0].uptimeSec, 298546.289);
  assert.doesNotMatch(
    JSON.stringify(snapshot),
    /fixture-private-command|sftp_details|variables|invocation/,
  );
  const site = siteSchema.parse(
    JSON.parse(await readFile(".cache/live/site.json", "utf8")) as unknown,
  );
  const now = new Date();
  const live = snapshot;
  const view = filterFreshData(site, live, now);
  assert.equal(view.servers[0]?.state, "running");
  assert.equal(view.freshness.servers.state, "fresh");
  assert.equal(
    filterFreshData(
      site,
      live,
      new Date(Date.parse(snapshot.fetchedAt) + 15 * 60000),
    ).servers[0]?.state,
    "unknown",
  );
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert(address && typeof address !== "string");
  const child = execFile(
    process.execPath,
    [join(root, "runtime/query-worker.mjs")],
    {
      cwd: root,
      env: { ...process.env, NODE_OPTIONS: "", NODE_PATH: "" },
      timeout: 7000,
      windowsHide: true,
      maxBuffer: 16384,
    },
  );
  const completed = new Promise<string>((done, reject) => {
    let output = "";
    let diagnostic = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      diagnostic += chunk.toString("utf8");
    });
    child.stdout?.on("data", (chunk) => {
      output += String(chunk);
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) done(output);
      else
        reject(
          new Error(
            "Bundled query worker failed: " + String(code) + diagnostic,
          ),
        );
    });
  });
  child.stdin?.end(
    JSON.stringify({
      host: "127.0.0.1",
      port: address.port,
      type: "minecraftvanilla",
    }),
  );
  const query = await completed;
  assert.equal((JSON.parse(query) as { numplayers: number }).numplayers, 4);
  assert.doesNotMatch(query, /fixture-private|players":\[/);
  console.log(
    "Pelican checks passed: standalone scheduled live job → API fixture → live.json → freshness view, exact expiry and real game query without player identities.",
  );
} finally {
  for (const socket of sockets) socket.destroy();
  if (server.listening)
    await new Promise<void>((done, reject) =>
      server.close((error) => {
        if (error) reject(error);
        else done();
      }),
    );
  await rm(root, { recursive: true, force: true });
}
function varint(value: number): Buffer {
  const bytes: number[] = [];
  do {
    let byte = value & 127;
    value >>>= 7;
    if (value) byte |= 128;
    bytes.push(byte);
  } while (value);
  return Buffer.from(bytes);
}
function requireSeparator(): string {
  return process.platform === "win32" ? "\\" : "/";
}
