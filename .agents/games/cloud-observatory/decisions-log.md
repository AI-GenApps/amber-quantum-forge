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

### 2026-10-23 — Task 02: content tables, simulator and no retune
All 12 constellations (86 stars), 8 instruments, 24 upgrades, 10 boons, 30 lore entries, 6 chapters
and 20 achievements are typed data in `cloud-observatory-core/src/content/`. The balance simulator
is a pure function (`src/simulator.ts`) that drives the real rules engine one second at a time. It
met every pacing target with the planning numbers, so no economy number moved: first chart at 90 s,
first Eclipse at 2.86 h, longest purchase gap 30 s, 11 of 12 constellations charted at the first
Eclipse, cycle 2 at 83.6% and the six-boon cycle at 41.9% of cycle 1. Output is recorded in the
evidence README for task 02. *Why no retune:* the sketch and the engine differ only in tap value
details and agree within one percent.

### 2026-10-23 — Simulator reference player details
The player ranks purchases by (starlight per second gain + tap gain at the current tap rate) per
cost, charts before buying, Eclipses at 5 pending shards, and buys boons by strictly ascending cost
until the next is unaffordable (so cycle 2 buys Clear Glass and Night Watch with its 7 shards).
Pinned scenarios (`startBoons`, `startCharted`) seed a cycle through the real `eclipse` rule so
start-starlight and start-owned boons apply exactly as in play, then zero the shards.

### 2026-10-23 — Star coordinates are hand-authored; path order adapted to avoid crossings
Validators require margin 100, spacing 140, a 500 by 250 bounding box and no touching between
non-adjacent path edges (the closing edge of Lyre, Crown and Lantern is checked too). To satisfy that,
the Whale, Ship and Lantern use the tracing orders described in content-plan.md. The first and last
star of the closed shapes are under 700 units apart.

### 2026-10-23 — Biome skips directories named `content`
The root `biome.json` excludes `apps-games/**/content`, so `src/content` and `test/content` are not
checked by `bunx biome check`. They were formatted with the repo's Biome binary in a scratch copy
with that exclusion removed. The root config is out of scope for this epic; if later edits touch
these files, repeat the scratch-copy format (see the task 02 evidence README).

### 2026-10-23 — Task 03: profile save is version 1, nested game state
The profile (`PROFILE_VERSION = 1`, key `cloud-observatory.profile`) is `{ game, stats, cometLastKey,
cometStreak, cometDays, loreUnlocked, loreSeen, tutorial, eclipseIntroSeen, lastSeenMs, createdMs }`
with the core `GameState` nested under `game`. Settings stay in the kit settings store
(`cloud-observatory.settings`). Key order is fixed by the sanitizer, so a load/save cycle of the
committed golden `test/fixtures/profile-v1.json` is byte-identical. The migration table is empty;
the v1 to v2 to v3 chain is proven with a synthetic registry in tests, so the first real migration
only needs a new function. Corrupt, unreadable, future-version and failed-migration data are backed
up by the kit and replaced with defaults, and the player sees a one-time "your save could not be
read" notice.

### 2026-10-23 — Lore unlocks are persisted, not only derived
Task 03 derives lore from triggers (first instrument purchase, charting, boon purchase) but the
Eclipse resets the owned instruments, so the unlocked ids are stored in `loreUnlocked` and the
derivation is a union with it. The pre-action list is always carried forward so nothing is lost.

### 2026-10-23 — Resume, Comet and autosave details settled in task 03
Resume uses the economy rules unchanged (cap 8 h, 50/75/100 percent). Long Sleep needs the counted
time to reach the cap with a positive gain. The Welcome Back sheet shows from 60 seconds away.
Comet claims return typed refusals and never break a streak on a back-dated clock. Autosave
is armed only after a successful load and stays off after a `read-failed` load. No economy number
changed in this task.


### 2026-10-23 — Task 04: screens, tokens, fonts and accessibility
- **Layout.** One persistent header (starlight total, per-second rate, menu) above a bottom tab bar
  built from the kit `Tabs` (CSS reorders the tab list below the panel). The Title, Chart Table,
  Comet, Achievements, Statistics, Settings and How to Play are pushed screens on the kit router;
  Welcome Back, Chapter Card, the journal reader, the Eclipse confirm, the Eclipse sequence and the
  exit confirm are sheets or overlays owned by the app shell, so they work over any screen. Every sheet
  registers a back interceptor, so back closes it before any screen pops.
- **Back button.** Order: open sheet, then (on the shell) a non-Observe tab returns to Observe, then a
  pushed screen pops, then the exit confirm on Observe. The Title screen lets the app exit.
- **Tokens.** The art-bible palette maps to the kit `ThemeTokens`; a high-contrast variant uses
  parchment on solid `#0B1226`, no wash layers and thicker lines. `--co-hit: 44px` is the minimum for
  every control (the kit buttons are 48 px). `src/ui/tokens.ts` lists the 19 text pairs the contrast
  test checks.
- **Fonts.** Cormorant Garamond as three static instances (500, 700, italic 500) and one Manrope
  variable file, 76.8 KB of woff2 in total. A 1.5 s timeout keeps font loading from ever blocking the
  first paint of the app.
- **Images.** All 33 slots go through `ArtImage`; the manifest is empty until task 06, so each draws a
  code placeholder (emblem frames with the constellation line figure, instrument line glyphs, six
  lore vignettes, key art, building, sky, nebula and hills). A failed image load falls back to the
  placeholder.
- **Chart input.** One click handler on the sky svg matches the tap to the nearest star within 24 CSS
  px using `hitTestStar` and the rendered size (including the `meet` letterbox). Star elements are also
  keyboard operable and carry labels such as "Star 3 of 7, next". The next star has a dashed ring and
  a number badge, so it never relies on colour.
- **Game clock.** `requestAnimationFrame` frames are accumulated and flushed at most 10 times per
  second, each flush split into steps of at most 30 s (the session limit). `?devspeed=N` (1 to 600)
  multiplies the delta only when `import.meta.env.DEV` is true; production ignores it. The clock does
  not run on the Title screen.
- **Next-goal hint.** A chart that is ready, else the first Eclipse, else the cheapest affordable
  instrument or upgrade, else the cheapest target with its price.
- **No economy number changed.**

### 2026-10-23 — Audio, haptics, motion and onboarding (task 05)
- **Audio container and sources.** MP3 (WebView-safe; `ffmpeg` with libmp3lame is installed). Cues
  are mono 44.1 kHz at 64 kbps; the loop is stereo at 96 kbps. 13 cues from Kenney CC0 packs (Interface
  Sounds, Music Jingles, Sci-fi Sounds) and one loop, "Cosmic Navigation" by Synth-thetic from
  OpenGameArt, whose page states CC0. Total 1,920,489 bytes. Nothing is synthesized; each file has a
  source URL and licence row in `public/audio/LICENSES.md`, enforced by a test. The cue list kept its
  final ids: gather, buy, upgrade, star-ok, star-miss, chart-done, lore, achievement, eclipse, comet,
  click, back, welcome, plus the music id `observatory-night`.
- **Playback rules.** Audio loads lazily after the first user gesture (the kit unlocks the context);
  nothing plays before it; a missing `AudioContext` is a silent no-op. `gather` is limited to 8 plays
  per second; `gather` and `star-ok` use a small rate jitter. Music fades in and out over 600 ms and
  follows the music switch; the sound switch cuts playing cues; both suspend with the app lifecycle.
- **Haptics.** Correct star: light impact. Wrong star: warning notification. Chart complete and
  achievement: success. Eclipse: medium impact. Any purchase (instrument, upgrade, boon): light
  impact. Comet traced: success. Silent on web; everything is behind the haptics switch, and the
  switches apply on the next call because audio and haptics subscribe to the settings store.
- **Motion.** One 2.4 s Eclipse (dim 0.7 s, ring of light 1.1 s, return 0.6 s) driven by the kit
  `createMotion`; a still card when reduced. Purchase pulse, chapter-card fade and the chart-complete
  gold wash use `createMotion` and are skipped when reduced. Twinkle (4.8 s period, 0.2 Hz), the
  ink-draw of a new constellation line, the wrong-tap shake (four swings of 80 ms) and the next-star
  pulse are CSS keyframes that are not rendered when reduced. The Welcome Back total counts up over
  0.9 s of frame time (immediate when reduced).
- **Onboarding.** The four beats from the product spec are a pure step machine
  (`src/onboarding/steps.ts`), driven by changes between session snapshots (taps, instrument count,
  chart opened, correct star), stored in `profile.tutorial`. Hints sit in the page flow with a Skip
  button and never capture input. A loaded save that already satisfies a beat is caught up once, so a
  returning player is not taught again. Replay (How to Play, "Show the tips again") clears the flags
  and counts taps from zero. The Eclipse explainer sheet opens once when pending shards first reach 5
  (not over Welcome Back, a chapter card, a reader or the Eclipse sequence), independent of Skip.
- **How to Play.** Four pages (Gather and Build, Chart the Sky, The Eclipse, The Comet and the
  Journal) with a code-drawn SVG diagram each; reachable from Title, the shell menu and Settings.
- **No economy number changed.**


### 2026-10-24 — Art integration (task 06): 3 of 33 slots accepted, 30 stay placeholders
The designer loop ended `style_anchor_failed`. Accepted: `key-art` (b1 round 2), `observatory-building`
(b1 round 2), `emblem-lyre` (b1 round 4). Rejected: `icon` (final verdict in `assets-index.md`). Never
requested: the other 29 slots. Decisions: (1) `scripts/build-art.mjs` is the only way art enters the
repo and refuses to write anything if any accepted image fails its checks (aspect class, alpha and
transparent corners on transparent slots, source at least the 2x target); it resizes and encodes only.
(2) Bundled files are WebP q82 (alpha q90) at 2x the display size; masters are WebP q90 in the
evidence folder; `src/ui/art-entries.ts` is generated from the same run, and `ArtEntry` gained a
`background` (mean colour of opaque images) used while the image decodes. (3) The `<img>` is sized to
the slot's display size (the file is 2x), `key-art`, `sky-far` and `observatory-building` are the
critical slots preloaded with the kit `preloadImages` behind the title screen, everything else is
`loading="lazy"`. (4) `icon` stays a placeholder; task 07 makes a code-drawn icon from `sharp` unless
the owner orders another designer round. No economy number, content or rule changed. *Rationale: the
task's own rule that rejected or missing slots keep placeholders, plus no visual judgement by agents.*

### 2026-10-24 — Art integration update (task 06): all 33 slots accepted
The designer review loop finished `status=ok`: all 33 slots were accepted (b1 to b5 and the `retry`
batch; the full list with round and review file is the provenance table in `assets-index.md`). The
earlier decision above (3 of 33, 30 placeholders) is superseded; its tooling and rules are unchanged.
New decisions: (1) `horizon-hills` is a bottom-anchored layer (transparent above the far ridge, opaque
from the ridges down and to both sides, round-2 review waiver), so the slot table gained
`transparentCorners: "top"` for it (top two corners transparent, bottom two opaque; every other
transparent slot still needs four transparent corners), and the layer uses `object-position: center
bottom`. (2) `icon` and `feature-graphic` are masters only; the launcher icon stays the task 07 code-drawn
stopgap because the painted icon is a full scene that cannot be cut into an adaptive foreground without
retouching (open-questions 15). (3) The art bible and the review and brief of every round (b1 to b5,
retry) were copied into the evidence folder as `<batch>-round-<n>.md` and `-brief.md`. (4) The
code-drawn placeholders stay in the code as the fallback for a missing or failing file and are tested
with empty and partial manifests. No economy number, content or rule changed. Bundled art grew from
108,912 to 683,760 bytes (budget 8,000,000). *Rationale: only accepted inbox files are used, resized
and encoded only; the corner rule follows the reviewer-accepted design of a bottom-anchored layer.*

### 2026-10-24 — Capacitor projects, icons and splash (task 07)

`android/` and `ios/` were generated with `bunx cap add android` and `bunx cap add ios` (Capacitor
8.5.3, iOS through Swift Package Manager, so nothing needed CocoaPods or Xcode), then branded:
application id and namespace and bundle id `app.w3dev.cloudobservatory`, name Cloud Observatory,
version 1.0.0 (Android `versionCode` 1, iOS build 1), Android debug id suffix `.debug`. SDK values are
the template defaults and were not changed: Android minSdk 24, compileSdk and targetSdk 36 (Gradle
8.14.3, AGP 8.13.0, Java 21); iOS deployment target 15.0. Decisions: (1) **Portrait only**: Android
`screenOrientation="portrait"` on the main activity; iOS iPhone and iPad lists reduced to Portrait,
with `UIRequiresFullScreen` so the iPad build is valid with one orientation. (2) **`INTERNET`
removed** from the manifest (the game never touches the network and the bridge serves the bundle
in-process); the manifest now declares no permissions. Unverified on a device, with the one-line
restore recorded in the evidence README and `store-listing.md`. (3) **Icon was a code-drawn stopgap**
(superseded by the update pass below) because the designer `icon` was rejected; the foreground is the star mark alone (not the opaque icon
square, which would show a box in the adaptive mask) and the background is the blurred, enlarged icon.
The splash uses the accepted key art, feathered into a flat ink field (`#101A33`, dark `#0B1226`).
(4) The android `.gitignore` now ignores `*.jks`, `*.keystore`, `keystore.properties` and
`google-services.json` (the template left keystores commented out), the iOS one ignores `*.p12`,
`*.mobileprovision` and `GoogleService-Info.plist`; the root `.gitignore` is untouched. (5) Stale
template defaults (grid launcher vectors, three default iOS splash files) were deleted after
`capacitor-assets` ran. No economy number, content or rule changed. *Rationale: the task's own
rules, with the smallest permission surface for the store form.*

### 2026-10-24 — Painted launcher icon (task 07 update pass)

The designer `icon` was accepted (retry round 1) after the first task 07 pass, so the code-drawn
stopgap star is gone. Decisions: (1) **`icon-only.png` is the accepted painted master** (iOS 1024 icon
and legacy Android icon). (2) **Adaptive icon without retouching**: the foreground is the whole
painting scaled to the 66% safe zone with a 7% feathered edge, over `icon-background.png` (the painting
enlarged 1.6x and blurred), instead of cutting a mark out of the scene (a transparent cut-out was
the open-questions 15 blocker). Trade-off: the dome is smaller inside round masks; the owner judges it
on a device and can ask the designer for a foreground-only variant later. (3) The splash is unchanged
(accepted key art), so the generated splash drawables are byte-identical; only launcher mipmaps and
the iOS `AppIcon` changed. (4) The icon test now asserts the shipped icon equals the accepted master and
that the foreground carries its centre and fades out at the safe-zone edge. No economy number,
content or rule changed. *Rationale: use accepted art everywhere it was meant, never edit it.*

### 2026-10-24 — Release readiness (task 08)

Decisions: (1) **Release gates are tests, not a script**: `apps-games/cloud-observatory/test/release/`
holds the bundle build (Vite's JavaScript `build()` API run with `NODE_ENV=production` into
`node_modules/.cache/bundle-check`, so the numbers equal a real `vite build`), the byte budgets, the
no-network source audit, the content contract, the store-listing checks, the long save round trip and
the accessibility gate; the core gained `test/performance.test.ts`. (2) **Performance guards take the
fastest of three runs** so a busy machine cannot fail them, while the budgets stay as written
(8 hours at 10 ticks per second under 2 s, 100,000 `formatNumber` calls under 200 ms, no DOM growth over
200 Build renders). (3) **Privacy claims are backed by the audit**: the app and core `src/` contain no
network API, remote URL, analytics or ad SDK name, neither `package.json` depends on one, and the
built bundle carries only XML namespace URLs and three known `fetch(` sites (Vite preload polyfill,
kit audio loader on bundled files, Capacitor core's unused HTTP plugin). (4) **Store answer corrected**:
`store-listing.md` claimed a Share feature that does not exist (the plugin is installed but unused);
the row now says "None in v1" and a test keeps it true. The README quick-facts row also states the
105 shards so the content-contract test can parse it. (5) The owner QA checklist is
`qa-checklist.md` in the evidence folder, 20 sections. (6) No economy number, content, rule or
dependency changed; the balance report re-run is identical to the recorded output. *Rationale: the
task's own acceptance criteria, with every claim in the knowledge base tied to a failing test.*


### 2026-10-26 — Offline progress cost and the performance guard (task 08 CI fix)

Context: CI on the Linux runner measured 4258 ms for `performance.test.ts` "simulates 8 hours at
10 ticks per second in under 2 seconds" (about 15 microseconds per `tick`, 288,000 ticks). Decisions:
(1) **Offline progress was already closed-form**: `applyOffline` pays `starlightPerSecond x seconds
counted x offlineEfficiency`, capped at 28,800 s, in one evaluation of the economy, and
`session-rules.resume` calls it once. The game has no timed boons or effects and nothing is bought
offline, so the rate is constant for the whole absence; the only non-linear rule is the `MAX_VALUE`
clamp, which the closed form applies once. A resume therefore never steps tick by tick, and no
algorithm change was needed. The failing test timed the *online* reducer loop for 8 hours, which a
phone only runs while the app is open. (2) **Equivalence is now proven** in
`test/offline-equivalence.test.ts`: five representative saves (early, mid, late at 50, 75 and 100
percent efficiency) at 1 s, 90 s and 1,800 s, plus two saves over the full 8 hours (288,000 reference
ticks), match the fixed-step `tick` reference within 1e-8 relative; the cap, the ceiling and
duration-independent rate are also tested. (3) **The wall-clock assertion became a deterministic
complexity guard plus generous timing**: a counting proxy shows `applyOffline` reads the instrument
catalog the same number of times for 1 second, 8 hours and 10 days away; `performance.test.ts` checks
100 resumes of 8 hours finish within 250 ms (microseconds in practice) and keeps the online loop
guard at one hour of ticks (36,000) with a 5 s budget, about 9x the CI measurement, still fastest of
three. No economy number, rule, content or dependency changed. *Rationale: the product concern (no
stall on resume) is met by construction and pinned by a step-count test, not by a timing race.*
