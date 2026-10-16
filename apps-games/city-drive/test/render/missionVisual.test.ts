// @vitest-environment node
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAX_ARROWS } from "../../src/render/missionRouteMath";
import {
  createMissionVisual,
  EMPTY_MISSION_VIEW,
  type MissionView,
  type MissionVisual,
} from "../../src/render/missionVisual";
import { createScene } from "../../src/render/scene";

let engine: NullEngine;
let visual: MissionVisual;
let scene: ReturnType<typeof createScene>;

beforeAll(() => {
  engine = new NullEngine();
  scene = createScene(engine);
  visual = createMissionVisual(scene);
});

afterAll(() => {
  visual.dispose();
  scene.dispose();
  engine.dispose();
});

const route = Array.from({ length: 30 }, (_, i) => ({ x: 0, z: i * 5 }));
const bay = {
  centre: { x: 3, z: 40 },
  axis: { x: 0, z: 1 },
  right: { x: -1, z: 0 },
  halfLength: 2.8,
  halfWidth: 1.3,
  parkedCars: [],
};

function mesh(name: string) {
  const found = visual.meshes.find((m) => m.name === name);
  if (!found) throw new Error(`no ${name} mesh`);
  return found;
}

describe("mission visual", () => {
  it("draws nothing for an empty view", () => {
    visual.sync(EMPTY_MISSION_VIEW);
    expect(visual.visible).toEqual([]);
  });

  it("draws one beam instance per free-roam marker", () => {
    visual.sync({
      ...EMPTY_MISSION_VIEW,
      markers: [
        { x: 1, z: 2 },
        { x: 30, z: -4 },
        { x: 8, z: 8 },
      ],
    });
    expect(visual.visible).toEqual(["mission-beam"]);
    expect(mesh("mission-beam").thinInstanceCount).toBe(3);
  });

  it("puts the beam on the objective while a mission runs, ignoring markers", () => {
    const view: MissionView = {
      markers: [{ x: 1, z: 2 }],
      route: undefined,
      objective: { x: 9, z: 9 },
      bay: undefined,
    };
    visual.sync(view);
    expect(mesh("mission-beam").thinInstanceCount).toBe(1);
  });

  it("draws the route as thin-instanced arrows, capped, and clears it with the route", () => {
    visual.sync({ ...EMPTY_MISSION_VIEW, route });
    expect(visual.visible).toEqual(["mission-arrow"]);
    expect(mesh("mission-arrow").thinInstanceCount).toBeGreaterThan(10);
    expect(mesh("mission-arrow").thinInstanceCount).toBeLessThanOrEqual(MAX_ARROWS);
    visual.sync(EMPTY_MISSION_VIEW);
    expect(visual.visible).toEqual([]);
    expect(mesh("mission-arrow").thinInstanceCount).toBe(0);
  });

  it("shows the bay pad sized and placed from the bay geometry", () => {
    visual.sync({ ...EMPTY_MISSION_VIEW, bay });
    expect(visual.visible).toEqual(["mission-bay"]);
    const pad = mesh("mission-bay");
    expect(pad.position.x).toBeCloseTo(3);
    expect(pad.position.z).toBeCloseTo(40);
    expect(pad.scaling.x).toBeCloseTo(2.6);
    expect(pad.scaling.z).toBeCloseTo(5.6);
  });

  it("costs at most three draw calls with everything on", () => {
    visual.sync({ markers: [], route, objective: { x: 0, z: 140 }, bay });
    expect([...visual.visible].sort()).toEqual(["mission-arrow", "mission-bay", "mission-beam"]);
    expect(visual.meshes.every((m) => (m.subMeshes?.length ?? 0) === 1)).toBe(true);
  });

  it("uses unlit translucent materials so night and fog do not hide it", () => {
    for (const m of visual.meshes) {
      const material = m.material as { disableLighting?: boolean; alpha?: number } | null;
      expect(material?.disableLighting).toBe(true);
      expect(material?.alpha ?? 1).toBeLessThan(1);
    }
  });
});
