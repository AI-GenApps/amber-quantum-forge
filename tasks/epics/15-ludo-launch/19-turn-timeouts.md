---
epic: 15-ludo-launch
task: 19-turn-timeouts
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/18-command-service]
estimate: M
---

# Enforce turn timeouts: lazy checks, claim endpoint, and Cron sweeper

## Goal

Make ~30-second turn timers real: enforce them lazily on every read/command
against a match, add a client-facing "claim timeout" command, and add a
Vercel Cron sweeper for matches nobody is actively polling, following the
repo's existing Vercel Cron conventions (`apps/web/vercel.json`,
`CRON_SECRET`-protected route).

## Context/Decisions

- "Lazy enforcement on every read/command" means: before serving a `GET
  match state` or processing any command, the service (task 18's
  `service.ts`) checks whether `now > turn_deadline_at` for the active
  player's seat; if so, it applies a `turn_timed_out` transition (auto-pass
  if a legal move existed and wasn't taken, or a miss-count increment)
  *before* handling the original request, inside the same transaction. This
  guarantees correctness even if the sweeper never runs and no client ever
  calls the explicit claim route.
- "Claim timeout" is an explicit client command (`claim_timeout`, already
  named in task 15's `LudoCommand` union) any seated player may send once
  they observe `now > turn_deadline_at` on their own client clock — it
  performs exactly the same transition as the lazy check, is idempotent, and
  exists so an impatient/well-behaved client doesn't have to wait for its
  own next read to unstick a stalled opponent's turn.
- Forfeit rule: three consecutive missed phase deadlines (roll or move) for a
  seat forfeits that seat — remove its tokens from further play and, if only
  one seat remains active, that seat wins immediately; if all seats are
  forfeited, the match is marked `abandoned`. Reuse `ludo_players.miss_count`
  (task 16).
- No `apps/web/vercel.json` exists yet in this repo — create it. Follow
  Vercel's documented `crons` array shape (`path`, `schedule`) and protect
  the invoked route by checking a `CRON_SECRET` environment variable against
  the `Authorization: Bearer <CRON_SECRET>` header Vercel Cron sends (or an
  `x-vercel-cron` signal if the deployed Vercel version provides one —
  implementer confirms current Vercel Cron auth guidance and documents the
  chosen mechanism in the route's doc comment). Schedule: every minute
  (`* * * * *`) is the tightest Vercel Cron allows; document that this means
  a match can sit past its deadline for up to ~60s before the sweeper
  catches it if no client is polling, which is why the lazy check is the
  primary mechanism and the sweeper is a backstop.
- The sweeper route (`GET/POST /api/games/ludo/cron/sweep-timeouts`,
  mounted via the Hono app the same way other API routes reach
  `apps/web/app/api/[...route]/route.ts`) scans `ludo_matches` where
  `status = 'active' AND turn_deadline_at < now()` across all
  environments/apps it's configured to sweep, applying the same
  timeout-transition logic as the lazy path, batched and bounded (cap rows
  per invocation, matching the "bounded cursor" language used for Merge
  Relay's equivalent maintenance work).

## Implementation Checklist

- [ ] Add `applyTimeoutIfExpired(state, now)` to
  `packages/api/src/games/ludo/engine.ts` (or a new `timeout.ts`) —
  pure function, testable independent of the store.
- [ ] Call it at the top of `service.ts`'s `processCommand` and of the
  match-read path (extend task 18's `GET` route or add one if it does not
  yet exist) before any other logic.
- [ ] Add the `claim_timeout` command handler in `service.ts` calling the
  same function and returning the updated state.
- [ ] Add forfeit-after-three-misses and abandon-when-all-forfeited logic,
  covered by `packages/api/src/games/ludo/timeout.test.ts`.
- [ ] Create `apps/web/vercel.json` with a `crons` entry for
  `/api/games/ludo/cron/sweep-timeouts` on `* * * * *`.
- [ ] Add the sweeper route to `packages/api/src/games/ludo/routes.ts`
  (or a dedicated `cron-routes.ts` mounted alongside it), guarded by
  `CRON_SECRET` comparison with a fail-closed `401` when unset/mismatched.
- [ ] Add `packages/api/src/games/ludo/cron-sweep.test.ts` covering: an
  expired match gets swept, a non-expired match is untouched, the route
  rejects a missing/incorrect `CRON_SECRET`, and repeated sweeps of an
  already-swept match are idempotent (no duplicate `turn_timed_out` events).
- [ ] Document `CRON_SECRET` in the repo's env var reference (check
  `tasks/START.md`'s "Key environment variables" section or
  `docs-internal/setup/02-env-vars.md` for where new server env vars are
  recorded, and add it there).

## Files Touched

- `packages/api/src/games/ludo/engine.ts` (or new `timeout.ts`)
- `packages/api/src/games/ludo/service.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/api/src/games/ludo/timeout.test.ts`
- `packages/api/src/games/ludo/cron-sweep.test.ts`
- `apps/web/vercel.json` (new)
- `docs-internal/setup/02-env-vars.md` (or equivalent env var doc)

## Acceptance Criteria

- A match whose active seat's deadline has passed is auto-transitioned on
  the very next read or command against it, with no client action required.
- `claim_timeout` produces the identical result as the lazy path and is
  idempotent when called twice.
- Three consecutive missed deadlines for one seat forfeits it; the sweeper
  route requires a correct `CRON_SECRET` and is bounded (does not attempt to
  process unbounded rows in one invocation).
- `apps/web/vercel.json` validates as well-formed JSON with a `crons` entry
  pointing at the sweeper route.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`
- `bun run typecheck`

## Out of Scope

- Reconnect UX and client-side countdown rendering (tasks 24-26).
- Matchmaking ticket expiry (separate expiry handling in task 20).
- Any real Vercel Cron deployment/verification (that requires a live Vercel
  project — deferred to task 29's human checklist).

## Commit message

`feat(ludo): enforce turn timeouts with lazy checks, claim command, and cron sweeper [15-ludo-launch/19]`
