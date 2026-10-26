# Dress Rehearsal - content plan (v1, complete)

This is the full named content list for v1. It drives the art briefs (`assets-index.md`), the
content task (`tasks/epics/23-web-dress-rehearsal/02-content.md`) and the validators. Counts in
this file are binding; if task 02 must change a number, it edits this file, `economy.md`,
`product.md` and `decisions-log.md` in the same commit. The tables use fixed column headers so
`test/content-plan.test.ts` can parse them.

## Totals

- 6 chapters (one per theme), 40 challenges (7, 7, 7, 7, 6, 6), 120 campaign stars.
- 48 closet pieces (6 themes x 8): top 8, bottom 7, dress 5, outer 6, shoes 6, bag 6, hat 4, accessory 6.
- 6 recurring clients with 8 original lines each (48 lines); affinity levels at 3, 9 and 15 stars.
- 16 rule kinds; each challenge has 2 to 4 rules and opens 6 to 8 slots; 7 slot sets (A to G).
- 9 rule cards (one-time sheets), 5 tutorial steps, 6 how-to pages, 4 export frames.
- Daily Fitting challenges are generated, not listed; their weekday ladder is in `product.md`.
- Not applicable to this game (the shared spec template mentions them): cases with evidence
  objects and constellations. They are not in v1; the lore lives in the client lines, chapter
  texts, challenge names and briefs below.

## Slot sets

Slots are listed in the board's fixed order. `dress` and `top` + `bottom` together follow the
one-piece rule in `product.md`.

| Set | Slots | Open slots |
|---|---|---|
| A | top, bottom, shoes, bag, hat, accessory | 6 |
| B | dress, outer, shoes, bag, hat, accessory | 6 |
| C | top, bottom, outer, shoes, bag, accessory | 6 |
| D | top, bottom, outer, shoes, bag, hat, accessory | 7 |
| E | top, bottom, dress, shoes, bag, hat, accessory | 7 |
| F | top, bottom, dress, outer, shoes, bag, accessory | 7 |
| G | top, bottom, dress, outer, shoes, bag, hat, accessory | 8 |

## Chapters

| # | Theme id | Theme | Chapter title | Accent | Unlock (stars) | Challenges | Closet when unlocked |
|---|---|---|---|---|---|---|---|
| 1 | `riviera` | Riviera Summer | Chapter 1 - Sun on the Water | sky `#2b6a9a` | 0 | riv-01 to riv-07 (7) | 16 pieces |
| 2 | `rainy-city` | Rainy City | Chapter 2 - Grey Day, Sharp Edges | ochre `#7f5f00` | 0 | rai-01 to rai-07 (7) | 16 pieces |
| 3 | `gala` | Gala Night | Chapter 3 - After the Curtain | red `#a1281f` | 12 | gal-01 to gal-07 (7) | 24 pieces |
| 4 | `mountain` | Mountain Weekend | Chapter 4 - Above the Tree Line | green `#2c6a48` | 27 | mtn-01 to mtn-07 (7) | 32 pieces |
| 5 | `studio` | Studio Avant-garde | Chapter 5 - The Last Row | violet `#6a3fa0` | 45 | stu-01 to stu-06 (6) | 40 pieces |
| 6 | `vintage` | Vintage 70s | Chapter 6 - Second-Hand Sunshine | rust `#a4491a` | 66 | vin-01 to vin-06 (6) | 48 pieces |

Chapter intro and outro texts (shown on the chapter card and after the last challenge):

| Theme id | Intro | Outro |
|---|---|---|
| `riviera` | Salt air, linen and long lunches. Mireille opens the first case. | Seven looks, one sunburn. The coast is yours. |
| `rainy-city` | The forecast says rain until Thursday. Tobias is delighted. | Dry feet and warm hands. The city can do its worst. |
| `gala` | Black tie, gold light and Dame Ottoline's raised eyebrow. | The house lights come up. You were the best dressed in the room. |
| `mountain` | Priya has a ridge to climb and no patience for cotton. | The summit was cold and clear. You packed exactly right. |
| `studio` | Jun's studio smells of pressed cloth. Every rule is up for debate. | The critics are still arguing. That is the best review. |
| `vintage` | Edie opens the back rail: corduroy, suede and a little glitter. | Every piece found a second life. So did the seventies. |

## Clients (customers)

| # | Id | Name | Role | Challenges | Personality |
|---|---|---|---|---|---|
| 1 | `mireille` | Mireille Vasseur | Travel writer | 7 | Writes postcards for a living and wears every one of them. |
| 2 | `tobias` | Tobias Okafor | Storm photographer | 7 | Has photographed every storm and been rained on by all of them. |
| 3 | `ottoline` | Dame Ottoline Frost | Opera patron | 7 | Has not applauded anything in forty years. She might for you. |
| 4 | `priya` | Priya Raman | Mountain guide | 7 | Reads rock for a living and people for fun. |
| 5 | `jun` | Jun Aoki | Gallery curator | 6 | Hangs art all day and judges coats the same way. |
| 6 | `edie` | Edie Lindqvist | Vintage shop owner | 6 | Never throws anything away, especially a good sleeve. |

Original lines (all English, each at most 80 characters). `Intro` shows on the brief sheet,
`3 / 2 / 1 / 0 stars` on the result sheet, `Level 1 / 2 / 3` when affinity levels are reached.

| Client | Intro | 3 stars | 2 stars | 1 star | 0 stars | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|---|---|---|---|
| Mireille Vasseur | Oh good, you are here. Dress me like a postcard. | Perfect. I would frame this and send it home. | It fits the brief. Next time, give it a little more soul. | Wearable, darling, but it is not quite the postcard. | Hmm. Let us try again before the light changes. | You are getting the hang of my sunburnt little world. | I have started telling editors my outfits are yours. | You are my favourite co-author. Pack a bag, we are leaving. |
| Tobias Okafor | Camera bag is packed. Make sure I am too. | Dry, warm, and I can still run. You are hired for the monsoon. | It works. I will only complain a little. | I will survive. My socks might not. | I am wet just looking at this. Again, please. | My sleeves stayed dry yesterday. That was you. | I tell other photographers about you, which is rare. | Next storm you carry the umbrella. I trust you with it. |
| Dame Ottoline Frost | Do try to look as though you have been to a theatre before. | Magnificent. I may even permit an encore. | Adequate. In my house that is a compliment. | One tries not to wince. One generally fails. | Take it away and begin again, with feeling. | You, at least, read the programme. | I introduced you as my stylist. Do not let it go to your head. | Front row, centre, on my account. Wear the good coat. |
| Priya Raman | Weather turns fast up there. So do I. What have you got? | That gets me over the col and back to the hut. Solid. | Good for the valley. I would add one more layer. | You would make the first bend. Barely. | Not for the mountain. Back to the drawing board. | Your kit choices make more sense every week. | I told my group to copy your packing list. | You have earned a summit. I will carry the flask. |
| Jun Aoki | Be bold, but be precise. | A clean line and a clear idea. Nothing to remove. | The idea is there. The edit is not. | A sketch. Interesting, unfinished. | The wall stays blank until this is fixed. | You have started to see the negative space. | I quoted your last look in a catalogue essay. | Consider yourself part of the permanent collection. |
| Edie Lindqvist | Everything in this shop has a story. Let us give your look one. | Oh, that has history and nerve. I could cry. | Lovely, love. Just a little more twirl. | It needs a safety pin and some courage. | Back on the rail with it, pet. | You are the first customer who reads the labels. | I saved the best rail at the back for you. | The shop is yours on Sundays. Mind the cat. |

## Closet pieces (48)

Colours: neutrals black, white, cream, grey, navy, tan; chromatic red, orange, yellow, lime,
green, mint, teal, sky, blue, violet, magenta, pink. Era: 50s, 70s, 90s, now. Formality 1 to 5,
warmth 0 to 3, price in whole dollars. `Batch` is the art batch (`assets-index.md`). The art slot id
is the piece id (`item-<theme>-<n>`).

### Riviera Summer (accent sky)

| Slot id | Name | Category | Colour | Era | Formality | Warmth | Price | Feature | Batch | Art note |
|---|---|---|---|---|---|---|---|---|---|---|
| `item-riviera-1` | Breton Stripe Tee | top | white | now | 2 | 1 | 38 | - | B1 | Short-sleeve boat-neck tee, white with navy stripes, soft cotton folds. Style anchor for every item. |
| `item-riviera-2` | Sky Camp-Collar Shirt | top | sky | 50s | 3 | 0 | 54 | - | B2 | Short-sleeve camp-collar shirt in washed sky blue, 1950s cut, top button open. |
| `item-riviera-3` | Cream Linen Trousers | bottom | cream | now | 3 | 1 | 72 | - | B2 | High-waist pleated linen trousers in cream, one soft crease, legs straight. |
| `item-riviera-4` | Orange Wrap Skirt | bottom | orange | 50s | 3 | 0 | 60 | - | B2 | A-line wrap skirt in warm tangerine, 1950s tie waist, soft gathers. |
| `item-riviera-5` | White Rope Espadrilles | shoes | white | now | 2 | 0 | 44 | - | B2 | A pair of white canvas espadrilles with braided rope soles, toes up. |
| `item-riviera-6` | Straw Basket Tote | bag | tan | now | 1 | 0 | 52 | - | B2 | Woven straw basket tote with tan leather handles. |
| `item-riviera-7` | Wide-Brim Sun Hat | hat | cream | 50s | 3 | 0 | 46 | shade | B2 | Cream wide-brim straw sun hat with a cream ribbon band, crown up. |
| `item-riviera-8` | Cat-Eye Sunglasses | accessory | black | 50s | 3 | 0 | 68 | shade | B2 | Black 1950s cat-eye sunglasses, arms folded, dark lenses. |

### Rainy City (accent ochre)

| Slot id | Name | Category | Colour | Era | Formality | Warmth | Price | Feature | Batch | Art note |
|---|---|---|---|---|---|---|---|---|---|---|
| `item-rainy-city-1` | Yellow Rain Slicker | outer | yellow | 90s | 2 | 2 | 96 | waterproof | B2 | Hooded yellow rain slicker, glossy fabric, toggles done up, boxy 90s cut. |
| `item-rainy-city-2` | Camel Trench Coat | outer | tan | now | 4 | 2 | 180 | waterproof | B2 | Double-breasted camel trench coat with belt, storm flap and epaulettes. |
| `item-rainy-city-3` | Grey Wool Jumper | top | grey | 90s | 2 | 2 | 64 | - | B2 | Chunky grey wool crewneck jumper with ribbed cuffs, 90s shape. |
| `item-rainy-city-4` | Navy Pleated Trousers | bottom | navy | now | 4 | 2 | 88 | - | B2 | Tailored navy trousers with front pleats and a sharp crease. |
| `item-rainy-city-5` | Black Rubber Boots | shoes | black | now | 2 | 2 | 110 | waterproof | B2 | A pair of glossy black mid-calf rubber boots standing side by side. |
| `item-rainy-city-6` | Mint Waxed Satchel | bag | mint | now | 2 | 0 | 78 | waterproof | B3 | Mint-green waxed canvas satchel with a flap and brass buckles. |
| `item-rainy-city-7` | Navy Shirtdress | dress | navy | now | 3 | 1 | 120 | - | B3 | Navy midi shirtdress with collar, button front and tie belt. |
| `item-rainy-city-8` | Black Compact Umbrella | accessory | black | now | 3 | 0 | 42 | waterproof | B3 | Closed black compact umbrella with a wooden handle, laid diagonally. |

### Gala Night (accent red)

| Slot id | Name | Category | Colour | Era | Formality | Warmth | Price | Feature | Batch | Art note |
|---|---|---|---|---|---|---|---|---|---|---|
| `item-gala-1` | Red Satin Column Gown | dress | red | 50s | 5 | 1 | 340 | - | B3 | Floor-length red satin column gown, 1950s boat neckline, one long fluid fold. |
| `item-gala-2` | Black Velvet Midi Dress | dress | black | now | 4 | 2 | 210 | - | B3 | Black velvet midi dress with a sweetheart neckline and three-quarter sleeves. |
| `item-gala-3` | Cream Silk Blouse | top | cream | 50s | 4 | 0 | 130 | - | B3 | Cream silk blouse with a soft neck bow and fluid drape, 1950s. |
| `item-gala-4` | Black Tuxedo Trousers | bottom | black | now | 5 | 1 | 150 | - | B3 | Black tuxedo trousers with a satin side stripe, straight leg, crisp crease. |
| `item-gala-5` | Midnight Opera Coat | outer | navy | 50s | 5 | 3 | 280 | - | B3 | Midnight-navy opera coat with a wide shawl collar and velvet sheen. |
| `item-gala-6` | Gold Strappy Heels | shoes | yellow | now | 5 | 0 | 160 | sparkle | B3 | A pair of gold strappy high heels with ankle straps, soft highlights. |
| `item-gala-7` | Silver Beaded Clutch | bag | grey | now | 5 | 0 | 120 | sparkle | B3 | Silver beaded box clutch with a clasp, shimmering. |
| `item-gala-8` | Pearl Collar Necklace | accessory | white | 50s | 5 | 0 | 90 | sparkle | B3 | White three-strand pearl collar necklace laid in a gentle arc. |

### Mountain Weekend (accent green)

| Slot id | Name | Category | Colour | Era | Formality | Warmth | Price | Feature | Batch | Art note |
|---|---|---|---|---|---|---|---|---|---|---|
| `item-mountain-1` | Red Check Flannel Shirt | top | red | 90s | 1 | 2 | 58 | - | B3 | Red and black buffalo-check flannel shirt, sleeves folded across. |
| `item-mountain-2` | Cream Cable-Knit Sweater | top | cream | 70s | 2 | 3 | 96 | - | B4 | Chunky cream cable-knit sweater with a roll neck, 1970s. |
| `item-mountain-3` | Tan Hiking Trousers | bottom | tan | now | 1 | 2 | 84 | sturdy | B4 | Tan technical hiking trousers with zip pockets and a drawcord hem. |
| `item-mountain-4` | Orange Down Puffer | outer | orange | 90s | 1 | 3 | 190 | - | B4 | Orange quilted down puffer jacket with a stand collar, zipped. |
| `item-mountain-5` | Black Trail Boots | shoes | black | now | 1 | 2 | 140 | sturdy, waterproof | B4 | A pair of black leather trail boots with black laces and lug soles. |
| `item-mountain-6` | Blue Canvas Rucksack | bag | blue | 90s | 1 | 0 | 88 | sturdy | B4 | Blue canvas rucksack with leather straps and a buckled top flap. |
| `item-mountain-7` | Grey Wool Beanie | hat | grey | now | 1 | 2 | 28 | - | B4 | Grey ribbed wool beanie with a folded cuff, lying flat. |
| `item-mountain-8` | Green Wool Scarf | accessory | green | 70s | 2 | 2 | 36 | - | B4 | Forest-green wool scarf with fringed ends, folded in thirds. |

### Studio Avant-garde (accent violet)

| Slot id | Name | Category | Colour | Era | Formality | Warmth | Price | Feature | Batch | Art note |
|---|---|---|---|---|---|---|---|---|---|---|
| `item-studio-1` | Violet Origami Top | top | violet | now | 4 | 1 | 120 | - | B4 | Violet sculptural top with folded origami panels and one asymmetric shoulder. |
| `item-studio-2` | Grey Pleated Culottes | bottom | grey | now | 4 | 1 | 104 | - | B4 | Grey wide-leg pleated culottes, accordion pleats fanned out. |
| `item-studio-3` | White Drape Dress | dress | white | now | 4 | 1 | 230 | - | B4 | White asymmetric draped dress with a single twisted fold. |
| `item-studio-4` | Cobalt Oversized Blazer-Coat | outer | blue | 90s | 4 | 2 | 210 | - | B4 | Cobalt oversized blazer-coat, dropped shoulders, one large button. |
| `item-studio-5` | Black Platform Boots | shoes | black | 90s | 3 | 2 | 150 | - | B4 | A pair of black chunky platform boots with a sculpted heel, 90s. |
| `item-studio-6` | Magenta Geometric Bag | bag | magenta | now | 3 | 0 | 130 | - | B5 | Magenta angular geometric handbag with a rigid top handle. |
| `item-studio-7` | Blush Sculpted Felt Hat | hat | pink | now | 3 | 1 | 76 | - | B5 | Blush-pink sculpted felt hat with an architectural folded brim. |
| `item-studio-8` | Chrome Sculpture Cuff | accessory | grey | now | 4 | 0 | 85 | sparkle | B5 | Chrome open cuff bracelet shaped like a twisted ribbon. |

### Vintage 70s (accent rust)

| Slot id | Name | Category | Colour | Era | Formality | Warmth | Price | Feature | Batch | Art note |
|---|---|---|---|---|---|---|---|---|---|---|
| `item-vintage-1` | Cream Pussy-Bow Blouse | top | cream | 70s | 3 | 1 | 62 | - | B5 | Cream blouse with a long pussy-bow tie and bishop sleeves, 1970s. |
| `item-vintage-2` | Rust Flared Corduroys | bottom | orange | 70s | 2 | 2 | 70 | - | B5 | Rust-orange high-waist flared corduroy trousers with wide wales. |
| `item-vintage-3` | Mustard Maxi Dress | dress | yellow | 70s | 3 | 1 | 98 | - | B5 | Mustard maxi dress with a printed hem band and deep V neckline, 1970s. |
| `item-vintage-4` | Tan Suede Fringe Jacket | outer | tan | 70s | 2 | 2 | 150 | - | B5 | Tan suede jacket with long fringe across the yoke and sleeves. |
| `item-vintage-5` | Red Platform Clogs | shoes | red | 70s | 2 | 1 | 90 | - | B5 | A pair of red wooden platform clogs with leather uppers. |
| `item-vintage-6` | Olive Patchwork Shoulder Bag | bag | lime | 70s | 2 | 0 | 74 | - | B5 | Olive-green patchwork leather shoulder bag with a long strap. |
| `item-vintage-7` | Navy Floppy Felt Hat | hat | navy | 70s | 3 | 1 | 58 | - | B5 | Navy floppy wide-brim felt hat with a slim band. |
| `item-vintage-8` | Teal Bead Necklace | accessory | teal | 70s | 2 | 0 | 44 | - | B5 | Teal wooden-bead long necklace laid in a loose loop. |

## Challenges (40)

Rule codes are defined in `product.md`. Briefs are at most 90 characters. Every challenge has a
three-star look inside the closet that exists when its chapter unlocks (proof counts below).

### Chapter 1 - Sun on the Water - Riviera Summer

| Id | Name | Client | Set | Rule codes | Brief |
|---|---|---|---|---|---|
| `riv-01` | Harbour Lunch | Mireille Vasseur | A | warmth-max:2; needs-feature:shade | Lunch on the quay and the sun does not forgive. Keep it airy and shaded. |
| `riv-02` | Market Morning | Mireille Vasseur | A | max-hues:1; max-spend:330 | Market day. One colour at most, a tidy $330 budget, nothing fussy. |
| `riv-03` | Sunset Terrace | Edie Lindqvist | E | palette-warm; warmth-max:4 | Golden hour on the terrace. Warm tones only, and nothing heavy. |
| `riv-04` | Ferry Day | Tobias Okafor | C | needs-feature:waterproof; max-hues:1; warmth-max:6 | Spray on the ferry deck. One waterproof piece, one colour, nothing too heavy. |
| `riv-05` | Villa Garden | Mireille Vasseur | D | formality-min:2; warmth-max:7; max-hues:1 | Tea at the villa: a step up from beachwear, still light, still one colour. |
| `riv-06` | Marina Regatta | Dame Ottoline Frost | A | include-colour:sky; palette-cool; avoid-colour:navy | Regatta day. Sky blue somewhere, cool tones throughout, no navy blazer. |
| `riv-07` | Promenade Dusk | Mireille Vasseur | G | include-piece:item-riviera-4; max-spend:450; warmth-max:8 | An evening stroll built around the orange wrap skirt, under $450, nothing heavy. |

### Chapter 2 - Grey Day, Sharp Edges - Rainy City

| Id | Name | Client | Set | Rule codes | Brief |
|---|---|---|---|---|---|
| `rai-01` | Bus Stop Brief | Tobias Okafor | C | needs-feature:waterproof; warmth-min:6; formality-max:4 | Twenty minutes at the bus stop. Waterproof, properly warm, definitely not black tie. |
| `rai-02` | Gallery Queue | Jun Aoki | D | formality-min:2; needs-feature:waterproof; max-hues:1 | Queueing outside the gallery in drizzle. Dry, presentable, one colour. |
| `rai-03` | Umbrella Weather | Tobias Okafor | B | needs-feature:waterproof; warmth-min:5; max-hues:1 | A dress in the rain: add a coat, stay waterproof and warm, keep to one colour. |
| `rai-04` | Night Shift Commute | Edie Lindqvist | C | max-hues:0; needs-feature:waterproof; warmth-min:6 | Late tram home. Dark neutrals only, waterproof, warm enough to doze. |
| `rai-05` | Puddle Etiquette | Tobias Okafor | D | include-colour:yellow; needs-feature:waterproof; max-spend:520 | I want to be seen across the street. Something yellow, waterproof, under $520. |
| `rai-06` | Rooftop Drizzle | Dame Ottoline Frost | F | formality-min:2; needs-feature:waterproof; max-spend:560 | Rooftop drinks in light rain: smart, waterproof, and kind to a $560 budget. |
| `rai-07` | The Last Tram | Tobias Okafor | G | avoid-piece:item-rainy-city-1; warmth-min:7; max-hues:1; needs-feature:waterproof | Cold last tram. Warmth 7 or more, one waterproof piece, one colour, no slicker. |

### Chapter 3 - After the Curtain - Gala Night

| Id | Name | Client | Set | Rule codes | Brief |
|---|---|---|---|---|---|
| `gal-01` | Cloakroom | Dame Ottoline Frost | F | include-piece:item-gala-5; formality-min:4; max-hues:2 | The Midnight Opera Coat comes with me. Everything else formal, two colours at most. |
| `gal-02` | Opening Night | Dame Ottoline Frost | F | include-piece:item-gala-1; needs-feature:sparkle; min-spend:600 | Opening night calls for the red gown, something that sparkles, and a real splurge. |
| `gal-03` | Champagne Interval | Mireille Vasseur | F | include-colour:yellow; formality-min:3; max-hues:2; warmth-max:6 | Interval champagne: a touch of gold, nothing casual, two colours, nothing heavy. |
| `gal-04` | The Long Table | Dame Ottoline Frost | C | formality-min:4; avoid-colour:black; needs-feature:sparkle | Dinner for forty. Formal, a little sparkle, and not a stitch of black. |
| `gal-05` | Curtain Call | Jun Aoki | F | era-min:now; formality-min:3; max-hues:1 | Backstage in the present tense: only modern pieces, dressy, one colour at most. |
| `gal-06` | Afterparty Stairs | Priya Raman | E | formality-min:3; needs-feature:sparkle; warmth-max:7 | Afterparty up six flights of stairs. Dressy, sparkling, light enough to climb. |
| `gal-07` | Midnight Supper | Dame Ottoline Frost | G | include-piece:item-gala-2; needs-feature:sparkle; min-spend:800; avoid-piece:item-rainy-city-2 | Supper at midnight: the velvet dress, sparkle, $800 or more, trench left behind. |

### Chapter 4 - Above the Tree Line - Mountain Weekend

| Id | Name | Client | Set | Rule codes | Brief |
|---|---|---|---|---|---|
| `mtn-01` | Trailhead | Priya Raman | D | needs-feature:sturdy; formality-max:2 | Boots on at the trailhead. One sturdy piece and nothing fancier than casual. |
| `mtn-02` | Cabin Porch | Tobias Okafor | D | include-piece:item-mountain-2; warmth-min:11; formality-max:2 | Cold evenings on the cabin porch: the cable-knit sweater and warmth of 11 or more. |
| `mtn-03` | Ridge Walk | Priya Raman | D | needs-feature:sturdy; warmth-min:9; max-spend:500; include-piece:item-mountain-6 | A long ridge walk with the blue rucksack. Sturdy, warm and under $500. |
| `mtn-04` | Hut Supper | Edie Lindqvist | G | formality-max:3; warmth-min:9; include-colour:green | Supper at the mountain hut. Warm, relaxed, and one green thing to cheer me up. |
| `mtn-05` | Snow Day | Priya Raman | G | warmth-min:12; needs-feature:waterproof; max-hues:2; include-piece:item-mountain-4 | Fresh snow. Puffer on, something waterproof, warmth 12 or more, two colours. |
| `mtn-06` | Lake Loop | Mireille Vasseur | D | needs-feature:sturdy; warmth-max:11; formality-max:2 | A lake loop in September: sturdy, casual, and not so warm that I roast. |
| `mtn-07` | Summit Selfie | Priya Raman | G | include-colour:orange; needs-feature:sturdy; warmth-min:11; max-hues:2 | Summit selfie! Something orange to be seen, sturdy and warm, two colours at most. |

### Chapter 5 - The Last Row - Studio Avant-garde

| Id | Name | Client | Set | Rule codes | Brief |
|---|---|---|---|---|---|
| `stu-01` | Warehouse Preview | Jun Aoki | F | include-piece:item-studio-3; formality-min:3; era-min:90s | Preview in the warehouse: the white drape dress, dressy, nothing older than the 90s. |
| `stu-02` | Pattern Table | Jun Aoki | G | max-hues:2; formality-min:3; include-colour:violet | Pattern table. One violet voice, two colours at most, nothing sloppy. |
| `stu-03` | Runway Rehearsal | Jun Aoki | F | era-min:90s; include-colour:magenta; max-hues:2; max-spend:750 | Rehearsal: magenta somewhere, 90s or newer, two colours at most, under $750. |
| `stu-04` | Critic's Corner | Dame Ottoline Frost | G | formality-min:3; needs-feature:sparkle; max-hues:1; max-spend:900 | The critic sits front row. Dressy, one colour, one sparkle, under $900. |
| `stu-05` | Final Fitting | Jun Aoki | G | include-colour:pink; era-min:90s; formality-min:3; warmth-max:9 | Final fitting: blush pink, 90s or newer, dressy, and light enough to move. |
| `stu-06` | Closing Salon | Tobias Okafor | G | min-spend:900; max-hues:2; formality-min:3; include-colour:blue | Closing salon: blue, dressy, two colours at most, and a spend of $900 or more. |

### Chapter 6 - Second-Hand Sunshine - Vintage 70s

| Id | Name | Client | Set | Rule codes | Brief |
|---|---|---|---|---|---|
| `vin-01` | Jumble Sale | Edie Lindqvist | G | era-max:70s; max-spend:560 | Jumble sale. Nothing newer than the seventies, and keep the haul under $560. |
| `vin-02` | Record Fair | Edie Lindqvist | G | era-max:70s; include-colour:orange; formality-max:3 | Record fair: seventies or older, something orange, nothing dressier than smart casual. |
| `vin-03` | Disco Matinee | Mireille Vasseur | G | era-max:70s; include-colour:red; formality-min:2; max-spend:600 | Disco matinee: seventies or older, a flash of red, nothing sloppy, under $600. |
| `vin-04` | Roller Rink | Priya Raman | F | era-max:70s; warmth-max:9; avoid-colour:orange | Roller rink. Seventies or older, light enough to skate, and no orange. |
| `vin-05` | Polaroid Day | Edie Lindqvist | G | include-colour:yellow; era-max:90s; warmth-max:9; max-spend:560 | Polaroid day: something sunny yellow, nothing newer than the 90s, light, under $560. |
| `vin-06` | Sunday Drive | Priya Raman | D | era-max:70s; include-piece:item-vintage-4; max-hues:3; formality-min:2 | Sunday drive in the suede fringe jacket. Seventies or older, tidy, three colours. |

### Proof counts (prototype over the shipped data)

Exhaustive enumeration of every complete look in the closet that exists when the chapter unlocks
(Riviera Summer and Rainy City use the 16-piece starting closet, Gala Night 24, Mountain Weekend
32, Studio Avant-garde 40, Vintage 70s 48). `Looks` = complete looks, `3-star` = looks that earn
three stars, `Share` = 3-star / looks. The empty board scores 0 stars for all 40. Reference looks
(the stored hint solutions) are listed in `.agents/resources/2026-10-23/web-games/dress-rehearsal/00/README.md`.

| Id | Slots | Rules | Looks | 3-star | Share |
|---|---|---|---|---|---|
| `riv-01` | 6 | 2 | 72 | 24 | 33.33% |
| `riv-02` | 6 | 2 | 72 | 9 | 12.50% |
| `riv-03` | 7 | 2 | 80 | 18 | 22.50% |
| `riv-04` | 6 | 3 | 144 | 41 | 28.47% |
| `riv-05` | 7 | 3 | 144 | 14 | 9.72% |
| `riv-06` | 6 | 3 | 72 | 8 | 11.11% |
| `riv-07` | 8 | 3 | 160 | 5 | 3.13% |
| `rai-01` | 6 | 3 | 144 | 37 | 25.69% |
| `rai-02` | 7 | 3 | 144 | 16 | 11.11% |
| `rai-03` | 6 | 3 | 16 | 4 | 25.00% |
| `rai-04` | 6 | 3 | 144 | 5 | 3.47% |
| `rai-05` | 7 | 3 | 144 | 23 | 15.97% |
| `rai-06` | 7 | 3 | 160 | 36 | 22.50% |
| `rai-07` | 8 | 4 | 160 | 6 | 3.75% |
| `gal-01` | 7 | 3 | 1,539 | 4 | 0.26% |
| `gal-02` | 7 | 3 | 1,539 | 21 | 1.36% |
| `gal-03` | 7 | 4 | 1,539 | 42 | 2.73% |
| `gal-04` | 6 | 3 | 1,296 | 2 | 0.15% |
| `gal-05` | 7 | 3 | 1,539 | 2 | 0.13% |
| `gal-06` | 7 | 3 | 513 | 21 | 4.09% |
| `gal-07` | 8 | 4 | 1,539 | 3 | 0.19% |
| `mtn-01` | 7 | 2 | 15,360 | 18 | 0.12% |
| `mtn-02` | 7 | 3 | 15,360 | 6 | 0.04% |
| `mtn-03` | 7 | 4 | 15,360 | 5 | 0.03% |
| `mtn-04` | 8 | 3 | 16,896 | 60 | 0.36% |
| `mtn-05` | 8 | 4 | 16,896 | 8 | 0.05% |
| `mtn-06` | 7 | 3 | 15,360 | 10 | 0.07% |
| `mtn-07` | 8 | 4 | 16,896 | 22 | 0.13% |
| `stu-01` | 7 | 3 | 28,750 | 14 | 0.05% |
| `stu-02` | 8 | 3 | 86,250 | 116 | 0.13% |
| `stu-03` | 7 | 4 | 28,750 | 405 | 1.41% |
| `stu-04` | 8 | 4 | 86,250 | 220 | 0.26% |
| `stu-05` | 8 | 4 | 86,250 | 42 | 0.05% |
| `stu-06` | 8 | 4 | 86,250 | 8 | 0.01% |
| `vin-01` | 8 | 2 | 316,224 | 6 | 0.00% |
| `vin-02` | 8 | 3 | 316,224 | 8 | 0.00% |
| `vin-03` | 8 | 4 | 316,224 | 15 | 0.00% |
| `vin-04` | 7 | 3 | 79,056 | 4 | 0.01% |
| `vin-05` | 8 | 4 | 316,224 | 19 | 0.01% |
| `vin-06` | 7 | 4 | 290,304 | 24 | 0.01% |

## Rule cards (first-time sheets)

| # | Title | Shown on | Text (one short paragraph) |
|---|---|---|---|
| 1 | The brief | `riv-01` | Fill every slot, then meet every rule on the client's card. A rule turns green when it is met. |
| 2 | Warmth | `riv-01` | Every piece has a warmth from 0 (airy) to 3 (heavy). Weather rules add up the warmth of the whole look. |
| 3 | Features | `riv-01` | Some pieces are waterproof, give shade, sparkle or are sturdy. A rule can ask for at least one. |
| 4 | Colour wheel | `riv-02` | Neutrals go with everything. Beyond that, neighbours and opposites on the wheel get along; too many colours do not. |
| 5 | Budget | `riv-02` | Each piece has a price in dollars. Some briefs cap the spend, and some ask for a splurge. |
| 6 | One-piece rule | `riv-03` | A dress replaces the top and the bottom. Placing one clears the other pieces. |
| 7 | Dress codes | `riv-05` | Formality runs from 1 (loungewear) to 5 (black tie). A dress-code rule sets a floor or a ceiling for every piece. |
| 8 | Must and must-not | `riv-07` | Some briefs name a piece you must wear or must leave out. |
| 9 | Eras | `gal-05` | Pieces come from the 50s, 70s, 90s or now. Era rules set a limit, and mixing distant eras costs harmony. |

Which rule kinds each card introduces (a challenge may not use a kind before its card is shown):

| Card | Rule kinds |
|---|---|
| Warmth | `warmth-min`, `warmth-max` |
| Features | `needs-feature` |
| Colour wheel | `palette-warm`, `palette-cool`, `max-hues`, `include-colour`, `avoid-colour` |
| Budget | `max-spend`, `min-spend` |
| Dress codes | `formality-min`, `formality-max` |
| Must and must-not | `include-piece`, `avoid-piece` |
| Eras | `era-min`, `era-max` |
| The brief | none (shown on the first challenge) |
| One-piece rule | none (shown on the first challenge whose slot set offers a dress and top + bottom: `riv-03`, set E) |

## Tutorial plan (riv-01, steps shown by the onboarding task)

1. "Meet your client." Highlights the client card and the first rule chip.
2. "Open the Tops tab." Highlights the tray tab; advances when the tab is opened.
3. "Drag a piece onto its slot." Requires the first placement (tap-to-place also advances).
4. "Fill every slot." Rule chips turn green as rules are met; advances when the look is complete.
5. "Finish your look." Highlights Finish look; the result sheet then explains the three stars: complete, on brief, polished.

## Titles and strings that need writing (all English)

- Game title: Dress Rehearsal. Tagline: "Style the look. Meet the brief."
- Tray tab labels: Tops, Bottoms, Dresses, Outerwear, Shoes, Bags, Hats, Extras.
- Result headlines: 3 stars "Polished. The client is speechless."; 2 stars "On brief. Add a little polish."; 1 star "Presentable, with notes."; 0 stars (not cleared) "Not ready for the rehearsal."
- Star names: Presentable, On brief, Polished.
- Harmony part names: Colour scheme, Neutral anchor, Dress code, Era match, Season sense. Scheme names: Neutral, Tonal, Analogous, Complementary, Triad pair, Awkward pair, Triadic, Analogous trio, Busy, Too many colours.
- How-to pages (six): The brief; Pieces and slots; Rules; Harmony; Stars and scoring; Daily Fitting and Gallery.
- Export frames: Plain, Paper Border, Polaroid, Magazine Cover.
- Share templates and daily wording: see `product.md`.

## Daily Fitting content

- Weekday ladder and generator: `product.md`. Client for the day comes from the six clients above.
- 7 committed fallback templates (Monday to Sunday), each a complete challenge with a reference look built from the 16-piece starting closet. Task 03 authors them with the generator tooling and the tests validate them like campaign challenges.

## Content counts the validators enforce (task 02)

- 6 chapters, 40 challenges; ids `riv-01..07`, `rai-01..07`, `gal-01..07`, `mtn-01..07`, `stu-01..06`, `vin-01..06`; unique names.
- 48 pieces with unique ids `item-<theme>-<1..8>`, 8 per theme, category counts top 8, bottom 7, dress 5, outer 6, shoes 6, bag 6, hat 4, accessory 6; tags within range (formality 1 to 5, warmth 0 to 3, price > 0).
- Every challenge opens 6 to 8 slots from sets A to G and has 2 to 4 rules of the 16 kinds; rule arguments valid (colours, eras, feature names, existing piece ids).
- Every challenge has at least 2 three-star looks in its unlock closet, the empty board scores 0 stars, and the share of complete looks that earn three stars is at most 35 percent in chapters 1 and 2, 5 percent in chapter 3 and 2 percent in chapters 4 to 6.
- Every brief is at most 90 characters, non-empty, English; every client line at most 80 characters; no placeholder text; no emoji.
- 6 clients with exactly the challenge counts 7, 7, 7, 7, 6, 6 (Mireille, Tobias, Ottoline, Priya, Jun, Edie) and 8 lines each.
- Stars total 120; chapter unlock stars 0, 0, 12, 27, 45, 66; affinity thresholds 3, 9, 15.
- The first use of each rule kind falls on or after the challenge whose rule card introduces it (cards table above).
