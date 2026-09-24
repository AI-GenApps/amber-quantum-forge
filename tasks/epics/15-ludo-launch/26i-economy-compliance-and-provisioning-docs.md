---
epic: 15-ludo-launch
task: 26i-economy-compliance-and-provisioning-docs
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26h-rewarded-ads-and-daily-rewards]
estimate: M
---

# Economy compliance docs, store product IDs, and RevenueCat/AdMob runbook

## Goal

Update the data safety and privacy policy content for purchases/ads/
advertising ID, write content-rating notes (simulated gambling, no
real-money cash-out), list every store product ID for Play Console and App
Store Connect, write a RevenueCat/AdMob setup runbook, and draft the exact
provisioning checklist items to append to task 29 (content only — task 29
itself is not edited by this task).

## Context/Decisions

- This task updates the release-prep documents task 27 already created
  (`docs-internal/gaming/ludo-privacy-policy.md`,
  `docs-internal/gaming/ludo-data-safety.md`,
  `docs-internal/gaming/ludo-store-listing.md`) — read them first and
  extend, don't duplicate. If task 27 has not yet created them by the time
  this task runs (check `depends_on` ordering against actual STATUS.md
  state), create them here instead and note the ordering discrepancy in
  the commit body.
- Privacy policy additions: purchase history (RevenueCat/store receipts),
  advertising ID (AdMob, GAID), app interactions (telemetry events per
  task 12/26's PII discipline — seat/subject hashes, no raw display
  names), consistent with task 26h's UMP/AdMob and task 26d's RevenueCat
  data flows.
- Data safety form draft additions: declare purchase history collection,
  advertising ID collection/sharing (AdMob), and financial info handling
  (virtual currency, not real payment data beyond what RevenueCat/Play
  Billing already process) in the same category structure Play Console's
  Data Safety form uses.
- Content rating notes: **declare "simulated gambling" honestly** — the
  coin-stake tables (task 26c) involve wagering a virtual currency with a
  chance-influenced outcome (dice rolls), which content-rating
  questionnaires (Google Play, IARC) classify as simulated gambling even
  though coins are never cashable. State explicitly, per task 26a's
  binding decision, that coins/diamonds are **never redeemable for real
  money or any real-world value** — this is the fact that keeps the game
  out of real-money-gaming regulatory territory, and the content-rating
  notes must say so in the same breath as the simulated-gambling
  declaration, not as a separate disclaimer buried elsewhere.
- Odds disclosure: **only required if any randomized paid item exists**.
  Per task 26a's decision, this v1 economy has none (all theme/cosmetic
  IAPs are fixed-price, guaranteed-contents) — state this explicitly as
  "not applicable, no randomized paid items in this catalog" rather than
  omitting the section, so a future task that considers adding a gacha/
  loot-box mechanic sees the deliberate absence and the reason for it.
- Store product ID list: every RevenueCat/Play Console/App Store Connect
  product id from task 26d's `iap-catalog.ts`
  (`ludo_coins_small`/`_medium`/`_large`, `ludo_diamonds_small`/`_medium`/
  `_large`, `ludo_starter_pack`, `ludo_pass_monthly`) plus the theme/
  cosmetic item ids from task 26a's catalog if those are ever sold as
  direct IAPs rather than only coin/diamond spends (confirm from task
  26a/26g whether any theme item has a real-money price — research.md
  section 6 lists themes as coin/diamond-only, so this list should be
  IAP-currency-and-pass products only, not theme items, unless a later
  task changed that).
- RevenueCat/AdMob runbook (`docs-internal/gaming/ludo-revenuecat-admob-
  runbook.md`): step-by-step for the human operator — create RevenueCat
  project, link Google Play service account, configure entitlements
  (Vortex Pass) and the product catalog mirroring Play Console product
  ids, configure the webhook with the shared secret task 26d's endpoint
  expects; create the AdMob app + two rewarded ad units, enable SSV with
  the callback URL and signature key matching task 26h's verification
  code, configure UMP consent settings. Mirror the level of step-by-step
  detail research.md section 5's policy checklist already established.
- Task 29 provisioning checklist additions (content only — **do not edit
  task 29's file**; list the exact items to append in this task's commit
  body and this task's own doc output, for the requester to apply): create
  the real RevenueCat project/products per the runbook; create the real
  AdMob app/ad units/SSV key per the runbook; host the updated privacy
  policy; complete the Data Safety form with the purchase/ads/simulated-
  gambling disclosures from this task; set
  `REVENUECAT_WEBHOOK_SECRET_LUDO` (or whichever env var name task 26d
  settled on) and any AdMob SSV key material in the real deployment
  environment; verify one real sandbox/test purchase and one real test
  rewarded ad watch on the physical device before marking economy
  provisioning complete.

## Implementation Checklist

- [ ] Read task 27's three release-prep docs (or confirm they don't exist
  yet) and extend/create them with the purchase/ads/advertising-ID/
  simulated-gambling content above.
- [ ] Add the content-rating notes section (simulated gambling + never-
  cashable statement together, odds-disclosure "not applicable" statement)
  to `docs-internal/gaming/ludo-data-safety.md` or a new
  `docs-internal/gaming/ludo-content-rating.md` if that reads cleaner as
  its own file.
- [ ] Write `docs-internal/gaming/ludo-store-product-ids.md`: the full
  product id list for Play Console and App Store Connect, cross-referenced
  against task 26d's `iap-catalog.ts`.
- [ ] Write `docs-internal/gaming/ludo-revenuecat-admob-runbook.md` per
  Context.
- [ ] Write the exact task 29 checklist additions as a clearly delimited
  section in this task's commit body (and, if useful, as a short
  standalone note under `docs-internal/gaming/` referenced by name) —
  do not touch `29-human-acceptance-provisioning.md` itself.
- [ ] Run `bun run check:doc-paths` and `bun run check:staged-docs` against
  every new/changed doc.

## Files Touched

- `docs-internal/gaming/ludo-privacy-policy.md` (extended or created)
- `docs-internal/gaming/ludo-data-safety.md` (extended or created)
- `docs-internal/gaming/ludo-store-listing.md` (extended or created, if
  product-list changes affect listing copy)
- `docs-internal/gaming/ludo-content-rating.md` (new, if split out)
- `docs-internal/gaming/ludo-store-product-ids.md` (new)
- `docs-internal/gaming/ludo-revenuecat-admob-runbook.md` (new)

## Acceptance Criteria (objective)

- The data safety draft explicitly declares purchase history and
  advertising ID collection.
- The content-rating notes declare simulated gambling and the "coins/
  diamonds never redeemable for real money" fact in the same section.
- The odds-disclosure section explicitly states "not applicable" with the
  reason (no randomized paid items), rather than being silently absent.
- Every product id in task 26d's `iap-catalog.ts` appears in
  `ludo-store-product-ids.md`.
- The runbook has concrete, ordered steps for both RevenueCat and AdMob
  setup, referencing the exact server endpoints/env vars task 26d/26h
  built.
- This task's reply/commit body lists the exact task 29 checklist items to
  append, without having edited task 29's file.

## Verification Commands

- `bun run check:doc-paths`
- `bun run check:staged-docs`
- `bun run check`

## Out of Scope

- Editing `29-human-acceptance-provisioning.md` or
  `tasks/epics/15-ludo-launch/STATUS.md` — list the required edits for the
  requester to apply instead.
- Editing `27-release-hardening.md` to add the `depends_on: [...,
  15-ludo-launch/26i-economy-compliance-and-provisioning-docs]` chain —
  list this edit for the requester to apply instead.
- Actually creating the RevenueCat/AdMob projects or submitting the Data
  Safety form in a real console (task 29).
- Any code change.

## Commit message

`docs(ludo): add economy compliance docs, store product ids, and iap/ads runbook [15-ludo-launch/26i]`
