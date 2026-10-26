# Dress Rehearsal

Fashion puzzles: assemble a look on a styled flat-lay board that satisfies a client's creative brief, then share it.

- Status: in build (epic 23 tasks 00 to 03 done; task 04 adds all screens, design tokens, fonts and accessibility). Tasks 05 and 06 (audio and art) are done: 60 of 63 art slots are integrated; tasks 07 and 08 add packaging and release readiness.
- Epic: [`tasks/epics/23-web-dress-rehearsal`](../../../tasks/epics/23-web-dress-rehearsal/STATUS.md)
- Code: `apps-games/dress-rehearsal` (`@web-games/dress-rehearsal`) and
  `apps-games/dress-rehearsal-core` (`@web-games/dress-rehearsal-core`).
- Shared kit: [`.agents/games/web-games-kit/`](../web-games-kit/README.md)

## Quick facts

| Fact | Value |
|---|---|
| Slug / epic | `dress-rehearsal` / 23 |
| Working title (public name in v1) | Dress Rehearsal |
| App id | `app.w3dev.dressrehearsal` |
| Dev server port | 4015 |
| Platforms | Android and iOS (Capacitor 8), plus browser; portrait only |
| Stack | TypeScript, Preact, Vite, Vitest, DOM/SVG/Canvas 2D, Capacitor 8 |
| Genre | Fashion styling puzzle with a transparent rule engine |
| Campaign | 6 chapters (themes), 40 challenges (7, 7, 7, 7, 6, 6), 120 stars |
| Board | flat-lay lookbook, 6 to 8 open slots, no body or mannequin |
| Closet | 48 pieces (6 themes x 8), 8 categories, 16 at start, grows with chapters |
| Rules per challenge | 2 to 4 of 16 rule kinds (palette, era, formality, weather, features, budget, must and must-not pieces) |
| Scoring | 1 star presentable, 2 on brief (all rules met), 3 polished (harmony >= 70 of 100) |
| Harmony | colour scheme 40 + neutral anchor 10 + dress code 20 + era match 15 + season sense 15 |
| Chapter unlocks | Riviera Summer 0, Rainy City 0, Gala Night 12, Mountain Weekend 27, Studio Avant-garde 45, Vintage 70s 66 stars |
| Clients | 6 recurring clients, 8 original lines each, affinity levels at 3, 9, 15 stars |
| Daily | Daily Fitting generated per local date, weekday ladder, streak, 3-star look proven by construction and tested over 365 dates |
| Currency | coins (1460 from the campaign), spent on hints (20 / 30), streak freezes (25) and export frames (30 / 40 / 60) |
| Gallery | up to 24 saved boards, local; export as 1080 x 1350 image with 4 frames |
| Fonts | Playfair Display (display), DM Sans (body), OFL |
| Audio | CC0 only: 24 sounds and 2 music loops planned (`assets-index.md`) |
| Art | 63 designer slots: 48 closet pieces, 6 client portraits, 6 backdrops, key art, icon, feature graphic; code-drawn fallbacks for every slot |
| Budgets | JS bundle <= 300 KB gzip excluding art; art <= 8 MB; fonts <= 300 KB; audio <= 2 MB |
| Monetization | none in v1 |
| Data collected | none |

## Files in this knowledge base

| File | Contents |
|---|---|
| `product.md` | Precise loop, rules, scoring, screens, controls, onboarding, accessibility, palette |
| `economy.md` | Currencies, sources, sinks, numbers |
| `content-plan.md` | All chapters, 40 challenges, 48 pieces, 6 clients and their lines, rule cards, tutorial |
| `store-listing.md` | Draft store answers, data safety |
| `assets-index.md` | Art slots (63), fonts, audio plan, where things live |
| `decisions-log.md` | Dated decisions and rationale |
| `open-questions.md` | Open items |
