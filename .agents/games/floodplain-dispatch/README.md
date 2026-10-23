# Floodplain Dispatch

Compact strategy puzzles: place pumps, canals and barriers to supply a riverside town with water
before the flood season, without drowning anyone.

- Status: planned (epic 20 task 00 done). Built as a full v1 web game with the shared kit.
- Epic: [`tasks/epics/20-web-floodplain-dispatch`](../../../tasks/epics/20-web-floodplain-dispatch/STATUS.md)
- Code: `apps-games/floodplain-dispatch` (`@web-games/floodplain-dispatch`) and
  `apps-games/floodplain-dispatch-core` (`@web-games/floodplain-dispatch-core`).
- Shared kit: [`.agents/games/web-games-kit/`](../web-games-kit/README.md)

## Quick facts

| Fact | Value |
|---|---|
| Slug / epic | `floodplain-dispatch` / 20 |
| Working title (public name in v1) | Floodplain Dispatch |
| App id | `app.w3dev.floodplaindispatch` |
| Platforms | Android and iOS (Capacitor 8), plus browser; portrait only |
| Stack | TypeScript, Preact, Vite, Vitest, DOM/SVG/Canvas 2D, Capacitor 8 |
| Genre | Top-down water-routing puzzle with a deterministic simulation |
| Campaign | 4 regions x 10 maps = 40 maps, 120 stars |
| Map size | 8 x 12 up to 12 x 16; 20 to 30 weeks (4 steps each) |
| Pieces | canal 1, barrier 1, sluice gate 2, pump 3, reservoir 4 |
| Houses / fields in campaign | 193 / 133 |
| Mechanics by region | Valley surges, Delta sluice timing, Highland reservoirs and droughts, Estuary tides |
| Stars | 1 supply, 2 zero flooded houses, 3 spend within par |
| Region unlocks | Delta 12, Highland 33, Estuary 60 stars |
| Daily | generated per local date, weekday difficulty ladder, streak, 3-star solution proven |
| Currency | coins (1250 from the campaign), spent on hints (25 / 40) and streak freezes (30) |
| Themes | 7 cosmetic map themes unlocked by stars (0 to 120) |
| Fonts | Bricolage Grotesque (display), Atkinson Hyperlegible (body), OFL |
| Audio | CC0 only (Kenney packs or pages stating CC0) |
| Art | 20 designer slots (B1 4, B2 11, B3 5) plus code-drawn terrain and water |
| Budgets | JS bundle <= 300 KB gzip excluding art; art <= 8 MB |
| Monetization | none in v1 |
| Data collected | none |

## Files in this knowledge base

| File | Contents |
|---|---|
| `product.md` | Precise loop, simulation rules, screens, controls, onboarding, accessibility |
| `economy.md` | Currencies, sources, sinks, numbers |
| `content-plan.md` | All 40 maps, pieces, scenery, themes, mechanic cards, chapter texts |
| `store-listing.md` | Draft store answers, data safety |
| `assets-index.md` | Art slots, fonts, audio plan, where things live |
| `decisions-log.md` | Dated decisions and rationale |
| `open-questions.md` | Open items |
