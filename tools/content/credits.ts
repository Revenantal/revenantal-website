import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
import { readContent } from "./read-content.ts";
import { renderCredits } from "./render-credits.ts";

const site = await readContent(process.cwd());
const expected = await format(renderCredits(site.credits), {
  parser: "markdown",
});
if (process.argv.slice(2).includes("--write")) {
  await writeFile("CREDITS.md", expected);
} else {
  const actual = (await readFile("CREDITS.md", "utf8")).replaceAll(
    "\r\n",
    "\n",
  );
  if (actual !== expected)
    throw new Error(
      "CREDITS.md differs from shared credits. Run pnpm credits:write.",
    );
}
