import { CATALOG, LORE, LORE_CHAPTERS } from "@web-games/cloud-observatory-core";
import { BACKUP_SUFFIX, createMemoryAdapter, type StorageAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { PROFILE_KEY } from "../../src/save/profile-store";
import { createHarness, toastKinds } from "./harness";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("loading", () => {
  it("reports a fresh start and arms autosave", async () => {
    const h = await createHarness({ load: false });
    expect(await h.session.load()).toEqual({ status: "fresh" });
    expect(h.session.snapshot().saveNotice).toBeNull();
    h.session.gather();
    h.session.tick(10);
    await h.scheduler.runAll();
    expect(h.saved().game.taps).toBe(1);
  });

  it("restores a saved profile", async () => {
    const h = await createHarness({ seed: { game: { starlight: 321, charted: ["lyre"] } } });
    expect(h.session.snapshot().profile.game.starlight).toBe(321);
    expect(h.session.snapshot().profile.game.charted).toEqual(["lyre"]);
  });

  it("shows a one-time notice and keeps a backup when the save is unreadable", async () => {
    const h = await createHarness({ raw: "{broken", load: false });
    const info = await h.session.load();
    expect(info).toEqual({ status: "recovered", reason: "unreadable" });
    expect(h.session.snapshot().saveNotice).toBe("unreadable");
    expect(h.session.snapshot().profile.game.starlight).toBe(10);
    expect(h.adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe("{broken");
    h.session.dismissSaveNotice();
    expect(h.session.snapshot().saveNotice).toBeNull();
    h.session.gather();
    h.session.tick(10);
    await h.scheduler.runAll();
    expect(h.saved().game.taps).toBe(1);
    expect(h.adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe("{broken");
  });

  it("reports a future-version save as recovered", async () => {
    const h = await createHarness({ raw: JSON.stringify({ v: 9, data: {} }), load: false });
    expect(await h.session.load()).toEqual({ status: "recovered", reason: "future-version" });
  });

  it("never writes over a save it could not read from storage", async () => {
    const memory = createMemoryAdapter({ [PROFILE_KEY]: '{"v":1,"data":"keep me"}' });
    const writes: string[] = [];
    const flaky: StorageAdapter = {
      name: "flaky",
      get: async (key) => {
        if (key === PROFILE_KEY) throw new Error("storage busy");
        return memory.get(key);
      },
      set: async (key, value) => {
        writes.push(key);
        await memory.set(key, value);
      },
      remove: memory.remove,
    };
    const h = await createHarness({ adapter: memory, storage: flaky, load: false });
    const info = await h.session.load();
    expect(info.reason).toBe("read-failed");
    expect(h.session.snapshot().persistence).toBe("read-failed");
    expect(h.session.gather().ok).toBe(true);
    h.session.tick(60);
    await h.scheduler.runAll();
    h.pause();
    await flush();
    expect(writes.filter((key) => key === PROFILE_KEY)).toEqual([]);
    expect(memory.entries.get(PROFILE_KEY)).toBe('{"v":1,"data":"keep me"}');
  });
});

describe("autosave wiring", () => {
  it("saves immediately on the pause lifecycle event", async () => {
    const h = await createHarness();
    h.session.gather();
    h.session.gather();
    h.pause();
    await flush();
    expect(h.saved().game.taps).toBe(2);
    expect(h.scheduler.pending()).toBe(0);
  });

  it("coalesces a burst of purchases into one save", async () => {
    const h = await createHarness({ seed: { game: { starlight: 1e6 } } });
    for (let i = 0; i < 20; i++) h.session.buyInstrument("telescope", 1);
    expect(h.scheduler.pending()).toBe(1);
    await h.scheduler.runAll();
    expect(h.saved().game.owned.telescope).toBe(20);
  });

  it("flush writes straight away", async () => {
    const h = await createHarness();
    h.session.gather();
    await h.session.flush();
    expect(h.saved().game.taps).toBe(1);
  });

  it("keeps settings out of the profile", async () => {
    const h = await createHarness();
    await h.session.settings.set({ sound: false, highContrast: true });
    h.session.gather();
    await h.session.flush();
    expect(h.adapter.entries.get("cloud-observatory.settings")).toContain('"sound":false');
    expect(h.savedText()).not.toContain("sound");
    expect(h.savedText()).not.toContain("highContrast");
  });

  it("marks tutorial, lore and intro flags and saves them", async () => {
    const h = await createHarness({ seed: { game: { owned: { telescope: 1 } } } });
    h.session.setTutorial("observe");
    h.session.markLoreSeen("lore-01");
    h.session.markLoreSeen("lore-01");
    h.session.markLoreSeen("lore-30");
    h.session.markEclipseIntroSeen();
    const { profile } = h.session.snapshot();
    expect(profile.tutorial.observe).toBe(true);
    expect(profile.loreSeen).toEqual(["lore-01"]);
    expect(profile.eclipseIntroSeen).toBe(true);
    await h.scheduler.runAll();
    expect(h.saved().loreSeen).toEqual(["lore-01"]);
  });

  it("reset replaces the save with a new journey", async () => {
    const h = await createHarness({ seed: { game: { starlight: 999, charted: ["lyre"] } } });
    await h.session.reset();
    expect(h.session.snapshot().profile.game.starlight).toBe(10);
    expect(h.saved().game.charted).toEqual([]);
  });
});

describe("subscriptions", () => {
  it("notifies with a stable snapshot, the new version and the toasts", async () => {
    const h = await createHarness();
    const seen: { version: number; kinds: string[] }[] = [];
    const off = h.session.subscribe((snapshot, toasts) =>
      seen.push({ version: snapshot.version, kinds: toastKinds(toasts) }),
    );
    const before = h.session.snapshot();
    expect(h.session.snapshot()).toBe(before);
    for (let i = 0; i < 5; i++) h.session.gather();
    h.session.buyInstrument("telescope", 1);
    expect(seen).toHaveLength(6);
    expect(seen[5]?.kinds).toEqual(["chapter:1", "lore:lore-01"]);
    expect(seen[5]?.version).toBeGreaterThan(seen[0]?.version ?? 0);
    expect(h.session.snapshot()).not.toBe(before);
    off();
    h.session.gather();
    expect(seen).toHaveLength(6);
  });
});

describe("lore across a full session", () => {
  it("unlocks all 30 entries from play, once each, across 6 chapters", async () => {
    const h = await createHarness({
      seed: { game: { starlight: 1e30, shards: 105, shardsEarned: 105 } },
    });
    for (const def of CATALOG.instruments) {
      expect(h.session.buyInstrument(def.id, 1).ok).toBe(true);
    }
    for (const constellation of CATALOG.constellations) {
      const { instrumentId, count } = constellation.requires;
      const owned = h.session.snapshot().profile.game.owned[instrumentId] ?? 0;
      if (owned < count) expect(h.session.buyInstrument(instrumentId, count - owned).ok).toBe(true);
      expect(h.session.startChart(constellation.id).ok).toBe(true);
      for (let i = 0; i < constellation.stars.length; i++) h.session.tapStar(i);
      expect(h.session.finishChart().ok).toBe(true);
    }
    for (const boon of CATALOG.boons) expect(h.session.buyBoon(boon.id).ok).toBe(true);
    const loreIds = h.toasts.flatMap((toast) => (toast.kind === "lore" ? [toast.id] : []));
    expect(loreIds).toHaveLength(30);
    expect(new Set(loreIds)).toEqual(new Set(LORE.map((entry) => entry.id)));
    const chapters = h.toasts.flatMap((toast) => (toast.kind === "chapter" ? [toast.chapter] : []));
    expect(chapters).toEqual(LORE_CHAPTERS.map((chapter) => chapter.number).sort());
    const { profile } = h.session.snapshot();
    expect(profile.loreUnlocked).toHaveLength(30);
    expect(profile.game.charted).toHaveLength(12);
    expect(profile.game.achievements).toEqual(
      expect.arrayContaining(["keeper-of-tales", "whole-sky", "steady-hand"]),
    );
    expect(
      h.toasts.filter((toast) => toast.kind === "achievement" && toast.id === "keeper-of-tales"),
    ).toHaveLength(1);
    await h.scheduler.runAll();
    expect(h.saved().loreUnlocked).toHaveLength(30);
  });
});
