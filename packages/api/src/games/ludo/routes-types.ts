import type { GameTokenVerifier } from "../tokens";
import type { LudoEconomyStore } from "./economy-store";
import type { MatchViewPublisher } from "./match-view-publisher";
import type { LudoStore } from "./store";

/**
 * Shared dependency shape for the Ludo route modules (`routes.ts` and
 * `wallet-routes.ts`), split into its own file so neither route module
 * needs to import the other just for this type.
 */
export interface LudoRouteDependencies {
  signSessionToken: (environment: string, subject: string) => Promise<string>;
  verifyGameToken: GameTokenVerifier;
  store: LudoStore;
  /**
   * Task 22's realtime fanout. Optional so existing call sites/tests that
   * do not care about fanout keep compiling unchanged; `createLudoRoutes`
   * falls back to a `NullMatchViewPublisher` (no-op) when omitted.
   */
  matchViewPublisher?: MatchViewPublisher;
  /** Task 26b's wallet/progression/inventory store. Optional for the same
   * reason as `matchViewPublisher`: existing tests that only exercise
   * match/room/matchmaking routes keep compiling with an in-memory
   * fallback. */
  economyStore?: LudoEconomyStore;
}
