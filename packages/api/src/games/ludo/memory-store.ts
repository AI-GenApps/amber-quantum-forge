import type { LudoEnvironment } from "./contracts";
import { cloneLudoState, emptyLudoState, type LudoState, type LudoStore } from "./store";

/**
 * In-process store keyed by environment, matching
 * `merge-relay/memory-store.ts`'s concurrency-safe read/transact pattern:
 * a single-flight promise tail per environment serializes concurrent
 * `transact` calls against the same scope while `read` never blocks on it.
 */
export class InMemoryLudoStore implements LudoStore {
  private readonly states = new Map<LudoEnvironment, LudoState>();
  private readonly tails = new Map<LudoEnvironment, Promise<void>>();

  constructor(initial?: Partial<Record<LudoEnvironment, LudoState>>) {
    for (const environment of ["debug", "staging", "production"] as const) {
      const state = initial?.[environment];
      if (state) this.states.set(environment, cloneLudoState(state));
    }
  }

  async read<T>(
    environment: LudoEnvironment,
    operation: (state: LudoState) => Promise<T>,
  ): Promise<T> {
    const state = this.states.get(environment) ?? emptyLudoState();
    return operation(cloneLudoState(state));
  }

  async transact<T>(
    environment: LudoEnvironment,
    operation: (state: LudoState) => Promise<T>,
  ): Promise<T> {
    const previous = this.tails.get(environment) ?? Promise.resolve();
    let result!: T;
    const current = previous
      .then(
        () => undefined,
        () => undefined,
      )
      .then(async () => {
        const original = this.states.get(environment) ?? emptyLudoState();
        const working = cloneLudoState(original);
        result = await operation(working);
        this.states.set(environment, working);
      });
    const tail: Promise<void> = current.then(() => undefined).catch(() => Promise.resolve());
    this.tails.set(environment, tail);
    await current;
    if (this.tails.get(environment) === tail) this.tails.delete(environment);
    return result;
  }

  snapshot(environment: LudoEnvironment): LudoState {
    return cloneLudoState(this.states.get(environment) ?? emptyLudoState());
  }
}
