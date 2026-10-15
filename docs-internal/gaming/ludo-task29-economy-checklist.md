---
title: Task 29 economy provisioning additions
description: Exact checklist items from task 26i to append to the human acceptance task, plus the other task-file edits the requester must apply.
---

Produced by task 26i. **Task 26i did not edit**
`tasks/epics/15-ludo-launch/29-human-acceptance-provisioning.md` or
`tasks/epics/15-ludo-launch/27-release-hardening.md`; the requester applies
the edits below.

## Items to append to task 29's checklist

- [ ] Create the real RevenueCat project, Android apps, products, the
  `vortex_pass` entitlement, the offering and the webhook, following
  [`ludo-revenuecat-admob-runbook.md`](ludo-revenuecat-admob-runbook.md)
  sections 1 and 2. Create the eight Play Console products with the exact ids
  in [`ludo-store-product-ids.md`](ludo-store-product-ids.md), including
  `ludo_vortex_pass_monthly` (not `ludo_pass_monthly`).
- [ ] Create the real AdMob app, the two rewarded ad units
  (`ludo_rewarded_coins`, `ludo_rewarded_diamonds`), enable server-side
  verification with the callback
  `https://<host>/api/games/ludo/<environment>/ads/rewarded/callback`, and
  publish the UMP (GDPR) message, per runbook section 3.
- [ ] Set in the real deployment environment (Vercel): `REVENUECAT_WEBHOOK_SECRET_LUDO`,
  `REVENUECAT_API_KEY_LUDO`, `LUDO_ADMOB_COIN_AD_UNIT_ID`,
  `LUDO_ADMOB_DIAMOND_AD_UNIT_ID`. No AdMob SSV key material is needed: the
  server verifies against Google's published keys.
- [ ] Build the release with `--dart-define=REVENUECAT_API_KEY=goog_...`,
  the two `LUDO_ADMOB_*_AD_UNIT_ID` defines, `LUDO_API_BASE_URL`, and
  `-PLUDO_ADMOB_APP_ID`.
- [ ] Host the updated privacy policy ([draft](ludo-privacy-policy.md)) and
  put its URL in Play Console and the app.
- [ ] Complete the Data Safety form with the purchase history, advertising ID
  (collected and shared, Advertising) and account disclosures from
  [`ludo-data-safety.md`](ludo-data-safety.md), and answer the content rating
  questionnaire with **simulated gambling: Yes** and the statement that coins
  and diamonds are never redeemable for real money
  ([`ludo-content-rating.md`](ludo-content-rating.md)).
- [ ] On the physical device, verify one real sandbox purchase (a coin pack
  credits the wallet; Restore does not double-credit; a refund debits), one
  Vortex Pass subscription (**record the exact webhook `product_id`; if it has
  a `:base_plan` suffix the server rejects it and a code fix is required before
  launch**), and one real test rewarded ad watch credited through the SSV
  callback (including the sixth-ad 429 cap), before marking economy
  provisioning complete.
- [ ] Provide a data-deletion request path and URL (required by Play Data
  Safety) and decide whether to add a UMP "Privacy options" entry to Settings
  (not built today).

## Edits for the requester

1. `29-human-acceptance-provisioning.md`: append the checklist above.
2. `27-release-hardening.md`: change `depends_on` to include
   `15-ludo-launch/26i-economy-compliance-and-provisioning-docs`, and tell it
   to extend (not recreate) `ludo-privacy-policy.md`, `ludo-data-safety.md` and
   `ludo-store-listing.md`, which 26i already created.
3. Optional follow-up task (code, outside 26i's scope): strip a
   `:base_plan` suffix from the RevenueCat webhook and sync `product_id`
   before the catalog lookup, and add a Settings "Privacy options" entry.
