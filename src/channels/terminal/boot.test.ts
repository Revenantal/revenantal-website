import { describe, expect, it } from "vitest";
import { BOOT_DURATION_MS, blockWord, bootFrame, type BootLine } from "./boot";

const text = (lines: BootLine[]) =>
  lines.map((line) => line.map(([part]) => part).join("")).join("\n");

describe("boot timeline", () => {
  it("starts with the BIOS header and nothing else", () => {
    const frame = bootFrame(0);
    expect(frame.phase).toBe("post");
    expect(text(frame.lines)).toBe("REVENANTAL BIOS v4.04");
  });

  it("counts memory up to 640K, then marks it OK", () => {
    const early = text(bootFrame(1000).lines);
    const done = text(bootFrame(2000).lines);
    expect(early).toMatch(/Base Memory\s+:\s+\d+K$/m);
    expect(early).not.toContain("640K");
    expect(done).toContain("640K OK");

    const counts = [600, 900, 1200, 1500, 1800].map((time) => {
      const match = /Base Memory\s+:\s+(\d+)K/.exec(
        text(bootFrame(time).lines),
      );
      return Number(match?.[1]);
    });
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts.at(-1)).toBe(640);
  });

  it("detects devices in order before it clears", () => {
    const post = text(bootFrame(3800).lines);
    const order = [
      "Processor",
      "Primary Master",
      "Floppy",
      "Keyboard",
      "Mouse",
    ];
    const found = order.map((label) => post.indexOf(label));
    expect(found.every((index) => index >= 0)).toBe(true);
    expect(found).toEqual([...found].sort((a, b) => a - b));
  });

  it("clears for a beat, then shows the logo and loading screen", () => {
    expect(bootFrame(3899).phase).toBe("post");
    const gap = bootFrame(3920);
    expect(gap.phase).toBe("load");
    expect(gap.lines).toHaveLength(0);
    expect(bootFrame(3960).lines.length).toBeGreaterThan(0);

    const load = bootFrame(5000);
    expect(load.phase).toBe("load");
    expect(text(load.lines)).not.toContain("BIOS");
    expect(text(load.lines)).toContain("Starting REVENANTAL.SH");
    expect(text(load.lines)).toMatch(/\[█+░+\]/);
  });

  it("fills the progress bar to 100% and ends in the hand-over", () => {
    expect(text(bootFrame(4100).lines)).toContain("  0%");
    const end = bootFrame(BOOT_DURATION_MS);
    expect(end.phase).toBe("done");
    expect(text(end.lines)).toContain("100%");
    expect(text(end.lines)).toContain("Welcome.");
  });

  it("takes about six seconds", () => {
    expect(BOOT_DURATION_MS).toBeGreaterThanOrEqual(5500);
    expect(BOOT_DURATION_MS).toBeLessThanOrEqual(6500);
  });
});

describe("blockWord", () => {
  it("draws five equal-width rows", () => {
    const rows = blockWord("REVENANTAL");
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((row) => row.length)).size).toBe(1);
    expect(rows[0]).toContain("█");
  });

  it("leaves unknown letters blank", () => {
    expect(blockWord("Z")).toEqual(Array.from({ length: 5 }, () => "    "));
  });
});
