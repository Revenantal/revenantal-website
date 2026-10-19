import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import {
  broadcastSchema,
  buttonInputSchema,
  creditSchema,
  linksSchema,
  projectSchema,
  serverOverrideSchema,
  siteSchema,
} from "../../src/data/schemas.ts";
import type { Site } from "../../src/data/types.ts";

async function jsonFile(
  root: string,
  name: string,
  fallback?: unknown,
): Promise<unknown> {
  try {
    const text = await readFile(resolve(root, "content", name), "utf8");
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (
      fallback !== undefined &&
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )
      return fallback;
    throw new Error(`Cannot read content/${name}.`, { cause: error });
  }
}

/**
 * Validates content inputs and resolves shared profile references once.
 *
 * @param root - Repository root containing the content directory.
 * @param broadcastIds - IDs of registered broadcast manifests, empty until the host exists.
 * @returns The complete static site payload, excluding hidden projects.
 */
export async function readContent(
  root: string,
  broadcastIds: ReadonlySet<string> = new Set(),
): Promise<Site> {
  const [projects, buttons, servers, links, credits, broadcast] =
    await Promise.all([
      jsonFile(root, "projects.json"),
      jsonFile(root, "buttons.json"),
      jsonFile(root, "servers.json", []),
      jsonFile(root, "links.json"),
      jsonFile(root, "credits.json"),
      jsonFile(root, "broadcast.json", {}),
    ]);
  const profiles = linksSchema.parse(links);
  const resolvedButtons = z
    .array(buttonInputSchema)
    .parse(buttons)
    .map((button) => {
      if ("link" in button)
        return {
          label: button.label,
          face: button.face,
          href: profiles[button.link],
        };
      if ("copyKey" in button)
        return {
          label: button.label,
          face: button.face,
          action: button.action,
          copyValue: profiles[button.copyKey],
          copiedLabel: button.copiedLabel,
        };
      return button;
    });
  const playlists = broadcastSchema.parse(broadcast);
  for (const id of Object.keys(playlists)) {
    if (!broadcastIds.has(id))
      throw new Error(
        `Broadcast playlist ${id} has no registered broadcast channel.`,
      );
  }
  const directory = await jsonFile(root, "directory.json", {
    source: "curated",
    limit: 10,
  });
  const site = siteSchema.parse({
    directory,
    projects: z.array(projectSchema).parse(projects),
    buttons: resolvedButtons,
    servers: z.array(serverOverrideSchema).parse(servers),
    links: profiles,
    credits: z.array(creditSchema).parse(credits),
    broadcast: playlists,
  });
  return {
    ...site,
    projects: site.projects.filter((project) => !project.hidden),
  };
}
