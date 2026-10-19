import { z } from "zod";
import { webUrlSchema } from "../../src/data/schemas.ts";
import { readPelican } from "./pelican/provider.ts";
import type { Live, Site } from "../../src/data/types.ts";
import type { SourceReaders } from "./collect.ts";
import { checkProject } from "./project-check.ts";

const count = z.number().int().nonnegative();
const game = z.object({
  appid: count,
  name: z.string(),
  playtime_2weeks: count.optional(),
  playtime_forever: count,
});
const reposSchema = z.array(
  z.object({
    id: count,
    description: z.string().nullable().optional(),
    homepage: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    name: z.string(),
    html_url: z.url(),
    pushed_at: z.iso.datetime().nullable(),
    language: z.string().nullable(),
    fork: z.boolean(),
    private: z.boolean(),
  }),
);

async function json(
  url: URL,
  headers: Record<string, string> = {},
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetcher(url, {
    headers,
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Provider request failed.");
  const body = await response.text();
  if (Buffer.byteLength(body) > 1_048_576)
    throw new Error("Provider response too large.");
  return JSON.parse(body) as unknown;
}

/**
 * Maps four Steam responses to the public summary without copying personal fields.
 *
 * @param values - Summary, recent games, owned count and level responses.
 * @returns Only the allowed public Steam fields.
 */
export function mapSteam(values: unknown[]): NonNullable<Live["steam"]> {
  const summary = z
    .object({
      response: z.object({
        players: z
          .array(
            z.object({ personastate: count, gameid: z.string().optional() }),
          )
          .min(1),
      }),
    })
    .parse(values[0]);
  const recent = z
    .object({ response: z.object({ games: z.array(game).default([]) }) })
    .parse(values[1]);
  const owned = z
    .object({ response: z.object({ game_count: count }) })
    .parse(values[2]);
  const level = z
    .object({ response: z.object({ player_level: count }) })
    .parse(values[3]);
  const player = summary.response.players[0];
  if (!player) throw new Error("Steam player unavailable.");
  const games = recent.response.games.map((entry) => ({
    appId: entry.appid,
    name: entry.name,
    hours2w: (entry.playtime_2weeks ?? 0) / 60,
    hoursTotal: entry.playtime_forever / 60,
  }));
  return {
    status: player.gameid
      ? "in-game"
      : player.personastate === 0
        ? "offline"
        : [3, 4].includes(player.personastate)
          ? "away"
          : "online",
    level: level.response.player_level,
    gamesOwned: owned.response.game_count,
    hoursPast2Weeks: games.reduce((total, entry) => total + entry.hours2w, 0),
    recent: games,
  };
}

/**
 * Collapses whitespace and control characters and caps a repository description.
 *
 * @param value - Untrusted GitHub description.
 * @returns Display text of at most 200 characters, or undefined when empty.
 */
function cleanDescription(
  value: string | null | undefined,
): string | undefined {
  const clean = (value ?? "").replace(/[\p{Cc}\s]+/gu, " ").trim();
  if (!clean) return undefined;
  return clean.length > 200 ? clean.slice(0, 199).trimEnd() + "…" : clean;
}

/**
 * Accepts a repository's HTTP(S) website, adding https:// to a bare domain.
 *
 * @param value - Untrusted GitHub homepage field.
 * @returns The validated URL, or undefined when empty or unsafe.
 */
function cleanHomepage(value: string | null | undefined): URL | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const parsed = webUrlSchema.safeParse(candidate);
  return parsed.success ? new URL(parsed.data) : undefined;
}

/**
 * Keeps only public, non-fork GitHub repositories and the display fields needed by views.
 *
 * @param value - Untrusted GitHub repository list.
 * @param limit - Maximum number of recent public projects to publish.
 * @param exclude - Repository names to leave out, matched case-insensitively.
 * @returns A sanitized repository summary and project navigation.
 */
export function mapGithub(
  value: unknown,
  limit = 10,
  exclude: string[] = [],
): NonNullable<Live["github"]> {
  const banned = new Set(exclude.map((name) => name.toLowerCase()));
  const repos = reposSchema
    .parse(value)
    .filter(
      (repo) =>
        !banned.has(repo.name.toLowerCase()) &&
        !repo.private &&
        !repo.fork &&
        !repo.archived &&
        repo.pushed_at !== null &&
        !/(?:portfolio|personal (?:web)?site|résumé|resume)/i.test(
          `${repo.name} ${repo.description ?? ""}`,
        ),
    )
    .slice(0, limit);
  return {
    repos: repos.flatMap((repo) =>
      repo.pushed_at
        ? [
            {
              name: repo.name,
              url: repo.html_url,
              pushedAt: repo.pushed_at,
              lang: repo.language ?? "—",
            },
          ]
        : [],
    ),
    projects: repos.map((repo, order) => {
      const homepage = cleanHomepage(repo.homepage);
      return {
        id: `github-${String(repo.id)}`,
        name: repo.name,
        type: homepage ? "site" : "sandbox",
        url: homepage?.href ?? repo.html_url,
        host: homepage?.hostname ?? "github.com",
        desc:
          cleanDescription(repo.description) ??
          (repo.language
            ? `${repo.language} project on GitHub.`
            : "Code and experiments on GitHub."),
        order,
      };
    }),
  };
}

/**
 * Creates source readers without initiating any network traffic until collection runs.
 *
 * @param site - Validated projects and server publication policy.
 * @param env - Service environment; never embedded into browser output.
 * @param fetcher - Optional isolated transport for tests.
 * @param previousGithub - Retained navigation for checks when GitHub is unavailable.
 * @returns Four independent collectors for one scheduled execution.
 */
export function createReaders(
  site: Site,
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
  previousGithub?: Live["github"],
): SourceReaders {
  const observedAt = new Date();
  let githubRequest: Promise<NonNullable<Live["github"]>> | undefined;
  const github = () => {
    githubRequest ??= json(
      new URL(
        "https://api.github.com/users/revenantal/repos?sort=pushed&per_page=30",
      ),
      {
        ...(env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` }
          : {}),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "revenantal-status",
      },
      fetcher,
    ).then((value) =>
      mapGithub(value, site.directory?.limit ?? 10, site.directory?.exclude),
    );
    return githubRequest;
  };
  return {
    steam: async () => {
      if (!env.STEAM_KEY || !/^\d{17}$/.test(env.STEAM_ID ?? ""))
        throw new Error("Steam credentials unavailable.");
      const paths = [
        "ISteamUser/GetPlayerSummaries/v2/",
        "IPlayerService/GetRecentlyPlayedGames/v1/",
        "IPlayerService/GetOwnedGames/v1/",
        "IPlayerService/GetSteamLevel/v1/",
      ];
      const values = await Promise.all(
        paths.map((path, index) => {
          const url = new URL(`https://api.steampowered.com/${path}`);
          url.searchParams.set("key", env.STEAM_KEY ?? "");
          url.searchParams.set(
            index === 0 ? "steamids" : "steamid",
            env.STEAM_ID ?? "",
          );
          return json(url, {}, fetcher);
        }),
      );
      return { data: mapSteam(values) };
    },
    github: async () => ({ data: await github() }),
    status: async () => {
      const observations: NonNullable<Live["status"]> = {};
      const githubData =
        site.directory?.source === "github"
          ? await github().catch(() => previousGithub)
          : undefined;
      const projects =
        site.directory?.source === "github"
          ? (githubData?.projects ?? site.projects)
          : site.projects;
      const queue = projects.filter((project) => !project.hidden).values();
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          for (const project of queue)
            observations[project.id] = await checkProject(project);
        }),
      );
      return { data: observations };
    },
    servers: async () => {
      return readPelican(site, env, fetcher, observedAt);
    },
  };
}
