# Lost Parcel Desk - content plan (v1, complete)

This is the full named content list for v1. It drives the art briefs (`assets-index.md`), the content task
(`tasks/epics/24-web-lost-parcel-desk/02-content.md`) and the validators. Counts in this file are binding;
if task 02 must change a number it edits this file, `economy.md`, `product.md` and `decisions-log.md` in the
same commit. Tables are machine-read by `test/content-plan.test.ts` (task 02), so keep their column order.

The logic in every case below was checked by a throwaway script during task 00: exactly one of the three
candidates satisfies every deduction, every deduction is necessary (removing it leaves two candidates), and no
flavour text names a fact that separates the candidates. Task 02 turns the same checks into the shipped validator.

## Totals

- 3 chapters, 12 cases (4 per chapter), 12 town places, 12 ledger fragments (lore), 12 townsfolk, one owner each.
- 49 evidence objects (cases 01 to 11 have 4 each, case 12 has 5); 2 faces each (front, back) plus zoom hotspots.
- 70 clues: 33 lead clues (in a deduction) and 37 flavour clues. 24 deductions: 12 direct, 9 key-and-lock pairs, 3 rule-outs.
- 4 logic facets (street, pastime, look, pet) x 6 values = 24 almanac entries; trade is identity only and never a deduction.
- 5 desk themes, 12 achievements, 4 mechanic cards, 6 tutorial steps, 6 how-to pages.
- Daily Parcel cases are generated, not listed; the template bank and weekday ladder are at the end of this file.
- 36 stamps maximum (3 per case). Not applicable here (the shared spec template mentions them): constellations, items, levels.

## Chapters

| Chapter | Title | Cases | Unlock (stamps) |
|---|---|---|---|
| 1 | The Spring Backlog | 01 to 04 | open |
| 2 | Rain on the Sorting Room | 05 to 08 | 7 |
| 3 | The Last Sack | 09 to 12 | 18 |

Chapter texts (verbatim in the game):

- Chapter 1 intro: The river has gone down and left the sorting room full of strangers' parcels. Open them, read what is inside, and work out whose they are.
- Chapter 1 outro: Four parcels home and four townsfolk smiling. The desk is clearer, but the shelf behind it is still full.
- Chapter 2 intro: More rain, more sacks, and the labels are worse. Some clues only make sense in pairs, and some tell you who it cannot be.
- Chapter 2 outro: Eight parcels delivered. The dead-letter shelf is half bare and the town has started leaving cake for the clerk.
- Chapter 3 intro: The last sack came off the night train. Mr. Hobb's handwriting is on every one of these, and he is not here to ask.
- Chapter 3 outro: Every parcel is home, the ledger is whole and the desk, at last, is yours.

Setting: Ketterly, a small river town in 1974. The post office was flooded on the night of 4 March; the old clerk, Mr. Hobb, saved the mail but not the labels. The player is the new clerk.

## Town map (12 places)

The town map is code-drawn in the riso palette. A place fills in (colour, stamp, window light) when its case closes; the Post Office is always drawn. Streets: Quay Road, Mill Lane, Tanner's Row, Lamplight Street, Orchard Close, Station Hill.

| Case | Place | Owner's home street |
|---|---|---|
| 01 | Ferry Landing | Quay Road |
| 02 | Crumb's Bakery | Mill Lane |
| 03 | Pike's Barbershop | Tanner's Row |
| 04 | The Roxy Picture House | Lamplight Street |
| 05 | Ketterly Library | Orchard Close |
| 06 | Gault's Garage | Station Hill |
| 07 | St. Wren's School | Orchard Close |
| 08 | Bloom's Florist | Mill Lane |
| 09 | Station Signal Box | Station Hill |
| 10 | Thimble & Son Tailors | Tanner's Row |
| 11 | Kettle's Hardware | Lamplight Street |
| 12 | Quill's Piano Rooms | Quay Road |

## Townsfolk (12, one owner each)

Portrait art slot `townsfolk-N` (3:4 bust, transparent). Profile card lines: Lives on (street), Pastime, Look, Pet. Trade is shown as the card subtitle.

| # | Name | Trade | Street | Pastime | Look | Pet | Owns case | Appears in cases | Portrait slot |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Odalie Fenn | ferry pilot | Quay Road | angling | red hair | cat | 01 | 01, 08, 12 | townsfolk-1 |
| 2 | Barnaby Crumb | baker | Mill Lane | choir | spectacles | dog | 02 | 02, 05, 07 | townsfolk-2 |
| 3 | Winifred Pike | barber | Tanner's Row | crosswords | left-handed | canary | 03 | 03, 07 | townsfolk-3 |
| 4 | Cosmo Vane | projectionist | Lamplight Street | model trains | hearing aid | none | 04 | 04, 09, 11 | townsfolk-4 |
| 5 | Marguerite Oake | librarian | Orchard Close | birdwatching | spectacles | tortoise | 05 | 05, 06 | townsfolk-5 |
| 6 | Dennis Gault | mechanic | Station Hill | angling | left-handed | dog | 06 | 02, 06, 09 | townsfolk-6 |
| 7 | Priya Lowell | teacher | Orchard Close | choir | tall | canary | 07 | 02, 03, 07, 12 | townsfolk-7 |
| 8 | Hettie Bloom | florist | Mill Lane | birdwatching | walking stick | cat | 08 | 05, 08, 11 | townsfolk-8 |
| 9 | Iggy Marsh | signaller | Station Hill | crosswords | hearing aid | tortoise | 09 | 04, 06, 09 | townsfolk-9 |
| 10 | Tobias Thimble | tailor | Tanner's Row | chess | red hair | goldfish | 10 | 01, 03, 10 | townsfolk-10 |
| 11 | Rosalind Kettle | ironmonger | Lamplight Street | chess | walking stick | none | 11 | 08, 10, 11 | townsfolk-11 |
| 12 | Ambrose Quill | piano tuner | Quay Road | model trains | tall | goldfish | 12 | 01, 04, 10, 12 | townsfolk-12 |

Every street, pastime, look and pet value is shared by exactly two townsfolk, so no single fact names one person.

Bios (profile sheet, one line each):

- Odalie Fenn: Pilots the Ketterly ferry and waves at everyone, including the fog.
- Barnaby Crumb: Bakes from four, sings from seven, and has never been on time for a tuning.
- Winifred Pike: Cuts hair, hears every secret in town and repeats none of them.
- Cosmo Vane: Threads the Roxy's projector by night and runs a model railway by day.
- Marguerite Oake: Keeps the library quiet and a bird list in her coat pocket.
- Dennis Gault: Fixes anything with an engine and tells everyone he is fine.
- Priya Lowell: Teaches at St. Wren's and ducks every doorframe on Orchard Close.
- Hettie Bloom: Sells flowers from a stool beside her stick and a cat asleep on the till.
- Iggy Marsh: Signals the night trains and finishes the crossword before the milk arrives.
- Tobias Thimble: Tailors by day, plays chess by post by night, and is losing to a man in Norwich.
- Rosalind Kettle: Stocks every nail, lamp and washer on Lamplight Street and knows where each one is.
- Ambrose Quill: Tunes pianos across the county and was the last to leave on flood night.

## Clerk's Almanac (clue vocabulary, 24 entries)

The Almanac screen shows these lines so every clue is fair: a clue tag is always readable through one of the keywords below. Flavour clues may never use a keyword of a value that some, but not all, of the case's three candidates hold (validator rule, task 02).

| Facet | Value | What to look for (keywords) |
|---|---|---|
| Street | Quay Road | river-mud grit, rope fibre, damp ferry paper |
| Street | Mill Lane | grain husks, millstone dust |
| Street | Tanner's Row | tannery smell, leather dust, hide string |
| Street | Lamplight Street | lamp soot, oil stains, brass fittings |
| Street | Orchard Close | apple blossom, windfalls, wasp stings |
| Street | Station Hill | coal cinders, engine smuts, platform grit |
| Pastime | angling | hooks, lead weights, line |
| Pastime | choir | hymn sheets, tuning forks, rehearsal notices |
| Pastime | crosswords | pencilled grids, clue numbers, rubbed-out answers |
| Pastime | model trains | scale signal lamps, couplings, track pins |
| Pastime | birdwatching | binoculars, lens caps, tick lists |
| Pastime | chess | carved pieces, postal scorecards, board notation |
| Look | red hair | copper hairs on wool and collars |
| Look | spectacles | lens cloths, spare arms, smudged thumbprints |
| Look | left-handed | left-slanting writing, ink smeared on the left edge, left-hand scissors |
| Look | hearing aid | batteries, foam domes, clinic cards |
| Look | tall | let-down hems, high pencil marks, long sleeves |
| Look | walking stick | rubber ferrules, worn tips, chemist's receipts |
| Pet | cat | tabby hairs, scratched corners |
| Pet | dog | paw prints, chew marks, biscuit crumbs |
| Pet | canary | birdseed, yellow feathers, cuttlebone |
| Pet | none | spotless paper, no hairs or crumbs |
| Pet | tortoise | lettuce nibbles, heat-lamp receipts |
| Pet | goldfish | fish-food flakes, nets, aquarium gravel |

## Case index

Difficulty 1 to 5 and par minutes (target solve time; a record only, never a rule). Kinds: D = direct, K = key-and-lock pair, R = rule-out.

| Case | Title | Chapter | Place | Owner | Candidates | Objects | Lead clues | Flavour clues | Deductions | Difficulty | Par min |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | The Seaside Postcard | 1 | Ferry Landing | Odalie Fenn | Odalie, Ambrose, Tobias | 4 | 2 | 3 | D+D | 1 | 5 |
| 02 | The Biscuit Tin Hymnal | 1 | Crumb's Bakery | Barnaby Crumb | Barnaby, Priya, Dennis | 4 | 2 | 3 | D+D | 1 | 5 |
| 03 | The Barometer in a Hat Box | 1 | Pike's Barbershop | Winifred Pike | Winifred, Priya, Tobias | 4 | 2 | 3 | D+D | 2 | 5 |
| 04 | Small Print and Smaller Batteries | 1 | The Roxy Picture House | Cosmo Vane | Cosmo, Iggy, Ambrose | 4 | 2 | 3 | D+D | 2 | 6 |
| 05 | The Pressed Wren | 2 | Ketterly Library | Marguerite Oake | Marguerite, Barnaby, Hettie | 4 | 3 | 3 | K+D | 3 | 6 |
| 06 | Cinders in the Cake Box | 2 | Gault's Garage | Dennis Gault | Dennis, Marguerite, Iggy | 4 | 2 | 3 | D+R | 3 | 6 |
| 07 | A Note from the Back Row | 2 | St. Wren's School | Priya Lowell | Priya, Barnaby, Winifred | 4 | 3 | 3 | D+K | 3 | 7 |
| 08 | The Cane Tip and the Cat | 2 | Bloom's Florist | Hettie Bloom | Hettie, Rosalind, Odalie | 4 | 3 | 3 | D+K | 4 | 7 |
| 09 | Domes and Door Keys | 3 | Station Signal Box | Iggy Marsh | Iggy, Dennis, Cosmo | 4 | 4 | 3 | K+K | 4 | 8 |
| 10 | The Knight Without a Board | 3 | Thimble & Son Tailors | Tobias Thimble | Tobias, Ambrose, Rosalind | 4 | 3 | 3 | K+R | 4 | 8 |
| 11 | The Lamp That Wasn't Lit | 3 | Kettle's Hardware | Rosalind Kettle | Rosalind, Hettie, Cosmo | 4 | 3 | 3 | K+R | 5 | 8 |
| 12 | The Piano Tuner's Key | 3 | Quill's Piano Rooms | Ambrose Quill | Ambrose, Odalie, Priya | 5 | 4 | 4 | K+K | 5 | 8 |

## Case files

Each case lists its evidence objects (art slots), its clues and the logic data. A face is `front`, `zoom` (a hotspot on the front) or `back`. Clue roles: `D1`/`D2` lead clue; `D1 key`/`D1 lock` a pair (both must be pinned and linked together); `flavour` has no logic effect. `fits` means the deduction keeps the candidate; `rules out` removes the candidate.

### Case 01 - The Seaside Postcard

- Slug: `seaside-postcard`; chapter 1; found at: The dead-letter shelf; delivered to: Ferry Landing.
- Owner: Odalie Fenn (townsfolk-1). Candidates: Odalie Fenn, Ambrose Quill, Tobias Thimble.
- Difficulty 1, par 5 minutes. Ledger fragment: "Water at the Door".

| Object | Name | Art slot |
|---|---|---|
| 01-1 | Seaside postcard | evidence-postcard |
| 01-2 | Knitted scarf | evidence-01-2 |
| 01-3 | Muddy work glove | evidence-01-3 |
| 01-4 | Brass pocket compass | evidence-01-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 01-c1 | 01-2 | zoom | copper hair strand in the wool | D1 |
| 01-c2 | 01-3 | front | river-mud grit on the cuff | D2 |
| 01-c3 | 01-1 | back | unsigned "wish you were here" | flavour |
| 01-c4 | 01-2 | back | hand-knitted label, 1969 | flavour |
| 01-c5 | 01-4 | back | engraved "keep heading home" | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Look | owner's look is red hair | direct | rules out Ambrose Quill (tall) |
| D2 | Street | owner's street is Quay Road | direct | rules out Tobias Thimble (Tanner's Row) |

Reveal: Red hair in the scarf and river mud on the glove: Odalie Fenn, who pilots the ferry, lost her bundle in the March flood.

Ledger fragment "Water at the Door": 4 March 1974, 11 pm: the river comes over the sill and Mr. Hobb counts the sacks twice.

### Case 02 - The Biscuit Tin Hymnal

- Slug: `biscuit-tin-hymnal`; chapter 1; found at: Under the sorting table; delivered to: Crumb's Bakery.
- Owner: Barnaby Crumb (townsfolk-2). Candidates: Barnaby Crumb, Priya Lowell, Dennis Gault.
- Difficulty 1, par 5 minutes. Ledger fragment: "Hobb's Lantern".

| Object | Name | Art slot |
|---|---|---|
| 02-1 | Dented biscuit tin | evidence-02-1 |
| 02-2 | Folded hymn sheet | evidence-02-2 |
| 02-3 | Tin of throat lozenges | evidence-02-3 |
| 02-4 | Pressed buttercup bookmark | evidence-02-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 02-c1 | 02-1 | front | muddy paw print on the lid | D1 |
| 02-c2 | 02-2 | zoom | pencilled alto line | D2 |
| 02-c3 | 02-1 | back | price sticker, 9d | flavour |
| 02-c4 | 02-3 | front | half-eaten, cherry flavour | flavour |
| 02-c5 | 02-4 | back | "for luck" in a child's hand | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Pet | owner's pet is dog | direct | rules out Priya Lowell (canary) |
| D2 | Pastime | owner's pastime is choir | direct | rules out Dennis Gault (angling) |

Reveal: A paw print on the tin and an alto line on the hymn sheet: Barnaby Crumb, the baker who sings in the choir and walks his dog before dawn.

Ledger fragment "Hobb's Lantern": Hobb keeps one lantern lit on the counter so anyone on the road can see the office is open.

### Case 03 - The Barometer in a Hat Box

- Slug: `barometer-in-a-hat-box`; chapter 1; found at: Behind the radiator; delivered to: Pike's Barbershop.
- Owner: Winifred Pike (townsfolk-3). Candidates: Winifred Pike, Priya Lowell, Tobias Thimble.
- Difficulty 2, par 5 minutes. Ledger fragment: "Sacks on the Sorting Table".

| Object | Name | Art slot |
|---|---|---|
| 03-1 | Round hat box | evidence-03-1 |
| 03-2 | Brass barometer | evidence-03-2 |
| 03-3 | Embroidered tea towel | evidence-03-3 |
| 03-4 | Velvet drawstring bag | evidence-03-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 03-c1 | 03-3 | zoom | tannery smell in the weave | D1 |
| 03-c2 | 03-4 | front | birdseed in the seam | D2 |
| 03-c3 | 03-1 | front | rose-patterned lid | flavour |
| 03-c4 | 03-2 | back | needle stuck at "Change" | flavour |
| 03-c5 | 03-1 | back | reduced to 3s 6d | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Street | owner's street is Tanner's Row | direct | rules out Priya Lowell (Orchard Close) |
| D2 | Pet | owner's pet is canary | direct | rules out Tobias Thimble (goldfish) |

Reveal: A tea towel that smells of the tannery and birdseed in a velvet bag: Winifred Pike, whose canary sings over the clippers.

Ledger fragment "Sacks on the Sorting Table": Parcels are stacked on the table above the waterline, labels already running.

### Case 04 - Small Print and Smaller Batteries

- Slug: `small-print-smaller-batteries`; chapter 1; found at: Flood-damp sack no. 3; delivered to: The Roxy Picture House.
- Owner: Cosmo Vane (townsfolk-4). Candidates: Cosmo Vane, Iggy Marsh, Ambrose Quill.
- Difficulty 2, par 6 minutes. Ledger fragment: "Ink Runs Faster Than Water".

| Object | Name | Art slot |
|---|---|---|
| 04-1 | Tin of mixed buttons | evidence-04-1 |
| 04-2 | Miniature signal lamp | evidence-04-2 |
| 04-3 | Battery card | evidence-04-3 |
| 04-4 | Raffle ticket stubs | evidence-04-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 04-c1 | 04-2 | front | tiny signal lamp, 1:76 scale | D1 |
| 04-c2 | 04-3 | zoom | size-13 battery card | D2 |
| 04-c3 | 04-1 | back | one button is a brass anchor | flavour |
| 04-c4 | 04-4 | front | stubs numbered 1 to 9 | flavour |
| 04-c5 | 04-3 | back | "mind the draught" in pencil | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Pastime | owner's pastime is model trains | direct | rules out Iggy Marsh (crosswords) |
| D2 | Look | owner's look is hearing aid | direct | rules out Ambrose Quill (tall) |

Reveal: A scale signal lamp and a hearing-aid battery card: Cosmo Vane, who runs the Roxy's projector and builds railways at home.

Ledger fragment "Ink Runs Faster Than Water": By midnight half the addresses are blue streaks. Hobb copies what he can read into the ledger.

### Case 05 - The Pressed Wren

- Slug: `pressed-wren`; chapter 2; found at: The redirected-mail sack; delivered to: Ketterly Library.
- Owner: Marguerite Oake (townsfolk-5). Candidates: Marguerite Oake, Barnaby Crumb, Hettie Bloom.
- Difficulty 3, par 6 minutes. Ledger fragment: "The Wrong Pigeonhole".

| Object | Name | Art slot |
|---|---|---|
| 05-1 | Brass lens cap | evidence-05-1 |
| 05-2 | Warranty card | evidence-05-2 |
| 05-3 | Folded lens cloth | evidence-05-3 |
| 05-4 | Crumpled coach ticket | evidence-05-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 05-c1 | 05-1 | front | lens cap engraved 8x42 | D1 key |
| 05-c2 | 05-2 | back | warranty: field binoculars 8x42 | D1 lock |
| 05-c3 | 05-3 | zoom | thumbprints on a lens cloth | D2 |
| 05-c4 | 05-1 | back | rubbed with beeswax | flavour |
| 05-c5 | 05-3 | back | laundry mark, three dots | flavour |
| 05-c6 | 05-4 | front | coach ticket, fare stage 2 | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Pastime | owner's pastime is birdwatching | pair | rules out Barnaby Crumb (choir) |
| D2 | Look | owner's look is spectacles | direct | rules out Hettie Bloom (walking stick) |

Reveal: The lens cap matches the binocular warranty and the cloth belongs to spectacles: Marguerite Oake, who watches wrens between shelves.

Ledger fragment "The Wrong Pigeonhole": Sorting by touch in the dark, Hobb drops a handful into the wrong pigeonholes and writes down which.

### Case 06 - Cinders in the Cake Box

- Slug: `cinders-in-the-cake-box`; chapter 2; found at: Pigeonhole 14; delivered to: Gault's Garage.
- Owner: Dennis Gault (townsfolk-6). Candidates: Dennis Gault, Marguerite Oake, Iggy Marsh.
- Difficulty 3, par 6 minutes. Ledger fragment: "Cinders and Candle".

| Object | Name | Art slot |
|---|---|---|
| 06-1 | Cake box | evidence-06-1 |
| 06-2 | Clinic appointment card | evidence-06-2 |
| 06-3 | Twist of waxed paper | evidence-06-3 |
| 06-4 | Pocket diary | evidence-06-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 06-c1 | 06-1 | zoom | coal cinders in the folds | D1 |
| 06-c2 | 06-2 | back | "discharged: hearing normal" | D2 |
| 06-c3 | 06-1 | back | string tied twice | flavour |
| 06-c4 | 06-3 | front | pencilled sums, 17 + 24 | flavour |
| 06-c5 | 06-4 | back | page torn out at 4 March | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Street | owner's street is Station Hill | direct | rules out Marguerite Oake (Orchard Close) |
| D2 | Look | owner's look is not hearing aid | rule-out | rules out Iggy Marsh (hearing aid) |

Reveal: Cinders point to Station Hill and the clinic card rules out the hearing aid: Dennis Gault, mechanic, left-handed and stubbornly healthy.

Ledger fragment "Cinders and Candle": The stove stays lit all night and singes the corner of the ledger page.

### Case 07 - A Note from the Back Row

- Slug: `note-from-the-back-row`; chapter 2; found at: Stuck behind the counter drawer; delivered to: St. Wren's School.
- Owner: Priya Lowell (townsfolk-7). Candidates: Priya Lowell, Barnaby Crumb, Winifred Pike.
- Difficulty 3, par 7 minutes. Ledger fragment: "Seven Knocks at Midnight".

| Object | Name | Art slot |
|---|---|---|
| 07-1 | Tuning fork | evidence-07-1 |
| 07-2 | Rehearsal notice | evidence-07-2 |
| 07-3 | Birdseed paper twist | evidence-07-3 |
| 07-4 | Chewed pencil stub | evidence-07-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 07-c1 | 07-3 | front | yellow feather in the fold | D1 |
| 07-c2 | 07-1 | front | tuning fork stamped A=440 | D2 key |
| 07-c3 | 07-2 | back | "bring your fork on Tuesday" | D2 lock |
| 07-c4 | 07-1 | back | initials scratched off | flavour |
| 07-c5 | 07-2 | front | coffee ring over the date | flavour |
| 07-c6 | 07-4 | back | chewed at both ends | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Pet | owner's pet is canary | direct | rules out Barnaby Crumb (dog) |
| D2 | Pastime | owner's pastime is choir | pair | rules out Winifred Pike (crosswords) |

Reveal: The fork and the Tuesday notice make a choir member, and the yellow feather a canary: Priya Lowell, the tallest voice in the hall.

Ledger fragment "Seven Knocks at Midnight": Neighbours knock seven times and form a chain to carry sacks up the stairs.

### Case 08 - The Cane Tip and the Cat

- Slug: `cane-tip-and-the-cat`; chapter 2; found at: Wedged under the franking machine; delivered to: Bloom's Florist.
- Owner: Hettie Bloom (townsfolk-8). Candidates: Hettie Bloom, Rosalind Kettle, Odalie Fenn.
- Difficulty 4, par 7 minutes. Ledger fragment: "The Upstairs Shelf".

| Object | Name | Art slot |
|---|---|---|
| 08-1 | Rubber ferrule | evidence-08-1 |
| 08-2 | Chemist's receipt | evidence-08-2 |
| 08-3 | Cushion cover | evidence-08-3 |
| 08-4 | Spotted handkerchief | evidence-08-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 08-c1 | 08-3 | zoom | tabby hairs in the weave | D1 |
| 08-c2 | 08-1 | front | worn rubber ferrule, 19 mm | D2 key |
| 08-c3 | 08-2 | back | receipt: replacement ferrule, 19 mm | D2 lock |
| 08-c4 | 08-1 | back | chalk mark, "7" | flavour |
| 08-c5 | 08-3 | back | stitched with green thread | flavour |
| 08-c6 | 08-4 | front | spotted handkerchief, one corner knotted | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Pet | owner's pet is cat | direct | rules out Rosalind Kettle (none) |
| D2 | Look | owner's look is walking stick | pair | rules out Odalie Fenn (red hair) |

Reveal: A tabby-haired cushion and a ferrule that matches the receipt: Hettie Bloom, whose cat guards the shop and whose stick has seen better days.

Ledger fragment "The Upstairs Shelf": The dead-letter shelf is built that night from a door off its hinges.

### Case 09 - Domes and Door Keys

- Slug: `domes-and-door-keys`; chapter 3; found at: The night-train mail bag; delivered to: Station Signal Box.
- Owner: Iggy Marsh (townsfolk-9). Candidates: Iggy Marsh, Dennis Gault, Cosmo Vane.
- Difficulty 4, par 8 minutes. Ledger fragment: "The Telegram That Wasn't".

| Object | Name | Art slot |
|---|---|---|
| 09-1 | Matchbox of foam domes | evidence-09-1 |
| 09-2 | Clinic reorder card | evidence-09-2 |
| 09-3 | Brass door key | evidence-09-3 |
| 09-4 | Housing list extract | evidence-09-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 09-c1 | 09-1 | front | foam dome that fits an ear canal | D1 key |
| 09-c2 | 09-2 | back | reorder domes every 3 months | D1 lock |
| 09-c3 | 09-3 | zoom | key tag stamped 31 | D2 key |
| 09-c4 | 09-4 | back | no. 31 is on Station Hill | D2 lock |
| 09-c5 | 09-1 | back | pencilled "top drawer" | flavour |
| 09-c6 | 09-3 | back | key worn smooth | flavour |
| 09-c7 | 09-4 | front | list dated January 1974 | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Look | owner's look is hearing aid | pair | rules out Dennis Gault (left-handed) |
| D2 | Street | owner's street is Station Hill | pair | rules out Cosmo Vane (Lamplight Street) |

Reveal: Domes for a hearing aid and a key tagged 31 on Station Hill: Iggy Marsh, who holds the night trains with a lamp and a ledger of crosswords.

Ledger fragment "The Telegram That Wasn't": A signal holds the mail train outside town so the sacks can be saved before it arrives.

### Case 10 - The Knight Without a Board

- Slug: `knight-without-a-board`; chapter 3; found at: The bottom of the parcel hamper; delivered to: Thimble & Son Tailors.
- Owner: Tobias Thimble (townsfolk-10). Candidates: Tobias Thimble, Ambrose Quill, Rosalind Kettle.
- Difficulty 4, par 8 minutes. Ledger fragment: "Wet Wool and Thread".

| Object | Name | Art slot |
|---|---|---|
| 10-1 | Boxwood horse's head | evidence-10-1 |
| 10-2 | Postal scorecard | evidence-10-2 |
| 10-3 | Tower-climb certificate | evidence-10-3 |
| 10-4 | Bag of boiled sweets | evidence-10-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 10-c1 | 10-1 | front | carved boxwood horse's head | D1 key |
| 10-c2 | 10-2 | back | scorecard: "black to move" | D1 lock |
| 10-c3 | 10-3 | back | "212 steps, unaided" | D2 |
| 10-c4 | 10-1 | back | base felted in dark green | flavour |
| 10-c5 | 10-3 | front | certificate signed in violet ink | flavour |
| 10-c6 | 10-4 | back | "for the long walk home" | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Pastime | owner's pastime is chess | pair | rules out Ambrose Quill (model trains) |
| D2 | Look | owner's look is not walking stick | rule-out | rules out Rosalind Kettle (walking stick) |

Reveal: A boxwood knight matching a postal scorecard, and a tower climb done unaided: Tobias Thimble, who plays by post and stitches by lamplight.

Ledger fragment "Wet Wool and Thread": Wet gloves and scarves are hung to dry along the counter, and nobody remembers whose.

### Case 11 - The Lamp That Wasn't Lit

- Slug: `lamp-that-wasnt-lit`; chapter 3; found at: The counter's lost-property drawer; delivered to: Kettle's Hardware.
- Owner: Rosalind Kettle (townsfolk-11). Candidates: Rosalind Kettle, Hettie Bloom, Cosmo Vane.
- Difficulty 5, par 8 minutes. Ledger fragment: "Lamps Along the Road".

| Object | Name | Art slot |
|---|---|---|
| 11-1 | Brass house number 8 | evidence-11-1 |
| 11-2 | Lamplighter's round sheet | evidence-11-2 |
| 11-3 | Hobby-shop refund slip | evidence-11-3 |
| 11-4 | Chipped teacup | evidence-11-4 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 11-c1 | 11-1 | front | brass house number 8, black with soot | D1 key |
| 11-c2 | 11-2 | back | round sheet: "no. 8 Lamplight" | D1 lock |
| 11-c3 | 11-3 | back | refunded: "train set, not for me" | D2 |
| 11-c4 | 11-1 | back | screw holes, bent | flavour |
| 11-c5 | 11-4 | front | chipped rim, blue willow pattern | flavour |
| 11-c6 | 11-4 | back | a tea leaf stuck to the base | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Street | owner's street is Lamplight Street | pair | rules out Hettie Bloom (Mill Lane) |
| D2 | Pastime | owner's pastime is not model trains | rule-out | rules out Cosmo Vane (model trains) |

Reveal: The soot-black number matches the lamplighter's round, and the refund slip rules out railways: Rosalind Kettle, who sells every lamp on her street.

Ledger fragment "Lamps Along the Road": Every lamp on the lane is lit so the last neighbours can find their way to the office.

### Case 12 - The Piano Tuner's Key

- Slug: `piano-tuners-key`; chapter 3; found at: Pinned inside Mr. Hobb's coat; delivered to: Quill's Piano Rooms.
- Owner: Ambrose Quill (townsfolk-12). Candidates: Ambrose Quill, Odalie Fenn, Priya Lowell.
- Difficulty 5, par 8 minutes. Ledger fragment: "A Key for the Next Clerk".

| Object | Name | Art slot |
|---|---|---|
| 12-1 | Let-down trousers | evidence-12-1 |
| 12-2 | Tailor's ticket | evidence-12-2 |
| 12-3 | Ferry timetable | evidence-12-3 |
| 12-4 | Handwritten note | evidence-12-4 |
| 12-5 | Brass desk key | evidence-12-5 |

| Clue | Object | Face | Tag | Role |
|---|---|---|---|---|
| 12-c1 | 12-1 | front | hem let down by four inches | D1 key |
| 12-c2 | 12-2 | back | ticket: inside leg 36 | D1 lock |
| 12-c3 | 12-3 | front | timetable circled at Quay Steps | D2 key |
| 12-c4 | 12-4 | back | "last door before the steps" | D2 lock |
| 12-c5 | 12-3 | back | coffee ring over Sunday | flavour |
| 12-c6 | 12-5 | front | key stamped KPO Counter 1 | flavour |
| 12-c7 | 12-5 | back | tag: "for the next clerk" | flavour |
| 12-c8 | 12-4 | front | note in a careful, looping hand | flavour |

| Deduction | Facet | Rule | Kind | Effect |
|---|---|---|---|---|
| D1 | Look | owner's look is tall | pair | rules out Odalie Fenn (red hair) |
| D2 | Street | owner's street is Quay Road | pair | rules out Priya Lowell (Orchard Close) |

Reveal: A hem let down for a tall man and a note about the last door before Quay Steps: Ambrose Quill, who tuned the post office piano and kept Hobb's key safe.

Ledger fragment "A Key for the Next Clerk": Hobb retires at dawn and leaves the counter key, the ledger and the whole backlog to whoever comes next.

## Ledger fragments (lore titles)

The meta-story: the water-stained ledger of Mr. Hobb, found one fragment per closed case, in order. The Ledger screen lists them; unread ones show as folded corners.

| # | Title | Unlocked by | Text |
|---|---|---|---|
| 1 | Water at the Door | case 01 | 4 March 1974, 11 pm: the river comes over the sill and Mr. Hobb counts the sacks twice. |
| 2 | Hobb's Lantern | case 02 | Hobb keeps one lantern lit on the counter so anyone on the road can see the office is open. |
| 3 | Sacks on the Sorting Table | case 03 | Parcels are stacked on the table above the waterline, labels already running. |
| 4 | Ink Runs Faster Than Water | case 04 | By midnight half the addresses are blue streaks. Hobb copies what he can read into the ledger. |
| 5 | The Wrong Pigeonhole | case 05 | Sorting by touch in the dark, Hobb drops a handful into the wrong pigeonholes and writes down which. |
| 6 | Cinders and Candle | case 06 | The stove stays lit all night and singes the corner of the ledger page. |
| 7 | Seven Knocks at Midnight | case 07 | Neighbours knock seven times and form a chain to carry sacks up the stairs. |
| 8 | The Upstairs Shelf | case 08 | The dead-letter shelf is built that night from a door off its hinges. |
| 9 | The Telegram That Wasn't | case 09 | A signal holds the mail train outside town so the sacks can be saved before it arrives. |
| 10 | Wet Wool and Thread | case 10 | Wet gloves and scarves are hung to dry along the counter, and nobody remembers whose. |
| 11 | Lamps Along the Road | case 11 | Every lamp on the lane is lit so the last neighbours can find their way to the office. |
| 12 | A Key for the Next Clerk | case 12 | Hobb retires at dawn and leaves the counter key, the ledger and the whole backlog to whoever comes next. |

## Achievements (12, no postage reward)

| Id | Title | Condition |
|---|---|---|
| first-delivery | First Delivery | Close case 01 |
| clean-sheet | Clean Sheet | Close any case with 3 stamps |
| unaided | Unaided | Close any case with 3 stamps and no hint |
| sharp-eyes | Sharp Eyes | Find every clue in a case before accusing (every clue face inspected) |
| chapter-1 | Spring Cleaning | Close all four cases of chapter 1 |
| chapter-2 | Dry at Last | Close all four cases of chapter 2 |
| chapter-3 | The Last Sack | Close all four cases of chapter 3 |
| stamp-collector | Stamp Collector | Hold 12 stamps in total |
| postmasters-pride | Postmaster's Pride | Hold all 36 stamps |
| daily-habit | Daily Habit | Reach a Daily Parcel streak of 3 |
| week-at-the-desk | A Week at the Desk | Reach a Daily Parcel streak of 7 |
| second-look | Second Look | Replay a closed case and raise its best stamps |

## Desk themes (5, cosmetic, unlocked by total stamps)

| # | Id | Name | Stamps needed | Desk | Ink |
|---|---|---|---|---|---|
| 1 | mustard-riso | Mustard Riso | 0 | cream paper, mustard blotter | ink |
| 2 | teal-blotter | Teal Blotter | 6 | cream paper, teal blotter | ink |
| 3 | brick-ledger | Brick Ledger | 14 | cream paper, brick blotter | ink |
| 4 | midnight-sorting-room | Midnight Sorting Room | 24 | night desk, mustard lamp light | cream |
| 5 | gold-rubber-stamp | Gold Rubber Stamp | 33 | night desk, gold stamps | cream |

## Mechanic cards (4)

| # | Id | Title | Shown on case | Text |
|---|---|---|---|---|
| 1 | look-closer | Look closer | 01 | Tap an object to pick it up. Turn it over to read the back, and use the magnifier to find small details. |
| 2 | the-board | The deduction board | 01 | Pin a clue, then link it to the person it fits. Link at least two clues to someone before you accuse them. A wrong accusation costs a stamp. |
| 3 | key-and-lock | Key and lock | 05 | Some clues only work as a pair: one object is the key and another is the lock. Pin both and link them together. |
| 4 | rule-outs | Rule-outs | 06 | A clue can tell you who it is not. Link it as a rule-out to the person it excludes. |

## Tutorial (case 01, 6 steps, each advanced by the real action)

| Step | Prompt | Advances when |
|---|---|---|
| 1 | Tap the parcel to open it. | The parcel is opened |
| 2 | Tap the knitted scarf to pick it up. | Object 01-2 is opened |
| 3 | Switch on the magnifier and tap the glowing spot. | Clue 01-c1 is found |
| 4 | Pin the clue to your board. | A clue is pinned |
| 5 | Link the clue to the person it fits. | A clue is linked as fits |
| 6 | Link one more clue, then accuse. | A first accusation is made |

## How-to-play pages (6)

1. The job. 2. The evidence table. 3. The deduction board. 4. Stamps and postage. 5. Pairs and rule-outs. 6. Daily Parcel. Prices and stamp numbers are read from the core constants, never typed twice.

## Result headlines

| Stamps | Headline |
|---|---|
| 3 | Delivered with a flourish |
| 2 | Delivered, after a second look |
| 1 | Delivered, eventually |

There is no failing a case: the last candidate standing is always the owner, and the case closes with at least 1 stamp. A wrong accusation shows the line "Return to sender".

## Daily Parcel (generated mini-case, template bank)

A Daily Parcel is a generated case with 3 to 5 objects drawn from the 12 townsfolk, using the same logic model (3 candidates, 2 necessary deductions). Objects use code-drawn pictograms keyed by facet value, not the 49 campaign art slots. Direct deductions only (no key-and-lock pairs) so a daily stays under three minutes.

| Day | Objects | Deductions | Flavour clues |
|---|---|---|---|
| Mon | 3 | D+D | 1 |
| Tue | 3 | D+D | 1 |
| Wed | 4 | D+D | 2 |
| Thu | 4 | D+R | 2 |
| Fri | 4 | D+R | 2 |
| Sat | 5 | D+R | 3 |
| Sun | 5 | R+R | 3 |

Generation (task 03): seed `dailySeed("lost-parcel-desk", dateKey)`; pick the owner, two logic facets and the two decoys so the structure holds (each deduction is the only one that rules out one decoy); fill objects from the bank below; fill flavour from the neutral pool. Every one of 365 dates must pass the shipped validator.

| Facet | Value | Object A | Tag A | Object B | Tag B | Rule-out note |
|---|---|---|---|---|---|---|
| Street | Quay Road | Rope-tied string | river-mud grit on the knot | Ferry-ticket sleeve | rope fibre in the seam | "never on the river side" |
| Street | Mill Lane | Paper sack | grain husks in the corner | Sacking square | millstone dust in the weave | "nowhere near the mill" |
| Street | Tanner's Row | Scented wrapper | tannery smell in the paper | Hide-string bundle | leather dust on the knot | "far from the tannery" |
| Street | Lamplight Street | Blackened glove | lamp soot on the fingers | Oil-stained rag | oil stains on the cloth | "no lamp outside my door" |
| Street | Orchard Close | Petal-pressed card | apple blossom in the fold | Windfall wrapper | apple stain on the paper | "no trees where I live" |
| Street | Station Hill | Gritty box | coal cinders in the creases | Smutty scarf | engine smuts on the cuff | "never lived by the line" |
| Pastime | angling | Tackle tin | fish hook in the lining | Weight pouch | split lead weights in a twist | "refused the angling club badge" |
| Pastime | choir | Hymn sheet | pencilled tenor line | Fork case | tuning fork stamped middle C | "left the choir, never went back" |
| Pastime | crosswords | Newspaper cutting | pencilled crossword, one clue left | Rubbed-out grid | clue numbers in the margin | "crosswords give me a headache" |
| Pastime | model trains | Signal lamp | tiny signal lamp | Track-pin packet | OO-gauge track pins | "train set refunded, not for me" |
| Pastime | birdwatching | Field notebook | tick marks beside bird names | Lens-cap tag | lens cap engraved 8x42 | "binoculars are for burglars" |
| Pastime | chess | Carved bishop | boxwood bishop | Scorecard | "white to move" in pencil | "I never saw the point of chess" |
| Look | red hair | Wool jumper | copper hair strands | Hairbrush | copper hairs in the bristles | "dark-haired in every photograph" |
| Look | spectacles | Lens cloth | thumbprints on the cloth | Spare arm | spectacle arm with a bent hinge | "eye test: no glasses needed" |
| Look | left-handed | Slanting note | ink smeared along the left edge | Left-hand scissors | scissors marked for the left hand | "always writes with the right" |
| Look | hearing aid | Battery card | size-13 battery card | Foam dome | foam dome that fits an ear | "clinic card: hearing normal" |
| Look | tall | Let-down coat | hem let down by four inches | Door-frame note | pencil mark at six feet four | "trousers taken up two inches" |
| Look | walking stick | Rubber ferrule | worn rubber tip | Chemist's slip | replacement ferrule on the slip | "tower climb, unaided" |
| Pet | cat | Cushion cover | tabby hairs in the weave | Scratched card | scratch marks on the corner | "cannot abide cats" |
| Pet | dog | Chewed lead | tooth marks on the strap | Biscuit packet | paw print on the packet | "no dogs in my house" |
| Pet | canary | Seed twist | birdseed in the fold | Cuttlebone | yellow feather in the bone | "cannot stand birdsong" |
| Pet | none | Spotless wrapper | no hair or crumb anywhere | Fresh-folded paper | not a mark on it | "pet-sitter's receipt" |
| Pet | tortoise | Lettuce paper | lettuce nibbles on the edge | Heat-lamp slip | bulb receipt for a shell-warmer | "tortoises are too slow for me" |
| Pet | goldfish | Fish-food tin | flakes in the lid | Little net | green net with a fishy smell | "dislikes fish" |

Neutral flavour pool (12, none uses an almanac keyword): a gift tag with a smudged name; string tied in a double knot; a faded 1960s stamp; yellowed sticky tape; a coffee ring on the wrapper; an ink blot on the label; a pencilled sum; a creased corner; a single mother-of-pearl button; a postage-paid sticker; a folded bus timetable; a tea-stained corner.
