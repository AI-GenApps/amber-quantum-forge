/// Shared types between `service.ts` and `coin-stake.ts`, split out to avoid
/// a circular import between the two (`service.ts` calls into
/// `coin-stake.ts`'s helpers, which need `LudoServiceDependencies`'s shape).
import type { LudoMatchState as WireMatchState } from "./contracts";
import type { LudoDiceSource } from "./dice";
import type { LudoEconomyConfig } from "./economy-config";
import type { LudoEconomyStore } from "./economy-store";
import type { MatchViewPublisher } from "./match-view-publisher";

export interface LudoCommandResult {
  matchState: WireMatchState;
  idempotent: boolean;
}

/**
 * Optional overrides for every state-changing service function.
 * `diceSource` is production-omitted (real `CsprngDiceSource`) and
 * test-injected (`ScriptedDiceSource`/`FunctionDiceSource`, see `dice.ts`)
 * to drive a match deterministically end-to-end. `matchViewPublisher` is
 * task 22's realtime fanout: when supplied, every committed transaction
 * below calls `publish()` with a fresh `LudoMatchView` after the commit;
 * when omitted, nothing is published (matching `NullMatchViewPublisher`'s
 * behavior without needing to construct one).
 */
export interface LudoServiceDependencies {
  diceSource?: LudoDiceSource;
  matchViewPublisher?: MatchViewPublisher;
  /** Task 26c's wallet/escrow store, required only for coin-stake tables
   * (`createMatch`/`joinMatch` with `coinTier` set, or resolving an existing
   * coin-stake match's escrow at finish/abandon). Free-play call sites that
   * never pass `coinTier` can omit this. */
  economyStore?: LudoEconomyStore;
  /** Overridable in tests; defaults to `getEconomyConfig()` (the latest
   * version), matching `progression-service.ts`'s identical pattern. */
  economyConfig?: LudoEconomyConfig;
}
