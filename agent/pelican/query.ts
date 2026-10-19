import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { queryResultSchema } from "./schemas.ts";
import type { QueryResult } from "./schemas.ts";
/**
 * Runs GameDig in an isolated child so timeouts close all sockets and raw players stay private.
 * @param target - Validated query routing for a discovered server.
 * @param target.host - Private LAN query host.
 * @param target.port - Exact query port.
 * @param target.type - Allowed local protocol.
 * @returns Only sanitized counters, ping and password-presence; null on failure.
 */
export function queryGame(target: {
  host: string;
  port: number;
  type: string;
}): Promise<QueryResult | null> {
  const worker = fileURLToPath(
    new URL(
      import.meta.url.endsWith(".ts")
        ? "./query-worker.ts"
        : "./query-worker.mjs",
      import.meta.url,
    ),
  );
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [worker], {
      stdio: ["pipe", "pipe", "ignore"],
      windowsHide: true,
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
      },
    });
    let output = "";
    let failed = false;
    const timer = setTimeout(() => {
      failed = true;
      child.kill("SIGKILL");
    }, 6000);
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
      if (output.length > 16384) {
        failed = true;
        child.kill("SIGKILL");
      }
    });
    child.stdin.on("error", () => undefined);
    child.on("error", () => {
      failed = true;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (failed || code !== 0) {
        resolve(null);
        return;
      }
      try {
        resolve(queryResultSchema.parse(JSON.parse(output) as unknown));
      } catch {
        resolve(null);
      }
    });
    child.stdin.end(JSON.stringify(target));
  });
}
