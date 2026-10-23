import type { Profile } from "@web-games/cloud-observatory-core";
import type { Schedule } from "../../src/save/autosave";

export interface FakeScheduler {
  readonly schedule: Schedule;
  readonly delays: number[];
  pending(): number;
  runAll(): Promise<void>;
}

export function createFakeScheduler(): FakeScheduler {
  const jobs = new Map<number, () => void>();
  const delays: number[] = [];
  let nextId = 0;
  return {
    schedule(run, delayMs) {
      const id = nextId++;
      delays.push(delayMs);
      jobs.set(id, run);
      return () => void jobs.delete(id);
    },
    delays,
    pending: () => jobs.size,
    async runAll() {
      const due = [...jobs.entries()];
      jobs.clear();
      for (const [, run] of due) run();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
}

export interface RecordingStore {
  readonly saved: Profile[];
  failNext: boolean;
  readonly save: (profile: Profile) => Promise<void>;
}

export function createRecordingStore(): RecordingStore {
  const store: RecordingStore = {
    saved: [],
    failNext: false,
    async save(profile) {
      if (store.failNext) {
        store.failNext = false;
        throw new Error("disk full");
      }
      store.saved.push(profile);
    },
  };
  return store;
}
