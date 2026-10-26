import { createMemoryAdapter, type StorageAdapter } from "@web-games/kit";
import {
  CASES,
  defaultProfile,
  getCase,
  PROFILE_KEY,
  type Profile,
} from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import { createGameStore } from "../src/state/game";
import { createGameSettings, createProfileStore } from "../src/state/saveStores";
import {
  envelope,
  linkCanonical,
  makeRig,
  openEverything,
  seedProfile,
  solveActive,
  storedProfile,
} from "./fixtures/game";

function totalOf(profile: Profile): number {
  return Object.values(profile.cases).reduce((sum, record) => sum + record.stamps, 0);
}

async function started(rig = makeRig(), caseId = "01") {
  await rig.game.load();
  const outcome = await rig.game.startCase(caseId);
  if (!outcome.ok) throw new Error(outcome.reason);
  return rig;
}

describe("loading", () => {
  it("starts empty, loads a fresh profile with 30 postage and tells subscribers", async () => {
    const rig = makeRig();
    expect(rig.game.getState().ready).toBe(false);
    const seen: boolean[] = [];
    rig.game.subscribe((state) => seen.push(state.ready));
    expect(await rig.game.load()).toBe("fresh");
    const state = rig.game.getState();
    expect(state.ready).toBe(true);
    expect(state.profile.postage).toBe(30);
    expect(state.active).toBeNull();
    expect(seen).toEqual([true]);
  });

  it("reports a recovered save and falls back to defaults", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "{oops" });
    const rig = makeRig(adapter);
    expect(await rig.game.load()).toBe("recovered");
    expect(rig.game.getState().profile).toEqual(defaultProfile());
  });

  it("stops notifying after unsubscribe and dispose", async () => {
    const rig = makeRig();
    let calls = 0;
    const off = rig.game.subscribe(() => calls++);
    await rig.game.load();
    off();
    await rig.game.startCase("01");
    expect(calls).toBe(1);
  });
});

describe("starting cases", () => {
  it("rejects unknown and locked cases", async () => {
    const rig = makeRig();
    await rig.game.load();
    expect(await rig.game.startCase("99")).toEqual({ ok: false, reason: "UNKNOWN_CASE" });
    expect(await rig.game.startCase("02")).toEqual({ ok: false, reason: "LOCKED" });
    expect(await rig.game.startCase("05")).toEqual({ ok: false, reason: "LOCKED" });
    expect(rig.game.getState().active).toBeNull();
  });

  it("opens case 01 with a fresh state and saves the session", async () => {
    const rig = await started();
    const active = rig.game.getState().active;
    expect(active?.id).toBe("01");
    expect(active?.kind).toBe("campaign");
    expect(active?.state.foundClueIds).toEqual([]);
    expect(storedProfile(rig.adapter).session).toEqual({
      kind: "campaign",
      id: "01",
      state: active?.state,
    });
  });

  it("resumes the same case and restarts on request", async () => {
    const rig = await started();
    const first = getCase("01")?.objects[0]?.id ?? "";
    await rig.game.inspect(first);
    const again = await rig.game.startCase("01");
    expect(again.ok && again.resumed).toBe(true);
    expect(rig.game.getState().active?.state.seenObjectIds).toEqual([first]);
    const fresh = await rig.game.startCase("01", { restart: true });
    expect(fresh.ok && fresh.resumed).toBe(false);
    expect(rig.game.getState().active?.state.seenObjectIds).toEqual([]);
  });

  it("leaving a case keeps its saved session for later", async () => {
    const rig = await started();
    const first = getCase("01")?.objects[0]?.id ?? "";
    await rig.game.inspect(first);
    rig.game.leaveCase();
    expect(rig.game.getState().active).toBeNull();
    expect(storedProfile(rig.adapter).session?.state.seenObjectIds).toEqual([first]);
    const back = await rig.game.startCase("01");
    expect(back.ok && back.resumed).toBe(true);
  });
});

describe("board actions", () => {
  it("every state change is saved to the profile session and notified", async () => {
    const rig = await started();
    const def = getCase("01");
    if (def === undefined) throw new Error("no case 01");
    let notified = 0;
    rig.game.subscribe(() => notified++);
    const object = def.objects[0]?.id ?? "";
    expect((await rig.game.inspect(object)).ok).toBe(true);
    expect((await rig.game.flip(object)).ok).toBe(true);
    const found = rig.game.getState().active?.state.foundClueIds ?? [];
    expect(found.length).toBeGreaterThan(0);
    const clueId = found[0] ?? "";
    expect((await rig.game.pin(clueId)).ok).toBe(true);
    const owner = def.candidateIds[0] ?? "";
    expect((await rig.game.link(clueId, owner, "fits")).ok).toBe(true);
    expect((await rig.game.unlink(clueId, owner)).ok).toBe(true);
    expect((await rig.game.link(clueId, owner, "rules-out")).ok).toBe(true);
    expect(notified).toBe(6);
    const saved = storedProfile(rig.adapter).session?.state;
    expect(saved).toEqual(rig.game.getState().active?.state);
    expect(saved?.links).toEqual([{ clueId, personId: owner, kind: "rules-out" }]);
    expect((await rig.game.unpin(clueId)).ok).toBe(true);
    expect(storedProfile(rig.adapter).session?.state.links).toEqual([]);
  });

  it("zooms a hotspot clue", async () => {
    const rig = await started();
    const def = getCase("01");
    const zoom = def?.clues.find((clue) => clue.face === "zoom");
    if (def === undefined || zoom === undefined) throw new Error("case 01 has no zoom clue");
    await rig.game.inspect(zoom.objectId);
    expect((await rig.game.zoom(zoom.id)).ok).toBe(true);
    expect(rig.game.getState().active?.state.foundClueIds).toContain(zoom.id);
  });

  it("rejects bad actions without a write or a notification", async () => {
    const rig = await started();
    const before = rig.adapter.entries.get(PROFILE_KEY);
    let notified = 0;
    rig.game.subscribe(() => notified++);
    expect(await rig.game.pin("01-c1")).toEqual({ ok: false, reason: "CLUE_NOT_FOUND" });
    expect(await rig.game.inspect("nope")).toEqual({ ok: false, reason: "UNKNOWN_OBJECT" });
    expect(await rig.game.flip(getCase("01")?.objects[0]?.id ?? "")).toEqual({
      ok: false,
      reason: "OBJECT_NOT_OPEN",
    });
    expect(notified).toBe(0);
    expect(rig.adapter.entries.get(PROFILE_KEY)).toBe(before);
  });

  it("does not write for an action that changes nothing", async () => {
    const rig = await started();
    const object = getCase("01")?.objects[0]?.id ?? "";
    await rig.game.inspect(object);
    let notified = 0;
    rig.game.subscribe(() => notified++);
    expect((await rig.game.inspect(object)).ok).toBe(true);
    expect(notified).toBe(0);
  });

  it("answers with no active case before a case is opened", async () => {
    const rig = makeRig();
    await rig.game.load();
    const none = { ok: false, reason: "NO_ACTIVE_CASE" } as const;
    expect(await rig.game.inspect("x")).toEqual(none);
    expect(await rig.game.pin("x")).toEqual(none);
    expect(await rig.game.buyHint()).toEqual(none);
    expect(await rig.game.accuse("p01")).toEqual({ ...none, needed: 0 });
  });
});

describe("resuming after a reload", () => {
  it("restores the active case with the same clues, pins and links", async () => {
    const rig = await started();
    await openEverything(rig.game);
    await linkCanonical(rig.game);
    const before = rig.game.getState().active?.state;
    expect(before?.links.length).toBeGreaterThan(0);
    await rig.game.flush();

    const next = makeRig(rig.adapter);
    expect(await next.game.load()).toBe("loaded");
    const restored = next.game.getState().active;
    expect(restored?.id).toBe("01");
    expect(restored?.def.id).toBe("01");
    expect(restored?.state).toEqual(before);
    const resumed = await next.game.startCase("01");
    expect(resumed.ok && resumed.resumed).toBe(true);
  });

  it("discards a stale session instead of crashing", async () => {
    const rig = await started();
    await openEverything(rig.game);
    const raw = JSON.parse(rig.adapter.entries.get(PROFILE_KEY) ?? "{}");
    raw.data.session.state.foundClueIds = ["gone"];
    rig.adapter.entries.set(PROFILE_KEY, JSON.stringify(raw));
    const next = makeRig(rig.adapter);
    expect(await next.game.load()).toBe("loaded");
    expect(next.game.getState().active).toBeNull();
    expect(next.game.getState().profile.session).toBeNull();
  });
});

describe("accusations", () => {
  it("a wrong accusation returns the person and keeps the case open and saved", async () => {
    const rig = await started();
    const def = getCase("01");
    if (def === undefined) throw new Error("no case");
    await openEverything(rig.game);
    await linkCanonical(rig.game);
    const decoy = def.candidateIds.find((id) => id !== def.ownerId) ?? "";
    expect(await rig.game.accuse(decoy)).toMatchObject({ ok: false, reason: "NEEDS_MORE_FITS" });
    for (const clue of def.deductions.flatMap((item) => item.clueIds)) {
      await rig.game.link(clue, decoy, "fits");
    }
    const slip = await rig.game.accuse(decoy);
    expect(slip).toMatchObject({ ok: true, correct: false, closed: false, stamps: 2 });
    expect(storedProfile(rig.adapter).session?.state.returnedIds).toEqual([decoy]);
    expect(rig.game.getState().profile.postage).toBe(30);
    expect(await rig.game.accuse(decoy)).toMatchObject({ ok: false, reason: "ALREADY_RETURNED" });
  });

  it("closing a case pays out, clears the session and keeps the reveal state in memory", async () => {
    const rig = await started();
    const outcome = await solveActive(rig.game);
    expect(outcome).toMatchObject({ ok: true, correct: true, closed: true, stamps: 3 });
    if (!outcome.ok) return;
    expect(outcome.events).toContainEqual({
      type: "postage-gained",
      amount: 10,
      reason: "first-close",
    });
    expect(outcome.achievements).toEqual(
      expect.arrayContaining(["first-delivery", "clean-sheet", "unaided", "sharp-eyes"]),
    );
    const state = rig.game.getState();
    expect(state.profile.postage).toBe(55);
    expect(state.profile.session).toBeNull();
    expect(state.active?.state.closed).toBe(true);
    const stored = storedProfile(rig.adapter);
    expect(stored.session).toBeNull();
    expect(stored.cases["01"]?.stamps).toBe(3);
    expect(stored.postage).toBe(55);
    expect(await rig.game.inspect("01-1")).toEqual({ ok: false, reason: "CASE_CLOSED" });
  });

  it("two wrong accusations deliver by elimination with one stamp", async () => {
    const rig = await started();
    const outcome = await solveActive(rig.game, 2);
    expect(outcome).toMatchObject({ ok: true, closed: true, byElimination: true, stamps: 1 });
    expect(rig.game.getState().profile.cases["01"]?.stamps).toBe(1);
    expect(rig.game.getState().profile.postage).toBe(30 + 15);
  });

  it("a replay raises the best stamps and pays only the difference", async () => {
    const rig = await started();
    await solveActive(rig.game, 1);
    expect(rig.game.getState().profile.postage).toBe(30 + 20);
    await rig.game.startCase("01", { restart: true });
    await solveActive(rig.game);
    expect(rig.game.getState().profile.postage).toBe(30 + 25);
    expect(rig.game.getState().profile.achievements["second-look"]).toBe(true);
    await rig.game.startCase("01", { restart: true });
    await solveActive(rig.game);
    expect(rig.game.getState().profile.postage).toBe(30 + 25);
    expect(rig.game.getState().profile.cases["01"]?.closedCount).toBe(3);
  });

  it("plays the whole campaign in order for exactly 450 postage and 36 stamps", async () => {
    const rig = makeRig();
    await rig.game.load();
    for (const item of CASES) {
      const open = await rig.game.startCase(item.id);
      expect(open.ok, item.id).toBe(true);
      await solveActive(rig.game);
    }
    const profile = rig.game.getState().profile;
    expect(profile.postage).toBe(450);
    expect(Object.values(profile.cases).reduce((sum, record) => sum + record.stamps, 0)).toBe(36);
    expect(Object.keys(profile.achievements)).toHaveLength(9);
    expect(storedProfile(rig.adapter).postage).toBe(450);
  });

  it("unlocks chapter 2 only when the stamps and the gate case are there", async () => {
    const rig = makeRig();
    await rig.game.load();
    for (const id of ["01", "02", "03"]) {
      await rig.game.startCase(id);
      await solveActive(rig.game, 2);
    }
    await rig.game.startCase("04");
    await solveActive(rig.game, 2);
    expect(rig.game.getState().profile.cases["04"]?.stamps).toBe(1);
    expect(await rig.game.startCase("05")).toEqual({ ok: false, reason: "LOCKED" });
    await rig.game.startCase("01", { restart: true });
    await solveActive(rig.game, 1);
    await rig.game.startCase("02", { restart: true });
    await solveActive(rig.game, 1);
    expect(totalOf(rig.game.getState().profile)).toBe(6);
    expect(await rig.game.startCase("05")).toEqual({ ok: false, reason: "LOCKED" });
    await rig.game.startCase("03", { restart: true });
    await solveActive(rig.game, 1);
    expect(totalOf(rig.game.getState().profile)).toBe(7);
    expect(await rig.game.startCase("05")).toMatchObject({ ok: true });
  });
});

describe("hints and freezes", () => {
  it("charges a hint once and applies its links", async () => {
    const rig = await started();
    const bought = await rig.game.buyHint();
    expect(bought.ok).toBe(true);
    expect(rig.game.getState().profile.postage).toBe(10);
    expect(rig.game.getState().active?.state.hintsUsed).toBe(1);
    expect(rig.game.getState().active?.state.links.length).toBeGreaterThan(0);
    expect(storedProfile(rig.adapter).postage).toBe(10);
    expect(storedProfile(rig.adapter).session?.state.hintsUsed).toBe(1);
    expect(rig.game.getState().profile.stats.hintsUsed).toBe(1);
  });

  it("rejects a hint without charge when postage is short", async () => {
    const rig = await started();
    await rig.game.buyHint();
    const second = await rig.game.buyHint();
    expect(second).toEqual({ ok: false, reason: "INSUFFICIENT_POSTAGE" });
    expect(rig.game.getState().profile.postage).toBe(10);
    expect(rig.game.getState().active?.state.hintsUsed).toBe(1);
  });

  it("stops at two hints per case", async () => {
    const adapter = createMemoryAdapter();
    seedProfile(adapter, { ...defaultProfile(), postage: 500 });
    const rig = await started(makeRig(adapter));
    expect((await rig.game.buyHint()).ok).toBe(true);
    expect((await rig.game.buyHint()).ok).toBe(true);
    expect(await rig.game.buyHint()).toEqual({ ok: false, reason: "NOTHING_TO_HINT" });
    expect(rig.game.getState().profile.postage).toBe(460);
  });

  it("sells up to two freezes", async () => {
    const adapter = createMemoryAdapter();
    seedProfile(adapter, { ...defaultProfile(), postage: 100 });
    const rig = makeRig(adapter);
    await rig.game.load();
    expect((await rig.game.buyFreeze()).ok).toBe(true);
    expect((await rig.game.buyFreeze()).ok).toBe(true);
    expect(await rig.game.buyFreeze()).toEqual({ ok: false, reason: "FREEZES_FULL" });
    expect(rig.game.getState().profile.streakFreezes).toBe(2);
    expect(rig.game.getState().profile.postage).toBe(40);
    expect(storedProfile(rig.adapter).streakFreezes).toBe(2);
    const poor = makeRig();
    await poor.game.load();
    expect((await poor.game.buyFreeze()).ok).toBe(true);
    expect(await poor.game.buyFreeze()).toEqual({ ok: false, reason: "INSUFFICIENT_POSTAGE" });
  });
});

describe("themes, flags and the ledger", () => {
  it("selects only unlocked themes", async () => {
    const rig = makeRig();
    await rig.game.load();
    expect(await rig.game.selectTheme("gold-rubber-stamp")).toBe(false);
    expect(await rig.game.selectTheme("mustard-riso")).toBe(true);
    const adapter = createMemoryAdapter();
    const profile = defaultProfile();
    profile.cases = {
      "01": { stamps: 3, bestTimeMs: null, hintsOnBest: 0, closedCount: 1 },
      "02": { stamps: 3, bestTimeMs: null, hintsOnBest: 0, closedCount: 1 },
    };
    seedProfile(adapter, profile);
    const rich = makeRig(adapter);
    await rich.game.load();
    expect(await rich.game.selectTheme("teal-blotter")).toBe(true);
    expect(storedProfile(adapter).themeSelected).toBe("teal-blotter");
  });

  it("marks flags once and ignores bad names", async () => {
    const rig = makeRig();
    await rig.game.load();
    await rig.game.markFlag("tutorial-done");
    await rig.game.markFlag("tutorial-done");
    await rig.game.markFlag("");
    await rig.game.markFlag("x".repeat(41));
    expect(rig.game.getState().profile.flags).toEqual({ "tutorial-done": true });
    expect(storedProfile(rig.adapter).flags).toEqual({ "tutorial-done": true });
  });

  it("marks a ledger fragment seen only for a closed case", async () => {
    const rig = await started();
    await rig.game.markLedgerSeen("01");
    expect(rig.game.getState().profile.ledgerSeen).toEqual({});
    await solveActive(rig.game);
    await rig.game.markLedgerSeen("01");
    expect(rig.game.getState().profile.ledgerSeen).toEqual({ "01": true });
    expect(storedProfile(rig.adapter).ledgerSeen).toEqual({ "01": true });
  });
});

describe("reset", () => {
  it("returns defaults, drops the active case and keeps settings", async () => {
    const rig = await started();
    await solveActive(rig.game);
    const settings = createGameSettings(rig.adapter);
    await settings.set({ sound: false });
    await rig.game.resetProgress();
    const state = rig.game.getState();
    expect(state.profile).toEqual(defaultProfile());
    expect(state.active).toBeNull();
    expect(storedProfile(rig.adapter)).toEqual(defaultProfile());
    const again = createGameSettings(rig.adapter);
    await again.load();
    expect(again.get().sound).toBe(false);
  });
});

describe("save failures", () => {
  it("keeps playing in memory, flags the failure and recovers on the next good write", async () => {
    const base = createMemoryAdapter();
    let failing = false;
    const flaky: StorageAdapter = {
      ...base,
      set: async (key, value) => {
        if (failing) throw new Error("disk full");
        await base.set(key, value);
      },
    };
    const game = createGameStore({
      store: createProfileStore(flaky),
      clock: () => new Date("2026-10-23T09:00:00"),
      localDateKey: () => "2026-10-23",
    });
    await game.load();
    await game.startCase("01");
    failing = true;
    const object = getCase("01")?.objects[0]?.id ?? "";
    expect((await game.inspect(object)).ok).toBe(true);
    expect(game.getState().saveFailed).toBe(true);
    expect(game.getState().active?.state.seenObjectIds).toEqual([object]);
    failing = false;
    await game.flip(object);
    await game.pin(getCase("01")?.clues[0]?.id ?? "");
    expect(game.getState().saveFailed).toBe(false);
  });
});

describe("seeded profile", () => {
  it("envelope helper writes a loadable save", async () => {
    const adapter = createMemoryAdapter({
      [PROFILE_KEY]: envelope({ ...defaultProfile(), postage: 9 }),
    });
    const rig = makeRig(adapter);
    await rig.game.load();
    expect((rig.game.getState().profile as Profile).postage).toBe(9);
  });
});
