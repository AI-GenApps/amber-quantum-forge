# Dress Rehearsal - assets index

Status after task 04: the three font files are bundled (table below); no audio and no designer art
yet (`src/art/manifest.ts` is empty, so every one of the 63 slots shows its code-drawn fallback).
This file is the plan for art slots and briefs (63 slots), fonts, the audio plan (24 sounds, 2
music loops) and where everything lives. Tasks 05 to 07 fill in the remaining provenance tables. Every art slot has a code-drawn fallback, so the game renders
completely with zero, some or all slots present.

## Where things live

| What | Where |
|---|---|
| App code | `apps-games/dress-rehearsal/` |
| Rules and content | `apps-games/dress-rehearsal-core/` |
| Runtime art (WebP, 2x display size) | `apps-games/dress-rehearsal/public/art/` |
| Art masters (WebP q90) | `.agents/resources/2026-10-23/web-games/dress-rehearsal/art/masters/` |
| Fonts (woff2 + `OFL.txt`) | `apps-games/dress-rehearsal/public/fonts/` |
| Audio (ogg + licence records) | `apps-games/dress-rehearsal/public/audio/` and `.../public/audio/LICENSES.md` |
| Designer inbox (read-only input) | `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/` |
| Evidence and QA checklist | `.agents/resources/2026-10-23/web-games/dress-rehearsal/` |

## Art style (summary of the brief)

Editorial fashion illustration: gouache and marker on warm paper, confident brush strokes, a
sophisticated muted palette with one accent per theme (sky for Riviera Summer, yellow for Rainy
City, red for Gala Night, green for Mountain Weekend, violet for Studio Avant-garde, orange for
Vintage 70s). Garments are flat-lay objects shot straight from above with consistent soft top
lighting and a very soft contact shadow, on a transparent background, no body, no mannequin, no
hanger, no text, no logos, no hands. The same scale rules apply to every category so any
combination looks right on the board. Colour must match the `colour` tag in `content-plan.md`
(a "sky" shirt reads as sky blue, a "cream" blouse as cream). The garment code-drawn fallbacks use
the same palette tokens (`product.md`).

### Scale rules (fraction of the 1024 px frame the garment's bounding box fills)

| Category | Orientation | Bounding box |
|---|---|---|
| top | sleeves out, neck up | 80 percent of width, 70 percent of height |
| bottom | legs straight, waist up | 55 percent of width, 88 percent of height |
| dress | full length, straight | 62 percent of width, 92 percent of height |
| outer | sleeves relaxed, collar up | 84 percent of width, 80 percent of height |
| shoes | one pair, side by side, toes up | 78 percent of width, 62 percent of height |
| bag | upright, strap tucked | 60 percent of width, 62 percent of height |
| hat | crown up | 78 percent of width, 62 percent of height |
| accessory | laid flat | 52 percent of width, 52 percent of height |

Bounding boxes stay inside the 85 percent safe area, are centred, and leave a transparent margin.
Clients (`client-1..6`, order Mireille, Tobias, Ottoline, Priya, Jun, Edie): head-and-shoulders
bust in the same gouache style, original characters, neutral studio pose, transparent background,
no text. Backdrops: empty flat-lay surface only (linen, paper grain, a few soft props at the edges
allowed), no garments, a calm centre where the slots sit, a chapter-accent tint. Key art: title-safe
band across the top third, no text. Feature graphic: landscape, no text.

## Art slots (63)

Batches: B1 style anchor (4), B2 to B5 the remaining 47 pieces (12, 12, 12, 11), B6 clients,
backdrops and feature graphic (12). Piece names, tags and per-piece art notes are in
`content-plan.md`. Runtime budgets: pieces at most 60 KB each, clients at most 100 KB, 800 x 1200
images at most 400 KB, total runtime art at most 8 MB (expected under 2 MB).

| Batch | Slot | Format | Master | Runtime size (2x display) | Used for | Fallback |
|---|---|---|---|---|---|---|
| B1 | `icon` | square, opaque | 1024 x 1024 | not in bundle (icons via @capacitor/assets) | App icon, splash badge | code-drawn hanger-and-ribbon badge |
| B1 | `key-art` | portrait 2:3, title-safe band | 1600 x 2400 | 800 x 1200 | Title screen | paper gradient with a code-drawn hanger and board |
| B1 | `item-riviera-1` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece (style anchor) | code-drawn garment glyph |
| B1 | `backdrop-studio` | portrait 2:3 board surface | 1600 x 2400 | 800 x 1200 | Studio Avant-garde board backdrop and the style anchor for all backdrops | linen colour with paper grain drawn in code |
| B2 | `item-riviera-2` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Sky Camp-Collar Shirt (top) | code-drawn garment glyph in the piece colour |
| B2 | `item-riviera-3` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Cream Linen Trousers (bottom) | code-drawn garment glyph in the piece colour |
| B2 | `item-riviera-4` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Orange Wrap Skirt (bottom) | code-drawn garment glyph in the piece colour |
| B2 | `item-riviera-5` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: White Rope Espadrilles (shoes) | code-drawn garment glyph in the piece colour |
| B2 | `item-riviera-6` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Straw Basket Tote (bag) | code-drawn garment glyph in the piece colour |
| B2 | `item-riviera-7` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Wide-Brim Sun Hat (hat) | code-drawn garment glyph in the piece colour |
| B2 | `item-riviera-8` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Cat-Eye Sunglasses (accessory) | code-drawn garment glyph in the piece colour |
| B2 | `item-rainy-city-1` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Yellow Rain Slicker (outer) | code-drawn garment glyph in the piece colour |
| B2 | `item-rainy-city-2` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Camel Trench Coat (outer) | code-drawn garment glyph in the piece colour |
| B2 | `item-rainy-city-3` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Grey Wool Jumper (top) | code-drawn garment glyph in the piece colour |
| B2 | `item-rainy-city-4` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Navy Pleated Trousers (bottom) | code-drawn garment glyph in the piece colour |
| B2 | `item-rainy-city-5` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Black Rubber Boots (shoes) | code-drawn garment glyph in the piece colour |
| B3 | `item-rainy-city-6` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Mint Waxed Satchel (bag) | code-drawn garment glyph in the piece colour |
| B3 | `item-rainy-city-7` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Navy Shirtdress (dress) | code-drawn garment glyph in the piece colour |
| B3 | `item-rainy-city-8` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Black Compact Umbrella (accessory) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-1` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Red Satin Column Gown (dress) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-2` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Black Velvet Midi Dress (dress) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-3` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Cream Silk Blouse (top) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-4` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Black Tuxedo Trousers (bottom) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-5` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Midnight Opera Coat (outer) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-6` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Gold Strappy Heels (shoes) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-7` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Silver Beaded Clutch (bag) | code-drawn garment glyph in the piece colour |
| B3 | `item-gala-8` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Pearl Collar Necklace (accessory) | code-drawn garment glyph in the piece colour |
| B3 | `item-mountain-1` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Red Check Flannel Shirt (top) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-2` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Cream Cable-Knit Sweater (top) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-3` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Tan Hiking Trousers (bottom) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-4` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Orange Down Puffer (outer) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-5` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Black Trail Boots (shoes) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-6` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Blue Canvas Rucksack (bag) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-7` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Grey Wool Beanie (hat) | code-drawn garment glyph in the piece colour |
| B4 | `item-mountain-8` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Green Wool Scarf (accessory) | code-drawn garment glyph in the piece colour |
| B4 | `item-studio-1` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Violet Origami Top (top) | code-drawn garment glyph in the piece colour |
| B4 | `item-studio-2` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Grey Pleated Culottes (bottom) | code-drawn garment glyph in the piece colour |
| B4 | `item-studio-3` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: White Drape Dress (dress) | code-drawn garment glyph in the piece colour |
| B4 | `item-studio-4` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Cobalt Oversized Blazer-Coat (outer) | code-drawn garment glyph in the piece colour |
| B4 | `item-studio-5` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Black Platform Boots (shoes) | code-drawn garment glyph in the piece colour |
| B5 | `item-studio-6` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Magenta Geometric Bag (bag) | code-drawn garment glyph in the piece colour |
| B5 | `item-studio-7` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Blush Sculpted Felt Hat (hat) | code-drawn garment glyph in the piece colour |
| B5 | `item-studio-8` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Chrome Sculpture Cuff (accessory) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-1` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Cream Pussy-Bow Blouse (top) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-2` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Rust Flared Corduroys (bottom) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-3` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Mustard Maxi Dress (dress) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-4` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Tan Suede Fringe Jacket (outer) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-5` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Red Platform Clogs (shoes) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-6` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Olive Patchwork Shoulder Bag (bag) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-7` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Navy Floppy Felt Hat (hat) | code-drawn garment glyph in the piece colour |
| B5 | `item-vintage-8` | square, transparent flat-lay | 1024 x 1024 | 256 x 256 | Closet piece: Teal Bead Necklace (accessory) | code-drawn garment glyph in the piece colour |
| B6 | `client-1` | portrait 3:4 bust, transparent | 1536 x 2048 | 360 x 480 | Client portrait: Mireille Vasseur, Travel writer | code-drawn initial badge in the chapter accent |
| B6 | `client-2` | portrait 3:4 bust, transparent | 1536 x 2048 | 360 x 480 | Client portrait: Tobias Okafor, Storm photographer | code-drawn initial badge in the chapter accent |
| B6 | `client-3` | portrait 3:4 bust, transparent | 1536 x 2048 | 360 x 480 | Client portrait: Dame Ottoline Frost, Opera patron | code-drawn initial badge in the chapter accent |
| B6 | `client-4` | portrait 3:4 bust, transparent | 1536 x 2048 | 360 x 480 | Client portrait: Priya Raman, Mountain guide | code-drawn initial badge in the chapter accent |
| B6 | `client-5` | portrait 3:4 bust, transparent | 1536 x 2048 | 360 x 480 | Client portrait: Jun Aoki, Gallery curator | code-drawn initial badge in the chapter accent |
| B6 | `client-6` | portrait 3:4 bust, transparent | 1536 x 2048 | 360 x 480 | Client portrait: Edie Lindqvist, Vintage shop owner | code-drawn initial badge in the chapter accent |
| B6 | `backdrop-riviera` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Board backdrop: Riviera Summer | linen colour with a chapter-accent tint |
| B6 | `backdrop-rainy-city` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Board backdrop: Rainy City | linen colour with a chapter-accent tint |
| B6 | `backdrop-gala` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Board backdrop: Gala Night | linen colour with a chapter-accent tint |
| B6 | `backdrop-mountain` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Board backdrop: Mountain Weekend | linen colour with a chapter-accent tint |
| B6 | `backdrop-vintage` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Board backdrop: Vintage 70s | linen colour with a chapter-accent tint |
| B6 | `feature-graphic` | landscape 3:2, no text | 1536 x 1024 | not in bundle (store asset) | Store feature graphic and promo | none (store asset only) |

### Provenance (task 06)

Pending. Task 06 adds one row per slot: status (accepted, rejected, missing), designer batch and
round, review verdict reference, runtime file, master path, bytes, SHA-256 of the master. Slots
that are rejected or missing keep their code-drawn fallback.

## Fonts

| Role | Family | Licence | Source in `github.com/google/fonts` | Shipped as | Bytes |
|---|---|---|---|---|---|
| Display | Playfair Display | OFL 1.1 | `ofl/playfairdisplay/PlayfairDisplay[wght].ttf` | `public/fonts/playfair-display/PlayfairDisplay-Variable.woff2` (wght 400 to 900) | 48,444 |
| Display italic | Playfair Display Italic | OFL 1.1 | `ofl/playfairdisplay/PlayfairDisplay-Italic[wght].ttf` | `public/fonts/playfair-display/PlayfairDisplay-Italic-Variable.woff2` (client lines, `style: "italic"`) | 48,120 |
| Body | DM Sans | OFL 1.1 | `ofl/dmsans/DMSans[opsz,wght].ttf` | `public/fonts/dm-sans/DMSans-Variable.woff2` (wght 400 to 700, `opsz` pinned at 14) | 23,844 |

Each family folder also holds its `OFL.txt` (4,449 and 4,482 bytes). The three woff2 files total
120,408 bytes (budget: each at most 120 KB, total at most 300 KB).

Folder and file names were confirmed through the GitHub API on 2026-10-23. Subset to Basic Latin,
Latin-1, U+2013, U+2014, U+2018 to U+201D, U+2022 and U+2026 (the dollar sign is Basic Latin).
Tool, commands and SHA-256 hashes are in
`.agents/resources/2026-10-23/web-games/dress-rehearsal/04/README.md`. No rendered text may fall
back to a platform font (kit `assertNoPlatformFontFallback` runs on every screen and sheet in
tests, and a test keeps every source character inside the subset).

## Audio (CC0 only, delivered in task 05)

Sources, in the order tried: Kenney audio packs (Interface Sounds, UI Audio, Impact Sounds,
Digital Audio, RPG Audio, Music Jingles) at `kenney.nl/assets`; otherwise a page that explicitly
states CC0 for the file (OpenGameArt entries showing `License(s): CC0`). Nothing is synthesised.
Every file gets a row in `public/audio/LICENSES.md` (author, source URL, licence, download date,
SHA-256 of the shipped file); pack licence texts go in `public/audio/licenses/`. A slot with no CC0
source ships silent and is listed in `open-questions.md`. Budgets: all audio at most 2 MB, each
sound at most 60 KB (mono ogg), each music loop at most 600 KB.

| Slot id | Trigger | Planned source family |
|---|---|---|
| `ui-tap` | any button tap | Kenney Interface Sounds |
| `ui-back` | Back button | Kenney Interface Sounds |
| `ui-toggle` | a settings toggle | Kenney Interface Sounds |
| `ui-open-sheet` | brief, result, export, hint or exit sheet opens | Kenney Interface Sounds |
| `ui-tab` | closet tray tab changes | Kenney Interface Sounds |
| `item-pick` | a piece is lifted (drag start or tap-select) | Kenney Impact Sounds (soft) |
| `item-place` | a piece lands in its slot | Kenney Impact Sounds (soft) |
| `item-swap` | a piece replaces another | Kenney Impact Sounds (soft) |
| `item-remove` | a slot is cleared | Kenney Interface Sounds |
| `item-invalid` | drop refused (wrong slot) | Kenney Interface Sounds |
| `rule-met` | a rule chip turns met | Kenney Digital Audio or Interface Sounds |
| `rule-broken` | a met rule becomes unmet | Kenney Digital Audio or Interface Sounds |
| `look-complete` | the last open slot is filled | Kenney Interface Sounds |
| `finish-look` | Finish look pressed | Kenney Interface Sounds |
| `star-1` | first star revealed | Kenney Music Jingles or Interface Sounds |
| `star-2` | second star revealed | Kenney Music Jingles or Interface Sounds |
| `star-3` | third star revealed | Kenney Music Jingles or Interface Sounds |
| `result-miss` | result with 0 stars | Kenney Interface Sounds |
| `hint-use` | hint bought and revealed | Kenney Interface Sounds |
| `coin-gain` | coins added to the purse | Kenney Interface Sounds or RPG Audio |
| `unlock` | chapter, frame or affinity level unlocked | Kenney Music Jingles |
| `streak-up` | Daily streak increases | Kenney Music Jingles |
| `export-shutter` | image export taken | a CC0 page (OpenGameArt) or a Kenney click if none |
| `frame-select` | export frame changed | Kenney Interface Sounds |
| `music-menu` (loop) | Home, lists, Closet, Gallery | a CC0 OpenGameArt page (calm editorial jazz or bossa style) |
| `music-style` (loop) | Styling board | a CC0 OpenGameArt page (light, unobtrusive) |

Files, authors, URLs and bytes are filled in by task 05 (this table then gains the file, author,
source and bytes columns).

## Release totals and budgets (task 08)

| Budget | Limit |
|---|---|
| JS bundle (gzip, excluding art, fonts and audio) | 300 KB |
| Runtime art | 8 MB total; any single file at most 400 KB |
| Fonts | each woff2 at most 120 KB; total at most 300 KB |
| Audio | 2 MB total |

Shipped numbers are recorded here by task 08.

## Capacitor icon and splash (task 07)

Sources live in `apps-games/dress-rehearsal/assets/` and are written by `scripts/build-icons.ts`
(deterministic); `@capacitor/assets` turns them into the Android and iOS resources. If the
`icon` and `key-art` slots are accepted they are used; otherwise a code-drawn hanger-and-ribbon
badge from the palette tokens on `night` `#1c1816` is used and the evidence README says which path
was taken.
