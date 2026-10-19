import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { liveSchema, siteSchema } from "../../src/data/schemas.ts";
import type { Live } from "../../src/data/types.ts";
import { createReaders } from "./providers.ts";
import { collectSnapshot } from "./collect.ts";

const output = process.env.LIVE_PATH ?? "/data/live.json";
const temporary = join(dirname(output), `.live-${randomUUID()}.tmp`);
try {
  const site = siteSchema.parse(
    JSON.parse(
      await readFile(process.env.SITE_PATH ?? "/app/site.json", "utf8"),
    ) as unknown,
  );
  let previous: Live | null = null;
  try {
    const parsed = liveSchema.safeParse(
      JSON.parse(await readFile(output, "utf8")) as unknown,
    );
    if (parsed.success) previous = parsed.data;
  } catch {
    /* Missing or invalid prior data does not prevent a new collection. */
  }
  const snapshot = liveSchema.parse(
    await collectSnapshot(
      previous,
      createReaders(site, process.env, fetch, previous?.github),
      site,
      new Date(),
    ),
  );
  snapshot.fetchedAt = new Date().toISOString();
  await writeFile(temporary, JSON.stringify(snapshot), {
    encoding: "utf8",
    mode: 0o644,
    flag: "wx",
  });
  await rename(temporary, output);
  console.log(
    JSON.stringify({
      event: "snapshot_written",
      failedSources: snapshot.errors ?? [],
    }),
  );
} catch {
  await unlink(temporary).catch(() => undefined);
  console.error("snapshot_write_failed");
  process.exitCode = 1;
}
