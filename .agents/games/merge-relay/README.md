# Merge Relay — game knowledge base

Single source of truth for what Merge Relay **is** and the answers we need for store
listings, reviews, support, and future work. Keep it current: every product decision,
number, or listing answer that changes must be updated here in the same commit.
Evidence (screenshots, research, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, modes, exact rules, content, platforms, identity, tech |
| [`economy.md`](economy.md) | Monetization (none in v1), deferred commerce scope |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy, content rating, data safety, privacy, ads & IAP declarations |
| [`assets-index.md`](assets-index.md) | Where every logo, art set, screenshot, reference, and research file is |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale (why we chose X) |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Name | **Merge Relay** (internal registry id `merge_relay`); a new public name is chosen at task 17 — this folder name and internal id stay `merge-relay` / `merge_relay` after the rename |
| Package / bundle | `app.w3dev.mergerelay` (production), `app.w3dev.mergerelay.debug` (debug) — registry: `docs-internal/gaming/app-source-registry.md` |
| Code | `apps-native/games/merge_relay` (Flutter + Flame), rules `apps-native/games/packages/merge_rules`, backend `packages/api/src/games/merge-relay/` |
| Epic | `tasks/epics/16-games-portfolio-wave2/` (this epic); prior backend-heavy work tracked in `tasks/epics/14-*` (see `docs-internal/gaming/merge-relay-release-plan.md`, `merge-relay-release-audit.md`) |
| Platforms | Android first (Google Play); iOS later |
| Genre | Tile-merge puzzle (2048-like), solo, offline |
| Monetization | **None in v1** — no ads, no IAP (see `economy.md`) |
| Fonts | Fredoka (display) / Nunito Sans (body) — OFL, task 03/07 |
| Primary competitor reference | **Threes!** (Sirvo) — visual/feel target; see `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| Visual bar | Threes!-grade: character tiles, warm hand-made palette, real soundtrack; original art only |
| Status (2026-09-25) | **Active — solo v1 scope.** Friend relays, Play Games Services, and every network path are gated off for v1 (kept in code for v1.1). Full visual/motion/audio/brand overhaul in progress this epic; rescue campaign expands from 5 to 60 boards in 6 chapters (task 06) |
