---
title: Ludo Vortex store product IDs
description: Every in-app product id for Google Play Console, App Store Connect and RevenueCat, cross-referenced to the server catalog.
---

Source of truth in code: `iapProducts` in
`packages/api/src/games/ludo/economy-config.ts` (`LUDO_ECONOMY_CONFIG_V1`),
turned into the webhook's product-to-grant map by `buildLudoIapCatalog()` in
`packages/api/src/games/ludo/iap-catalog.ts`. A product id that is not in
that catalog is rejected by the RevenueCat webhook
(`422 ludo_revenuecat_unknown_product`) and never grants anything, so the ids
below must be created **exactly as written** in every console. Prices are the
approved v1 prices from [`ludo-economy.md`](ludo-economy.md).

## Products

| # | Product id (Play Console, App Store Connect, RevenueCat) | Type | Grants (server-side) | INR | USD |
|---|---|---|---|---|---|
| 1 | `ludo_starter_pack` | One-time in-app product | 3,000 coins + 30 diamonds | 49 | 0.99 |
| 2 | `ludo_coins_small` | Consumable in-app product | 5,500 coins | 99 | 1.99 |
| 3 | `ludo_coins_medium` | Consumable in-app product | 30,000 coins | 399 | 4.99 |
| 4 | `ludo_coins_large` | Consumable in-app product | 110,000 coins | 1,499 | 17.99 |
| 5 | `ludo_diamonds_small` | Consumable in-app product | 100 diamonds | 149 | 2.99 |
| 6 | `ludo_diamonds_medium` | Consumable in-app product | 600 diamonds | 699 | 8.99 |
| 7 | `ludo_diamonds_large` | Consumable in-app product | 1,600 diamonds | 1,699 | 19.99 |
| 8 | `ludo_vortex_pass_monthly` | Auto-renewing subscription, 1 month | Vortex Pass (+50% daily reward, 1 free theme per month, exclusive dice skin) | 199 | 3.99 |

Eight products, matching the eight `iapProducts` entries in the config.

### Discrepancy with the task text

Task 26i's context wrote the subscription id as `ludo_pass_monthly`. The id
task 26d actually shipped, and the only one the server recognises, is
**`ludo_vortex_pass_monthly`** (`iapProducts[7].productId`, mirrored by
`vortexPass.productId`). Use `ludo_vortex_pass_monthly` everywhere. Creating
`ludo_pass_monthly` would produce purchases the webhook rejects.

### Cross-reference check

| `iap-catalog.ts` entry (from `iapProducts`) | Listed above |
|---|---|
| `ludo_starter_pack` | row 1 |
| `ludo_coins_small` | row 2 |
| `ludo_coins_medium` | row 3 |
| `ludo_coins_large` | row 4 |
| `ludo_diamonds_small` | row 5 |
| `ludo_diamonds_medium` | row 6 |
| `ludo_diamonds_large` | row 7 |
| `ludo_vortex_pass_monthly` | row 8 |

When a product is added to `economy-config.ts`, add it here in the same
commit.

## What is deliberately not on this list

- **Theme and cosmetic items** (6 dice, 4 token, 3 board themes) are bought
  only with coins or diamonds through `POST .../inventory/purchase`
  (`ludo-economy.md`, "Store - cosmetics"). They have no real-money price, so
  they are **not** store products and need no Play Console or App Store
  Connect entry. The Vortex Pass exclusive dice skin
  (`dice_vortex_pass_exclusive`) is a pass perk, not a product.
- **No "Remove Ads" product.** Dropped in task 26a: the game has rewarded ads
  only and nothing to remove. Do not create `ludo_noads` (or similar).
- **No randomized paid item.** No loot box, gacha, mystery pack or random
  reward is sold. See the odds-disclosure statement in
  [`ludo-content-rating.md`](ludo-content-rating.md).

## Per-console notes

### Google Play Console (Monetize, Products)

- Create 1 to 7 under **In-app products** and 8 under **Subscriptions** with
  one base plan (monthly, auto-renewing). Keep a single base plan id such as
  `monthly`; the app reads packages through RevenueCat, so the base plan id
  never reaches the server.
- **Known risk, verify in the sandbox.** For Play subscriptions with a base
  plan, RevenueCat reports the store product as `<subscription id>:<base plan
  id>` (the client's `_baseProductId` in `ludo_purchases_gateway.dart` strips
  that suffix for exactly this reason). The webhook route
  (`revenuecat-routes.ts`) looks the id up verbatim in the catalog, so a
  webhook `product_id` of `ludo_vortex_pass_monthly:monthly` would be rejected
  `422 ludo_revenuecat_unknown_product`. This task is docs-only, so no code
  was changed: the first sandbox subscription in task 29 must confirm the
  exact `product_id` RevenueCat sends, and if it carries a suffix, a small
  follow-up must strip it in the webhook and `revenuecat/sync` paths before
  launch. Tracked in `.agents/games/ludo-vortex/open-questions.md`.
- The product id is permanent once created. Do not reuse an id after delete.
- `ludo_starter_pack` is described as "one-time" in the economy design but the
  server does not enforce purchase-once today (the webhook credits every
  purchase event it sees, see `ludo-economy.md`). In RevenueCat, mark it
  **non-consumable** so the store itself blocks a second purchase. Logged as
  an open question in `.agents/games/ludo-vortex/open-questions.md`.
- Set prices per country from the INR/USD base prices, then let Play convert
  other currencies, and review the generated price tiers before activating.
- Activate every product; an inactive product is invisible to RevenueCat and
  purchases fail with "item unavailable".
- Add the testers' Gmail accounts under **License testing** so sandbox
  purchases are free and instantly refundable.

### App Store Connect (later, iOS not shipped in v1)

- Reuse the same eight ids as App Store product identifiers (Apple allows the
  same string across apps only if the bundle differs; here the bundle is
  `app.w3dev.ludo`).
- Apple In-App Purchase (StoreKit) only; no Apple Pay for digital goods.
- Subscription needs a subscription group (for example "Vortex Pass") and
  review screenshots. Nothing in this list has been created yet.

### RevenueCat

- Mirror all eight ids under **Product catalog, Products** for the Google Play
  app, then attach them to the offering described in
  [`ludo-revenuecat-admob-runbook.md`](ludo-revenuecat-admob-runbook.md).
- The client loads packages from every offering and matches them by the store
  product id (the part before any `:base_plan` suffix), so the package
  identifiers inside an offering are free-form.
