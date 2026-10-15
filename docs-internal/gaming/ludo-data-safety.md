---
title: Ludo Vortex Data Safety draft
description: Draft Google Play Data Safety form answers for Ludo Vortex covering purchases, advertising ID, accounts and telemetry.
---

Draft for the Play Console **Data safety** form. Task 29 submits it; task 27
adds crash reporting and re-verifies the SDK list against the final merged
manifest and dependency tree. Entries marked **verify** depend on that check.
This task (26i) is the first to create this file: task 27 had not created the
release-prep docs yet when 26i ran (the ordering discrepancy is noted in the
commit body), so task 27 should extend this file rather than recreate it.

Companion: [`ludo-privacy-policy.md`](ludo-privacy-policy.md) (the hosted
policy text must match these answers) and
[`ludo-content-rating.md`](ludo-content-rating.md).

## Data flows this app actually has

| Flow | Source | Data |
|---|---|---|
| Guest and Google sign-in | Firebase Auth (`firebase_auth`) | anonymous Firebase UID; email and Google account id only if the player links Google |
| Game session | `POST /api/games/ludo/...` | a game token whose subject is the player id; display name and avatar choice; match commands and results |
| Wallet and progression | server-authoritative store (task 26b) | coin/diamond balances, ledger entries, XP and level, inventory, daily reward streak |
| Purchases | RevenueCat SDK (`purchases_flutter`) and Google Play Billing; RevenueCat webhook to the API | store receipts handled by Google and RevenueCat; purchase history (product id, time, order id, refund state) keyed to the player id |
| Rewarded ads | Google Mobile Ads SDK (`google_mobile_ads`) with UMP consent | advertising ID (GAID), coarse device and ad-interaction data, ad impressions; SSV callback carries the player id as `user_id` |
| Online realtime | Firestore match views | match state keyed by match id and seat; no names beyond the in-match display name |
| App interactions | `LudoTelemetry` | event names with allow-listed fields only (action, reason, status, counts). In the current build events stay in an in-memory sink and are **not uploaded**; declare them as collected only if an upload pipeline ships (see below) |

## Data types

Play's categories, with the answers to give. "Collected" means leaves the
device; "Shared" means transferred to a third party other than a service
provider acting on our behalf (Google's definition), so processing by
RevenueCat and Firebase on our behalf is not "sharing", while AdMob's use of
the advertising ID for ads is.

| Category / type | Collected | Shared | Optional | Purpose | Notes |
|---|---|---|---|---|---|
| Personal info: Name | Yes | No | No | App functionality | player-chosen nickname, not a legal name |
| Personal info: Email address | Yes | No | Yes | Account management | only when the player links Google |
| Personal info: User IDs | Yes | No | No | App functionality, account management | Firebase UID and game subject |
| **Financial info: Purchase history** | **Yes** | No | Yes (only if the player buys) | App functionality | product ids, order ids, times, refund state via RevenueCat / Play Billing |
| Financial info: Payment info | **No** | No | n/a | n/a | card and billing details are handled entirely by Google Play; the app and server never receive them |
| Financial info: User payment info (virtual currency) | Not a Play category | n/a | n/a | n/a | coins and diamonds are virtual, no real-world value; balances are stored as game data, not as financial account data |
| App activity: App interactions | Yes | No | No | Analytics, app functionality | match results, store and reward actions; telemetry fields are allow-listed |
| App info and performance: Crash logs, Diagnostics | Yes (**verify**, task 27) | No | No | Analytics, app functionality | only once crash reporting ships |
| **Device or other IDs: Advertising ID** | **Yes** | **Yes** | Yes (consent-gated, resettable) | **Advertising** | AdMob rewarded ads; shared with Google (AdMob) and its ad partners |
| Location (approximate or precise) | No | n/a | n/a | n/a | |
| Contacts, photos, files, calendar, messages, audio | No | n/a | n/a | n/a | |
| Health and fitness, web browsing | No | n/a | n/a | n/a | |

Notes behind the bold rows:

- **Purchase history** is declared because RevenueCat stores the player's
  transactions and the server's ledger and webhook events record the product
  id and RevenueCat event id for every grant and refund.
- **Advertising ID** is declared as collected and shared for **Advertising**
  because AdMob reads the GAID. The AD_ID permission
  (`com.google.android.gms.permission.AD_ID`) is not declared in the app's own
  manifest; it is expected to merge in from the Google Mobile Ads SDK, so
  **verify** it in the final merged manifest and in Play Console's
  advertising ID declaration. Where UMP consent is required and refused, AdMob serves limited
  or no ads and the advertising ID is not used for personalization.
- If the final release dependency tree adds the Firebase Analytics or
  Crashlytics SDK, add **Device or other IDs: App instance ID** and the
  matching diagnostics rows.

## Security practices

- Data is encrypted in transit (HTTPS for API, Firebase and RevenueCat).
- **Deletion**: a way to request deletion of the account and its data is
  required by Play. **Not built yet**; the privacy policy names a contact
  email and the form needs a URL. Tracked in task 29 and
  `.agents/games/ludo-vortex/open-questions.md`.
- Independent security review: No.
- Committed to the Play Families policy: No (13+, not child-directed).

## Ads declaration

Contains ads: **Yes**. Rewarded video only, opt-in, no interstitials or
banners. Google UMP consent where required. Not directed at children, so no
child-directed treatment is requested (`tagForChildDirectedTreatment` is not
set; underage tagging is not applicable because onboarding collects no age).

## In-app purchases declaration

Contains in-app purchases: Yes (see
[`ludo-store-product-ids.md`](ludo-store-product-ids.md)). No randomized paid
items. Virtual currency has no cash value (see
[`ludo-content-rating.md`](ludo-content-rating.md)).

## Telemetry caveat

Task 12/26 deliberately restricts telemetry to the shared allow-list (`action`,
`details`, `reason`, `status`, counts, ticks) so free text such as a display name is not part of an event (a field that is
not on the list is dropped). Because the current build has no upload pipeline,
"App interactions" is declared for the economy and match actions the server
already records (which are collected), not for client telemetry. If a client
telemetry upload is added later, re-check this table and the policy first.
