import { describe, expect, it, vi } from "vitest";
import { hud, makeApp, missionOfType, playState, result } from "./fakes";

describe("AppController navigation", () => {
  it("boots into the home screen with the last district loaded and the game paused", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    expect(controller.view.screen).toBe("home");
    expect(game.loads).toEqual(["district-1"]);
    expect(game.paused).toBe(true);
    expect(controller.view.loading).toBeUndefined();
    expect(controller.view.districtId).toBe("district-1");
  });

  it("boot goes to the remembered district", async () => {
    const { controller, game, lastDistrict } = await makeApp({ stars: 12 });
    await lastDistrict.set("district-2");
    await controller.boot();
    expect(game.loads).toEqual(["district-2"]);
  });

  it("Play continues free roam: play screen and the game runs", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.play();
    expect(controller.view.screen).toBe("play");
    expect(game.paused).toBe(false);
    expect(game.loads).toEqual(["district-1"]);
  });

  it("Play loads a district first when none is loaded yet", async () => {
    const { controller, game } = await makeApp();
    await controller.play();
    expect(game.loads).toEqual(["district-1"]);
    expect(controller.view.screen).toBe("play");
  });

  it("a locked district cannot be entered; an open one loads, is remembered and plays", async () => {
    const { controller, game, lastDistrict } = await makeApp({ stars: 12 });
    await controller.boot();
    const open = await controller.enterDistrict("district-2");
    expect(open).toBe(true);
    expect(game.loads).toEqual(["district-1", "district-2"]);
    expect(controller.view.screen).toBe("play");
    expect(await lastDistrict.get(() => true)).toBe("district-2");
    expect(await controller.enterDistrict("district-3")).toBe(false);
    expect(game.loads).toHaveLength(2);
  });

  it("entering the district that is already loaded does not rebuild it", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.enterDistrict("district-1");
    expect(game.loads).toEqual(["district-1"]);
  });

  it("choosing a mission on the map opens its briefing at the start", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    controller.openMap();
    await controller.enterDistrict("district-1", "d1-m03");
    expect(game.calls).toContain("open:d1-m03:false");
    expect(controller.view.screen).toBe("play");
    expect(controller.view.stack).toEqual(["play"]);
  });

  it("opens the map, garage and settings from home and Back returns", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    for (const open of [
      () => controller.openMap(),
      () => controller.openGarage(),
      () => controller.openSettings(),
    ]) {
      open();
      expect(controller.view.screen).not.toBe("home");
      expect(controller.back()).toBe(true);
      expect(controller.view.screen).toBe("home");
    }
    expect(game.garageOpen).toBe(false);
  });

  it("Back on the home screen reports that nothing could go back", async () => {
    const { controller } = await makeApp();
    await controller.boot();
    expect(controller.back()).toBe(false);
  });

  it("pause opens over the drive, stops the game, and resume continues", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.play();
    controller.pause();
    expect(controller.view.screen).toBe("pause");
    expect(game.paused).toBe(true);
    controller.openSettings();
    expect(controller.view.stack).toEqual(["play", "pause", "settings"]);
    controller.back();
    controller.resume();
    expect(controller.view.screen).toBe("play");
    expect(game.paused).toBe(false);
  });

  it("Back while driving pauses; Back in the pause menu resumes", async () => {
    const { controller } = await makeApp();
    await controller.boot();
    await controller.play();
    controller.tick(0);
    expect(controller.back()).toBe(true);
    expect(controller.view.screen).toBe("pause");
    expect(controller.back()).toBe(true);
    expect(controller.view.screen).toBe("play");
  });

  it("Back and Enter follow the mission phase", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.play();
    game.state = playState({ hud: hud({ phase: "briefing" }), mission: missionOfType("delivery") });
    controller.tick(0);
    controller.back();
    expect(game.calls).toEqual(["decline"]);
    controller.confirm();
    expect(game.calls).toEqual(["decline", "accept"]);
    game.state = playState({ hud: hud({ phase: "success" }), result: result() });
    controller.tick(16);
    controller.back();
    controller.confirm();
    expect(game.calls.slice(2)).toEqual(["leave", "leave"]);
    expect(controller.view.screen).toBe("play");
  });

  it("hiding the page while driving opens the pause menu; showing it keeps the game paused", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.play();
    controller.setHidden(true);
    expect(controller.view.screen).toBe("pause");
    controller.setHidden(false);
    expect(game.paused).toBe(true);
    controller.resume();
    expect(game.paused).toBe(false);
  });

  it("restart, abandon and quit-to-home talk to the mission system", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.play();
    game.state = playState({
      hud: hud({ phase: "active", missionId: "d1-m01" }),
      mission: missionOfType("delivery"),
    });
    controller.tick(0);
    controller.pause();
    controller.restartMission();
    expect(game.calls).toEqual([`open:${missionOfType("delivery").id}:true`]);
    expect(controller.view.screen).toBe("play");
    controller.pause();
    controller.abandonMission();
    expect(game.calls.at(-1)).toBe("leave");
    expect(controller.view.screen).toBe("play");
    controller.pause();
    controller.quitToHome();
    expect(controller.view.screen).toBe("home");
    expect(game.paused).toBe(true);
  });
});

describe("AppController results", () => {
  async function ended(success = true) {
    const app = await makeApp();
    await app.controller.boot();
    await app.controller.play();
    app.game.state = playState({
      hud: hud({ phase: "results" }),
      result: result({ success, stars: success ? 2 : 0 }),
    });
    app.controller.tick(0);
    return app;
  }

  it("Retry restarts the same mission at once", async () => {
    const { controller, game } = await ended();
    controller.retry();
    expect(game.calls).toEqual(["open:d1-m01:true"]);
  });

  it("Next opens the next mission's briefing; the last mission goes back to free roam", async () => {
    const { controller, game } = await ended();
    expect(controller.nextMission()).toBe("d1-m02");
    controller.next();
    expect(game.calls).toEqual(["open:d1-m02:false"]);
    game.state = playState({ hud: hud({ phase: "results" }), result: result({ id: "d1-m08" }) });
    controller.tick(1);
    expect(controller.nextMission()).toBeUndefined();
    controller.next();
    expect(game.calls.at(-1)).toBe("leave");
  });

  it("Free roam leaves the mission", async () => {
    const { controller, game } = await ended();
    controller.freeRoam();
    expect(game.calls).toEqual(["leave"]);
  });
});

describe("AppController garage", () => {
  it("opens the garage scene on the selected car and closes it on Back", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    controller.openGarage();
    expect(game.garageOpen).toBe(true);
    expect(game.previews).toEqual(["sedan"]);
    await controller.focusCar("hatch");
    expect(controller.view.garageCar).toBe("hatch");
    expect(game.previews).toEqual(["sedan", "hatch"]);
    controller.back();
    expect(game.garageOpen).toBe(false);
  });

  it("buying spends coins and then the car can be selected", async () => {
    const { controller, profile } = await makeApp({ coins: 500 });
    await controller.boot();
    controller.openGarage();
    expect(controller.buy("hatch").ok).toBe(true);
    expect(profile.coins).toBe(100);
    expect(controller.view.save.owned_cars).toContain("hatch");
    expect(controller.select("hatch")).toBe(true);
    expect(controller.view.save.selected_car).toBe("hatch");
    expect(controller.buy("racer")).toMatchObject({ ok: false, reason: "not-enough-coins" });
    expect(controller.select("racer")).toBe(false);
  });

  it("leaving the garage after choosing another car rebuilds the city with it", async () => {
    const { controller, game } = await makeApp({ coins: 500 });
    await controller.boot();
    controller.openGarage();
    controller.buy("hatch");
    controller.select("hatch");
    controller.back();
    await vi.waitFor(() => expect(game.loads).toEqual(["district-1", "district-1"]));
  });

  it("leaving the garage without a change does not rebuild", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    controller.openGarage();
    controller.back();
    await Promise.resolve();
    expect(game.loads).toEqual(["district-1"]);
  });
});

describe("AppController settings and reset", () => {
  it("saves a setting and applies graphics quality to the game", async () => {
    const { controller, game, profile } = await makeApp();
    await controller.boot();
    controller.setSetting("graphics_quality", "low");
    expect(profile.save.settings.graphics_quality).toBe("low");
    expect(game.graphics.at(-1)).toBe("low");
    controller.setSetting("audio", false);
    expect(controller.view.save.settings.audio).toBe(false);
  });

  it("reset asks first; cancelling keeps everything", async () => {
    const { controller, profile } = await makeApp({ coins: 300 });
    await controller.boot();
    controller.openSettings();
    controller.requestReset();
    expect(controller.view.confirmingReset).toBe(true);
    controller.cancelReset();
    expect(controller.view.confirmingReset).toBe(false);
    expect(profile.coins).toBe(300);
  });

  it("confirming erases progress, forgets the district and returns home on district 1", async () => {
    const { controller, game, profile, lastDistrict } = await makeApp({ coins: 300, stars: 12 });
    await controller.boot();
    await lastDistrict.set("district-2");
    controller.openSettings();
    controller.requestReset();
    await controller.confirmReset();
    expect(profile.coins).toBe(0);
    expect(profile.stars).toBe(0);
    expect(controller.view.screen).toBe("home");
    expect(game.loads.at(-1)).toBe("district-1");
    expect(await lastDistrict.get(() => true)).toBe("district-1");
  });

  it("leaving the settings screen clears a pending confirmation", async () => {
    const { controller } = await makeApp();
    await controller.boot();
    controller.openSettings();
    controller.requestReset();
    controller.back();
    expect(controller.view.confirmingReset).toBe(false);
  });
});

describe("AppController updates and errors", () => {
  it("re-renders only when something visible changed, but feeds the frame hook every tick", async () => {
    const { controller, game } = await makeApp();
    await controller.boot();
    await controller.play();
    const onView = vi.fn();
    const onFrame = vi.fn();
    controller.subscribe(onView);
    controller.onFrame(onFrame);
    controller.tick(0);
    onView.mockClear();
    for (let i = 1; i <= 30; i++) controller.tick(i * 16);
    expect(onView).not.toHaveBeenCalled();
    expect(onFrame).toHaveBeenCalledTimes(31);
    game.state = playState({ speedKmh: 90 });
    controller.tick(600);
    expect(onView).toHaveBeenCalledOnce();
    expect(controller.view.play?.speedKmh).toBe(90);
  });

  it("shows the loading veil while a district builds", async () => {
    const { controller, game } = await makeApp();
    const seen: (string | undefined)[] = [];
    controller.subscribe(() => seen.push(controller.view.loading));
    let release: () => void = () => undefined;
    game.loadDistrict = () => new Promise<void>((resolve) => (release = resolve));
    const pending = controller.boot();
    await vi.waitFor(() => expect(controller.view.loading).toBe("Loading the city"));
    release();
    await pending;
    expect(controller.view.loading).toBeUndefined();
    expect(seen).toContain("Loading the city");
  });

  it("a district that fails to load shows an error and can be dismissed", async () => {
    const { controller, game } = await makeApp();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    game.failLoad = new Error("map is broken");
    expect(await controller.enterDistrict("district-1")).toBe(false);
    expect(controller.view.error).toMatch(/District "district-1" could not load: map is broken/);
    expect(controller.view.loading).toBeUndefined();
    expect(controller.view.screen).toBe("home");
    controller.dismissError();
    expect(controller.view.error).toBeUndefined();
    spy.mockRestore();
  });
});
