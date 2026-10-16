# Street Royale — product

## One-liner

A low-poly 3D city-driving game: free-roam a small city, pick up mission
markers (deliveries, taxi fares, time trials, parking), earn stars and coins,
and unlock new cars. Solo, offline, landscape, no ads, no IAP.

## v1 loop (2026-10-15 decision)

1. **Free roam** in a small city. Mission markers float over the map; the
   player drives to a marker to start a mission.
2. **Four mission types:** delivery, taxi, time trial, parking (rules below).
3. **1 to 3 stars** per mission, based on mission-specific performance.
4. **Three districts** that unlock by **total stars**. Each district holds
   its own set of missions (24 validated missions across the three,
   task 11).
5. **Coins from missions unlock cars** (the coin and car economy lives in
   `economy.md`).
6. **No ads, no IAP, no accounts, no network.** Progress is a local save.
7. **Landscape orientation** on phones. **Touch and keyboard controls.**

## Mission types

| Type | Player does | Star basis (final rules: task 10) |
|---|---|---|
| Delivery | Drive from the pickup marker to the drop-off marker | Time, plus damage taken |
| Taxi | Pick up a passenger, drop them at a destination | Time, plus smoothness of the ride |
| Time trial | Drive a checkpoint route against the clock | Finish time against par times |
| Parking | Park inside a marked bay | Accuracy and time |

Star thresholds and par times are per mission, in `apps-games/city-drive-core/content/missions/` (task 11; the table under "Content (task 11)" lists them).

## Numbers owned by later tasks

| Item | Status |
|---|---|
| Car roster and prices | TBD (task 12) |
| Mission payouts (coins per star) | TBD (task 12) |
| Star thresholds that unlock each district | District 2 at 10 total stars, district 3 at 24 (`content/progression.json`, task 11) |
| Mission count per district | 8 per district, 2 of each type (24 total, task 11) |
| Draw-call and triangle budgets | Fixed in `STATUS.md`: at most 100 draw calls (target below 60), at most 150k visible triangles |
| Adaptive hardware scaling range | 1.0 to 2.0 (task 15) |

## Content (task 11)

Three districts, each its own map loaded one at a time. Names are placeholders until the naming task.

| District | Map | Traffic cars | Unlocks at | Character |
|---|---|---|---|---|
| `district-1` "Old Town" | 12x12 | 8 | open | suburban and small commercial, tight corners |
| `district-2` "Harbor" | 16x14 | 12 | 10 total stars | commercial and plazas, long straights |
| `district-3` "Downtown" | 12x12 | 16 | 24 total stars | dense commercial grid, many junctions |

Every mission of an unlocked district is visible in free roam; there are no per-mission locks. With a
2-star average every district opens (district 1 alone gives 16 stars).

Difficulty is `0.4 x route/time ratio + 0.25 x junctions/12 + 0.2 x traffic/16 + 0.15 x parking
tightness`, each term 0..1 (`missionDifficulty()`, weights in `progression.json`). It never drops within
a district, and each district opens easier than the last one ended. The autopilot (test support) clears
all 24 with 0 damage and at least 1 star with traffic on; 15 have a 3-star time it misses, and no
3-star time is below 85% of the autopilot's.

| id | type | title | difficulty | autopilot (s / stars) | 3 stars by (s) |
|---|---|---|---|---|---|
| d1-m01 | delivery | Parcel Hop | 0.205 | 15.883 / 3 | 17.5 |
| d1-m02 | taxi | Market Morning | 0.241 | 47.05 / 3 | 51 |
| d1-m03 | parking | Kerbside Park | 0.268 | 17.017 / 3 | 18.5 |
| d1-m04 | time trial | Round the Block | 0.283 | 41.95 / 2 | 39 |
| d1-m05 | delivery | Two Stops Before Tea | 0.333 | 61.65 / 2 | 57 |
| d1-m06 | parking | Squeeze at Number Nine | 0.349 | 27.967 / 2 | 26 |
| d1-m07 | taxi | Cautious Cabbie | 0.398 | 49.2 / 2 | 45.5 |
| d1-m08 | time trial | Old Town Sprint | 0.432 | 77.05 / 2 | 71.5 |
| d2-m01 | delivery | Harbour Hello | 0.276 | 17.717 / 3 | 19.5 |
| d2-m02 | taxi | Seagull Shuttle | 0.312 | 21.333 / 3 | 23.5 |
| d2-m03 | time trial | Breakwater Blast | 0.312 | 70.65 / 2 | 65.5 |
| d2-m04 | parking | Between the Crates | 0.348 | 18.833 / 3 | 20.5 |
| d2-m05 | delivery | Fish Market Rush | 0.361 | 62.633 / 2 | 58 |
| d2-m06 | taxi | Captain's Car | 0.363 | 93.167 / 2 | 86.5 |
| d2-m07 | time trial | Container Circuit | 0.428 | 83.8 / 2 | 77.5 |
| d2-m08 | parking | Dock Door Squeeze | 0.474 | 51.633 / 2 | 48 |
| d3-m01 | delivery | Lobby Pick-Up | 0.338 | 14.1 / 3 | 15.5 |
| d3-m02 | taxi | Elevator Music | 0.338 | 14.517 / 3 | 16 |
| d3-m03 | time trial | Rooftop Rush | 0.353 | 34.8 / 2 | 32 |
| d3-m04 | taxi | Penthouse Pickup | 0.376 | 58.417 / 2 | 54 |
| d3-m05 | delivery | Rush Hour Special | 0.382 | 103.783 / 2 | 96.5 |
| d3-m06 | parking | Valet Practice | 0.406 | 20.717 / 3 | 22.5 |
| d3-m07 | time trial | Downtown Derby | 0.439 | 89.217 / 2 | 82.5 |
| d3-m08 | parking | Rush-hour Parallel | 0.468 | 39.2 / 2 | 36 |

Stars come from the time (and, per type, damage, comfort or touches) as in the task 10 rules. All
metrics in the mission files are written by `tool/validate-missions.ts`, never by hand; evidence in
`.agents/resources/2026-10-15/city-drive-qa/11/README.md`.

## Controls

| Input | Controls |
|---|---|
| Touch (phone, landscape) | On-screen steering, throttle/brake, handbrake (task 07) |
| Keyboard (desktop) | WASD or arrow keys, space for handbrake (task 07) |

Final layout and sensitivity are judged by the owner at the human first-drive
checkpoint (task 08).

## Screens and fonts (task 13)

All UI is a DOM overlay (HTML/CSS + Preact) above the canvas, in `apps-games/city-drive/src/ui/`.
Style: dark navy, high contrast, rounded panels, **one accent colour (amber `#ffc21a`)**; the green,
orange and red are only meter and lock states. No Material look, no platform default font, no emoji
(icons are inline SVG). Sizes are `rem` from a root that scales with the screen (`clamp(14px, ..., 22px)`)
and with the user's font setting; landscape 640x360 up to 1920x1080; safe-area insets are kept.

**Fonts** (both OFL, bundled as TrueType under `public/fonts/`, each with its `OFL.txt`; licence records
in `assets-src/LICENSES/fonts-*.txt`, `font-display: block`, preloaded in `index.html`):

| Role | Family | File |
|---|---|---|
| Display (headings, buttons that matter, timer, speed) | Russo One | `russo-one/RussoOne-Regular.ttf` |
| Body | Saira (variable, weight 100-900, width 75-125%) | `saira/Saira.ttf` |

**Screens**

| Screen | What it has |
|---|---|
| Home | Title (one constant, `src/ui/brand.ts`), coin balance and total stars, Play (continue free roam in the last district), Map, Garage, Settings |
| Map | One card per district: lock state with the stars still missing, star progress bar, and the mission list (type icon, stars earned, best time). Drive loads the district; a mission row loads it and opens that mission's briefing at its start |
| Garage | Turntable 3D preview (a second scene on the shared engine, at most 20 draw calls; the city is not drawn while it is open), car carousel, speed / acceleration / grip bars derived from `CarSpec` and scaled across the roster, and one action: Selected / Select / Buy for N / Need N more coins |
| Briefing | Type icon, title, brief, time limit, the three star targets with their coin rewards, Start / Not now |
| HUD | Minimap (2D canvas of the road tiles, redrawn at 10 Hz), speed, pause button; during a mission also the timer (red under 10 s), objective line and a type-specific meter (delivery: damage, taxi: comfort, parking: touches plus the hold bar, time trial: checkpoints), and an arrow at the screen edge when the objective is off-screen |
| Results | Stars pop in one after another, then the coins credited (with "First clear" / "New best stars"), time, best time, Retry / Next mission / Free roam |
| Pause | Resume, Restart mission and Abandon mission (only during a mission), Settings, Quit to home. Hiding the page while driving opens it |
| Settings | Sound and vibration switches (wired to the engine in task 14), control layout (Standard / Mirrored), graphics Auto / Low / Medium / High, Reset progress with a confirmation |

**Graphics quality** (task 15 finalizes the numbers): Low = hardware scaling 1.5, fog 55-130; Medium =
1.25, fog 72-175; High and Auto = 1.0, fog 90-220.

**Navigation**: a screen stack (home, map, garage, settings, play, pause). Back (Escape on the web; the
`BackSource` interface is what task 17 implements with `@capacitor/app`) closes a menu, pauses a drive,
resumes from pause, declines a briefing and leaves the end screens. Briefing and results are not stack
screens: they follow the mission phase.

## Audio, haptics, onboarding (task 14)

Audio is CC0 only, with a licence record per source; haptics via the Capacitor
haptics plugin; a short first-drive onboarding.

Shipped in task 14 (1.17 MB of audio, all MP3):

- **Sounds**: engine (two CC0 loops crossfaded and pitched by speed and throttle), collision thuds
  (light, medium, heavy by impulse), horn (HUD button), checkpoint, pickup, success and fail stings, UI tap,
  one menu and one driving music loop (ducked during missions). No tyre-skid sound ships (no CC0 sample).
- **Web Audio** is unlocked on the first tap or key. Settings, Sound switches everything off.
- **Haptics**: collision medium impact, checkpoint and pickup light, success and fail notifications.
  Settings, Vibration turns them off. Browsers use `navigator.vibrate` where it exists.
- **First drive** (new players only, nothing for a save that already has mission records): a 3-step
  overlay on free roam (hold gas, steer, brake or handbrake, each completed by sustained input), then the
  first mission's briefing opens with a tip about markers, the route ribbon and stars, and its results
  carry a tip about coins and the garage. "Skip tutorial" is always visible; Settings has "Replay
  tutorial".

## Tech

| Area | Choice |
|---|---|
| Rendering | `@babylonjs/core` + `@babylonjs/loaders`, exact-pinned, deep ES6 imports only; WebGL2 baseline (Android WebView has no WebGPU) |
| Physics | Rapier `DynamicRayCastVehicleController`; Babylon only renders, and the simulation never imports Babylon or touches the DOM |
| Step | Fixed 1/60 s, decoupled from `requestAnimationFrame`, deterministic |
| UI | DOM overlay with Preact; no Babylon GUI |
| Assets | Kenney City Kit and Car Kit, CC0, GLB; no Draco; Meshopt/KTX2 only with self-hosted decoders |
| Packaging | Capacitor 8 (Node 22+, minSdk 24, targetSdk 36, iOS 15+); plugins: haptics, preferences, screen-orientation, status-bar, community keep-awake |
| Tests | Vitest everywhere; scene budgets via Babylon `NullEngine` in Node |

## Out of scope for v1

Multiplayer, accounts, leaderboards, ads, IAP, WebGPU, procedural cities,
car customization, daily challenges, login streaks. See `economy.md` for the
deferred commerce ideas.
