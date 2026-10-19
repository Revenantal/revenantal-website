import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { serverSnapshotSchema } from "../../src/data/schemas.ts";
/**
 * Atomically writes a sanitized public snapshot without ever saving raw panel responses.
 * @param output - Snapshot path inside the dedicated writable runtime directory.
 * @param value - Untrusted public snapshot to revalidate before disk/network publication.
 * @returns Completion after the atomic rename.
 */
export async function writeSnapshot(
  output: string,
  value: unknown,
): Promise<void> {
  const data = serverSnapshotSchema.parse(value);
  const temporary = join(dirname(output), ".servers-" + randomUUID() + ".tmp");
  try {
    await writeFile(temporary, JSON.stringify(data), {
      flag: "wx",
      mode: 0o600,
    });
    await rename(temporary, output);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}
/**
 * Uploads only servers.json through a pinned host key and a folder-restricted SSH account.
 * @param output - Sanitized local snapshot file.
 * @param destination - Dedicated user@host, with no shell syntax or path allowed.
 * @returns Completion of the bounded atomic rsync transfer.
 */
export function pushSnapshot(
  output: string,
  destination: string,
): Promise<void> {
  if (!/^[a-z_][a-z0-9_-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(destination))
    return Promise.reject(new Error("Invalid upload destination."));
  return new Promise((resolve, reject) => {
    execFile(
      "rsync",
      [
        "--perms",
        "--chmod=F644",
        "--timeout=15",
        "-e",
        "ssh -i /run/ssh/key -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/run/ssh/known_hosts -o ConnectTimeout=10",
        "--",
        output,
        destination + ":",
      ],
      { timeout: 30000, maxBuffer: 1024, windowsHide: true },
      (error) => {
        if (error) reject(new Error("Snapshot upload failed."));
        else resolve();
      },
    );
  });
}
