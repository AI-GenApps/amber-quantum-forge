# The Last Window - assets index

Status after task 05: the two fonts and the 36 audio files are delivered (below); art is not yet. This file plans every art
slot and the audio slots. Later tasks fill in provenance, sizes and hashes: 05 (audio), 06 (art), 07 (icon
and splash), 08 (totals). Every one of the 54 art slots has a code-drawn fallback so the game
renders completely with zero, some or all slots present.

## Where things live

| What | Where |
|---|---|
| App code | `apps-games/the-last-window/` |
| Rules and content | `apps-games/the-last-window-core/` |
| Runtime art (WebP, 2x display size) | `apps-games/the-last-window/public/art/` |
| Art masters (WebP q90) | `.agents/resources/2026-10-23/web-games/the-last-window/art/masters/` |
| Fonts (woff2 + `OFL.txt`) | `apps-games/the-last-window/public/fonts/` |
| Audio (ogg + licence records) | `apps-games/the-last-window/public/audio/` and `.../public/audio/LICENSES.md` |
| Designer inbox (read-only input) | `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/` |
| Evidence and QA checklist | `.agents/resources/2026-10-23/web-games/the-last-window/` |

## Art style (summary of the brief)

Warm painterly gouache, picture-book cosy: lamplight, rain on glass, a small harbour town. One
consistent warm key light from the window side in every image. Characters are semi-realistic and
illustrated with the same proportions, rendering and line quality on all eight; faces are expressive
but subtle. Customer busts share one framing (shoulders up, head about 55 percent of the height, eyes
at 38 percent from the top), one scale and one transparent background; the three expressions of a
customer keep the identical face, hair, outfit and framing. The three interiors share one camera and
layout (arched window top centre, counter and shelves in the lower third, the centre kept calm for UI).
Objects: three-quarter view, soft contact shadow, filling about 80 percent of the square, transparent
background. No text, logos or signage lettering in any image. Palette: `product.md` tokens.

## Art slots (54)

Batches: B1 style anchor (4), B2 (9), B3 expressions (16), B4 objects and store graphic (25). B1 is
reviewed first; later batches must match its light, palette and rendering.

| Batch | Slot | Format | Master | Runtime size (2x display) | Used for | Fallback |
|---|---|---|---|---|---|---|
| B1 | `icon` | square, opaque | 1024 x 1024 | not in bundle (icons via @capacitor/assets) | App icon, splash | code-drawn lamp-in-window badge |
| B1 | `key-art` | portrait 2:3, title-safe band | 1600 x 2400 | 800 x 1200 | Title screen | night gradient with code-drawn arched window and lamp |
| B1 | `interior-evening` | portrait 2:3, counter in lower third, clear centre | 1600 x 2400 | 800 x 1200 | Shift background (evening), style anchor | code-drawn interior in palette tokens |
| B1 | `customer-1-neutral` | portrait 3:4 bust, transparent | 1536 x 2048 | 480 x 640 | Odile Marsh, waiting | code-drawn bust |
| B2 | `interior-morning` | portrait 2:3, same layout as evening | 1600 x 2400 | 800 x 1200 | Shift background (morning) | code-drawn interior, morning tint |
| B2 | `interior-rain` | portrait 2:3, same layout as evening | 1600 x 2400 | 800 x 1200 | Shift background (rain) | code-drawn interior, rain tint with streaks |
| B2 | `customer-2-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Tobias Venn, waiting | code-drawn bust |
| B2 | `customer-3-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Priya Anand, waiting | code-drawn bust |
| B2 | `customer-4-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Juno Okafor, waiting | code-drawn bust |
| B2 | `customer-5-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Henrik Ahlgren, waiting | code-drawn bust |
| B2 | `customer-6-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Leona Castellane, waiting | code-drawn bust |
| B2 | `customer-7-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Abel Quill, waiting | code-drawn bust |
| B2 | `customer-8-neutral` | portrait 3:4 bust, transparent, same framing and scale as customer-1 | 1536 x 2048 | 480 x 640 | Sunniva Roe, waiting | code-drawn bust |
| B3 | `customer-1-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Odile Marsh, happy | code-drawn bust, expression changed |
| B3 | `customer-1-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Odile Marsh, sad | code-drawn bust, expression changed |
| B3 | `customer-2-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Tobias Venn, happy | code-drawn bust, expression changed |
| B3 | `customer-2-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Tobias Venn, sad | code-drawn bust, expression changed |
| B3 | `customer-3-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Priya Anand, happy | code-drawn bust, expression changed |
| B3 | `customer-3-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Priya Anand, sad | code-drawn bust, expression changed |
| B3 | `customer-4-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Juno Okafor, happy | code-drawn bust, expression changed |
| B3 | `customer-4-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Juno Okafor, sad | code-drawn bust, expression changed |
| B3 | `customer-5-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Henrik Ahlgren, happy | code-drawn bust, expression changed |
| B3 | `customer-5-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Henrik Ahlgren, sad | code-drawn bust, expression changed |
| B3 | `customer-6-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Leona Castellane, happy | code-drawn bust, expression changed |
| B3 | `customer-6-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Leona Castellane, sad | code-drawn bust, expression changed |
| B3 | `customer-7-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Abel Quill, happy | code-drawn bust, expression changed |
| B3 | `customer-7-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Abel Quill, sad | code-drawn bust, expression changed |
| B3 | `customer-8-happy` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Sunniva Roe, happy | code-drawn bust, expression changed |
| B3 | `customer-8-sad` | portrait 3:4 bust, transparent, identity identical to neutral | 1536 x 2048 | 480 x 640 | Sunniva Roe, sad | code-drawn bust, expression changed |
| B4 | `drink-1` | square, transparent | 768 x 768 | 192 x 192 | Harbour Black | code-drawn cup |
| B4 | `drink-2` | square, transparent | 768 x 768 | 192 x 192 | Tide Latte | code-drawn cup |
| B4 | `drink-3` | square, transparent | 768 x 768 | 192 x 192 | Fog Tea | code-drawn cup |
| B4 | `drink-4` | square, transparent | 768 x 768 | 192 x 192 | Honey Chamomile | code-drawn cup |
| B4 | `drink-5` | square, transparent | 768 x 768 | 192 x 192 | Lamplight Cocoa | code-drawn cup |
| B4 | `drink-6` | square, transparent | 768 x 768 | 192 x 192 | Midnight Mocha | code-drawn cup |
| B4 | `pastry-1` | square, transparent | 768 x 768 | 192 x 192 | Salted Butter Roll | code-drawn pastry |
| B4 | `pastry-2` | square, transparent | 768 x 768 | 192 x 192 | Cinnamon Knot | code-drawn pastry |
| B4 | `pastry-3` | square, transparent | 768 x 768 | 192 x 192 | Pear Tart | code-drawn pastry |
| B4 | `pastry-4` | square, transparent | 768 x 768 | 192 x 192 | Lemon Cream Bun | code-drawn pastry |
| B4 | `pastry-5` | square, transparent | 768 x 768 | 192 x 192 | Ginger Loaf | code-drawn pastry |
| B4 | `book-1` | square, transparent | 768 x 768 | 192 x 192 | The Lamplighter's Almanac | code-drawn book spine and cover |
| B4 | `book-2` | square, transparent | 768 x 768 | 192 x 192 | Salt and Sparrows | code-drawn book spine and cover |
| B4 | `book-3` | square, transparent | 768 x 768 | 192 x 192 | The Cartographer's Daughter | code-drawn book spine and cover |
| B4 | `book-4` | square, transparent | 768 x 768 | 192 x 192 | Seven Ways to Lose an Umbrella | code-drawn book spine and cover |
| B4 | `book-5` | square, transparent | 768 x 768 | 192 x 192 | The Gull Who Wanted a Hat | code-drawn book spine and cover |
| B4 | `decor-1` | square, transparent | 768 x 768 | 256 x 256 | Window Seat Cushions | code-drawn object |
| B4 | `decor-2` | square, transparent | 768 x 768 | 256 x 256 | Brass Reading Lamp | code-drawn object |
| B4 | `decor-3` | square, transparent | 768 x 768 | 256 x 256 | Potted Rosemary | code-drawn object |
| B4 | `decor-4` | square, transparent | 768 x 768 | 256 x 256 | Glass Cake Stand | code-drawn object |
| B4 | `decor-5` | square, transparent | 768 x 768 | 256 x 256 | Rolling Library Ladder | code-drawn object |
| B4 | `decor-6` | square, transparent | 768 x 768 | 256 x 256 | Harbour Chart Frame | code-drawn object |
| B4 | `decor-7` | square, transparent | 768 x 768 | 256 x 256 | Rain Chime | code-drawn object |
| B4 | `decor-8` | square, transparent | 768 x 768 | 256 x 256 | Brass Gramophone | code-drawn object |
| B4 | `feature-graphic` | landscape 3:2, no text | 1536 x 1024 | not in bundle | Store listing | none (store only) |

Slot count check: B1 4 + B2 9 + B3 16 + B4 25 = 54. Rules: rejected slots keep their code-drawn fallback;
walk-ins have no art slots. Runtime art budget 8 MB (expected about 2.5 MB); per-file limits: 800 x 1200
images at most 400 KB, customer busts at most 120 KB, objects at most 60 KB.

### Provenance (filled by task 06)

| Slot | Status | Source (batch, round) | Review verdict | Runtime file | Runtime bytes | Master | Master bytes | Master SHA-256 |
|---|---|---|---|---|---|---|---|---|
| all 54 slots | planned | - | - | - | - | - | - | - |

## Fonts

Shipped by task 04 (OFL 1.1, from `github.com/google/fonts`, subset and converted with ephemeral
`uvx` fonttools; tool, commands and upstream hashes in
`.agents/resources/2026-10-23/web-games/the-last-window/04/README.md`).

| Role | Family | Licence | Shipped file | Bytes | SHA-256 |
|---|---|---|---|---|---|
| Display | Young Serif (single weight 400) | OFL 1.1 | `public/fonts/young-serif/YoungSerif-Regular.woff2` | 25,464 | `d48c025fca525cd51af805feeb3d2d82c03f73f577c18f3ee2a06170c428bdb2` |
| Display | licence text | OFL 1.1 | `public/fonts/young-serif/OFL.txt` | 4,398 | `737d8d343b674c6894f373de71a044b6782c130f2aebf180933d63ddf7a3dc19` |
| Body | Nunito Sans (variable `wght` 400 to 800) | OFL 1.1 | `public/fonts/nunito-sans/NunitoSans-Variable.woff2` | 26,412 | `fc9591c87e4806058919d333c2d80d52bba0f6c2396cbeb8f17dd6976905d6fa` |
| Body | licence text | OFL 1.1 | `public/fonts/nunito-sans/OFL.txt` | 4,393 | `efbb0c9e864cef973982d9a17567e6be5c3d1759695574586f3f18c7ecca064b` |

Nunito Sans is pinned to `opsz` 12, `wdth` 100 and the `YTLC` default (500); only `wght` stays variable
(400 to 800, default 400). Both are subset to Basic Latin, Latin-1, U+2013, U+2014, U+2018 to U+201D,
U+2022 and U+2026. Budget: each woff2 at most 120 KB (largest 26 KB), total at most 300 KB (51,876 bytes
for the two woff2 files). Young Serif has no bold: headings use weight 400 and `font-synthesis: none`
keeps the browser from faking bold. No rendered text may fall back to a platform font: kit
`assertNoPlatformFontFallback` runs on every screen and sheet in `test/a11y.test.tsx`, and a test keeps
every source character inside the subset. Both fonts are preloaded from `index.html` and registered by
`src/boot/preload.ts`. The Credits screen lists them from `src/data/credits.ts`.

## Audio (CC0 only, delivered in task 05)

Sources, in the order tried: Kenney audio packs (Interface Sounds, Impact Sounds, Digital Audio, RPG
Audio, Music Jingles) at `kenney.nl/assets`; otherwise a page that explicitly states CC0 for the file
(OpenGameArt entries showing `License(s): CC0`). Nothing is synthesised. Every file has a row in
`public/audio/LICENSES.md` (author, source URL, licence, download date, SHA-256 of the shipped file,
what was done to it); pack and page licence records are copied to `public/audio/licenses/`. Sound
effects are Kenney originals, mono (stereo originals were downmixed with ffmpeg, libvorbis q4).
The rain loop and the three music loops are excerpts of OpenGameArt CC0 recordings with a 1.5 to 2 s
equal-power tail-to-head crossfade, mono, loudness-normalised. No slot ships silent. Candidates and
choices are in `.agents/resources/2026-10-23/web-games/the-last-window/05/README.md`.

| Slot id | Trigger | File | Bytes | Author | Source |
|---|---|---|---|---|---|
| `ui-tap` | any button tap | `ui-tap.ogg` | 4,371 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `ui-back` | Back button | `ui-back.ogg` | 7,208 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `ui-toggle` | settings toggle | `ui-toggle.ogg` | 8,654 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `ui-open-sheet` | pause, quit, purchase or plan sheet opens | `ui-open-sheet.ogg` | 15,046 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `customer-arrive` | a customer takes a seat (door bell) | `customer-arrive.ogg` | 8,323 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `seat-select` | a seat is selected | `seat-select.ogg` | 5,106 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `step-tap` | a correct recipe step | `step-tap.ogg` | 5,031 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `step-wrong` | a wrong recipe step (cup emptied) | `step-wrong.ogg` | 8,288 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `step-brew` | brew step starts | `step-brew.ogg` | 12,647 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `step-steam` | steam step starts | `step-steam.ogg` | 11,310 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `step-pour` | pour step | `step-pour.ogg` | 5,691 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `oven-start` | warm step starts | `oven-start.ogg` | 6,481 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `oven-ready` | pastry out of the oven (ding) | `oven-ready.ogg` | 5,856 | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds |
| `book-pick` | a book is placed on the ticket | `book-pick.ogg` | 6,377 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `serve` | tray handed over | `serve.ogg` | 8,665 | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds |
| `coin` | tip and payment shown | `coin.ogg` | 12,876 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `delighted` | delighted outcome | `delighted.ogg` | 8,517 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `disappointed` | disappointed outcome | `disappointed.ogg` | 5,956 | Kenney (Kenney Vleugels) | kenney.nl/assets/digital-audio |
| `customer-left` | customer leaves or is turned away | `customer-left.ogg` | 9,819 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `patience-warning` | a seated customer drops under 10 s | `patience-warning.ogg` | 8,233 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `shift-start` | shift begins | `shift-start.ogg` | 7,598 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `shift-end` | closing bell | `shift-end.ogg` | 6,637 | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds |
| `star-1` | shift result by stars | `star-1.ogg` | 9,370 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `star-2` | shift result by stars | `star-2.ogg` | 11,066 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `star-3` | shift result by stars | `star-3.ogg` | 14,977 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `scene-open` | a story scene opens (page turn) | `scene-open.ogg` | 10,701 | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio |
| `choice-pick` | a choice option is picked | `choice-pick.ogg` | 6,909 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `friendship-up` | a friendship level is reached | `friendship-up.ogg` | 12,686 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `ending` | scene 5 ending block starts | `ending.ogg` | 12,809 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `decor-buy` | decor purchased | `decor-buy.ogg` | 9,535 | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds |
| `unlock` | new recipe or book unlocked | `unlock.ogg` | 11,083 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `streak-up` | Late Shift streak extended | `streak-up.ogg` | 11,253 | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles |
| `rain-loop` | ambient rain during rain shifts and in the rain interior (loop) | `rain-loop.ogg` | 61,271 | haruta (user haruta on OpenGameArt) | opengameart.org/content/light-rain-and-heavy-rain |
| `music-menu` | title, home, plan, shop, journal (loop) | `music-menu.ogg` | 326,323 | OatCog (user OatCog on OpenGameArt) | opengameart.org/content/coffee-house-bump |
| `music-shift` | during a shift (loop) | `music-shift.ogg` | 233,916 | Pro Sensory (Alex McCulloch) | opengameart.org/content/jazz-slower |
| `music-story` | during a story scene (loop) | `music-story.ogg` | 291,999 | Pro Sensory (Alex McCulloch) | opengameart.org/content/just-you-and-me-guitar |

Total audio: 1,202,588 bytes (36 files, 1.15 MB; budget 2 MB). Each sound effect is at most 60 KB,
`rain-loop` at most 150 KB, each music loop at most 500 KB (`test/audio-assets.test.ts`).

Count: 33 sounds (including the `rain-loop` ambience) and 3 music loops = 36 slots.

Haptics (no files): light impact on step taps and book picks, medium impact on serve, `success` on
delighted and on each earned star, `warning` on a wrong step and when a customer leaves, `success` on
friendship level up, light impact on a choice. Nothing on plain navigation taps.

## Release totals and budgets (planned, task 08)

| Group | Budget | Enforced by |
|---|---|---|
| JS bundle (gzip, art/fonts/audio excluded) | at most 300 KB | `test/budgets.test.ts` (Vite build into `node_modules/.cache/bundle-check`) |
| Runtime art (`public/art`) | at most 8 MB; any 800 x 1200 file 400 KB; busts 120 KB; objects 60 KB | `test/budgets.test.ts`, `test/art-assets.test.ts` |
| Fonts (`public/fonts`) | at most 300 KB | `test/budgets.test.ts` |
| Audio (`public/audio`) | at most 2 MB | `test/budgets.test.ts`, `test/audio-assets.test.ts` |

## Capacitor icon and splash (planned, task 07)

Sources in `apps-games/the-last-window/assets/`, written by `scripts/build-icons.ts`: the accepted `icon`
master (1024 x 1024 opaque) as `icon-only.png` and `icon-foreground.png`, a flat `night` `#1F2F45`
`icon-background.png`, and 2732 x 2732 `splash.png` and `splash-dark.png` built from the accepted
`key-art` (or the code-drawn lamp-in-window badge on `night` if `key-art` is rejected). The
`feature-graphic` is a store asset only.
