import { z } from "zod";
const count = z.number().nonnegative();
const allocation = z.object({
  attributes: z.object({
    ip: z.string(),
    ip_alias: z.string().nullable().optional(),
    port: z.number().int().min(1).max(65535),
    is_default: z.boolean(),
  }),
});
/** Private API projection deliberately excludes commands, variables, SFTP and account data. */
export const serverSchema = z.object({
  object: z.literal("server"),
  attributes: z.object({
    identifier: z.string().regex(/^[a-f0-9]{8}$/),
    uuid: z.uuid(),
    name: z.string().min(1),
    limits: z.object({ memory: count }),
    is_node_under_maintenance: z.boolean().default(false),
    status: z.string().nullable(),
    is_suspended: z.boolean().default(false),
    is_installing: z.boolean().default(false),
    relationships: z.object({
      allocations: z.object({ data: z.array(allocation) }),
      egg: z.object({ attributes: z.object({ name: z.string() }) }).optional(),
    }),
  }),
});
/** Paged discovery is validated before collecting any individual resources. */
export const listingSchema = z.object({
  object: z.literal("list"),
  data: z.array(serverSchema),
  meta: z.object({
    pagination: z.object({
      total: z.number().int().nonnegative(),
      current_page: z.number().int().positive(),
      total_pages: z.number().int().nonnegative(),
    }),
  }),
});
/** Beta38 resource observation; unknown additional fields never enter public output. */
export const resourcesSchema = z.object({
  object: z.literal("stats"),
  attributes: z.object({
    current_state: z.string(),
    is_suspended: z.boolean(),
    resources: z.object({
      memory_bytes: count,
      cpu_absolute: count,
      network_rx_bytes: count,
      network_tx_bytes: count,
      uptime: count,
    }),
  }),
});
/** Public projection of game query results never contains a player list or raw data. */
export const queryResultSchema = z.object({
  numplayers: z.number().int().nonnegative().optional(),
  maxplayers: z.number().int().nonnegative().optional(),
  ping: count.optional(),
  password: z.boolean().optional(),
});
/** Validated private server metadata, never serialized directly. */
export type PanelServer = z.infer<typeof serverSchema>["attributes"];
/** Allowed query summary with player identities removed. */
export type QueryResult = z.infer<typeof queryResultSchema>;

/** Private counter baselines persist across scheduled executions without entering live.json. */
export const counterStateSchema = z.record(
  z.string().regex(/^[a-f0-9]{8}$/),
  z.strictObject({ at: count, uptime: count, rx: count, tx: count }),
);
