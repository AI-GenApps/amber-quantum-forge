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
Until a slot is accepted the app draws a tasteful code-drawn placeholder (SVG/CSS in the palette).

| Batch | Slot | Shape | Alpha | Display (CSS px) | App file (2x) | Used by |
|---|---|---|---|---|---|---|
| B1 | icon | square | opaque | n/a (store/launcher) | not bundled; master 1024 | Capacitor icon, favicon |
| B1 | key-art | portrait 2:3, title-safe band | opaque | 360×540 | 720×1080 | Title screen |
| B1 | observatory-building | square | transparent | 320×320 | 640×640 | Observe tab foreground |
| B1 | emblem-lyre | square, round emblem framing | transparent | 144×144 | 288×288 | Atlas card, journal |
| B2 | sky-far | portrait 2:3 | opaque | full-bleed (cover) | 780×1170 | Observe/Chart background |
| B2 | nebula-mid | portrait 2:3 | transparent | full-bleed (cover) | 780×1170 | Parallax layer |
| B2 | horizon-hills | portrait 2:3, bottom third only | transparent | bottom-anchored | 780×1170 | Observe foreground |
| B2 | emblem-whale | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-archer | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-crown | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-serpent | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-lantern | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-ship | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-fox | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-key | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-harp | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-tower | square | transparent | 144×144 | 288×288 | Atlas card |
| B2 | emblem-owl | square | transparent | 144×144 | 288×288 | Atlas card |
| B3 | instrument-telescope | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-lens | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-prism | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-orrery | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-star-map | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-beacon | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-archive | square | transparent | 112×112 | 224×224 | Build row |
| B3 | instrument-aurora-coil | square | transparent | 112×112 | 224×224 | Build row |
| B3 | lore-1 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 1 card, journal |
| B3 | lore-2 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 2 |
| B3 | lore-3 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 3 |
| B3 | lore-4 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 4 |
| B3 | lore-5 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 5 |
| B3 | lore-6 | portrait 2:3 vignette | opaque | 300×450 | 600×900 | Chapter 6 |
| B3 | feature-graphic | landscape 3:2, no text | opaque | n/a (store) | not bundled; master 1536×1024 | Store feature graphic |

Count: B1 4 + B2 14 + B3 15 = 33 slots (31 bundled, 2 store/launcher only). The 12 emblems share
identical framing so the atlas grid is consistent. Vignette subjects are in `content-plan.md`
section 5. Every slot has a stable code-drawn fallback keyed by the same name.

Art budget: bundled art at most 8 MB total (estimate under 2 MB), any single file at most 600 KB;
enforced by a test using the kit's `checkAssetBudget`.

Image status (update in task 06): all slots `pending` until the designer inbox delivers and the
review accepts them. Rejected slots keep their placeholders.

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

### Art provenance (filled by task 06)

| Slot | Designer batch / thread message | Review verdict | Master path | App path | Date |
|---|---|---|---|---|---|
| (none yet) | | | | | |

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
