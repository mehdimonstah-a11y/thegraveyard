import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import puppeteer from "../../containur/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

/**
 * Export the launch post cards.
 *
 * Five 1600x900 images, one per post. Rendered in real Chrome for the same
 * reason the brand sheet is: the type is Archivo and IBM Plex Mono, and no
 * SVG rasteriser will load a webfont.
 */
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const HTML = pathToFileURL(path.resolve("scripts/cards.html")).href;
const OUT = "public/brand/posts";

const CARDS = [
  { id: "c1", file: "01-the-census.png" },
  { id: "c2", file: "02-the-overstatement.png" },
  { id: "c3", file: "03-the-asymptote.png" },
  { id: "c4", file: "04-tradeability.png" },
  { id: "c5", file: "05-the-honest-one.png" },
  { id: "c6", file: "06-the-logo-is-the-maths.png" },
  { id: "c7", file: "07-the-cut.png" },
  { id: "c8", file: "08-asserted-not-claimed.png" },
  { id: "c9", file: "09-the-correction.png" },
  { id: "c10", file: "10-the-empty-archive.png" },
  { id: "c11", file: "11-out-now.png" },
];

await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--force-device-scale-factor=1", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1760, height: 1100, deviceScaleFactor: 2 });
await page.goto(HTML, { waitUntil: "networkidle0" });
await page.evaluate(async () => {
  await Promise.all(["500 250px 'IBM Plex Mono'", "600 26px Archivo", "400 30px Archivo"].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
});
await new Promise((r) => setTimeout(r, 600));

for (const c of CARDS) {
  const el = await page.$(`#${c.id}`);
  if (!el) throw new Error(`cards.html has no #${c.id}`);
  await el.screenshot({ path: path.join(OUT, c.file) });
  console.log(`${OUT}/${c.file}  3200x1800 (2x of 1600x900)`);
}
await browser.close();
