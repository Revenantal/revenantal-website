// Render static design boards using only repository assets and installed local fonts.
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");

const BOARDS = path.join(__dirname, "boards");
const ASSETS = path.resolve(__dirname, "../assets");
const ASSET_MAP = {
  "63679c6623c7a971b10b6520872379a2": "rack/web/rack-cab-top.webp",
  "87560ff46757c5ca4e30400f14bf3346": "rack/web/rack-cab-mid.webp",
  f9f9ade3de45f141101ee50ae3b43a46: "rack/web/rack-cab.webp",
  fb86bab6d3ee00a04d9b75a8b0e4eb7e: "rack/web/rack-srv2u.webp",
  c16483ef998ee145ceea3441b948e5f6: "rack/web/rack-ups.webp",
  "23e01cc512dea2e9a4cd72dce85c58ef": "rack/web/rack-switch.webp",
  "229974cb53b507e2a9c84fb4184f23e4": "rack/web/rack-patch.webp",
  "8b8c947e9d8b1316b08fc712f316bf8d": "rack/web/rack-blank.webp",
  "2544913e2a8c3ac00efb423245e2393e": "rack/web/rack-tray.webp",
  ed85335998a50c3047b61b3c8253df83: "rack/web/server-1u.webp",
  "0e13339baf8a268a5254a4032e286b11": "revscape/revscape-3d.webp",
  "2f05e4485c9944a794680a500a21ad2f": "guide/guide-radar.webp",
  "7efa64fa77d4b9c4624480fb5735716e": "guide/guide-promo-drive.webp",
};
const FONTS = {
  "archivo-narrow": ["Archivo Narrow", [500, 700]],
  "archivo-black": ["Archivo Black", [400]],
  "pixelify-sans": ["Pixelify Sans", [400, 600]],
  "press-start-2p": ["Press Start 2P", [400]],
  vt323: ["VT323", [400]],
  bungee: ["Bungee", [400]],
  "im-fell-english": ["IM Fell English", [400]],
  "im-fell-english-sc": ["IM Fell English SC", [400]],
};

/** Embed assets so static boards do not depend on file URL behavior or the canvas host. */
async function prepareBoard(name, fonts) {
  if (path.basename(name) !== name || !name.endsWith(".dc.html")) {
    throw new Error("Use a board filename from prototypes/boards/: " + name);
  }
  const source = await fs.readFile(path.join(BOARDS, name), "utf8");
  if (/text\/x-dc|\{\{/.test(source)) {
    throw new Error(
      name +
        " needs the design-canvas runtime and cannot be rendered as a static board.",
    );
  }
  const helmet = source.match(/<helmet>([\s\S]*?)<\/helmet>/i);
  const body = source.match(/<\/helmet>([\s\S]*?)<\/x-dc>/i);
  if (!helmet || !body) throw new Error("Missing board markup: " + name);
  let markup = helmet[1].replace(/<link\b[^>]*>/gi, "") + body[1];
  markup = markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  for (const match of new Set(markup.match(/\/_blob\/[a-zA-Z0-9_-]+/g) || [])) {
    const relative = ASSET_MAP[match.slice("/_blob/".length)];
    if (!relative)
      throw new Error("No local asset mapping for " + match + " in " + name);
    const bytes = await fs.readFile(path.join(ASSETS, relative));
    markup = markup
      .split(match)
      .join("data:image/webp;base64," + bytes.toString("base64"));
  }
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    "<style>body{margin:0}" +
    fonts +
    "</style></head><body>" +
    markup +
    "</body></html>"
  );
}

/** Load pinned font packages locally; fail instead of silently using a different font. */
async function loadFonts() {
  let css = "";
  for (const [slug, [family, weights]] of Object.entries(FONTS)) {
    for (const weight of weights) {
      const font = path.join(
        __dirname,
        "node_modules/@fontsource",
        slug,
        "files",
        slug + "-latin-" + weight + "-normal.woff2",
      );
      const bytes = await fs.readFile(font);
      css +=
        '@font-face{font-family:"' +
        family +
        '";font-weight:' +
        weight +
        ";src:url(data:font/woff2;base64," +
        bytes.toString("base64") +
        ') format("woff2")}';
    }
  }
  return css;
}

/** Serve only the scene and three.js build modules, never the rest of the repository. */
async function serveScene() {
  const files = new Map();
  files.set("/revscape-scene.html", {
    body: await fs.readFile(path.join(__dirname, "revscape-scene.html")),
    type: "text/html",
  });
  const build = path.dirname(require.resolve("three"));
  for (const file of await fs.readdir(build)) {
    if (file.endsWith(".js"))
      files.set("/node_modules/three/build/" + file, {
        body: await fs.readFile(path.join(build, file)),
        type: "text/javascript",
      });
  }
  const server = http.createServer((request, response) => {
    const file = files.get(request.url);
    response.writeHead(file ? 200 : 404, {
      "Content-Type": file ? file.type : "text/plain",
    });
    response.end(file ? file.body : "Not found");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { server, origin: "http://127.0.0.1:" + server.address().port };
}

/** Parse inputs before launching Chromium, and keep generated images out of approved mockups. */
async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log(
      "Usage: node render-boards.js [--all | ChGuide.dc.html ...] [--scene] [--check] [--output-dir DIR]",
    );
    return;
  }
  const options = {
    all: false,
    scene: false,
    check: false,
    output: path.join(__dirname, "renders"),
  };
  const names = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--all") options.all = true;
    else if (arg === "--scene") options.scene = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--output-dir") {
      if (!args[i + 1] || args[i + 1].startsWith("--"))
        throw new Error("--output-dir needs a directory.");
      options.output = path.resolve(args[++i]);
    } else if (arg.startsWith("--")) throw new Error("Unknown option: " + arg);
    else names.push(arg);
  }
  if (options.all && names.length)
    throw new Error("Choose --all or explicit filenames.");
  if (options.all) {
    for (const name of (await fs.readdir(BOARDS))
      .filter((f) => f.endsWith(".dc.html"))
      .sort()) {
      const source = await fs.readFile(path.join(BOARDS, name), "utf8");
      if (/text\/x-dc|\{\{/.test(source)) console.log("Canvas only: " + name);
      else names.push(name);
    }
  }
  if (!names.length && !options.scene)
    throw new Error("No renderable input selected.");
  const fonts = names.length ? await loadFonts() : "";
  const boards = await Promise.all(
    [...new Set(names)].map(async (name) => ({
      name,
      html: await prepareBoard(name, fonts),
    })),
  );
  if (options.check) {
    if (options.scene) {
      await fs.access(path.join(__dirname, "revscape-scene.html"));
      require.resolve("three");
    }
    console.log(
      "Checked " +
        boards.length +
        " static boards" +
        (options.scene ? " and scene dependencies." : "."),
    );
    return;
  }
  const { chromium } = require("playwright");
  const scene = options.scene ? await serveScene() : null;
  let browser;
  try {
    browser = await chromium.launch();
    await fs.mkdir(options.output, { recursive: true });
    for (const board of boards) {
      const page = await browser.newPage({
        viewport: { width: 760, height: 570 },
      });
      const failures = [];
      page.on("pageerror", (error) => failures.push(error.message));
      await page.route("**/*", (route) => route.abort());
      await page.setContent(board.html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const broken = await page.evaluate(
        () =>
          Array.from(document.images).filter(
            (image) => !image.complete || image.naturalWidth === 0,
          ).length,
      );
      if (broken || failures.length)
        throw new Error(
          board.name +
            ": broken images or script errors: " +
            failures.join(", "),
        );
      const output = path.join(
        options.output,
        board.name.replace(".dc.html", ".png"),
      );
      await page
        .locator("body > div")
        .first()
        .screenshot({ path: output, animations: "disabled" });
      console.log("Rendered " + path.basename(output));
      await page.close();
    }
    if (scene) {
      const page = await browser.newPage({
        viewport: { width: 1024, height: 668 },
      });
      const failures = [];
      page.on("pageerror", (error) => failures.push(error.message));
      await page.route("**/*", (route) =>
        route
          .request()
          .url()
          .startsWith(scene.origin + "/")
          ? route.continue()
          : route.abort(),
      );
      await page.goto(scene.origin + "/revscape-scene.html");
      await page.waitForFunction(() => window.__done === true, undefined, {
        timeout: 15000,
      });
      if (failures.length)
        throw new Error("Scene errors: " + failures.join(", "));
      await page
        .locator("canvas")
        .screenshot({ path: path.join(options.output, "revscape-scene.png") });
      console.log("Rendered revscape-scene.png");
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    if (scene) await new Promise((resolve) => scene.server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
