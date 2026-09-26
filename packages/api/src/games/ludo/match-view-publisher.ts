/// Realtime fanout (task 22): after every committed, state-changing Ludo
/// transaction, `service.ts` mirrors a denormalized `LudoMatchView` out to
/// this interface, never from inside the transaction itself, so a fanout
/// failure (Firestore outage, network error, ...) can never block or roll
/// back a match command — see `service.ts`'s `publishMatchView` for the
/// try/catch that enforces this.
import type { LudoEnvironment, LudoMatchView } from "./contracts";

export interface MatchViewPublisher {
  publish(
    appId: string,
    environment: LudoEnvironment,
    matchId: string,
    view: LudoMatchView,
  ): Promise<void>;
}

/** One recorded `publish()` call, in call order — what tests assert against. */
export interface RecordedMatchView {
  appId: string;
  environment: LudoEnvironment;
  matchId: string;
  view: LudoMatchView;
}

/**
 * Test fake: records every `publish()` call in memory. This is distinct
 * from `NullMatchViewPublisher` below — tests use this one specifically to
 * assert that a command triggered exactly one publish with the expected
 * view; production's "Firestore unconfigured" path uses the null one.
 */
export class InMemoryMatchViewPublisher implements MatchViewPublisher {
  readonly calls: RecordedMatchView[] = [];

  async publish(
    appId: string,
    environment: LudoEnvironment,
    matchId: string,
    view: LudoMatchView,
  ): Promise<void> {
    this.calls.push({ appId, environment, matchId, view });
  }

  /** The most recently published view for `matchId`, or `null` if none was published. */
  latestFor(matchId: string): LudoMatchView | null {
    for (let i = this.calls.length - 1; i >= 0; i--) {
      if (this.calls[i].matchId === matchId) return this.calls[i].view;
    }
    return null;
  }
}

/**
 * Production fallback when Firebase Admin configuration is absent (see
 * `resolveMatchViewPublisher()` in `dependencies.ts`): silently absorbs
 * every publish. Unlike `firebase/admin.ts`'s `getFirebaseAdmin()` (which
 * fails loud for auth), a missing Firestore config must never crash the
 * Ludo command path — offline/local dev and the client's offline-first
 * modes keep working through the `GET .../state` polling route alone.
 */
export class NullMatchViewPublisher implements MatchViewPublisher {
  async publish(): Promise<void> {
    // Intentional no-op.
  }
}
