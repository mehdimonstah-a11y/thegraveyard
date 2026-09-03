# The waitlist announcement — 10 seconds

The film is the mark, animated once. A field of graves fills in, a wall lands, every bar is
revealed to stop short of it, the field collapses into the mark — and the last beat is the top
bar reaching for the wall on `out(u) = u / (1 + u)` and not arriving.

## What is in `out/`

| File | What it is |
|---|---|
| `thegraveyard-waitlist-HORIZONTAL-1920x1080.mp4` | The master. 300 frames at 30 fps, H.264 High, yuv420p, Rec.709, AAC-LC 48 kHz stereo |
| `thegraveyard-waitlist-SQUARE-1080x1080.mp4` | Same timing, re-laid |
| `thegraveyard-waitlist-VERTICAL-1080x1920.mp4` | Same timing, re-laid |
| `poster-waitlist.jpg` | Frame 230 |
| `announce.wav` | The score on its own, 10 s |

Formats are named in words rather than ratios. `16x9` and `9x16` are the same four characters in
a different order, and posting the vertical cut to a timeline that wanted the horizontal one is
exactly the mistake that naming invites.

## How it is built

```bash
node music-announce.mjs        # synthesise the score -> out/announce.wav
node render-announce.mjs 16x9  # 300 deterministic PNGs   (~30 s per format)
node render-announce.mjs 1x1
node render-announce.mjs 9x16
node encode-announce.mjs       # three masters, the poster, and the gate

node render-announce.mjs 16x9 90 152 244   # spot-render while iterating
```

`announce.html` is the film. `render(f)` draws exactly the state of frame `f` — no clock, no
`requestAnimationFrame`, no easing applied by a timeline. Re-running the render produces
identical output, which is what makes the beat grid a guarantee rather than a hope. To change a
shot, edit its function and re-render.

## The beat grid

| Frame | Beat |
|---|---|
| 010 | The graves begin filling, top to bottom, three frames apart |
| 034 | The line under the field |
| 086 | The last grave lands |
| **088** | **The wall arrives.** Six frames, hard curve. The loudest thing in the score |
| 112–152 | The field collapses: fifteen graves retract, three become the mark, the wall travels with them |
| 156 | The wordmark |
| 190 | *the waitlist is open* |
| 216 | The URL |
| **244–286** | **The reach.** The top bar grows toward the wall asymptotically and does not arrive |
| 296 | Black |

## Two things worth knowing

**Nothing ever touches the wall.** Not one of the eighteen graves at any frame in any format, and
not the top bar at the end of the reach. `RESERVE = 5` px in `announce.html` is the gap that
survives no matter how long the film runs, and the curve is asymptotic to `gap − RESERVE`. If a
future edit lets a bar close it, the film is saying the opposite of what the product does.

**The poster is frame 230, not the last frame.** By 244 the top bar has begun its reach and is
longer than the mark ever is, so a poster taken from the end would ship a non-canonical logo as
the thumbnail. Frame 230 is the mark at rest with the full lockup already on screen.

## The score

A short piece in A minor. An FM electric piano carries it, a quiet pad sits under it, and a
convolution reverb built from decaying noise puts it in a room. Chords land on the picture's
cuts rather than on a metronome, with voice-leading that moves one or two voices at a time:
`A3 C4 E4 → A3 C4 F4 → G3 C4 E4 → G3 B3 D4 → G3 C4 E4`.

Under the reach the melody descends home, and the notes are placed at **equal distances along
the bar's travel** with the times solved for — so the rhythm is whatever the bar's own curve
makes it. The bar covers ground fast and then slows, so the notes start close and spread out.
The picture performs the ritardando; the score doesn't write one over the top of it.

Deterministic — fixed seeds, so the same command produces the same waveform byte for byte.

### Run the analyser after any change

```bash
node analyse-audio.mjs out/announce.wav
```

**"Sounds fine to me" is how the first two versions shipped.** The second one measured:

```
sub  40-120   66.3%      <- almost all of the energy
mid  500-2k    8.5%      <- where music lives
air  6k-16k    0.0%
tail resonances: 132Hz, 588Hz
```

A boom with something faint over it, and four Schroeder combs ringing on two notes. Both were
mix problems rather than composition problems. The current file measures 15 / 28 / 51 / 6, the
reverb is a convolution with no modes to ring, and the two frequencies still flagged in the tail
are C3 and D5 — real notes, still decaying when the picture cuts.

Two bugs the analyser found that a listen would have taken longer to:

- `HZ.F5` was never in the note table, so the wall's second bell was `NaN` from 2.933 s onward.
  A NaN sample is **silent**, not loud, so the delivery gate's "not silence" check passed and
  nothing said anything. Every note now goes through `note()`, which throws on a name that is
  not there.
- The reach was an accelerando, not a ritardando. Placing notes at equal steps in *time* along
  `u/(1+u)` bunches them at the end — the opposite of the picture — and left a silent patch from
  8.25 s to 8.50 s.

**The beat grid is transcribed into `music-announce.mjs` by hand.** The two files are not wired
together, and that is the one place this build can drift: move a cut in `announce.html` and the
hit will land in the wrong place until it is moved here too.

## The gate

`encode-announce.mjs` refuses to hand off a file that fails any of:

- an audio stream is present, is AAC, at 48 kHz, with a non-zero bitrate
- duration is 10.0 s ± 0.06
- the waveform is not silence — measured with `volumedetect`, not read from the header, because a
  stream that exists and is silent fails identically to one that is missing
- true peak ≤ −1.0 dBTP

All three formats currently pass at mean −19.0 dB, peak −6.4 dBTP.

## Toolchain

Chrome renders the frames; `puppeteer-core` and `ffmpeg-static` are borrowed from a sibling
project in this repository rather than installed again here. Both are build-time only.
