import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MemorySaveStore,
  type SaveData,
  SaveManager,
  type SaveManagerOptions,
  type SaveStore,
  saveKeys,
} from "../../src/index";

export const KEYS = saveKeys();

export function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(import.meta.dirname, "../fixtures/save", name), "utf8"));
}

export const v1Fixture = (): SaveData => readFixture("v1.json") as SaveData;

/** A scheduler the test fires by hand: `fire()` runs the pending debounce timer, if any. */
export class ManualScheduler {
  private pending: (() => void) | undefined;
  scheduled: number[] = [];
  cancelled = 0;

  readonly schedule = (fn: () => void, ms: number): (() => void) => {
    this.scheduled.push(ms);
    this.pending = fn;
    return () => {
      if (this.pending === fn) this.pending = undefined;
      this.cancelled++;
    };
  };

  get hasPending(): boolean {
    return this.pending !== undefined;
  }

  fire(): void {
    const fn = this.pending;
    this.pending = undefined;
    fn?.();
  }
}

/** A store that can be told to fail the Nth write, to prove writes are atomic. */
export class FlakyStore extends MemorySaveStore implements SaveStore {
  failSetAt: number | undefined;
  failGets = false;
  onSet: (() => void) | undefined;
  private sets = 0;

  override async set(key: string, value: string): Promise<void> {
    this.sets++;
    this.onSet?.();
    if (this.failSetAt === this.sets) throw new Error(`disk full on write ${this.sets}`);
    await super.set(key, value);
  }

  override async get(key: string): Promise<string | null> {
    if (this.failGets) throw new Error("storage unavailable");
    return super.get(key);
  }
}

export function makeManager(store: SaveStore, extra: Partial<SaveManagerOptions> = {}) {
  const scheduler = new ManualScheduler();
  const manager = new SaveManager(store, {
    starterCarId: "sedan",
    scheduler: scheduler.schedule,
    ...extra,
  });
  return { manager, scheduler };
}
