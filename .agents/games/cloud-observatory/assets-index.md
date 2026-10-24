# Cloud Observatory — assets index

Planned art slots, fonts, audio, budgets and provenance. Update the Status columns and the
provenance tables in the same commit that changes an asset.

## Art bible (what the designer thread and code both follow)

Ink-and-watercolour celestial atlas: deep navy paper, gold-leaf linework, soft watercolour nebula
washes, antique star-chart motifs; elegant, restrained, luminous. Star maps and constellation lines
are drawn by code (SVG) in gold on navy, never baked into images.

| Token | Hex | Use | Contrast on #101A33 |
|---|---|---|---|
| ink-950 | `#0B1226` | Deepest background, text on gold | |
| ink-900 | `#101A33` | Page background | |
| ink-800 | `#172445` | Surface (cards) | |
| ink-700 | `#22335C` | Raised surface, borders | |
| parchment | `#F3E9D2` | Primary text | 14.3:1 |
| parchment-dim | `#C9BFA4` | Secondary text | 9.4:1 |
| muted | `#A39E8F` | Tertiary text (large or supporting) | 6.4:1 |
| gold-leaf | `#D8A94B` | Accent, constellation lines, primary button fill (text `#0B1226`, 8.6:1) | 8.0:1 |
| gold-light | `#EBCB85` | Highlights, next-star ring | 11.0:1 |
| wash-teal | `#6FB3BD` | Nebula wash, info | 7.3:1 |
| wash-rose | `#D98BA0` | Nebula wash | 6.7:1 |
| danger | `#F08A78` | Wrong-tap feedback, destructive confirm | 7.1:1 |
| success | `#8FCB9B` | Charted, success | 9.2:1 |

Ratios were computed with the WCAG relative-luminance formula (evidence README of task 00). Task 04
turned these into `ThemeTokens` (`src/ui/tokens.ts`); `test/ui/a11y.test.tsx` recomputes every text pair
(19 per variant, default and high contrast) and requires at least 4.5:1.

## Fonts (OFL)

| Role | Family | Source | Files to bundle | Notes |
|---|---|---|---|---|
| Display (titles, numbers in hero positions) | Cormorant Garamond | github.com/google/fonts `ofl/cormorantgaramond` | woff2 for weights 500 and 700 plus italic 500, Latin subset | Variable TTF subsetted with `pyftsubset --flavor=woff2` |
| Body (UI, lore, numbers) | Manrope | github.com/google/fonts `ofl/manrope` | one variable woff2 (wght 400 to 700), Latin subset | Tabular figures feature on for counters |

Bundled under `apps-games/cloud-observatory/public/fonts/<family-slug>/` with each family's
`OFL.txt`. Budget: all woff2 combined at most 400 KB. The no-platform-fallback test from the kit
asserts that every rendered text node resolves to Cormorant Garamond or Manrope, and a CSS scan test
requires every `font-family` declaration to list only these two (plus `serif` or `sans-serif` last).

### Font files (task 04, status: bundled)

| File | Bytes | Weight | Source (github.com/google/fonts) | Licence |
|---|---|---|---|---|
| `cormorant-garamond/CormorantGaramond-Medium.woff2` | 18,096 | 500 | `ofl/cormorantgaramond` (commit `3dd7884`) | SIL OFL 1.1 |
| `cormorant-garamond/CormorantGaramond-Bold.woff2` | 17,272 | 700 | same | SIL OFL 1.1 |
| `cormorant-garamond/CormorantGaramond-MediumItalic.woff2` | 19,124 | italic 500 | same | SIL OFL 1.1 |
| `manrope/Manrope-Variable.woff2` | 22,300 | variable, declared 400 to 700 | `ofl/manrope` (commit `b31870a`) | SIL OFL 1.1 |
| `cormorant-garamond/OFL.txt`, `manrope/OFL.txt` | 4,387 each | | same directories | licence text |

Total woff2: 76,792 bytes. Latin subset (Basic Latin, Latin-1, general punctuation, arrows,
minus); static instances of the display family made with fontTools `instancer`, then
`pyftsubset --flavor=woff2`. The exact commands and the Unicode ranges are in
`.agents/resources/2026-10-23/web-games/cloud-observatory/04/README.md`.

## Art slots (33 images)

The designer thread delivers masters; the app uses WebP at 2x the display size. Masters are kept
as WebP q90 under `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/`.
All 33 slots are accepted (task 06 update, 2026-10-24). A slot that is missing from the manifest, or whose file fails to load, still draws its code-drawn placeholder (SVG in the palette), so the app builds and runs with any subset of art.

| Batch | Slot | Shape | Alpha | Display (CSS px) | App file (2x) | Used by | Status |
|---|---|---|---|---|---|---|---|
| B1 | icon | square | opaque | n/a (store/launcher) | not bundled; master 1024×1024 only. The launcher still uses the code-drawn stopgap `resources/icon-only.png` (task 07, open-questions 15) | Capacitor icon, favicon | accepted |
| B1 | key-art | portrait 2:3, title-safe band | opaque | 360×540 | 720×1080 | Title screen | accepted |
| B1 | observatory-building | square | transparent | 320×320 | 640×640 | Observe tab foreground | accepted |
| B1 | emblem-lyre | square, round emblem framing | transparent | 144×144 | 288×288 | Atlas card, journal | accepted |
| B2 | sky-far | portrait 2:3 | opaque | full-bleed (cover) | 780×1170 | Observe/Chart background | accepted |
| B2 | nebula-mid | portrait 2:3 | transparent | full-bleed (cover) | 780×1170 | Parallax layer | accepted |
| B2 | horizon-hills | portrait 2:3, bottom third only | transparent | bottom-anchored | 780×1170 | Observe foreground | accepted |
| B2 | emblem-whale | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-archer | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-crown | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-serpent | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-lantern | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-ship | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-fox | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-key | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-harp | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-tower | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B2 | emblem-owl | square | transparent | 144×144 | 288×288 | Atlas card | accepted |
| B3 | instrument-telescope | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-lens | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-prism | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-orrery | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-star-map | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-beacon | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-archive | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | instrument-aurora-coil | square | transparent | 112×112 | 224×224 | Build row | accepted |
| B3 | lore-1 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 1 card, journal | accepted |
| B3 | lore-2 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 2 | accepted |
| B3 | lore-3 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 3 | accepted |
| B3 | lore-4 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 4 | accepted |
| B3 | lore-5 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 5 | accepted |
| B3 | lore-6 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 6 | accepted |
| B3 | feature-graphic | landscape 3:2, no text | opaque | n/a (store) | not bundled; master 1536×1024 | Store feature graphic | accepted |

Count: B1 4 + B2 14 + B3 15 = 33 slots (31 bundled, 2 store/launcher only). The 12 emblems share
identical framing so the atlas grid is consistent. Vignette subjects are in `content-plan.md`
section 5. Every slot has a stable code-drawn fallback keyed by the same name.

Art budget: bundled art at most 8 MB total (estimate under 2 MB), any single file at most 600 KB;
enforced by a test using the kit's `checkAssetBudget`.

### Image status (task 06, updated 2026-10-24)

The designer review loop finished with `status=ok`: all 33 slots were accepted by the strict reviewer
(batches b1 to b5 plus the `retry` batch for `icon`, `lore-1`, `lore-6`, `instrument-aurora-coil` and
`feature-graphic`). The first task 06 pass ran earlier with only 3 accepted images (the loop had
stopped at `style_anchor_failed`); this update integrated the other 30. Integrated: 31 bundled slots
(WebP at 2x) plus 2 master-only slots (`icon`, `feature-graphic`). No slot is a placeholder any more;
the code-drawn placeholders remain in the code as the fallback for a missing or failing file.

Integration is done by `apps-games/cloud-observatory/scripts/build-art.mjs` (reads the inbox
`accepted/manifest.json`, checks aspect class, alpha on transparent slots and source size against
`scripts/art-slots.json`, refuses to write anything if one check fails, then writes the masters, the
bundled files, `src/ui/art-entries.ts` and the build report). Run it with
`bun apps-games/cloud-observatory/scripts/build-art.mjs <inbox>/accepted`. Images are only resized and
encoded, never edited or upscaled; nothing was looked at by the agent for judgement.

One slot-table rule was added: `horizon-hills` is a bottom-anchored layer (transparent above the far
ridge, opaque from the ridges down to the bottom and both side edges, round-2 review). The corner check
for it is `transparentCorners: "top"` in `art-slots.json` (top two corners transparent, bottom two
opaque, both asserted by `test/art/manifest.test.ts`); every other transparent slot keeps all four
corners transparent. The layer is anchored to the bottom (`object-position: center bottom`).

| Group | Files | Size | Bytes each |
|---|---|---|---|
| Opaque scenes | `key-art` | 720x1080 | 44,254 |
| Sky layers | `sky-far` (opaque), `nebula-mid`, `horizon-hills` (alpha) | 780x1170 | 12,508 / 75,992 / 16,118 |
| Building | `observatory-building` (alpha) | 640x640 | 50,002 |
| Emblems | 12 files (alpha) | 288x288 | 13,764 to 15,832 |
| Instruments | 8 files (alpha) | 224x224 | 7,886 to 19,204 |
| Lore vignettes | `lore-1` to `lore-6` (opaque) | 600x900 | 9,528 to 81,154 |
| **Total bundled art** | 31 files (budget 8,000,000 total, 600,000 per file) | | **683,760** (largest 81,154) |
| Masters (evidence, WebP q90) | 33 files in `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/` | | 4,611,450 |

Loading: `key-art`, `sky-far` and `observatory-building` are the critical slots. The kit
`preloadImages` warms them behind the title screen (only slots that are in the manifest). Every other
image is `loading="lazy"`. Opaque images are painted on their mean colour while they decode (key-art
`#1F2A40`, sky-far `#071735`, lore-1 to lore-6 `#2A3046 #3A302A #413733 #081427 #070E1E #7B727E`),
transparent sprites on nothing, and a failed file drops to the placeholder, so no box is ever blank.
Emblems, instruments, lore vignettes and background layers are decorative (`alt=""`, `aria-hidden`);
`key-art` and `observatory-building` carry a description.

### Placeholder slots

None. Every slot of the 33 is accepted. The code-drawn drawings in `src/ui/placeholders/` are kept as the
fallback and are exercised by `test/art/placeholders.test.tsx` (empty and partial manifests). The only
slot whose art is not used where it was meant is `icon`: the painted master is stored, but the Capacitor
launcher icon is still the task 07 code-drawn stopgap (open-questions 15).

Reviewer verdict files and the art bible are copied under
`.agents/resources/2026-10-23/web-games/cloud-observatory/art/` (`art-bible.md`, `review/b1-round-N.md`,
the batch briefs, `accepted-manifest.json`, `build-report.json`).

## Audio (CC0 only)

Task 05 status: bundled. 13 cues and one music loop, all CC0, none synthesized. Format MP3 (the
default, WebView-safe), encoded with the locally installed `ffmpeg` (libmp3lame). Short cues are mono
44.1 kHz at 64 kbps, silence trimmed at both ends, peak normalised to about -3 dBFS; the loop is stereo
44.1 kHz at 96 kbps. Total 1,920,489 bytes of MP3 (budget 2,500,000). Files live in
`apps-games/cloud-observatory/public/audio/`; the same table, the CC0 pack licence texts and the
conversion commands are in `public/audio/LICENSES.md` and `public/audio/licenses/`, and
`test/audio/assets.test.ts` fails when a file lacks a row, a source URL or the licence text `CC0`.

| Id | Used for | File | Bytes | Duration (s) | Original (pack and file) |
|---|---|---|---|---|---|
| gather | Tap on the sky (throttled to 8 per second, rate 0.94 to 1.08) | `gather.mp3` | 1,505 | 0.16 | Kenney Interface Sounds `glass_003` |
| buy | Instrument or boon purchase | `buy.mp3` | 3,177 | 0.37 | Kenney Interface Sounds `confirmation_003` |
| upgrade | Upgrade purchase | `upgrade.mp3` | 4,640 | 0.55 | Kenney Interface Sounds `confirmation_002` |
| star-ok | Correct star (rate 0.97 to 1.05) | `star-ok.mp3` | 1,505 | 0.16 | Kenney Interface Sounds `pluck_002` |
| star-miss | Wrong star | `star-miss.mp3` | 1,714 | 0.18 | Kenney Interface Sounds `error_008` |
| chart-done | Constellation complete | `chart-done.mp3` | 12,999 | 1.59 | Kenney Music Jingles, Steel `jingles_STEEL07` |
| lore | Lore entry unlocked | `lore.mp3` | 4,849 | 0.57 | Kenney Interface Sounds `glass_004` |
| achievement | Achievement toast | `achievement.mp3` | 10,700 | 1.31 | Kenney Music Jingles, Steel `jingles_STEEL12` |
| eclipse | Eclipse sequence | `eclipse.mp3` | 19,687 | 2.43 | Kenney Sci-fi Sounds `spaceEngineLow_002`, first 2.4 s with 0.8 s fades |
| comet | Comet traced | `comet.mp3` | 9,656 | 1.18 | Kenney Music Jingles, Pizzicato `jingles_PIZZI03` |
| click | UI tap | `click.mp3` | 669 | 0.05 | Kenney Interface Sounds `click_002` |
| back | Back button | `back.mp3` | 1,087 | 0.10 | Kenney Interface Sounds `back_001` |
| welcome | Welcome Back sheet | `welcome.mp3` | 4,431 | 0.52 | Kenney Interface Sounds `confirmation_004` |
| music: observatory-night | The one ambient loop, 153.6 s, fades 600 ms in and out | `observatory-night.mp3` | 1,843,870 | 153.63 | "Cosmic Navigation" (`cosmic_navigation_loop.flac`) by Synth-thetic, OpenGameArt |

The cue choices were made from file names, durations and levels only (no listening, by the owner's
no-device rule); the owner judges the sound in the browser and may swap any file by editing the
table in `src/audio/cues.ts` and `LICENSES.md` together.

### Provenance

Downloaded 2026-10-23. Every row is CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/).

| Pack | Source URL | Licence evidence | Files used |
|---|---|---|---|
| Kenney Interface Sounds 1.0 | https://kenney.nl/assets/interface-sounds (zip `kenney_interface-sounds.zip`) | `License.txt` in the zip: "Creative Commons Zero, CC0"; copy at `public/audio/licenses/kenney-interface-sounds-License.txt` | gather, buy, upgrade, star-ok, star-miss, lore, click, back, welcome |
| Kenney Music Jingles | https://kenney.nl/assets/music-jingles (zip `kenney_music-jingles.zip`) | `License.txt` in the zip: "Creative Commons Zero, CC0"; copy at `public/audio/licenses/kenney-music-jingles-License.txt` | chart-done, achievement, comet |
| Kenney Sci-fi Sounds | https://kenney.nl/assets/sci-fi-sounds (zip `kenney_sci-fi-sounds.zip`) | `License.txt` in the zip: "Creative Commons Zero, CC0"; copy at `public/audio/licenses/kenney-sci-fi-sounds-License.txt` | eclipse |
| Cosmic Navigation by Synth-thetic | https://opengameart.org/content/cosmic-navigation | The page's licence field reads "CC0" and its notice reads "CC0 / Public Domain. No Rights Reserved. Free to use however you like with no attribution required."; recorded at `public/audio/licenses/opengameart-cosmic-navigation-NOTICE.txt` | observatory-night |

Kenney Digital Audio, UI Audio and Impact Sounds were also downloaded and inspected (all CC0) but no file
from them shipped. Other OpenGameArt candidates that also state CC0 (Outer Space Loop, Safe Space,
Another Space Background Track) were not used; Cosmic Navigation fits the game best and ships an
explicit loop file.

### Art provenance (task 06)

Verdicts are the reviewer's, quoted from the review file named in each row (strict loop; the full text of
every round and every brief is in the `review/` folder of the evidence directory). The date is the day the
file was integrated (first pass 2026-10-24 for the first three, update pass 2026-10-24 for the rest).

| Slot | Designer batch / round | Review verdict | Master path | App path | Date |
|---|---|---|---|---|---|
| `key-art` | b1, round 2; third full-scene attempt; star dab composited by the designer | ACCEPTED with notes, `art/review/b1-round-2.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/key-art.webp` | `public/art/key-art.webp` | 2026-10-24 |
| `observatory-building` | b1, round 2 | ACCEPTED with notes, `art/review/b1-round-2.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/observatory-building.webp` | `public/art/observatory-building.webp` | 2026-10-24 |
| `emblem-lyre` | b1, round 4 | ACCEPTED, minor residual flaws not visible at 144 px, `art/review/b1-round-4.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-lyre.webp` | `public/art/emblem-lyre.webp` | 2026-10-24 |
| `emblem-archer` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-archer.webp` | `public/art/emblem-archer.webp` | 2026-10-24 |
| `emblem-crown` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-crown.webp` | `public/art/emblem-crown.webp` | 2026-10-24 |
| `emblem-fox` | b3, round 1 | ACCEPTED, `art/review/b3-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-fox.webp` | `public/art/emblem-fox.webp` | 2026-10-24 |
| `emblem-harp` | b3, round 1 | ACCEPTED, `art/review/b3-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-harp.webp` | `public/art/emblem-harp.webp` | 2026-10-24 |
| `emblem-key` | b3, round 1 | ACCEPTED, `art/review/b3-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-key.webp` | `public/art/emblem-key.webp` | 2026-10-24 |
| `emblem-lantern` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-lantern.webp` | `public/art/emblem-lantern.webp` | 2026-10-24 |
| `emblem-owl` | b3, round 1 | ACCEPTED, `art/review/b3-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-owl.webp` | `public/art/emblem-owl.webp` | 2026-10-24 |
| `emblem-serpent` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-serpent.webp` | `public/art/emblem-serpent.webp` | 2026-10-24 |
| `emblem-ship` | b2, round 2 | ACCEPTED, `art/review/b2-round-2.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-ship.webp` | `public/art/emblem-ship.webp` | 2026-10-24 |
| `emblem-tower` | b3, round 1 | ACCEPTED, `art/review/b3-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-tower.webp` | `public/art/emblem-tower.webp` | 2026-10-24 |
| `emblem-whale` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/emblem-whale.webp` | `public/art/emblem-whale.webp` | 2026-10-24 |
| `feature-graphic` | retry, round 3 | ACCEPTED, `art/review/retry-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/feature-graphic.webp` | not bundled | 2026-10-24 |
| `horizon-hills` | b2, round 2 | ACCEPTED, `art/review/b2-round-2.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/horizon-hills.webp` | `public/art/horizon-hills.webp` | 2026-10-24 |
| `icon` | retry, round 1 | ACCEPTED, `art/review/retry-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/icon.webp` | not bundled | 2026-10-24 |
| `instrument-archive` | b4, round 3 | ACCEPTED, `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-archive.webp` | `public/art/instrument-archive.webp` | 2026-10-24 |
| `instrument-aurora-coil` | retry, round 3 | ACCEPTED, `art/review/retry-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-aurora-coil.webp` | `public/art/instrument-aurora-coil.webp` | 2026-10-24 |
| `instrument-beacon` | b4, round 3 | ACCEPTED, `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-beacon.webp` | `public/art/instrument-beacon.webp` | 2026-10-24 |
| `instrument-lens` | b4, round 3 | ACCEPTED, `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-lens.webp` | `public/art/instrument-lens.webp` | 2026-10-24 |
| `instrument-orrery` | b4, round 3 | ACCEPTED, `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-orrery.webp` | `public/art/instrument-orrery.webp` | 2026-10-24 |
| `instrument-prism` | b4, round 3 | ACCEPTED (marginal), `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-prism.webp` | `public/art/instrument-prism.webp` | 2026-10-24 |
| `instrument-star-map` | b4, round 3 | ACCEPTED, `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-star-map.webp` | `public/art/instrument-star-map.webp` | 2026-10-24 |
| `instrument-telescope` | b4, round 3 | ACCEPTED, `art/review/b4-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/instrument-telescope.webp` | `public/art/instrument-telescope.webp` | 2026-10-24 |
| `lore-1` | retry, round 3 | ACCEPTED, `art/review/retry-round-3.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/lore-1.webp` | `public/art/lore-1.webp` | 2026-10-24 |
| `lore-2` | b5, round 1 | ACCEPTED, `art/review/b5-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/lore-2.webp` | `public/art/lore-2.webp` | 2026-10-24 |
| `lore-3` | b5, round 1 | ACCEPTED, `art/review/b5-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/lore-3.webp` | `public/art/lore-3.webp` | 2026-10-24 |
| `lore-4` | b5, round 1 | ACCEPTED, `art/review/b5-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/lore-4.webp` | `public/art/lore-4.webp` | 2026-10-24 |
| `lore-5` | b5, round 1 | ACCEPTED, `art/review/b5-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/lore-5.webp` | `public/art/lore-5.webp` | 2026-10-24 |
| `lore-6` | retry, round 1 | ACCEPTED, `art/review/retry-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/lore-6.webp` | `public/art/lore-6.webp` | 2026-10-24 |
| `nebula-mid` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/nebula-mid.webp` | `public/art/nebula-mid.webp` | 2026-10-24 |
| `sky-far` | b2, round 1 | ACCEPTED, `art/review/b2-round-1.md` | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/sky-far.webp` | `public/art/sky-far.webp` | 2026-10-24 |

One designer model produced everything (built-in image generator, exact version not exposed); the
prompts, notes and source paths are in `art/accepted-manifest.json`. Rejected earlier rounds (for example
`icon` in b1 rounds 1 to 4, `lore-1` in b5 rounds 1 to 4 and retry rounds 1 to 2) are in the review files but
were never used; only the final accepted file of each slot is.

## Launcher icon and splash (task 07)

Sources are in `apps-games/cloud-observatory/resources/`, all written by
`apps-games/cloud-observatory/scripts/build-icons.mjs` (sharp, deterministic). Native outputs come
from `bunx capacitor-assets generate --android --ios --assetPath resources` and are committed under
`android/app/src/main/res` and `ios/App/App/Assets.xcassets`.

| File | Provenance |
|---|---|
| `icon-only.png` (1024, opaque) | Code-drawn stopgap: gold-foil four-point star on a `#22335C` to `#101A33` field with two thin rings, art-bible palette. Used because the painted `icon` was accepted only after task 07 and cannot be cut into an adaptive foreground without retouching (open-questions 15). Not a designer image |
| `icon-foreground.png` (1024, transparent) | The same star mark alone at 66% for the adaptive-icon safe zone |
| `icon-background.png` (1024, opaque) | `icon-only.png` enlarged 1.6x and blurred, so no hard shape shows |
| `splash.png` (2732, opaque) | `#101A33` field with the accepted `key-art` master (read from `art/masters/key-art.webp`) at 40% of the width, edges feathered |
| `splash-dark.png` (2732, opaque) | The same on `#0B1226` |

Replacing the stopgap with a painted icon: add the accepted master, point `build-icons.mjs` at it,
re-run both commands, update this section and open-questions row 15.

## Release status (task 08, 2026-10-24)

Final art status, from the designer review loop (`status=ok`, updated in the task 06 update pass): 33
slots, all 33 accepted (31 bundled, 2 master-only), no placeholder slot. Only images from the designer
`accepted/` folder are used (checked by `test/art/manifest.test.ts` and `test/art/masters.test.ts`). The
art bible and every reviewer verdict are in the evidence folder
`.agents/resources/2026-10-23/web-games/cloud-observatory/art/`.

| Budget | Limit | Measured | Test |
|---|---|---|---|
| JavaScript, gzip level 9, all `dist/assets/*.js` | 300 KB (307,200 bytes) | 63,346 bytes (6 files) | `test/release/bundle.test.ts` (programmatic Vite build into `node_modules/.cache/bundle-check`) |
| woff2 fonts | 400,000 bytes | 76,792 bytes (4 files) | `test/release/budgets.test.ts` |
| Audio | 2,500,000 bytes | 1,920,489 bytes (14 files) | `test/release/budgets.test.ts` |
| Art | 8,000,000 bytes, 600,000 per file | 683,760 bytes (31 files, largest 81,154) | `test/release/budgets.test.ts` |
| First-load `index.html` | under 5 KB | 694 bytes | `test/release/bundle.test.ts` |

Every font folder has an `OFL.txt`; every audio file has a row with a source URL and `CC0` in
`public/audio/LICENSES.md` (both checked by `budgets.test.ts`). `public/.gitkeep` was removed in
task 08 because it was copied into every build.

## Where things live

| What | Where |
|---|---|
| App source and tests | `apps-games/cloud-observatory/` |
| Rules, content, simulator | `apps-games/cloud-observatory-core/` |
| Fonts | `apps-games/cloud-observatory/public/fonts/` |
| Bundled art | `apps-games/cloud-observatory/public/art/` |
| Audio | `apps-games/cloud-observatory/public/audio/` |
| Art masters | `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/` |
| Owner QA checklist | `.agents/resources/2026-10-23/web-games/cloud-observatory/qa-checklist.md` (task 08) |
| Epic and task files | `tasks/epics/21-web-cloud-observatory/` |
