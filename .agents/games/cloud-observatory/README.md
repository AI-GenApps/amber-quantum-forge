# Cloud Observatory — knowledge base

Single source of truth for Cloud Observatory (working title, public name in v1), an incremental
discovery game built as a full v1 web game (epic 21). Keep it current: every decision or number
change is updated here in the same commit. Evidence lives under
`.agents/resources/2026-10-23/web-games/cloud-observatory/`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | The exact v1 loop, rules, screens, controls, onboarding, accessibility |
| [`economy.md`](economy.md) | Every currency, source, sink and number; pacing targets |
| [`content-plan.md`](content-plan.md) | The complete named content list (drives the art briefs) |
| [`store-listing.md`](store-listing.md) | Draft store answers; data safety = no data collected |
| [`assets-index.md`](assets-index.md) | Art slots, fonts, audio, budgets, provenance |
| [`decisions-log.md`](decisions-log.md) | Dated owner and design decisions with rationale |
| [`open-questions.md`](open-questions.md) | Unresolved items and kit follow-ups |

## Quick facts

| | |
|---|---|
| Pitch | An incremental discovery game: build an observatory network, gather starlight, chart constellations and unlock a quiet cosmic story |
| Genre / session | Incremental (idle) with a tap-to-chart puzzle layer; 1 to 5 minute sessions, long arc |
| Platforms | Web first (owner browser QA), then Android and iOS through Capacitor 8; portrait only |
| Stack | TypeScript 5.9.3, Preact 11.0.1, Vite 8.3.4, Vitest 5.0.5 (happy-dom), DOM/SVG/Canvas 2D, no engine |
| Packages | `apps-games/cloud-observatory` (`@web-games/cloud-observatory`), `apps-games/cloud-observatory-core` (`@web-games/cloud-observatory-core`, pure headless), shared `apps-games/web-kit` |
| App id / name | `app.w3dev.cloudobservatory` / Cloud Observatory |
| Currencies | Starlight (soft, per-cycle), Eclipse shards (prestige, permanent). No premium currency in v1 |
| Content volume | 12 constellations (86 stars), 8 instruments, 24 upgrades, 10 Eclipse boons, 30 lore entries in 6 chapters, 20 achievements |
| Prestige | Eclipse: resets starlight, instruments and upgrades; keeps atlas, lore, achievements, shards, boons |
| Offline | Up to 8 hours, 50% efficiency (75% and 100% through boons), deterministic on resume |
| Daily mode | The Wandering Comet: a seeded 6-star pattern per local date, streak rewards |
| Pacing targets | First constellation under 3 min; first Eclipse between 2.5 and 4 h active play; no gap over 6 min between purchases |
| Numbers | Doubles only, formatter to 1e300 |
| Fonts | Cormorant Garamond (display) + Manrope (body), OFL, bundled woff2 |
| Art | 33 image slots from the MobileGamesDesigner thread; 3 accepted and bundled (`key-art`, `observatory-building`, `emblem-lyre`), 30 code-drawn placeholders (see assets-index.md); art budget 8 MB |
| Audio | CC0 only (Kenney packs or pages stating CC0); source and licence recorded per file |
| Budgets | JS bundle at most 300 KB gzip excluding art; woff2 total at most 400 KB; audio at most 2.5 MB |
| Monetization | None in v1 (no ads, no IAP, no accounts, no network). Economy leaves room for IAP later |
| Data | Local save only (Capacitor Preferences on device, localStorage on web); nothing collected |
| Epic | [`tasks/epics/21-web-cloud-observatory`](../../../tasks/epics/21-web-cloud-observatory/STATUS.md) |
| Shared kit | [`.agents/games/web-games-kit/`](../web-games-kit/README.md) |
| Status (2026-10-23) | Task 00 done: knowledge base, design spec and epic task files. Task 01 (headless core rules) in progress. Code tasks 02 to 08 pending |

## Core Lore Constraint For Code

`apps-games/cloud-observatory-core/test/architecture.test.ts` fails when any file under `src/`
contains the tokens `window`, `document`, `Date.now`, `performance.now`, `Math.random` or
`localStorage`, including inside strings and comments. Lore prose and content strings that live in
core must therefore never use the words "window" or "document" (write "pane", "skylight",
"records", "papers" instead).
