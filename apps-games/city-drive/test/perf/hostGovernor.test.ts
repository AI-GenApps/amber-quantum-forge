// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { MemorySaveStore, parseProgression, SaveManager } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it, type MockInstance, vi } from "vitest";
import { GameHost } from "../../src/game/gameHost";
import { PROGRESSION_RAW } from "../../src/game/missions";
import { QUALITY_TIERS } from "../../src/perf/tiers";
import { createGarage } from "../../src/render/garage";
import { Profile, ROSTER } from "../../src/save";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "../game/helpers";
import { readBytes } from "../render/helpers";

let engine: NullEngine;
let host: GameHost;
let ratio = 3;
let initialScaling: number | undefined;
let setScaling: MockInstance<NullEngine["setHardwareScalingLevel"]>;

/** Feeds `ms` of frames of `frameMs` each to the host. */
function feed(frameMs: number, ms: number): void {
  for (let t = 0; t < ms; t += frameMs) host.recordFrame(frameMs);
}

beforeAll(async () => {
  engine = new NullEngine();
  setScaling = vi.spyOn(engine, "setHardwareScalingLevel");
  const manager = new SaveManager(new MemorySaveStore(), {
    starterCarId: ROSTER.starter,
    debounceMs: 1,
  });
  const profile = await Profile.load(manager, ROSTER);
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
    () => ratio,
  );
  initialScaling = setScaling.mock.calls[0]?.[0];
  await host.loadDistrict("district-3");
  for (let i = 0; i < 30; i++) host.step();
});

afterAll(() => {
  host.dispose();
  engine.dispose();
});

describe("GameHost quality governor wiring", () => {
  it("caps the render resolution at a 2x pixel ratio and applies it at construction", () => {
    expect(initialScaling).toBe(0.5);
    host.applyGraphics("high");
    expect(setScaling).toHaveBeenLastCalledWith(0.5);
    ratio = 1;
    host.refreshScaling();
    expect(setScaling).toHaveBeenLastCalledWith(1);
    ratio = 3;
    host.refreshScaling();
    expect(setScaling).toHaveBeenLastCalledWith(0.5);
  });

  it("slow frames walk the ladder: resolution, then view distance, then traffic", () => {
    const camera = host.current?.camera;
    const scene = host.current?.city.scene;
    if (!camera || !scene) throw new Error("no district");
    const fullFogEnd = scene.fogEnd;
    const fullAgents = host.current?.session.traffic?.list.length ?? 0;
    expect(fullAgents).toBeGreaterThan(8);

    feed(50, 2200);
    expect(host.tier).toBe(1);
    expect(setScaling).toHaveBeenLastCalledWith((QUALITY_TIERS[1]?.scaling ?? 0) / 2);
    feed(50, 3 * 2200);
    expect(host.tier).toBe(4);
    expect(scene.fogEnd).toBeCloseTo(fullFogEnd * 0.8);
    expect(camera.maxZ).toBeCloseTo(240 * 0.8);
    feed(50, 3 * 2200);
    expect(host.tier).toBe(7);
    expect(scene.fogEnd).toBeCloseTo(fullFogEnd * 0.6);
    for (let i = 0; i < 120; i++) host.step();
    const thinned = host.current?.session.traffic?.list.length ?? 0;
    expect(thinned).toBeLessThanOrEqual(Math.round(fullAgents * 0.3) + 1);
    expect(thinned).toBeGreaterThan(0);
  });

  it("applying the same quality again after a district load keeps the learned tier", async () => {
    expect(host.tier).toBe(7);
    await host.loadDistrict("district-1");
    host.applyGraphics("high");
    expect(host.tier).toBe(7);
    expect(host.current?.city.scene.fogEnd).toBeCloseTo(220 * 0.6);
  });

  it("a different quality setting restarts the governor at that setting's tier", () => {
    host.applyGraphics("low");
    expect(host.tier).toBe(2);
    expect(host.current?.city.scene.fogEnd).toBe(130);
    host.applyGraphics("medium");
    expect(host.tier).toBe(1);
    host.applyGraphics("auto");
    expect(host.tier).toBe(0);
    expect(host.current?.city.scene.fogEnd).toBe(220);
  });

  it("fast frames climb back, but not above the setting's ceiling", () => {
    host.applyGraphics("low");
    feed(50, 3 * 2200);
    expect(host.tier).toBe(5);
    feed(10, 60_000);
    expect(host.tier).toBe(2);
  });
});
