import {
  type Action,
  CATALOG,
  type Catalog,
  type ChartSession,
  type CometRng,
  canChart,
  claimComet,
  constellationById,
  createProfile,
  createTutorial,
  type GameEvent,
  generateComet,
  markSeen,
  type Point,
  type Profile,
  type RejectReason,
  type ResumeSummary,
  reduce,
  resume,
  type StatsEvent,
  startChart as startChartSession,
  type TapResult,
  type Tutorial,
  tapStar as tapChartStar,
  updateStats,
} from "@web-games/cloud-observatory-core";
import {
  createRng,
  dailySeed,
  type RecoveryReason,
  type SaveStore,
  type SettingsStore,
  streakStep,
} from "@web-games/kit";
import {
  type Autosave,
  type AutosaveReason,
  createAutosave,
  type Schedule,
} from "../save/autosave";
import type { Clock } from "./clock";
import { applyProgress } from "./progress";
import type {
  ActionResult,
  CometResult,
  CometStatus,
  LoadInfo,
  PersistenceState,
  SessionListener,
  SessionSnapshot,
  Toast,
} from "./types";

export const GAME_ID = "cloud-observatory";
export const MAX_TICK_SECONDS = 30;

export interface GameSessionOptions {
  readonly store: SaveStore<Profile>;
  readonly settings: SettingsStore;
  readonly clock: Clock;
  readonly rng?: (seed: number) => CometRng;
  readonly catalog?: Catalog;
  readonly schedule?: Schedule;
  readonly onPause?: (listener: () => void) => () => void;
  readonly onSaveError?: (error: unknown) => void;
}

export type StartChartResult =
  | { readonly ok: true; readonly session: ChartSession }
  | { readonly ok: false; readonly reason: RejectReason };

export interface ChartResult extends ActionResult {
  readonly flawless: boolean;
  readonly mistakes: number;
}

export interface GameSession {
  readonly settings: SettingsStore;
  load(): Promise<LoadInfo>;
  resume(): ResumeSummary | null;
  tick(dtSeconds: number): void;
  dispatch(action: Action): ActionResult;
  gather(): ActionResult;
  buyInstrument(id: string, quantity: number | "max"): ActionResult;
  buyUpgrade(id: string): ActionResult;
  buyBoon(id: string): ActionResult;
  eclipse(): ActionResult;
  startChart(constellationId: string): StartChartResult;
  tapStar(index: number): TapResult;
  finishChart(): ChartResult;
  abandonChart(): void;
  claimComet(): CometResult;
  cometStatus(): CometStatus;
  cometPattern(): Point[];
  markLoreSeen(id: string): void;
  setTutorial(flag: keyof Tutorial): void;
  /** Clears the four hints and the skip flag so the coach starts over. */
  resetTutorial(): void;
  markEclipseIntroSeen(): void;
  dismissSaveNotice(): void;
  reset(): Promise<void>;
  flush(): Promise<void>;
  subscribe(listener: SessionListener): () => void;
  snapshot(): SessionSnapshot;
  dispose(): void;
}

function defaultSchedule(run: () => void, delayMs: number): () => void {
  const handle = setTimeout(run, delayMs);
  return () => clearTimeout(handle);
}

function statsEvents(action: Action, events: readonly GameEvent[]): StatsEvent[] {
  const out: StatsEvent[] = [];
  if (action.type === "gather") out.push({ type: "tap" });
  if (action.type === "tick") out.push({ type: "active", seconds: action.seconds });
  for (const event of events) {
    if (event.type === "charted") out.push({ type: "charted", flawless: event.flawless });
    if (event.type === "eclipsed") out.push({ type: "eclipse" });
    if (event.type === "boon-bought") out.push({ type: "shards-spent", amount: event.cost });
  }
  return out;
}

function reasonFor(events: readonly GameEvent[]): AutosaveReason | null {
  for (const event of events) {
    if (event.type === "charted") return "chart";
    if (event.type === "eclipsed") return "eclipse";
    if (event.type === "purchased" || event.type === "upgraded") return "purchase";
    if (event.type === "boon-bought") return "purchase";
  }
  return null;
}

function safeStep(last: string, today: string) {
  try {
    return streakStep(last, today);
  } catch {
    return "gap" as const;
  }
}

export function createGameSession(options: GameSessionOptions): GameSession {
  const { store, settings, clock } = options;
  const catalog = options.catalog ?? CATALOG;
  const makeRng = options.rng ?? createRng;

  let profile: Profile = createProfile(clock.now(), catalog);
  let chart: ChartSession | null = null;
  let loaded = false;
  let saveNotice: RecoveryReason | null = null;
  let persistence: PersistenceState = "ok";
  let version = 0;
  let cached: SessionSnapshot | null = null;
  let patternKey = "";
  let pattern: Point[] = [];
  const listeners = new Set<SessionListener>();

  const autosave: Autosave = createAutosave({
    store,
    getProfile: () => {
      profile = markSeen(profile, clock.now());
      return profile;
    },
    schedule: options.schedule ?? defaultSchedule,
    ...(options.onPause ? { onPause: options.onPause } : {}),
    ...(options.onSaveError ? { onError: options.onSaveError } : {}),
  });

  const snapshot = (): SessionSnapshot => {
    cached ??= { version, loaded, profile, chart, saveNotice, persistence };
    return cached;
  };

  const notify = (toasts: readonly Toast[] = []): void => {
    version += 1;
    cached = null;
    const view = snapshot();
    for (const listener of [...listeners]) listener(view, toasts);
  };

  const commit = (next: Profile, reason: AutosaveReason | null, toasts: readonly Toast[] = []) => {
    profile = next;
    if (reason !== null) autosave.trigger(reason);
    notify(toasts);
  };

  const run = (action: Action): ActionResult => {
    if (!loaded) return { ok: false, toasts: [] };
    const result = reduce(profile.game, action, catalog);
    if (!result.ok) {
      return { ok: false, toasts: [], ...(result.reason ? { reason: result.reason } : {}) };
    }
    const stats = statsEvents(action, result.events).reduce(updateStats, profile.stats);
    const progressed = applyProgress(profile, { ...profile, game: result.state, stats }, catalog);
    commit(progressed.profile, reasonFor(result.events), progressed.toasts);
    return { ok: true, toasts: progressed.toasts };
  };

  const touch = (change: (current: Profile) => Profile): void => {
    if (!loaded) return;
    const next = change(profile);
    if (next !== profile) commit(next, "meta");
  };

  const cometStatus = (): CometStatus => {
    if (profile.game.charted.length < 1) return "locked";
    if (profile.cometLastKey === null) return "ready";
    const step = safeStep(profile.cometLastKey, clock.dateKey());
    if (step === "same-day") return "claimed";
    return step === "clock-went-back" ? "clock-went-back" : "ready";
  };

  return {
    settings,
    async load() {
      autosave.disable();
      const result = await store.load();
      await settings.load();
      profile = result.data;
      chart = null;
      loaded = true;
      saveNotice = result.status === "recovered" ? (result.reason ?? "invalid-data") : null;
      persistence = result.reason === "read-failed" ? "read-failed" : "ok";
      if (persistence === "ok") autosave.enable();
      notify();
      return result.reason === undefined
        ? { status: result.status }
        : { status: result.status, reason: result.reason };
    },
    resume() {
      if (!loaded) return null;
      const result = resume(profile, clock.now(), catalog);
      const progressed = applyProgress(profile, result.profile, catalog);
      commit(progressed.profile, "resume", progressed.toasts);
      return result.summary;
    },
    tick(dtSeconds) {
      if (!loaded || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
      const seconds = Math.min(dtSeconds, MAX_TICK_SECONDS);
      run({ type: "tick", seconds });
      autosave.tick(seconds);
    },
    dispatch: run,
    gather: () => run({ type: "gather" }),
    buyInstrument: (id, quantity) => run({ type: "buy-instrument", id, quantity }),
    buyUpgrade: (id) => run({ type: "buy-upgrade", id }),
    buyBoon: (id) => run({ type: "buy-boon", id }),
    eclipse: () => run({ type: "eclipse" }),
    startChart(constellationId) {
      const def = constellationById.get(constellationId);
      if (!loaded || def === undefined) return { ok: false, reason: "unknown-id" };
      const check = canChart(profile.game, constellationId, catalog);
      if (!check.ok) return { ok: false, reason: check.reason };
      chart = startChartSession(def);
      notify();
      return { ok: true, session: chart };
    },
    tapStar(index) {
      if (chart === null) return "invalid";
      const outcome = tapChartStar(chart, index);
      if (outcome.session !== chart) {
        chart = outcome.session;
        notify();
      }
      return outcome.result;
    },
    finishChart() {
      if (chart === null) {
        return {
          ok: false,
          reason: "session-incomplete",
          toasts: [],
          flawless: false,
          mistakes: 0,
        };
      }
      const finished = chart;
      const result = run({ type: "complete-chart", session: finished });
      if (result.ok) {
        chart = null;
        notify();
      }
      return { ...result, flawless: finished.mistakes === 0, mistakes: finished.mistakes };
    },
    abandonChart() {
      if (chart === null) return;
      chart = null;
      notify();
    },
    claimComet() {
      if (!loaded) return { ok: false, reason: "locked", toasts: [] };
      const dateKey = clock.dateKey();
      const step = profile.cometLastKey === null ? "gap" : safeStep(profile.cometLastKey, dateKey);
      const claim = claimComet(profile, dateKey, step, catalog);
      if (!claim.ok) return { ok: false, reason: claim.reason, toasts: [] };
      const stats = updateStats(claim.profile.stats, { type: "comet", streak: claim.streak });
      const progressed = applyProgress(profile, { ...claim.profile, stats }, catalog);
      commit(progressed.profile, "comet", progressed.toasts);
      return {
        ok: true,
        reward: claim.reward,
        shards: claim.shards,
        streak: claim.streak,
        toasts: progressed.toasts,
      };
    },
    cometStatus,
    cometPattern() {
      const key = clock.dateKey();
      if (key !== patternKey) {
        pattern = generateComet(makeRng(dailySeed(GAME_ID, key)));
        patternKey = key;
      }
      return pattern.map((star) => ({ ...star }));
    },
    markLoreSeen(id) {
      touch((current) =>
        current.loreUnlocked.includes(id) && !current.loreSeen.includes(id)
          ? { ...current, loreSeen: [...current.loreSeen, id] }
          : current,
      );
    },
    setTutorial(flag) {
      touch((current) =>
        current.tutorial[flag]
          ? current
          : { ...current, tutorial: { ...current.tutorial, [flag]: true } },
      );
    },
    resetTutorial() {
      touch((current) => ({ ...current, tutorial: createTutorial() }));
    },
    markEclipseIntroSeen() {
      touch((current) =>
        current.eclipseIntroSeen ? current : { ...current, eclipseIntroSeen: true },
      );
    },
    dismissSaveNotice() {
      if (saveNotice === null) return;
      saveNotice = null;
      notify();
    },
    async reset() {
      profile = await store.reset();
      chart = null;
      loaded = true;
      saveNotice = null;
      persistence = "ok";
      autosave.enable();
      notify();
    },
    flush: () => autosave.flush(),
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    snapshot,
    dispose() {
      autosave.dispose();
      listeners.clear();
    },
  };
}
