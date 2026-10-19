import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

// Downloads the monthly DB-IP Lite city database (CC BY 4.0) for the weather service image:
// this month's release, or last month's if this month's is not out yet. Run before building
// the forecast image; the file stays in the ignored .cache/forecast folder.
const target = resolve(".cache/forecast/dbip-city-lite.mmdb");
await mkdir(resolve(".cache/forecast"), { recursive: true });

const month = (offset: number) => {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - offset);
  return date.toISOString().slice(0, 7);
};

for (const release of [month(0), month(1)]) {
  const url = `https://download.db-ip.com/free/dbip-city-lite-${release}.mmdb.gz`;
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    continue;
  }
  const partial = `${target}.partial`;
  try {
    await pipeline(
      Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>),
      createGunzip(),
      createWriteStream(partial),
    );
    await rename(partial, target);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
  console.log(`DB-IP Lite city database ${release} saved.`);
  process.exit(0);
}
console.error("No DB-IP Lite city release was available.");
process.exitCode = 1;
