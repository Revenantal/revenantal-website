import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import listing from "./__fixtures__/servers-beta38.json";
import stats from "./__fixtures__/resources-beta38.json";
import { createPanelClient } from "./client.ts";
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
  });
describe("restricted panel transport", () => {
  it("uses only the bearer key with cookies omitted and follows all bounded pages", async () => {
    const first = structuredClone(listing);
    first.meta.pagination.total = 2;
    first.meta.pagination.total_pages = 2;
    const second = structuredClone(first);
    second.meta.pagination.current_page = 2;
    required(second.data[0]).attributes.identifier = "bbbbbbbb";
    required(second.data[0]).attributes.uuid =
      "123e4567-e89b-42d3-a456-426614174001";
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(first))
      .mockResolvedValueOnce(json(second))
      .mockResolvedValueOnce(json(stats));
    const client = createPanelClient(
      "https://example.invalid/",
      "fixture-key",
      fetcher,
    );
    expect(await client.list()).toHaveLength(2);
    await client.resources(required(listing.data[0]).attributes.uuid);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      credentials: "omit",
      redirect: "error",
      headers: { Authorization: "Bearer fixture-key" },
    });
    expect((fetcher.mock.calls[1]?.[0] as URL).href).toContain("page=2");
    expect((fetcher.mock.calls[2]?.[0] as URL).href).toContain("/resources");
  });
  it("rejects duplicate/incomplete/over-limit discovery rather than publishing a partial list", async () => {
    for (const issue of ["duplicate", "incomplete", "limit"]) {
      const value = structuredClone(listing);
      if (issue === "duplicate") value.data.push(required(value.data[0]));
      if (issue === "incomplete") value.meta.pagination.total = 2;
      if (issue === "limit") value.meta.pagination.total_pages = 21;
      const client = createPanelClient(
        "https://example.invalid",
        "fixture-key",
        vi.fn<typeof fetch>().mockResolvedValue(json(value)),
      );
      await expect(client.list()).rejects.toThrow();
    }
  });
  it("rejects unexpected content, oversized bodies, bad credentials and redirects", async () => {
    for (const response of [
      new Response("no", { status: 403 }),
      new Response("html"),
      json("x".repeat(1048577)),
      new Response(null, {
        status: 302,
        headers: { location: "https://example.invalid/other" },
      }),
    ]) {
      const client = createPanelClient(
        "https://example.invalid",
        "fixture-key",
        vi.fn<typeof fetch>().mockResolvedValue(response),
      );
      await expect(client.list()).rejects.toThrow();
    }
  });
  it("requires HTTPS without URL credentials or query strings", () => {
    for (const panel of [
      "http://example.invalid",
      "https://user:pass@example.invalid",
      "https://example.invalid/?token=fixture",
    ]) {
      expect(() => createPanelClient(panel, "fixture-key")).toThrow();
    }
  });
});

function required<T>(value: T | undefined): T {
  assert(value);
  return value;
}
