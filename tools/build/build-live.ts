import { build } from "vite";

await build({
  configFile: false,
  logLevel: "warn",
  build: {
    ssr: "jobs/live/main.ts",
    outDir: ".cache/live",
    emptyOutDir: false,
    sourcemap: false,
    rolldownOptions: { output: { entryFileNames: "main.mjs" } },
  },
  ssr: { noExternal: ["zod"] },
});
