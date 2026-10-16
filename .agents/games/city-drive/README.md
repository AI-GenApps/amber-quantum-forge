# Street Royale — game knowledge base

Single source of truth for what Street Royale **is** and the answers needed for
store listings, reviews, support, and future work. "Street Royale" is the public
name (picked at task 19, applied at task 20); the epic's working title was "City
Drive" and the internal ids still use it (`tasks/epics/17-city-drive/`).
Keep this folder current: every product decision, number, or listing answer
that changes must be updated here in the same commit. Evidence (research,
budget reports, licence records, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, the v1 loop, mission types, stars, districts, controls, tech |
| [`economy.md`](economy.md) | Monetization (none in v1), coins and car unlocks, deferred v1.1+ ideas |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy draft, content rating, data safety, permissions |
| [`assets-index.md`](assets-index.md) | Where every research note, licence record, art set, and font is (or will be) |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale and source URLs |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Public name | **Street Royale** (was the working title "City Drive"; this folder and the ids below stay `city-drive` / `city_drive`) |
| Registry id | `city_drive` (games registry, `engine: "web"` from task 02) |
| Knowledge-base slug | `city-drive` |
| Planned bundle / package id | `app.w3dev.citydrive` (production); debug suffix decided in task 17 |
| Code paths | `apps-games/city-drive` (Vite + Babylon.js app, Preact UI, Capacitor shell), `apps-games/city-drive-core` (pure-TS fixed-step simulation, no Babylon, no DOM) |
| Epic | `tasks/epics/17-city-drive/` |
| Platforms | Android and iOS via Capacitor 8; the same build also runs in desktop and mobile browsers |
| Genre | 3D low-poly city driving: free roam plus missions (delivery, taxi, time trial, parking), solo, offline |
| Orientation | Landscape |
| Monetization | **None in v1.** No ads, no IAP, no accounts, no network (see `economy.md`) |
| Fonts | Russo One (display) + Saira (body), both OFL, bundled (task 13) |
| Engine | Babylon.js (TypeScript, Vite), WebGL2 baseline. Unity is forbidden. |
| Physics | Rapier (`@dimforge/rapier3d-compat`), `DynamicRayCastVehicleController`, fixed 1/60 s step |
| Art | Kenney City Kit (Roads, Commercial, Suburban) and Car Kit, CC0 GLB only; no Quaternius |
| Save | Local only, versioned with migrations (Capacitor Preferences on device, `localStorage` on web) |
| Status (2026-10-15) | Epic 17 started: task 00 (this knowledge base). No code exists yet. |
