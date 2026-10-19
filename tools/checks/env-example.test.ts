import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const jobFiles = (folder: string): string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return jobFiles(path);
    return /(?<!\.test)\.ts$/.test(entry.name) ? [path] : [];
  });

// Process plumbing passed to the query worker, not operator settings.
const system = new Set(["PATH", "SystemRoot", "TEMP", "TMP"]);

describe("live-job environment example", () => {
  it("lists every variable the job reads", () => {
    const used = new Set(
      jobFiles("jobs/live").flatMap((file) =>
        [...readFileSync(file, "utf8").matchAll(/env\.([A-Z][A-Za-z_]*)/g)]
          .map((match) => match[1] ?? "")
          .filter((name) => !system.has(name)),
      ),
    );
    const listed = new Set(
      [
        ...readFileSync("deploy/.env.live.example", "utf8").matchAll(
          /^#?\s*([A-Z][A-Z0-9_]*)=/gm,
        ),
      ].map((match) => match[1]),
    );

    expect(used.size).toBeGreaterThan(0);
    expect([...used].filter((name) => !listed.has(name))).toEqual([]);
  });
});
