import { localDateKey, type SaveStore } from "@web-games/kit";
import { dailyId } from "@web-games/lantern-loops-core";
import { defaults, type Profile } from "../save/profile";
import type { RunsStore } from "../save/runs";
import {
  completeArchive,
  completeDaily,
  completePuzzle,
  type DailyResult,
  type HintResult,
  type OpenResult,
  type PuzzleResult,
  refreshOnOpen,
  type SolveInput,
  type Step,
  spendHint,
} from "./progression-rules";

export type Clock = () => Date;
export type ProfileListener = (profile: Readonly<Profile>) => void;

export interface Progression {
  /** The profile as last loaded or written. Call `load` once at start-up. */
  current(): Readonly<Profile>;
  load(): Promise<Readonly<Profile>>;
  completePuzzle(id: string, input: SolveInput): Promise<PuzzleResult>;
  completeDaily(input: SolveInput): Promise<DailyResult>;
  completeArchive(dateKey: string, input: SolveInput): Promise<DailyResult>;
  spendHint(): Promise<HintResult>;
  refreshOnOpen(): Promise<OpenResult>;
  /** Changes a stored preference or flag (settings screen, onboarding). */
  patch(change: Partial<Profile>): Promise<Readonly<Profile>>;
  /** Wipes the save back to a fresh profile (the settings reset). */
  reset(): Promise<Readonly<Profile>>;
  subscribe(listener: ProfileListener): () => void;
}

export interface ProgressionOptions {
  store: SaveStore<Profile>;
  now: Clock;
  runs?: RunsStore;
}

export function createProgression(options: ProgressionOptions): Progression {
  const { store, now, runs } = options;
  let current: Profile | null = null;
  const listeners = new Set<ProfileListener>();

  const publish = (profile: Profile): void => {
    current = profile;
    for (const listener of [...listeners]) listener(profile);
  };

  async function apply<R>(step: (profile: Profile) => Step<R>): Promise<R> {
    let result: R | undefined;
    const next = await store.update((profile) => {
      const done = step(profile);
      result = done.result;
      return done.profile;
    });
    publish(next);
    return result as R;
  }

  return {
    current: () => current ?? defaults(),
    async load() {
      const loaded = (await store.load()).data;
      publish(loaded);
      return loaded;
    },
    async completePuzzle(id, input) {
      const result = await apply((p) => completePuzzle(p, id, input));
      await runs?.remove(id);
      return result;
    },
    async completeDaily(input) {
      const today = localDateKey(now());
      const result = await apply((p) => completeDaily(p, today, input));
      await runs?.remove(dailyId(today));
      return result;
    },
    async completeArchive(dateKey, input) {
      const today = localDateKey(now());
      const result = await apply((p) => completeArchive(p, today, dateKey, input));
      await runs?.remove(dailyId(dateKey));
      return result;
    },
    spendHint: () => apply((p) => spendHint(p)),
    refreshOnOpen: () => apply((p) => refreshOnOpen(p, localDateKey(now()))),
    async patch(change) {
      const next = await store.update((profile) => ({ ...profile, ...change }));
      publish(next);
      return next;
    },
    async reset() {
      const fresh = await store.reset();
      await runs?.clear();
      publish(fresh);
      return fresh;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
