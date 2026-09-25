# Pocket Biome — game knowledge base

Single source of truth for what Pocket Biome **is** and the answers we need for store
listings, reviews, support, and future work. Keep it current: every product decision,
number, or listing answer that changes must be updated here in the same commit.
Evidence (screenshots, research, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, modes, exact rules, content, platforms, identity, tech |
| [`economy.md`](economy.md) | Monetization status (TBD — pre-launch) |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy, content rating, data safety, privacy, ads & IAP declarations |
| [`assets-index.md`](assets-index.md) | Where every logo, art set, screenshot, reference, and research file is |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale (why we chose X) |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Name | **Pocket Biome** (internal registry id `pocket_biome`) |
| Package / bundle | `app.w3dev.pocketbiome` (production), `app.w3dev.pocketbiome.debug` (debug) — registry: `docs-internal/gaming/app-source-registry.md` |
| Code | `apps-native/games/pocket_biome` (Flutter + Flame), rules `apps-native/games/packages/biome_rules` |
| Epic | `tasks/epics/16-games-portfolio-wave2/` (this epic, tasks 03 fonts + 15 art dry run only); no gameplay/backend epic yet |
| Platforms | Android first (Google Play); iOS later |
| Genre | Cozy terrarium: plant, grow over real time, breed, collect |
| Monetization | TBD — no gameplay/economy epic has started; see `economy.md` |
| Fonts | Fraunces (SOFT axis, display) / Quicksand (body) — OFL, task 03 |
| Primary competitor reference | **Terrarium: Garden Idle** (visual) and **Pocket Frogs** (breeding mechanics) — see `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| Visual bar | Not yet set by a full overhaul epic; this epic runs an **art-direction dry run only** (task 15) — preview images and full-screen mockups for the user to price and pick, before any full art budget is spent |
| Status (2026-09-25) | **Art dry run only.** Foundation playable slice: 6-pot grid, 1 plantable species (Mossling) live, 6 of ~30 species defined, no decoration/visits/gifting/reminders/economy. No gameplay work in this epic |
