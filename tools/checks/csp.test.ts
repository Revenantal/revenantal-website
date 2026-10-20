import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sources = (folder: string): string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /(?<!\.test)\.tsx?$/.test(entry.name) ? [path] : [];
  });

const policy =
  /Content-Security-Policy "([^"]+)"/.exec(
    readFileSync("deploy/Caddyfile", "utf8"),
  )?.[1] ?? "";
const directive = (name: string) =>
  policy
    .split(";")
    .map((part) => part.trim().split(/\s+/))
    .find(([key]) => key === name)
    ?.slice(1) ?? [];

describe("site content security policy", () => {
  it("allows blob: images when the app shows images from object URLs", () => {
    const usesObjectUrls = sources("src").some((file) =>
      readFileSync(file, "utf8").includes("URL.createObjectURL"),
    );
    expect(usesObjectUrls).toBe(true);
    expect(directive("img-src")).toContain("blob:");
  });

  it("keeps scripts and connections same-origin", () => {
    expect(directive("script-src")).toEqual(["'self'"]);
    expect(directive("connect-src")).toEqual(["'self'"]);
  });
});
