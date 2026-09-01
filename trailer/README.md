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

One sustained bed, six taps as the field fills, one hit when the wall lands, two settles across
the collapse, and three taps under the type. Then the part it exists for: during the reach, the
taps come at intervals that stretch on the same curve the picture is drawing. The audio slows
toward a limit it does not reach, and stops because the film stops rather than because it
resolved.

Deterministic — a fixed noise seed, so the same command produces the same waveform byte for byte.

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

All three formats currently pass at mean −19.6 dB, peak −1.5 dB.

## Toolchain

Chrome renders the frames; `puppeteer-core` and `ffmpeg-static` are borrowed from a sibling
project in this repository rather than installed again here. Both are build-time only.
