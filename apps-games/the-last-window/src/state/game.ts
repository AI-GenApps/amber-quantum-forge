import { dailySeed, type LoadStatus, type SaveStore, streakStep } from "@web-games/kit";
import {
  applyLateResult,
  applyShiftResult,
  buyDecor,
  buyStock,
  type ChoiceMade,
  completeScene,
  type DecorId,
  type DecorPurchase,
  defaultProfile,
  FLAG_LIMIT,
  type LateApplied,
  lateIndexToday,
  type Profile,
  type ProfileSettings,
  type SceneApplied,
  type ShiftApplied,
  type ShiftExtras,
  type ShiftResult,
  type StockPlan,
  type StockPurchase,
  type StreakInput,
} from "@web-games/the-last-window-core";
import { GAME_ID } from "./saveStores";

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

export interface LateToday {
  dateKey: string;
  seed: number;
  index: number;
  count: number;
}

export interface LateOutcome extends LateApplied {
  dateKey: string;
}

export interface GameStore {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
  load(): Promise<LoadStatus>;
  lateToday(): LateToday;
  finishShift(day: number, result: ShiftResult, extras?: ShiftExtras): Promise<ShiftApplied>;
  finishLateShift(result: ShiftResult, extras?: ShiftExtras): Promise<LateOutcome>;
  finishScene(sceneId: string, choice?: ChoiceMade): Promise<SceneApplied>;
  buyStock(plan: StockPlan, day?: number): Promise<StockPurchase>;
  buyDecor(id: DecorId, day?: number): Promise<DecorPurchase>;
  markFlag(name: string): Promise<void>;
  clearFlag(name: string): Promise<void>;
  setPreference<K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]): Promise<void>;
  resetProgress(): Promise<void>;
  flush(): Promise<void>;
}

interface Edit<T> {
  profile: Profile;
  value: T;
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

  const change = <T>(edit: (profile: Profile) => Edit<T>): Promise<T> => {
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

  const today = (): string => deps.localDateKey(deps.clock());

  const stepFor = (profile: Profile, dateKey: string): StreakInput => {
    const last = profile.late.lastKey;
    return last === null ? "first" : streakStep(last, dateKey);
  };

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
    lateToday() {
      const dateKey = today();
      return {
        dateKey,
        seed: dailySeed(GAME_ID, dateKey),
        index: lateIndexToday(state.profile, dateKey),
        count: state.profile.late.count,
      };
    },
    finishShift: (day, result, extras) =>
      change((profile) => {
        const applied = applyShiftResult(profile, { kind: "day", day }, result, extras);
        return { profile: applied.profile, value: applied };
      }),
    finishLateShift: (result, extras) => {
      const dateKey = today();
      return change((profile) => {
        const date = { dateKey, step: stepFor(profile, dateKey) };
        const applied = applyLateResult(profile, date, result, extras);
        return { profile: applied.profile, value: { ...applied, dateKey } };
      });
    },
    finishScene: (sceneId, choice) =>
      change((profile) => {
        const applied = completeScene(profile, sceneId, choice);
        return { profile: applied.profile, value: applied };
      }),
    buyStock: (plan, day) =>
      change((profile) => {
        const purchase = buyStock(profile, plan, day);
        return { profile: purchase.ok ? purchase.profile : profile, value: purchase };
      }),
    buyDecor: (id, day) =>
      change((profile) => {
        const purchase = buyDecor(profile, id, day);
        return { profile: purchase.ok ? purchase.profile : profile, value: purchase };
      }),
    markFlag: (name) =>
      change((profile) => {
        const known = profile.flags[name] === true;
        const full = Object.keys(profile.flags).length >= FLAG_LIMIT;
        if (known || full || name.length === 0 || name.length > 40) {
          return { profile, value: undefined };
        }
        return {
          profile: { ...profile, flags: { ...profile.flags, [name]: true } },
          value: undefined,
        };
      }),
    clearFlag: (name) =>
      change((profile) => {
        if (profile.flags[name] !== true) return { profile, value: undefined };
        const flags = { ...profile.flags };
        delete flags[name];
        return { profile: { ...profile, flags }, value: undefined };
      }),
    setPreference: (key, value) =>
      change((profile) => ({
        profile: { ...profile, settings: { ...profile.settings, [key]: value } },
        value: undefined,
      })),
    async resetProgress() {
      const keep = state.profile.settings;
      await change(() => ({ profile: { ...defaultProfile(), settings: keep }, value: undefined }));
    },
    async flush() {
      while (pending.size > 0) await Promise.allSettled([...pending]);
    },
  };
}
