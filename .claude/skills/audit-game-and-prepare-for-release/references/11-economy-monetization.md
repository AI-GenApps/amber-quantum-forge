# Phase 11 — Economy, progression, and monetization

Games make money through a designed economy, not a "buy" button. Audit it, decide it
explicitly with the user (don't let "no monetization in v1" silently drop it), design it
against the competitor, and build it server-authoritative. Ludo run lesson: the first
decision was "no monetization"; the user later reversed it — ask early, and re-ask when
the competitor study shows a rich economy (Ludo King: coins 2,250, diamonds 150, King
Pass, themes/dice inventory, level badge, season claim, free-coin ads).

## Audit checklist (add to Phase 1 + Phase 2)

Game under audit: currencies? levels/XP? inventory/cosmetics? store? IAP SDK? receipt
validation? ads SDK + consent? daily rewards? analytics on economy events?
Competitor (capture on device + research): currencies and what each buys; sources and
sinks (match rewards, entry fees, daily, spin, ads, level-ups); level/XP display; store
layout; IAP product list and price tiers (store listing "In-app purchases" range);
passes/subscriptions; remove-ads; odds disclosures; how aggressive ads/offers are (note as
anti-patterns). Label CONFIRMED / REPORTED / UNKNOWN.

## Decisions to ask

- Scope: full economy in v1 · progression only (no real money) · free v1, economy later.
- IAP layer: **RevenueCat** (Recommended here — already used by `apps/native`; one SDK over
  Play Billing + StoreKit; webhooks to our server) · Flutter `in_app_purchase` + own
  receipt validation (Merge Relay has Play verification in
  `packages/api/src/games/merge-relay/commerce-*`).
- Ads: rewarded only (Recommended) · none · rewarded + interstitials.
- Currencies: soft (coins) + premium (diamonds) is the genre norm.
- Random paid rewards (chests/spins bought with money)? Prefer no; else disclose odds.

## Platform rules (hard)

- Digital goods/currency: **Google Play Billing** on Android, **Apple In-App Purchase
  (StoreKit)** on iOS. **Apple Pay is NOT allowed for digital goods** (only physical
  goods/services) — correct the user if they say "Apple Pay SDK".
- No links/steering to external payment inside the app unless the store's current
  regional programs allow it (verify at build time).
- Loot boxes / random paid items: disclose odds (Apple 3.1.1, Google Play policy).
- Children/Families: stricter ads + IAP rules if targeting under-13s.
- Ads: AdMob + Google UMP consent (GDPR/EEA/UK), advertising ID declared in data safety,
  iOS ATT prompt if tracking.

## Architecture (server-authoritative)

- **Ledger**: append-only `<id>_wallet_transactions` (user, currency, delta, reason,
  source ref, idempotency key, created_at) + derived balances; never trust client balances.
- **Catalog**: products (IAP SKU → currency/bundle), cosmetics (id, type dice/token/board,
  price currency, price), level curve and rewards as versioned server config.
- **Grants**:
  - IAP → RevenueCat webhook (or store server notifications) → verify → ledger grant;
    client calls "sync" after purchase and on restore; idempotent on transaction id.
  - Rewarded ads → AdMob **server-side verification (SSV)** callback → grant; daily caps.
  - Match rewards/XP → granted by the server at match end for online matches; for offline
    vs-bot/pass-and-play either no currency or small capped daily rewards claimed through
    the server (replay-validated if cheap) — decide explicitly.
  - Daily rewards/spin → server clock, streak state, idempotent claims.
- **Spend**: cosmetics purchase, coin-table entry fees (escrow at match start, payout at
  end, refund on abort) — all transactional with the match service.
- **Client**: wallet/level state from server; optimistic UI only for display; offline →
  read-only cached balances; inventory equip is local + synced.
- **Anti-cheat**: rate limits, idempotency, anomaly logs, server-owned timestamps.

## Design numbers (start, then tune with analytics)

Provide a table: currencies · sources · sinks · starting balance · XP formula (e.g.
`xpToNext(level) = 100 + 50*level`) · level rewards · 6–10 IAP products at store price
tiers (starter pack, coin packs S/M/L, diamond packs, remove-ads if interstitials ever,
theme bundles) · rewarded ad caps (e.g. 5/day) · 7-day daily reward calendar · cosmetic
catalog (dice/token/board themes) with prices · coin tables (entry → payout, e.g. 2p pays
1.9× entry). Economy art (theme sets) goes through the art pipeline (Phase 8).

## Epic tasks (append to the game epic, after backend identity)

1. Economy design doc + versioned config (numbers above) + analytics events.
2. Backend wallet/ledger + catalog + progression service (tests: idempotency, concurrency).
3. IAP: RevenueCat products/offerings config, webhook endpoint + verification, sync/restore.
4. Client: purchases SDK integration (`purchases_flutter`), wallet/level HUD (coins,
   diamonds, level badge), XP/level-up flow with rewards animation.
5. Inventory + store UI (preview/equip/buy), theme rendering via art manifest slots.
6. Rewarded ads (AdMob + UMP consent + SSV) with caps.
7. Daily rewards + spin (optional) + coin tables for online matches (escrow).
8. Policy/compliance: data safety + privacy updates, odds disclosure if any randomness,
   store product setup checklist.
9. Human provisioning task: RevenueCat project, Play Console products + service account,
   App Store Connect products + App Store Server API key, AdMob app + ad units + SSV key,
   tax/payment profiles, license testers/sandbox testers; real-purchase test on device.

## Verification

Sandbox/license-tester purchases on the physical device (human step), webhook replay
tests, ledger invariants (sum of transactions = balance), rewarded ad test ads only in
debug, screenshots of store/inventory/level-up saved under `.agents/`.
