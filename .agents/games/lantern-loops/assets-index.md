# Lantern Loops — assets and evidence index

## Code and planning

| What | Path | Task |
|---|---|---|
| Epic plan, decisions, scope fence | `tasks/epics/19-web-lantern-loops/STATUS.md` | 00 |
| Task files 01 to 08 | `tasks/epics/19-web-lantern-loops/` | 00 |
| App (Preact, Vite, Capacitor) | `apps-games/lantern-loops` (`@web-games/lantern-loops`) | skeleton, 03 to 07 |
| Art slots and code-drawn fallbacks | `apps-games/lantern-loops/src/art/slots.ts`, drop files in `src/art/files/<slot-id>.webp` | 04, 06 |
| Headless rules, solver, generator, content data | `apps-games/lantern-loops-core` (`@web-games/lantern-loops-core`) | 01, 02 |
| Shared kit | `apps-games/web-kit` (`@web-games/kit`), docs `.agents/games/web-games-kit/` | epic 18 |
| Evidence root | `.agents/resources/2026-10-23/web-games/lantern-loops/` | all |
| Owner browser QA checklist | `.agents/resources/2026-10-23/web-games/lantern-loops/qa-checklist.md` | 08 (done) |

## Fonts (OFL, bundled woff2 with `OFL.txt`, task 04)

| Role | Family | Source | Target path | Licence |
|---|---|---|---|---|
| Display (title, numerals, headings) | Fraunces (variable) | github.com/google/fonts, `ofl/fraunces` | `apps-games/lantern-loops/public/fonts/` | SIL OFL 1.1 |
| Body (UI, labels) | Nunito (variable) | github.com/google/fonts, `ofl/nunito` | `apps-games/lantern-loops/public/fonts/` | SIL OFL 1.1 |

Each woff2 is a Latin subset (Basic Latin, Latin-1, the dashes, quotes, bullet, ellipsis and
minus). The star glyph is not in the subset: stars are drawn as SVG (kit `StarRating`), never as text.
Status: done in task 04. Files:

| File | Source (github.com/google/fonts, commit `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0`) | Source SHA-256 | woff2 size | woff2 SHA-256 |
|---|---|---|---|---|
| `public/fonts/fraunces/Fraunces-Variable.woff2` (+ `OFL.txt`) | `ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf` | `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb` | 109,868 bytes | `06902db0749fe3852d6f0a89c42a0fd65ae4cb52cc655803fb6e7545cb6d7b4e` |
| `public/fonts/nunito/Nunito-Variable.woff2` (+ `OFL.txt`) | `ofl/nunito/Nunito[wght].ttf` | `bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207` | 32,776 bytes | `e7f5e0461b054c3c5fe22d34d3349e61ef5a677d6cd483a75c2d8d9cbe9392bf` |

The subset command and the full provenance are in
`.agents/resources/2026-10-23/web-games/lantern-loops/04/README.md`. The game registers the fonts in
`src/theme/fonts.ts` and the CSS stacks name only `"Fraunces", serif` and `"Nunito", sans-serif`.

## Art slots (15) requested from the MobileGamesDesigner thread

Image format: WebP at 2x the css display size. Masters: WebP q90 under
`.agents/resources/2026-10-23/web-games/lantern-loops/art/masters/`. Every slot has a code-drawn
fallback so the game is complete without it. Budget: all shipped art <= 8 MB (test in task 06).

| Batch | Slot id | Shape | Display size (css) | Shipped size (px) | Use | Fallback | Status |
|---|---|---|---|---|---|---|---|
| B1 | `icon` | square, opaque, single lantern motif, legible at 48 px | launcher | 1024x1024 master | App icon via @capacitor/assets (task 07) | code-drawn lantern on indigo | shipped |
| B1 | `key-art` | portrait 2:3, title-safe empty band in the upper third | full screen | 800x1200 | Home, Boot, splash source | layered paper-cut SVG dusk scene | shipped |
| B1 | `lantern-amber` | square, transparent | 56 | 112x112 | Lists, chapter cards, win sheet | SVG lantern | shipped |
| B1 | `backdrop-harbor` | portrait 2:3, calm low-detail centre for the board | full screen | 800x1200 | Harbor puzzles and list | indigo gradient + SVG water and boat silhouettes | shipped |
| B2 | `lantern-rose` | square, transparent, same silhouette as amber | 56 | 112x112 | Sky legend, how-to, share | SVG lantern | shipped |
| B2 | `lantern-jade` | same | 56 | 112x112 | same | SVG lantern | shipped |
| B2 | `lantern-azure` | same | 56 | 112x112 | same | SVG lantern | shipped |
| B2 | `lantern-violet` | same | 56 | 112x112 | same | SVG lantern | shipped |
| B2 | `lantern-unlit` | same | 56 | 112x112 | Locked puzzles, unlit lantern in lists | SVG lantern, grey | shipped |
| B2 | `backdrop-garden` | portrait 2:3, same rules as harbor | full screen | 800x1200 | Garden | gradient + SVG blossoms and walls | shipped |
| B2 | `backdrop-bridge` | portrait 2:3 | full screen | 800x1200 | Bridge | gradient + SVG arches and reflections | shipped |
| B2 | `backdrop-sky` | portrait 2:3 | full screen | 800x1200 | Sky | gradient + SVG clouds and drifting lanterns | shipped |
| B2 | `daily-medallion` | square, transparent | 120 | 240x240 | Daily screen, streak milestones | SVG medallion ring | shipped |
| B2 | `empty-archive` | square, transparent spot illustration | 160 | 320x320 | Archive "Completed" empty state | SVG lantern outline | placeholder |
| B2 | `feature-graphic` | landscape 3:2, no text | store only (not bundled) | 1536x1024 master | Store feature graphic after crop | none (store asset) | shipped |

Art rules: layered cut-paper shapes with subtle paper-fibre texture, warm amber/rose glow on deep
indigo and teal, soft rim light, depth through layered paper shadows. No text, no logos, no faces,
no AI artefacts (warped lines, garbled glyphs) in anything shipped. The board itself (tiles, loops,
glow) is always drawn by code in the same palette.

### Art provenance (task 06, 2026-10-23, updated after the full designer loop)

Art track result: status `ok`. 14 of 15 slots were accepted; `empty-archive` was rejected in its
final round and keeps its code-drawn placeholder. Nothing outside `accepted/` was used. Inbox:
`/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/` (read-only). Evidence copy: art bible,
accepted manifest, the brief and review notes of every round (batches b1 rounds 1 to 4, b2 rounds 1 to 4,
retry rounds 1 to 3) and the conversion report under
`.agents/resources/2026-10-23/web-games/lantern-loops/art/` (`art-bible.md`, `accepted-manifest.json`,
`review/<batch>-round-<n>-review.md`, `review/<batch>-round-<n>-brief.md`, `report.json`).

Conversion: `apps-games/lantern-loops/scripts/convert-art.ts` (run `bun scripts/convert-art.ts` in the
app folder; deterministic, idempotent: a second run reproduces every byte). Masters are WebP q90 at the
generation size (`.../art/masters/<slot>.webp`); shipped files are WebP q82 at 2x display size in
`apps-games/lantern-loops/src/art/files/<slot>.webp`. `icon` and `feature-graphic` are not bundled in the
web build: the icon master feeds the Capacitor icon and splash assets (task 07), the feature-graphic
master (1536x1024, not 1500x1000 as first specified) is the source for the store feature graphic
(1024x500 centre crop).

Shipped total: 12 files, 162,934 bytes (159 KB) of the 8 MB budget (largest `backdrop-garden` 39,448 bytes).

| Slot | Inbox file | Review (round, verdict) | Date | SHA-256 (source PNG) | SHA-256 (master) | SHA-256 (shipped) | Notes |
|---|---|---|---|---|---|---|---|
| `icon` | `icon.png` (accepted folder; `b1/round-4/out/icon.png`) | b1 round 4, ACCEPTED (rounds 1 to 3 rejected: wave too bright and flat) | 2026-10-23 | `3f6966f1dd4b3845860900e7dd48a5a6c0f5a01a38e175a0bceb301d05699627` | `5f5fb19b1c13d386dcfca6319fb73ab989ee02691ad91c12e3129d92eac72eaa` | `not bundled` | 1024x1024 opaque; 1024x1024 opaque, Capacitor source for task 07, not in the web bundle |
| `key-art` | `key-art.png` (accepted folder; `retry/round-1/out/key-art.png`) | retry round 1, ACCEPTED | 2026-10-23 | `c65b9a5110326ad7f269b5848c0f9d3a94e995cec39c6266855fd24899fc8f1a` | `08e21e80b1bdf2d1a9abb06fd35ca49789e21a8253a7fb6bf6ca25fdf8680d8a` | `e1cf481aff883df62e391f9ce1767fbabcf1efa970331bd3ccd9584af909242b` | 1024x1536 opaque; shipped 800x1200, 34,768 bytes; title band calm; hero is the accepted amber sprite |
| `lantern-amber` | `lantern-amber.png` (accepted folder; `b1/round-3/out/lantern-amber.png`) | b1 round 3, ACCEPTED (rounds 1 and 2 rejected: cap and hanger construction) | 2026-10-23 | `e191d5294e0a565559dce5d82de5d52a6a8bdef613fcb159f9b48e1969984270` | `51c9c6ab913fc470820d5f6a9c6034da0e847af7733b9990e253556c703ac37c` | `8f3d5bc82102990d35a05215f9e93b7b1a330a992a688978a6c7733dbba9b0b0` | 1024x1024 transparent; shipped 112x112, 2,832 bytes; minor review note: loop is small and thin, tassel bead is a dark disc |
| `lantern-rose` | `lantern-rose.png` (accepted folder; `b2/round-1/out/lantern-rose.png`) | b2 round 1, ACCEPTED | 2026-10-23 | `8f6bbf7204d186681de822d616ad209021e4628b78b9f709754dfc923143b27e` | `c73eca29c553ba2996e38ef5e10d884a3d4d028c0271c053e52b8ad493606d45` | `e64f0b38214482aee5983db1c66a8346f63488d05c789b28d50d1e8875f5bc85` | 1024x1024 transparent; shipped 112x112, 2,762 bytes; same silhouette as amber; review note: amber tassel kept on every colour |
| `lantern-jade` | `lantern-jade.png` (accepted folder; `b2/round-1/out/lantern-jade.png`) | b2 round 1, ACCEPTED | 2026-10-23 | `d7ebeac4dd585c0e1102acadce2c822fe79d140c0bcfdaf70fbd1167311a7f43` | `7775f3d2bd99e46877c305da5cd7c15ce9c70abac3878b208b330cee7d44af69` | `cd59dc6b94c1185edbd03b849f0f532e3a8dae02f434fcde2114e9f752fc730f` | 1024x1024 transparent; shipped 112x112, 2,756 bytes; same silhouette as amber; square window |
| `lantern-azure` | `lantern-azure.png` (accepted folder; `b2/round-1/out/lantern-azure.png`) | b2 round 1, ACCEPTED | 2026-10-23 | `6b144924a3d9b2f647e38357e56574c3332b631dc5a6920faf53f0cbbd7b3d31` | `060cea725e9aff285f038bed235feb422a8202c450f61f8bd3f5f3dffe81c302` | `b9d2afa1fa471a31aa589d34cb485ac2f5457a618a2c6b95193485901ad18b1e` | 1024x1024 transparent; shipped 112x112, 2,780 bytes; same silhouette as amber; triangle window |
| `lantern-violet` | `lantern-violet.png` (accepted folder; `b2/round-1/out/lantern-violet.png`) | b2 round 1, ACCEPTED | 2026-10-23 | `650e3632cde4a1a44b6f5c59fcd05f6c795b74110c3f4ef802fc8df574adbbf0` | `aabb6e0cd61d07e219bb3dfb60362023cd9797008a57228b0e9ee861fd900ec3` | `9685465d87eeffa45bd6a5ff2668702a370607229373ea5aaf0b106e3b5a250d` | 1024x1024 transparent; shipped 112x112, 2,722 bytes; same silhouette as amber; star window |
| `lantern-unlit` | `lantern-unlit.png` (accepted folder; `b2/round-1/out/lantern-unlit.png`) | b2 round 1, ACCEPTED | 2026-10-23 | `3dcfab8aefd2ab479d8f1fc52cdced81f727f5d673430bab3dd058fb06886a6b` | `2244d7220334824e1f704f78233425df34dd5a4af8e7a397d9974a7b73ff9cef` | `28fa82cf8c09482e3b8e6fe01dc73a6c6d1b821dce40ca96051fa99ae28842bd` | 1024x1024 transparent; shipped 112x112, 2,460 bytes; no window; outer panels are close to the night colour, so the app keeps it on its light list chip |
| `backdrop-harbor` | `backdrop-harbor.png` (accepted folder; `retry/round-3/out/backdrop-harbor.png`) | retry round 3, ACCEPTED (b1 rounds 1 to 4 and retry rounds 1 and 2 rejected) | 2026-10-23 | `cc9f0d199cfe747cc508afae4ebd19a1615c6d39bc2171013cc4026808fd62a2` | `5d13e8cd5fbf0f39a38a067a996aadc94ac153dd417da7aafaf57dfc2fa0cde0` | `7252450a1c8cc32d2accd7d0e3eef956e9ff636ff30c9aa61287362dbc432c85` | 1024x1536 opaque; shipped 800x1200, 18,676 bytes; centre edge density 0.0059; calm board zone; minor clone seams only at 300 percent zoom |
| `backdrop-garden` | `backdrop-garden.png` (accepted folder; `b2/round-1/out/backdrop-garden.png`) | b2 round 1, ACCEPTED | 2026-10-23 | `c95182778ba8715a4e494670597f37b8650047f554562009342ca2cf201d4009` | `b61ed10b7704674ea3a16babe65f53f60e011ac3a9e5d568c9205b5d3574fa8c` | `0c065c7d3c101c6fcf0a6e1e4ca4e85b68a6557af6134ea886fedd03dc4ed839` | 1024x1536 opaque; shipped 800x1200, 39,448 bytes; centre edge density 0.0081; calm board zone (mean luma 0.17); blossoms a warmer coral, tolerated |
| `backdrop-bridge` | `backdrop-bridge.png` (accepted folder; `b2/round-1/out/backdrop-bridge.png`) | b2 round 1, ACCEPTED (weakest accepted) | 2026-10-23 | `492f0795af456c37e15fe0b97b8047cf7d2b561c0492262e85d57b82749073ef` | `972098927163716f5ee115e5b2e0d41a8cb305a83ba26b20c7fcad2e1ae891a0` | `774347cfb4515ddd78ece83238552eac54b3218f977e612768980be10b2a7930` | 1024x1536 opaque; shipped 800x1200, 17,440 bytes; centre edge density 0.0042; very monochrome indigo, acceptable under the scrim |
| `backdrop-sky` | `backdrop-sky.png` (accepted folder; `b2/round-2/out/backdrop-sky.png`) | b2 round 2, ACCEPTED (round 1 rejected: airbrushed gradient, near-monochrome sky) | 2026-10-23 | `c619e8d8f976d50e4b718016f6cc8844f6eb3fb551253368951ead629bcbffb6` | `13449ba4c79ce86645a3ffb04db7d6f42b709c074db91f26435364b973e1baac` | `17b8f52dc29cbe1308fc0da506e74ee33ee0f4f8953455863faa2e73d9ec3d4a` | 1024x1536 opaque; shipped 800x1200, 25,470 bytes; centre edge density 0.0042; rose band sits inside the board zone at 61 to 66 percent, low contrast |
| `daily-medallion` | `daily-medallion.png` (accepted folder; `b2/round-2/out/daily-medallion.png`) | b2 round 2, ACCEPTED (round 1 rejected: clipped petals) | 2026-10-23 | `1aaa0f6edf3da5e9d8341f89abaa4504b50a3b0bf648d5c5b1e0f086fc465a3c` | `adf509254cff4716453fa7a4ea1680274dcd4c2f3ac17e7cbeec8eb890558cc3` | `26047aa1dd148ffb79eebef6afbfb551bbf9b9dac88c5551d20780e754aa0269` | 1024x1024 transparent; shipped 240x240, 10,820 bytes; 16 petals, empty indigo centre plate for the numeral |
| `feature-graphic` | `feature-graphic.png` (accepted folder; `retry/round-2/out/feature-graphic.png`) | retry round 2, ACCEPTED (b2 rounds 1 to 4 and retry round 1 rejected) | 2026-10-23 | `4056e3b45e2989a03bd42d6c6842b303b8899be610867f2a8f3fcd19bdb0e55b` | `25e0837feac42a87e9d3e0499b1136769c97b87ef022b17a5084775f7b4b98ec` | `not bundled` | 1536x1024 opaque; 1536x1024 master, store-only; survives the 1024x500 crop |

Where the art is used in the app: Boot, Home and onboarding show `key-art` behind the screen; the
chapter backdrops sit behind the puzzle list and the puzzle screen (the chapters screen uses
`backdrop-harbor`); `lantern-amber` and `lantern-unlit` mark solved and open puzzles in the list;
the Puzzle screen shows a colour legend (`lantern-amber`, `-rose`, `-jade`, `-azure`, `-violet`) when a
board has more than one lantern colour or any gate; `daily-medallion` sits on the Daily screen.

### Placeholder slots (1)

The code-drawn fallback stays (see the Fallback column above); it is also listed in `open-questions.md`
(Q11).

| Slot | Why it has no art | Review round |
|---|---|---|
| `empty-archive` | Rejected in every round (b2 rounds 2 to 4, retry rounds 1 to 3). Final verdict: the ribbon still reads as a bracket or handle at 160 px, because the bottom run merges into the tray lip and the 50 px notch is too small to read as a gap. On the paper background the cream ribbon and tray almost vanish. The lantern and ribbon read as two unrelated objects, and the lantern looks like a squat grey pumpkin. Same fault cited in rounds 1 and 2 | retry round 3, REJECTED (final) |

## Audio (CC0 only, task 05, done)

Sources: four Kenney packs (kenney.nl/assets, each page and its shipped `License.txt` say
"Creative Commons Zero, CC0": UI Audio, Interface Sounds, Impact Sounds, Music Jingles) and one
OpenGameArt track (`calm-loop`, page states "License(s): CC0", "Copyright/Attribution Notice: Public
Domain"). All retrieved 2026-10-23. Nothing is synthesized or generated in code.

Format: the Kenney sources are OGG; `ffmpeg` was installed, so every effect was converted to mono
44.1 kHz MP3 at 64 kbit/s (`ffmpeg -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k -map_metadata -1`).
MP3 decodes everywhere the app runs (Chromium, Android WebView, iOS WKWebView); Ogg Vorbis is not reliably decodable in WKWebView on iOS 17. The
music loop ships as the original MP3 file, unmodified (the shipped hash equals the source hash).
Budgets (tests): each effect <= 60 KB, music <= 1 MB, all audio <= 1.5 MB. Actual: effects
78.9 KB in total (largest 12.7 KB), music 306.9 KB, all audio 385.7 KB.

The per-file records live in `apps-games/lantern-loops/src/audio/sources.ts` (the audio test
recomputes every SHA-256 and fails on an unrecorded or altered file), the licence texts in
`apps-games/lantern-loops/public/audio/LICENSES/`, and the research notes in
`.agents/resources/2026-10-23/web-games/lantern-loops/05/README.md`. The About screen lists the packs
from the same records.

| Event id | File | Pack: original file (page) | Licence | Bytes | SHA-256 (shipped) | SHA-256 (source) |
|---|---|---|---|---|---|---|
| `ui-tap` | `public/audio/ui-tap.mp3` | Kenney UI Audio: `Audio/click2.ogg` (https://kenney.nl/assets/ui-audio) | CC0 1.0 | 1,087 | `786a5a99f10d87e2b83fed647426619a8bfd80911cebf67692437b6f07d9174e` | `c394b46bc6737f7f7edfbfa3031ce621b7a43d498d456d6198364eee9cd3e306` |
| `ui-back` | `public/audio/ui-back.mp3` | Kenney Interface Sounds: `Audio/back_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 1,087 | `cf3964f94421ac24426ed84b2ea3596108fa88d7a494190b31e34efd5d5c68b5` | `07db973f79f6ae0f2edc34561e7592e24d0577455919fb602cb8ecc0da991dcf` |
| `sheet-open` | `public/audio/sheet-open.mp3` | Kenney Interface Sounds: `Audio/open_002.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 3,177 | `140c0a42adb797cf0dc6edcf3295be4b89835e4b5913f8a40c1f2f9e1294e63b` | `24ff224fe2c09c6aed1b41249825382dc74cf324b887ff279d8494912ce2beee` |
| `tile-place` | `public/audio/tile-place.mp3` | Kenney Impact Sounds: `Audio/impactWood_light_001.ogg` (https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 2,759 | `c291ab2f2b957abe52ab087a1f07d6598e4358baa4d041113f120f10a9cb4d6f` | `4b76bf3ccc8e60d19188f3165b778a7817786faa6887c55d9049bcbeef3b425f` |
| `tile-rotate` | `public/audio/tile-rotate.mp3` | Kenney Interface Sounds: `Audio/toggle_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 1,714 | `133576fcd441cb74fdb91228023932f8b61fab00992ac63485dfe3c410991e8e` | `ca1d2dde5f0b286abac4f070e23edab8f30927c8a533665cdf2ac6492a415e49` |
| `tile-erase` | `public/audio/tile-erase.mp3` | Kenney Interface Sounds: `Audio/scratch_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 1,714 | `fef8f8f9f926ebaba2db3e446a55f79a3f1514bd72c2fb1c3296dfbd453f3213` | `5c294d2e1a6b6d07ee2d75b17105a55ad3527e5482dd60652dc49c2ea4c70096` |
| `loop-close` | `public/audio/loop-close.mp3` | Kenney Interface Sounds: `Audio/confirmation_002.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 4,849 | `7411a1ff5e960c32375b9eaa0f2198880beae99b3c320c3a3784abf2c6c44ba0` | `33b17a9a9a2397c62b285c52c33a907fdffb476909c99e42dde603f6a7a8b12c` |
| `lantern-lit` | `public/audio/lantern-lit.mp3` | Kenney Interface Sounds: `Audio/glass_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 2,759 | `6216e4dac2e52c9ec089986fb1c1577394933d327ad0845bce425ea9a2515fb2` | `183eebee20eb0a532b0b85104d139cbf2673eb66d95c3cc733ac9ea98362e7e8` |
| `conflict` | `public/audio/conflict.mp3` | Kenney Interface Sounds: `Audio/error_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 1,923 | `ffa89574c0be94e01cc126870429c569155bd101e580bbc2840c59963db935d6` | `46e67425d16339772e8d328fb36a49426c9467418686e11beeb71ff84b0f6433` |
| `hint` | `public/audio/hint.mp3` | Kenney Interface Sounds: `Audio/question_002.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 3,177 | `bee54b23443abf280f62c0b8e588f44fa892f99c8d2501ffa2e6f133b7f202f4` | `46056f10c70dda860e93bd27b66f4d33c0b7154eff28def06471b50028efa5b3` |
| `undo` | `public/audio/undo.mp3` | Kenney Interface Sounds: `Audio/close_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 1,714 | `b71df4526c26957c7e595c5f3d7b52564066b9b84c11a07c1e73650af6faaf44` | `44af8249b933e0fd35ec957a638bb1a0b01f85b53fbe9674bf77bd3ca3168ef4` |
| `win-1` | `public/audio/win-1.mp3` | Kenney Music Jingles: `Audio/Steel jingles/jingles_STEEL08.ogg` (https://kenney.nl/assets/music-jingles) | CC0 1.0 | 6,939 | `8629108e44ebd2c125101728b29e26088ca6d4a67acfff556c5e19e9abb4cc2b` | `8b0df04c5e9e1adfd1d7a99c111894956e18374db03c681e14f2fd2c7d387626` |
| `win-2` | `public/audio/win-2.mp3` | Kenney Music Jingles: `Audio/Steel jingles/jingles_STEEL12.ogg` (https://kenney.nl/assets/music-jingles) | CC0 1.0 | 10,700 | `d3687b8ae7d36f69a954d064b5df24642cf0e2b2bfeffbce6845823ab26fead8` | `17842dd21980be3373a01cc575eec8ddb86e2a49c3afcef7365fc5d907233c0b` |
| `win-3` | `public/audio/win-3.mp3` | Kenney Music Jingles: `Audio/Steel jingles/jingles_STEEL07.ogg` (https://kenney.nl/assets/music-jingles) | CC0 1.0 | 12,999 | `8dfa4f5212af9d4373b6c3ea5e952874e1ce84eb59af32b65498efad5fb664a7` | `206b5cb18870c1faa393047cb857eda28441b9682380c9eb5910119ea04c2ece` |
| `daily-done` | `public/audio/daily-done.mp3` | Kenney Music Jingles: `Audio/Pizzicato jingles/jingles_PIZZI07.ogg` (https://kenney.nl/assets/music-jingles) | CC0 1.0 | 11,118 | `8b2ac626c4c6c744c61a8a1d55196512514cc1a5c317f9b124c495f004777b24` | `91870588924e0e498c6eb8d4f4ccf8595c9e7dc51fb553797b551062e642ce7c` |
| `chapter-unlock` | `public/audio/chapter-unlock.mp3` | Kenney Music Jingles: `Audio/Steel jingles/jingles_STEEL06.ogg` (https://kenney.nl/assets/music-jingles) | CC0 1.0 | 11,536 | `50286d78b33a1f1dcf6e3ce678c87233259a8e75872ca6f7d7bba03600901a22` | `7a332720d8a70ac87fe1eae55e440466c2b9a3b39068a946faa30da7753b1df8` |
| `freeze-used` | `public/audio/freeze-used.mp3` | Kenney Interface Sounds: `Audio/bong_001.ogg` (https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 1,505 | `aff3a11099516ed349df34b6f83d8d92c002239d43f031fe1270710912f48604` | `d21d0f0b782445db579d11e2506b24cd1ac9d664ee33aeaf807761aa7b6fd710` |
| `calm-loop` | `public/audio/calm-loop.mp3` | OpenGameArt: Calm Loop by wipics: `Relaxing_0.mp3` (https://opengameart.org/content/calm-loop) | CC0 1.0 | 314,222 | `1d7e386c079d4add6b3b1592054846e4977035f26844466e409467c6dc7bdbde` | `1d7e386c079d4add6b3b1592054846e4977035f26844466e409467c6dc7bdbde` |

## Capacitor icon and splash (task 07, done)

Sources live in `apps-games/lantern-loops/resources/` and are written by
`apps-games/lantern-loops/scripts/render-brand-sources.ts` (`bun run brand:sources`, deterministic,
reads the evidence masters, never the inbox). `bunx capacitor-assets generate --android --ios`
(`bun run brand:assets`) turns them into the launcher icons, adaptive icons and splash images that are
committed under `android/` and `ios/`.

| Source | Size | Built from | Status |
|---|---|---|---|
| `resources/icon.png` | 1024x1024, opaque RGB | accepted `icon` master (`art/masters/icon.webp`), unchanged | accepted art |
| `resources/icon-foreground.png` | 1024x1024, RGBA | accepted `lantern-amber` master, trimmed and fitted into the central 66% (676 px) | accepted art |
| `resources/icon-background.png` | 1024x1024, opaque | flat indigo `#12132E` | code |
| `resources/splash.png`, `splash-dark.png` | 2732x2732, opaque | indigo `#12132E` field with the centre lantern of the accepted `key-art` master (`art/masters/key-art.webp`, crop 380x430 around (512, 790), soft elliptical mask so the neighbouring garland lanterns stay out and the edge fades into the indigo) centred inside the safe 1200 px box, posterised to 32 colours (median 5) to keep the committed splash copies small; light and dark are identical because the game has one dark look | accepted art (`key-art`) |

Update pass, 2026-10-23: the first task 07 pass ran before `key-art` was accepted and used `lantern-amber`
for the splash; the splash now comes from the accepted `key-art` (retry round 1). The icon and the
adaptive foreground are unchanged (same bytes). `bun scripts/render-brand-sources.ts --fallback` draws the
code-drawn lantern on indigo for the case where no accepted art exists. `empty-archive` (rejected, see
the art table above) has no Capacitor role. Evidence:
`.agents/resources/2026-10-23/web-games/lantern-loops/07/README.md`.

## Evidence

| What | Path | Task |
|---|---|---|
| Uniqueness proof report for all 120 puzzles | `.agents/resources/2026-10-23/web-games/lantern-loops/02/campaign-report.json` | 02 |
| Daily 365-date generation report | `.agents/resources/2026-10-23/web-games/lantern-loops/03/daily-report.json` | 03 |
| Font provenance and contrast table | `.agents/resources/2026-10-23/web-games/lantern-loops/04/README.md` | 04 |
| Audio provenance | `.agents/resources/2026-10-23/web-games/lantern-loops/05/README.md` | 05 (done) |
| Art review log and masters | `.agents/resources/2026-10-23/web-games/lantern-loops/art/` | 06 (done) |
| Capacitor sync log, `capacitor-assets` log, README | `.agents/resources/2026-10-23/web-games/lantern-loops/07/` | 07 (done) |
| Bundle, art, audio and font budget report (`08/budgets.json`), no-data audit (`08/no-data-audit.txt`), verification summary (`08/README.md`), QA checklist (`qa-checklist.md`) | `.agents/resources/2026-10-23/web-games/lantern-loops/08/`, `.agents/resources/2026-10-23/web-games/lantern-loops/qa-checklist.md` | 08 (done) |
