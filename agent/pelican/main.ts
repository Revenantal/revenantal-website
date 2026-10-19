import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { siteSchema } from "../../src/data/schemas.ts";
import { createPanelClient } from "./client.ts";
import { collectServers } from "./collect.ts";
import type { CounterSample } from "./mapping.ts";
import { identifyGame } from "./mapping.ts";
import { queryTargetsSchema } from "./schemas.ts";
import { queryGame } from "./query.ts";
import { writeSnapshot, pushSnapshot } from "./output.ts";
const controller = new AbortController();
const stopped = () => controller.signal.aborted;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    controller.abort();
  });
try {
  const client = createPanelClient(
    process.env.PELICAN_URL ?? "",
    process.env.PELICAN_KEY ?? "",
  );
  const site = siteSchema.parse(
    JSON.parse(
      await readFile(process.env.SITE_PATH ?? "/app/site.json", "utf8"),
    ) as unknown,
  );
  const targets = process.env.QUERY_TARGETS_PATH
    ? queryTargetsSchema.parse(
        JSON.parse(
          await readFile(process.env.QUERY_TARGETS_PATH, "utf8"),
        ) as unknown,
      )
    : {};
  const once = process.argv.includes("--once");
  const list = process.argv.includes("--list");
  const upload = process.env.PUSH_ENABLED === "true";
  if (list) {
    const servers = await client.list();
    console.log(
      JSON.stringify(
        servers.map((item) => ({
          id: item.identifier,
          name: item.name,
          ...identifyGame(item),
        })),
      ),
    );
  } else {
    let previous = new Map<string, CounterSample>();
    const output = process.env.SERVERS_OUTPUT ?? "/data/servers.json";
    while (!stopped()) {
      try {
        const result = await collectServers(
          client,
          site.servers,
          targets,
          previous,
          new Date(),
          queryGame,
        );
        await writeSnapshot(output, result.snapshot);
        previous = result.counters;
        if (upload) await pushSnapshot(output, process.env.COOLIFY_HOST ?? "");
        console.log(
          JSON.stringify({
            event: "servers_written",
            count: result.snapshot.servers.length,
            unavailable: result.unavailable,
            pushed: upload,
          }),
        );
      } catch {
        previous.clear();
        console.error("server_collection_or_upload_failed");
        if (once) process.exitCode = 1;
      }
      if (once || stopped()) break;
      await sleep(120000, undefined, { signal: controller.signal }).catch(
        () => undefined,
      );
    }
  }
} catch {
  console.error("agent_configuration_failed");
  process.exitCode = 1;
}
