/** One container package version, as the GitHub REST API lists it. */
export type PackageVersion = {
  id: number;
  name: string; // the manifest digest, sha256:…
  created_at: string;
  metadata?: { container?: { tags?: string[] } };
};

const tagsOf = (version: PackageVersion) =>
  version.metadata?.container?.tags ?? [];

/**
 * The versions to keep: the newest ones tagged with a commit (the current image and its
 * rollback), plus whatever carries `latest` in case it is a separate index.
 *
 * @param versions - Every version of one package.
 * @param keep - How many commit-tagged versions to keep.
 * @returns The kept versions.
 */
export function keptVersions(
  versions: readonly PackageVersion[],
  keep: number,
): PackageVersion[] {
  const builds = versions
    .filter((version) => tagsOf(version).some((tag) => tag !== "latest"))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, keep);
  const latest = versions.filter(
    (version) =>
      tagsOf(version).includes("latest") && !builds.includes(version),
  );
  return [...builds, ...latest];
}

/**
 * The versions to delete: everything except the kept versions and the untagged pieces they
 * point to (an image index's platform manifests and attestations). Deleting those would
 * break a kept image, so they are never removed.
 *
 * @param versions - Every version of one package.
 * @param kept - The versions to keep, from `keptVersions`.
 * @param referenced - Digests the kept versions point to.
 * @returns The versions safe to delete; none when nothing is kept, so a bad listing never
 * empties a package.
 */
export function prunableVersions(
  versions: readonly PackageVersion[],
  kept: readonly PackageVersion[],
  referenced: ReadonlySet<string>,
): PackageVersion[] {
  if (kept.length === 0) return [];
  const keptIds = new Set(kept.map((version) => version.id));
  return versions.filter(
    (version) => !keptIds.has(version.id) && !referenced.has(version.name),
  );
}
