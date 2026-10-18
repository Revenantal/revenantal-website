import { fileURLToPath } from "node:url";
import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";

const aliases = Object.fromEntries(
  ["data", "tv", "channels", "list", "audio", "styles"].map((name) => [
    `@${name}`,
    fileURLToPath(new URL(`./src/${name}`, import.meta.url)),
  ]),
);

export default defineConfig({
  plugins: [preact()],
  resolve: { alias: aliases },
  build: { target: "es2022" },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
