---
epic: 15-ludo-launch
task: 26a-economy-config-and-schema
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26-online-lobby-ui]
estimate: L
---

# Economy design doc, versioned config, and wallet/ledger schema

## Goal

Write the Ludo Vortex economy design doc, add a versioned server-side
economy config carrying every approved number, and add the Drizzle tables
(append-only ledger, balances, inventory/entitlements, catalog,
progression/XP, daily reward state, ad reward claims, coin-table escrow)
that every later 26x task builds on.

## Context/Decisions

This task implements the economy **approved by the user on 2026-09-25**,
using `.agents/resources/2026-09-25/ludo-vortex-economy/research.md`
section 6 as the base numbers, with these binding corrections — do not use
research.md's numbers where they conflict with this list:

- **XP is earned in every mode**, including offline vs-computer and
  pass-and-play (research.md section 4 recommended no offline rewards at
  all — that recommendation is overridden for XP specifically, coins are
  still online-only). XP earned offline is **daily-capped** and is synced
  to/claimed via the server (client accumulates a local pending-XP count
  per session; task 26b's claim endpoint applies the daily cap and a basic
  replay-sanity check — e.g. XP claimed cannot exceed what a plausible
  number of completed matches in the elapsed wall-clock time could produce
  — before crediting).
- **Coins are earned only through server-verifiable online events**: online
  match wins, daily login claim, rewarded ads, level-ups, and the one-time
  starter grant. No coins for offline/local play.
- **Online coin-stake tables**: Low 500 / Mid 2,000 / High 10,000 entry fee,
  5% rake. 2-player: winner takes pot minus rake. 4-player: 1st place gets
  70% of pot, 2nd place gets 25% of pot (the remaining 5% is the rake — 70 +
  25 + 5 = 100% of the entry pool before rake is netted out; store this as
  "70%/25% of the post-rake pot" or "70%/25% of gross pot with rake netted
  separately" — pick one and make the config field names self-documenting
  so task 26c cannot misinterpret which base the percentages apply to).
- **No "Remove Ads" product.** Drop it from the IAP catalog entirely — this
  repo is rewarded-ads-only already, so there is nothing to remove.
- **XP table must match `xp_required(level) = 100 * level^1.6` rounded to
  the nearest 10** — research.md's section 6 table does NOT match this
  formula (it used a different, uncredited curve) and must be recomputed,
  not copied. Reference values computed for this task (verify
  programmatically, do not hand-copy — these are provided so an
  implementer can sanity-check their own computed table):
  `xp_required(1)=100`, `(2)=300`, `(3)=580`, `(4)=920`, `(5)=1310`,
  `(6)=1760`, `(7)=2250`, `(8)=2790`, `(9)=3360`, `(10)=3980`, `(15)=7620`,
  `(20)=12070`, `(25)=17250`, `(30)=23090`, `(40)=36590`, `(50)=52280`.
  Implement the curve as a **function**, not a hardcoded per-level table, so
  it can be verified against the formula directly in a test.
- **Vortex Pass** (monthly subscription) is kept, per research.md section 6:
  +50% daily reward, 1 free theme/month, exclusive dice skin, ₹199/mo /
  $3.99/mo.
- **Theme catalog**: 6 dice themes, 4 token themes, 3 board themes, exactly
  as listed in research.md section 6 (Default free in each category; dice
  1,500 coins/30 diamonds; tokens 2,500 coins/50 diamonds; boards
  diamond-only at 80 diamonds, no coin price).
- **IAP layer**: RevenueCat (`purchases_flutter`) → Google Play Billing now,
  StoreKit later. Never Apple Pay for digital goods. IAP product list
  (starter pack, coin S/M/L, diamond S/M/L, Vortex Pass) mirrors research.md
  section 6 minus the removed Remove-Ads product.
- **Ads**: rewarded only (AdMob + Google UMP consent + server-side
  verification). Caps: 5 coin-rewarded ads/day, 2 diamond-rewarded ads/day.
- **Ledger discipline**: server-authoritative, append-only. No handler ever
  writes a balance column directly from a request; balance is derived from
  `SUM(delta)` and denormalized into a summary row updated in the same
  transaction as the ledger insert, following
  `packages/api/src/games/merge-relay/commerce-service.ts`'s idempotency
  pattern (hash-based idempotency key, transactional read-then-write) and
  `packages/db/src/schema.ts`'s `mergeRelayScopes`/`mergeRelayRecords`
  style for table conventions (scoping columns, `check`/`uniqueIndex`
  constraints) — but use purpose-built tables for the ledger per
  research.md section 3's recommendation (b), not the generic artifact
  table.
- **Coins are never cashable** — no withdrawal/cash-out path exists or is
  ever added; state this explicitly in the design doc's policy section
  (task 26i expands on this for the compliance docs, this task only needs
  the one-sentence statement + no code path that could imply otherwise).
- **Config must be versioned**: every number in this doc (XP formula
  constants, coin amounts, rake, IAP prices, ad caps, daily reward
  calendar, theme prices) lives in one server-side config module with an
  explicit `version` field, read by every later 26x task rather than any
  task hardcoding a number independently. A currently-active match/session
  should be able to keep using the config version it started under even if
  the config is bumped mid-flight (design for this now; a full "pin config
  version per match" mechanism can be minimal — e.g. store the config
  version on the match row already added by task 16 or a new column here —
  but the config module itself must support returning a specific historical
  version, not just "the latest").

## Implementation Checklist

- [ ] Write `docs-internal/gaming/ludo-economy.md`: currencies, sources/
  sinks tables, starting balances, coin-stake table, XP curve + formula +
  reference values above, IAP product list (no Remove Ads), Vortex Pass,
  theme catalog (6/4/3), rewarded-ad caps, daily reward calendar, the
  "coins never cashable" statement, and a short "what changed vs.
  research.md section 6" note listing every correction above so the
  provenance is traceable.
- [ ] Create `packages/api/src/games/ludo/economy-config.ts`: a versioned
  config object/module (e.g. `LUDO_ECONOMY_CONFIG_V1`) typed with every
  number from the doc, a `getEconomyConfig(version?: number)` accessor
  defaulting to latest, and the XP curve as an exported function
  `xpRequiredForLevel(level: number): number` implementing the formula
  (not a lookup table).
- [ ] Add `packages/api/src/games/ludo/economy-config.test.ts` asserting
  `xpRequiredForLevel` matches every reference value listed above, the coin
  table's payout math nets to the documented rake percentage for both 2p
  and 4p splits, and the config has no "Remove Ads"-named product.
- [ ] Add the Drizzle tables to `packages/db/src/schema.ts`, following
  `mergeRelayScopes`/`mergeRelayRecords`'s conventions (scoping columns,
  `check`/`uniqueIndex`), all scoped by `(app_id, environment, subject)`
  matching task 16's `ludo_players` scoping:
  - `ludo_wallet_transactions`: append-only, `id` (uuid pk), scoping
    columns, `subject`, `currency` (`coins`/`diamonds`), `delta` (signed
    int), `balance_after`, `reason` (enum matching the doc's source/sink
    list), `source_ref`, `idempotency_key` (unique per scope+subject),
    `created_at`.
  - `ludo_balances`: summary table, primary key `(app_id, environment,
    subject, currency)`, `balance`, `updated_at` — written only inside the
    same transaction as a `ludo_wallet_transactions` insert.
  - `ludo_inventory`: owned cosmetics/entitlements, primary key `(app_id,
    environment, subject, item_id)`, `item_type` (`dice`/`token`/`board`/
    `pass`), `acquired_via`, `acquired_at`.
  - `ludo_catalog`: product/cosmetic definitions, primary key `(app_id,
    environment, item_id)`, `item_type`, `display_name`, `price_coins`
    (nullable), `price_diamonds` (nullable), `config_version`.
  - `ludo_progression`: primary key `(app_id, environment, subject)`,
    `xp`, `level` (denormalized, recomputed from `xp` on write), `updated_at`.
  - `ludo_daily_reward_state`: primary key `(app_id, environment,
    subject)`, `last_claim_date` (date, UTC), `streak_day` (1-7),
    `updated_at`.
  - `ludo_ad_reward_claims`: idempotency/cap ledger for rewarded ads,
    primary key `(app_id, environment, subject, ad_transaction_id)`,
    `reward_type` (`coins`/`diamonds`), `claim_date` (date, UTC, for daily
    cap counting), `created_at`.
  - `ludo_coin_table_escrow`: primary key `(app_id, environment, match_id)`,
    `tier` (`low`/`mid`/`high`), `pot`, `rake`, `status`
    (`held`/`paid_out`/`refunded`), `created_at`, `resolved_at`.
- [ ] Run `cd packages/db && DATABASE_URL=postgresql://migration-generator.invalid/ludo bun run db:generate` and check in the generated migration (do not `db:push`).
- [ ] Create `packages/api/src/games/ludo/economy-store.ts` (memory
  implementation) and `packages/api/src/games/ludo/economy-drizzle-store.ts`
  (targeted per-row upserts, no whole-scope rewrite — same discipline as
  task 16's `LudoStore`), each exposing ledger-append + balance-read +
  inventory/progression/daily-reward/ad-claim/escrow operations.
- [ ] Add `packages/api/src/games/ludo/economy-store.test.ts` covering the
  ledger invariant: for every subject/currency, `SUM(delta)` across
  `ludo_wallet_transactions` always equals the corresponding
  `ludo_balances.balance` row, including after a simulated concurrent
  double-write attempt with the same idempotency key (must not double
  apply).

## Files Touched

- `docs-internal/gaming/ludo-economy.md`
- `packages/api/src/games/ludo/economy-config.ts`
- `packages/api/src/games/ludo/economy-config.test.ts`
- `packages/db/src/schema.ts`
- `packages/db/drizzle/*` (generated migration, new file)
- `packages/api/src/games/ludo/economy-store.ts`
- `packages/api/src/games/ludo/economy-drizzle-store.ts`
- `packages/api/src/games/ludo/economy-store.test.ts`

## Acceptance Criteria (objective)

- `xpRequiredForLevel` matches the formula `100 * level^1.6` rounded to the
  nearest 10 for every reference level listed in Context, verified by a
  passing test.
- The economy config contains no product named or described as removing
  ads.
- The ledger invariant (`SUM(delta) == balance`) holds after a duplicate-
  idempotency-key write attempt, verified by a passing test with no real
  database required.
- `db:generate` produces a checked-in, unapplied migration; no `db:push`
  was run against a real database.
- `docs-internal/gaming/ludo-economy.md` exists with real numbers (not
  placeholders) for every category in Context, and explicitly lists the
  corrections made vs. research.md section 6.

## Verification Commands

- `cd packages/db && bun run typecheck`
- `cd packages/db && DATABASE_URL=postgresql://migration-generator.invalid/ludo bun run db:generate`
- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- economy-config.test.ts economy-store.test.ts`
- `bun run check`
- `bun run check:doc-paths`
- `bun run check:staged-docs`

## Out of Scope

- HTTP routes for wallet/progression (task 26b).
- Coin-table match integration (task 26c).
- RevenueCat webhook handling (task 26d).
- Any client-side code (tasks 26e/26g/26h).
- Applying the migration to a real database.

## Commit message

`feat(ludo): add economy design doc, versioned config, and wallet/ledger schema [15-ludo-launch/26a]`
