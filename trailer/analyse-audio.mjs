// What is actually wrong with a wav.
//
//   node analyse-audio.mjs out/announce.wav
//
// Written because "sounds bad" is not a bug report and guessing twice is not a
// method. This reports the things that make a synthesised cue unpleasant:
// harsh top end, resonant peaks that ring, a muddy low-mid, and an overall
// balance that is nothing like music.
import { readFileSync } from "node:fs";

const path = process.argv[2] || "out/announce.wav";
const buf = readFileSync(path);

// Minimal 16-bit PCM WAV reader; this only ever reads files we wrote.
const ch = buf.readUInt16LE(22);
const SR = buf.readUInt32LE(24);
let off = 12;
while (off < buf.length - 8) {
  const id = buf.toString("ascii", off, off + 4);
  const size = buf.readUInt32LE(off + 4);
  if (id === "data") { off += 8; break; }
  off += 8 + size;
}
const frames = Math.floor((buf.length - off) / (2 * ch));
const L = new Float64Array(frames), R = new Float64Array(frames);
for (let i = 0; i < frames; i++) {
  L[i] = buf.readInt16LE(off + i * 2 * ch) / 32768;
  R[i] = ch > 1 ? buf.readInt16LE(off + i * 2 * ch + 2) / 32768 : L[i];
}
const mono = new Float64Array(frames);
for (let i = 0; i < frames; i++) mono[i] = (L[i] + R[i]) / 2;

console.log(`${path}  ${(frames / SR).toFixed(2)}s  ${SR} Hz  ${ch}ch`);

// ── level ──────────────────────────────────────────────────────────
let peak = 0, sum = 0, nan = 0;
for (let i = 0; i < frames; i++) {
  if (!Number.isFinite(mono[i])) nan++;
  peak = Math.max(peak, Math.abs(mono[i]));
  sum += mono[i] * mono[i];
}
const db = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : "-inf");
console.log(`peak ${db(peak)} dBFS   rms ${db(Math.sqrt(sum / frames))} dBFS   non-finite ${nan}`);

/* ── spectrum ──────────────────────────────────────────────────────
   A Goertzel sweep rather than an FFT: we want energy in a fixed set of
   bands, not a full transform, and this keeps the file dependency-free. */
function bandEnergy(sig, from, to, f0, f1) {
  const n = to - from;
  let total = 0;
  const bands = 48;
  const out = [];
  for (let b = 0; b < bands; b++) {
    const hz = f0 * Math.pow(f1 / f0, b / (bands - 1));
    const w = (2 * Math.PI * hz) / SR;
    const coeff = 2 * Math.cos(w);
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = from; i < to; i++) {
      s0 = sig[i] + coeff * s1 - s2;
      s2 = s1; s1 = s0;
    }
    const mag = Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / n;
    out.push({ hz, mag });
    total += mag;
  }
  return { out, total };
}

const { out: spec } = bandEnergy(mono, 0, frames, 40, 16000);
const maxMag = Math.max(...spec.map((s) => s.mag));
console.log("\nspectrum (whole file, normalised):");
for (const s of spec.filter((_, i) => i % 3 === 0)) {
  const n = Math.round((s.mag / maxMag) * 46);
  console.log(`${String(Math.round(s.hz)).padStart(6)} Hz  ${"█".repeat(n)}${n === 0 ? "·" : ""}`);
}

/* Where the energy sits, in four coarse buckets. A cue that is pleasant
   has most of its energy in the low-mid and mid; one that is harsh has a
   fat tail above 5 kHz. */
const bucket = (lo, hi) => spec.filter((s) => s.hz >= lo && s.hz < hi).reduce((a, s) => a + s.mag, 0);
const all = bucket(40, 16000);
console.log(`\nsub  40-120   ${((bucket(40, 120) / all) * 100).toFixed(1)}%`);
console.log(`low  120-500  ${((bucket(120, 500) / all) * 100).toFixed(1)}%`);
console.log(`mid  500-2k   ${((bucket(500, 2000) / all) * 100).toFixed(1)}%`);
console.log(`high 2k-6k    ${((bucket(2000, 6000) / all) * 100).toFixed(1)}%`);
console.log(`air  6k-16k   ${((bucket(6000, 16000) / all) * 100).toFixed(1)}%`);

/* ── resonance ─────────────────────────────────────────────────────
   The signature of a metallic reverb: a handful of narrow bands far
   louder than their neighbours, sustaining after the source stops. */
const late = bandEnergy(mono, Math.round(frames * 0.88), frames, 100, 8000).out;
const lateMax = Math.max(...late.map((s) => s.mag));
const spikes = late
  .map((s, i) => ({ ...s, ratio: s.mag / ((late[i - 1]?.mag ?? s.mag) + (late[i + 1]?.mag ?? s.mag) + 1e-12) * 2 }))
  .filter((s) => s.mag > lateMax * 0.25 && s.ratio > 1.7);
console.log(`\ntail resonances (last 12%): ${spikes.length ? spikes.map((s) => Math.round(s.hz) + "Hz").join(", ") : "none"}`);

// ── envelope, per 250 ms ───────────────────────────────────────────
console.log("\nlevel over time:");
const step = Math.round(SR * 0.25);
for (let i = 0; i + step <= frames; i += step) {
  let s = 0;
  for (let j = i; j < i + step; j++) s += mono[j] * mono[j];
  const r = Math.sqrt(s / step);
  const n = Math.max(0, Math.round((20 * Math.log10(r + 1e-9) + 60) / 1.4));
  console.log(`${(i / SR).toFixed(2)}s ${String(db(r)).padStart(6)}  ${"▌".repeat(n)}`);
}
