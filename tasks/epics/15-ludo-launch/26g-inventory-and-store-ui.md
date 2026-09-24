---
epic: 15-ludo-launch
task: 26g-inventory-and-store-ui
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26f-economy-art-session]
estimate: L
---

# Store and inventory UI, purchases_flutter integration

## Goal

Add the store screen (dice/tokens/boards/currency packs/pass tabs), theme
preview, buy-with-coins-or-diamonds and buy-with-real-money flows via the
server and `purchases_flutter`, equip/inventory management, and offerings/
purchase/restore/sync wiring — with a graceful no-op when RevenueCat keys
are absent.

## Context/Decisions

- Store screen tabs: Dice, Tokens, Boards, Currency Packs, Pass — matching
  task 26a's catalog categories. Each tab lists items from
  `GET inventory`'s catalog+ownership response (task 26b/26e), shows owned
  vs. purchasable state, and a preview (dice roll animation / token on
  board / board background swap) before buying.
- Coin/diamond purchases (theme items): call a new-or-existing server spend
  endpoint — if task 26b did not add one (it only added claim/grant
  routes), add `POST /:environment/inventory/purchase` here on
  `packages/api/src/games/ludo/routes.ts`, debiting the item's coin/diamond
  price from the wallet and inserting a `ludo_inventory` row, transactional
  and rejecting on insufficient balance — this is a small, self-contained
  backend addition scoped to this task, not a re-opening of task 26b's
  scope.
- Real-money purchases (currency packs, Starter Pack, Vortex Pass): use
  `purchases_flutter`'s offerings/packages, `purchasePackage`, and
  `restorePurchases`, mirroring `apps/native/contexts/RevenueCatContext
  .tsx`'s provider shape and `apps/native/services/revenuecat.ts`'s
  `Purchases.logIn(ourUserId)`-after-auth pattern (log in with the
  Firebase-UID-derived subject from task 24's auth controller, not an
  anonymous RevenueCat id). Confirm whether `apps-native/games/ludo` is a
  linked package under `apps-native/flutter-app`'s host app (which already
  depends on `purchases_flutter` and initializes it in `main.dart` per
  research.md section 3) or standalone — reuse the host's already-
  initialized instance if linked, otherwise initialize independently.
- Graceful no-op: if RevenueCat API keys are absent at build time (same
  guarded-config discipline as task 24's Firebase init), the real-money
  tabs show a "store unavailable" state instead of crashing; coin/diamond
  purchases keep working since they don't depend on RevenueCat.
- After any successful real-money purchase or `restorePurchases()` call,
  call task 26d's `POST /:environment/revenuecat/sync` to reconcile server-
  side entitlement state rather than trusting the client-local purchase
  result.
- Equip: selecting an owned theme item updates local display state
  immediately (optimistic, per research.md section 4) and persists the
  choice via the same local-persistence mechanism task 11 uses, with no
  server round-trip required for equipping (equip is not a spend — only
  purchase is).
- Theme rendering: read slots from task 26f's art manifest first, falling
  back to the existing code-drawn theme rendering (task 12c) for any slot
  task 26f did not finish — the store/inventory UI must render correctly
  either way, do not hard-require finished art.

## Implementation Checklist

- [ ] Add `POST /:environment/inventory/purchase` (coin/diamond spend) to
  `packages/api/src/games/ludo/routes.ts` if task 26b did not already add
  it; add its backend test alongside task 26b's route tests.
- [ ] Add `purchases_flutter` dependency (if not already present via the
  host app) and guarded initialization, following task 24's pattern.
- [ ] Create `lib/src/screens/store_screen.dart`: tabbed Dice/Tokens/
  Boards/Currency Packs/Pass UI, preview, buy actions.
- [ ] Create `lib/src/state/ludo_inventory_state.dart`: owned items, equip
  selection, local persistence.
- [ ] Wire offerings/purchase/restore/sync through `purchases_flutter` and
  task 26d's sync endpoint.
- [ ] Add a "store unavailable" fallback state for RevenueCat-keys-absent
  builds.
- [ ] Add `test/screens/store_screen_test.dart` covering: coin/diamond
  purchase success and insufficient-balance rejection, equip selection
  persists, and the RevenueCat-absent fallback renders without crashing.
- [ ] Add `test/net/ludo_gateway_test.dart` cases (extend task 24's file)
  for the new `inventory/purchase` route.
- [ ] Add goldens for the store screen (each tab, owned vs. purchasable
  states, RevenueCat-absent fallback) and capture device evidence on the
  physical device (serial `RZ8R32EAB7T`) of a full coin-purchase-then-equip
  flow.

## Files Touched

- `packages/api/src/games/ludo/routes.ts` (inventory purchase route, if
  needed)
- `apps-native/games/ludo/pubspec.yaml` (purchases_flutter, if not already
  present)
- `apps-native/games/ludo/lib/src/screens/store_screen.dart`
- `apps-native/games/ludo/lib/src/state/ludo_inventory_state.dart`
- `apps-native/games/ludo/test/screens/store_screen_test.dart`
- `apps-native/games/ludo/test/net/ludo_gateway_test.dart` (extended)
- `apps-native/games/ludo/test/goldens/store_screen*.png` (new goldens)

## Acceptance Criteria (objective)

- A coin/diamond purchase debits the correct amount and adds the item to
  inventory, verified by a test; an insufficient-balance purchase is
  rejected with no partial debit.
- Equipping an owned theme persists across a simulated app restart,
  verified by a test.
- With RevenueCat keys absent, the store screen renders a fallback state
  instead of crashing, verified by a test.
- Device evidence of a full coin-purchase-then-equip flow exists under
  `.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/`.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- routes.test.ts`
- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- `bun run games:run -- --app ludo --device-id RZ8R32EAB7T`
- `bun run check`

## Out of Scope

- Rewarded ads and daily rewards UI (task 26h).
- Compliance/policy docs and provisioning (task 26i).
- Actually configuring RevenueCat products in the dashboard (deferred to
  provisioning, per task 26i's runbook).

## Commit message

`feat(ludo): add store and inventory UI with purchases_flutter integration [15-ludo-launch/26g]`
