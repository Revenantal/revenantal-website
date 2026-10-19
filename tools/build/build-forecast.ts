import { build } from "vite";

// Bundles the private weather service into one file for its image. The DB-IP database is
// fetched separately (tools/build/fetch-dbip.ts) and never committed.
await build({
  configFile: false,
  publicDir: false,
  logLevel: "warn",
  build: {
    ssr: true,
    outDir: ".cache/forecast",
    emptyOutDir: false,
    sourcemap: false,
    rolldownOptions: {
      input: { main: "api/forecast/main.ts" },
      output: { entryFileNames: "[name].mjs" },
    },
  },
  ssr: { noExternal: true },
});
