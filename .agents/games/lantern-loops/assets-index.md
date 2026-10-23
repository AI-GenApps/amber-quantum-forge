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
| Owner browser QA checklist | `.agents/resources/2026-10-23/web-games/lantern-loops/qa-checklist.md` | 08 (planned) |

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
| B1 | `icon` | square, opaque, single lantern motif, legible at 48 px | launcher | 1024x1024 master | App icon via @capacitor/assets (task 07) | code-drawn lantern on indigo | planned |
| B1 | `key-art` | portrait 2:3, title-safe empty band in the upper third | full screen | 800x1200 | Home, Boot, splash source | layered paper-cut SVG dusk scene | planned |
| B1 | `lantern-amber` | square, transparent | 56 | 112x112 | Lists, chapter cards, win sheet | SVG lantern | planned |
| B1 | `backdrop-harbor` | portrait 2:3, calm low-detail centre for the board | full screen | 800x1200 | Harbor puzzles and list | indigo gradient + SVG water and boat silhouettes | planned |
| B2 | `lantern-rose` | square, transparent, same silhouette as amber | 56 | 112x112 | Sky legend, how-to, share | SVG lantern | planned |
| B2 | `lantern-jade` | same | 56 | 112x112 | same | SVG lantern | planned |
| B2 | `lantern-azure` | same | 56 | 112x112 | same | SVG lantern | planned |
| B2 | `lantern-violet` | same | 56 | 112x112 | same | SVG lantern | planned |
| B2 | `lantern-unlit` | same | 56 | 112x112 | Locked puzzles, unlit lantern in lists | SVG lantern, grey | planned |
| B2 | `backdrop-garden` | portrait 2:3, same rules as harbor | full screen | 800x1200 | Garden | gradient + SVG blossoms and walls | planned |
| B2 | `backdrop-bridge` | portrait 2:3 | full screen | 800x1200 | Bridge | gradient + SVG arches and reflections | planned |
| B2 | `backdrop-sky` | portrait 2:3 | full screen | 800x1200 | Sky | gradient + SVG clouds and drifting lanterns | planned |
| B2 | `daily-medallion` | square, transparent | 120 | 240x240 | Daily screen, streak milestones | SVG medallion ring | planned |
| B2 | `empty-archive` | square, transparent spot illustration | 160 | 320x320 | Archive "Completed" empty state | SVG lantern outline | planned |
| B2 | `feature-graphic` | landscape 3:2, no text | store only (not bundled) | 1500x1000 master | Store feature graphic after crop | none (store asset) | planned |

Art rules: layered cut-paper shapes with subtle paper-fibre texture, warm amber/rose glow on deep
indigo and teal, soft rim light, depth through layered paper shadows. No text, no logos, no faces,
no AI artefacts (warped lines, garbled glyphs) in anything shipped. The board itself (tiles, loops,
glow) is always drawn by code in the same palette.

### Art provenance (filled by task 06)

| Slot | Inbox file | Reviewed | Accepted | SHA-256 (master) | Notes |
|---|---|---|---|---|---|
| (none yet) | | | | | |

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

## Evidence planned

| What | Path | Task |
|---|---|---|
| Uniqueness proof report for all 120 puzzles | `.agents/resources/2026-10-23/web-games/lantern-loops/02/campaign-report.json` | 02 |
| Daily 365-date generation report | `.agents/resources/2026-10-23/web-games/lantern-loops/03/daily-report.json` | 03 |
| Font provenance and contrast table | `.agents/resources/2026-10-23/web-games/lantern-loops/04/README.md` | 04 |
| Audio provenance | `.agents/resources/2026-10-23/web-games/lantern-loops/05/README.md` | 05 (done) |
| Art review log and masters | `.agents/resources/2026-10-23/web-games/lantern-loops/art/` | 06 |
| Capacitor sync log | `.agents/resources/2026-10-23/web-games/lantern-loops/07/` | 07 |
| Bundle and art budget report, no-data audit, QA checklist | `.agents/resources/2026-10-23/web-games/lantern-loops/08/`, `qa-checklist.md` | 08 |
