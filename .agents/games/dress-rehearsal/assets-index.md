# Dress Rehearsal - assets index

Status after task 08 (v1 complete, pending owner QA): the three font files, 26 CC0 audio files and 60 of the 63 designer art slots are
bundled or archived (tables below); 58 runtime WebP files are listed in `src/art/manifest.ts`, the `icon` and
`feature-graphic` masters are store assets, and `key-art`, `item-rainy-city-5` and `item-studio-3`
keep their code-drawn fallback.
This file is the plan for art slots and briefs (63 slots), fonts, the audio plan (24 sounds, 2
music loops) and where everything lives. Task 06 filled the art provenance table, task 07 the icon and splash section and task 08 the release totals. Every art slot has a code-drawn fallback, so the game renders
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

The master sizes above are the plan. The designer delivered at generation size (pieces and icon
1024 x 1024, clients and backdrops 1024 x 1536, feature graphic 1536 x 1024), and the committed masters
keep that size (decision D32). The client runtime is the 3:4 content frame of the 2:3 canvas.

### Provenance (task 06)

One row per slot, generated by `apps-games/dress-rehearsal/scripts/build-art.ts` (do not edit the
table by hand; rerun the script). Review notes are copies of the designer review loop files under
`.agents/resources/2026-10-23/web-games/dress-rehearsal/art/reviews/`; masters under `.../art/masters/`.

<!-- provenance:begin -->
| Slot | Status | Batch / round | Review notes | Runtime file | Runtime bytes | Master (WebP q90) | Master bytes | Master SHA-256 | Fallback or note |
|---|---|---|---|---|---|---|---|---|---|
| `icon` | accepted | b1 / 1 | `art/reviews/b1/round-1.md` | - | - | `art/masters/icon.webp` | 31,108 | `f8cb26507827a27e53d66bf68db530bb693053a5867454d201d61130e4317f4e` | store asset, not in the bundle |
| `key-art` | missing | retry / 3 | `art/reviews/retry/round-3.md` | - | - | - | - | - | code-drawn fallback kept: Rejected as missing: no key-art.png was delivered because the cover attempts failed (the assembled retry cover was also rejected for style drift) |
| `item-riviera-1` | accepted | b1 / 1 | `art/reviews/b1/round-1.md` | `public/art/item-riviera-1.webp` | 9,924 | `art/masters/item-riviera-1.webp` | 78,288 | `24775d392c9eae6c64e3ff0804592356cd4edd60dbdb78c3558c0437bc3f900e` | designer art shipped |
| `item-riviera-2` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-2.webp` | 8,800 | `art/masters/item-riviera-2.webp` | 82,792 | `00c5dd3722b87cc02a420590ca470afa10edd85e7cc8c995740793c1b4f9b802` | designer art shipped |
| `item-riviera-3` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-3.webp` | 9,000 | `art/masters/item-riviera-3.webp` | 71,616 | `dcb0e928c066ea7c70668d3abb89e1d03a25426e9fcdff214ef51217297f7504` | designer art shipped |
| `item-riviera-4` | accepted | b2 / 2 | `art/reviews/b2/round-2.md` | `public/art/item-riviera-4.webp` | 6,286 | `art/masters/item-riviera-4.webp` | 47,478 | `78181aeca44aba25bd3e6f159edd55d91597bc49c0a9338f546e0a098de66ace` | designer art shipped |
| `item-riviera-5` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-5.webp` | 10,620 | `art/masters/item-riviera-5.webp` | 93,310 | `b8234c0652d2d5dd574cc306f554f9f3d1d473a7efe7eccbecef39c07638d5ce` | designer art shipped |
| `item-riviera-6` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-6.webp` | 8,770 | `art/masters/item-riviera-6.webp` | 72,968 | `446e23babaac1045e2ea80a10d8568a2906d9f73e542962a4aa9bb1895f1ff45` | designer art shipped |
| `item-riviera-7` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-7.webp` | 8,430 | `art/masters/item-riviera-7.webp` | 76,062 | `23167d57067a5f5a73a37690014de1e39a2588add2d5ac47d53569202b711894` | designer art shipped |
| `item-riviera-8` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-8.webp` | 3,244 | `art/masters/item-riviera-8.webp` | 18,932 | `19f2ae6db7ea2fa344d2e02a44cf91be57fe5820ea625f05a7241c48f611650d` | designer art shipped |
| `item-rainy-city-1` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-rainy-city-1.webp` | 12,626 | `art/masters/item-rainy-city-1.webp` | 110,738 | `ce3988969d9375b58b1e392d76a1655f24d7cd5a714cc8f83277a741f4c1bde3` | designer art shipped |
| `item-rainy-city-2` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-rainy-city-2.webp` | 12,654 | `art/masters/item-rainy-city-2.webp` | 105,850 | `92247666cb8368ddcd12ce1e30a39059bdc3fb8013283f0dae34ed443c5cd046` | designer art shipped |
| `item-rainy-city-3` | accepted | b2 / 2 | `art/reviews/b2/round-2.md` | `public/art/item-rainy-city-3.webp` | 8,002 | `art/masters/item-rainy-city-3.webp` | 50,582 | `49c509dc126034299751d5e4a011208020317332abffaf854dcdc828ffbce0c1` | designer art shipped |
| `item-rainy-city-4` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-rainy-city-4.webp` | 7,310 | `art/masters/item-rainy-city-4.webp` | 55,744 | `6446c965f9d860fba3d0d8d30370d530b7940cbdf632169c12117a59fbe6cdf4` | designer art shipped |
| `item-rainy-city-5` | missing | b2 / 4 | `art/reviews/b2/round-4.md` | - | - | - | - | - | code-drawn fallback kept: Rejected as missing: no file was delivered because all four candidates failed the designer's own self-review |
| `item-rainy-city-6` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-rainy-city-6.webp` | 7,720 | `art/masters/item-rainy-city-6.webp` | 71,644 | `6b8f27432f72d3afe1204fecb8b16d1b75280c93690cda8c1690a79e61fcfef6` | designer art shipped |
| `item-rainy-city-7` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-rainy-city-7.webp` | 9,038 | `art/masters/item-rainy-city-7.webp` | 70,460 | `ea7598789489dc2d9f605d034c0c1b7a06b9b703e0ddcb10bb9f208112408f1b` | designer art shipped |
| `item-rainy-city-8` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-rainy-city-8.webp` | 4,774 | `art/masters/item-rainy-city-8.webp` | 30,554 | `82ea9ff855dea9f66e1bc0f0a00bf8e328739b339f6ff9d0e789672c5469394c` | designer art shipped |
| `item-gala-1` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-1.webp` | 6,904 | `art/masters/item-gala-1.webp` | 49,446 | `b9c47a2a72ebbe20c5e41f82a23eeb1a440faf90d0e35e1579da4854295d0cbc` | designer art shipped |
| `item-gala-2` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-2.webp` | 9,562 | `art/masters/item-gala-2.webp` | 81,728 | `c32c9a9ff04c8001a9b0fb833e0d9a838d3e587f3ba350cdee3e2a242cd4ddf0` | designer art shipped |
| `item-gala-3` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-3.webp` | 10,810 | `art/masters/item-gala-3.webp` | 82,364 | `74637d03c0a3e4bc460fc977f37916b89b7d5291d0198752ba1a9297630d40f0` | designer art shipped |
| `item-gala-4` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-4.webp` | 6,874 | `art/masters/item-gala-4.webp` | 52,496 | `dbea6b2478e93ee6812e53188b9a596ac6f571516defcb38a097eb7ad0513dab` | designer art shipped |
| `item-gala-5` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-5.webp` | 11,948 | `art/masters/item-gala-5.webp` | 92,018 | `434e1a56822a147cd75215d0cfd17958ed45de489a65b3073d4ec05065cf7265` | designer art shipped |
| `item-gala-6` | accepted | b3 / 2 | `art/reviews/b3/round-2.md` | `public/art/item-gala-6.webp` | 9,952 | `art/masters/item-gala-6.webp` | 78,844 | `80929eb688bf8df5cc1df916ca2b00f24124ae2b2f9e68172724ed406f579432` | designer art shipped |
| `item-gala-7` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-7.webp` | 7,304 | `art/masters/item-gala-7.webp` | 53,954 | `e5cbb2f9b9463b4a847428bef7eed42f8e30f0824759ed7558fead2e48f8df2b` | designer art shipped |
| `item-gala-8` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-8.webp` | 5,736 | `art/masters/item-gala-8.webp` | 39,612 | `3420beffde68a90761dbda4c7303f014ec240ee0ba88f2febe820ee124bb6e3a` | designer art shipped |
| `item-mountain-1` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-mountain-1.webp` | 9,094 | `art/masters/item-mountain-1.webp` | 86,300 | `90ad054e8510fb25e0d067f633ed567e3b2fb0d3ca27f5de8af1796b74e517e7` | designer art shipped |
| `item-mountain-2` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-2.webp` | 10,974 | `art/masters/item-mountain-2.webp` | 80,968 | `a69b25b37b0dd5ddbde9b95c0d54930e97bdf4aa6ecf51cfb927c0592d084651` | designer art shipped |
| `item-mountain-3` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-3.webp` | 9,330 | `art/masters/item-mountain-3.webp` | 79,872 | `c8d727b52ec21a8faa74fdafddbd3cba50a4d3aeb8f9dc06692b124a03718785` | designer art shipped |
| `item-mountain-4` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-4.webp` | 11,302 | `art/masters/item-mountain-4.webp` | 105,462 | `ca58114d26e77b5a4f1f5baac4327d998b8bda30007ee4cadc07343926b15ea6` | designer art shipped |
| `item-mountain-5` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-5.webp` | 9,432 | `art/masters/item-mountain-5.webp` | 83,940 | `f143dbb8625553e639a85cfdb00d699d85efc0125c1bc4461d9cbfe761783a3c` | designer art shipped |
| `item-mountain-6` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-6.webp` | 8,090 | `art/masters/item-mountain-6.webp` | 78,084 | `f7162df583a3039d1538fb70b8f5cad01137b055cae67c51599f0e229fec5470` | designer art shipped |
| `item-mountain-7` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-7.webp` | 8,426 | `art/masters/item-mountain-7.webp` | 93,728 | `2129a40741459c8a103853ecde17528c42cba2a316aaf7286d12a4ade5bf4b72` | designer art shipped |
| `item-mountain-8` | accepted | b4 / 2 | `art/reviews/b4/round-2.md` | `public/art/item-mountain-8.webp` | 6,540 | `art/masters/item-mountain-8.webp` | 52,870 | `38b79d1d602e3049f35bc06d84a7dfc2c6031189f4b42cd82529952a5d61ff7c` | designer art shipped |
| `item-studio-1` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-1.webp` | 7,146 | `art/masters/item-studio-1.webp` | 63,386 | `7daac47822da86425966cc81ac0aa7bbd7bdf174217ff9934e055ae842908b57` | designer art shipped |
| `item-studio-2` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-2.webp` | 6,902 | `art/masters/item-studio-2.webp` | 44,400 | `7da5bb30546b776889d3770b4e8cd8dbab9843995ca7b5b1230c3132bd353577` | designer art shipped |
| `item-studio-3` | rejected | retry / 3 | `art/reviews/retry/round-3.md` | - | - | - | - | - | code-drawn fallback kept: Rejected for a flat vector-sticker style, a ruler-straight cone skirt, an unreadable wrap band, airbrushed grey ribbons and a thin outline at small sizes |
| `item-studio-4` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-4.webp` | 10,770 | `art/masters/item-studio-4.webp` | 90,068 | `b0b9e32214aa9cecc24ab564d478096c51850e81fe6799c64b73f7ca6b1205d6` | designer art shipped |
| `item-studio-5` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-5.webp` | 8,242 | `art/masters/item-studio-5.webp` | 71,820 | `934f28ec700ab798706c7f51b5a26c561f5ffa475f8d9af04a3d1895b225a06a` | designer art shipped |
| `item-studio-6` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-studio-6.webp` | 7,352 | `art/masters/item-studio-6.webp` | 54,718 | `e5c79c84d8baf364005acc1119678df0893e34bc0f7f21cc0cc702c67dd4dcfb` | designer art shipped |
| `item-studio-7` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-studio-7.webp` | 7,572 | `art/masters/item-studio-7.webp` | 85,364 | `a9d56c975635e956ec309cb3cc1ab9904d7bb93e152fb60b3cab35cb312242d7` | designer art shipped |
| `item-studio-8` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-studio-8.webp` | 5,826 | `art/masters/item-studio-8.webp` | 39,996 | `52fb9f90d4f6e4660a40ecec2d628d976aef507e7b7064e7bee859d3679c7398` | designer art shipped |
| `item-vintage-1` | accepted | b5 / 2 | `art/reviews/b5/round-2.md` | `public/art/item-vintage-1.webp` | 10,978 | `art/masters/item-vintage-1.webp` | 81,008 | `4ab1fed10dca65498f54463c3784a3d240a128f3e8f7037d7bc1c7b265565ee2` | designer art shipped |
| `item-vintage-2` | accepted | b5 / 2 | `art/reviews/b5/round-2.md` | `public/art/item-vintage-2.webp` | 8,962 | `art/masters/item-vintage-2.webp` | 83,632 | `0fb1ba8164ac0377df74041c70565d0c25091b4dca2b1d021f457f9708cec233` | designer art shipped |
| `item-vintage-3` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-3.webp` | 11,368 | `art/masters/item-vintage-3.webp` | 95,358 | `f51e853f5489153786e22f421d330ddee25ef30ef3363b2b487ae7dd501a0bcb` | designer art shipped |
| `item-vintage-4` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-4.webp` | 13,038 | `art/masters/item-vintage-4.webp` | 137,700 | `668f27346fafde3884e19072c99fc15d1d21c2dae806a53d50951d86aafe418e` | designer art shipped |
| `item-vintage-5` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-5.webp` | 9,504 | `art/masters/item-vintage-5.webp` | 90,696 | `67cdcb6fdb3b553c13596df32a1864e54b4033190134cdcefeddf1bcef93af72` | designer art shipped |
| `item-vintage-6` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-6.webp` | 7,072 | `art/masters/item-vintage-6.webp` | 68,006 | `400d2760c18494688e0963c3d694f213faba21c84f70f7e8af30084323086e01` | designer art shipped |
| `item-vintage-7` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-7.webp` | 5,928 | `art/masters/item-vintage-7.webp` | 57,944 | `906529f2393806a6666e03f8228c597df2130bcaec24957e6c7cea15e2cbf900` | designer art shipped |
| `item-vintage-8` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-8.webp` | 7,008 | `art/masters/item-vintage-8.webp` | 47,462 | `5ba3422ff1a88638ae91301a9444a98986e4538de7ec80ee9fc95705097e619c` | designer art shipped |
| `client-1` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-1.webp` | 41,732 | `art/masters/client-1.webp` | 289,816 | `d8445780c4317c32392baeaa9bb66b696be4a0c9f4c6b934b46f71845de7d109` | designer art shipped |
| `client-2` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-2.webp` | 28,854 | `art/masters/client-2.webp` | 205,228 | `77a78935d51a95f27cc86fc56675114717fad268635c4a3c0d0ff4b86d3685d6` | designer art shipped |
| `client-3` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-3.webp` | 27,042 | `art/masters/client-3.webp` | 178,134 | `7e282fc7123adcc19855bb72ca87cccd91a932e230dea7d90d8a8f24817ee2f0` | designer art shipped |
| `client-4` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-4.webp` | 35,564 | `art/masters/client-4.webp` | 229,280 | `a06cde48522d4b09826da9a1f5814d7808da73cd25ba6210202fe4b330b4f8c0` | designer art shipped |
| `client-5` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-5.webp` | 32,090 | `art/masters/client-5.webp` | 232,250 | `3de651be4e63d0f60d156b6fa1d9a2d7881e49821e73fdb1a1a903357635e15c` | designer art shipped |
| `client-6` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-6.webp` | 42,024 | `art/masters/client-6.webp` | 291,070 | `9b934f76c2124dc86c7c7eb1a84c09e3b71df78de0633fc643cf9c79283ff553` | designer art shipped |
| `backdrop-studio` | accepted | retry / 1 | `art/reviews/retry/round-1.md` | `public/art/backdrop-studio.webp` | 28,082 | `art/masters/backdrop-studio.webp` | 95,542 | `af60a5ef6078e2d65188516ff1729f9e5cf863861e1d63ec97f41e4a22a17a7d` | designer art shipped |
| `backdrop-riviera` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-riviera.webp` | 15,606 | `art/masters/backdrop-riviera.webp` | 65,580 | `b42d05ab21a471d7c83f72f576ec9854d8d5d851f3a1b3dece8644a48e74bb96` | designer art shipped |
| `backdrop-rainy-city` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-rainy-city.webp` | 26,442 | `art/masters/backdrop-rainy-city.webp` | 98,808 | `c66e693d388668f4151376adfc74d4d4a3c99110ec7f1c4e06d92398e4dec4f6` | designer art shipped |
| `backdrop-gala` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-gala.webp` | 26,456 | `art/masters/backdrop-gala.webp` | 99,198 | `f9e296424d7b7abb9e33b68dad56b1e8d7c260b76063dbbafcd23725abb3a001` | designer art shipped |
| `backdrop-mountain` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-mountain.webp` | 26,212 | `art/masters/backdrop-mountain.webp` | 87,632 | `a05dcd6cb8bb649601562166ded6bb4b27442b935574657a9f78befb83952c5b` | designer art shipped |
| `backdrop-vintage` | accepted | b6 / 3 | `art/reviews/b6/round-3.md` | `public/art/backdrop-vintage.webp` | 26,830 | `art/masters/backdrop-vintage.webp` | 86,770 | `ce18694dcff2d30334d80425eba73f6a450e5c6594b181aa72188d17f2ba23b7` | designer art shipped |
| `feature-graphic` | accepted | retry / 2 | `art/reviews/retry/round-2.md` | - | - | `art/masters/feature-graphic.webp` | 142,686 | `dcd3fc07650b93a30ad1bc8b7a280fa337a6997f1a4117c3b77f9d029dc0619a` | store asset, not in the bundle |
<!-- provenance:end -->

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

| Slot id | Trigger | File | Author | Source | Bytes |
|---|---|---|---|---|---|
| `ui-tap` | any button tap | `ui-tap.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 4,371 |
| `ui-back` | Back button | `ui-back.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 7,208 |
| `ui-toggle` | a settings toggle | `ui-toggle.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 8,654 |
| `ui-open-sheet` | brief, result, export, hint or exit sheet opens | `ui-open-sheet.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 15,046 |
| `ui-tab` | closet tray tab changes | `ui-tab.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 6,901 |
| `item-pick` | a piece is lifted (drag start or tap-select) | `item-pick.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/rpg-audio | 9,449 |
| `item-place` | a piece lands in its slot | `item-place.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/impact-sounds | 4,283 |
| `item-swap` | a piece replaces another | `item-swap.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/rpg-audio | 6,971 |
| `item-remove` | a slot is cleared | `item-remove.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 17,099 |
| `item-invalid` | drop refused (wrong slot) | `item-invalid.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 5,154 |
| `rule-met` | a rule chip turns met | `rule-met.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/digital-audio | 6,135 |
| `rule-broken` | a met rule becomes unmet | `rule-broken.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/digital-audio | 5,956 |
| `look-complete` | the last open slot is filled | `look-complete.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 12,391 |
| `finish-look` | Finish look pressed | `finish-look.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 9,085 |
| `star-1` | first star revealed | `star-1.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/music-jingles | 10,333 |
| `star-2` | second star revealed | `star-2.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/music-jingles | 12,632 |
| `star-3` | third star revealed | `star-3.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/music-jingles | 14,977 |
| `result-miss` | result with 0 stars | `result-miss.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 8,288 |
| `hint-use` | hint bought and revealed | `hint-use.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 9,455 |
| `coin-gain` | coins added to the purse | `coin-gain.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/rpg-audio | 12,876 |
| `unlock` | chapter, frame or affinity level unlocked | `unlock.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/music-jingles | 13,532 |
| `streak-up` | Daily streak increases | `streak-up.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/music-jingles | 12,686 |
| `export-shutter` | image export taken | `export-shutter.ogg` | themightyglider (user themightyglider on OpenGameArt) | https://opengameart.org/content/camera | 11,768 |
| `frame-select` | export frame changed | `frame-select.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | 4,596 |
| `music-menu` (loop) | Home, lists, Closet, Gallery | `music-menu.ogg` | Pro Sensory (Alex McCulloch) | https://opengameart.org/content/mocha-frapp | 339,602 |
| `music-style` (loop) | Styling board | `music-style.ogg` | Pro Sensory (Alex McCulloch) | https://opengameart.org/content/one-step-at-a-time | 430,565 |

All 26 slots shipped with a CC0 file (no silent slot). Total 1,000,013 bytes (0.95 MB of the
2 MB budget); every file is mono Ogg. Licence (CC0 1.0 for Kenney, CC0 for OpenGameArt), download date
2026-10-23, SHA-256 and processing notes per file are in `public/audio/LICENSES.md`; candidates and
commands are in `.agents/resources/2026-10-23/web-games/dress-rehearsal/05/README.md`.

## Release totals and budgets (task 08)

Enforced by `apps-games/dress-rehearsal/test/budgets.test.ts` (runs in the normal `test` command: it
builds the app through the Vite JS API into `node_modules/.cache/bundle-check`, gzips the emitted `.js`
files and measures the files under `public/`). `bun run scripts/check-bundle.ts` prints the same table.

| Budget | Limit | Shipped |
|---|---|---|
| JS bundle (gzip, excluding art, fonts and audio) | 300 KB | 73,399 B (6 files; the main chunk is 71.4 KB) |
| Runtime art | 8 MB total; any single file at most 400 KB (pieces 60 KB, clients 100 KB) | 754,078 B in 58 files; largest `client-6.webp` 42,024 B |
| Fonts | each woff2 at most 120 KB; total at most 300 KB | 120,408 B in 3 files |
| Audio | 2 MB total | 1,000,013 B in 26 files |

Not in the runtime bundle: the 60 art masters (5,473,364 B, kept as evidence), the `icon` and
`feature-graphic` store assets, and the Capacitor icon and splash sources.

### Art slots without designer art (placeholders kept)

| Slot | Final designer verdict | What the game shows | Next step |
|---|---|---|---|
| `key-art` | Rejected as missing: no `key-art.png` was delivered because the cover attempts failed (the assembled retry cover was also rejected for style drift) | code-drawn hanger-and-board drawing on Home and Boot; the splash is the code-drawn badge | new designer brief or accept the badge (Q13) |
| `item-rainy-city-5` (Black Rubber Boots) | Rejected as missing: no file was delivered because all four candidates failed the designer's own self-review | code-drawn glyph in the tray, board and Closet | new designer brief (Q14) |
| `item-studio-3` (White Drape Dress) | Rejected for a flat vector-sticker style, a ruler-straight cone skirt, an unreadable wrap band, airbrushed grey ribbons and a thin outline at small sizes | code-drawn glyph | new designer brief (Q14) |

The art bible and every designer review note are copied under
`.agents/resources/2026-10-23/web-games/dress-rehearsal/art/` (`art-bible.md`, `reviews/<batch>/round-<n>.md`,
`accepted-manifest.json`).

## Capacitor icon and splash (task 07)

Sources live in `apps-games/dress-rehearsal/assets/` and are written by `scripts/build-icons.ts`
(deterministic); `@capacitor/assets` turns them into the Android and iOS resources.

| Source | Size | Made from |
|---|---|---|
| `icon-only.png` | 1024 x 1024, opaque | accepted `icon` master (`art/masters/icon.webp`) |
| `icon-foreground.png` | 1024 x 1024, RGBA | the same accepted icon master (adaptive layer) |
| `icon-background.png` | 1024 x 1024, opaque | flat `night` `#1c1816` |
| `splash.png`, `splash-dark.png` | 2732 x 2732, opaque | code-drawn hanger-and-ribbon badge (`scripts/draw-fallback-icon.ts`, palette tokens) in the central 1200 px on `night` |

`key-art` was never delivered, so it is not used for the splash; `item-rainy-city-5` and `item-studio-3`
keep their code-drawn glyphs (see the provenance table). The evidence README is
`.agents/resources/2026-10-23/web-games/dress-rehearsal/07/README.md`.
