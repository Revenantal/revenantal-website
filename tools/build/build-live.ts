import { build } from "vite";
await build({
  configFile: false,
  publicDir: false,
  logLevel: "warn",
  build: {
    ssr: true,
    outDir: ".cache/live",
    emptyOutDir: true,
    sourcemap: false,
    rolldownOptions: {
      input: {
        main: "jobs/live/main.ts",
        "query-worker": "jobs/live/pelican/query-worker.ts",
      },
      output: { entryFileNames: "[name].mjs" },
    },
  },
  ssr: { noExternal: true },
});
