# Lost Parcel Desk - assets index

Status after task 05: the two font families are bundled, the 67 art slots all have code-drawn fallbacks
(`src/art/slots.ts`, `manifest.ts`, `fallbacks.tsx`, `src/ui/Glyph.tsx`), with an empty manifest, so the game
renders completely today, and all 27 sound slots and both music loops ship as CC0 Ogg files (913,216 bytes).
Designer art (task 06) and icons and splash (task 07) are still to come and follow the plan below.

## Where things live

| What | Where |
|---|---|
| App code | `apps-games/lost-parcel-desk/` |
| Rules and content | `apps-games/lost-parcel-desk-core/` |
| Runtime art (WebP, 2x display size) | `apps-games/lost-parcel-desk/public/art/` |
| Art masters (WebP q90) | `.agents/resources/2026-10-23/web-games/lost-parcel-desk/art/masters/` |
| Fonts (woff2 + `OFL.txt`) | `apps-games/lost-parcel-desk/public/fonts/` |
| Audio (ogg + licence records) | `apps-games/lost-parcel-desk/public/audio/` and `.../public/audio/LICENSES.md` |
| Designer inbox (read-only input) | `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/` |
| Evidence and QA checklist | `.agents/resources/2026-10-23/web-games/lost-parcel-desk/` |

## Art style (summary of the brief)

1970s post-office cosy-noir in a risograph-print look. Limited palette: mustard, teal, brick red, cream,
ink (tokens in `product.md`). Visible grain and slight misregistration between colour layers (an ink layer
offset by 1 to 2 px from the fill), halftone shading, no gradients that look airbrushed. Objects are clean
illustrations on transparent backgrounds, one object per image, filling about 75 to 80 percent of the
square, lit from the top left with a short flat shadow offset down-right. Portraits are busts in the same
riso style, shoulders cropped, neutral expressions with one character detail. **No legible text on any
object or backdrop**: notes, stamps, labels and captions are overlaid by code in Courier Prime. The
designer's art bible is requested with batch B1 and copied beside the masters.

Rules: B1 sets the style anchor and is reviewed first; B2 to B5 must match its view, light and grain; B6
must match the portrait proportions below. Rejected slots keep their code-drawn fallback. Runtime art
budget: 8 MB total (expected below 3 MB); sprites at most 250 KB each, 800 x 1200 images at most 400 KB.

## Art slots (67)

Batches follow the spec: B1 is the style anchor (4 slots), B2 to B5 are the remaining 48 evidence objects in
case order (12 per batch), B6 holds the cast, the parcel and the store graphic (15 slots). The postcard from
B1 is object 01-1, so the 49 evidence objects are 1 + 48.

| Batch | Slot | Format | Master | Runtime size (2x display) | Used for | Fallback |
|---|---|---|---|---|---|---|
| B1 | `icon` | square, opaque | 1024 x 1024 | not in bundle (icons via @capacitor/assets) | App icon, splash | code-drawn stamp-and-envelope badge |
| B1 | `key-art` | portrait 2:3, title-safe band | 1600 x 2400 | 800 x 1200 | Title screen | flat palette gradient with code-drawn desk lamp |
| B1 | `desk-backdrop` | portrait 2:3, calm centre | 1600 x 2400 | 800 x 1200 | Behind the evidence table and the board | cream and night grain gradient |
| B1 | `evidence-postcard` | square, transparent | 1024 x 1024 | 560 x 560 | Object 01-1 (Seaside postcard) and the style anchor | code-drawn postcard |
| B2 | `evidence-01-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 01-2: Knitted scarf | code-drawn pictogram |
| B2 | `evidence-01-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 01-3: Muddy work glove | code-drawn pictogram |
| B2 | `evidence-01-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 01-4: Brass pocket compass | code-drawn pictogram |
| B2 | `evidence-02-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 02-1: Dented biscuit tin | code-drawn pictogram |
| B2 | `evidence-02-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 02-2: Folded hymn sheet | code-drawn pictogram |
| B2 | `evidence-02-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 02-3: Tin of throat lozenges | code-drawn pictogram |
| B2 | `evidence-02-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 02-4: Pressed buttercup bookmark | code-drawn pictogram |
| B2 | `evidence-03-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 03-1: Round hat box | code-drawn pictogram |
| B2 | `evidence-03-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 03-2: Brass barometer | code-drawn pictogram |
| B2 | `evidence-03-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 03-3: Embroidered tea towel | code-drawn pictogram |
| B2 | `evidence-03-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 03-4: Velvet drawstring bag | code-drawn pictogram |
| B2 | `evidence-04-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 04-1: Tin of mixed buttons | code-drawn pictogram |
| B3 | `evidence-04-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 04-2: Miniature signal lamp | code-drawn pictogram |
| B3 | `evidence-04-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 04-3: Battery card | code-drawn pictogram |
| B3 | `evidence-04-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 04-4: Raffle ticket stubs | code-drawn pictogram |
| B3 | `evidence-05-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 05-1: Brass lens cap | code-drawn pictogram |
| B3 | `evidence-05-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 05-2: Warranty card | code-drawn pictogram |
| B3 | `evidence-05-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 05-3: Folded lens cloth | code-drawn pictogram |
| B3 | `evidence-05-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 05-4: Crumpled coach ticket | code-drawn pictogram |
| B3 | `evidence-06-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 06-1: Cake box | code-drawn pictogram |
| B3 | `evidence-06-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 06-2: Clinic appointment card | code-drawn pictogram |
| B3 | `evidence-06-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 06-3: Twist of waxed paper | code-drawn pictogram |
| B3 | `evidence-06-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 06-4: Pocket diary | code-drawn pictogram |
| B3 | `evidence-07-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 07-1: Tuning fork | code-drawn pictogram |
| B4 | `evidence-07-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 07-2: Rehearsal notice | code-drawn pictogram |
| B4 | `evidence-07-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 07-3: Birdseed paper twist | code-drawn pictogram |
| B4 | `evidence-07-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 07-4: Chewed pencil stub | code-drawn pictogram |
| B4 | `evidence-08-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 08-1: Rubber ferrule | code-drawn pictogram |
| B4 | `evidence-08-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 08-2: Chemist's receipt | code-drawn pictogram |
| B4 | `evidence-08-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 08-3: Cushion cover | code-drawn pictogram |
| B4 | `evidence-08-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 08-4: Spotted handkerchief | code-drawn pictogram |
| B4 | `evidence-09-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 09-1: Matchbox of foam domes | code-drawn pictogram |
| B4 | `evidence-09-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 09-2: Clinic reorder card | code-drawn pictogram |
| B4 | `evidence-09-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 09-3: Brass door key | code-drawn pictogram |
| B4 | `evidence-09-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 09-4: Housing list extract | code-drawn pictogram |
| B4 | `evidence-10-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 10-1: Boxwood horse's head | code-drawn pictogram |
| B5 | `evidence-10-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 10-2: Postal scorecard | code-drawn pictogram |
| B5 | `evidence-10-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 10-3: Tower-climb certificate | code-drawn pictogram |
| B5 | `evidence-10-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 10-4: Bag of boiled sweets | code-drawn pictogram |
| B5 | `evidence-11-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 11-1: Brass house number 8 | code-drawn pictogram |
| B5 | `evidence-11-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 11-2: Lamplighter's round sheet | code-drawn pictogram |
| B5 | `evidence-11-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 11-3: Hobby-shop refund slip | code-drawn pictogram |
| B5 | `evidence-11-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 11-4: Chipped teacup | code-drawn pictogram |
| B5 | `evidence-12-1` | square, transparent | 1024 x 1024 | 560 x 560 | Object 12-1: Let-down trousers | code-drawn pictogram |
| B5 | `evidence-12-2` | square, transparent | 1024 x 1024 | 560 x 560 | Object 12-2: Tailor's ticket | code-drawn pictogram |
| B5 | `evidence-12-3` | square, transparent | 1024 x 1024 | 560 x 560 | Object 12-3: Ferry timetable | code-drawn pictogram |
| B5 | `evidence-12-4` | square, transparent | 1024 x 1024 | 560 x 560 | Object 12-4: Handwritten note | code-drawn pictogram |
| B5 | `evidence-12-5` | square, transparent | 1024 x 1024 | 560 x 560 | Object 12-5: Brass desk key | code-drawn pictogram |
| B6 | `townsfolk-1` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Odalie Fenn | code-drawn initials badge |
| B6 | `townsfolk-2` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Barnaby Crumb | code-drawn initials badge |
| B6 | `townsfolk-3` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Winifred Pike | code-drawn initials badge |
| B6 | `townsfolk-4` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Cosmo Vane | code-drawn initials badge |
| B6 | `townsfolk-5` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Marguerite Oake | code-drawn initials badge |
| B6 | `townsfolk-6` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Dennis Gault | code-drawn initials badge |
| B6 | `townsfolk-7` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Priya Lowell | code-drawn initials badge |
| B6 | `townsfolk-8` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Hettie Bloom | code-drawn initials badge |
| B6 | `townsfolk-9` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Iggy Marsh | code-drawn initials badge |
| B6 | `townsfolk-10` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Tobias Thimble | code-drawn initials badge |
| B6 | `townsfolk-11` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Rosalind Kettle | code-drawn initials badge |
| B6 | `townsfolk-12` | portrait 3:4 bust, transparent | 960 x 1280 | 360 x 480 | Profile card: Ambrose Quill | code-drawn initials badge |
| B6 | `parcel-closed` | square, transparent | 1024 x 1024 | 560 x 560 | Case intro, tied brown-paper parcel | code-drawn parcel |
| B6 | `parcel-open` | square, transparent | 1024 x 1024 | 560 x 560 | Evidence table, open parcel and spilled tissue | code-drawn open box |
| B6 | `feature-graphic` | landscape 3:2, no text | 1536 x 1024 | not in bundle | Store listing | none (store only) |

Provenance (slot, designer thread message, review verdict, masters path, bytes, SHA-256) is filled in by
task 06 as a generated table: `bun run build:art` (in the app) rewrites it, the masters, the runtime
files and `src/art/manifest.ts` from the designer inbox, and fails loudly with the slot id on any violation.

## Fonts

Both families are SIL OFL, downloaded from `github.com/google/fonts` in task 04, subset to Basic Latin,
Latin-1 and the punctuation used (U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026), converted to woff2 and
bundled under `public/fonts/` with the family `OFL.txt`. No rendered text may fall back to a platform font.

| Role | Family | Source path in google/fonts | Files shipped | Bytes | Budget |
|---|---|---|---|---|---|
| Display, clue text, stamps, labels | Courier Prime | `ofl/courierprime/CourierPrime-Regular.ttf`, `CourierPrime-Bold.ttf`, `OFL.txt` | `courier-prime/CourierPrime-Regular.woff2`, `courier-prime/CourierPrime-Bold.woff2`, `courier-prime/OFL.txt` | 17,668 and 18,172 | each at most 60 KB |
| Body, UI, profile cards | IBM Plex Sans | `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf`, `OFL.txt` | `ibm-plex-sans/IBMPlexSans.woff2` (variable, `wdth` pinned at 100, `wght` 100 to 700 kept), `ibm-plex-sans/OFL.txt` | 44,044 | at most 120 KB |

Fonts total 79,884 bytes of the 300 KB budget. Stacks: `"Courier Prime", "Courier New", monospace` and
`"IBM Plex Sans", system-ui, sans-serif` (the fallbacks exist only for the font-loading gap; the kit test
helper fails if any rendered text uses them; `test/a11y.test.tsx` runs it on every screen). `src/fonts.ts`
lists the `@font-face` faces; `registerFonts` runs in the boot screen and `index.html` preloads the bold Courier
Prime and the Plex file. Provenance (tool versions, commands, source and output SHA-256) is in
`.agents/resources/2026-10-23/web-games/lost-parcel-desk/04/README.md`.

## Code-drawn art (task 04)

`src/art/slots.ts` derives the 67 slot ids from the content (49 evidence objects from `artSlot`, 12 portraits from
`portraitSlot`) plus `icon`, `key-art`, `desk-backdrop`, `parcel-closed`, `parcel-open` and `feature-graphic`.
`src/art/manifest.ts` lists the slots that have a file in `public/art/`; it is empty until task 06, which only
flips entries. `<Sprite slot=... />` renders the image when the manifest lists the slot and the fallback otherwise.
Fallbacks use palette tokens only: the 14 object glyphs (`tin cloth paper card key glove bag box metal wood lens lamp
ticket hat`, each a flat riso drawing with a 2 px offset second-colour layer and a dot-grain pass), an initials badge
for each portrait, a brown-paper parcel and an open box, a grained desk backdrop, a key-art lamp-and-desk scene and
the stamp-and-envelope icon badge. No fallback draws text except the portrait initials.

## Audio (CC0 only, delivered in task 05)

Sources, in the order tried: Kenney audio packs at `kenney.nl/assets` (Interface Sounds, Impact Sounds,
RPG Audio, Digital Audio, Music Jingles); otherwise a page that explicitly states CC0 for the file (OpenGameArt
entries that show `License(s): CC0`). Kenney has no Music Loops pack page (`kenney.nl/assets/music-loops` is a
404), so both music loops and the typing loop come from CC0 OpenGameArt pages. Nothing is synthesised: the
loops are excerpts of CC0 recordings with a crossfaded tail. Every file has a row in `public/audio/LICENSES.md`
(author, source URL, licence, download date, SHA-256) and the pack and page licence texts are in
`public/audio/licenses/`. `test/audio-assets.test.ts` proves the rows match the files and that the credits
screen lists the same rows. Budget: all audio at most 2 MB, each sound effect at most 60 KB (mono Ogg Vorbis),
each music loop at most 600 KB.

| Slot id | Trigger | File | Bytes | Source | Original |
|---|---|---|---|---|---|
| `ui-tap` | any button tap | `ui-tap.ogg` | 4,275 | https://kenney.nl/assets/interface-sounds | `Audio/click_002.ogg` |
| `ui-back` | Back button | `ui-back.ogg` | 7,029 | https://kenney.nl/assets/interface-sounds | `Audio/back_002.ogg` |
| `ui-toggle` | a settings toggle | `ui-toggle.ogg` | 8,056 | https://kenney.nl/assets/interface-sounds | `Audio/toggle_002.ogg` |
| `ui-open-sheet` | a sheet opens | `ui-open-sheet.ogg` | 14,975 | https://kenney.nl/assets/interface-sounds | `Audio/open_002.ogg` |
| `parcel-open` | the parcel is opened | `parcel-open.ogg` | 7,346 | https://kenney.nl/assets/rpg-audio | `Audio/cloth2.ogg` |
| `object-open` | an object is picked up | `object-open.ogg` | 10,701 | https://kenney.nl/assets/rpg-audio | `Audio/bookFlip1.ogg` |
| `object-flip` | an object is turned over | `object-flip.ogg` | 7,813 | https://kenney.nl/assets/rpg-audio | `Audio/bookFlip2.ogg` |
| `zoom-toggle` | the magnifier is switched on or off | `zoom-toggle.ogg` | 5,629 | https://kenney.nl/assets/interface-sounds | `Audio/switch_003.ogg` |
| `clue-found` | a clue is found | `clue-found.ogg` | 8,968 | https://kenney.nl/assets/interface-sounds | `Audio/confirmation_001.ogg` |
| `clue-pin` | a clue is pinned | `clue-pin.ogg` | 9,196 | https://kenney.nl/assets/impact-sounds | `Audio/impactPlank_medium_000.ogg` |
| `clue-unpin` | a clue is unpinned | `clue-unpin.ogg` | 5,048 | https://kenney.nl/assets/impact-sounds | `Audio/impactWood_light_001.ogg` |
| `clue-link` | a clue is linked to a card | `clue-link.ogg` | 4,679 | https://kenney.nl/assets/interface-sounds | `Audio/pluck_001.ogg` |
| `clue-unlink` | a link is removed | `clue-unlink.ogg` | 8,989 | https://kenney.nl/assets/interface-sounds | `Audio/scratch_001.ogg` |
| `hint-use` | a hint is bought | `hint-use.ogg` | 4,848 | https://kenney.nl/assets/interface-sounds | `Audio/bong_001.ogg` |
| `accuse` | Accuse is confirmed | `accuse.ogg` | 4,547 | https://kenney.nl/assets/impact-sounds | `Audio/impactWood_heavy_000.ogg` |
| `wrong-guess` | wrong accusation, "Return to sender" | `wrong-guess.ogg` | 5,416 | https://kenney.nl/assets/digital-audio | `Audio/lowRandom.ogg` |
| `stamp-thud` | the rubber stamp lands on the reveal | `stamp-thud.ogg` | 4,997 | https://kenney.nl/assets/impact-sounds | `Audio/impactSoft_heavy_001.ogg` |
| `typewriter` | the reveal text types out (loop, only while typing) | `typewriter.ogg` | 22,540 | https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes | `Generated Typing/generated-006_faster.wav` |
| `stamp-1` | reveal, 1 stamp | `stamp-1.ogg` | 7,359 | https://kenney.nl/assets/music-jingles | `Audio/Pizzicato jingles/jingles_PIZZI05.ogg` |
| `stamp-2` | reveal, 2 stamps | `stamp-2.ogg` | 8,002 | https://kenney.nl/assets/music-jingles | `Audio/Pizzicato jingles/jingles_PIZZI09.ogg` |
| `stamp-3` | reveal, 3 stamps | `stamp-3.ogg` | 10,630 | https://kenney.nl/assets/music-jingles | `Audio/Pizzicato jingles/jingles_PIZZI14.ogg` |
| `ledger-found` | a ledger fragment is unlocked | `ledger-found.ogg` | 13,565 | https://kenney.nl/assets/music-jingles | `Audio/Steel jingles/jingles_STEEL01.ogg` |
| `map-fill` | a place on the town map fills in | `map-fill.ogg` | 6,767 | https://kenney.nl/assets/interface-sounds | `Audio/select_005.ogg` |
| `achievement` | an achievement toast | `achievement.ogg` | 11,066 | https://kenney.nl/assets/music-jingles | `Audio/Sax jingles/jingles_SAX03.ogg` |
| `chapter-unlock` | a chapter opens | `chapter-unlock.ogg` | 10,658 | https://kenney.nl/assets/music-jingles | `Audio/Steel jingles/jingles_STEEL05.ogg` |
| `theme-unlock` | a desk theme unlocks | `theme-unlock.ogg` | 9,116 | https://kenney.nl/assets/music-jingles | `Audio/Hit jingles/jingles_HIT10.ogg` |
| `streak-up` | the daily streak is extended | `streak-up.ogg` | 11,253 | https://kenney.nl/assets/music-jingles | `Audio/Pizzicato jingles/jingles_PIZZI01.ogg` |
| `music-desk` | menus and the evidence table (loop) | `music-desk.ogg` | 298,776 | https://opengameart.org/content/calm-piano-1-vaporware | `003_Vaporware_2.mp3` |
| `music-case` | the deduction board (loop) | `music-case.ogg` | 380,972 | https://opengameart.org/content/another-august | `013_Another_August_0.mp3` |

That is 27 sound slots (the first 27 rows) and 2 music loops: 29 files, 913,216 bytes in total against the 2 MB
budget; the largest are `music-case` (380,972 bytes) and `music-desk` (298,776 bytes). No slot is silent. The
`typewriter` slot is a loop of a Cherry KC 1000 keyboard recording (the pack calls it "perfect for typewriter
effects"); it runs only while the reveal text is typing. Choices were made by licence, pack, name, duration and
slot fit; nothing was listened to (owner reviews the sound in browser QA).

Haptics (no files): light impact when pinning, linking or flipping; `warning` on a wrong accusation; medium
impact on Accuse; `success` on a correct delivery, each stamp earned, a chapter unlock and a theme unlock.
Nothing on plain button taps. The map lives in `src/audio/events.ts` (`cueFor`).

Music: `music-desk` plays on every screen except the deduction board, which plays `music-case`; the two
cross-fade over 1.2 s. Both honour the Music switch and the sound effects honour the Sound switch.

## Release totals and budgets (filled in by task 08)

| Group | Budget | Enforced by |
|---|---|---|
| JS bundle (gzip, art, fonts and audio excluded) | 300 KB | `test/budgets.test.ts` (runs a Vite build into `node_modules/.cache/bundle-check`) |
| Runtime art (`public/art`) | 8 MB; any sprite 250 KB, any 800 x 1200 image 400 KB | `test/budgets.test.ts`, `test/art-assets.test.ts` |
| Fonts (`public/fonts`) | 300 KB | `test/budgets.test.ts` |
| Audio (`public/audio`) | 2 MB | `test/budgets.test.ts`, `test/audio-assets.test.ts` |

## Capacitor icon and splash (task 07)

Sources are written to `apps-games/lost-parcel-desk/assets/` by `scripts/build-icons.ts`: `icon-only.png`
(1024, opaque) from the accepted `icon` master and `splash.png` and `splash-dark.png` (2732) composed from
the accepted `key-art` master centred on the `night` colour `#141a22`. If a slot is missing or rejected,
`scripts/draw-fallback-icon.ts` draws a code-drawn stamp-and-envelope badge from the palette tokens and the
splash is that badge on `#141a22`. `@capacitor/assets` turns the sources into Android and iOS resources.
