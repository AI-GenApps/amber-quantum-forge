import { MemorySaveStore, type MissionResult, SaveManager } from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { Profile, ROSTER } from "../../src/save";

const MISSION = { id: "d1-m01", reward_coins: { "1": 40, "2": 64, "3": 96 } } as const;

function result(stars: 0 | 1 | 2 | 3, time = 30): MissionResult {
  return { id: MISSION.id, success: stars > 0, stars, time, damage: 0, comfort: null, coins: 0 };
}

async function load(store = new MemorySaveStore()) {
  const manager = new SaveManager(store, { starterCarId: ROSTER.starter, debounceMs: 1 });
  return { profile: await Profile.load(manager, ROSTER), store, manager };
}

describe("Profile", () => {
  it("starts a new player with the free sedan selected", async () => {
    const { profile } = await load();
    expect(profile.coins).toBe(0);
    expect(profile.selectedEntry().id).toBe("sedan");
    expect(profile.selectedSpec().id).toBe("sedan");
    expect(profile.owns("sedan")).toBe(true);
    expect(profile.owns("racer")).toBe(false);
  });

  it("pays a mission, saves it, and pays only the difference on a replay", async () => {
    const { profile, manager, store } = await load();
    expect(profile.recordResult(result(2), MISSION).coins).toBe(64);
    expect(profile.coins).toBe(64);
    expect(profile.stars).toBe(2);
    expect(profile.recordResult(result(3), MISSION).coins).toBe(96 - 64 + 4);
    expect(profile.recordResult(result(3), MISSION).coins).toBe(4);
    expect(profile.coins).toBe(64 + 36 + 4);
    await manager.flush();
    const reloaded = await load(store);
    expect(reloaded.profile.coins).toBe(104);
    expect(reloaded.profile.save.missions["d1-m01"]).toEqual({ stars: 3, best_time_s: 30 });
  });

  it("does not change or save anything for a failed mission", async () => {
    const { profile, manager } = await load();
    expect(profile.recordResult(result(0), MISSION).coins).toBe(0);
    expect(manager.hasUnsavedChanges).toBe(false);
  });

  it("buys and selects cars and uses the selected spec", async () => {
    const { profile } = await load();
    expect(profile.purchase("hatch")).toMatchObject({ ok: false, reason: "not-enough-coins" });
    expect(profile.select("hatch")).toEqual({ ok: false, reason: "not-owned" });
    profile.recordResult(result(3), MISSION);
    profile.recordResult(
      { ...result(3), id: "d1-m02" },
      { id: "d1-m02", reward_coins: { "1": 44, "2": 70, "3": 106 } },
    );
    expect(profile.coins).toBe(202);
    for (const id of ["d1-m03", "d1-m04", "d1-m05"]) {
      profile.recordResult(
        { ...result(3), id },
        { id, reward_coins: { "1": 50, "2": 80, "3": 120 } },
      );
    }
    expect(profile.purchase("hatch").ok).toBe(true);
    expect(profile.coins).toBe(562 - 400);
    expect(profile.select("hatch").ok).toBe(true);
    expect(profile.selectedSpec()).toMatchObject({ id: "hatch", mass: 1050 });
  });

  it("drops cars the roster no longer has when it loads", async () => {
    const store = new MemorySaveStore();
    const first = await load(store);
    first.manager.commit({
      ...first.manager.data,
      owned_cars: ["sedan", "retired"],
      selected_car: "retired",
    });
    await first.manager.flush();
    const second = await load(store);
    expect(second.profile.save.owned_cars).toEqual(["sedan"]);
    expect(second.profile.selectedEntry().id).toBe("sedan");
  });

  it("changes settings, keeps the others, and saves them", async () => {
    const { profile, manager, store } = await load();
    profile.updateSettings({ audio: false, graphics_quality: "low" });
    expect(profile.save.settings).toEqual({
      audio: false,
      haptics: true,
      control_layout: "standard",
      graphics_quality: "low",
    });
    profile.updateSettings({ control_layout: "mirrored" });
    expect(profile.save.settings.audio).toBe(false);
    await manager.flush();
    expect((await load(store)).profile.save.settings.control_layout).toBe("mirrored");
  });

  it("rejects an invalid setting loudly instead of saving it", async () => {
    const { profile } = await load();
    expect(() => profile.updateSettings({ graphics_quality: "ultra" as never })).toThrow();
    expect(profile.save.settings.graphics_quality).toBe("auto");
  });

  it("reset erases coins, stars, extra cars and settings but keeps the starter", async () => {
    const { profile, manager, store } = await load();
    profile.recordResult(result(3), MISSION);
    profile.updateSettings({ haptics: false });
    expect(profile.coins).toBeGreaterThan(0);
    profile.reset();
    expect(profile.coins).toBe(0);
    expect(profile.stars).toBe(0);
    expect(profile.save.owned_cars).toEqual(["sedan"]);
    expect(profile.save.settings.haptics).toBe(true);
    await manager.flush();
    expect((await load(store)).profile.coins).toBe(0);
  });

  it("keeps upgrades and the daily across a reload, and reset clears them", async () => {
    const { profile, manager, store } = await load();
    manager.commit({ ...manager.data, coins: 500 });
    expect(profile.purchaseUpgrade("sedan", "power")).toMatchObject({ ok: true });
    expect(profile.claimDaily("2026-10-15", 3)).toMatchObject({ ok: true, coins: 150 });
    await manager.flush();
    const again = (await load(store)).profile;
    expect(again.upgradeLevels("sedan")).toEqual({ power: 1, grip: 0, brakes: 0 });
    expect(again.save.daily).toEqual({ last_claim_date: "2026-10-15", streak: 1 });
    expect(again.coins).toBe(500 - 60 + 150);
    again.reset();
    expect(again.save.upgrades).toEqual({});
    expect(again.save.daily).toEqual({ last_claim_date: null, streak: 0 });
  });

  it("a refused daily claim changes nothing and saves nothing", async () => {
    const { profile, manager } = await load();
    await manager.flush();
    expect(profile.claimDaily("2026-10-15", 0)).toEqual({ ok: false, reason: "no-stars" });
    expect(manager.hasUnsavedChanges).toBe(false);
    profile.claimDaily("2026-10-15", 1);
    expect(profile.claimDaily("2026-10-14", 3)).toEqual({ ok: false, reason: "clock-backwards" });
    expect(profile.coins).toBe(40);
  });

  it("a v1 save on disk loads as v2 with its coins and cars intact", async () => {
    const store = new MemorySaveStore();
    const v1 = {
      schema_version: 1,
      coins: 321,
      owned_cars: ["sedan", "hatch"],
      selected_car: "hatch",
      missions: { "d1-m01": { stars: 2, best_time_s: 30 } },
      settings: {
        audio: true,
        haptics: true,
        control_layout: "standard",
        graphics_quality: "auto",
      },
      onboarding: {},
    };
    store.entries.set("city-drive.save", JSON.stringify(v1));
    const manager = new SaveManager(store, { starterCarId: ROSTER.starter, debounceMs: 1 });
    const profile = await Profile.load(manager, ROSTER);
    expect(profile.coins).toBe(321);
    expect(profile.save.selected_car).toBe("hatch");
    expect(profile.save.upgrades).toEqual({});
    expect(profile.save.daily).toEqual({ last_claim_date: null, streak: 0 });
    expect(profile.stars).toBe(2);
  });
});
