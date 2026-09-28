# Games portfolio audit — 2026-09-25

Audit-only pass of the five non-Ludo games in `apps-native/games/` against Ludo
Vortex's progress (epic `tasks/epics/15-ludo-launch`). No game source was
changed. Ludo was not touched (another session owns it).

## How the evidence was produced

- **Device captures (2026-09-17)**: `docs-internal/gaming/evidence/visual/*-final-*.png`,
  physical SM-A525F. Still current for Pocket Biome, Heist, Meme Court and
  SnapQuest (no source commits since). Merge Relay has changed since then
  (epic 14 task 06), so it was re-rendered.
- **Headless renders (this audit)**: `renders/*.png`, 1080×2400 @3x, produced
  by `flutter test` on Linux with Flutter 3.47.3 installed at
  `/data/tools/flutter` (`PUB_CACHE=/data/tools/pub-cache`). The harness
  (`harness/*.dart.txt`) was copied into each app's `test/` only for the run
  and then deleted. Material Roboto fonts were loaded. **Artifact:** Merge
  Relay tile numbers render as white squares because the Flame board's text
  is not font-loaded in tests; the device capture shows numbers correctly.
- **Health checks**: `flutter analyze` and `flutter test` for each app, and
  `dart test` for each rules package. All pass (below).
- **Name checks**: web searches on 2026-09-25 (quick checks only, not the
  strict Phase 7 uniqueness check).
- **No physical device** is attached to this server, so nothing was verified on a device in this audit.

| File | Shows |
|---|---|
| `renders/merge_relay-01-home.png` | Current Merge Relay home (new since 09-17 capture) |
| `renders/merge_relay-02-tutorial.png` | First-play tutorial ("First handoff") |
| `renders/merge_relay-03-play.png` | Rescue board "Signal in" (tile digits = harness artifact) |
| `renders/merge_relay-04-result.png` | Result screen "Path cleared" |
| `renders/pocket_biome-0{1,2}-*.png` | Habitat before/after planting |
| `renders/sixty_second_heist-01-home.png` | Mission 1 planner |
| `renders/meme_court-0{1,2}-*.png` | Caption pick and frozen docket |
| `renders/snapquest-0{1,2}-*.png` | Peeklings desk hunt and first catch |

## Benchmark: what Ludo Vortex has that the others don't

| | Ludo Vortex | Merge Relay | Pocket Biome | 60s Heist | Meme Court | Peeklings |
|---|---|---|---|---|---|---|
| Client LOC / test files | 9.3k / 43 | 10.8k / 27 | 1.1k / 1 | 1.1k / 1 | 1.3k / 1 | 1.9k / 3 |
| Tests (all pass) | — (not run; Ludo off-limits) | 120 + 32 rules | 8 + 5 | 8 + 10 | 5 + 8 | 19 + 3 |
| Raster art / logo / wordmark | yes (lobby art, logo, stacked/wide wordmarks) | no | no | no | no | no |
| Audio | 7 SFX + music | Sound toggle, **no audio files** | none | none | none | none |
| Custom fonts | Lilita One + Nunito | Roboto default | Roboto | Roboto | Roboto | Roboto |
| Launcher icon | illustrated, glossy | flat vector | flat vector | flat vector (reads as a stock chart) | flat vector (unclear) | flat vector |
| Competitor reference study | Ludo King, 48 captures | none | none | none | none | none |
| Content vs v0.3 target | full board + modes | 5 rescue boards (+ generator) | 6 / 30 species | **1 / 80 levels** | **1 fixture prompt** (UI hard-codes 1 round) | 2 / 30 creatures |
| Onboarding / settings | yes / yes | tutorial / settings | no / no | no / no | no / no | no / no |
| Crash reporting / privacy policy | per epic | none / none | none / none | none / none | none / none | none / none |
| Tracking | epic 15 w/ device QA | epic 14 (backend-heavy, many `[~]`) | handoff ledger only | handoff only | handoff only | handoff only |

## Per-game verdict

### Merge Relay — 2048-style merge + async "relay" handoff to a friend
- **State:** most engineered game after Ludo (tutorial, rescue/daily/endless,
  save/restore, PGS bridge, typed gateway, a full Hono service with
  PostgreSQL tests). But the user **rejected the preview**, and the
  release audit lists 8 P1 + 4 P2 backend blockers.
- **Graphics:** clean, but plain Material. Flat blue squares on navy, a
  mostly empty home screen, no tile personality, no juice (no merge bursts,
  sound, or haptics feel), no art assets. It looks like a utility app, not a game.
- **Concept:** solo play is 2048, a crowded genre with free clones everywhere.
  The actual differentiator (a friend continues your board for ≤3 moves)
  needs two players, deep links and a backend, and players won't see it on
  first launch. Rescue boards (goal in N moves) are a good hook and work
  offline.
- **Name:** "Merge Relay" is free on the stores but describes mechanics, not
  a feeling. "Relay" means nothing until you've used the social feature.
  Weak on a store shelf.
- **Readiness:** far from launch. Not blocked on code quality; blocked on
  visuals, audio and brand, and on a backend scope that is larger than a
  v1 needs.

### Pocket Biome — cozy terrarium: plant, grow over real time, breed, collect
- **State:** foundation slice. A 6-pot grid, one plantable species
  (Mossling), 6 of ~30 species defined, no decoration, visits, gifting,
  reminders or economy.
- **Graphics:** pots are pale cards with a dot-and-ellipse sprout. In this
  genre (Viridi, Terrarium: Garden Idle, Pocket Frogs) **the art is the
  product**, and there is none yet.
- **Concept:** sound and has a proven audience. Cozy, low-pressure,
  collection plus breeding, and time gates fit ads and cosmetics
  naturally. Risk: 30 species × growth stages is a large art budget.
- **Name:** clear and inoffensive, but "biome" is a science-class word and
  "Pocket ___" is a crowded pattern. A quick check found no exact match, but
  it's low on charm. Rename candidate.
- **Readiness:** early prototype.

### Sixty-Second Heist — turn-based route planner: plot moves, grab loot, reach exit, avoid guards
- **State:** a single mission. 1 of ~80 levels, small obstacle and tool
  fixtures, no editor, campaign, daily or economy.
- **Graphics:** a navy grid with lines and a diamond, plus arrow buttons.
  Reads as a debug view. No characters, vault or guards drawn as art.
- **Concept:** sound (Hitman GO / Lara Croft GO lineage), but **content
  heavy**. 80 hand-reviewed levels plus a solver is the real cost. The
  "sixty-second" timer is only an optional mode, so the name promises
  something the core loop doesn't deliver.
- **Name:** **Conflict.** "60 Second Heist" is an existing 4ThePlayer /
  Yggdrasil casino slot (gambling association, trademark risk), and
  "Sixty Second Heist" is also an itch.io jam game. Must rename.
- **Readiness:** early prototype.

### Meme Court — private-group caption battles, friends vote, a "verdict"
- **State:** a hot-seat demo with fake players Alice and Bea. One
  hard-coded round, and the prompt JSON holds one fixture prompt. No
  membership, invites, web voting, moderation, reporting or sharing.
- **Graphics:** bold, friendly cards. The most "designed" of the five, but
  still stock widgets. **There are no memes:** the prompt says "a friend
  posts a photo" and no photo is shown.
- **Concept:** a party game needs real friends online at once (the
  cold-start problem). UGC needs a human moderation owner (the handoff
  itself keeps free text disabled until one exists). Meme imagery raises
  copyright questions, and the concept forbids generated images. This is
  the highest ops and policy burden with the weakest solo experience.
- **Name:** catchy and memorable, and no exact store match. But "meme"
  dates fast, and the product has no memes in it.
- **Readiness:** furthest from launch in practice (needs a live service plus
  staffing). Recommend parking.

### SnapQuest → public title "Peeklings" — spot a color (desk tap or camera), meet a creature, fill an album
- **State:** 2 of ~30 creatures, 2 descriptors. The camera captures a frame
  but **recognition doesn't work** (`descriptorId=null` on device), so
  desk mode is the only real loop.
- **Graphics:** friendly palette and a simple blob creature; closest to
  "kid-appealing" of the five, but it's icon glyphs, not illustrated
  creatures.
- **Concept:** charming, but the audience skews young. Families policy,
  COPPA and a camera together are a heavy compliance mix. Without working
  recognition, the core loop is a "tap the red button" toy.
- **Name:** "SnapQuest" is **taken many times** (App Store photo
  scavenger-hunt apps, a Play Store earning app, a Steam game), so don't
  use it publicly. **"Peeklings"** had no exact match and is the best name
  in the portfolio. Keep it.
- **Readiness:** early prototype; blocked on an unproven tech bet (on-device
  color/object recognition).

## Why none is launch-ready (the Ludo lessons)

1. **No art/audio pipeline yet.** Ludo only started to look like a game
   after the brand, logo, lobby art, fonts and SFX rounds (phases 7–8). All
   five are still flat vector Material UIs with default Roboto.
2. **No competitor study.** Ludo's quality bar came from 48 Ludo King
   captures. None of the five has a reference game or captures.
3. **Scope was set in PRD v0.3, not by launch need.** Each handoff asks for
   a full social/backend product (relays, visits, gifting, web voting,
   moderation, editor) before a v1. Ludo shipped local modes first and
   deferred online modes.
4. **Content gaps are large:** 1/80 levels, 1 prompt, 2/30 creatures,
   6/30 species.
5. **Ops basics are missing everywhere:** crash reporting, privacy policy,
   data safety, signing (the AABs use the `NOTFORUPLOAD` test key), and store
   listings.

## Recommendation

| Rank | Game | Why |
|---|---|---|
| 1 | **Merge Relay (renamed)** | Most code already works; genre is Ludo-like (clear rules, known competitors 2048/Threes/2248 for a reference study); content can be generated (rescue-board generator exists). Ship **solo v1** (Rescue + Daily + Endless, local save, cosmetics/rewarded ads) with a full visual/audio/brand overhaul; move friend relays to v1.1 so the P1 backend blockers stop gating launch. |
| 2 | Pocket Biome | Best market fit, but art-heavy. Needs an art-direction dry run first (species sheet) to price it. |
| 3 | Peeklings | Keep the name; park until desk-mode alone is fun or recognition is proven. |
| 4 | Sixty-Second Heist | Needs a rename and 80 levels. Good later candidate if a level-generation/solver approach is chosen. |
| 5 | Meme Court | Park: needs live service, moderation staffing, and a solution to "no memes". |

Open decisions for the user: which game to pick, whether to cut
relays/social from v1, the competitor to benchmark against, and whether to
rename (the Phase 7 strict uniqueness check still has to run on any new
name).
