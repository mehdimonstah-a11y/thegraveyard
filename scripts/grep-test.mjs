import fs from "node:fs/promises";
import path from "node:path";

/**
 * Test 5 of the reference brief, and the copy bans from the build brief, in
 * one gate. Runs in CI; a hit fails the build rather than filing a note.
 *
 * Two families of ban:
 *   REFERENCE — anything a screenshot of gmicloud.ai would reveal. Hexes,
 *               typefaces, section headings, CTA strings.
 *   PRODUCT   — the build brief's own prohibitions. Restoration language, and
 *               the macabre-cute vocabulary the tone depends on avoiding.
 */

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "data", "out", ".vercel"]);
/**
 * The analysis documents are exempt, and nothing else is.
 *
 * Four files exist to record what the reference is — its measurements, its
 * palette, its type, and every place we departed from it — so that no shipped
 * surface has to carry any of it. Plus this file, which names every banned
 * string in order to ban it.
 *
 * Every other file in the repository is subject to every ban below: all of
 * src/, all styles, the README, DECISIONS, DESIGN_PLAN, the twitter kit, the
 * scan scripts and the published dataset.
 */
const SKIP_FILES = new Set([
  "grep-test.mjs",
  "REFERENCE-TEARDOWN.md",
  "DIVERGENCE.md",
  "SPEC.md",
  "DEVIATIONS.md",
]);

const BANS = [
  // ── reference palette ────────────────────────────────────────────────
  { re: /#?\bDDEA4D\b/i, why: "reference accent hex" },
  { re: /\b221,\s*234,\s*77\b/, why: "reference accent, rgb form" },
  { re: /#262626\b/i, why: "reference neutral" },
  { re: /#A3A3A3\b/i, why: "reference neutral" },
  { re: /#0A0A0A\b/i, why: "reference neutral" },
  { re: /#171717\b/i, why: "reference neutral" },
  // ── reference typefaces ──────────────────────────────────────────────
  { re: /alpha[\s-]?lyrae/i, why: "reference typeface" },
  { re: /\bgeist(\s|-)?mono\b/i, why: "reference typeface" },
  { re: /\bSPACERR\b/i, why: "reference wordmark face" },
  // ── reference copy ───────────────────────────────────────────────────
  { re: /start in console/i, why: "reference CTA" },
  { re: /contact sales/i, why: "reference CTA" },
  { re: /scale for success/i, why: "reference heading" },
  { re: /inference[- ]first by design/i, why: "reference heading" },
  { re: /serverless by default/i, why: "reference heading" },
  { re: /when serverless isn/i, why: "reference heading" },
  { re: /trusted by leading/i, why: "reference heading" },
  { re: /one cloud for/i, why: "reference headline" },
  { re: /gmi\s?cloud/i, why: "reference brand" },
  // ── build brief: never imply restoration ─────────────────────────────
  { re: /\breclaim/i, why: "build brief: implies restoration" },
  { re: /recover(ing)?\s+(your\s+)?(losses|loss)/i, why: "build brief: implies restoration" },
  { re: /\brestore\b/i, why: "build brief: implies restoration" },
  { re: /get\s+(your\s+)?money\s+back(?!\.)/i, why: "only permitted inside the ugly part, negated" },
  { re: /make\s+you\s+whole/i, why: "implies restoration" },
  // ── build brief: the tone is a salvage yard, not Halloween ───────────
  { re: /\bskulls?\b/i, why: "build brief: macabre-cute" },
  { re: /\btombstones?\b/i, why: "build brief: macabre-cute" },
  { re: /\bcoffins?\b/i, why: "build brief: macabre-cute" },
  { re: /\bghosts?\b/i, why: "build brief: macabre-cute" },
  { re: /rest in peace/i, why: "build brief: macabre-cute" },
  { re: /\bR\.?I\.?P\.?\b/, why: "build brief: macabre-cute" },
  { re: /\bgothic\b/i, why: "build brief: banned styling" },
];

/** Files whose whole job is to quote the brief. Checked, but restoration
 *  language is allowed where it is explicitly being ruled out. */
const NEGATION_OK = /\bnever\b|\bnot\b|\bno\b|\bbanned\b|\bban\b|\bavoid\b|\brefus/i;

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json", ".md", ".html", ".svg", ".txt"]);

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(path.join(dir, e.name));
    } else if (EXTS.has(path.extname(e.name)) && !SKIP_FILES.has(e.name)) {
      yield path.join(dir, e.name);
    }
  }
}

const hits = [];
for await (const file of walk(ROOT)) {
  const text = await fs.readFile(file, "utf8");
  const lines = text.split(/\r?\n/);
  for (const ban of BANS) {
    lines.forEach((line, i) => {
      if (!ban.re.test(line)) return;
      // A line that explicitly forbids the phrase is the point, not a breach.
      if (NEGATION_OK.test(line) && /brief|ban|grep|never|refus/i.test(line)) return;
      hits.push({ file: path.relative(ROOT, file), line: i + 1, why: ban.why, text: line.trim().slice(0, 110) });
    });
  }
}

if (hits.length === 0) {
  console.log(`grep test: clean. ${BANS.length} patterns, 0 hits.`);
  process.exit(0);
}
console.error(`grep test: ${hits.length} hit(s)\n`);
for (const h of hits) console.error(`  ${h.file}:${h.line}  [${h.why}]\n    ${h.text}`);
process.exit(1);
