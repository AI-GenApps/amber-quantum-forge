---
title: Ludo Vortex store listing draft
description: Draft Play Console listing content for Ludo Vortex, with the economy, purchase, ads and simulated-gambling disclosures.
---

Draft listing content for Google Play (App Store Connect later). Task 26i
created this file because task 27 had not yet; task 27 added the listing text
below (title, short and full description). Graphics and screenshots are still
task 29. The broader answer bank (identity, graphics,
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

## Listing text (draft, task 27)

Character limits are Play Console's (title 30, short description 80, full
description 4000). Counts below were computed, not estimated.

**Title (11 of 30):**

```text
Ludo Vortex
```

**Short description (75 of 80):**

```text
Roll, race and capture! Classic and Quick Ludo vs bots, friends and online.
```

If online is not live in the submitted build, use this 75-character variant:

```text
Roll, race and capture! Classic and Quick Ludo with bots, friends and more.
```

**Full description (1824 of 4000):**

```text
Ludo Vortex is a fast, colorful take on the classic race-and-capture board game. Roll the dice, bring your tokens out of the yard, dodge your rivals and be the first to bring them home.

PLAY YOUR WAY
- Vs Computer: three bot levels (easy, medium, hard) for every skill. Plays fully offline.
- Pass N Play: share one phone with friends and family, 2 to 4 players.
- Play with Friends: create a private room and share an invite code or link. [ONLINE]
- Online: get matched with other players, with a bot filling any empty seat. [ONLINE]

TWO RULESETS
- Classic: roll a 6 to release a token, race around the board, capture opponents, land on star squares to stay safe.
- Quick: tokens start out already released, and the first player to bring one token home after capturing at least one opponent wins. Short games, big swings.

BUILT TO FEEL GOOD
- Smooth animated dice and token hops, capture bursts and win confetti.
- Sound effects, music and haptics you can switch off in Settings.
- A reduced motion option, large readable controls, and screen-reader labels.
- Pick a name and an avatar and jump straight in. No sign-up needed to play.

PROGRESS AND REWARDS
- Earn XP from every match and level up.
- Collect coins and diamonds, claim daily rewards, and unlock dice, token and board themes.
- Watch an optional rewarded video for a bonus. We never force ads on you.
- Coin tables use virtual coins that have no cash value and cannot be cashed out. [COIN TABLES]

FAIR PLAY
- Online dice rolls and moves are decided and checked on our servers. [ONLINE]
- Your progress is saved to your account so it survives reinstalling.

Ludo Vortex is free to play. It contains optional in-app purchases (coins, diamonds, themes and a monthly Vortex Pass subscription) and optional rewarded ads. Virtual items have no real-world value.
```

Edit rules for the operator filling this in (task 29):

- Delete every line tagged `[ONLINE]` (and the "Online" and "Play with
  Friends" bullets) if the submitted build does not have online play live.
  Delete the `[COIN TABLES]` line if coin tables are not in the build.
  Remove the tags themselves before pasting; they are not store text.
- Do not add the names of other games or brands, and do not claim real money,
  cash prizes or rewards you can withdraw.
- The "themes" claim is true of the store, but economy art task 26f was
  skipped, so the themes shipping today use code-drawn fallbacks. Do not
  promise specific named themes or show theme art in screenshots until the
  art exists.
- Screenshots, the feature graphic and the icon are not drafted here; they
  need device captures (task 29) and the art in
  `.agents/games/ludo-vortex/assets-index.md`.

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

## Permissions in the merged manifest

Verified in task 27 from the merged release manifest of the build with
Crashlytics included (evidence:
`.agents/resources/2026-10-16/ludo-task-27-release-hardening/merged-manifest-permissions.txt`):

- `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, `FOREGROUND_SERVICE`
- `com.android.vending.BILLING` (Play Billing, from `purchases_flutter`)
- `com.google.android.gms.permission.AD_ID`, `ACCESS_ADSERVICES_AD_ID`,
  `ACCESS_ADSERVICES_ATTRIBUTION`, `ACCESS_ADSERVICES_TOPICS` (Google Mobile
  Ads SDK; the AD_ID permission means Play Console's advertising ID
  declaration must say yes)
- `com.google.android.providers.gsf.permission.READ_GSERVICES` (Google Play
  services)
- a `<applicationId>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` signature
  permission that AndroidX adds for the app's own id (not a user-facing
  permission)

`VIBRATE` is **not** in the merged manifest (an earlier draft of this file
expected it): haptics go through Flutter's `HapticFeedback`, which needs no
manifest permission. No location, camera, microphone, contacts or storage
permission is requested. Re-run this check on the final production build in
task 29, because the production applicationId and any ads/consent SDK bump
can change the list.

## App review and support notes

- Guest play needs no sign-in. The store is reachable from the lobby.
- Coins and diamonds are virtual, not redeemable for money.
- Restore purchases: Store, Restore.
- Test purchases with a license-tester account; there is no external payment
  link anywhere in the app.
