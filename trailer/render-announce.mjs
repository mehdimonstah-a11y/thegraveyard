// Render the 10-second announcement.
//
//   node render-announce.mjs 16x9            all 300 frames
//   node render-announce.mjs 16x9 90 152     just those frames, into preview/
//
// Every frame is a screenshot of `render(f)` in real Chrome. The film has no
// clock and no requestAnimationFrame, so the same frame number always produces
// the same pixels and the beat grid is a guarantee rather than a hope.
import puppeteer from "../../containur/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const EXE = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FORMAT = process.argv[2] || "16x9";
const picked = process.argv.slice(3).map(Number).filter((n) => Number.isFinite(n));
const OUT = picked.length ? "preview" : `frames-${FORMAT}`;

if (!picked.length && existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: "new",
  args: [
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--font-render-hinting=none",
  ],
});

const page = await browser.newPage();
await page.evaluateOnNewDocument((fmt) => { window.FORMAT = fmt; }, FORMAT);
await page.goto(pathToFileURL(resolve("announce.html")).href, { waitUntil: "networkidle0", timeout: 60000 });

/* `document.fonts.ready` resolves immediately when nothing has triggered a
   load, so awaiting it alone can render every frame in the fallback face. Load
   each face explicitly and confirm it before a single frame is taken. */
const fontsOk = await page.evaluate(async () => {
  const want = ["600 116px Archivo", "400 30px Archivo", "500 26px 'IBM Plex Mono'"];
  await Promise.all(want.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  return want.map((f) => `${f.split(" ").pop()}:${document.fonts.check(f)}`);
});
console.log("  fonts →", fontsOk.join("  "));
await new Promise((r) => setTimeout(r, 400));

const { W, H } = await page.evaluate(() => ({ W: window.FMT.W, H: window.FMT.H }));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const TOTAL = await page.evaluate(() => window.TOTAL);

const list = picked.length ? picked : Array.from({ length: TOTAL }, (_, i) => i);
const t0 = Date.now();
for (const f of list) {
  await page.evaluate((n) => window.render(n), f);
  await page.screenshot({ path: `${OUT}/f${String(f).padStart(4, "0")}.png` });
  if (!picked.length && f % 60 === 0) process.stdout.write(`  ${f}/${TOTAL}\n`);
}
await browser.close();
console.log(`${FORMAT}: ${list.length} frames → ${OUT}/ in ${((Date.now() - t0) / 1000).toFixed(0)}s  (${W}×${H})`);
