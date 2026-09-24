---
epic: 15-ludo-launch
task: 26h-rewarded-ads-and-daily-rewards
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26g-inventory-and-store-ui]
estimate: L
---

# Rewarded ads (AdMob SSV), UMP consent, and daily reward calendar UI

## Goal

Add AdMob rewarded ad units (test IDs in debug) with Google UMP consent,
a server-side-verified (SSV) reward-grant callback with daily caps, and the
daily reward calendar UI with pass perks — the first AdMob integration in
this monorepo per research.md section 3.

## Context/Decisions

- Per research.md: no `google_mobile_ads` reference exists anywhere in
  this repo yet — follow Google's official Flutter plugin + UMP SDK
  directly, there is no internal pattern to copy for the ad SDK itself
  (there is a pattern to copy for SSV: task 26d's webhook idempotency
  discipline and task 26a's `ludo_ad_reward_claims` table).
- Two ad units: coin-rewarded and diamond-rewarded, per task 26a's caps (5
  coin ads/day, 2 diamond ads/day). Use AdMob test ad unit IDs in debug
  builds (never real ad unit IDs outside release config) — guard this the
  same way task 24 guards Firebase config presence, so a debug build never
  accidentally serves real ads.
- UMP consent: show the EEA/UK consent form via Google's UMP SDK before
  requesting any ad, tag underage users to suppress ad ID transmission if
  the app ever supports that flag (check whether onboarding, task 07,
  collects an age signal at all before assuming it does — if it doesn't,
  document that underage-tagging is not applicable in v1 rather than
  inventing an age-gate here, which is out of scope).
- SSV endpoint: `POST /:environment/ads/rewarded/callback` on
  `packages/api/src/games/ludo/routes.ts`, verifying AdMob's signed
  callback (key-id-based signature verification per Google's SSV
  documentation — fetch and cache AdMob's public keys, verify the
  signature over the query string) before crediting anything. On a valid,
  unseen `transaction_id`: check the subject's daily cap for the reward
  type (coins/diamonds) from `ludo_ad_reward_claims`, reject if the cap is
  already reached, otherwise insert the claim row and credit the ledger in
  one transaction. A replayed or unsigned callback must never credit
  currency.
- Daily reward calendar UI: a 7-day calendar screen (extend
  `settings_screen.dart` or add `daily_reward_screen.dart`, surfaced from
  the home lobby, e.g. a claimable badge on the lobby's HUD) driven by task
  26b's `daily-reward/claim` route and `ludo_daily_reward_state`, showing
  the current streak day and the day-7 diamond bonus.
- Pass perks: if Vortex Pass is active (from task 26d's entitlement
  state), the daily reward claim shows the +50% bonus already applied by
  the server (task 26b/26a's config) — the client only needs to render
  what the server returns, it does not compute the bonus itself.

## Implementation Checklist

- [ ] Add `google_mobile_ads` dependency, guarded initialization (never
  live ad unit IDs in debug), and the two rewarded ad unit wrappers.
- [ ] Add UMP consent flow, shown before the first ad request.
- [ ] Add `POST /:environment/ads/rewarded/callback` to
  `packages/api/src/games/ludo/routes.ts`: AdMob signature verification,
  daily cap enforcement, idempotent credit.
- [ ] Add `packages/api/src/games/ludo/rewarded-ads-callback.test.ts`
  covering: valid signed callback credits once, replayed
  `transaction_id` is a no-op, an unsigned/invalid-signature callback
  credits nothing, and a callback past the daily cap is rejected.
- [ ] Create `lib/src/screens/daily_reward_screen.dart` (or extend an
  existing surface) driven by task 26b's daily-reward route.
- [ ] Wire a "watch ad" action on the store/HUD surface calling the ad SDK,
  then the SSV-backed credit (client does not credit itself — it only
  triggers the ad watch and later refreshes wallet state via task 26e's
  state after the SSV callback lands server-side).
- [ ] Add `test/screens/daily_reward_screen_test.dart` and a rewarded-ad
  flow test using a fake ad SDK double (no real ad network calls in CI).
- [ ] Capture device evidence (physical device, serial `RZ8R32EAB7T`) of a
  full rewarded-ad watch using AdMob **test ads** in debug, and the daily
  reward calendar claim flow.

## Files Touched

- `apps-native/games/ludo/pubspec.yaml` (google_mobile_ads)
- `apps-native/games/ludo/lib/main.dart` (UMP consent init, wired)
- `apps-native/games/ludo/lib/src/net/ludo_ads_service.dart`
- `apps-native/games/ludo/lib/src/screens/daily_reward_screen.dart`
- `packages/api/src/games/ludo/routes.ts` (rewarded-ad SSV callback)
- `packages/api/src/games/ludo/rewarded-ads-callback.test.ts`
- `apps-native/games/ludo/test/screens/daily_reward_screen_test.dart`
- `apps-native/games/ludo/test/net/ludo_ads_service_test.dart`

## Acceptance Criteria (objective)

- A valid, correctly signed SSV callback credits currency exactly once;
  a replayed `transaction_id` credits nothing further, verified by tests.
- An unsigned or invalid-signature callback never credits currency,
  verified by a test.
- A subject at the daily cap for a reward type is rejected on the next
  callback, verified by a test.
- Debug builds only ever request AdMob test ad unit IDs, verified by
  inspecting the guarded config (not just asserted in prose).
- Device evidence of a real rewarded-ad watch (test ads) and a daily
  reward claim exists under
  `.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/`.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- rewarded-ads-callback.test.ts`
- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- `bun run games:run -- --app ludo --device-id RZ8R32EAB7T`
- `bun run check`

## Out of Scope

- Compliance/policy docs and store provisioning (task 26i).
- Interstitial or banner ads (explicitly excluded — rewarded only, per
  product decision).
- Real AdMob app/ad-unit creation in the AdMob console (task 26i's
  runbook documents the steps; actual console provisioning is a later
  human task per the epic's established pattern).

## Commit message

`feat(ludo): add rewarded ads (AdMob SSV), UMP consent, and daily reward calendar [15-ludo-launch/26h]`
