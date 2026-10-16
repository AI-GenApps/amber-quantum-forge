import { defaultSave } from "./defaults";
import { type SaveKeys, saveKeys } from "./keys";
import { decodeSave, type Loaded, loadSave, type SaveSource } from "./load";
import { MIGRATIONS, type MigrationTable } from "./migrations";
import { notice, type SaveNotice } from "./notices";
import { type Scheduler, timeoutScheduler } from "./scheduler";
import type { SaveStore } from "./store";
import type { SaveData } from "./types";
import { parseSave } from "./validate";

export const DEFAULT_DEBOUNCE_MS = 500;

export interface SaveManagerOptions {
  /** The free car every new player owns. */
  starterCarId: string;
  debounceMs?: number;
  scheduler?: Scheduler;
  /** Called for every non-blocking notice, in addition to being kept in `notices`. */
  onNotice?: (notice: SaveNotice) => void;
  keyPrefix?: string;
  migrations?: MigrationTable;
}

const NOTICE_FOR_SOURCE: Partial<Record<SaveSource, SaveNotice["kind"]>> = {
  pending: "recovered-pending",
  backup: "recovered-backup",
  defaults: "reset",
  unreadable: "read-failed",
};

/**
 * Owns the player's SaveData: loads it with recovery, accepts new versions, and writes them
 * back debounced and atomically (new copy to a pending key, last good copy to a backup key, then the
 * swap). Failures become notices and never throw into the game.
 */
export class SaveManager {
  readonly notices: SaveNotice[] = [];
  readonly warnings: string[] = [];
  private readonly keys: SaveKeys;
  private readonly scheduler: Scheduler;
  private readonly debounceMs: number;
  private readonly migrations: MigrationTable;
  private current: SaveData;
  private source: SaveSource = "fresh";
  private dirty = false;
  private cancelTimer: (() => void) | undefined;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: SaveStore,
    private readonly options: SaveManagerOptions,
  ) {
    this.keys = saveKeys(options.keyPrefix);
    this.scheduler = options.scheduler ?? timeoutScheduler;
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.migrations = options.migrations ?? MIGRATIONS;
    this.current = defaultSave(options.starterCarId);
  }

  /** The current save. Treat it as read-only and hand changes to `commit`. */
  get data(): SaveData {
    return this.current;
  }

  /** Where the loaded data came from, for diagnostics and tests. */
  get loadedFrom(): SaveSource {
    return this.source;
  }

  get hasUnsavedChanges(): boolean {
    return this.dirty;
  }

  async load(): Promise<Loaded> {
    const loaded = await loadSave(
      this.store,
      this.keys,
      () => defaultSave(this.options.starterCarId),
      this.migrations,
    );
    this.current = loaded.data;
    this.source = loaded.source;
    this.warnings.push(...loaded.warnings);
    const kind = NOTICE_FOR_SOURCE[loaded.source];
    if (kind) this.raise(notice(kind));
    if (loaded.needsWrite) this.markDirty();
    return loaded;
  }

  /** Replace the save with a changed copy and schedule the write. Invalid data is rejected loudly. */
  commit(next: SaveData): void {
    this.current = parseSave(next);
    this.markDirty();
  }

  /** Write now if anything changed. Resolves true when the store holds the current data. */
  flush(): Promise<boolean> {
    this.cancelTimer?.();
    this.cancelTimer = undefined;
    const run = this.queue.then(() => this.persist());
    this.queue = run;
    return run;
  }

  dispose(): void {
    this.cancelTimer?.();
    this.cancelTimer = undefined;
  }

  private markDirty(): void {
    this.dirty = true;
    this.cancelTimer?.();
    this.cancelTimer = this.scheduler(() => {
      this.cancelTimer = undefined;
      void this.flush();
    }, this.debounceMs);
  }

  private raise(n: SaveNotice): void {
    this.notices.push(n);
    this.options.onNotice?.(n);
  }

  private async persist(): Promise<boolean> {
    if (!this.dirty) return true;
    const snapshot = this.current;
    const json = JSON.stringify(snapshot);
    try {
      await this.store.set(this.keys.pending, json);
      const previous = await this.store.get(this.keys.main);
      if (previous !== null && decodeSave(previous, this.migrations)) {
        await this.store.set(this.keys.backup, previous);
      }
      await this.store.set(this.keys.main, json);
      await this.store.remove(this.keys.pending);
    } catch (error) {
      this.warnings.push(`save write failed: ${String(error)}`);
      this.raise(notice("write-failed"));
      return false;
    }
    if (this.current === snapshot) this.dirty = false;
    return true;
  }
}
