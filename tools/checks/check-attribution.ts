import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { attributionViolations } from "./attribution.ts";

const args = process.argv.slice(2);
let text: string;

if (args[0] === "--file" && args[1]) {
  text = readFileSync(args[1], "utf8");
} else if (args[0] === "--ci") {
  const base = process.env.BASE_SHA;
  const head = process.env.HEAD_SHA;

  if (
    !head ||
    !/^[a-f0-9]{40}$/i.test(head) ||
    (base && !/^[a-f0-9]{40}$/i.test(base))
  ) {
    throw new Error("CI must supply valid commit SHAs.");
  }

  const range = base && !/^0+$/.test(base) ? `${base}..${head}` : head;
  text = execFileSync("git", ["log", "--format=%B", range], {
    encoding: "utf8",
  });
  const pullRequestText = process.env.PR_TEXT ?? "";
  text += `\n${process.env.PR_TITLE ?? ""}\n${pullRequestText}`;
} else if (args.length === 0) {
  text = execFileSync("git", ["log", "-1", "--format=%B"], {
    encoding: "utf8",
  });
} else {
  throw new Error("Use --file <path>, --ci, or no arguments.");
}

const violations = attributionViolations(text);

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
}
