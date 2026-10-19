import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { writeSnapshot, pushSnapshot } from "./output.ts";
const exec = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execFile: exec }));
describe("public snapshot publication", () => {
  it("atomically replaces only validated snapshots and leaves no temporary files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rv-agent-test-"));
    try {
      const output = join(directory, "servers.json");
      const snapshot = { fetchedAt: "2026-10-18T12:00:00Z", servers: [] };
      await writeSnapshot(output, snapshot);
      await expect(
        writeSnapshot(output, { ...snapshot, token: "fixture-private" }),
      ).rejects.toThrow();
      expect(JSON.parse(await readFile(output, "utf8"))).toEqual(snapshot);
      expect(await readdir(directory)).toEqual(["servers.json"]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("uses fixed SSH options and rejects shell syntax in upload destinations", async () => {
    exec.mockImplementation(
      (_file, _args, _options, complete: (error: null) => void) => {
        complete(null);
      },
    );
    await pushSnapshot("/data/servers.json", "status-drop@example.invalid");
    expect(exec).toHaveBeenCalledWith(
      "rsync",
      expect.arrayContaining([
        "--chmod=F644",
        "--",
        "/data/servers.json",
        "status-drop@example.invalid:",
      ]),
      expect.objectContaining({ timeout: 30000 }),
      expect.any(Function),
    );
    expect(JSON.stringify(exec.mock.calls)).toContain(
      "StrictHostKeyChecking=yes",
    );
    await expect(
      pushSnapshot("/data/servers.json", "host;command"),
    ).rejects.toThrow();
  });
});
