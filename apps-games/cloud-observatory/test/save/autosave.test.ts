import { createProfile } from "@web-games/cloud-observatory-core";
import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { type AutosaveReason, createAutosave } from "../../src/save/autosave";
import { createProfileStore, PROFILE_KEY } from "../../src/save/profile-store";
import { createFakeScheduler, createRecordingStore } from "../session/helpers";

function setup(options: { onError?: (error: unknown) => void } = {}) {
  const scheduler = createFakeScheduler();
  const store = createRecordingStore();
  let pauseListener: (() => void) | null = null;
  let unsubscribed = false;
  let counter = 0;
  const autosave = createAutosave({
    store,
    schedule: scheduler.schedule,
    getProfile: () => ({ ...createProfile(1000), lastSeenMs: 1000 + counter++ }),
    onPause: (listener) => {
      pauseListener = listener;
      return () => {
        unsubscribed = true;
      };
    },
    ...options,
  });
  autosave.enable();
  return {
    autosave,
    scheduler,
    store,
    pause: () => pauseListener?.(),
    wasUnsubscribed: () => unsubscribed,
  };
}

describe("autosave interval", () => {
  it("saves every 10 seconds of play and not before", async () => {
    const { autosave, scheduler, store } = setup();
    autosave.tick(4);
    autosave.tick(5.5);
    expect(scheduler.pending()).toBe(0);
    autosave.tick(0.5);
    expect(scheduler.pending()).toBe(1);
    await scheduler.runAll();
    expect(store.saved).toHaveLength(1);
    autosave.tick(9.9);
    expect(scheduler.pending()).toBe(0);
    autosave.tick(0.1);
    await scheduler.runAll();
    expect(store.saved).toHaveLength(2);
  });

  it("keeps the remainder of a long tick", async () => {
    const { autosave, scheduler } = setup();
    autosave.tick(14);
    await scheduler.runAll();
    autosave.tick(6);
    expect(scheduler.pending()).toBe(1);
  });

  it("ignores NaN, zero and negative time", () => {
    const { autosave, scheduler } = setup();
    for (const dt of [Number.NaN, 0, -3, Number.POSITIVE_INFINITY]) autosave.tick(dt);
    expect(scheduler.pending()).toBe(0);
  });
});

describe("autosave triggers", () => {
  const reasons: AutosaveReason[] = ["purchase", "chart", "eclipse", "comet", "resume", "meta"];

  it.each(reasons)("saves after a %s trigger", async (reason) => {
    const { autosave, scheduler, store } = setup();
    autosave.trigger(reason);
    expect(autosave.pending).toBe(true);
    expect(store.saved).toHaveLength(0);
    await scheduler.runAll();
    expect(store.saved).toHaveLength(1);
    expect(autosave.lastReason).toBe(reason);
    expect(autosave.pending).toBe(false);
  });

  it("coalesces a burst of triggers into one save", async () => {
    const { autosave, scheduler, store } = setup();
    for (let i = 0; i < 25; i++) autosave.trigger("purchase");
    autosave.trigger("chart");
    expect(scheduler.delays).toHaveLength(1);
    await scheduler.runAll();
    expect(store.saved).toHaveLength(1);
    autosave.trigger("purchase");
    await scheduler.runAll();
    expect(store.saved).toHaveLength(2);
  });

  it("saves the latest profile at the time the write runs", async () => {
    const { autosave, scheduler, store } = setup();
    autosave.trigger("purchase");
    autosave.trigger("purchase");
    await scheduler.runAll();
    expect(store.saved[0]?.lastSeenMs).toBe(1000);
  });
});

describe("autosave on pause", () => {
  it("flushes immediately when the app is paused", async () => {
    const { autosave, scheduler, store, pause } = setup();
    autosave.trigger("purchase");
    pause();
    await Promise.resolve();
    await Promise.resolve();
    expect(store.saved).toHaveLength(1);
    expect(scheduler.pending()).toBe(0);
    expect(autosave.pending).toBe(false);
  });

  it("flush resets the 10 second counter", async () => {
    const { autosave, scheduler, store } = setup();
    autosave.tick(9);
    await autosave.flush();
    expect(store.saved).toHaveLength(1);
    autosave.tick(2);
    expect(scheduler.pending()).toBe(0);
  });

  it("stops listening on dispose", () => {
    const { autosave, wasUnsubscribed } = setup();
    autosave.dispose();
    expect(wasUnsubscribed()).toBe(true);
    expect(autosave.enabled).toBe(false);
  });
});

describe("autosave safety", () => {
  it("never writes while disabled", async () => {
    const { autosave, scheduler, store, pause } = setup();
    autosave.disable();
    autosave.tick(30);
    autosave.trigger("purchase");
    pause();
    await autosave.flush();
    await scheduler.runAll();
    expect(store.saved).toHaveLength(0);
    expect(scheduler.delays).toHaveLength(0);
  });

  it("drops a pending save when disabled", async () => {
    const { autosave, scheduler, store } = setup();
    autosave.trigger("purchase");
    autosave.disable();
    await scheduler.runAll();
    expect(store.saved).toHaveLength(0);
  });

  it("reports a failed write once and does not retry in a loop", async () => {
    const errors: unknown[] = [];
    const { autosave, scheduler, store } = setup({ onError: (error) => errors.push(error) });
    store.failNext = true;
    autosave.trigger("purchase");
    await scheduler.runAll();
    expect(errors).toHaveLength(1);
    expect(scheduler.pending()).toBe(0);
    expect(autosave.saves).toBe(0);
    autosave.trigger("purchase");
    await scheduler.runAll();
    expect(autosave.saves).toBe(1);
    expect(errors).toHaveLength(1);
  });

  it("does not overwrite stored data after an unreadable load until enabled", async () => {
    const stored = '{"v":1,"data":"precious but unreadable right now"}';
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: stored });
    const real = createProfileStore(adapter, { now: () => 5 });
    const scheduler = createFakeScheduler();
    const autosave = createAutosave({
      store: real,
      schedule: scheduler.schedule,
      getProfile: () => createProfile(5),
    });
    const loaded = await real.load();
    expect(loaded.reason).toBe("invalid-data");
    autosave.tick(60);
    autosave.trigger("purchase");
    await scheduler.runAll();
    expect(adapter.entries.get(PROFILE_KEY)).toBe(stored);
    expect(await real.readBackup()).toBe(stored);
  });
});
