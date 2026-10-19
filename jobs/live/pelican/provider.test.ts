import { describe, expect, it, vi } from "vitest";
import listing from "./__fixtures__/servers-beta38.json";
import resources from "./__fixtures__/resources-beta38.json";
import type { Site } from "../../../src/data/types.ts";
import { createReaders } from "../providers.ts";
import { collectSnapshot } from "../collect.ts";
const query = vi.hoisted(() => vi.fn());
vi.mock("./query.ts", () => ({ queryGame: query }));
const site: Site = {
  projects: [],
  buttons: [],
  servers: [],
  links: {
    steam: "https://example.invalid",
    github: "https://example.invalid",
    discord: "fixture",
  },
  credits: [],
  broadcast: {},
};
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
  });
describe("scheduled Pelican provider", () => {
  it("loops through assigned servers using one configurable hostname and each allocation port", async () => {
    const first = structuredClone(listing);
    const item = first.data[0];
    if (!item) throw new Error("Missing fixture");
    item.attributes.name = "Factorio fixture";
    const second = structuredClone(item);
    second.attributes.identifier = "bbbbbbbb";
    second.attributes.uuid = "123e4567-e89b-42d3-a456-426614174001";
    const allocation = second.attributes.relationships.allocations.data[0];
    if (!allocation) throw new Error("Missing allocation");
    allocation.attributes.port = 34198;
    first.data.push(second);
    first.meta.pagination.total = 2;
    query.mockResolvedValue({ numplayers: 3, maxplayers: 20 });
    const fetcher = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = new URL(
        input instanceof Request ? input.url : input.toString(),
      );
      return Promise.resolve(
        json(
          url.hostname === "api.github.com"
            ? []
            : url.pathname.endsWith("/resources")
              ? resources
              : first,
        ),
      );
    });
    const readers = createReaders(
      site,
      {
        PELICAN_URL: "https://example.invalid",
        PELICAN_KEY: "fixture-key",
        GAME_QUERY_HOST: "games.example.invalid",
        PELICAN_STATE_PATH: "",
      },
      fetcher,
    );
    const now = new Date();
    const snapshot = await collectSnapshot(null, readers, site, now);
    expect(snapshot.sources.servers?.failed).toBe(false);
    expect(snapshot.servers).toHaveLength(2);
    expect(snapshot.servers?.map((server) => server.players)).toEqual([3, 3]);
    expect(query).toHaveBeenCalledWith({
      host: "games.example.invalid",
      port: 34197,
      type: "factorio",
    });
    expect(query).toHaveBeenCalledWith({
      host: "games.example.invalid",
      port: 34198,
      type: "factorio",
    });
    expect(JSON.stringify(snapshot)).not.toMatch(
      /fixture-key|fixture-private-command|sftp_details|variables/,
    );
  });
});
