// Audio for the 10-second announcement.
//
//   node music-announce.mjs         ->  out/announce.wav
//   node analyse-audio.mjs out/announce.wav
//
// ── why this file was rewritten twice ──────────────────────────────
// The first pass was a detuned drone with filtered noise on it. The second
// added chords but `analyse-audio.mjs` said what was actually wrong, and it
// was not the notes:
//
//     sub  40-120   66.3%      <- almost all of the energy
//     low  120-500  24.6%
//     mid  500-2k    8.5%      <- where music lives
//     high 2k-6k     0.6%
//     air  6k-16k    0.0%
//     tail resonances: 132Hz, 588Hz
//
// A boom with something faint over it, and a reverb ringing on two notes.
// Both are mix problems, not composition problems, so this version fixes the
// mix: an FM electric piano with real harmonic content instead of sine stacks,
// a convolution reverb built from decaying noise instead of four Schroeder
// combs that ring, no dedicated sub at all, and a master EQ that high-passes
// the mud and opens the top.
//
// What it measures now:
//
//     sub  40-120   15.8%
//     low  120-500  29.8%
//     mid  500-2k   48.3%      <- the melody, where it belongs
//     high 2k-6k     5.8%
//
// The two frequencies still flagged in the tail are C3 and D5 — the last
// chord's root and the note at 7.85s, both still decaying when the picture
// cuts. They are notes, not modes. Re-run analyse-audio.mjs after any change
// to this file; "sounds fine to me" is how the first two versions shipped.
//
// ── the piece ──────────────────────────────────────────────────────
// A minor, five chords, landing on the picture's cuts rather than a metronome:
//
//   0.33s  Am    the field begins to fill
//   2.93s  F     the wall lands            <- the moment
//   5.20s  C     the mark resolves, the wordmark appears
//   7.20s  G     the url
//   8.60s  C     home, under the reach
//
// Voice-leading: A3 C4 E4 -> A3 C4 F4 -> G3 C4 E4 -> G3 B3 D4 -> G3 C4 E4.
// One or two voices move at a time and the rest hold.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 48000;
const FPS = 30;
const DUR = 10.0;
const N = Math.round(SR * DUR);
const f = (frame) => frame / FPS;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* The beat grid, transcribed from announce.html. If a cut moves there it has to
   move here — the two files are not wired together. */
const B = {
  fieldIn: 10, wallIn: 88, collapse: 112, collapseEnd: 152,
  logoIn: 156, subIn: 190, urlIn: 216, reachIn: 244, reachEnd: 286, black: 296,
};

/* Equal temperament, A4 = 440, written out so the voicings read as music.
   A missing note is `undefined` -> NaN -> a silent file that passes a
   "not silence" check, which is exactly what happened with F5 once. */
const HZ = {
  E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, C3: 130.81, D3: 146.83,
  E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 784.0, A5: 880.0,
};
for (const [name, hz] of Object.entries(HZ)) {
  if (!Number.isFinite(hz) || hz <= 0) throw new Error(`HZ.${name} is not a frequency`);
}
const note = (n) => {
  const hz = HZ[n];
  if (!Number.isFinite(hz)) throw new Error(`no such note: ${n}`);
  return hz;
};

const dryL = new Float64Array(N), dryR = new Float64Array(N);
const sendL = new Float64Array(N), sendR = new Float64Array(N);

function add(buf, atSec, gain, pan, wet) {
  const start = Math.round(atSec * SR);
  const gl = gain * Math.cos(((pan + 1) / 2) * (Math.PI / 2)) * Math.SQRT2;
  const gr = gain * Math.sin(((pan + 1) / 2) * (Math.PI / 2)) * Math.SQRT2;
  for (let i = 0; i < buf.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    dryL[j] += buf[i] * gl;
    dryR[j] += buf[i] * gr;
    sendL[j] += buf[i] * gl * wet;
    sendR[j] += buf[i] * gr * wet;
  }
}

/* ── the keys ──────────────────────────────────────────────────────
   An FM electric piano: one carrier, one modulator at the same
   frequency, and a modulation index that falls away over ~0.3 s. That
   is the whole Rhodes recipe — bright and struck at the attack,
   settling to a near-sine as it decays, with harmonics up through
   4 kHz where the previous version had nothing at all.

   The "tine" is a high partial with a very short decay. It is what
   makes the attack read as a struck object rather than as an
   envelope on a sine. */
function keys(hz, atSec, gain, dur = 2.6, pan = 0, bright = 1) {
  const n = Math.round(Math.min(dur, DUR) * SR);
  const buf = new Float64Array(n);
  const I0 = 2.6 * bright;         // modulation index at the strike
  const IDEC = 0.32;               // and how fast it falls to a sine
  // A second modulator three octaves-and-a-fifth up, at a low index. One
  // operator at ratio 1 tops out around 3.4x the fundamental, which is why
  // the first mix measured 0.0% above 6 kHz; this puts real content up there
  // without the buzz that simply raising I0 would produce.
  const I2 = 0.85 * bright;
  const I2DEC = 0.13;
  const tau = dur / 3.2;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * hz * t);
    const mod2 = Math.sin(2 * Math.PI * hz * 3 * t);
    let s = Math.sin(
      2 * Math.PI * hz * t +
        I0 * Math.exp(-t / IDEC) * mod +
        I2 * Math.exp(-t / I2DEC) * mod2,
    );
    // The tine: the struck-metal transient. Louder and a little longer than
    // before, because it is most of what survives on a phone speaker.
    s += Math.sin(2 * Math.PI * hz * 9 * t) * 0.14 * Math.exp(-t / 0.07) * bright;
    s += Math.sin(2 * Math.PI * hz * 14 * t) * 0.05 * Math.exp(-t / 0.035) * bright;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / tau);
    buf[i] = s * env;
  }
  add(buf, atSec, gain, pan, 0.34);
}

/* ── the pad ───────────────────────────────────────────────────────
   The bed. Three voices, lightly detuned, with a gentle two-pole
   low-pass that leaves some 2-3 kHz in rather than the one-pole at
   1.3 kHz the last version used, which is part of why nothing was
   audible above the bass. Quiet by design: it is the floor, not the
   music. */
function pad(notes, atSec, len, gain) {
  const n = Math.round(len * SR);
  const buf = new Float64Array(n);
  const ATT = 0.5, REL = 1.0;
  for (const hz of notes) {
    let p1 = 0, p2 = 0, z1 = 0, z2 = 0;
    const d = hz * 0.0012;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      p1 += (2 * Math.PI * hz) / SR;
      p2 += (2 * Math.PI * (hz + d)) / SR;
      const s =
        (Math.sin(p1) + Math.sin(p2)) * 0.42 +
        Math.sin(p1 * 2) * 0.14 +
        Math.sin(p1 * 3) * 0.07 +
        Math.sin(p1 * 4) * 0.03;
      z1 += 0.42 * (s - z1);
      z2 += 0.42 * (z1 - z2);
      const env = Math.min(1, t / ATT) * Math.min(1, (len - t) / REL);
      buf[i] += z2 * clamp(env, 0, 1);
    }
  }
  add(buf, atSec, gain / notes.length, 0, 0.55);
}

/* ── FFT ───────────────────────────────────────────────────────────
   Iterative radix-2, in place. Only here so the reverb can be a real
   convolution; four Schroeder combs is what was ringing at 132 Hz. */
function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/* ── the impulse response ──────────────────────────────────────────
   Exponentially decaying noise, progressively darkened, with a short
   pre-delay and a handful of early reflections. It is diffuse from the
   first millisecond, which is the entire difference between this and a
   comb network: there are no resonant modes to ring on.

   A fixed seed per channel, so the file is byte-identical every run
   and the two channels are decorrelated rather than merely delayed. */
function impulse(seed, lenSec = 2.0) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const n = Math.round(lenSec * SR);
  const ir = new Float64Array(n);
  const PRE = Math.round(0.018 * SR);
  const TAU = 0.30;                       // ~1.9 s to -60 dB

  for (let i = PRE; i < n; i++) {
    const t = (i - PRE) / SR;
    ir[i] = rnd() * Math.exp(-t / TAU);
  }
  // A few early reflections, so the tail has a room in front of it.
  for (const [ms, g] of [[7, 0.5], [11, -0.38], [17, 0.3], [23, -0.24], [31, 0.19], [43, -0.14]]) {
    const j = Math.round((ms / 1000) * SR);
    if (j < n) ir[j] += g * (rnd() > 0 ? 1 : -1);
  }
  // Progressive darkening: the coefficient falls as the tail decays, so
  // the late reverb is warm rather than hissy.
  let z1 = 0, z2 = 0;
  for (let i = 0; i < n; i++) {
    const k = 0.34 * Math.exp(-(i / SR) / 1.1) + 0.05;
    z1 += k * (ir[i] - z1);
    z2 += k * (z1 - z2);
    ir[i] = z2;
  }
  // High-pass the tail so the reverb adds no low-end mud of its own.
  let hp = 0;
  for (let i = 0; i < n; i++) {
    hp += 0.010 * (ir[i] - hp);
    ir[i] -= hp;
  }
  let e = 0;
  for (let i = 0; i < n; i++) e += ir[i] * ir[i];
  const g = 1 / Math.sqrt(e || 1);
  for (let i = 0; i < n; i++) ir[i] *= g;
  return ir;
}

function convolve(sig, ir) {
  let size = 1;
  while (size < sig.length + ir.length) size <<= 1;
  const ar = new Float64Array(size), ai = new Float64Array(size);
  const br = new Float64Array(size), bi = new Float64Array(size);
  ar.set(sig); br.set(ir);
  fft(ar, ai, false);
  fft(br, bi, false);
  for (let i = 0; i < size; i++) {
    const r = ar[i] * br[i] - ai[i] * bi[i];
    const im = ar[i] * bi[i] + ai[i] * br[i];
    ar[i] = r; ai[i] = im;
  }
  fft(ar, ai, true);
  return ar.subarray(0, sig.length);
}

/* ── biquads, RBJ cookbook ─────────────────────────────────────────
   The master chain. The previous mix had 66% of its energy below
   120 Hz; most of that is removed here rather than by turning the
   bass down, because the bass notes themselves are wanted. */
function biquad(sig, b0, b1, b2, a1, a2) {
  const out = new Float64Array(sig.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < sig.length; i++) {
    const x = sig[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}
function highpass(sig, hz, q = 0.707) {
  const w = (2 * Math.PI * hz) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
  const a0 = 1 + al;
  return biquad(sig, ((1 + c) / 2) / a0, (-(1 + c)) / a0, ((1 + c) / 2) / a0, (-2 * c) / a0, (1 - al) / a0);
}
function peaking(sig, hz, q, gainDb) {
  const A = Math.pow(10, gainDb / 40);
  const w = (2 * Math.PI * hz) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
  const a0 = 1 + al / A;
  return biquad(sig, (1 + al * A) / a0, (-2 * c) / a0, (1 - al * A) / a0, (-2 * c) / a0, (1 - al / A) / a0);
}
function highshelf(sig, hz, gainDb) {
  const A = Math.pow(10, gainDb / 40);
  const w = (2 * Math.PI * hz) / SR, c = Math.cos(w), s = Math.sin(w);
  const al = (s / 2) * Math.sqrt(2);
  const tsa = 2 * Math.sqrt(A) * al;
  const a0 = A + 1 - (A - 1) * c + tsa;
  return biquad(
    sig,
    (A * (A + 1 + (A - 1) * c + tsa)) / a0,
    (-2 * A * (A - 1 + (A + 1) * c)) / a0,
    (A * (A + 1 + (A - 1) * c - tsa)) / a0,
    (2 * (A - 1 - (A + 1) * c)) / a0,
    (A + 1 - (A - 1) * c - tsa) / a0,
  );
}

// ══ the score ══════════════════════════════════════════════════════

const CHORDS = [
  { at: f(B.fieldIn), len: 3.0, notes: ["A3", "C4", "E4"], bass: "A2" },
  { at: f(B.wallIn), len: 2.7, notes: ["A3", "C4", "F4"], bass: "F2" },
  { at: f(B.logoIn), len: 2.5, notes: ["G3", "C4", "E4"], bass: "C3" },
  { at: f(B.urlIn), len: 1.9, notes: ["G3", "B3", "D4"], bass: "G2" },
  { at: 8.6, len: 1.6, notes: ["G3", "C4", "E4"], bass: "C3" },
];
for (const c of CHORDS) {
  pad(c.notes.map(note), c.at, c.len, 0.17);
  // The bass is the same instrument an octave down, not a sine — a sine
  // down there is the boom the analysis found, and it carries no pitch
  // information on a phone speaker.
  keys(note(c.bass), c.at, 0.115, 2.3, 0, 1.0);
}

/* The motif. Sparse under the field, opens at the wall, highest note on
   the frame the wordmark lands. */
keys(note("E4"), 0.60, 0.36, 2.4, -0.28);
keys(note("A4"), 1.40, 0.40, 2.3, 0.22);
keys(note("C5"), 2.10, 0.32, 2.0, -0.16);

// The wall: a third, together, the loudest event in the piece.
keys(note("A4"), f(B.wallIn), 0.52, 3.0, -0.12, 1.15);
keys(note("F5"), f(B.wallIn), 0.38, 2.4, 0.20, 1.15);

keys(note("C5"), 3.90, 0.34, 2.1, 0.24);
keys(note("A4"), 4.55, 0.30, 2.0, -0.22);

// The mark resolves and the wordmark lands: the top of the melody.
keys(note("E5"), f(B.logoIn), 0.48, 2.8, 0.0, 1.1);
keys(note("C5"), 5.95, 0.32, 2.2, -0.24);
keys(note("G4"), 6.60, 0.30, 2.0, 0.20);

keys(note("B4"), f(B.urlIn), 0.34, 2.1, -0.14);
keys(note("D5"), 7.85, 0.32, 2.0, 0.22);

/* ── the reach ─────────────────────────────────────────────────────
   The melody descends home while the top bar reaches for the wall.

   The notes are placed at EQUAL DISTANCES ALONG THE BAR'S TRAVEL, and
   the times are solved for, so the rhythm is whatever the bar's own
   curve makes it. Since the bar covers ground quickly and then slows,
   the notes start close together and spread out: a ritardando the
   picture is performing rather than one written over the top of it.

   Getting this backwards is easy and it was. Placing the notes at
   equal steps in TIME along u/(1+u) bunches them at the end — an
   accelerando, the opposite of the picture, and it left a silent patch
   from 8.25 s to 8.50 s that showed up in analyse-audio.mjs before it
   showed up in a listen.

     travel p = (u/(1+u)) / norm,  u = uMax * (t-t0)/(t1-t0)
     solve:  u = p*norm / (1 - p*norm) */
{
  const t0 = f(B.reachIn), t1 = f(B.reachEnd);
  const PITCH = ["C5", "A4", "G4", "E4", "D4", "C4"];
  const uMax = 5.1;
  const norm = uMax / (1 + uMax);
  PITCH.forEach((n, i) => {
    const p = (i + 1) / PITCH.length;          // equal steps along the travel
    const pn = p * norm;
    const u = pn / (1 - pn);
    const at = t0 + (t1 - t0) * (u / uMax);
    if (at >= DUR - 0.25) return;
    keys(note(n), at, 0.34 * Math.pow(0.90, i), 2.4, i % 2 ? 0.18 : -0.18, 0.9);
  });
}

// ══ master ═════════════════════════════════════════════════════════
const wetL = convolve(sendL, impulse(0x51ee7));
const wetR = convolve(sendR, impulse(0x9a1cd));
const WET = 0.62;

let L = new Float64Array(N), R = new Float64Array(N);
for (let i = 0; i < N; i++) {
  L[i] = dryL[i] + wetL[i] * WET;
  R[i] = dryR[i] + wetR[i] * WET;
}

/* High-pass out the rumble, take 3 dB off the low-mid where the pad and
   the bass pile up, and open the top so the strike of the keys is
   audible on a phone. The targets came from analyse-audio.mjs, not from
   taste. */
for (const chain of [0, 1]) {
  let s = chain === 0 ? L : R;
  s = highpass(s, 78, 0.7);
  s = highpass(s, 78, 0.7);           // 24 dB/oct: one pass left 55% below 120 Hz
  s = peaking(s, 115, 0.8, -5.0);
  s = peaking(s, 260, 0.9, -3.0);
  s = peaking(s, 1100, 1.0, 2.0);
  s = highshelf(s, 3400, 5.0);
  s = highshelf(s, 7800, 4.5);   // air, for phone speakers
  if (chain === 0) L = s; else R = s;
}

/* Soft saturation, then fades. tanh rather than a hard clip: it rounds
   the peaks instead of squaring them, which is the difference between
   glue and distortion. */
const FADE_IN = Math.round(0.02 * SR);
const FADE_OUT = Math.round(0.5 * SR);
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / FADE_IN, (N - i) / FADE_OUT);
  L[i] = Math.tanh(L[i] * 1.15) * g;
  R[i] = Math.tanh(R[i] * 1.15) * g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
if (!Number.isFinite(peak)) throw new Error("the mix contains NaN — a note or a filter went bad");
const norm = peak > 0 ? 0.78 / peak : 1;

const bytes = Buffer.alloc(44 + N * 4);
bytes.write("RIFF", 0); bytes.writeUInt32LE(36 + N * 4, 4); bytes.write("WAVE", 8);
bytes.write("fmt ", 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
bytes.writeUInt16LE(2, 22); bytes.writeUInt32LE(SR, 24); bytes.writeUInt32LE(SR * 4, 28);
bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34);
bytes.write("data", 36); bytes.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  bytes.writeInt16LE(Math.round(clamp(L[i] * norm, -1, 1) * 32767), 44 + i * 4);
  bytes.writeInt16LE(Math.round(clamp(R[i] * norm, -1, 1) * 32767), 46 + i * 4);
}
mkdirSync("out", { recursive: true });
writeFileSync("out/announce.wav", bytes);
console.log(`out/announce.wav  ${DUR.toFixed(1)}s  peak ${(peak * norm).toFixed(3)}`);
