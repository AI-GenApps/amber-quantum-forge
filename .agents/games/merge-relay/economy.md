# Merge Relay — economy

## v1 decision (2026-09-25, user)

**No monetization in v1.** No ads (no rewarded, no interstitial, no banner) and no IAP.
Solo Rescue/Daily/Endless with local save only ships free, with nothing to purchase and
nothing to watch. This reverses the direction implied by the older PRD/handoff sources,
which describe rewarded ads, IAP cosmetics, and a "Vortex Pass"-style commerce loop —
those are explicitly **deferred to v1.1**, not cancelled.

## Deferred to v1.1 (kept in code, gated off)

| Item | Requirement ledger row | Notes |
|---|---|---|
| Server-validated friend relays (async handoff) | MR-04, MR-05, MR-06, MR-07 | Needs the backend, deep links, challenge-first routing |
| Anonymous identity + account upgrade | MR-08 | Only needed once relays/commerce require a server identity |
| Rewards and purchases (ads/IAP) | MR-11 | Server-only Google Play `ProductPurchaseV2` verifier and cosmetic entitlement settlement exist but stay disabled; no native Billing/live provider wiring for v1 |
| Safe social surfaces (report/block, codes) | MR-13 | Only relevant once relays are live |
| Play Games Services (PGS) sign-in/leaderboards | — | `apps-native/games/merge_relay/lib/src/platform/merge_relay_pgs_account.dart`, `merge_relay_play_games.dart` kept but not wired into any v1 screen |

Full requirement ledger: `docs-internal/gaming/handoffs/merge-relay.md`.

## What v1 does have

- Local save only (no server ledger, no server-authoritative wallet).
- No currencies, no store, no cosmetics purchase path exposed in the UI.
- Existing server-side commerce/relay code under
  `packages/api/src/games/merge-relay/` and
  `apps-native/games/merge_relay/lib/src/network/` stays in the repo, untouched by this
  epic except for gating it out of the v1 UI/build (task 05, "solo v1 scope gate").

## Open items for v1.1 (not this epic)

Product IDs, prices, ad network choice, rake/reward tables — all **TBD**, deferred with
the rest of the relay/commerce scope. Do not invent numbers.
