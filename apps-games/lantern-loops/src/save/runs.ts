import { createSaveStore, type SaveStore, type StorageAdapter } from "@web-games/kit";
import { CAMPAIGN } from "@web-games/lantern-loops-core";

export const RUNS_KEY = "lantern-loops.runs";
export const RUNS_VERSION = 1;
export const MAX_RUNS = 160;

/** An in-progress board. `tiles` is the core tile code (one hex digit per cell). */
export interface RunState {
  /** Campaign puzzle id, or `daily-YYYY-MM-DD`. */
  puzzleKey: string;
  tiles: string;
  /** Indices of cells locked by hints (fixed tiles are locked by the puzzle itself). */
  locked: number[];
  hintCount: number;
  elapsedMs: number;
  moves: number;
}

export interface RunEntry extends RunState {
  /** Caller-supplied ordering stamp, normally `Date.now()`. */
  updatedAt: number;
}

export interface RunsData {
  runs: Record<string, RunEntry>;
}

const CAMPAIGN_IDS: ReadonlySet<string> = new Set(CAMPAIGN.map((record) => record.id));

export function isCampaignKey(key: string): boolean {
  return CAMPAIGN_IDS.has(key);
}

const isWhole = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;

function parseEntry(key: string, value: unknown): RunEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.puzzleKey !== key || typeof v.tiles !== "string" || !/^[0-9a-f]+$/.test(v.tiles)) {
    return null;
  }
  if (!Array.isArray(v.locked) || !v.locked.every(isWhole)) return null;
  if (!isWhole(v.hintCount) || !isWhole(v.elapsedMs) || !isWhole(v.moves)) return null;
  if (typeof v.updatedAt !== "number" || !Number.isFinite(v.updatedAt)) return null;
  return {
    puzzleKey: key,
    tiles: v.tiles,
    locked: [...(v.locked as number[])],
    hintCount: v.hintCount,
    elapsedMs: v.elapsedMs,
    moves: v.moves,
    updatedAt: v.updatedAt,
  };
}

/** Drops entries that are malformed; rejects the data only when the container is wrong. */
export function parseRuns(data: unknown): RunsData | null {
  if (typeof data !== "object" || data === null) return null;
  const raw = (data as { runs?: unknown }).runs;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const runs: Record<string, RunEntry> = {};
  for (const [key, value] of Object.entries(raw)) {
    const entry = parseEntry(key, value);
    if (entry !== null) runs[key] = entry;
  }
  return { runs };
}

/**
 * Keeps at most `cap` runs. Daily and archive runs go first (oldest first); the oldest
 * campaign runs are dropped last.
 */
export function pruneRuns(
  runs: Record<string, RunEntry>,
  cap = MAX_RUNS,
): Record<string, RunEntry> {
  const entries = Object.values(runs);
  if (entries.length <= cap) return runs;
  const oldestFirst = (a: RunEntry, b: RunEntry) => a.updatedAt - b.updatedAt;
  const drop = [
    ...entries.filter((e) => !isCampaignKey(e.puzzleKey)).sort(oldestFirst),
    ...entries.filter((e) => isCampaignKey(e.puzzleKey)).sort(oldestFirst),
  ].slice(0, entries.length - cap);
  const gone = new Set(drop.map((e) => e.puzzleKey));
  return Object.fromEntries(Object.entries(runs).filter(([key]) => !gone.has(key)));
}

export interface RunsStore {
  readonly store: SaveStore<RunsData>;
  get(puzzleKey: string): Promise<RunEntry | null>;
  list(): Promise<RunEntry[]>;
  /** Inserts or replaces the run for `state.puzzleKey`, then prunes to the cap. */
  put(state: RunState, now: number): Promise<void>;
  /** Removes a run, normally because its puzzle was solved. */
  remove(puzzleKey: string): Promise<void>;
  clear(): Promise<void>;
}

export function createRunsStore(adapter: StorageAdapter, cap = MAX_RUNS): RunsStore {
  const store = createSaveStore<RunsData>(adapter, {
    key: RUNS_KEY,
    version: RUNS_VERSION,
    defaults: () => ({ runs: {} }),
    parse: parseRuns,
  });
  return {
    store,
    get: async (key) => (await store.load()).data.runs[key] ?? null,
    list: async () => Object.values((await store.load()).data.runs),
    async put(state, now) {
      await store.update((data) => ({
        runs: pruneRuns({ ...data.runs, [state.puzzleKey]: { ...state, updatedAt: now } }, cap),
      }));
    },
    async remove(key) {
      await store.update((data) => {
        const { [key]: _gone, ...rest } = data.runs;
        return { runs: rest };
      });
    },
    async clear() {
      await store.reset();
    },
  };
}
