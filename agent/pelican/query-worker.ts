import { readFileSync } from "node:fs";
import { GameDig } from "gamedig";
import { z } from "zod";
import { queryResultSchema } from "./schemas.ts";
try {
  const input = readFileSync(0, "utf8");
  if (input.length > 1024) throw new Error("Invalid query input.");
  const target = z
    .strictObject({
      host: z.string().min(1).max(253),
      port: z.number().int().min(1).max(65535),
      type: z.enum(["minecraftvanilla", "minecraftbedrock", "protocol-valve"]),
    })
    .parse(JSON.parse(input) as unknown);
  const result = queryResultSchema.parse(
    await GameDig.query({
      ...target,
      type: target.type.startsWith("protocol-")
        ? target.type
        : "protocol-" + target.type,
      requestPlayers: false,
      requestRules: false,
      maxRetries: 1,
      givenPortOnly: true,
      portCache: false,
      socketTimeout: 1500,
      attemptTimeout: 4000,
      debug: false,
    }),
  );
  process.stdout.write(JSON.stringify(result));
  process.exit(0);
} catch {
  process.exit(1);
}
