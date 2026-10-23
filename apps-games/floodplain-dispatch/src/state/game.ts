import {
  applyCampaignResult,
  applyDailyResult,
  buyFreeze,
  buyHint,
  defaultProfile,
  type EconomyEvent,
  type Evaluation,
  FLAG_LIMIT,
  type HintKind,
  type Profile,
  type PurchaseFailure,
  type StarCount,
  themesUnlocked,
} from "@web-games/floodplain-dispatch-core";
import { daysBetween, type LoadStatus, type SaveStore, streakStep } from "@web-games/kit";

export interface GameState {
  ready: boolean;
  loadStatus: LoadStatus | null;
  saveFailed: boolean;
  profile: Profile;
}

export interface GameDeps {
  store: SaveStore<Profile>;
  clock: () => Date;
  localDateKey: (date: Date) => string;
}

export interface DailyOutcome {
  counted: boolean;
  dateKey: string;
  events: EconomyEvent[];
}

export type SpendOutcome =
  | { ok: true; events: EconomyEvent[] }
  | { ok: false; reason: PurchaseFailure };

export interface GameStore {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
  load(): Promise<LoadStatus>;
  recordCampaignResult(mapId: string, evaluation: Evaluation): Promise<EconomyEvent[]>;
  recordDailyResult(result: {
    stars: StarCount;
    score: number;
    spend?: number;
  }): Promise<DailyOutcome>;
  buyHint(kind: HintKind): Promise<SpendOutcome>;
  buyFreeze(): Promise<SpendOutcome>;
  selectTheme(themeId: string): Promise<boolean>;
  markFlag(name: string): Promise<void>;
  resetProgress(): Promise<void>;
  flush(): Promise<void>;
}

export function createGameStore(deps: GameDeps): GameStore {
  let state: GameState = {
    ready: false,
    loadStatus: null,
    saveFailed: false,
    profile: defaultProfile(),
  };
  const listeners = new Set<(next: GameState) => void>();
  const pending = new Set<Promise<unknown>>();

  const publish = (next: GameState): void => {
    state = next;
    for (const listener of [...listeners]) listener(state);
  };

  const track = <T>(job: Promise<T>): Promise<T> => {
    pending.add(job);
    const done = (): void => void pending.delete(job);
    job.then(done, done);
    return job;
  };

  const change = <T>(edit: (profile: Profile) => { profile: Profile; value: T }): Promise<T> => {
    let value: T | undefined;
    let next: Profile | undefined;
    const job = deps.store
      .update((current) => {
        const result = edit(current);
        value = result.value;
        next = result.profile;
        return result.profile;
      })
      .then(
        (profile) => {
          publish({ ...state, profile, saveFailed: false });
          return value as T;
        },
        () => {
          if (next) publish({ ...state, profile: next, saveFailed: true });
          return value as T;
        },
      );
    return track(job);
  };

  const spend = (buy: (profile: Profile) => ReturnType<typeof buyFreeze>): Promise<SpendOutcome> =>
    change((profile) => {
      const result = buy(profile);
      if (!result.ok)
        return { profile, value: { ok: false, reason: result.reason } as SpendOutcome };
      return {
        profile: result.profile,
        value: { ok: true, events: result.events } as SpendOutcome,
      };
    });

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    async load() {
      const result = await track(deps.store.load());
      publish({ ready: true, loadStatus: result.status, saveFailed: false, profile: result.data });
      return result.status;
    },
    recordCampaignResult: (mapId, evaluation) =>
      change((profile) => {
        const applied = applyCampaignResult(profile, mapId, evaluation);
        return { profile: applied.profile, value: applied.events };
      }),
    recordDailyResult: (result) => {
      const dateKey = deps.localDateKey(deps.clock());
      return change((profile) => {
        const last = profile.daily.lastKey;
        const step = last === null ? "first" : streakStep(last, dateKey);
        const missedDays = last === null ? 0 : Math.max(0, daysBetween(last, dateKey) - 1);
        const applied = applyDailyResult(profile, {
          dateKey,
          step,
          missedDays,
          stars: result.stars,
          score: result.score,
          ...(result.spend === undefined ? {} : { spend: result.spend }),
        });
        return {
          profile: applied.profile,
          value: { counted: applied.counted, dateKey, events: applied.events },
        };
      });
    },
    buyHint: (kind) => spend((profile) => buyHint(profile, kind)),
    buyFreeze: () => spend((profile) => buyFreeze(profile)),
    selectTheme: (themeId) =>
      change((profile) => {
        const allowed = themesUnlocked(profile).some((theme) => theme.id === themeId);
        if (!allowed) return { profile, value: false };
        return { profile: { ...profile, themeSelected: themeId }, value: true };
      }),
    markFlag: (name) =>
      change((profile) => {
        const known = profile.flags[name] === true;
        const full = Object.keys(profile.flags).length >= FLAG_LIMIT;
        if (known || full || name.length === 0 || name.length > 40)
          return { profile, value: undefined };
        return {
          profile: { ...profile, flags: { ...profile.flags, [name]: true } },
          value: undefined,
        };
      }),
    async resetProgress() {
      const fresh = await track(deps.store.reset());
      publish({ ...state, profile: fresh });
    },
    async flush() {
      while (pending.size > 0) await Promise.allSettled([...pending]);
    },
  };
}
