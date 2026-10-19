import { groupCredits } from "../../src/data/credits.ts";
import type { Credit } from "../../src/data/types.ts";

const escape = (value: string) =>
  value.replaceAll("\n", " ").replace(/[\\`*_[\]<>|]/g, "\\$&");

/**
 * Produces the repository credits from the same entries sent to site views.
 *
 * @param credits - Validated shared credit entries.
 * @returns Markdown ready for the repository formatter.
 */
export function renderCredits(credits: Credit[]): string {
  const row = (credit: Credit) => {
    const licence =
      credit.license === "CC BY 4.0"
        ? "[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)"
        : credit.license === "CC0 1.0"
          ? "[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)"
          : credit.license === "OFL 1.1"
            ? "[OFL 1.1](https://openfontlicense.org/)"
            : credit.license === "Apache 2.0"
              ? "[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)"
              : escape(credit.license);
    return `| [${escape(credit.title)}](<${credit.url.replaceAll("<", "%3C").replaceAll(">", "%3E")}>) | ${escape(credit.author)} | ${licence} | ${escape(credit.usedFor)} | ${escape(credit.edits ?? "—")} |`;
  };
  return [
    "# Credits",
    "",
    "Source: `content/credits.json`. Run `pnpm credits:write` after changing an entry.",
    ...groupCredits(credits).flatMap((group) => [
      "",
      `## ${escape(group.department)}`,
      "",
      "| Asset | Author | Licence | Used for | Edits |",
      "| --- | --- | --- | --- | --- |",
      ...group.credits.map(row),
    ]),
    "",
  ].join("\n");
}
