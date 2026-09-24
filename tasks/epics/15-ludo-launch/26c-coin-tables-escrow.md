---
epic: 15-ludo-launch
task: 26c-coin-tables-escrow
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26b-wallet-progression-service]
estimate: L
---

# Coin-stake tables, match-start escrow, and payout/refund

## Goal

Add coin-stake tiers to matchmaking/rooms, debit entry fees into escrow at
match start, pay out winners per the approved 2p/4p rules at match
resolution, and refund escrow on abort/timeout — integrated with task 18's
command service and task 19's timeout handling.

## Context/Decisions

- Tiers, from task 26a's config: Low 500 / Mid 2,000 / High 10,000 coin
  entry, 5% rake, applied identically regardless of seat count.
- **2-player payout**: winner takes the full pot minus rake
  (`pot * 0.95`), loser gets nothing back.
- **4-player payout**: 1st place gets 70% of the pot, 2nd place gets 25% of
  the pot, the remaining 5% is the rake (3rd/4th get nothing back). Verify
  this nets to the config's documented rake percentage before wiring
  payout logic — task 26a's config field names must already disambiguate
  whether 70%/25% are taken from the gross pot or the post-rake pot; use
  whichever task 26a settled on and do not re-derive it here.
- Escrow lifecycle, using task 26a's `ludo_coin_table_escrow` table and
  task 18's `LudoStore.transact()` pattern: on `createMatch`/`joinMatch`
  for a coin-stake table (extend task 18's `matchOrigin: "matchmaking"`/
  `"room"` paths, not the free-play path), debit each seated player's entry
  fee (`ludo_wallet_transactions` reason `match_entry_fee`) and create an
  escrow row with `status: "held"` in the same transaction as match
  creation — a player with insufficient balance must be rejected before
  the match is created, not mid-match.
- On match resolution (`processCommand` reaching `finished` with a
  winner), credit payouts (reason `match_reward`) and rake (reason
  `admin_grant`-style ledger row or a dedicated `rake` reason — pick one
  and use it consistently) in the same transaction that marks the match
  finished, set escrow `status: "paid_out"`.
- On abort/timeout before resolution (task 19's timeout sweeper, or an
  explicit abort path if one exists), refund each player's entry fee in
  full (reason `refund`), set escrow `status: "refunded"` — integrate with
  task 19's Cron sweeper so an abandoned coin-stake match cannot leave
  funds stuck in escrow indefinitely.
- Concurrency: two simultaneous resolution attempts for the same match
  (e.g. a duplicate command and the timeout sweeper racing) must not
  double-pay or double-refund — reuse task 18's idempotency-key discipline
  and add an explicit test for this race.
- Offline/local modes never touch coin-stake tables (task 26a's decision) —
  this task only wires the online match-creation and command-service paths.

## Implementation Checklist

- [ ] Extend `packages/api/src/games/ludo/service.ts`'s `createMatch`/
  `joinMatch` with an optional `coinTier` parameter: validates seat
  balances, debits entry fees, creates the escrow row, all inside the
  existing creation transaction.
- [ ] Extend `processCommand`'s match-finished transition to credit payouts
  and rake per the 2p/4p rules above, marking escrow `paid_out`, in the
  same transaction as the finish.
- [ ] Add a refund path callable from task 19's timeout sweeper (or extend
  it directly if task 19's sweeper module is the right integration point —
  read `packages/api/src/games/ludo/` task 19's sweeper file before
  choosing where this lives) crediting refunds and marking escrow
  `refunded`.
- [ ] Extend `packages/api/src/games/ludo/matchmaking-service.ts`/rooms
  service (tasks 20/21) call sites so a coin-stake ticket/room passes
  `coinTier` through to `createMatch` rather than duplicating the escrow
  transaction logic.
- [ ] Add `packages/api/src/games/ludo/coin-tables.test.ts` covering: 2p
  payout math, 4p 70/25 payout math (asserting the rake nets to 5% of
  pot), insufficient-balance rejection before match creation, refund on a
  simulated timeout, and a concurrency test proving two simultaneous
  resolution/refund attempts for the same match never double-pay or
  double-refund.

## Files Touched

- `packages/api/src/games/ludo/service.ts`
- `packages/api/src/games/ludo/matchmaking-service.ts` (or task 20/21's
  actual filename — wire the coin-tier pass-through)
- `packages/api/src/games/ludo/routes.ts` (accept `coinTier` on the
  relevant create/matchmaking routes)
- `packages/api/src/games/ludo/coin-tables.test.ts`

## Acceptance Criteria (objective)

- A completed 2-player coin-stake match credits the winner exactly
  `pot * 0.95`, verified by a test.
- A completed 4-player coin-stake match credits 1st place 70% of pot and
  2nd place 25% of pot, with the remaining 5% unaccounted-for by any
  player credit (i.e. rake), verified by a test.
- A player with insufficient balance cannot create/join a coin-stake match;
  no escrow row or debit occurs, verified by a test.
- A timed-out coin-stake match refunds every seated player's entry fee in
  full, verified by a test.
- Two simultaneous resolution/refund attempts for the same match never
  double-pay or double-refund, verified by a concurrency test.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- coin-tables.test.ts`
- `bun run check`

## Out of Scope

- RevenueCat/IAP (task 26d).
- Client-side coin-table UI (task 26g's store screen and task 26e's HUD
  only surface balances/results — the tier-selection UI itself belongs to
  whichever matchmaking UI task in the online-lobby chain already covers
  mode/tier selection; this task is backend-only).
- Free-play (no-stake) online match rewards — already covered by task
  26b's `applyXpAndLevelRewards`/task 26a's flat free-play reward, not
  duplicated here.

## Commit message

`feat(ludo): add coin-stake tables, match-start escrow, and payout/refund [15-ludo-launch/26c]`
