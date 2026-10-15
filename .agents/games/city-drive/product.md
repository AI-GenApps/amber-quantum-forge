# City Drive — product

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

Star thresholds and par times are **TBD (task 10 / task 11)**.

## Numbers owned by later tasks

| Item | Status |
|---|---|
| Car roster and prices | TBD (task 12) |
| Mission payouts (coins per star) | TBD (task 12) |
| Star thresholds that unlock each district | TBD (task 11) |
| Mission count per district | 24 total across 3 districts; split TBD (task 11) |
| Draw-call and triangle budgets | Fixed in `STATUS.md`: at most 100 draw calls (target below 60), at most 150k visible triangles |
| Adaptive hardware scaling range | 1.0 to 2.0 (task 15) |

## Controls

| Input | Controls |
|---|---|
| Touch (phone, landscape) | On-screen steering, throttle/brake, handbrake (task 07) |
| Keyboard (desktop) | WASD or arrow keys, space for handbrake (task 07) |

Final layout and sensitivity are judged by the owner at the human first-drive
checkpoint (task 08).

## Screens (task 13)

Home, city map, garage, mission results, pause, settings, and an in-drive
HUD. All UI is a DOM overlay (HTML/CSS + Preact) above the canvas.

## Audio, haptics, onboarding (task 14)

Audio is CC0 only, with a licence record per source; haptics via the Capacitor
haptics plugin; a short first-drive onboarding.

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
