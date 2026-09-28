# Peeklings (SnapQuest) — game knowledge base

Single source of truth for what Peeklings **is** and the answers we need for store
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
| Name | **Peeklings** is the public title (kept, no rename); internal identifier / registry id / folder stay **`snapquest`** — SnapQuest and Peeklings are one product |
| Package / bundle | `app.w3dev.snapquest` (production), `app.w3dev.snapquest.debug` (debug) — registry: `docs-internal/gaming/app-source-registry.md` |
| Code | `apps-native/games/snapquest` (Flutter + Flame), rules `apps-native/games/packages/snapquest_rules`, camera capability `apps-native/games/snapquest/lib/capabilities` |
| Epic | `tasks/epics/16-games-portfolio-wave2/` (this epic, task 04 fonts only) |
| Platforms | Android first (Google Play); iOS later |
| Genre | Spot a color (desk tap or camera), meet a creature, fill an album |
| Monetization | TBD — parked, no economy work has started; see `economy.md` |
| Fonts | Baloo 2 (display) / Andika (body) — OFL, task 04 |
| Primary competitor reference | **Pikmin Bloom**, **Pokémon Smile**, **ColorCollect** — see `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| Status (2026-09-25) | **Parked.** Fonts only, this epic. 2 of ~30 creatures, camera capture works but recognition doesn't (`descriptorId=null` on device), so desk mode is the only real loop; audience skews young (COPPA/Families policy + camera is a heavy compliance mix). Portfolio audit: "blocked on an unproven tech bet" |
