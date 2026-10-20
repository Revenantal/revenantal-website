import { describe, expect, it } from "vitest";
import { keptVersions, prunableVersions } from "./prune-plan";
import type { PackageVersion } from "./prune-plan";

const version = (
  id: number,
  minute: number,
  tags: string[] = [],
): PackageVersion => ({
  id,
  name: `sha256:${String(id)}`,
  created_at: `2026-10-20T00:${String(minute).padStart(2, "0")}:00Z`,
  metadata: { container: { tags } },
});

describe("image cleanup", () => {
  const versions = [
    version(1, 1, ["aaa"]),
    version(2, 1), // aaa's platform manifest
    version(3, 10, ["bbb"]),
    version(4, 10), // bbb's platform manifest
    version(5, 20, ["ccc", "latest"]),
    version(6, 30), // an orphan from an earlier build
  ];

  it("keeps the two newest tagged versions", () => {
    expect(keptVersions(versions, 2).map((kept) => kept.id)).toEqual([5, 3]);
  });

  it("deletes older images and orphans but never what a kept image points to", () => {
    const kept = keptVersions(versions, 2);
    const prunable = prunableVersions(versions, kept, new Set(["sha256:4"]));
    expect(prunable.map((old) => old.id)).toEqual([1, 2, 6]);
  });

  it("always keeps the version tagged latest, even as a separate index", () => {
    const wrapped = [
      ...versions.slice(0, 4),
      version(5, 20, ["ccc"]),
      version(7, 21, ["latest"]),
    ];
    expect(keptVersions(wrapped, 2).map((kept) => kept.id)).toEqual([5, 3, 7]);
  });

  it("deletes nothing when nothing is tagged", () => {
    const untagged = [version(1, 1), version(2, 2)];
    expect(
      prunableVersions(untagged, keptVersions(untagged, 2), new Set()),
    ).toEqual([]);
  });

  it("keeps everything when there are only two images", () => {
    const two = [version(1, 1, ["aaa"]), version(2, 2, ["bbb", "latest"])];
    expect(prunableVersions(two, keptVersions(two, 2), new Set())).toEqual([]);
  });
});
