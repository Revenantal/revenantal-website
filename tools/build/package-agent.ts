import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
await mkdir(".cache", { recursive: true });
const staging = await mkdtemp(resolve(".cache/pelican-host-test-"));
await cp(".cache/pelican", join(staging, "app"), { recursive: true });
await cp("dist/site.json", join(staging, "app/site.json"));
await cp("deploy/pelican-test.compose.yml", join(staging, "compose.yml"));
await cp("deploy/.env.pelican.example", join(staging, ".env.pelican.example"));
await cp("deploy/pelican-setup.md", join(staging, "README.md"));
execFileSync(
  "tar",
  ["-czf", resolve(".cache/pelican-host-test.tar.gz"), "-C", staging, "."],
  { windowsHide: true, stdio: "pipe" },
);
console.log(
  "Created .cache/pelican-host-test.tar.gz with bundled code, shared content and upload-disabled local test configuration. No runtime keys are included.",
);
