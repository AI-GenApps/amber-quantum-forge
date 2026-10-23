# The Last Window

A cosy cafe-bookshop at the edge of a harbour town: run short shifts, choose what to stock, decorate, and get to know the regulars whose stories unfold across two weeks.

- Status: in progress (tasks 00 and 01 of epic 22 done: knowledge base and the headless rules engine; task 02 adds the full v1 content data and validators in `apps-games/the-last-window-core/src/content`; task 03 adds progression, economy, Late Shifts and the versioned save in `src/progress` and the app's `src/state`; task 04 adds the 14 screens, 5 sheets, design tokens, the two bundled fonts, the shift runner and code-drawn art for all 54 slots in the app). Tasks 05 to 08 build audio, art, packaging and release readiness.
- Epic: [`tasks/epics/22-web-the-last-window`](../../../tasks/epics/22-web-the-last-window/STATUS.md)
- Code: `apps-games/the-last-window` (`@web-games/the-last-window`) and
  `apps-games/the-last-window-core` (`@web-games/the-last-window-core`).
- Shared kit: [`.agents/games/web-games-kit/`](../web-games-kit/README.md)

## Quick facts

| Fact | Value |
|---|---|
| Slug / epic | `the-last-window` / 22 |
| Working title (public name in v1) | The Last Window |
| App id | `app.w3dev.thelastwindow` |
| Dev server port | 4014 |
| Platforms | Android and iOS (Capacitor 8), plus browser; portrait only |
| Stack | TypeScript, Preact, Vite, Vitest, DOM/SVG/Canvas 2D, Capacitor 8 |
| Genre | Cosy cafe-bookshop shift game with a branching story |
| Setting | Port Merrow harbour town; the shop is the last building on Quay Lane |
| Campaign | 14 days (one shift per day), Day 14 = Lantern Night; 130 customers |
| Shift | 3 to 4 minutes: 180 s (Days 1 to 4), 210 s (5 to 9), 240 s (10 to 14); 10 ticks per second |
| Seats | 3 counter seats; order = drink + optional pastry + optional book mood |
| Content | 6 drinks, 5 pastries, 5 books, 5 moods, 8 decor items, 3 weather variants |
| Story | 8 regulars x 5 scenes = 40 scenes, 12 choices, 16 endings, Journal and Shop Diary (14) |
| Friendship | FP cap 8, thresholds 1, 2, 4, 6, 8 (levels 0 to 5); scene k at level k |
| Currency | coins (start 30); sinks: pastry stock (5 portions per kind, 1 or 2 coins) and decor (8 items, 1,200 total) |
| Endless mode | Late Shifts after Day 14, seeded from the local date, streak and Lamp Bonus |
| Fonts | Young Serif (display), Nunito Sans (body), OFL |
| Audio | CC0 only: 33 sounds and 3 music loops planned (`assets-index.md`) |
| Art | 54 designer slots (B1 4, B2 9, B3 16, B4 25), walk-ins and fallbacks code-drawn |
| Budgets | JS bundle <= 300 KB gzip excluding art; art <= 8 MB; fonts <= 300 KB; audio <= 2 MB |
| Monetization | none in v1 |
| Data collected | none |

## Files in this knowledge base

| File | Contents |
|---|---|
| `product.md` | Precise loop, rules, screens, controls, onboarding, accessibility, palette |
| `economy.md` | Currencies, sources, sinks, numbers, decor table |
| `content-plan.md` | All 14 days, 8 regulars with 5-scene arcs and endings, items, decor, weather |
| `store-listing.md` | Draft store answers, data safety |
| `assets-index.md` | Art slots, fonts, audio plan, where things live |
| `decisions-log.md` | Dated decisions and rationale |
| `open-questions.md` | Open items |
