# Competitor references for the five non-Ludo games — 2026-09-25

Purpose: give every design, art, and verification task a concrete reference game
per title, the way Ludo King anchored Ludo Vortex. Web research only. No
device was attached to this server, so there are no device captures yet. Epic 16
task 01 downloads the public store-listing screenshots listed here into
dated `<competitor>-store-reference/` folders as internal visual anchors.

Download and review counts were read from the public Google Play listing
(`hl=en_US&gl=US`) on 2026-09-25 and are **rounded store buckets**.
Treat descriptions as REPORTED (store copy or press) unless marked
CONFIRMED.

**Rule for all tasks:** use these games for quality bar, pacing, and UX
patterns only. **Never copy or trace their art, characters, names, sounds, or
text.** Everything we ship is original.

## Merge Relay (renamed in epic 16): primary reference **Threes!**

| Game | Store | Scale | Why it matters |
|---|---|---|---|
| **Threes!** (Sirvo) — PRIMARY | [Play (paid)](https://play.google.com/store/apps/details?id=vo.threes.exclaim) · [Play Freeplay](https://play.google.com/store/apps/details?id=vo.threes.free) · [App Store](https://apps.apple.com/us/app/threes/id779157948) · [Wikipedia](https://en.wikipedia.org/wiki/Threes) | 100K+ paid / 500K+ free on Play | The original sliding-merge puzzle, and the chosen visual target: tiles with faces/personality, warm hand-made palette, a real soundtrack, and no IAP in the paid build. Credits: Asher Vollmer (design), Greg Wohlwend (art), Jimmy Hinson (music) (CONFIRMED, Wikipedia). |
| 2048 (Gabriele Cirulli) | [Play](https://play.google.com/store/apps/details?id=com.gabrielecirulli.app2048) | 1M+, 31.9K reviews | The genre baseline everybody knows. Shows what we must beat: flat squares on a grid, which is also our current look. |
| 2048 (Androbaby) | [Play](https://play.google.com/store/apps/details?id=com.androbaby.game2048) | 10M+, 289K reviews | Proof of demand for plain 2048 on Android. |
| X2 Blocks (Inspired Square) | [Play](https://play.google.com/store/apps/details?id=com.inspiredsquare.blocks) | 50M+, 451K reviews | Commercial leader of the number-merge space. Glossy saturated tiles, heavy juice, and aggressive ads. Reference for **game feel** (merge bursts, combo feedback), not for monetization. |
| X2 Puzzle: Number Merge 2048 (Unico Studio) | [Play](https://play.google.com/store/apps/details?id=com.unicostudio.x2number) | 1M+, 41.2K reviews | A level/puzzle framing of merge numbers, closest to our goal-in-N-moves "rescue" boards. |

What to take: Threes-level character and sound; X2-level merge feedback;
level goals like X2 Puzzle. What to avoid: clone-store sameness (flat
squares, stock fonts), and ad-wall UX.

## Pocket Biome: primary references **Pocket Frogs** (breeding) and **Terrarium: Garden Idle** (cozy look)

| Game | Store | Scale | Why it matters |
|---|---|---|---|
| **Terrarium: Garden Idle** (PHX) — visual reference | [Play](https://play.google.com/store/apps/details?id=sk.phx.terrarium&hl=en_US) | 10M+, 453K reviews | The biggest cozy plant-collection game on Play: discover, collect, and grow plants to expand a garden. Target for art density and "one more plant" pacing. |
| **Pocket Frogs** (NimbleBit) — mechanics reference | [Play](https://play.google.com/store/apps/details?id=com.nimblebit.pocketfrogs&hl=en_US) · [Wikipedia](https://en.wikipedia.org/wiki/Pocket_Frogs) | 1M+, 11.5K reviews | Breed and collect trait combinations, with habitats. Closest match to our three-axis breeding. |
| Pocket Plants (Kongregate) | [Play](https://play.google.com/store/apps/details?id=com.kongregate.mobile.pocketplants.google) | 1M+, 41.6K reviews | Merge and evolve species into new ones. Shows how "hundreds of adorable plants" are presented and collected. |
| Viridi (Ice Water Games) | [Play](https://play.google.com/store/apps/details?id=com.IceWaterGames.Viridi&hl=en_US) · [Wikipedia](https://en.wikipedia.org/wiki/Viridi) | 1M+, 21.5K reviews | Real-time succulent growth in a single pot; calm, no objectives, ambient sound. Reference for elapsed-time growth, and for the "no death for absence" tone our PRD requires. |

What to take: collectible species with personality, visible growth stages,
a warm habitat scene. Risk: art volume (≈30 species × growth stages).

## Sixty-Second Heist (needs a rename): primary reference **Hitman GO**

| Game | Store | Scale | Why it matters |
|---|---|---|---|
| **Hitman GO** (Square Enix Montréal) — PRIMARY | [Play](https://play.google.com/store/apps/details?id=com.squareenixmontreal.hitmango&hl=en_US) · [Wikipedia](https://en.wikipedia.org/wiki/Hitman_Go) | 1M+, 101K reviews | Turn-based stealth on a grid, presented as a diorama board game. Closest to our plan-a-route, deterministic guards design. |
| Lara Croft GO | [Play](https://play.google.com/store/apps/details?id=com.squareenixmontreal.lcgo) | 1M+, 104K reviews | Same studio and structure; reference for level pacing and campaign chapters. |
| Robbery Bob – King of Sneak (Chillingo) | [Play](https://play.google.com/store/apps/details?id=com.chillingo.robberybobfree.android.row) | 100M+, 1.75M reviews | Mass-market proof for comedic heist and stealth on mobile. Reference for tone and character. |
| Thief Puzzle: to pass a level (TapNation) | [Play](https://play.google.com/store/apps/details?id=com.weegoon.thiefpuzzle) | 100M+, 789K reviews | Hyper-casual "draw the path to the loot" puzzle. Shows how a very short loop can scale. |

Name conflict (see the portfolio audit): "60 Second Heist" is an existing
4ThePlayer/Yggdrasil casino slot, and "Sixty Second Heist" is an itch.io jam
game.

## Meme Court (parked): references **Quiplash** and **Evil Apples**

| Game | Store | Scale | Why it matters |
|---|---|---|---|
| **Quiplash** (Jackbox Games) | [App Store](https://apps.apple.com/us/app/quiplash/id1002623276) · [site](https://www.jackboxgames.com/games/quiplash) | — (mostly console/PC plus phone controllers) | Prompt → write a funny answer → everyone votes. The core loop Meme Court copies, played same-room. |
| **Evil Apples: Play Dirty** | [Play](https://play.google.com/store/apps/details?id=com.evilapples.app) | 5M+, 156K reviews | An asynchronous mobile card-matching party game; proves a mobile-native, friends-and-strangers version works. |
| What Do You Meme? / Meme Challenge | [Play](https://play.google.com/store/apps/details?id=com.game.whatdoyoumeme&hl=en_US) | — | Meme-image captioning. Shows the meme-rights and moderation exposure Meme Court would carry. |

## Peeklings (parked, keep the name): references **Pikmin Bloom**, **Pokémon Smile**, **ColorCollect**

| Game | Store | Scale | Why it matters |
|---|---|---|---|
| **Pikmin Bloom** (Niantic) | [Play](https://play.google.com/store/apps/details?id=com.nianticlabs.pikmin) | 5M+, 252K reviews | Real-world activity grows cute collectible creatures. The emotional target for "meet a Peekling". |
| **Pokémon Smile** | [Play](https://play.google.com/store/apps/details?id=jp.pokemon.pokemonsmile) | 1M+, 17.8K reviews | A kids' camera game that rewards a real-world action with collectible creatures. Reference for camera UX with children. |
| ColorCollect: Color Hunt Game | [Play](https://play.google.com/store/apps/details?id=dev.colorcollect.color_collect&hl=en) | 500+ | A daily colour scavenger hunt: exactly our mechanic, and still tiny. Evidence that the mechanic alone doesn't pull downloads; the creatures have to carry it. |
| Scavvi: Kids Scavenger Hunt | [Play](https://play.google.com/store/apps/details?id=com.scavvi.app) | 100+ | Themed camera hunts for families; same audience. |

## Gaps and next steps

- No device captures of any competitor exist. When a phone is available, run
  the Phase 2 capture protocol (`.claude/skills/audit-game-and-prepare-for-release/references/02-competitor-study.md`)
  for Threes! first.
- Store screenshots are downloaded by epic 16 task 01 as internal
  references only. They are copyrighted third-party material and must never
  ship in an app, a store listing, or public docs.
