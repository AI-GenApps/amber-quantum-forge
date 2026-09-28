# Sixty-Second Heist — rename candidates: strict uniqueness check

Date: 2026-09-25. Agent: Sonnet, parallel lane (task 16 of epic
`16-games-portfolio-wave2`). Research only — no code, registry, or
display-name change (that happens after task 17/18-equivalent pickup for
this game in a later epic).

## Why a rename is needed

- "60 Second Heist" is an existing 4ThePlayer/Yggdrasil casino slot
  (gambling association, trademark risk).
- "Sixty Second Heist" is an itch.io jam game.
- Concept: a turn-based heist **route planner** — plot moves, grab loot,
  reach the exit, avoid guards (Hitman GO / Lara Croft GO lineage). The
  60-second timer is only an optional mode, so the new name must not
  promise time pressure. Avoid casino/slot words and existing IP words
  ("GO", "Bob").

## Method (same strict-check procedure as task 14)

For every candidate:
1. Google Play search page — plain `q=<name>&c=apps` and quoted `"<name>"`,
   plus a general `site:play.google.com "<name>"` sweep via the web check.
   Titles extracted from the page's `aria-label="Play <title>"` markup via
   `curl -sL -A "Mozilla/5.0" "https://play.google.com/store/search?q=<name>&c=apps"`.
2. App Store — `curl -sL -A "Mozilla/5.0" "https://itunes.apple.com/search?term=<name>&entity=software&limit=50"`,
   every `trackName` scanned for an exact or close match, plus a
   `site:apps.apple.com "<name>"` style web sweep.
3. Web — `"<name>" game`, `"<name>" app`, itch.io, Steam, APK mirrors,
   browser-game sites (WebSearch tool).
4. Trademark glance — folded into the web sweep (no separate USPTO/WIPO
   tool available); any obvious registered wordmark hit is called out
   below. **Formal trademark clearance is still recommended before
   launch**, per the brand-name skill reference.

Fuzzy/near matches (close spelling, synonyms, or the same concept under a
different word order) in games count as a conflict (EXISTS) or, if the
match is weaker/ambiguous, UNSURE. Only names with **zero** conflict
signal across all four checks are marked NOT FOUND.

## All 22 candidates checked

| # | Name | Verdict | Evidence | Notes |
|---|---|---|---|---|
| 1 | Loot Route | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Loot+Route&c=apps) · [iTunes](https://itunes.apple.com/search?term=Loot+Route&entity=software&limit=50) · [ARC Raiders loot-route guide](https://arcraidermap.com/guides/best-loot-routes) · [Steam "ROUTE"](https://store.steampowered.com/app/4892120) | "Loot route" appears only as a generic phrase (an ARC Raiders farming guide), never as a game title. Encodes both core verbs (grab loot, plan a route). |
| 2 | Grid Heist | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Grid+Heist&c=apps) · [iTunes](https://itunes.apple.com/search?term=Grid+Heist&entity=software&limit=50) · [itch.io heist tag](https://itch.io/games/tag-heist) · [Perfect Heist (itch.io)](https://yeswecamp.itch.io/pixel-heist) | Closest iTunes hit is "CaperGrid Heist Puzzle" (different compound word), not an exact/close match. |
| 3 | Vault Runner | EXISTS | [Play "Vault Runner: Neon Rush"](https://play.google.com/store/apps/details?id=com.wnnrfvr.vaultrunner) · [iTunes exact "Vault Runner"](https://itunes.apple.com/search?term=Vault+Runner&entity=software&limit=50) · [itch.io "Vault Runrer"](https://not-a-a.itch.io/vault-runer) · [kanogames.com Vault Runner](http://www.kanogames.com/play/game/vault-runner) | Exact-title conflict on Play, App Store, itch.io, and two browser-game sites. |
| 4 | Shadow Vault | EXISTS | [iTunes exact "Shadow Vault"](https://itunes.apple.com/search?term=Shadow+Vault&entity=software&limit=50) | Exact `trackName` match on the App Store. |
| 5 | Blueprint Heist | EXISTS | [GitHub "heist-blueprint"](https://github.com/abhidashdev/heist-blueprint) · ["The 'Blueprint' Heist" — Open Heart Games](https://www.openheartgames.com/blog/the-blueprint-heist) · [Play](https://play.google.com/store/search?q=Blueprint+Heist&c=apps) | Near-identical concept AND name already exists as a published project: draw the plan, crew follows it, guards patrol, grab loot. |
| 6 | Quiet Heist | UNSURE | [Play "The Silent Heist"](https://play.google.com/store/apps/details?id=com.silentgames.the_silent_heist&hl=en_NZ) · [itch.io "Silent Heist"](https://sakeen.itch.io/silent-heist) · [iTunes](https://itunes.apple.com/search?term=Quiet+Heist&entity=software&limit=50) | No exact "Quiet Heist" hit, but "Silent Heist" (a direct synonym, same stealth-heist genre) is a published Play app, an itch.io game, and a browser game. High conflict risk under a different word. |
| 7 | Night Vault | EXISTS | [iTunes "NightVault Party"](https://itunes.apple.com/search?term=Night+Vault&entity=software&limit=50) · [Warhammer Underworlds: Nightvault (BoardGameGeek)](https://boardgamegeek.com/boardgame/261594/warhammer-underworlds-nightvault) | Close-spelling app match plus a well-known published board game "Nightvault". |
| 8 | Vault Tactics | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Vault+Tactics&c=apps) · [iTunes](https://itunes.apple.com/search?term=Vault+Tactics&entity=software&limit=50) · [Fallout Tactics (Wikipedia)](https://en.wikipedia.org/wiki/Fallout_Tactics:_Brotherhood_of_Steel) · [The Vaults (Steam)](https://store.steampowered.com/app/1444780/The_Vaults/) | Only thematic overlap (Fallout's "Vault" + "Tactics" separately); no title match. |
| 9 | Tactical Heist | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Tactical+Heist&c=apps) · [iTunes](https://itunes.apple.com/search?term=Tactical+Heist&entity=software&limit=50) · [Heisters devlog (itch.io)](https://cjoyner150.itch.io/hog-heist/devlog/970059/were-now-on-steam) · [itch.io Heist+Procedural tag](https://itch.io/games/tag-heist/tag-procedural) | "Heisters" is marketed as "a modern tactical heist game" (descriptor, not title) — no exact/close title match. |
| 10 | Loot Planner | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Loot+Planner&c=apps) · [iTunes](https://itunes.apple.com/search?term=Loot+Planner&entity=software&limit=50) · [Loot Tracker (Play)](https://play.google.com/store/apps/details?id=com.FRMZGames.LootTracker) · [Loot - Savings Goal & Tracker](https://apps.appfollow.io/ios/loot-savings-goal-tracker/1489821186?country=us) | Nearby "Loot Tracker" / "Loot - Savings..." apps are finance trackers, not an exact/close-name match. |
| 11 | Vault Break | UNSURE | [Vaultbreakers (Steam)](https://store.steampowered.com/app/306910/Vaultbreakers/) · [Play](https://play.google.com/store/search?q=Vault+Break&c=apps) · [iTunes](https://itunes.apple.com/search?term=Vault+Break&entity=software&limit=50) | "Vaultbreakers" (one word) is a close compound-word match on Steam; genre-adjacent (extraction RPG). |
| 12 | Copycat Heist | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Copycat+Heist&c=apps) · [iTunes](https://itunes.apple.com/search?term=Copycat+Heist&entity=software&limit=50) · [CopyCats - Over and Out (itch.io)](https://franciscomurias.itch.io/copycats/purchase) · [itch.io free Heist tag](https://itch.io/games/free/tag-heist) | "CopyCats" (no "Heist") is a different, unrelated title. |
| 13 | Heist Plotter | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Heist+Plotter&c=apps) · [iTunes](https://itunes.apple.com/search?term=Heist+Plotter&entity=software&limit=50) · [HEIST (Steam)](https://store.steampowered.com/app/420330/HEIST/) · [15 Best Heist Games (Gamerant)](https://gamerant.com/best-games-pulling-off-heists/) | No exact/close match anywhere; directly encodes "plan the heist" without any promised time limit. |
| 14 | Sneak Route | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Sneak+Route&c=apps) · [iTunes](https://itunes.apple.com/search?term=Sneak+Route&entity=software&limit=50) · [22 Best Stealth Games (GameSpot)](https://www.gamespot.com/gallery/best-stealth-games/2900-7268/) · [Sneak & Seek (Play)](https://play.google.com/store/apps/details?id=com.zatg.sneak.seek.mysteries&hl=en_US) | No exact/close match; nearby "Sneak & Seek" is a different full title. |
| 15 | Guard Dodge | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Guard+Dodge&c=apps) · [iTunes](https://itunes.apple.com/search?term=Guard+Dodge&entity=software&limit=50) · [List of dodgeball variations (Wikipedia)](https://en.wikipedia.org/wiki/List_of_dodgeball_variations) · [Dodge Game (Play)](https://play.google.com/store/apps/details?id=com.SvetlexCompanyDodgeGame&hl=en_US) | No exact/close match anywhere. |
| 16 | Vault Sketch | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Vault+Sketch&c=apps) · [iTunes](https://itunes.apple.com/search?term=Vault+Sketch&entity=software&limit=50) · [VAULT (itch.io)](https://keveatscheese.itch.io/vaultsteam) · [itch.io vault tag](https://itch.io/games/tag-vault) | No exact/close match; "sketch" nicely evokes drawing the route/plan. |
| 17 | Grid Thief | UNSURE | [Gridy Thief (itch.io jam)](https://itch.io/jam/wtfxigdc/rate/2845634) · [Play](https://play.google.com/store/search?q=Grid+Thief&c=apps) · [iTunes](https://itunes.apple.com/search?term=Grid+Thief&entity=software&limit=50) | "Gridy Thief" (game-jam entry) is a close spelling variant. |
| 18 | Thief's Route | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Thief%27s+Route&c=apps) · [iTunes](https://itunes.apple.com/search?term=Thief%27s+Route&entity=software&limit=50) · [itch.io thief tag](https://itch.io/games/tag-thief) · [Games like THIEF (itch.io)](https://itch.io/games-like/535321/thief) | No exact/close match anywhere. |
| 19 | Loot Ledger | EXISTS | [Loot Ledger — Survive Your Spending (web game)](https://loot-ledger-game.vercel.app/) · [Loot & Ledger (Steam, 2026)](https://store.steampowered.com/app/3927780/Loot__Ledger/) | Exact-title web game plus an extremely close ("Loot & Ledger") Steam game released in 2026. |
| 20 | Vault Logic | UNSURE | [The Vault: Logic Puzzle Box (Steam)](https://store.steampowered.com/app/3645380/The_Vault_Logic_Puzzle_Box/) · [Vault 88 (itch.io)](https://shadowxdgamer.itch.io/vault-88) | "The Vault: Logic Puzzle Box" combines the same two words in a different order; a real, currently-listed Steam game. |
| 21 | Quiet Steps | EXISTS | [Quiet Steps (itch.io, exact title)](https://shiv4lyf.itch.io/quiet-steps) · [Quiet_Steps itch.io page](https://quiet-steps.itch.io/) | Exact-title stealth game already published on itch.io. |
| 22 | Route the Vault | **NOT FOUND** | [Play](https://play.google.com/store/search?q=Route+the+Vault&c=apps) · [iTunes](https://itunes.apple.com/search?term=Route+the+Vault&entity=software&limit=50) · [Vault! (Play, Nitrome)](https://play.google.com/store/apps/details?id=com.nitrome.vault&hl=en_US) · [Sherlocked's The Vault (App Store)](https://apps.apple.com/us/app/sherlockeds-the-vault/id1071729604) | No exact/close match; nearby "Vault" apps are unrelated pole-vaulting/escape-room apps. |

**Tally:** 12 NOT FOUND, 5 EXISTS, 5 UNSURE, out of 22 checked (exceeds the
≥20-checked, ≥5-NOT-FOUND bar).

## Shortlist (ranked, NOT FOUND only)

All six passed Play, App Store, and web/itch.io/Steam checks with zero
conflict signal. None promise a time limit, none use casino/slot words,
none reuse "GO" or "Bob".

1. **Heist Plotter** — names the core loop directly: you plot the heist
   before you commit to it. Zero hits anywhere (Play, App Store, Steam,
   itch.io, general web).
   Evidence: [Play](https://play.google.com/store/search?q=Heist+Plotter&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Heist+Plotter&entity=software&limit=50) ·
   [HEIST (Steam, different title)](https://store.steampowered.com/app/420330/HEIST/) ·
   [15 Best Heist Games (Gamerant, no match)](https://gamerant.com/best-games-pulling-off-heists/)

2. **Vault Sketch** — evokes drawing/plotting a route on a vault floor
   plan; short, two syllables each word, reads well as an icon wordmark.
   Evidence: [Play](https://play.google.com/store/search?q=Vault+Sketch&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Vault+Sketch&entity=software&limit=50) ·
   [VAULT (itch.io, different title)](https://keveatscheese.itch.io/vaultsteam) ·
   [itch.io vault tag (no match)](https://itch.io/games/tag-vault)

3. **Loot Route** — encodes both verbs of the loop (grab loot, plan a
   route) in two plain words; "loot route" only shows up as a generic
   phrase in an unrelated extraction-shooter guide.
   Evidence: [Play](https://play.google.com/store/search?q=Loot+Route&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Loot+Route&entity=software&limit=50) ·
   [ARC Raiders loot-route guide (generic phrase, not a title)](https://arcraidermap.com/guides/best-loot-routes) ·
   [Steam "ROUTE" (different, unrelated game)](https://store.steampowered.com/app/4892120)

4. **Grid Heist** — names the board (a grid) and the genre (heist)
   without any casino word; closest hit is a different compound word.
   Evidence: [Play](https://play.google.com/store/search?q=Grid+Heist&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Grid+Heist&entity=software&limit=50) ·
   [itch.io heist tag (no match)](https://itch.io/games/tag-heist) ·
   [Perfect Heist (itch.io, different title)](https://yeswecamp.itch.io/pixel-heist)

5. **Guard Dodge** — plain, verb-first, describes the core obstacle
   (avoid guards) without implying a timer.
   Evidence: [Play](https://play.google.com/store/search?q=Guard+Dodge&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Guard+Dodge&entity=software&limit=50) ·
   [List of dodgeball variations (Wikipedia, no match)](https://en.wikipedia.org/wiki/List_of_dodgeball_variations) ·
   [Dodge Game (Play, different title)](https://play.google.com/store/apps/details?id=com.SvetlexCompanyDodgeGame&hl=en_US)

6. **Sneak Route** — stealth + route-planning in two words; nearby
   "Sneak & Seek" is a distinct full title, not a conflict.
   Evidence: [Play](https://play.google.com/store/search?q=Sneak+Route&c=apps) ·
   [iTunes](https://itunes.apple.com/search?term=Sneak+Route&entity=software&limit=50) ·
   [22 Best Stealth Games (GameSpot, no match)](https://www.gamespot.com/gallery/best-stealth-games/2900-7268/) ·
   [Sneak & Seek (Play, different title)](https://play.google.com/store/apps/details?id=com.zatg.sneak.seek.mysteries&hl=en_US)

## Names rejected or held back (not shortlisted)

- **EXISTS** (hard conflict, do not use): Vault Runner, Shadow Vault,
  Blueprint Heist, Night Vault, Loot Ledger, Quiet Steps.
- **UNSURE** (synonym/close-spelling risk, held back in favor of the six
  clean NOT FOUND names above): Quiet Heist (≈"Silent Heist"), Vault Break
  (≈"Vaultbreakers"), Grid Thief (≈"Gridy Thief"), Vault Logic (≈"The
  Vault: Logic Puzzle Box").
- **NOT FOUND but not shortlisted** (clean, kept as backups): Vault
  Tactics, Tactical Heist, Loot Planner, Copycat Heist, Thief's Route,
  Route the Vault.

## Trademark note

No obvious registered-wordmark hits surfaced in the web sweep above for
any shortlisted name in the software/games class. This is a glance, not a
clearance search — run a formal USPTO/WIPO/India-TMR trademark clearance
on the user's chosen name before launch, per
`.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`.
