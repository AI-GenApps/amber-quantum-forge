---
epic: 15-ludo-launch
task: 26h-rewarded-ads-and-daily-rewards
status: in-progress
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

- [x] Add `google_mobile_ads` dependency, guarded initialization (never
  live ad unit IDs in debug), and the two rewarded ad unit wrappers.
  (`google_mobile_ads ^9.1.0`; `lib/src/net/ludo_ads_config.dart` is the guard:
  a debug build resolves only Google's sample rewarded unit and ignores every
  `--dart-define`, a release build needs real `LUDO_ADMOB_COIN/DIAMOND_AD_UNIT_ID`
  defines or has ads disabled; `ludo_ads_service.dart` + `ludo_google_ads_sdk.dart`
  wrap the coin and diamond unit behind an SDK seam; Android manifest AdMob
  app id placeholder in `build.gradle.kts`.)
- [x] Add UMP consent flow, shown before the first ad request.
  (`gatherConsent` runs before `initialize`/`load` on every watch; `main.dart`
  only refreshes consent info at startup via `prepareLudoAdsConsent`.)
- [x] Add `POST /:environment/ads/rewarded/callback` to
  `packages/api/src/games/ludo/routes.ts`: AdMob signature verification,
  daily cap enforcement, idempotent credit. (Registered from `routes.ts` by
  `rewarded-ads-routes.ts`; accepts GET too, since AdMob calls SSV URLs with
  GET; `admob-ssv.ts` verifies the signature.)
- [x] Add `packages/api/src/games/ludo/rewarded-ads-callback.test.ts`
  covering: valid signed callback credits once, replayed
  `transaction_id` is a no-op, an unsigned/invalid-signature callback
  credits nothing, and a callback past the daily cap is rejected.
- [x] Create `lib/src/screens/daily_reward_screen.dart` (or extend an
  existing surface) driven by task 26b's daily-reward route. (New
  `GET daily-reward` read model plus the existing claim route, which now
  applies the Vortex Pass bonus server-side.)
- [x] Wire a "watch ad" action on the store/HUD surface calling the ad SDK,
  then the SSV-backed credit (client does not credit itself — it only
  triggers the ad watch and later refreshes wallet state via task 26e's
  state after the SSV callback lands server-side). (Lobby header gift button
  with a claimable badge and a Store-screen "Free coins" button open the
  Daily Rewards screen, whose rows call `LudoRewardedAdsState.watch`.)
- [x] Add `test/screens/daily_reward_screen_test.dart` and a rewarded-ad
  flow test using a fake ad SDK double (no real ad network calls in CI).
  (Also `test/net/ludo_ads_service_test.dart`,
  `test/state/ludo_rewarded_ads_state_test.dart`, goldens
  `test/goldens/daily_reward_screen_*.png`.)
- [x] Capture device evidence (physical device, serial `RZ8R32EAB7T`) of the
  daily reward calendar claim flow. Passed on the Samsung A52; evidence in
  `.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/26h/`
  (see `device-flow.md`).
- [ ] Capture device evidence of a full rewarded-ad watch using AdMob **test
  ads** in debug. NOT RUN: user skipped the ad-watch device test (2026-10-16); the debug phone could not load test ads ('Unable to obtain a JavascriptEngine', device Play services/WebView). Code paths are covered by unit/widget tests with a fake ad SDK. Re-run Part C of device-flow.md on a phone with working Google Play services before release (see task 29). The flow is written in
  `.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/26h/device-flow.md`.
- [x] Rewarded-ad daily caps (coins 5/day, diamonds 2/day) and the online
  free-play coin win cap (10/day) must be enforced with an atomic
  check-and-write in the economy store (same pattern as
  `recordXpClaimWithCap` from commit f755ac1), with concurrency tests
  firing simultaneous claims; a separate read-then-write is a failure.
  (`claimAdRewardWithCap`, `claimFreePlayWinWithCap`, and `claimDailyReward`
  on `LudoEconomyStore`; concurrency tests in `economy-capped-claims.test.ts`,
  `rewarded-ads-callback.test.ts`, `wallet-routes.test.ts`; Drizzle versions
  run under the per-subject advisory lock in one transaction.)

## Implementation Notes

- Extra files (small necessary additions): `economy-store-types.ts` (row/input
  types and the `LudoEconomyStore` interface moved out of `economy-store.ts`,
  re-exported from it, to stay under the 800-line limit),
  `economy-daily-reward.ts`, `economy-drizzle-store-capped.ts`,
  `free-play-reward.ts`, `vortex-pass.ts`, `admob-ssv.ts`,
  `rewarded-ads-routes.ts`; new table `ludo_free_play_win_claims` with
  migration `packages/db/migrations/0010_silly_joystick.sql` (generated only,
  never applied); a gated Postgres concurrency test
  `economy-drizzle-capped-postgres.test.ts` (NOT RUN without
  `LUDO_TEST_DATABASE_URL`); Dart `ludo_ads.dart`, `ludo_rewards_models.dart`,
  `ludo_preview_rewards.dart` (debug preview rewards + `PreviewServerCreditAdSdk`),
  `daily_reward_launcher.dart`, `ludo_daily_reward_state.dart`,
  `ludo_rewarded_ads_state.dart`, `ludo_daily_reward_widgets.dart`;
  the `ludo` registry entry enables the `ads` capability
  (`scripts/games/registry-games.ts`, `game.config.json`, required by
  `games:validate` once `google_mobile_ads` is bundled); two new env vars in
  `docs-internal/setup/02-env-vars.md`.
- The task text lists `POST` for the callback; AdMob itself only issues GET
  requests to a configured SSV URL, so the route answers both.
- The online free-play win reward (50 coins, 10/day) existed only as config
  values; it is now paid from `settleCoinStakeMatch` (finished free-play match,
  human winner, per-match idempotent) through the atomic capped claim.
- The daily reward claim was a read-then-write; it is now the atomic
  `claimDailyReward`, and it now applies the +50% Vortex Pass bonus (the
  config value was never applied before).
- Underage tagging is not applicable in v1: onboarding collects only a name and
  an avatar, no age signal.
- Not done (console/human steps, NOT RUN): AdMob app and ad unit creation,
  enabling SSV with the callback URL, real `LUDO_ADMOB_*` values (task 26i/29).
  iOS has no `GADApplicationIdentifier` (ludo is Android-first in the
  registry).
- No 26f art is used here: the screen is code-drawn (Material icons for the
  currency glyphs, matching the 26g store).

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
  Daily reward claim: captured. Rewarded-ad watch: NOT RUN: user skipped the ad-watch device test (2026-10-16); the debug phone could not load test ads ('Unable to obtain a JavascriptEngine', device Play services/WebView). Code paths are covered by unit/widget tests with a fake ad SDK. Re-run Part C of device-flow.md on a phone with working Google Play services before release (see task 29).
- Rewarded-ad daily caps (coins 5/day, diamonds 2/day) and the online
  free-play coin win cap (10/day) are enforced with an atomic
  check-and-write in the economy store — the same pattern as
  `recordXpClaimWithCap` (commit f755ac1), not a separate read-then-write
  — verified by a concurrency test that fires simultaneous claims against
  the same cap and asserts only the cap's worth of claims are credited.

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
