# Merge Relay — game knowledge base

Single source of truth for what Merge Relay **is** and the answers we need for store
listings, reviews, support, and future work. Keep it current: every product decision,
number, or listing answer that changes must be updated here in the same commit. Evidence
(screenshots, research, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, modes, exact rules, tech, platforms |
| [`economy.md`](economy.md) | Currencies, IAP, ads — currently a TBD stub (no economy defined yet) |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy, content rating, data safety |
| [`assets-index.md`](assets-index.md) | Where every logo, art set, screenshot, reference, and research file is |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale, sourced from `docs-internal/gaming/*` |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Name | **Merge Relay** (internal registry id `merge_relay`) — strict existence check on 2026-09-26 found no conflict; kept as-is (see `.agents/resources/2026-09-26/merge-relay-brand/name-check.md`) |
| Package / bundle | `app.w3dev.mergerelay` (both iOS and Android; registration status: unverified) |
| Code | `apps-native/games/merge_relay` (Flutter + Flame), rules `apps-native/games/packages/merge_rules`, backend `packages/api/src/games/merge-relay/` |
| Epic | `tasks/epics/14-merge-relay-implementation/` (status: in-progress; see its `STATUS.md`) |
| Platforms | iOS + Android; Google Play/Android is release-priority, iOS QA paused until after Android publication |
| Genre | 2048-style number-merge puzzle (fixed 4x4 / 16-cell board, rule version `MR-2D-1`) with a social "relay" (challenge/return) layer, plus rescue, daily, and endless modes |
| Monetization | Cosmetic-only, non-consumable theme pack (`merge_relay_theme_pack_v1` → server entitlement `merge_relay.theme_pack.v1`) via Google Play Billing; rewarded ads planned, not implemented; no economy currencies defined |
| Visual bar | Two in-app themes: Signal (navy/powder-blue/coral) and Ember (plum/cream/amber); current screens are clean/flat "scoreboard" style, functional but not yet visually overhauled |
| Status (2026-09-26) | Registry lifecycle `concept`, release `0.1.0`/build `1`, no store product IDs; backend service/persistence foundation partially tested (35 focused tests + isolated Postgres runs); client end-to-end device wiring (task 03) not started; no PGS project, no two-device relay evidence, no store listing/content-rating inputs yet |
