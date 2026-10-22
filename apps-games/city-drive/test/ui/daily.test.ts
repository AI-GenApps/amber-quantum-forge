import { pickDailyMission } from "@city-drive/core";
import { describe, expect, it, vi } from "vitest";
import { allMissionDefs } from "../../src/game/daily";
import { AppController } from "../../src/ui/controller";
import { hud, makeApp, playState, result } from "./fakes";

const district1 = allMissionDefs().filter((m) => m.district === "district-1");

describe("daily challenge in the controller", () => {
  it("offers one unlocked mission with the flat rewards and a day-1 streak", async () => {
    const { controller } = await makeApp();
    await controller.boot();
    const daily = controller.view.daily;
    expect(daily).toBeDefined();
    expect(daily?.missionId).toBe(pickDailyMission("2026-10-15", district1).id);
    expect(daily?.status).toBe("available");
    expect(daily?.streak).toBe(1);
    expect(daily?.rewards).toEqual({ "1": 40, "2": 80, "3": 150 });
    expect(daily?.bonusPercent).toBe(0);
    expect(daily?.district).toBe("district-1");
  });

  it("never picks a locked district, and widens the pool as stars unlock districts", async () => {
    const early = await makeApp();
    const seen = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      early.clock.date = `2026-11-${String(day).padStart(2, "0")}`;
      seen.add(early.controller.dailyChallenge()?.mission.district ?? "none");
    }
    expect([...seen]).toEqual(["district-1"]);
    const late = await makeApp({ stars: 24 });
    const wide = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      late.clock.date = `2026-11-${String(day).padStart(2, "0")}`;
      wide.add(late.controller.dailyChallenge()?.mission.district ?? "none");
    }
    expect(wide.size).toBeGreaterThan(1);
  });

  it("without a daily source the game has no daily", async () => {
    const app = await makeApp();
    expect(app.controller.dailyChallenge()).toBeDefined();
    const bare = new AppController({
      game: app.game,
      profile: app.profile,
      roster: app.content.roster,
      progression: app.content.progression,
      missions: app.content.missions,
      lastDistrict: app.lastDistrict,
    });
    expect(bare.dailyChallenge()).toBeUndefined();
    expect(bare.view.daily).toBeUndefined();
    expect(await bare.playDaily()).toBe(false);
  });

  it("Drive daily loads the district, opens the briefing and goes to the play screen", async () => {
    const { controller, game } = await makeApp();
    expect(await controller.playDaily()).toBe(true);
    expect(game.loads).toEqual(["district-1"]);
    expect(game.dailyOpened).toHaveLength(1);
    expect(game.calls).toEqual([`daily:${controller.view.daily?.missionId}:false`]);
    expect(controller.view.screen).toBe("play");
  });

  it("a claimed day cannot be played again; the card says so", async () => {
    const { controller, game, profile } = await makeApp();
    profile.claimDaily("2026-10-15", 2);
    expect(controller.view.daily?.status).toBe("available");
    controller.openMap();
    controller.back();
    expect(controller.view.daily?.status).toBe("claimed");
    expect(await controller.playDaily()).toBe(false);
    expect(game.dailyOpened).toEqual([]);
  });

  it("the next day carries the streak into the shown rewards", async () => {
    const { controller, profile, clock } = await makeApp();
    profile.claimDaily("2026-10-15", 2);
    clock.date = "2026-10-16";
    controller.openMap();
    controller.back();
    expect(controller.view.daily?.status).toBe("available");
    expect(controller.view.daily?.streak).toBe(2);
    expect(controller.view.daily?.rewards).toEqual({ "1": 44, "2": 88, "3": 165 });
    expect(controller.view.daily?.bonusPercent).toBe(10);
  });

  it("a missed day starts the streak over", async () => {
    const { controller, profile, clock } = await makeApp();
    profile.claimDaily("2026-10-15", 2);
    clock.date = "2026-10-18";
    controller.openMap();
    controller.back();
    expect(controller.view.daily?.streak).toBe(1);
  });

  it("a clock set backwards cannot be played or claimed", async () => {
    const { controller, profile, clock, game } = await makeApp();
    profile.claimDaily("2026-10-15", 3);
    clock.date = "2026-10-01";
    controller.openMap();
    controller.back();
    expect(controller.view.daily?.status).toBe("clock-backwards");
    expect(await controller.playDaily()).toBe(false);
    expect(game.dailyOpened).toEqual([]);
  });

  describe("retry", () => {
    async function dailyResult(stars: 0 | 1 | 2 | 3) {
      const app = await makeApp();
      await app.controller.playDaily();
      const id = app.controller.view.daily?.missionId as string;
      app.game.calls.length = 0;
      app.game.state = playState({
        hud: hud({ phase: stars === 0 ? "fail" : "results" }),
        result: result({
          id,
          success: stars > 0,
          stars,
          ...(stars ? {} : { failReason: "time_out" as const }),
        }),
        daily: { date: "2026-10-15", missionId: id },
      });
      app.controller.tick(0);
      return { ...app, id };
    }

    it("a failed daily is retried as the daily", async () => {
      const { controller, game, id } = await dailyResult(0);
      controller.retry();
      expect(game.calls).toEqual([`daily:${id}:true`]);
    });

    it("a paid daily is retried as the plain mission", async () => {
      const { controller, game, profile, id } = await dailyResult(2);
      profile.claimDaily("2026-10-15", 2);
      controller.retry();
      expect(game.calls).toEqual([`open:${id}:true`]);
    });

    it("restarting from the pause menu keeps a daily run a daily run", async () => {
      const { controller, game, id } = await dailyResult(0);
      game.state = playState({
        hud: hud({ phase: "active", missionId: id }),
        mission: allMissionDefs().find((m) => m.id === id),
        daily: { date: "2026-10-15", missionId: id },
      });
      controller.tick(1);
      controller.pause();
      controller.restartMission();
      expect(game.calls.at(-1)).toBe(`daily:${id}:true`);
    });

    it("a normal mission retry is untouched", async () => {
      const app = await makeApp();
      await app.controller.play();
      app.game.state = playState({ hud: hud({ phase: "results" }), result: result() });
      app.controller.tick(0);
      app.controller.retry();
      expect(app.game.calls).toEqual(["open:d1-m01:true"]);
    });
  });
});

describe("upgrades in the controller", () => {
  it("buying an upgrade spends coins and raises the level", async () => {
    const { controller, profile } = await makeApp({ coins: 200 });
    await controller.boot();
    controller.openGarage();
    const bought = controller.buyUpgrade("sedan", "power");
    expect(bought).toMatchObject({ ok: true, cost: 60 });
    expect(profile.coins).toBe(140);
    expect(controller.view.save.upgrades.sedan).toEqual({ power: 1, grip: 0, brakes: 0 });
  });

  it("refuses an unowned car, a missing balance and a maxed track", async () => {
    const { controller, profile } = await makeApp({ coins: 59 });
    await controller.boot();
    expect(controller.buyUpgrade("racer", "grip")).toMatchObject({
      ok: false,
      reason: "not-owned",
    });
    expect(controller.buyUpgrade("sedan", "grip")).toMatchObject({
      ok: false,
      reason: "not-enough-coins",
      missing: 1,
    });
    expect(profile.coins).toBe(59);
  });

  it("upgrading the selected car rebuilds the city when the garage closes", async () => {
    const { controller, game } = await makeApp({ coins: 500 });
    await controller.boot();
    controller.openGarage();
    controller.buyUpgrade("sedan", "brakes");
    controller.back();
    await vi.waitFor(() => expect(game.loads).toEqual(["district-1", "district-1"]));
  });

  it("upgrading a car that is not selected does not rebuild", async () => {
    const { controller, game, manager } = await makeApp({ coins: 900 });
    await controller.boot();
    manager.commit({ ...manager.data, owned_cars: ["sedan", "hatch"] });
    controller.openGarage();
    controller.buyUpgrade("hatch", "grip");
    controller.back();
    await Promise.resolve();
    expect(game.loads).toEqual(["district-1"]);
  });

  it("the upgraded spec is what the profile spawns", async () => {
    const { profile } = await makeApp({ coins: 900 });
    const stock = profile.selectedSpec();
    profile.purchaseUpgrade("sedan", "power");
    profile.purchaseUpgrade("sedan", "brakes");
    const spec = profile.selectedSpec();
    expect(spec.engineForce).toBeGreaterThan(stock.engineForce);
    expect(spec.brakeForce).toBeGreaterThan(stock.brakeForce);
    expect(spec.frictionSlip).toBe(stock.frictionSlip);
    expect(spec.id).toBe("sedan");
  });
});
