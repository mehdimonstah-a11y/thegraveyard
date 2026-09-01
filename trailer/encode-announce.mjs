// Encode the announcement in every delivery format, then gate it.
//
// Timing and audio are identical across all three crops — the type is re-laid
// in the renderer, never letterboxed — so the same wav is muxed onto each.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, statSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

/* ffmpeg-static lives in a sibling project. It is a build-time binary and
   there is no reason for this repository to carry a second copy of it. */
const require_ = createRequire(import.meta.url);
const ffmpeg = require_("../../containur/node_modules/ffmpeg-static");

mkdirSync("out", { recursive: true });
const run = (a) => execFileSync(ffmpeg, a, { stdio: ["ignore", "pipe", "pipe"] });
const probe = (a) => { const r = spawnSync(ffmpeg, a, { encoding: "utf8" }); return (r.stdout || "") + (r.stderr || ""); };
const mb = (p) => (statSync(p).size / 1e6).toFixed(2) + " MB";

/* Named in words, not ratios. "16x9" and "9x16" are the same four characters
   in a different order, which is a genuinely easy thing to misread at a
   glance — and posting the vertical cut to a timeline that wanted the
   horizontal one is exactly the mistake that naming invites. */
const FORMATS = [
  { id: "16x9", out: "out/thegraveyard-waitlist-HORIZONTAL-1920x1080.mp4" },
  { id: "1x1", out: "out/thegraveyard-waitlist-SQUARE-1080x1080.mp4" },
  { id: "9x16", out: "out/thegraveyard-waitlist-VERTICAL-1080x1920.mp4" },
];

for (const fmt of FORMATS) {
  const dir = `frames-${fmt.id}`;
  if (!existsSync(dir)) { console.log(`skip ${fmt.id} — ${dir} not rendered`); continue; }
  run([
    "-y", "-framerate", "30", "-i", `${dir}/f%04d.png`, "-i", "out/announce.wav",
    "-c:v", "libx264", "-profile:v", "high", "-level", "4.1",
    "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.85:level=disabled",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-shortest", "-movflags", "+faststart", fmt.out,
  ]);
  console.log(`${fmt.id.padEnd(5)} ${fmt.out}  ${mb(fmt.out)}`);
}

/* The poster: f230. Deliberately NOT the last frame — by f244 the top bar has
   begun its reach and is longer than the mark ever is, so a poster taken from
   the end would ship a non-canonical logo as the thumbnail. f230 is the mark
   at rest with the full lockup already on screen. */
if (existsSync("frames-16x9/f0230.png")) {
  run(["-y", "-i", "frames-16x9/f0230.png", "-q:v", "2", "out/poster-waitlist.jpg"]);
  console.log(`poster out/poster-waitlist.jpg  ${mb("out/poster-waitlist.jpg")}`);
}

/* ══ THE DELIVERY GATE ══
   A silent render is a failed deliverable, and a stream that exists but is
   silent fails identically — so this measures the waveform, not the header. */
let failed = false;
const check = (ok, label) => { if (!ok) failed = true; console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`); };

for (const fmt of FORMATS) {
  if (!existsSync(fmt.out)) continue;
  console.log(`\n── gate: ${fmt.out} ──`);
  const info = probe(["-hide_banner", "-i", fmt.out]);
  const a = info.match(/Stream #\d+:\d+.*?: Audio: (\w+).*?(\d+) Hz.*?(\d+) kb\/s/);
  const dur = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const secs = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;

  check(Boolean(a), "audio stream present");
  check(a && a[1] === "aac", "codec is aac");
  check(a && +a[2] === 48000, "48 kHz");
  check(a && +a[3] > 0, "non-zero bitrate");
  check(Math.abs(secs - 10.0) < 0.06, `duration ≈ 10.0 s (${secs.toFixed(2)})`);

  const vol = probe(["-hide_banner", "-i", fmt.out, "-af", "volumedetect", "-f", "null", "-"]);
  const mean = vol.match(/mean_volume: (-?[\d.]+) dB/);
  const peak = vol.match(/max_volume: (-?[\d.]+) dB/);
  check(Boolean(mean) && parseFloat(mean[1]) > -60, "waveform is not silence");
  check(Boolean(peak) && parseFloat(peak[1]) <= -1.0, "true peak ≤ −1.0 dBTP");
  if (mean && peak) console.log(`  mean ${mean[1]} dB   peak ${peak[1]} dB`);
}

console.log(failed ? "\nGATE FAILED — do not hand this off." : "\ngate passed.");
process.exit(failed ? 1 : 0);
