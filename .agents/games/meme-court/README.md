# Meme Court — game knowledge base

Single source of truth for what Meme Court **is** and the answers we need for store
listings, reviews, support, and future work. Keep it current: every product decision,
number, or listing answer that changes must be updated here in the same commit.
Evidence (screenshots, research, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, modes, exact rules, content, platforms, identity, tech |
| [`economy.md`](economy.md) | Monetization status (TBD — parked) |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy, content rating, data safety, privacy, ads & IAP declarations |
| [`assets-index.md`](assets-index.md) | Where every logo, art set, screenshot, reference, and research file is |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale (why we chose X) |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Name | **Meme Court** (internal registry id `meme_court`) |
| Package / bundle | `app.w3dev.memecourt` (production), `app.w3dev.memecourt.debug` (debug) — registry: `docs-internal/gaming/app-source-registry.md` |
| Code | `apps-native/games/meme_court` (Flutter + Flame), rules `apps-native/games/packages/court_rules` |
| Epic | `tasks/epics/16-games-portfolio-wave2/` (this epic, task 04 fonts only) |
| Platforms | Android first (Google Play); iOS later |
| Genre | Private-group caption battles: friends vote, a "verdict" is reached |
| Monetization | TBD — parked, no economy work has started; see `economy.md` |
| Fonts | Bangers (display) / Lexend (body) — OFL, task 04 |
| Primary competitor reference | **Quiplash** and **Evil Apples** — see `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| Status (2026-09-25) | **Parked.** Fonts only, this epic. A hot-seat demo with fake players (Alice/Bea), one hard-coded round; needs a live service, moderation staffing, and a solution to "no memes" (no real meme imagery ships) before any further work is worthwhile — portfolio audit recommendation: park |
