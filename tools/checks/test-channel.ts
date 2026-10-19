import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// Runs one channel's own test suite: pnpm test:channel <id> [vitest options]
const [id, ...options] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Usage: pnpm test:channel <channel-id> [vitest options]");
  process.exit(2);
}
const folder = `src/channels/${id}/`;
if (!existsSync(folder)) {
  console.error(`No channel folder at ${folder}`);
  process.exit(2);
}
const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", folder, ...options],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status ?? 1);
