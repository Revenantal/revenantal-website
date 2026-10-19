import { z } from "zod";

const text = z.string().trim().min(1).max(500);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const measure = z.number().nonnegative();

/** HTTP(S) destinations without embedded credentials or control characters. */
export const webUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (value) => !/[\s\\]/.test(value),
    "URLs cannot contain whitespace or backslashes.",
  )
  .pipe(z.url({ protocol: /^https?$/ }))
  .refine((value) => {
    const url = new URL(value);
    return !url.username && !url.password && !/[\s\\]/.test(value);
  }, "Use an HTTP(S) URL without credentials or whitespace.");

const mediaUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (/[\s\\]/.test(value)) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    return (
      value.startsWith("https://") && webUrlSchema.safeParse(value).success
    );
  }, "Use a same-origin path or HTTPS media URL.");

/** A project declaration; live statuses are never authored in content files. */
export const projectSchema = z.strictObject({
  id: slug,
  name: text,
  type: z.enum(["site", "tool", "sandbox"]),
  url: webUrlSchema,
  host: text,
  desc: text,
  order: z.number().int().optional(),
  hidden: z.boolean().optional(),
});

/** Optional public policy overrides for discovered servers. */
export const serverOverrideSchema = z.strictObject({
  pelicanId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .max(100),
  name: text.optional(),
  gamedig: slug.optional(),
  showAddress: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

/** Public profiles and copyable username, authored once for all button layouts. */
export const linksSchema = z.strictObject({
  steam: webUrlSchema,
  github: webUrlSchema,
  discord: text,
});

const buttonFields = { label: text, face: z.enum(["cream", "grey", "dark"]) };

/** Hand-authored button definitions resolve shared profile keys at build time. */
export const buttonInputSchema = z.union([
  z.strictObject({ ...buttonFields, link: z.enum(["steam", "github"]) }),
  z.strictObject({ ...buttonFields, href: webUrlSchema }),
  z.strictObject({
    ...buttonFields,
    action: z.literal("copy"),
    copyKey: z.literal("discord"),
    copiedLabel: text,
  }),
  z.strictObject({ ...buttonFields, action: z.literal("tune"), channel: slug }),
]);

/** Resolved button payload accepted by the browser. */
export const buttonSchema = z.union([
  z.strictObject({ ...buttonFields, href: webUrlSchema }),
  z.strictObject({
    ...buttonFields,
    action: z.literal("copy"),
    copyValue: text,
    copiedLabel: text,
  }),
  z.strictObject({ ...buttonFields, action: z.literal("tune"), channel: slug }),
]);

/** A single credit shared between the site and the repository credits file. */
export const creditSchema = z.strictObject({
  title: text,
  author: text,
  url: webUrlSchema,
  license: text,
  edits: text.optional(),
  usedFor: text,
});

const captions = z.strictObject({
  src: mediaUrl,
  language: z.string().regex(/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]+)*$/),
  label: text,
});
const item = z.strictObject({
  id: slug,
  title: text,
  src: mediaUrl,
  durationSec: z.number().positive(),
  captions: z.array(captions).min(1),
});

/** A nonempty repeating playlist with unique programme IDs. */
export const playlistSchema = z
  .strictObject({
    startsAt: z.iso.datetime({ offset: true }),
    items: z.array(item).min(1),
  })
  .refine(
    (value) =>
      new Set(value.items.map((entry) => entry.id)).size === value.items.length,
    "Programme IDs must be unique.",
  );

/** Optional broadcast playlists keyed by stable registered channel ID. */
export const broadcastSchema = z.record(slug, playlistSchema);

/** Complete static content consumed by the browser. */
export const siteSchema = z
  .strictObject({
    directory: z
      .strictObject({
        source: z.enum(["curated", "github"]),
        limit: z.number().int().min(1).max(30),
      })
      .optional(),
    projects: z.array(projectSchema),
    buttons: z.array(buttonSchema),
    servers: z.array(serverOverrideSchema),
    links: linksSchema,
    credits: z.array(creditSchema),
    broadcast: broadcastSchema,
  })
  .refine(
    (value) =>
      new Set(value.projects.map((project) => project.id)).size ===
      value.projects.length,
    "Project IDs must be unique.",
  )
  .refine(
    (value) =>
      new Set(value.servers.map((server) => server.pelicanId)).size ===
      value.servers.length,
    "Server override IDs must be unique.",
  );

/** Observation metadata is validated independently from its source payload. */
export const freshnessSchema = z.strictObject({
  lastAttemptAt: z.iso.datetime({ offset: true }),
  lastSuccessAt: z.iso.datetime({ offset: true }).nullable(),
  failed: z.boolean(),
});

/** Public Steam summary; friend lists and personal fields are rejected. */
export const steamSchema = z.strictObject({
  status: z.enum(["online", "offline", "away", "in-game"]),
  level: count,
  gamesOwned: count,
  hoursPast2Weeks: measure,
  recent: z.array(
    z.strictObject({
      appId: count,
      name: text,
      hours2w: measure,
      hoursTotal: measure,
    }),
  ),
});

/** Public repository summaries, with no private account metadata. */
export const githubSchema = z.strictObject({
  projects: z.array(projectSchema).optional(),
  repos: z.array(
    z.strictObject({
      name: text,
      pushedAt: z.iso.datetime({ offset: true }),
      lang: text,
      url: webUrlSchema,
    }),
  ),
});

/** Project observations keyed by the shared project ID. */
export const statusSchema = z.record(
  slug,
  z.strictObject({
    state: z.enum(["up", "slow", "down"]),
    ms: measure.optional(),
  }),
);

/** Sanitized public telemetry; unexpected raw player fields are rejected. */
export const liveServerSchema = z.strictObject({
  id: text,
  name: text,
  game: text,
  state: z.enum([
    "running",
    "starting",
    "stopping",
    "offline",
    "maintenance",
    "unknown",
  ]),
  players: count.optional(),
  maxPlayers: count.optional(),
  map: text.optional(),
  uptimeSec: measure.optional(),
  address: text.optional(),
  pingMs: measure.optional(),
  passworded: z.boolean().optional(),
  version: text.optional(),
  cpuPct: measure.optional(),
  memMb: measure.optional(),
  memLimitMb: measure.optional(),
  netRxBps: measure.optional(),
  netTxBps: measure.optional(),
  nextRestart: z.iso.datetime({ offset: true }).optional(),
  lastBackup: z.iso.datetime({ offset: true }).optional(),
});

/** A valid outer envelope may contain independently invalid source sections. */
export const liveEnvelopeSchema = z.strictObject({
  fetchedAt: z.iso.datetime({ offset: true }),
  sources: z.record(z.string(), z.unknown()),
  steam: z.unknown().optional(),
  github: z.unknown().optional(),
  status: z.unknown().optional(),
  servers: z.unknown().optional(),
  errors: z.array(z.string().regex(/^[a-z][a-z0-9_]{0,63}$/)).optional(),
});

/** Internal server collection envelope carries its own observation timestamp. */
export const serverSnapshotSchema = z.strictObject({
  fetchedAt: z.iso.datetime({ offset: true }),
  servers: z.array(liveServerSchema),
});

/** Complete sanitized output written atomically by the live job. */
export const liveSchema = z.strictObject({
  fetchedAt: z.iso.datetime({ offset: true }),
  sources: z.strictObject({
    steam: freshnessSchema.optional(),
    github: freshnessSchema.optional(),
    status: freshnessSchema.optional(),
    servers: freshnessSchema.optional(),
  }),
  steam: steamSchema.optional(),
  github: githubSchema.optional(),
  status: statusSchema.optional(),
  servers: z.array(liveServerSchema).optional(),
  errors: z.array(z.string().regex(/^[a-z][a-z0-9_]{0,63}$/)).optional(),
});
