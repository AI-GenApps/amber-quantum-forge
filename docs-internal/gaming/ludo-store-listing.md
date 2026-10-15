---
title: Ludo Vortex store listing draft
description: Draft Play Console listing content for Ludo Vortex, with the economy, purchase, ads and simulated-gambling disclosures.
---

Draft listing content for Google Play (App Store Connect later). Task 26i
created this file because task 27 had not yet; task 27 extends it with final
copy, graphics and screenshots. The broader answer bank (identity, graphics,
testing track, FAQ) is `.agents/games/ludo-vortex/store-listing.md`; this file
holds what a reviewer needs to see in the repo. Do not advertise features that
are not live in the submitted build.

## Listing facts

| Field | Answer |
|---|---|
| App name | Ludo Vortex |
| Package | `app.w3dev.ludo` |
| Category | Game, Board |
| Price | Free, contains in-app purchases and ads |
| Target audience | 13+, not child-directed |
| Privacy policy URL | `<TBD, hosted in task 29>` ([draft](ludo-privacy-policy.md)) |
| Data safety | [`ludo-data-safety.md`](ludo-data-safety.md) |
| Content rating | [`ludo-content-rating.md`](ludo-content-rating.md) (simulated gambling: Yes; virtual currency never cashable) |

## Required disclosures in the listing copy

- State that the app contains in-app purchases and optional rewarded ads
  (Play shows the labels automatically; the description must not contradict
  them).
- If the coin tables are in the submitted build, say plainly: "Coin tables use
  virtual coins that have no cash value and cannot be cashed out." Never use
  "win real money", "cash prizes" or similar.
- Do not use competitor trademarks in the name, description or keywords.
- No claim about online play until online is live in the submitted build.

## In-app products

Final ids (see [`ludo-store-product-ids.md`](ludo-store-product-ids.md) for the
console notes and the discrepancy with the task text):

| Product | ID | Type | Price (INR / USD) |
|---|---|---|---|
| Starter Pack | `ludo_starter_pack` | one-time | 49 / 0.99 |
| Coins Small | `ludo_coins_small` | consumable | 99 / 1.99 |
| Coins Medium | `ludo_coins_medium` | consumable | 399 / 4.99 |
| Coins Large | `ludo_coins_large` | consumable | 1,499 / 17.99 |
| Diamonds Small | `ludo_diamonds_small` | consumable | 149 / 2.99 |
| Diamonds Medium | `ludo_diamonds_medium` | consumable | 699 / 8.99 |
| Diamonds Large | `ludo_diamonds_large` | consumable | 1,699 / 19.99 |
| Vortex Pass | `ludo_vortex_pass_monthly` | monthly subscription | 199 / 3.99 |

Store-facing product descriptions state exact contents (for example "5,500
coins"), so there is nothing randomized to disclose.

## Ads declaration and consent

Contains ads: Yes, rewarded video only, opt-in, no interstitial or banner ads.
Consent via Google UMP where required. Ad unit and SSV setup:
[`ludo-revenuecat-admob-runbook.md`](ludo-revenuecat-admob-runbook.md).

## Permissions to expect in the merged manifest

`INTERNET`, `com.android.vending.BILLING`,
`com.google.android.gms.permission.AD_ID`, `VIBRATE`, plus network-state
permissions from Firebase and the ads SDK. Verify against the final merged
manifest in task 27.

## App review and support notes

- Guest play needs no sign-in. The store is reachable from the lobby.
- Coins and diamonds are virtual, not redeemable for money.
- Restore purchases: Store, Restore.
- Test purchases with a license-tester account; there is no external payment
  link anywhere in the app.
