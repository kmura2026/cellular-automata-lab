// Records the web demo for the README: one frame per drawn row.
// Usage: node scripts/record-demo.mjs [out]  (default docs/demo.gif; an out ending in .png
// saves only the last frame). Run via `npm run record:demo`, which builds web/ first.
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "@playwright/test";
import gifenc from "gifenc";
import { PNG } from "pngjs";

const { GIFEncoder, applyPalette, quantize } = gifenc;
const out = process.argv[2] ?? "docs/demo.gif";
const ROW_MS = 50; // matches ROW_DELAY_MS in web/app.js
const TYPES = { ".html": "text/html", ".js": "text/javascript" };

// Serve web/ on a free local port, so no separate server is needed.
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname; // URL parsing removes ".." segments
  try {
    const body = await readFile(join("web", path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "text/html" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 660 } });
// The demo's timers run only when step() is called, so every row gets exactly one frame.
await page.addInitScript(() => {
  const queue = [];
  window.setTimeout = (fn, _ms, ...args) => queue.push(() => fn(...args));
  window.step = () => {
    for (const f of queue.splice(0)) f();
  };
});

const frames = [];
const shot = async (delay) => {
  frames.push({ png: PNG.sync.read(await page.screenshot()), delay });
};

/** Captures every row of the running drawing, then holds the finished pattern. */
const captureRows = async (hold) => {
  const rows = await page.evaluate(() => Number(document.getElementById("generations").value) + 1);
  for (let y = 0; y < rows; y++) {
    await shot(y === rows - 1 ? hold : ROW_MS);
    await page.evaluate(() => window.step());
  }
};

/** Types a rule into the Rule field key by key and presses Draw. */
const drawRule = async (rule) => {
  const input = page.locator("#rule");
  await input.click();
  await input.press("Control+a");
  await shot(400);
  for (const ch of rule) {
    await input.press(ch);
    await shot(250);
  }
  await page.locator("button").hover();
  await shot(600);
  await page.locator("button").click();
};

await page.goto(`http://127.0.0.1:${server.address().port}/`);
await captureRows(1500); // rule 30 is drawn on load
await drawRule("90");
await captureRows(1500);
await drawRule("110");
await captureRows(2500);
await browser.close();
server.close();

const { width, height } = frames[0].png;
if (out.endsWith(".png")) {
  await writeFile(out, PNG.sync.write(frames.at(-1).png));
} else {
  // One shared palette; pixels unchanged since the previous frame are transparent,
  // which keeps the file small.
  const sample = Buffer.concat([0, 40, frames.length - 1].map((i) => frames[i].png.data));
  const palette = quantize(sample, 255);
  const transparentIndex = palette.length;
  const gif = GIFEncoder();
  let prev;
  for (const { png, delay } of frames) {
    const index = applyPalette(png.data, palette);
    const pixels = index.slice();
    for (let i = 0; prev && i < pixels.length; i++) {
      if (index[i] === prev[i]) pixels[i] = transparentIndex;
    }
    gif.writeFrame(pixels, width, height, {
      palette: prev ? undefined : [...palette, [0, 255, 0]],
      delay,
      transparent: !!prev,
      transparentIndex,
      dispose: 1,
    });
    prev = index;
  }
  gif.finish();
  await writeFile(out, gif.bytes());
}
console.log(`${out}: ${frames.length} frames, ${width}x${height}`);
