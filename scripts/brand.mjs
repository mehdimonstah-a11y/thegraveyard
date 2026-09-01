import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import puppeteer from "../../containur/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { createRequire } from "node:module";

/**
 * Export the brand.
 *
 * Rendered in real Chrome and screenshotted rather than rasterised from SVG,
 * because the wordmark is set in Archivo and neither librsvg nor sharp will
 * load a webfont. Chrome has it, so the exported PNG carries the same
 * letterforms the site does.
 *
 * Everything is shot at deviceScaleFactor 2 and written down to the size its
 * filename claims, so the edges of the mark stay clean at avatar sizes.
 */

/** Both tools live in sibling projects rather than this one: they are build-time
 *  only, and adding a native image dependency to a site that ships no images
 *  would be the wrong trade. */
const require_ = createRequire(import.meta.url);
const sharp = require_("../../koupon/node_modules/sharp");

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const HTML = pathToFileURL(path.resolve("scripts/brand.html")).href;
const OUT = "public/brand";

const SHOTS = [
  { id: "banner", file: "twitter-banner-1500x500.png", w: 1500, h: 500, retina: "twitter-banner@2x.png" },
  { id: "avatar", file: "avatar-1024.png", w: 1024, h: 1024, sizes: [512, 400, 200, 96, 48] },
  { id: "icon", file: "icon-512.png", w: 512, h: 512 },
  { id: "wordmark", file: "wordmark.png", w: 1200, h: 360, transparent: true },
  { id: "wordmark-dark", file: "wordmark-on-dark.png", w: 1200, h: 360 },
];

await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--force-device-scale-factor=1", "--font-render-hinting=none"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1700, height: 1200, deviceScaleFactor: 2 });
await page.goto(HTML, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
// document.fonts.ready resolves before the first paint with the new faces.
await new Promise((r) => setTimeout(r, 700));

for (const s of SHOTS) {
  const el = await page.$(`#${s.id}`);
  if (!el) throw new Error(`brand.html has no #${s.id}`);
  const buf = await el.screenshot({ omitBackground: Boolean(s.transparent) });

  if (s.retina) {
    await fs.writeFile(path.join(OUT, s.retina), buf);
    console.log(`${OUT}/${s.retina}  ${s.w * 2}x${s.h * 2}`);
  }
  await sharp(buf).resize(s.w, s.h, { fit: "fill" }).png({ compressionLevel: 9 }).toFile(path.join(OUT, s.file));
  console.log(`${OUT}/${s.file}  ${s.w}x${s.h}`);

  for (const size of s.sizes ?? []) {
    const name = s.file.replace(/-\d+\.png$/, `-${size}.png`);
    await sharp(buf).resize(size, size, { fit: "fill" }).png({ compressionLevel: 9 }).toFile(path.join(OUT, name));
    console.log(`${OUT}/${name}  ${size}x${size}`);
  }
}

await browser.close();

/**
 * The mark as a standalone SVG, for anywhere a vector is wanted. Written from
 * the same geometry the site renders, so the two cannot drift.
 */
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="The Graveyard">
  <title>The Graveyard</title>
  <rect x="7" y="11" width="39" height="10" fill="#F2833F"/>
  <rect x="7" y="27" width="28" height="10" fill="#F2833F"/>
  <rect x="7" y="43" width="17" height="10" fill="#F2833F"/>
  <rect x="49.5" y="5" width="3.5" height="54" fill="#EBECEC"/>
</svg>
`;
const MARK_SVG_LIGHT = MARK_SVG.replace('fill="#EBECEC"', 'fill="#0B0D10"');

await fs.writeFile(path.join(OUT, "mark.svg"), MARK_SVG);
await fs.writeFile(path.join(OUT, "mark-on-light.svg"), MARK_SVG_LIGHT);
console.log(`${OUT}/mark.svg`);
console.log(`${OUT}/mark-on-light.svg`);
