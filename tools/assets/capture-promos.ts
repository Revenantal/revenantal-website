import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

// Captures a "Coming up" still of every built channel except the TV Guide itself, for the
// Guide's promo window. Run `pnpm promos` after a channel is added or changes its look; the
// stills and src/channels/tv-guide/promos.json are committed. Uses the local live snapshot.

type Manifest = { id: string; name: string };
type Promo = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  image: string;
};

// One line per channel for the promo; kept with the capture so content stays in one place.
const BLURBS: Record<string, string> = {
  status: "The server rack: every project and game server, live.",
  credits: "Everyone who helped make revenantal.",
};

const listPath = resolve("src/channels/tv-guide/promos.json");
const previous = JSON.parse(await readFile(listPath, "utf8")) as Promo[];
await mkdir(resolve("public/assets/promos"), { recursive: true });

const server = await createServer({
  logLevel: "warn",
  server: { port: 5179, strictPort: false },
});
await server.listen();
const base = server.resolvedUrls?.local[0]?.replace(/\/$/, "");
if (!base) throw new Error("The dev server did not start.");

const { registry } = (await server.ssrLoadModule("/src/channels/index.ts")) as {
  registry: Record<string, Manifest | null>;
};
const channels = Object.entries(registry)
  .flatMap(([position, manifest]) =>
    manifest && manifest.id !== "tv-guide" ? [{ position, manifest }] : [],
  )
  .sort((left, right) => Number(left.position) - Number(right.position));

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 0.75,
});
const promos: Promo[] = [];
try {
  for (const { position, manifest } of channels) {
    await page.goto(`${base}/#ch${position}`, { waitUntil: "networkidle" });
    const selector = `[data-channel="${manifest.id}"]`;
    await page.waitForSelector(selector, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    // Lift the channel picture out of the TV: no scanlines, OSD, note or glass on top.
    await page.evaluate((query) => {
      const picture = document.querySelector<HTMLElement>(query);
      if (!picture) return;
      document.body.append(picture);
      Object.assign(picture.style, {
        position: "fixed",
        left: "0",
        top: "0",
        zIndex: "2147483647",
        transform: "none",
        filter: "none",
        animation: "none",
      });
    }, selector);
    const image = `/assets/promos/${manifest.id}.jpg`;
    await page.screenshot({
      path: resolve(`public${image}`),
      type: "jpeg",
      quality: 82,
      clip: { x: 0, y: 0, width: 760, height: 570 },
    });
    const label = `CH ${position.padStart(2, "0")}`;
    promos.push({
      id: manifest.id,
      label,
      title: manifest.name,
      blurb:
        BLURBS[manifest.id] ??
        previous.find((promo) => promo.id === manifest.id)?.blurb ??
        "Now on the dial.",
      image,
    });
    console.log(`Captured ${label} ${manifest.name}.`);
  }
} finally {
  await browser.close();
  await server.close();
}
await writeFile(listPath, `${JSON.stringify(promos, null, 2)}\n`);
