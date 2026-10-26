# Dress Rehearsal

Fashion puzzles: assemble a look on a styled flat-lay board that satisfies a client's creative brief, then share it.

- Status: v1 complete, pending owner QA. Epic 23 tasks 00 to 08 are done and verified headlessly (Vitest with
  happy-dom, `tsc`, `vite build`, Biome); no browser, device or emulator was used. The owner runs the browser
  checklist in `.agents/resources/2026-10-23/web-games/dress-rehearsal/qa-checklist.md` at the end. No store submission in v1.
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
| Audio | CC0 only: 24 sounds and 2 music loops, 26 Ogg files, 1,000,013 bytes (`assets-index.md`) |
| Art | 63 designer slots: 48 closet pieces, 6 client portraits, 6 backdrops, key art, icon, feature graphic; 60 accepted (58 runtime WebP, 754,078 bytes), 3 keep their code-drawn placeholder (`key-art`, `item-rainy-city-5`, `item-studio-3`); every slot has a code-drawn fallback |
| Budgets | JS bundle <= 300 KB gzip excluding art; art <= 8 MB; fonts <= 300 KB; audio <= 2 MB. Shipped: JS 73,399 B gzip, art 754,078 B, fonts 120,408 B, audio 1,000,013 B (enforced by `test/budgets.test.ts`) |
| Monetization | none in v1 |
| Data collected | none |

## Files in this knowledge base

| File | Contents |
|---|---|
| `product.md` | Precise loop, rules, scoring, screens, controls, onboarding, accessibility, palette |
| `economy.md` | Currencies, sources, sinks, numbers |
| `content-plan.md` | All chapters, 40 challenges, 48 pieces, 6 clients and their lines, rule cards, tutorial |
| `store-listing.md` | Final draft store answers, data safety (no submission in v1) |
| `assets-index.md` | Art slots (63) with provenance, fonts, audio with licences, budgets and shipped sizes, where things live |
| `decisions-log.md` | Dated decisions and rationale |
| `open-questions.md` | Open items with owners, kit follow-ups, per-task notes |
