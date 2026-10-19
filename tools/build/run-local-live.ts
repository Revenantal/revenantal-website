import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContent } from "../content/read-content.ts";

const directory = resolve(".cache/live-preview");
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, "site.json"),
  JSON.stringify(await readContent(process.cwd())),
);
const result = spawnSync(process.execPath, ["jobs/live/main.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    SITE_PATH: resolve(directory, "site.json"),
    LIVE_PATH: resolve(directory, "live.json"),
    SERVERS_PATH: resolve(directory, "servers.json"),
  },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
