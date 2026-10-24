# The Last Window - assets index

Status after task 06: the two fonts, the 36 audio files and all 54 reviewed art slots are delivered (below). This file
plans every art slot and the audio slots. Later tasks fill in the rest: 07 (icon and splash), 08 (totals). Every one of the 54 art slots has a code-drawn fallback so the game
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

### Provenance (generated by task 06)

Written by `apps-games/the-last-window/scripts/build-art.ts` between the markers below; do not edit by hand.
All 54 slots were accepted by the designer review loop (nothing rejected, nothing missing), so no slot
currently relies on its code-drawn fallback in the shipped build; the fallbacks stay in code for any slot
that is rejected or missing in a later rerun. Runtime files are WebP q82 at the 2x display size; masters are
WebP q90 at the delivered resolution under
`.agents/resources/2026-10-23/web-games/the-last-window/art/masters/` (column Master is relative to the `art/`
folder there, the review notes sit in `art/review/`). The designer's generator delivered 1024 x 1536
(interiors, key art), 1020 x 1360 (busts), 1024 x 1024 (objects, icon) and 1536 x 1024 (feature graphic),
below the planned 1600 x 2400 and 1536 x 2048 masters; all ratios are exact. Check rules and the two
threshold adjustments for objects are in `.agents/resources/2026-10-23/web-games/the-last-window/06/README.md`.
Runtime total: 1,101,464 bytes (52 files).

<!-- art-provenance:start -->
| Slot | Status | Source (batch, round) | Review verdict | Runtime file | Runtime bytes | Master | Master bytes | Master SHA-256 |
|---|---|---|---|---|---|---|---|---|
| `icon` | accepted | b1, round 1 | ACCEPTED, `review/b1-round-1.md` | - | - | `masters/icon.webp` | 205,090 | `9727c7b79f173eaf04cfc27fcaf25fe9cdc978e18a3eb6f2237af89e1962274f` |
| `key-art` | accepted | b1, round 3 | ACCEPTED, `review/b1-round-3.md` | `public/art/key-art.webp` | 54,960 | `masters/key-art.webp` | 145,264 | `d4ce97452a925cfc11ded0bbfbb9f259316818f350304f5db131e1349b173265` |
| `interior-evening` | accepted | b1, round 1 | ACCEPTED, `review/b1-round-1.md` | `public/art/interior-evening.webp` | 53,698 | `masters/interior-evening.webp` | 154,578 | `c5b2db2e11a567ce88f44c524ac94835f80afe7bfaebdee173fbbba7de3a40c5` |
| `customer-1-neutral` | accepted | b1, round 3 | ACCEPTED, `review/b1-round-3.md` | `public/art/customer-1-neutral.webp` | 23,968 | `masters/customer-1-neutral.webp` | 78,964 | `0b6b310bab5e1bef3e3495e392b3fe69b0ed1a4236c23c5415ac2c043c5309c6` |
| `interior-morning` | accepted | b2, round 2 | ACCEPTED, `review/b2-round-2.md` | `public/art/interior-morning.webp` | 53,530 | `masters/interior-morning.webp` | 159,540 | `0fc01b67559010e267a68be32d1434ba9e3e7a9c9c79d86497ce12b8c96f6e65` |
| `interior-rain` | accepted | b2, round 2 | ACCEPTED, `review/b2-round-2.md` | `public/art/interior-rain.webp` | 56,864 | `masters/interior-rain.webp` | 148,318 | `4001fb4b5e79748825df630d0fd366a49cb5ef79ed314df232f54682e77879ba` |
| `customer-2-neutral` | accepted | b2, round 1 | ACCEPTED, `review/b2-round-1.md` | `public/art/customer-2-neutral.webp` | 27,836 | `masters/customer-2-neutral.webp` | 88,028 | `c8b7b9027695c00b02412029d105059a31eb77603f3ce0b8a73364fb7f9e25fd` |
| `customer-3-neutral` | accepted | b2, round 1 | ACCEPTED, `review/b2-round-1.md` | `public/art/customer-3-neutral.webp` | 27,566 | `masters/customer-3-neutral.webp` | 86,496 | `c19a05fa03f12777c714f98189310b2444185aa23ac7338c529c25b0f48c1b6d` |
| `customer-4-neutral` | accepted | b2, round 1 | ACCEPTED, `review/b2-round-1.md` | `public/art/customer-4-neutral.webp` | 33,036 | `masters/customer-4-neutral.webp` | 97,676 | `2508b27106ecbc4e503d0e8b4a00fc551166b38543621adcde59a19a2cefe3da` |
| `customer-5-neutral` | accepted | b2, round 2 | ACCEPTED, `review/b2-round-2.md` | `public/art/customer-5-neutral.webp` | 28,732 | `masters/customer-5-neutral.webp` | 95,878 | `ed3b448f62dfbfb926d40f3dfde9e8d629a5d715ce4706e88d348d1873958850` |
| `customer-6-neutral` | accepted | b2, round 1 | ACCEPTED, `review/b2-round-1.md` | `public/art/customer-6-neutral.webp` | 23,980 | `masters/customer-6-neutral.webp` | 85,980 | `38e1255f13615319e40578049beac45e18730b9b5798fdc13b41501554285512` |
| `customer-7-neutral` | accepted | b2, round 1 | ACCEPTED, `review/b2-round-1.md` | `public/art/customer-7-neutral.webp` | 31,818 | `masters/customer-7-neutral.webp` | 103,218 | `cee7e670c5ca0a24d57d29030ed360827391dbc83426843976d4df1b657a4017` |
| `customer-8-neutral` | accepted | b2, round 1 | ACCEPTED, `review/b2-round-1.md` | `public/art/customer-8-neutral.webp` | 40,188 | `masters/customer-8-neutral.webp` | 116,470 | `37de1240903bea04b53d3146cfcd58d40381229cbf4e7ef5e6ced0d50847d71d` |
| `customer-1-happy` | accepted | b3, round 3 | ACCEPTED, `review/b3-round-3.md` | `public/art/customer-1-happy.webp` | 24,112 | `masters/customer-1-happy.webp` | 77,948 | `6df6c032d627ac4346f5e144b17184602869621b9e5d7179dfcfe040ac908702` |
| `customer-1-sad` | accepted | b3, round 2 | ACCEPTED, `review/b3-round-2.md` | `public/art/customer-1-sad.webp` | 23,918 | `masters/customer-1-sad.webp` | 78,482 | `2be84ce97e4def2b79749b94d6f00e831d80f551542857b1da2ad0c2ad71122b` |
| `customer-2-happy` | accepted | b3, round 1 | ACCEPTED, `review/b3-round-1.md` | `public/art/customer-2-happy.webp` | 28,042 | `masters/customer-2-happy.webp` | 90,376 | `3b2fa49220210d5e192a1a583fff780cbae69bb19884c4b67df93b102023cdb0` |
| `customer-2-sad` | accepted | b3, round 1 | ACCEPTED, `review/b3-round-1.md` | `public/art/customer-2-sad.webp` | 27,692 | `masters/customer-2-sad.webp` | 88,896 | `0067a576abef320281ce8e1d229dc1ca359b1d27d0c7f3829a41dbb85bbf6fbb` |
| `customer-3-happy` | accepted | b3, round 1 | ACCEPTED, `review/b3-round-1.md` | `public/art/customer-3-happy.webp` | 27,894 | `masters/customer-3-happy.webp` | 87,784 | `273f58fb1e677f5267b8d053787859b4aa4240dcb18dddc0ffeb1eb2ba985c18` |
| `customer-3-sad` | accepted | b3, round 3 | ACCEPTED, `review/b3-round-3.md` | `public/art/customer-3-sad.webp` | 27,812 | `masters/customer-3-sad.webp` | 86,822 | `e24b046bd84d71aa10d8f6bbfcc7c7a2d2b1fd264b8455dced94cad1df6d1300` |
| `customer-4-happy` | accepted | b3, round 1 | ACCEPTED, `review/b3-round-1.md` | `public/art/customer-4-happy.webp` | 33,618 | `masters/customer-4-happy.webp` | 98,124 | `f8edeadab2d3f1a99da780e708a373f5d98ccc5fdce55a3b2083cfeac5e23128` |
| `customer-4-sad` | accepted | b3, round 1 | ACCEPTED, `review/b3-round-1.md` | `public/art/customer-4-sad.webp` | 33,284 | `masters/customer-4-sad.webp` | 97,416 | `77dc2f9d23df06f989c24370af30ccd087839cba7c14639d8719d399151de79b` |
| `customer-5-happy` | accepted | b4, round 1 | ACCEPTED, `review/b4-round-1.md` | `public/art/customer-5-happy.webp` | 28,478 | `masters/customer-5-happy.webp` | 98,006 | `09af2396addd96eaf06f4e858fafe3efe69fad9c1d9f6796fd8334565be780f2` |
| `customer-5-sad` | accepted | b4, round 1 | ACCEPTED, `review/b4-round-1.md` | `public/art/customer-5-sad.webp` | 28,544 | `masters/customer-5-sad.webp` | 97,784 | `a8f875b8680dd6e9384244698621102583efa53c2d82792079d6456f92fe087d` |
| `customer-6-happy` | accepted | b4, round 2 | ACCEPTED, `review/b4-round-2.md` | `public/art/customer-6-happy.webp` | 24,304 | `masters/customer-6-happy.webp` | 82,846 | `6760cb2c973e71b9b7f7a3b9dc32cbd0ab9d573e97c126188156dd7f5ea5a5e4` |
| `customer-6-sad` | accepted | b4, round 1 | ACCEPTED, `review/b4-round-1.md` | `public/art/customer-6-sad.webp` | 24,316 | `masters/customer-6-sad.webp` | 85,232 | `4010230d5a114559983233bcd51090a0a60875959bd7a69c0a20289f22c38e3d` |
| `customer-7-happy` | accepted | b4, round 2 | ACCEPTED, `review/b4-round-2.md` | `public/art/customer-7-happy.webp` | 32,252 | `masters/customer-7-happy.webp` | 106,202 | `e2296ee1f410b266ec933a7fa0dd3a5307a2592951eac521acf83e0728a3763f` |
| `customer-7-sad` | accepted | b4, round 1 | ACCEPTED, `review/b4-round-1.md` | `public/art/customer-7-sad.webp` | 32,204 | `masters/customer-7-sad.webp` | 105,178 | `50272b3cf9db55fe2f4d0d0aac17ee67107ae0dff2040be936a6beb6c1bd2dd8` |
| `customer-8-happy` | accepted | b4, round 1 | ACCEPTED, `review/b4-round-1.md` | `public/art/customer-8-happy.webp` | 40,332 | `masters/customer-8-happy.webp` | 117,630 | `5487a1dafd1eacf5f560a0362091b1d2ecab0c6703253a989e1de31db4c6d1a9` |
| `customer-8-sad` | accepted | b4, round 1 | ACCEPTED, `review/b4-round-1.md` | `public/art/customer-8-sad.webp` | 40,282 | `masters/customer-8-sad.webp` | 117,362 | `53c62acec418ab731921558867492d4db7620250b44a4191187e2479eabe298a` |
| `drink-1` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/drink-1.webp` | 4,496 | `masters/drink-1.webp` | 42,730 | `8d246d9af533a9d4c0618c9c0b9b0f3e2b7ef90da1018229bc3a2155d3c55113` |
| `drink-2` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/drink-2.webp` | 5,720 | `masters/drink-2.webp` | 62,120 | `d3a87ed93fd449821800150feb2ff78c59fcfa852ba1fbbd5c37b6bffe3432e0` |
| `drink-3` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/drink-3.webp` | 3,820 | `masters/drink-3.webp` | 45,156 | `d5d76120f52b14f6f68373c587ac1ab5ef8c917c76176beb19eb1185a9bc7df1` |
| `drink-4` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/drink-4.webp` | 5,622 | `masters/drink-4.webp` | 56,456 | `12ae43abca4f61b4686dbece178f4ae35afe1d62c40350c8b728904092bbadb1` |
| `drink-5` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/drink-5.webp` | 4,944 | `masters/drink-5.webp` | 54,558 | `04c9243e586f78af9fa4116aeec42d4637a43c56cc96b1953ef3adb186ceb123` |
| `drink-6` | accepted | b5, round 2 | ACCEPTED, `review/b5-round-2.md` | `public/art/drink-6.webp` | 4,992 | `masters/drink-6.webp` | 53,766 | `d8bd40950c0d3ccb0b970ee21148d14940777c1d1e1b36a99e7c8e8090b16ca4` |
| `pastry-1` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/pastry-1.webp` | 5,894 | `masters/pastry-1.webp` | 73,818 | `5ab9fccda89a18665b284fae3d40f77756bcc24ac28d6ab041c1e01fd47cc5ec` |
| `pastry-2` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/pastry-2.webp` | 6,352 | `masters/pastry-2.webp` | 82,232 | `2fb61192418f461e9efd6681eda10186fbce8bb738570c04a3a08f8781e692d8` |
| `pastry-3` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/pastry-3.webp` | 6,730 | `masters/pastry-3.webp` | 81,960 | `99bdd2d12bb9650458be66ed652bbbbd04e99bb1ce5674a164e6ea62726c2485` |
| `pastry-4` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/pastry-4.webp` | 6,544 | `masters/pastry-4.webp` | 85,740 | `2758b8c9964cd165d4f578787e87a1936fb320af9e297ec31d6284b40e82dbbe` |
| `pastry-5` | accepted | b5, round 1 | ACCEPTED, `review/b5-round-1.md` | `public/art/pastry-5.webp` | 6,472 | `masters/pastry-5.webp` | 84,744 | `d3bfe19f525e49671bf0ddf269519dc90fa3edc5b13fa8e0b395033304541e23` |
| `book-1` | accepted | b6, round 1 | ACCEPTED, `review/b6-round-1.md` | `public/art/book-1.webp` | 4,302 | `masters/book-1.webp` | 60,468 | `b9a6d3516fbd76583f3dc6fe5cf22bf828dd43db16f8843b18b408e6fa085060` |
| `book-2` | accepted | b6, round 2 | ACCEPTED, `review/b6-round-2.md` | `public/art/book-2.webp` | 4,544 | `masters/book-2.webp` | 47,610 | `64b34bdc478aba5570d7633d973f7e8e664b889630b71279849d250cd0d39b61` |
| `book-3` | accepted | b6, round 1 | ACCEPTED, `review/b6-round-1.md` | `public/art/book-3.webp` | 5,146 | `masters/book-3.webp` | 77,724 | `cf4c15aff153b8d42398d5ca1acd63516c330f73710036375f88d3c178eee4f8` |
| `book-4` | accepted | b6, round 2 | ACCEPTED, `review/b6-round-2.md` | `public/art/book-4.webp` | 4,542 | `masters/book-4.webp` | 52,652 | `3a6e405713288f4c0cad94cc41d12a7775f496e131aa7d439af3702d2cca5b1d` |
| `book-5` | accepted | b6, round 2 | ACCEPTED, `review/b6-round-2.md` | `public/art/book-5.webp` | 5,860 | `masters/book-5.webp` | 52,938 | `c09d5269167764947f5ee42d41946a4895646b0325b68972052cea1682a3a7b0` |
| `decor-1` | accepted | b6, round 1 | ACCEPTED, `review/b6-round-1.md` | `public/art/decor-1.webp` | 10,460 | `masters/decor-1.webp` | 94,494 | `4b31a14c38e6dc7073798fa1f048eb5b0d19697031eae57a2901479ba174fd57` |
| `decor-2` | accepted | b6, round 1 | ACCEPTED, `review/b6-round-1.md` | `public/art/decor-2.webp` | 7,970 | `masters/decor-2.webp` | 52,464 | `161aaee56d2e7616dcca73a6fae9770053c15a32e2a2d74a80cf2c947a10785a` |
| `decor-3` | accepted | b6, round 3 | ACCEPTED, `review/b6-round-3.md` | `public/art/decor-3.webp` | 16,294 | `masters/decor-3.webp` | 115,646 | `6abf51b149cc653230cbcb51c2821212194c3a3a215fc2746985a4b099c4a03d` |
| `decor-4` | accepted | b6, round 1 | ACCEPTED, `review/b6-round-1.md` | `public/art/decor-4.webp` | 10,262 | `masters/decor-4.webp` | 79,700 | `8468ea65796c65ee25c2b69bf21f925c74f1c1c2e95c847e5ce392abd5e51f0b` |
| `decor-5` | accepted | retry, round 1 | ACCEPTED, `review/retry-round-1.md` | `public/art/decor-5.webp` | 12,072 | `masters/decor-5.webp` | 56,284 | `0c66e7677de1d7b2e7832979e6db9e26e181274ff9c26f91f2c86e01aa1e5a39` |
| `decor-6` | accepted | b7, round 1 | ACCEPTED, `review/b7-round-1.md` | `public/art/decor-6.webp` | 5,430 | `masters/decor-6.webp` | 76,356 | `82a0accba20ccafd39f000ac6765fee0fd0ece53e29724963b2f37178c2541f8` |
| `decor-7` | accepted | b7, round 2 | ACCEPTED, `review/b7-round-2.md` | `public/art/decor-7.webp` | 8,424 | `masters/decor-7.webp` | 41,008 | `cc2898d588f98fe9cc2be8a30a36368bb6eecb1b3efd9bc569e8d3a5c680ae6d` |
| `decor-8` | accepted | b7, round 2 | ACCEPTED, `review/b7-round-2.md` | `public/art/decor-8.webp` | 11,312 | `masters/decor-8.webp` | 75,604 | `feacf897f2a0f79324528bf05cfc4e46d47f4e26d58a144cd0bca86c9824382d` |
| `feature-graphic` | accepted | b7, round 1 | ACCEPTED, `review/b7-round-1.md` | - | - | `masters/feature-graphic.webp` | 186,470 | `06432c52b0e89641e6d2f57a82f2fbb49f613cb22052f75c083df4a7c8579657` |
<!-- art-provenance:end -->

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
