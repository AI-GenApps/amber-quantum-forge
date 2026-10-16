// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { MemorySaveStore, parseProgression, SaveManager } from "@city-drive/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GameHost } from "../../src/game/gameHost";
import { PROGRESSION_RAW } from "../../src/game/missions";
import { createGarage } from "../../src/render/garage";
import { Profile, ROSTER } from "../../src/save";
import { readManifest } from "../assets/helpers";
import { ScriptedInput } from "../game/helpers";
import { readBytes } from "../render/helpers";

const DISTRICTS = ["district-1", "district-2", "district-3"];
const SWITCHES = 10;

interface Counts {
  meshes: number;
  materials: number;
  textures: number;
  geometries: number;
  transformNodes: number;
  lights: number;
  cameras: number;
}

function sceneCounts(scene: Scene): Counts {
  return {
    meshes: scene.meshes.length,
    materials: scene.materials.length,
    textures: scene.textures.length,
    geometries: scene.geometries.length,
    transformNodes: scene.transformNodes.length,
    lights: scene.lights.length,
    cameras: scene.cameras.length,
  };
}

let engine: NullEngine;
let host: GameHost;
const released = new Set<unknown>();

/**
 * GPU textures still alive. NullEngine never forgets a texture in its cache, but a real engine
 * frees one when `_releaseTexture` is called, so the live ones are the cache minus the released.
 */
function liveTextures(): number {
  return engine.getLoadedTexturesCache().filter((t) => !released.has(t)).length;
}

beforeAll(async () => {
  engine = new NullEngine();
  const release = engine._releaseTexture.bind(engine);
  engine._releaseTexture = (texture) => {
    released.add(texture);
    release(texture);
  };
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
  );
});

afterAll(() => {
  host.dispose();
  engine.dispose();
});

describe("district switching does not leak", () => {
  it(`${SWITCHES} switches return meshes, materials, textures and geometries to baseline`, async () => {
    const baseline = new Map<string, Counts>();
    const disposed: Scene[] = [];
    const baselineTextures = new Map<string, number>();
    for (let i = 0; i < SWITCHES; i++) {
      const id = DISTRICTS[i % DISTRICTS.length] ?? "district-1";
      const before = host.current?.city.scene;
      await host.loadDistrict(id);
      for (let step = 0; step < 20; step++) host.step();
      host.render(0.5, 1 / 60);
      const scene = host.current?.city.scene;
      if (!scene) throw new Error("no scene after load");
      if (before) disposed.push(before);

      const counts = sceneCounts(scene);
      const first = baseline.get(id);
      if (first) {
        expect(counts, `${id} visit ${i}`).toEqual(first);
      } else {
        baseline.set(id, counts);
        expect(counts.meshes).toBeGreaterThan(10);
        expect(counts.materials).toBeGreaterThan(2);
      }
      expect(engine.scenes.length, `live scenes after switch ${i}`).toBe(1);
      const live = liveTextures();
      const firstLive = baselineTextures.get(id);
      if (firstLive === undefined) baselineTextures.set(id, live);
      else expect(live, `${id} live GPU textures at visit ${i}`).toBe(firstLive);
    }
    for (const scene of disposed) expect(scene.isDisposed).toBe(true);
    expect(baseline.size).toBe(3);
    for (const [id, live] of baselineTextures) {
      expect(live, `${id} keeps one colormap per pack plus the car and traffic`).toBeLessThan(16);
    }
  });

  it("reloading the same district 10 times keeps the live GPU texture count flat", async () => {
    await host.loadDistrict("district-1");
    const settled = liveTextures();
    const scenes = engine.scenes.length;
    for (let i = 0; i < SWITCHES; i++) await host.loadDistrict("district-1");
    expect(liveTextures()).toBe(settled);
    expect(engine.scenes.length).toBe(scenes);
  });

  it("the previous district's scene is disposed with all of its meshes and materials", async () => {
    await host.loadDistrict("district-2");
    const old = host.current?.city.scene;
    if (!old) throw new Error("no scene");
    await host.loadDistrict("district-3");
    expect(old.isDisposed).toBe(true);
    expect(old.meshes).toHaveLength(0);
    expect(old.materials).toHaveLength(0);
    expect(old.textures).toHaveLength(0);
  });
});
