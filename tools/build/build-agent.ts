import { build } from "vite";
await build({
  configFile: false,
  publicDir: false,
  logLevel: "warn",
  build: {
    ssr: true,
    outDir: ".cache/pelican",
    emptyOutDir: true,
    sourcemap: false,
    rolldownOptions: {
      input: {
        main: "agent/pelican/main.ts",
        "query-worker": "agent/pelican/query-worker.ts",
      },
      output: { entryFileNames: "[name].mjs" },
    },
  },
  ssr: { noExternal: true },
});
