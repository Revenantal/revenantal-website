import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { counterStateSchema } from "./schemas.ts";
import type { CounterSample } from "./mapping.ts";
/**
 * Loads only private counter baselines; missing or invalid state starts with no rates.
 * @param file - Dedicated private runtime state path, or null when disabled in tests.
 * @returns Validated numeric baselines without raw panel content.
 */
export async function readCounters(
  file: string | null,
): Promise<Map<string, CounterSample>> {
  if (!file) return new Map();
  try {
    return new Map(
      Object.entries(
        counterStateSchema.parse(
          JSON.parse(await readFile(file, "utf8")) as unknown,
        ),
      ),
    );
  } catch {
    return new Map();
  }
}
/**
 * Atomically saves private numeric baselines for the next ten-minute execution.
 * @param file - Private state file, never served by Caddy; null disables persistence.
 * @param counters - Only the current successful running-server observations.
 * @returns Completion after atomic replacement.
 */
export async function writeCounters(
  file: string | null,
  counters: Map<string, CounterSample>,
): Promise<void> {
  if (!file) return;
  const data = counterStateSchema.parse(Object.fromEntries(counters));
  const temp = join(dirname(file), ".pelican-" + randomUUID() + ".tmp");
  try {
    await writeFile(temp, JSON.stringify(data), { flag: "wx", mode: 0o600 });
    await rename(temp, file);
  } finally {
    await unlink(temp).catch(() => undefined);
  }
}
