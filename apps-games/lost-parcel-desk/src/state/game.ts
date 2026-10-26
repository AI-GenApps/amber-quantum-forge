import { daysBetween, type LoadStatus, type SaveStore, streakStep } from "@web-games/kit";
import {
  type AccuseRejection,
  type ActionRejection,
  type ActionResult,
  accuse,
  addElapsed,
  buyFreeze,
  buyHint,
  type CaseDef,
  type CaseState,
  caseUnlocked,
  closeCampaignCase,
  closeDailyCase,
  createCaseState,
  type DailyStep,
  defaultProfile,
  type EconomyEvent,
  FLAG_LIMIT,
  FLAG_NAME_MAX,
  flipObject,
  getCase,
  type HintFailure,
  type HintResult,
  inspectObject,
  isClosed,
  type LinkKind,
  linkClue,
  type Profile,
  type PurchaseFailure,
  pinClue,
  type RunKind,
  tapHotspot,
  themesUnlocked,
  unlinkClue,
  unpinClue,
} from "@web-games/lost-parcel-desk-core";
import { dailyCaseFor } from "./dailyCase";
import type { TickSource } from "./ticker";

export interface ActiveCase {
  kind: RunKind;
  id: string;
  def: CaseDef;
  state: CaseState;
}

export interface GameState {
  ready: boolean;
  loadStatus: LoadStatus | null;
  saveFailed: boolean;
  profile: Profile;
  active: ActiveCase | null;
}

export interface GameDeps {
  store: SaveStore<Profile>;
  clock: () => Date;
  localDateKey: (date: Date) => string;
  tick?: TickSource;
}

export type StartOutcome =
  | { ok: true; resumed: boolean; active: ActiveCase }
  | { ok: false; reason: "UNKNOWN_CASE" | "LOCKED" };

export type BoardOutcome =
  | { ok: true; state: CaseState }
  | { ok: false; reason: ActionRejection | "NO_ACTIVE_CASE" };

export type AccuseOutcome =
  | {
      ok: true;
      correct: boolean;
      closed: boolean;
      byElimination: boolean;
      stamps: number;
      accusedId: string;
      state: CaseState;
      events: EconomyEvent[];
      achievements: string[];
    }
  | { ok: false; reason: AccuseRejection | "NO_ACTIVE_CASE"; needed: number };

export type HintOutcome =
  | { ok: true; hint: Extract<HintResult, { ok: true }>; events: EconomyEvent[] }
  | { ok: false; reason: HintFailure | "NO_ACTIVE_CASE" };

export type SpendOutcome =
  | { ok: true; events: EconomyEvent[] }
  | { ok: false; reason: PurchaseFailure };

export interface StartOptions {
  restart?: boolean;
}

export interface GameStore {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
  load(): Promise<LoadStatus>;
  startCase(caseId: string, options?: StartOptions): Promise<StartOutcome>;
  startDaily(options?: StartOptions): Promise<StartOutcome>;
  leaveCase(): void;
  inspect(objectId: string): Promise<BoardOutcome>;
  flip(objectId: string): Promise<BoardOutcome>;
  zoom(clueId: string): Promise<BoardOutcome>;
  pin(clueId: string): Promise<BoardOutcome>;
  unpin(clueId: string): Promise<BoardOutcome>;
  link(clueId: string, personId: string, kind: LinkKind): Promise<BoardOutcome>;
  unlink(clueId: string, personId: string): Promise<BoardOutcome>;
  accuse(personId: string): Promise<AccuseOutcome>;
  buyHint(): Promise<HintOutcome>;
  buyFreeze(): Promise<SpendOutcome>;
  selectTheme(themeId: string): Promise<boolean>;
  markFlag(name: string): Promise<void>;
  markLedgerSeen(caseId: string): Promise<void>;
  resetProgress(): Promise<void>;
  tick(deltaMs: number): void;
  setVisible(visible: boolean): void;
  flush(): Promise<void>;
  dispose(): void;
}

const NO_ACTIVE = { ok: false, reason: "NO_ACTIVE_CASE" } as const;

export function createGameStore(deps: GameDeps): GameStore {
  let state: GameState = {
    ready: false,
    loadStatus: null,
    saveFailed: false,
    profile: defaultProfile(),
    active: null,
  };
  let visible = true;
  let elapsedDirty = false;
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

  const persist = (profile: Profile): Promise<void> =>
    track(
      deps.store
        .update(() => profile)
        .then(
          () => {
            if (state.saveFailed) publish({ ...state, saveFailed: false });
          },
          () => {
            if (!state.saveFailed) publish({ ...state, saveFailed: true });
          },
        ),
    );

  const withSession = (profile: Profile, active: ActiveCase | null): Profile => ({
    ...profile,
    session:
      active === null || active.state.closed
        ? profile.session
        : { kind: active.kind, id: active.id, state: active.state },
  });

  const commit = (profile: Profile, active: ActiveCase | null): Promise<void> => {
    const next = withSession(profile, active);
    elapsedDirty = false;
    publish({ ...state, profile: next, active });
    return persist(next);
  };

  const board = (
    reducer: (def: CaseDef, current: CaseState) => ActionResult,
  ): Promise<BoardOutcome> => {
    const active = state.active;
    if (active === null) return Promise.resolve(NO_ACTIVE);
    const result = reducer(active.def, active.state);
    if (!result.ok) return Promise.resolve({ ok: false, reason: result.reason });
    if (result.state === active.state) return Promise.resolve({ ok: true, state: result.state });
    return commit(state.profile, { ...active, state: result.state }).then(() => ({
      ok: true,
      state: result.state,
    }));
  };

  const begin = (
    kind: RunKind,
    id: string,
    def: CaseDef,
    options: StartOptions,
  ): Promise<StartOutcome> => {
    const live = state.active;
    const held = state.profile.session;
    let resumed = false;
    let current: CaseState = createCaseState(def);
    if (options.restart !== true) {
      if (live !== null && !live.state.closed && live.kind === kind && live.id === id) {
        current = live.state;
        resumed = true;
      } else if (held !== null && held.kind === kind && held.id === id) {
        current = held.state;
        resumed = true;
      }
    }
    const active: ActiveCase = { kind, id, def, state: current };
    return commit(state.profile, active).then(() => ({ ok: true, resumed, active }));
  };

  const closeRun = (active: ActiveCase, closedState: CaseState) => {
    const profile = state.profile;
    if (active.kind === "campaign") return closeCampaignCase(profile, active.def, closedState);
    const last = profile.daily.lastKey;
    const step: DailyStep = last === null ? "first" : streakStep(last, active.id);
    const missedDays = last === null ? 0 : Math.max(0, daysBetween(last, active.id) - 1);
    return closeDailyCase(profile, active.def, closedState, {
      dateKey: active.id,
      step,
      missedDays,
    });
  };

  const spend = (
    change: (profile: Profile) => { profile: Profile; events: EconomyEvent[] } | PurchaseFailure,
  ): Promise<SpendOutcome> => {
    const result = change(state.profile);
    if (typeof result === "string") return Promise.resolve({ ok: false, reason: result });
    publish({ ...state, profile: result.profile });
    return persist(result.profile).then(() => ({ ok: true, events: result.events }));
  };

  const edit = (next: Profile): Promise<void> => {
    publish({ ...state, profile: next });
    return persist(next);
  };

  const unsubscribeTick = deps.tick?.((deltaMs) => tick(deltaMs));

  function tick(deltaMs: number): void {
    const active = state.active;
    if (!visible || active === null || active.state.closed) return;
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const result = addElapsed(active.state, deltaMs);
    if (!result.ok) return;
    elapsedDirty = true;
    state = { ...state, active: { ...active, state: result.state } };
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    async load() {
      const result = await track(deps.store.load());
      const session = result.data.session;
      let active: ActiveCase | null = null;
      if (session !== null) {
        const def = session.kind === "campaign" ? getCase(session.id) : dailyCaseFor(session.id);
        if (def !== undefined)
          active = { kind: session.kind, id: session.id, def, state: session.state };
      }
      elapsedDirty = false;
      publish({
        ready: true,
        loadStatus: result.status,
        saveFailed: false,
        profile: result.data,
        active,
      });
      return result.status;
    },
    async startCase(caseId, options = {}) {
      const def = getCase(caseId);
      if (def === undefined) return { ok: false, reason: "UNKNOWN_CASE" };
      if (!caseUnlocked(state.profile, caseId)) return { ok: false, reason: "LOCKED" };
      return begin("campaign", caseId, def, options);
    },
    startDaily(options = {}) {
      const dateKey = deps.localDateKey(deps.clock());
      return begin("daily", dateKey, dailyCaseFor(dateKey), options);
    },
    leaveCase() {
      if (state.active !== null) publish({ ...state, active: null });
    },
    inspect: (objectId) => board((def, current) => inspectObject(def, current, objectId)),
    flip: (objectId) => board((def, current) => flipObject(def, current, objectId)),
    zoom: (clueId) => board((def, current) => tapHotspot(def, current, clueId)),
    pin: (clueId) => board((_def, current) => pinClue(current, clueId)),
    unpin: (clueId) => board((_def, current) => unpinClue(current, clueId)),
    link: (clueId, personId, kind) =>
      board((_def, current) => linkClue(current, clueId, personId, kind)),
    unlink: (clueId, personId) => board((_def, current) => unlinkClue(current, clueId, personId)),
    async accuse(personId) {
      const active = state.active;
      if (active === null) return { ...NO_ACTIVE, needed: 0 };
      const result = accuse(active.def, active.state, personId);
      if (!result.ok) return { ok: false, reason: result.reason, needed: result.needed };
      const summary = {
        ok: true,
        correct: result.correct,
        closed: result.closed,
        byElimination: result.byElimination,
        stamps: result.stamps,
        accusedId: result.accusedId,
        state: result.state,
      } as const;
      const next: ActiveCase = { ...active, state: result.state };
      if (!result.closed) {
        await commit(state.profile, next);
        return { ...summary, events: [], achievements: [] };
      }
      const closed = closeRun(active, result.state);
      elapsedDirty = false;
      publish({ ...state, profile: closed.profile, active: next });
      await persist(closed.profile);
      return { ...summary, events: closed.events, achievements: closed.achievements };
    },
    async buyHint() {
      const active = state.active;
      if (active === null) return NO_ACTIVE;
      const bought = buyHint(state.profile, active.def, active.state, active.kind);
      if (!bought.ok) return { ok: false, reason: bought.reason };
      await commit(bought.profile, { ...active, state: bought.state });
      return { ok: true, hint: bought.hint, events: bought.events };
    },
    buyFreeze: () =>
      spend((profile) => {
        const bought = buyFreeze(profile);
        return bought.ok ? { profile: bought.profile, events: bought.events } : bought.reason;
      }),
    async selectTheme(themeId) {
      const allowed = themesUnlocked(state.profile).some((theme) => theme.id === themeId);
      if (!allowed) return false;
      if (state.profile.themeSelected !== themeId) {
        await edit({ ...state.profile, themeSelected: themeId });
      }
      return true;
    },
    async markFlag(name) {
      const flags = state.profile.flags;
      const full = Object.keys(flags).length >= FLAG_LIMIT;
      if (flags[name] === true || full || name.length === 0 || name.length > FLAG_NAME_MAX) return;
      await edit({ ...state.profile, flags: { ...flags, [name]: true } });
    },
    async markLedgerSeen(caseId) {
      if (!isClosed(state.profile, caseId) || state.profile.ledgerSeen[caseId] === true) return;
      await edit({
        ...state.profile,
        ledgerSeen: { ...state.profile.ledgerSeen, [caseId]: true },
      });
    },
    async resetProgress() {
      const fresh = await track(deps.store.reset());
      elapsedDirty = false;
      publish({ ...state, profile: fresh, active: null, saveFailed: false });
    },
    tick,
    setVisible(next) {
      visible = next;
    },
    async flush() {
      const active = state.active;
      if (elapsedDirty && active !== null && !active.state.closed) {
        await commit(state.profile, active);
      }
      while (pending.size > 0) await Promise.allSettled([...pending]);
    },
    dispose() {
      unsubscribeTick?.();
      listeners.clear();
    },
  };
}
