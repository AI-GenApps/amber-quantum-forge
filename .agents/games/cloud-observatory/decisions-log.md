# Cloud Observatory — decisions log

All entries are dated 2026-10-23, the planning day (epic 21 task 00). Owner decisions are final and
are not reopened; design decisions may be revised through a new dated entry (never by editing the
old one).

## Owner decisions (final)

### 2026-10-23 — Full v1, not a prototype
Build the game as a full v1: complete loop, full v1 content, progression, local save, reviewed art,
custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android/iOS projects. No store
submission. *Rationale: the owner wants a finished product to judge in the browser.*

### 2026-10-23 — Wave 1 after a shared kit
Cloud Observatory ships in wave 1 with Lantern Loops and Floodplain Dispatch, after the kit
(epic 18) merged. *Rationale: shared framework first so game branches only add game code.*

### 2026-10-23 — No monetization in v1
Soft currency and unlocks only: no ads, no IAP, no accounts, no network calls. The economy leaves
room for IAP later. *Rationale: owner scope; privacy-clean store answers.*

### 2026-10-23 — Browser-only QA by the owner, at the end
Agents do no visual QA: no browsers, Playwright, screenshots, devices, emulators, APK builds or JDK
installs. Verification is headless (Vitest with happy-dom, `tsc`, `vite build`, Biome). Every
task file in epic 21 is written so it can be accepted without a browser; the owner QA checklist
(task 08) carries everything visual.

### 2026-10-23 — Stack
TypeScript + Vite + Preact + Vitest (happy-dom), Capacitor 8 for Android/iOS project files,
DOM/SVG/Canvas 2D rendering, no game engines or extra libraries. Two packages
(`@web-games/cloud-observatory`, `@web-games/cloud-observatory-core`) plus the kit.

### 2026-10-23 — Portrait, offline-first, versioned local save
Capacitor Preferences on device, localStorage on web, versioned with migrations. Daily mode seeded
from the local date, generated on device, no server.

### 2026-10-23 — Art from the MobileGamesDesigner thread under strict review; OFL fonts; CC0 audio
No AI slop is integrated. Fonts from Google Fonts (OFL). Audio only from Kenney or sources that
state CC0.

### 2026-10-23 — Working title is the public name in v1
"Cloud Observatory". Naming research is a later step.

### 2026-10-23 — Own branch, worktree and PR
Branch `feat/web-cloud-observatory`; the orchestrator opens, reviews and merges the PR.

### 2026-10-23 — Game spec as given
Pitch, core loop, content volume (12 constellations, 8 instruments, 24 upgrades, 10 boons, 30 lore
entries, 20 achievements), doubles only with a formatter to 1e300, fonts Cormorant Garamond +
Manrope, art style and art batches are fixed by the workflow spec and recorded here without change.
The balance simulator must prove: first constellation under 3 minutes, first Eclipse 2.5 to 4 h
active play, no dead zone over 6 minutes between meaningful purchases.

## Design decisions

### 2026-10-23 — Constellations and boons persist through the Eclipse; instruments and upgrades do not
*Why:* the atlas is the story record and the +5% each is the long-term identity of the game; if it
reset, lore could not be tied to charting. Instruments and upgrades are the cycle. The sketch
simulation shows the second cycle at about 80% of the first with only the first two boons and about 40%
with 39 shards of boons, which is a satisfying curve rather than a trivialising one.

### 2026-10-23 — Eclipse shard formula `floor(sqrt(cycleStarlight / 1e9))`, available at 5
*Why:* square-root prestige keeps early Eclipses meaningful without making late waiting dominant;
the 1e9 divisor and the 5-shard threshold place the first Eclipse near 2.9 hours of active play in
the sketch simulation (target 2.5 to 4 h). Task 02's simulator is the authority and may retune
the divisor within the target.

### 2026-10-23 — Instrument curves from the Cookie-Clicker family, tuned in a sketch
Eight tiers with base cost ×7 and output ×6.2 per tier (rounded to friendly numbers) and growth
1.12 to 1.135. A first sketch with growth 1.14 to 1.17 left tiers 7 and 8 unreachable in 8 hours,
so growth was lowered and tier ratios tightened. See the evidence README.

### 2026-10-23 — Three upgrades per instrument at 10/25/50 owned, ×2/×2/×3
*Why:* exactly 24 upgrades from 8 × 3, clear thresholds the player can see on the row, and a
fully upgraded instrument at ×12 keeps every tier relevant. Telescope upgrades also multiply
Gather so the tap does not become useless.

### 2026-10-23 — Charting pays on completion and cannot fail
No timer, no lives, no penalty beyond the lost "flawless" mark. *Why:* the game is calm and
accessible; the only skill is attention. Mistakes feed the Steady Hand achievement so skill still
has a trophy. Paying on completion makes abandoning free and avoids refund bugs.

### 2026-10-23 — Constellation bonus is global +5% each (not per-instrument)
*Why:* one number the player can read ("+60% from the atlas") instead of twelve special cases;
Atlas Ink (×1.5) is then a simple, large upgrade to it.

### 2026-10-23 — Achievements give +1% each, no currency
*Why:* a small permanent reward without a loop that can feed itself; part of the additive group so
it stays predictable in the simulator.

### 2026-10-23 — Offline efficiency 50% / 75% / 100% with an 8 hour cap
*Why:* the spec fixes the 8 hour cap; 50% base keeps active play worth more while Night Watch and
Long Vigil give the two boons real value for a returning player. Computed from the production at
the last save, deterministic, no purchases offline.

### 2026-10-23 — Daily mode is the Wandering Comet, not a second ruleset
A single seeded 6-star tracing for a starlight burst (900 s of production, min 1000) with a streak
bonus up to +40% and a shard on every 7th day. *Why:* reuses the chart engine and the sky map, needs
no extra content, and gives a reason to open the game daily without punishing a missed day.

### 2026-10-23 — Story: a keeper inherits a rooftop observatory; the sky "forgets" what is unwatched
*Why:* a quiet, original frame that justifies resets (the Eclipse is the sky resting) and the
incremental mechanics (watching is how stars are held). Lore ties to events the player causes
(first instrument, charting, boons) so every entry feels earned. 30 = 8 instruments + 12
constellations + 10 boons, arranged in six chapters of five.

### 2026-10-23 — Core content strings may not use "window" or "document"
The skeleton's purity test forbids those tokens anywhere in core `src`. Lore is written around
them. (Rule recorded so later editors do not fight the architecture test.)

### 2026-10-23 — Star hit area 24 px radius, minimum spacing 140 map units
*Why:* a 48 px target at the narrowest supported width (320 px) on a 1000-unit-wide map is about
150 units; 140 plus the 24 px radius keeps neighbouring targets from overlapping while allowing a
10-star owl.

### 2026-10-23 — Task numbering: 8 code/art tasks after the planning task
01 core rules, 02 content and validators, 03 progression and save, 04 screens and UI, 05 audio,
haptics and onboarding, 06 art integration, 07 Capacitor packaging, 08 release readiness. The
balance simulator lives in task 02 (it needs both the rules and the tables); the final pacing
numbers are copied into economy.md there.

### 2026-10-23 — Audio container left to task 05
iOS WKWebView and Android WebView do not decode every container. Default to MP3 and verify the
converter available on the build machine; record in assets-index.md.

### 2026-10-23 — Core rule clarifications fixed by task 01 (no number changed)
Where the economy text left a corner open, the headless engine settled it as follows. The task 02
balance simulator runs against exactly these rules.
- Gather uses the upgrades of the first catalog instrument (the Telescope). The Brass Polish boon is
  an instrument boon and does not multiply Gather, matching `gatherValue = globalMult *
  telescopeUpgradeMult`.
- Clear Glass (cost ×0.95) applies to instrument unit costs and charting costs, not upgrade costs.
  Second Sight (×0.75) applies to upgrade costs only.
- Offline progress feeds `starlight`, `cycleStarlight` and `lifetimeStarlight` but not `cycleSeconds`
  or `taps`; `cycleSeconds` counts active play only. A non-finite elapsed time (NaN, Infinity) counts
  as 0, like a negative one.
- Starting starlight from Dark-Adapted Eyes is a gift, not earnings: it does not feed
  `cycleStarlight` or `lifetimeStarlight`. Start-owned instruments are likewise free.
- The Eclipse resets `owned`, so an instrument is hidden again until its predecessor is bought once
  in the new cycle; Apprentice's Bench starts the Lens Array unlocked because it grants Telescopes.
- Upgrades have no tier ordering: tier 3 can be bought at 50 owned without tier 1.
- A chart session records mistakes; `flawless` travels on the `charted` event (and the completion
  result), not in the game state. Task 03 turns it into the Steady Hand achievement and statistics.
- Offline efficiency is the best of the base 50% and the owned `offline-efficiency` boons, capped at
  100%.
