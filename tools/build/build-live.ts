import { writeFile } from "node:fs/promises";
import { build } from "vite";
import { readContent } from "../content/read-content.ts";
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
// The job's copy keeps private content, such as the GitHub exclude list, that public site.json omits.
await writeFile(
  ".cache/live/site.json",
  JSON.stringify(await readContent(process.cwd())),
);
