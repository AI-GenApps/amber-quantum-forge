# Ludo Vortex — game knowledge base

Single source of truth for what Ludo Vortex **is** and the answers we need for store
listings, reviews, support, and future work. Keep it current: every product decision,
number, or listing answer that changes must be updated here in the same commit.
Evidence (screenshots, research, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, modes, exact rules, bots, platforms, identity, tech |
| [`economy.md`](economy.md) | Levels/XP, coins, diamonds, coin tables, store, IAP products, pass, ads |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy, content rating, data safety, privacy, ads & IAP declarations |
| [`assets-index.md`](assets-index.md) | Where every logo, art set, screenshot, reference, and research file is |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale (why we chose X) |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Name | **Ludo Vortex** (internal registry id `ludo`) |
| Package / bundle | `app.w3dev.ludo` (release), `app.w3dev.ludo.debug` (debug) |
| Code | `apps-native/games/ludo` (Flutter + Flame), rules `apps-native/games/packages/ludo_rules`, backend `packages/api/src/games/ludo/` (planned) |
| Epic | `tasks/epics/15-ludo-launch/` (status in its `STATUS.md`) |
| Platforms | Android first (Google Play); iOS later |
| Genre | Board game (Ludo), casual, multiplayer |
| Monetization | Free to play; IAP (coins, diamonds, themes, Vortex Pass) via RevenueCat; rewarded ads only |
| Visual bar | Match or beat Ludo King; original art only |
| Status (2026-09-25) | Local game (vs Computer, pass-and-play) playable on device; brand + lobby art done/pending integration; backend, online, economy not built yet |
