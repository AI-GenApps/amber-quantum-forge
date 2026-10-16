// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { MemorySaveStore, parseProgression, SaveManager } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GameHost } from "../../src/game/gameHost";
import { PROGRESSION_RAW } from "../../src/game/missions";
import { createGarage } from "../../src/render/garage";
import { Profile, ROSTER } from "../../src/save";
import { graphicsProfile } from "../../src/ui/model/quality";
import { readManifest } from "../assets/helpers";
import { readBytes } from "../render/helpers";
import { ScriptedInput } from "./helpers";

let engine: NullEngine;
let host: GameHost;
let profile: Profile;
let manager: SaveManager;

beforeAll(async () => {
  engine = new NullEngine();
  manager = new SaveManager(new MemorySaveStore(), { starterCarId: ROSTER.starter, debounceMs: 1 });
  profile = await Profile.load(manager, ROSTER);
  const manifest = readManifest();
  host = new GameHost(
    {
      engine,
      canvas: {} as HTMLElement,
      manifest,
      loadBytes: readBytes,
      profile,
      progression: parseProgression(PROGRESSION_RAW),
      input: new ScriptedInput(),
      flags: { traffic: true, missions: true, debugCamera: false },
    },
    engine,
    () => createGarage(engine, manifest, readBytes, ROSTER),
  );
});

afterAll(() => {
  host.dispose();
  engine.dispose();
});

describe("GameHost", () => {
  it("has nothing loaded at first", () => {
    expect(host.districtId()).toBeUndefined();
    expect(host.snapshot()).toBeUndefined();
    expect(host.minimapModel()).toBeUndefined();
  });

  it("loads a district into a playable state", async () => {
    await host.loadDistrict("district-1");
    expect(host.districtId()).toBe("district-1");
    const play = host.snapshot();
    expect(play?.hud.phase).toBe("idle");
    expect(play?.markers).toHaveLength(8);
    const forward = play?.player.forward ?? { x: 0, z: 0 };
    expect(forward.x ** 2 + forward.z ** 2).toBeCloseTo(1);
    expect(host.minimapModel()?.roads.length).toBeGreaterThan(20);
    for (let i = 0; i < 90; i++) host.step();
    host.render(0.5, 1 / 60);
    expect(host.current?.session.car.spec.id).toBe("sedan");
  });

  it("pausing stops the simulation", async () => {
    host.setPaused(true);
    const tick = host.current?.session.physics.tick;
    for (let i = 0; i < 30; i++) host.step();
    expect(host.current?.session.physics.tick).toBe(tick);
    host.setPaused(false);
    host.step();
    expect(host.current?.session.physics.tick).toBe((tick ?? 0) + 1);
  });

  it("reports every simulated step to listeners, and none while paused", () => {
    const reports: number[] = [];
    const stop = host.onStep((report) => void reports.push(report.topSpeedKmh));
    for (let i = 0; i < 5; i++) host.step();
    expect(reports).toHaveLength(5);
    expect(reports[0]).toBe(host.current?.session.car.spec.topSpeedKmh);
    host.setPaused(true);
    for (let i = 0; i < 5; i++) host.step();
    expect(reports).toHaveLength(5);
    host.setPaused(false);
    stop();
    host.step();
    expect(reports).toHaveLength(5);
  });

  it("opens a mission from the menu and reports it in the snapshot", () => {
    host.mission.open("d1-m02", false);
    const play = host.snapshot();
    expect(play?.hud.phase).toBe("briefing");
    expect(play?.mission?.id).toBe("d1-m02");
    expect(play?.markers).toHaveLength(0);
    host.mission.accept();
    expect(host.snapshot()?.hud.phase).toBe("active");
    host.mission.leave();
    expect(host.snapshot()?.hud.phase).toBe("idle");
  });

  it("switching district disposes the old city and builds the new one", async () => {
    const old = host.current;
    const before = host.minimapModel();
    await host.loadDistrict("district-2");
    expect(host.districtId()).toBe("district-2");
    expect(old?.city.scene.isDisposed).toBe(true);
    expect(host.current?.city.scene.isDisposed).toBe(false);
    expect(host.snapshot()?.markers).toHaveLength(8);
    // District 2 is 16 tiles wide and district 1 is 12, so the minimap model is a new one.
    expect(host.minimapModel()?.maxX).toBeGreaterThan(before?.maxX ?? Number.POSITIVE_INFINITY);
  });

  it("rejects an unknown district", async () => {
    await expect(host.loadDistrict("district-9")).rejects.toThrow(/unknown district "district-9"/);
  });

  it("the selected car is the one that spawns in a rebuilt city", async () => {
    manager.commit({ ...manager.data, owned_cars: ["sedan", "hatch"], selected_car: "hatch" });
    await host.loadDistrict("district-1");
    expect(host.current?.session.car.spec.id).toBe("hatch");
  });

  it("graphics quality sets the engine scaling, the fog and the far plane", () => {
    // NullEngine always reports a scaling level of 1, so the call itself is observed.
    const setScaling = vi.spyOn(engine, "setHardwareScalingLevel");
    for (const quality of ["low", "medium", "high"] as const) {
      host.applyGraphics(quality);
      const profileFor = graphicsProfile(quality);
      expect(setScaling).toHaveBeenLastCalledWith(profileFor.hardwareScaling);
      const scene = host.current?.city.scene;
      expect(scene?.fogEnd).toBe(profileFor.fogEnd);
      expect(scene?.fogStart).toBe(profileFor.fogStart);
      expect(host.current?.camera.maxZ).toBe(profileFor.maxZ);
    }
  });

  it("a newly loaded district keeps the chosen graphics quality", async () => {
    host.applyGraphics("low");
    await host.loadDistrict("district-3");
    expect(host.current?.city.scene.fogEnd).toBe(graphicsProfile("low").fogEnd);
  });

  it("draws the garage scene instead of the city while the garage is open", async () => {
    await host.previewCar("racer");
    const cityScene = host.current?.city.scene;
    let cityFrames = 0;
    cityScene?.onAfterRenderObservable.add(() => cityFrames++);
    host.setGarageOpen(true);
    host.render(0, 1 / 60);
    expect(cityFrames).toBe(0);
    host.setGarageOpen(false);
    host.render(0, 1 / 60);
    expect(cityFrames).toBe(1);
  });
});
