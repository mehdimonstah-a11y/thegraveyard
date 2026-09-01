// Audio for the 10-second announcement.
//
//   node music-announce.mjs   ->  out/announce.wav
//
// One sustained bed, six taps as the field fills, one hard hit when the wall
// lands, a settle on the collapse, and then the thing this score exists for:
// during the reach, the taps come at intervals that stretch on the same
// asymptotic curve the picture is drawing. The audio slows toward a limit it
// does not arrive at, and stops because the film stops rather than because it
// resolved.
//
// No riser, no whoosh, no stock transition swell. Those are what make a short
// film sound like a template.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 48000;
const FPS = 30;
const DUR = 10.0;
const N = Math.round(SR * DUR);
const f = (frame) => frame / FPS;

/* The beat grid, transcribed from announce.html. If a cut moves there, it has
   to move here — the two files are not wired together, and that is the one
   place this build can drift. */
const B = {
  fieldIn: 10, wallIn: 88, collapse: 112, collapseEnd: 152,
  logoIn: 156, subIn: 190, urlIn: 216, reachIn: 244, reachEnd: 286, black: 296,
};

const L = new Float32Array(N), R = new Float32Array(N);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Deterministic noise. A fixed seed so the same command produces the same
   waveform, byte for byte, on every machine. */
let seed = 20260831;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function place(buf, atSec, gain, pan = 0) {
  const start = Math.round(atSec * SR);
  const gl = gain * Math.min(1, 1 - pan * 0.85);
  const gr = gain * Math.min(1, 1 + pan * 0.85);
  for (let i = 0; i < buf.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    L[j] += buf[i] * gl;
    R[j] += buf[i] * gr;
  }
}

/* ── the bed ───────────────────────────────────────────────────────
   An open fifth, detuned, from the first grave to the last frame. It
   is the only thing carrying duration, so it must never call attention
   to itself: no vibrato, no movement other than a filter that opens as
   the field fills and closes again once the mark has landed. */
function bed() {
  const start = f(B.fieldIn);
  const len = Math.round((DUR - start) * SR);
  const buf = new Float32Array(len);
  const roots = [55, 55.28, 82.5, 82.9, 110];   // A1, its fifth, an octave
  const phases = roots.map(() => 0);
  let lp = 0;

  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const abs = start + t;

    // Envelope: in over 0.9 s, full through the wall, easing down under the
    // lockup so the type is read in near-silence.
    let env = clamp(t / 0.9, 0, 1);
    if (abs > f(B.logoIn) / 1) env *= clamp(1 - (abs - f(B.logoIn)) / 3.6, 0.32, 1);
    if (abs > DUR - 0.7) env *= clamp((DUR - abs) / 0.7, 0, 1);

    let s = 0;
    for (let v = 0; v < roots.length; v++) {
      phases[v] += (2 * Math.PI * roots[v]) / SR;
      // Triangle-ish: a sine plus a quiet third harmonic. Warm, not buzzy.
      s += Math.sin(phases[v]) * 0.5 + Math.sin(phases[v] * 3) * 0.045;
    }
    s /= roots.length;

    // One-pole low-pass that opens as the field fills and shuts after it.
    const open = abs < f(B.wallIn)
      ? 0.05 + 0.22 * clamp((abs - start) / (f(B.wallIn) - start), 0, 1)
      : 0.27 - 0.16 * clamp((abs - f(B.wallIn)) / 2.2, 0, 1);
    lp += open * (s - lp);
    buf[i] = lp * env * 0.34;
  }
  place(buf, start, 1);
}

/* ── a tap ─────────────────────────────────────────────────────────
   A grave landing. Short, dry, pitched high enough to sit above the
   bed without ever competing with it. */
function tap(atSec, gain, hz = 1760, decay = 0.055, pan = 0) {
  const len = Math.round(decay * 3 * SR);
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const e = Math.exp(-t / decay);
    buf[i] = (Math.sin(2 * Math.PI * hz * t) * 0.7 + rnd() * 0.12) * e;
  }
  place(buf, atSec, gain, pan);
}

/* ── the hit ───────────────────────────────────────────────────────
   The wall arriving. The loudest event in the film and the only one
   with any low end to it: a pitched-down body under a short filtered
   noise transient. It should sound like something being set down, not
   like an impact effect. */
function hit(atSec, gain) {
  const len = Math.round(1.5 * SR);
  const buf = new Float32Array(len);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const body = Math.sin(2 * Math.PI * (92 * Math.exp(-t * 7) + 48) * t);
    const crack = rnd() * Math.exp(-t / 0.014);
    lp += 0.42 * (crack - lp);
    buf[i] = body * Math.exp(-t / 0.34) * 0.85 + lp * 0.5;
  }
  place(buf, atSec, gain);
}

/* ── a settle ──────────────────────────────────────────────────────
   Low, soft, no transient. Used where something resolves rather than
   arrives. */
function settle(atSec, gain, hz = 110) {
  const len = Math.round(2.2 * SR);
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const a = clamp(t / 0.05, 0, 1);
    buf[i] = (Math.sin(2 * Math.PI * hz * t) + Math.sin(2 * Math.PI * hz * 1.5 * t) * 0.4)
      * a * Math.exp(-t / 0.75);
  }
  place(buf, atSec, gain);
}

// ── the score ──────────────────────────────────────────────────────
bed();

/* Six taps as the field fills — every third grave, so the ear reads a
   rhythm rather than eighteen separate events. */
for (let i = 0; i < 18; i += 3) {
  const landed = B.fieldIn + i * 3 + 22;
  tap(f(landed), 0.16, 1760 - i * 26, 0.05, (i / 18) * 1.2 - 0.6);
}

hit(f(B.wallIn), 0.92);
settle(f(B.collapse), 0.30, 110);
settle(f(B.collapseEnd), 0.22, 82.5);
tap(f(B.logoIn), 0.20, 2093, 0.12);
tap(f(B.subIn), 0.11, 1568, 0.09);
tap(f(B.urlIn), 0.11, 2349, 0.09);

/* ── the reach ─────────────────────────────────────────────────────
   Taps at intervals that stretch on out(u) = u/(1+u) — the same curve
   the top bar is drawing. Each one is quieter and later than the last,
   and the series is still going when the film ends, because it would
   still be going in an hour. */
{
  const t0 = f(B.reachIn), t1 = f(B.reachEnd);
  for (let n = 1; n <= 9; n++) {
    const u = n * 0.9;
    const at = t0 + (t1 - t0) * (u / (1 + u)) / (9 * 0.9 / (1 + 9 * 0.9));
    if (at >= t1) break;
    tap(at, 0.085 * Math.pow(0.86, n), 1976 - n * 34, 0.045, 0.2);
  }
}

// ── master ─────────────────────────────────────────────────────────
// A short fade at both ends so the file cannot click, and a soft clip
// well under full scale — the encode applies loudnorm on top of this.
const FADE = Math.round(0.012 * SR);
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / FADE, (N - i) / FADE);
  L[i] *= g; R[i] *= g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = peak > 0 ? Math.min(1, 0.72 / peak) : 1;

const bytes = Buffer.alloc(44 + N * 4);
bytes.write("RIFF", 0); bytes.writeUInt32LE(36 + N * 4, 4); bytes.write("WAVE", 8);
bytes.write("fmt ", 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
bytes.writeUInt16LE(2, 22); bytes.writeUInt32LE(SR, 24); bytes.writeUInt32LE(SR * 4, 28);
bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34);
bytes.write("data", 36); bytes.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const l = Math.round(clamp(L[i] * norm, -1, 1) * 32767);
  const r = Math.round(clamp(R[i] * norm, -1, 1) * 32767);
  bytes.writeInt16LE(l, 44 + i * 4);
  bytes.writeInt16LE(r, 46 + i * 4);
}
mkdirSync("out", { recursive: true });
writeFileSync("out/announce.wav", bytes);
console.log(`out/announce.wav  ${DUR.toFixed(1)}s  ${(bytes.length / 1e6).toFixed(2)} MB  peak ${(peak * norm).toFixed(3)}`);
