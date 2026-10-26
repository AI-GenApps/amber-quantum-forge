import {
  applyCampaignResult,
  applyDailyResult,
  buyFrame as buyFrameReducer,
  buyFreeze as buyFreezeReducer,
  buyHint as buyHintReducer,
  type CampaignScore,
  defaultProfile,
  type EconomyResult,
  type FlagKey,
  type GalleryDraft,
  type GalleryResult,
  type HintKind,
  type Profile,
  type ProgressUpdate,
  removeFromGallery,
  type Stars,
  saveToGallery,
  selectFrame as selectFrameReducer,
} from "@web-games/dress-rehearsal-core";
import {
  daysBetween,
  type LoadStatus,
  localDateKey,
  type Settings,
  type SettingsStore,
  type StorageAdapter,
  streakStep,
} from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { createGameSettingsStore, createProfileStore } from "./saveStores";

export interface GameState {
  readonly status: "loading" | "ready";
  readonly loadStatus: LoadStatus | null;
  readonly profile: Profile;
  readonly settings: Readonly<Settings>;
  readonly saveFailed: boolean;
}

export type GameListener = (state: GameState) => void;

export interface GameDeps {
  readonly adapter: StorageAdapter;
  readonly clock?: () => Date;
}

export type SaveBoardInput = Omit<GalleryDraft, "savedKey">;

export interface DailyResultReport {
  readonly stars: Stars;
  readonly harmony: number;
  readonly dateKey?: string;
}

export interface GameStore {
  getState(): GameState;
  subscribe(listener: GameListener): () => void;
  readonly settings: SettingsStore;
  today(): string;
  load(): Promise<LoadStatus>;
  flush(): Promise<void>;
  recordCampaignResult(challengeId: string, score: CampaignScore): Promise<ProgressUpdate>;
  recordDailyResult(report: DailyResultReport): Promise<ProgressUpdate>;
  buyHint(kind: HintKind): Promise<EconomyResult>;
  buyFreeze(): Promise<EconomyResult>;
  buyFrame(frame: string): Promise<EconomyResult>;
  selectFrame(frame: string): Promise<EconomyResult>;
  saveBoard(input: SaveBoardInput): Promise<GalleryResult>;
  deleteBoard(id: string): Promise<void>;
  markFlag(flag: FlagKey): Promise<void>;
  recordExport(): Promise<void>;
  resetProgress(): Promise<void>;
}

interface Outcome<R> {
  readonly profile: Profile;
  readonly result: R;
}

function withFlag(profile: Profile, flag: FlagKey): Profile {
  if (flag === "tutorial" || flag === "howTo") {
    return { ...profile, flags: { ...profile.flags, [flag]: true } };
  }
  const card = flag.slice("card-".length) as keyof Profile["flags"]["ruleCards"];
  return {
    ...profile,
    flags: { ...profile.flags, ruleCards: { ...profile.flags.ruleCards, [card]: true } },
  };
}

export function createGame(deps: GameDeps): GameStore {
  const clock = deps.clock ?? (() => new Date());
  const profileStore = createProfileStore(deps.adapter);
  const settings = createGameSettingsStore(deps.adapter);
  const listeners = new Set<GameListener>();
  const inflight = new Set<Promise<unknown>>();
  let state: GameState = {
    status: "loading",
    loadStatus: null,
    profile: defaultProfile(),
    settings: settings.get(),
    saveFailed: false,
  };

  const publish = (patch: Partial<GameState>): void => {
    state = { ...state, ...patch };
    for (const listener of [...listeners]) listener(state);
  };

  settings.subscribe((next) => publish({ settings: next }));

  const track = <R>(task: Promise<R>): Promise<R> => {
    inflight.add(task);
    const forget = (): void => void inflight.delete(task);
    task.then(forget, forget);
    return task;
  };

  const act = <R>(run: (profile: Profile) => Outcome<R>): Promise<R> =>
    track(
      (async () => {
        let computed: Outcome<R> | undefined;
        let saveFailed = false;
        try {
          await profileStore.update((current) => {
            computed = run(current);
            return computed.profile;
          });
        } catch {
          saveFailed = true;
        }
        const outcome = computed ?? run(state.profile);
        publish({ profile: outcome.profile, saveFailed, status: "ready" });
        return outcome.result;
      })(),
    );

  const economy = (run: (profile: Profile) => EconomyResult): Promise<EconomyResult> =>
    act((profile) => {
      const result = run(profile);
      return { profile: result.ok ? result.profile : profile, result };
    });

  const progress = (run: (profile: Profile) => ProgressUpdate): Promise<ProgressUpdate> =>
    act((profile) => {
      const result = run(profile);
      return { profile: result.profile, result };
    });

  const today = (): string => localDateKey(clock());

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    settings,
    today,
    async load() {
      const [loaded] = await Promise.all([profileStore.load(), settings.load()]);
      publish({ status: "ready", loadStatus: loaded.status, profile: loaded.data });
      return loaded.status;
    },
    async flush() {
      await Promise.allSettled([...inflight]);
    },
    recordCampaignResult: (challengeId, score) =>
      progress((profile) => applyCampaignResult(profile, challengeId, score, today())),
    recordDailyResult: (report) =>
      progress((profile) => {
        const dateKey = report.dateKey ?? today();
        const last = profile.daily.lastKey;
        const step = last === null ? "next-day" : streakStep(last, dateKey);
        const missedDays = last === null ? 0 : Math.max(0, daysBetween(last, dateKey) - 1);
        return applyDailyResult(profile, {
          dateKey,
          step,
          stars: report.stars,
          harmony: report.harmony,
          missedDays,
        });
      }),
    buyHint: (kind) => economy((profile) => buyHintReducer(profile, kind)),
    buyFreeze: () => economy(buyFreezeReducer),
    buyFrame: (frame) => economy((profile) => buyFrameReducer(profile, frame)),
    selectFrame: (frame) => economy((profile) => selectFrameReducer(profile, frame)),
    saveBoard: (input) =>
      act((profile) => {
        const result = saveToGallery(profile, { ...input, savedKey: today() });
        return { profile: result.ok ? result.profile : profile, result };
      }),
    deleteBoard: (id) =>
      act((profile) => ({ profile: removeFromGallery(profile, id), result: undefined })),
    markFlag: (flag) => act((profile) => ({ profile: withFlag(profile, flag), result: undefined })),
    recordExport: () =>
      act((profile) => ({
        profile: {
          ...profile,
          stats: { ...profile.stats, boardsExported: profile.stats.boardsExported + 1 },
        },
        result: undefined,
      })),
    resetProgress: () =>
      track(
        (async () => {
          const fresh = await profileStore.reset();
          publish({ profile: fresh, saveFailed: false, status: "ready" });
        })(),
      ),
  };
}

export function useGame(game: GameStore): GameState {
  const [state, setState] = useState<GameState>(game.getState());
  useEffect(() => {
    setState(game.getState());
    return game.subscribe(setState);
  }, [game]);
  return state;
}
