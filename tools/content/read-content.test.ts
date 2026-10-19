import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { readContent } from "./read-content";

let root: string;
beforeEach(async () => {
  await mkdir(resolve(".cache"), { recursive: true });
  root = await mkdtemp(resolve(".cache/content-test-"));
  await mkdir(join(root, "content"));
  for (const file of [
    "projects.json",
    "buttons.json",
    "links.json",
    "credits.json",
  ]) {
    await writeFile(
      join(root, "content", file),
      await readFile(resolve("content", file)),
    );
  }
});

describe("shared content compilation", () => {
  it("defaults optional files and resolves shared profile/copy references", async () => {
    const site = await readContent(root);
    expect(site.servers).toEqual([]);
    expect(site.broadcast).toEqual({});
    expect(site.buttons[0]?.href).toBe(site.links.steam);
    expect(site.buttons[2]?.copyValue).toBe(site.links.discord);
    expect(site.credits).toHaveLength(9);
  });

  it("excludes hidden projects from the public payload", async () => {
    await writeFile(
      join(root, "content/projects.json"),
      JSON.stringify([
        {
          id: "fixture",
          name: "Fixture",
          type: "sandbox",
          url: "https://example.invalid/",
          host: "example.invalid",
          desc: "Fixture project",
          hidden: true,
        },
      ]),
    );
    expect((await readContent(root)).projects).toEqual([]);
  });

  it("rejects malformed optional content rather than silently replacing it", async () => {
    await writeFile(join(root, "content/servers.json"), "{");
    await expect(readContent(root)).rejects.toThrow(
      "Cannot read content/servers.json",
    );
  });

  it("rejects playlists without a registered broadcast manifest", async () => {
    await writeFile(
      join(root, "content/broadcast.json"),
      JSON.stringify({
        fixture: {
          startsAt: "2026-10-18T00:00:00Z",
          items: [
            {
              id: "item",
              title: "Fixture",
              src: "/media/item.m3u8",
              durationSec: 60,
              captions: [
                { src: "/media/item.vtt", language: "en", label: "English" },
              ],
            },
          ],
        },
      }),
    );
    await expect(readContent(root)).rejects.toThrow(
      "no registered broadcast channel",
    );
    expect(
      (await readContent(root, new Set(["fixture"]))).broadcast.fixture?.items,
    ).toHaveLength(1);
  });
});
