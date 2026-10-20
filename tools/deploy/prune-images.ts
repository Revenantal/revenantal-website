import { keptVersions, prunableVersions } from "./prune-plan.ts";
import type { PackageVersion } from "./prune-plan.ts";

// Deletes old versions of the published images, keeping the current one and one rollback,
// plus every piece those two point to. deploy.yml runs it after a successful publish with a
// GITHUB_TOKEN that may manage the repository's packages.
const OWNER = "revenantal";
const PACKAGES = ["revenantal-site", "revenantal-forecast", "revenantal-live"];
const KEEP = 2;
const MANIFEST_TYPES = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
].join(",");

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required.");

const api = (path: string, method = "GET") =>
  fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

async function listVersions(name: string): Promise<PackageVersion[]> {
  const versions: PackageVersion[] = [];
  for (let page = 1; ; page += 1) {
    const response = await api(
      `/users/${OWNER}/packages/container/${name}/versions?per_page=100&page=${String(page)}`,
    );
    if (!response.ok)
      throw new Error(
        `${name}: listing versions failed (${String(response.status)}).`,
      );
    const batch = (await response.json()) as PackageVersion[];
    versions.push(...batch);
    if (batch.length < 100) return versions;
  }
}

/**
 * Digests the kept versions point to: an index's platform manifests and attestations.
 *
 * @param name - The package.
 * @param kept - The versions being kept.
 * @returns Their child digests.
 */
async function referencedDigests(
  name: string,
  kept: PackageVersion[],
): Promise<Set<string>> {
  const auth = Buffer.from(`token:${token ?? ""}`).toString("base64");
  const grant = await fetch(
    `https://ghcr.io/token?scope=repository:${OWNER}/${name}:pull&service=ghcr.io`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!grant.ok)
    throw new Error(
      `${name}: registry sign-in failed (${String(grant.status)}).`,
    );
  const bearer = ((await grant.json()) as { token: string }).token;
  const referenced = new Set<string>();
  for (const version of kept) {
    const response = await fetch(
      `https://ghcr.io/v2/${OWNER}/${name}/manifests/${version.name}`,
      {
        headers: { Authorization: `Bearer ${bearer}`, Accept: MANIFEST_TYPES },
      },
    );
    if (!response.ok)
      throw new Error(
        `${name}: reading ${version.name} failed (${String(response.status)}).`,
      );
    const manifest = (await response.json()) as {
      manifests?: { digest: string }[];
    };
    for (const child of manifest.manifests ?? []) referenced.add(child.digest);
  }
  return referenced;
}

for (const name of PACKAGES) {
  const versions = await listVersions(name);
  const kept = keptVersions(versions, KEEP);
  const prunable = prunableVersions(
    versions,
    kept,
    await referencedDigests(name, kept),
  );
  for (const version of prunable) {
    const response = await api(
      `/users/${OWNER}/packages/container/${name}/versions/${String(version.id)}`,
      "DELETE",
    );
    if (!response.ok)
      throw new Error(
        `${name}: deleting ${version.name} failed (${String(response.status)}).`,
      );
  }
  const keptTags = kept.map((version) =>
    (version.metadata?.container?.tags ?? []).join(","),
  );
  console.log(
    `${name}: kept ${keptTags.join(" and ")}; deleted ${String(prunable.length)} old version(s).`,
  );
}
