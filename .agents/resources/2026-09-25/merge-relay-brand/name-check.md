# Merge Relay — rename candidates: strict uniqueness check

Date: 2026-09-27. Agent: Sonnet (task 14 of epic `16-games-portfolio-wave2`).
Research only — no code, registry, or display-name change (that happens at
task 18, after the human picks at task 17).

## What the game is now

A cozy Threes!-style merge puzzle with original character tiles (sleepy to
starry-eyed faces), 60 solver-validated rescue boards across 6 themed
chapters (Harbor, Foundry, Orchard, Bazaar, Glacier, Observatory), plus
Daily and Endless modes. Solo v1 has no relay/friend features, so
"relay"/"handoff" words are avoided. The name must fit a warm, characterful
brand and work as an icon wordmark: short (≤ 2 words, ≤ 14 characters),
easy to say, and it must not already exist as an app or game anywhere per
`.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`.
"Threes", "2048", and "Relay" are avoided as the main word, as are crowded
patterns ("Merge X", "X 2048", "Tile X").

## Method (same strict-check procedure as task 16, Heist names)

For every candidate:
1. Google Play search page — plain `q=<name>&c=apps` and quoted `"<name>"`,
   via `curl -sL -A "Mozilla/5.0" "https://play.google.com/store/search?q=<name>&c=apps"`,
   with titles parsed from the page's `aria-label="Play <title>"` markup.
2. App Store — `curl -sL -A "Mozilla/5.0" "https://itunes.apple.com/search?term=<name>&entity=software&limit=50"`,
   every `trackName` in the JSON response scanned for an exact or close
   match.
3. Web — `"<name>" game`, `"<name>" app` (WebSearch tool), which surfaces
   itch.io, Steam, APK mirrors, and browser-game-site hits alongside a
   general `site:play.google.com`/`site:apps.apple.com` sweep.
4. Trademark glance — folded into the web sweep; any obvious registered
   wordmark hit (e.g. a global consumer brand) is called out below. Formal
   USPTO/WIPO/India-TMR trademark clearance is still recommended on the
   user's final choice before launch.

Fuzzy/near matches (close spelling, a synonym, the same two words in a
different order, or the same brand word attached to a tile/merge game)
count as a conflict (EXISTS) or, if the match is weaker/ambiguous, UNSURE.
Only names with **zero** conflict signal across all four checks are marked
NOT FOUND. Every Play/App Store/web URL below was actually queried; none
are fabricated.

## All 30 candidates checked

| # | Name | Verdict | Evidence | Notes |
|---|---|---|---|---|
| 1 | Huddle Cove | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Huddle+Cove&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) · [Huddle (Play)](https://play.google.com/store/apps/details?id=com.chromesq.huddle&hl=en_US) | Every "Huddle …" Play query surfaces **"Huddle Tiles"**, a jigsaw/tile mini-game inside the published "Huddle Games" app (iOS + Android). Same brand word, same tile-game genre = hard conflict. |
| 2 | Huddle Harbor | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Harbor&c=apps) · [iTunes](https://itunes.apple.com/search?term=Huddle+Harbor&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 3 | Huddle Trail | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Trail&c=apps) · [iTunes](https://itunes.apple.com/search?term=Huddle+Trail&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 4 | Huddle Bloom | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Bloom&c=apps) · [iTunes](https://itunes.apple.com/search?term=Huddle+Bloom&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 5 | Huddle Glow | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Glow&c=apps) · [iTunes](https://itunes.apple.com/search?term=Huddle+Glow&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 6 | Huddle Nook | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Nook&c=apps) · [iTunes exact "Huddle"](https://itunes.apple.com/search?term=Huddle+Nook&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict, plus a standalone App Store app named exactly "Huddle". |
| 7 | Huddle Voyage | EXISTS | [Play](https://play.google.com/store/search?q=Huddle+Voyage&c=apps) · [iTunes](https://itunes.apple.com/search?term=Huddle+Voyage&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 8 | Nestle Cove | EXISTS | [Play](https://play.google.com/store/search?q=Nestle+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Nestle+Cove&entity=software&limit=50) | No store title match, but "Nestle"/"Nestlé" is a globally registered consumer trademark (food & beverage) — hard trademark-glance fail regardless of app-store search results. |
| 9 | Nestle Trail | EXISTS | [Play](https://play.google.com/store/search?q=Nestle+Trail&c=apps) · [iTunes](https://itunes.apple.com/search?term=Nestle+Trail&entity=software&limit=50) | Same Nestlé trademark conflict as #8. |
| 10 | Snuggle Cove | NOT FOUND | [Play](https://play.google.com/store/search?q=Snuggle+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Snuggle+Cove&entity=software&limit=50) · [Snuggle Truck (Wikipedia, different title)](https://en.wikipedia.org/wiki/Snuggle_Truck) | Play's "Snoggle: Dating & Chat App" is a coincidental prefix match in an unrelated category; no "Snuggle Cove" title anywhere. |
| 11 | Snuggle Trail | NOT FOUND | [Play](https://play.google.com/store/search?q=Snuggle+Trail&c=apps) · [iTunes](https://itunes.apple.com/search?term=Snuggle+Trail&entity=software&limit=50) · [Snuggle Truck on Steam (different title)](https://store.steampowered.com/app/111100/Snuggle_Truck/) | No exact/close match. |
| 12 | Cuddle Cove | NOT FOUND | [Play](https://play.google.com/store/search?q=Cuddle+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Cuddle+Cove&entity=software&limit=50) · [Cuddle Corner (Steam, different title)](https://store.steampowered.com/app/3647690/Cuddle_Corner/) | Nearest hits ("CuddleCat", "Cuddle Corner") are different second words/games. |
| 13 | Cozy Convoy | UNSURE | [Play](https://play.google.com/store/search?q=Cozy+Convoy&c=apps) · [iTunes](https://itunes.apple.com/search?term=Cozy+Convoy&entity=software&limit=50) · [Cozy Caravan (App Store, close construction)](https://apps.apple.com/us/app/cozy-caravan/id6740474743) | No exact "Cozy Convoy" hit, but "Cozy X" is an extremely saturated pattern for this exact genre (Cozy Caravan, Cozy Grove, Cozy Coast: Merge Adventure, Cozy Town all exist) — held back as a crowded-pattern risk. |
| 14 | Cozy Caravan | EXISTS | [Play](https://play.google.com/store/search?q=Cozy+Caravan&c=apps) · [iTunes exact "Cozy Caravan"](https://itunes.apple.com/search?term=Cozy+Caravan&entity=software&limit=50) · [Cozy Caravan (App Store)](https://apps.apple.com/us/app/cozy-caravan/id6740474743) · [Cozy Caravan (Steam)](https://store.steampowered.com/app/2788520/Cozy_Caravan/) | Exact-title published game (5 Lives Studios) on iOS, Steam, and Nintendo Switch. |
| 15 | Cozy Cluster | UNSURE | [Play](https://play.google.com/store/search?q=Cozy+Cluster&c=apps) · [iTunes](https://itunes.apple.com/search?term=Cozy+Cluster&entity=software&limit=50) · [Cozy Coast: Merge Adventure (Play, same genre)](https://play.google.com/store/apps/details?id=com.innogames.cozycoast) · [Sortile Cluster (Play, close on "Cluster")](https://play.google.com/store/apps/details?id=com.puzzle.sortilecluster&hl=en_US) | No exact hit, but same "Cozy X" crowded-pattern risk as #13, and a merge-genre "Cozy Coast" already exists. |
| 16 | Drowsy Drift | NOT FOUND | [Play](https://play.google.com/store/search?q=Drowsy+Drift&c=apps) · [iTunes](https://itunes.apple.com/search?term=Drowsy+Drift&entity=software&limit=50) · [Drifting Games hub (CrazyGames, no match)](https://www.crazygames.com/t/drifting) | "Drift" is heavily used, but only by car-racing/drifting games — a different genre, no close-title conflict. |
| 17 | Dreamers Trail | UNSURE | [Play](https://play.google.com/store/search?q=Dreamers+Trail&c=apps) · [iTunes](https://itunes.apple.com/search?term=Dreamers+Trail&entity=software&limit=50) · [Dreamy Trail (Steam, close root + identical second word)](https://store.steampowered.com/app/2390030) | "Dreamy Trail" is a currently-listed Steam walking sim sharing the same "Dream-" root and the exact word "Trail" — held back on close-spelling risk. |
| 18 | Starlit Huddle | EXISTS | [Play](https://play.google.com/store/search?q=Starlit+Huddle&c=apps) · [iTunes](https://itunes.apple.com/search?term=Starlit+Huddle&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 19 | Starry Huddle | EXISTS | [Play](https://play.google.com/store/search?q=Starry+Huddle&c=apps) · [iTunes](https://itunes.apple.com/search?term=Starry+Huddle&entity=software&limit=50) · [Huddle Games (App Store)](https://apps.apple.com/us/app/huddle-games/id6748022971) | Same "Huddle Tiles" conflict as #1. |
| 20 | Sleepy Convoy | NOT FOUND | [Play](https://play.google.com/store/search?q=Sleepy+Convoy&c=apps) · [iTunes](https://itunes.apple.com/search?term=Sleepy+Convoy&entity=software&limit=50) · [Convoy (Steam, different title)](https://store.steampowered.com/app/318230/Convoy/) | Zero hits on Play; nearest iTunes/web hits ("Sleepyheads!", "Convoy") are different full titles. |
| 21 | Twinkle Cove | NOT FOUND | [Play](https://play.google.com/store/search?q=Twinkle+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Twinkle+Cove&entity=software&limit=50) · [Twinkleby (Steam, different title)](https://store.steampowered.com/app/3362960/Twinkleby/) | "Twinkle" is used elsewhere (Twinkleby, Twinkle Bingo) but never combined with "Cove"; no close match. |
| 22 | Bundle Cove | NOT FOUND | [Play](https://play.google.com/store/search?q=Bundle+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Bundle+Cove&entity=software&limit=50) · [Critter Cove (Steam, different title)](https://store.steampowered.com/app/1631470/Critter_Cove/) | No exact/close match anywhere. |
| 23 | Bundle Rescue | NOT FOUND | [Play](https://play.google.com/store/search?q=Bundle+Rescue&c=apps) · [iTunes](https://itunes.apple.com/search?term=Bundle+Rescue&entity=software&limit=50) · [Rescue Games (App Store, different title)](https://apps.apple.com/us/app/rescue-games/id1620283528) | "Rescue" is a crowded genre word in general, but no title combines it with "Bundle". |
| 24 | Nap Nook | NOT FOUND | [Play](https://play.google.com/store/search?q=Nap+Nook&c=apps) · [iTunes](https://itunes.apple.com/search?term=Nap+Nook&entity=software&limit=50) · [Nook (Steam, different title)](https://store.steampowered.com/app/3046710/Nook/) | No exact/close match. |
| 25 | Doze Cove | NOT FOUND | [Play](https://play.google.com/store/search?q=Doze+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Doze+Cove&entity=software&limit=50) · [Castaway Cove (App Store, different title)](https://apps.apple.com/us/app/-/id1201314107) | No exact/close match. |
| 26 | Lantern Cove | NOT FOUND | [Play](https://play.google.com/store/search?q=Lantern+Cove&c=apps) · [iTunes](https://itunes.apple.com/search?term=Lantern+Cove&entity=software&limit=50) · [Lanterns: The Harvest Festival (Play, different title)](https://play.google.com/store/apps/details?id=com.direwolfdigital.lanterns&hl=en_US) | No exact/close match; "Lantern" alone is used, but never with "Cove". |
| 27 | Lantern Trail | EXISTS | [Play](https://play.google.com/store/search?q=Lantern+Trail&c=apps) · [iTunes trackName "PocketQuest: Lantern Trail"](https://itunes.apple.com/search?term=Lantern+Trail&entity=software&limit=50) | A currently-listed App Store title, "PocketQuest: Lantern Trail", contains the exact two-word phrase. |
| 28 | Glow Rescue | NOT FOUND | [Play](https://play.google.com/store/search?q=Glow+Rescue&c=apps) · [iTunes](https://itunes.apple.com/search?term=Glow+Rescue&entity=software&limit=50) · [Glow - neon puzzle games (App Store, different title)](https://apps.apple.com/us/app/glow-neon-puzzle-games/id597640801) | No exact/close match. |
| 29 | Snug Convoy | NOT FOUND | [Play](https://play.google.com/store/search?q=Snug+Convoy&c=apps) · [iTunes](https://itunes.apple.com/search?term=Snug+Convoy&entity=software&limit=50) · [Snug (Steam, different title)](https://store.steampowered.com/app/4017680/Snug/) | "Snug" and "Convoy" both exist separately as different titles; never combined. |
| 30 | Ember Convoy | NOT FOUND | [Play](https://play.google.com/store/search?q=Ember+Convoy&c=apps) · [iTunes](https://itunes.apple.com/search?term=Ember+Convoy&entity=software&limit=50) · [Emberville (Steam, different title)](https://store.steampowered.com/app/2295170/Emberville/) | No exact/close match; iTunes returned zero results for the exact phrase. |

**Tally:** 14 NOT FOUND, 13 EXISTS, 3 UNSURE, out of 30 checked (exceeds the
≥25-checked, ≥6-NOT-FOUND bar).

## Shortlist (ranked, NOT FOUND only)

All eight passed Play, App Store, and web/itch.io/Steam checks with zero
conflict signal on the exact combination. None use "Threes", "2048", or
"Relay"; none are a generic genre word alone; none follow the crowded
"Merge X"/"X 2048"/"Tile X" pattern.

1. **Glow Rescue** — plain meaning: *merge sleepy tile friends until they
   glow, and rescue them*. Names the character-tile transformation (sleepy
   → starry-eyed = "glow up") and the game's own rescue-board framing in
   one plain, sayable phrase. Zero hits anywhere.
   Evidence: [Play](https://play.google.com/store/search?q=Glow+Rescue&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Glow+Rescue&entity=software&limit=50) ·
   [Glow - neon puzzle games (App Store, different title)](https://apps.apple.com/us/app/glow-neon-puzzle-games/id597640801)

2. **Drowsy Drift** — plain meaning: *sleepy tile friends drift together
   until they merge*. "Drowsy" is the character art's starting state;
   "Drift" is literally the Threes!-style sliding-tile motion — a name
   that describes both the cast and the mechanic.
   Evidence: [Play](https://play.google.com/store/search?q=Drowsy+Drift&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Drowsy+Drift&entity=software&limit=50) ·
   [Drifting Games hub (CrazyGames, no match)](https://www.crazygames.com/t/drifting)

3. **Cuddle Cove** — plain meaning: *a cozy cove where rescued tile
   friends cuddle up*. Warm and huddled-together in tone without colliding
   with the existing "Huddle" games brand; "Cove" anchors it to the
   game's harbor-and-chapter world map.
   Evidence: [Play](https://play.google.com/store/search?q=Cuddle+Cove&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Cuddle+Cove&entity=software&limit=50) ·
   [Cuddle Corner (Steam, different title)](https://store.steampowered.com/app/3647690/Cuddle_Corner/)

4. **Twinkle Cove** — plain meaning: *tiles twinkle to life in a cozy
   cove*. "Twinkle" mirrors the starry-eyed evolved tile art; "Cove" keeps
   the place/journey framing.
   Evidence: [Play](https://play.google.com/store/search?q=Twinkle+Cove&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Twinkle+Cove&entity=software&limit=50) ·
   [Twinkleby (Steam, different title)](https://store.steampowered.com/app/3362960/Twinkleby/)

5. **Snug Convoy** — plain meaning: *a snug little caravan of rescued
   friends traveling together*. Warmth ("snug") paired with the sense of a
   caravan crossing the six chapters (Harbor → Foundry → Orchard → Bazaar
   → Glacier → Observatory).
   Evidence: [Play](https://play.google.com/store/search?q=Snug+Convoy&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Snug+Convoy&entity=software&limit=50) ·
   [Snug (Steam, different title)](https://store.steampowered.com/app/4017680/Snug/)

6. **Bundle Rescue** — plain meaning: *bundle tiles together to rescue
   them*. Plain-spoken; names the mechanic (merge = bundle) and the
   in-game framing (rescue) directly, with zero conflict anywhere.
   Evidence: [Play](https://play.google.com/store/search?q=Bundle+Rescue&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Bundle+Rescue&entity=software&limit=50) ·
   [Rescue Games (App Store, different title)](https://apps.apple.com/us/app/rescue-games/id1620283528)

7. **Lantern Cove** — plain meaning: *a lantern-lit cove that guides
   rescued friends home*. "Lantern" evokes the warm glow motif; "Cove"
   keeps the place/journey framing. Backup pick.
   Evidence: [Play](https://play.google.com/store/search?q=Lantern+Cove&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Lantern+Cove&entity=software&limit=50) ·
   [Lanterns: The Harvest Festival (Play, different title)](https://play.google.com/store/apps/details?id=com.direwolfdigital.lanterns&hl=en_US)

8. **Ember Convoy** — plain meaning: *a warm little caravan crossing
   every chapter*. "Ember" (campfire warmth) plus "Convoy" (traveling
   caravan) evokes cozy travel across the six biomes. Backup pick.
   Evidence: [Play](https://play.google.com/store/search?q=Ember+Convoy&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Ember+Convoy&entity=software&limit=50) ·
   [Emberville (Steam, different title)](https://store.steampowered.com/app/2295170/Emberville/)

## Names rejected or held back (not shortlisted)

- **EXISTS** (hard conflict, do not use): Huddle Cove, Huddle Harbor,
  Huddle Trail, Huddle Bloom, Huddle Glow, Huddle Nook, Huddle Voyage,
  Starlit Huddle, Starry Huddle (all conflict with the published "Huddle
  Games" app's "Huddle Tiles" mini-game — the same brand word attached to
  the same tile-game genre); Nestle Cove, Nestle Trail (Nestlé global
  trademark); Cozy Caravan (exact-title published game, 5 Lives Studios);
  Lantern Trail ("PocketQuest: Lantern Trail" on the App Store).
- **UNSURE** (crowded-pattern or close-spelling risk, held back in favor
  of the eight clean NOT FOUND names above): Cozy Convoy and Cozy Cluster
  (the "Cozy X" pattern is saturated for this exact genre — Cozy Caravan,
  Cozy Grove, Cozy Coast: Merge Adventure, Cozy Town all exist), Dreamers
  Trail (≈ "Dreamy Trail" on Steam, same root + identical second word).
- **NOT FOUND but not shortlisted** (clean, kept as backups): Snuggle
  Cove, Snuggle Trail, Bundle Cove, Nap Nook, Doze Cove, Sleepy Convoy.

## Trademark note

No obvious registered-wordmark hits surfaced in the web sweep above for any
shortlisted name in the software/games class, apart from the already-
excluded "Nestle" candidates. This is a glance, not a clearance search —
run a formal USPTO/WIPO/India-TMR trademark clearance on the user's chosen
name before launch, per
`.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`.
