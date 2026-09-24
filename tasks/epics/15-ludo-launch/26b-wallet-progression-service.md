---
epic: 15-ludo-launch
task: 26b-wallet-progression-service
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26a-economy-config-and-schema]
estimate: L
---

# Wallet, profile, progression, and inventory HTTP routes

## Goal

Add the Hono routes that expose task 26a's ledger/progression schema to the
client: balances, level/XP, offline-XP claim, starter grant, daily login
claim, level-up rewards, and inventory listing — plus the analytics events
for each.

## Context/Decisions

- Mount routes under `packages/api/src/games/ludo/routes.ts` (extends the
  routes file from tasks 15/18/22), behind the same verified Ludo game
  token (task 15) used by match routes, with `subject` taken from the
  token exactly like task 18's command routes.
- `GET /:environment/wallet` returns `{ coins, diamonds }` from
  `ludo_balances`.
- `GET /:environment/profile` returns `{ level, xp, xpRequiredForNextLevel }`
  using task 26a's `xpRequiredForLevel`.
- `GET /:environment/inventory` returns owned `ludo_inventory` rows plus the
  full `ludo_catalog` so the client can render owned-vs-purchasable state in
  one call.
- `POST /:environment/xp/claim`: accepts a client-reported XP delta earned
  from **any** mode (online or offline — per task 26a's decision that XP is
  earned everywhere) plus a lightweight replay-sanity payload (elapsed
  wall-clock time since last claim, number of matches completed in that
  window). Server applies: (a) a **daily cap** on total XP claimable per
  subject per UTC day (read from task 26a's config), (b) a basic sanity
  check rejecting a claim whose elapsed-time/match-count combination is
  implausible (e.g. more XP than the maximum number of matches that could
  plausibly complete in the reported elapsed time, at a generous per-match
  ceiling — reject outright rather than silently clamping, so a legitimate
  client bug surfaces instead of being masked), (c) idempotency on a
  client-supplied claim id. A rejected claim must not partially credit XP.
- `POST /:environment/starter-grant`: one-time only per subject, idempotent
  (calling it twice never grants twice), credits the starting coins/
  diamonds/theme from task 26a's config via a `ludo_wallet_transactions`
  insert with `reason: "starter_grant"`.
- `POST /:environment/daily-reward/claim`: reads/writes
  `ludo_daily_reward_state`, enforces one claim per UTC day, advances the
  7-day streak or resets it on a missed day, credits coins (and diamonds on
  day 7) per task 26a's calendar.
- Level-up rewards: whenever an XP claim or match-reward credit (task 26c)
  causes `ludo_progression.level` to increase, credit the per-level coin
  bonus (and the every-5th-level diamond bonus / every-10th-level theme
  unlock) from task 26a's config in the **same transaction** as the XP
  update — implement this as a shared internal function
  (`applyXpAndLevelRewards`) callable from both this task's claim route and
  task 26c's match-resolution path, not duplicated logic.
- Analytics events: add `ludo_wallet_starter_granted`,
  `ludo_xp_claimed`, `ludo_level_up`, `ludo_daily_reward_claimed` to
  whatever server-side analytics emission pattern
  `packages/api/src/games/merge-relay/` already uses (check for an existing
  server-side analytics emitter before inventing a new one — if none
  exists server-side and analytics is client-only elsewhere in this repo,
  document that finding and scope this checklist item down to client-
  emitted events only, deferred to task 26e, rather than inventing a new
  server analytics path unsupported elsewhere).

## Implementation Checklist

- [ ] Add `GET /:environment/wallet`, `GET /:environment/profile`,
  `GET /:environment/inventory` to `packages/api/src/games/ludo/routes.ts`.
- [ ] Add `POST /:environment/xp/claim` with daily cap + replay-sanity
  check + idempotency, per Context.
- [ ] Add `POST /:environment/starter-grant`, idempotent per subject.
- [ ] Add `POST /:environment/daily-reward/claim` with streak logic.
- [ ] Implement `applyXpAndLevelRewards` in
  `packages/api/src/games/ludo/progression-service.ts`, called from the XP
  claim route (this task) and referenced (not yet called — task 26c wires
  the caller) from match-resolution for a future match-reward credit path.
- [ ] Confirm whether a server-side analytics emitter pattern exists in
  `packages/api/src/games/merge-relay/`; either wire the four events listed
  in Context through it, or document in this task's commit body that no
  server-side pattern exists and defer event emission to task 26e's
  client-side telemetry.
- [ ] Add `packages/api/src/games/ludo/wallet-routes.test.ts` covering:
  starter grant is idempotent across two calls, XP claim respects the daily
  cap (second claim past the cap is rejected, not clamped), XP claim
  rejects an implausible elapsed-time/match-count payload, daily reward
  claim enforces one-per-UTC-day and correctly resets/advances the streak,
  and a level-up triggered by an XP claim credits the correct coin/diamond/
  theme bonus in the same transaction (verified via the ledger, not just
  the returned response).

## Files Touched

- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/games/ludo/progression-service.ts`
- `packages/api/src/games/ludo/wallet-routes.test.ts`

## Acceptance Criteria (objective)

- Calling the starter-grant endpoint twice for the same subject credits
  currency exactly once, verified by a test asserting the ledger row count.
- An XP claim exceeding the daily cap is rejected (non-2xx or an explicit
  rejection field) and credits zero XP, verified by a test.
- An XP claim with an implausible elapsed-time/match-count payload is
  rejected outright, verified by a test.
- A level-up occurring inside an XP claim credits the documented coin bonus
  (and diamond/theme bonus where applicable) in the same transaction,
  verified by inspecting the resulting ledger rows in a test.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- wallet-routes.test.ts`
- `bun run check`

## Out of Scope

- Match-win coin credit and coin-table escrow (task 26c) — this task only
  builds the shared `applyXpAndLevelRewards` function they will call.
- RevenueCat/IAP grant paths (task 26d).
- Any client-side code (tasks 26e/26g/26h).

## Commit message

`feat(ludo): add wallet, profile, progression, and inventory routes [15-ludo-launch/26b]`
