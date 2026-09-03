// Audio for the 10-second announcement.
//
//   node music-announce.mjs   ->  out/announce.wav
//
// A short piece in A minor, not a sound-design bed. Four chords with proper
// voice-leading, a bell motif over the top, a sub under it, and a real
// reverb — because the first version of this file was a detuned drone with
// noise hits on it, which is what "cinematic" sounds like when nobody wrote
// any music.
//
// Chord changes land on the picture's cuts rather than on a metronome:
//
//   0.33s  Am    the field begins to fill
//   2.93s  F     the wall lands            <- the moment
//   5.20s  C     the mark resolves, the wordmark appears
//   7.20s  G     the url
//   8.60s  C     home, under the reach
//
// Voice-leading across those: A3 C4 E4 -> A3 C4 F4 -> G3 C4 E4 -> G3 B3 D4 ->
// G3 C4 E4. One or two voices move at a time and the rest hold, which is why
// it changes without anything sounding like it was cut.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 48000;
const FPS = 30;
const DUR = 10.0;
const N = Math.round(SR * DUR);
const f = (frame) => frame / FPS;

/* The beat grid, transcribed from announce.html. If a cut moves there it has to
   move here — the two files are not wired together, and this is the one place
   the build can drift. */
const B = {
  fieldIn: 10, wallIn: 88, collapse: 112, collapseEnd: 152,
  logoIn: 156, subIn: 190, urlIn: 216, reachIn: 244, reachEnd: 286, black: 296,
};

const dryL = new Float32Array(N), dryR = new Float32Array(N);
const send = new Float32Array(N);          // mono bus into the reverb
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Equal temperament, A4 = 440. Written out rather than computed so the
   voicings below can be read as music. */
const HZ = {
  F2: 87.31, G2: 98.0, A2: 110.0, C3: 130.81, E3: 164.81, F3: 174.61,
  G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63,
  F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
  E5: 659.25, F5: 698.46, G5: 784.0,
};

/* A missing note is `undefined`, which becomes NaN, which propagates through
   the reverb and out into the file — and a NaN sample is silent rather than
   loud, so the delivery gate's "not silence" check passes and nothing tells
   you. `HZ.F5` was absent on the first pass and took out everything from the
   wall onward. Every note is checked before a sample is written. */
for (const [name, hz] of Object.entries(HZ)) {
  if (!Number.isFinite(hz) || hz <= 0) throw new Error(`HZ.${name} is not a frequency`);
}
const note = (name) => {
  const hz = HZ[name];
  if (!Number.isFinite(hz)) throw new Error(`no such note: ${name}`);
  return hz;
};

function add(buf, atSec, gain, pan, wet) {
  const start = Math.round(atSec * SR);
  const gl = gain * Math.min(1, 1 - pan * 0.8);
  const gr = gain * Math.min(1, 1 + pan * 0.8);
  for (let i = 0; i < buf.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    dryL[j] += buf[i] * gl;
    dryR[j] += buf[i] * gr;
    send[j] += buf[i] * gain * wet;
  }
}

/* ── the pad ───────────────────────────────────────────────────────
   Three voices per chord, each a sine with a quiet third and fifth
   harmonic and a few cents of detune between two oscillators. Slow
   attack, long release, low-passed. It is the floor everything else
   stands on and it should never be the thing you notice. */
function pad(notes, atSec, len, gain) {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  const ATT = 0.55, REL = 1.1;
  for (const hz of notes) {
    let p1 = 0, p2 = 0, lp = 0;
    const d = hz * 0.0016;   // ~2.8 cents of detune, enough to move, not to beat
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      p1 += (2 * Math.PI * hz) / SR;
      p2 += (2 * Math.PI * (hz + d)) / SR;
      const s =
        (Math.sin(p1) + Math.sin(p2)) * 0.5 +
        (Math.sin(p1 * 3) + Math.sin(p2 * 3)) * 0.055 +
        Math.sin(p1 * 5) * 0.02;
      lp += 0.16 * (s - lp);
      const env = Math.min(1, t / ATT) * Math.min(1, (len - t) / REL);
      buf[i] += lp * clamp(env, 0, 1);
    }
  }
  add(buf, atSec, gain / notes.length, 0, 0.5);
}

/* ── the bell ──────────────────────────────────────────────────────
   A struck bar: a sine fundamental with a long decay, plus two
   inharmonic partials at 2.76x and 5.40x that decay fast. That ratio
   is what makes a marimba sound like wood rather than a sine with an
   envelope on it. */
function bell(hz, atSec, gain, decay = 1.5, pan = 0) {
  const n = Math.round(Math.min(decay * 3.2, DUR) * SR);
  const buf = new Float32Array(n);
  const parts = [
    { m: 1.0, g: 1.0, d: decay },
    { m: 2.76, g: 0.30, d: decay * 0.28 },
    { m: 5.40, g: 0.13, d: decay * 0.14 },
    { m: 8.93, g: 0.05, d: decay * 0.07 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const p of parts) s += Math.sin(2 * Math.PI * hz * p.m * t) * p.g * Math.exp(-t / p.d);
    // A 3 ms attack, so the transient reads as struck rather than clicked.
    buf[i] = s * Math.min(1, t / 0.003);
  }
  add(buf, atSec, gain, pan, 0.42);
}

/* ── the sub ───────────────────────────────────────────────────────
   One sine per chord root, an octave below the pad. Soft attack, no
   harmonics — it is felt more than heard, and anything above the
   fundamental down here just muddies the bells. */
function sub(hz, atSec, len, gain) {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.12) * Math.min(1, (len - t) / 0.5);
    buf[i] = Math.sin(2 * Math.PI * hz * t) * clamp(env, 0, 1);
  }
  add(buf, atSec, gain, 0, 0.12);
}

/* ── reverb ────────────────────────────────────────────────────────
   Schroeder: four parallel damped combs into two series allpasses.
   Delay lengths are the classic mutually-prime set, scaled from 44.1k
   to 48k. About 1.9 s of tail — long enough that the last bell is
   still ringing when the picture cuts to black. */
function reverb(input) {
  const COMBS = [1695, 1760, 1623, 1548];
  const FB = [0.842, 0.836, 0.847, 0.831];
  const DAMP = 0.28;
  const out = new Float32Array(N);

  for (let c = 0; c < COMBS.length; c++) {
    const d = COMBS[c], line = new Float32Array(d);
    let idx = 0, store = 0;
    for (let i = 0; i < N; i++) {
      const y = line[idx];
      out[i] += y;
      store = y * (1 - DAMP) + store * DAMP;   // damping in the feedback path
      line[idx] = input[i] + store * FB[c];
      idx = (idx + 1) % d;
    }
  }
  for (let i = 0; i < N; i++) out[i] *= 0.25;

  for (const [d, g] of [[605, 0.5], [480, 0.5]]) {
    const line = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const bufOut = line[idx];
      const y = -out[i] + bufOut;
      line[idx] = out[i] + bufOut * g;
      out[i] = y;
      idx = (idx + 1) % d;
    }
  }
  return out;
}

// ══ the score ══════════════════════════════════════════════════════

/* Chords, placed on the picture's cuts. Each overlaps the next so the
   release of one is still sounding under the attack of the next. */
const CHORDS = [
  { at: f(B.fieldIn), len: 3.0, notes: [note("A3"), note("C4"), note("E4")], root: note("A2") },
  { at: f(B.wallIn), len: 2.7, notes: [note("A3"), note("C4"), note("F4")], root: note("F2") },
  { at: f(B.logoIn), len: 2.4, notes: [note("G3"), note("C4"), note("E4")], root: note("C3") },
  { at: f(B.urlIn), len: 1.8, notes: [note("G3"), note("B3"), note("D4")], root: note("G2") },
  { at: 8.6, len: 1.6, notes: [note("G3"), note("C4"), note("E4")], root: note("C3") },
];
for (const c of CHORDS) {
  pad(c.notes, c.at, c.len, 0.30);
  sub(c.root, c.at, Math.min(c.len, 2.0), 0.20);
}

/* The motif. Sparse under the field, opens up at the wall, and puts its
   highest note on the frame the wordmark appears. */
bell(note("E4"), 0.60, 0.17, 1.7, -0.25);
bell(note("A4"), 1.40, 0.19, 1.6, 0.20);
bell(note("C5"), 2.10, 0.15, 1.4, -0.15);

// The wall. Two notes together, the loudest event in the piece.
bell(note("A4"), f(B.wallIn), 0.30, 2.0, -0.10);
bell(note("F5"), f(B.wallIn), 0.20, 1.6, 0.18);

bell(note("C5"), 3.90, 0.16, 1.5, 0.22);
bell(note("A4"), 4.55, 0.14, 1.4, -0.20);

// The mark resolves and the wordmark lands: the top of the melody.
bell(note("E5"), f(B.logoIn), 0.26, 2.1, 0.0);
bell(note("C5"), 5.95, 0.15, 1.6, -0.22);
bell(note("G4"), 6.60, 0.14, 1.5, 0.18);

bell(note("B4"), f(B.urlIn), 0.17, 1.6, -0.12);
bell(note("D5"), 7.85, 0.15, 1.5, 0.20);

/* ── the reach ─────────────────────────────────────────────────────
   Under the last shot the melody descends home — C5, A4, G4, E4, D4,
   C4 — at intervals that stretch on out(u) = u/(1+u), the same curve
   the top bar is drawing on screen. It is a ritardando with a reason:
   the notes get further apart and quieter, and the series is still
   going when the film cuts. */
{
  const t0 = f(B.reachIn), t1 = f(B.reachEnd);
  const PITCH = [note("C5"), note("A4"), note("G4"), note("E4"), note("D4"), note("C4")];
  const uMax = PITCH.length * 0.85;
  const norm = uMax / (1 + uMax);
  PITCH.forEach((hz, n) => {
    const u = (n + 1) * 0.85;
    const at = t0 + (t1 - t0) * ((u / (1 + u)) / norm);
    if (at >= DUR - 0.2) return;
    bell(hz, at, 0.155 * Math.pow(0.87, n), 1.9, (n % 2 ? 0.16 : -0.16));
  });
}

// ══ master ═════════════════════════════════════════════════════════
const wet = reverb(send);
const WET = 0.30;
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  // A couple of samples of offset on the wet side widens the tail without
  // any of the phasing a true stereo delay would introduce.
  L[i] = dryL[i] + wet[i] * WET;
  R[i] = dryR[i] + wet[Math.max(0, i - 71)] * WET;
}

/* A short fade at both ends so the file cannot click, and a soft ceiling
   well under full scale — the encode applies loudnorm on top of this. */
const FADE_IN = Math.round(0.02 * SR);
const FADE_OUT = Math.round(0.45 * SR);   // the reverb tail is taken down gently
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / FADE_IN, (N - i) / FADE_OUT);
  L[i] *= g; R[i] *= g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
if (!Number.isFinite(peak)) throw new Error("the mix contains NaN — a note or a filter went bad");
const norm = peak > 0 ? Math.min(1, 0.72 / peak) : 1;

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
console.log(`out/announce.wav  ${DUR.toFixed(1)}s  ${(bytes.length / 1e6).toFixed(2)} MB  peak ${(peak * norm).toFixed(3)}`);
