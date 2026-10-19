import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const credits = JSON.parse(readFileSync("content/credits.json", "utf8")) as {
  title: string;
  url: string;
}[];

describe("shipped asset credits", () => {
  it("credits every freesound source the sound pipeline ships", () => {
    const pipeline = readFileSync("tools/assets/tv_sounds.py", "utf8");
    const ids = new Set(
      [...pipeline.matchAll(/"(\d+)__[\w-]+\.wav"/g)].map((match) => match[1]),
    );

    expect(ids.size).toBeGreaterThan(0);
    for (const id of ids)
      expect(
        credits.some((credit) => credit.url.includes(`/sounds/${id ?? ""}/`)),
        `freesound ${id ?? ""} has no credit`,
      ).toBe(true);
  });

  it("credits the TV, room and rack artwork when they ship", () => {
    for (const [file, title] of [
      ["public/assets/tv/frame.webp", "TV artwork"],
      ["public/assets/tv/room.webp", "Room artwork"],
      ["public/assets/status/server-1u.webp", "Status rack artwork"],
      ["public/assets/tv-guide/land-110m.json", "Natural Earth 1:110m land"],
    ] as const)
      if (existsSync(file))
        expect(
          credits.some((credit) => credit.title === title),
          `${title} has no credit`,
        ).toBe(true);
  });
});
