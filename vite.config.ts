import { fileURLToPath } from "node:url";
import { contentPlugin } from "./tools/content/plugin.ts";
import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";

const aliases = Object.fromEntries(
  ["data", "tv", "channels", "list", "audio", "styles"].map((name) => [
    `@${name}`,
    fileURLToPath(new URL(`./src/${name}`, import.meta.url)),
  ]),
);

export default defineConfig({
  plugins: [contentPlugin(), preact()],
  resolve: { alias: aliases },
  server: { watch: { ignored: ["**/.cache/**"] } },
  build: { target: "es2022" },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.{ts,tsx}",
      "tools/**/*.test.ts",
      "jobs/**/*.test.ts",
      "api/**/*.test.ts",
    ],
    restoreMocks: true,
    clearMocks: true,
  },
});
