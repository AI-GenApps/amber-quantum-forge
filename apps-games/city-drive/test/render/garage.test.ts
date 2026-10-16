// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RENDER_BUDGETS } from "../../src/render/constants";
import { createGarage, GARAGE_MAX_DRAW_CALLS, type GarageScene } from "../../src/render/garage";
import { frameStats } from "../../src/render/stats";
import { ROSTER } from "../../src/save";
import { readManifest } from "../assets/helpers";
import { readBytes } from "./helpers";

const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/13/garage-budget-report.json",
);

let engine: NullEngine;
let garage: GarageScene;
const rows: { car: string; activeMeshes: number; drawCalls: number; triangles: number }[] = [];

beforeAll(async () => {
  engine = new NullEngine();
  garage = await createGarage(engine, readManifest(), readBytes, ROSTER);
});

afterAll(() => {
  garage.dispose();
  engine.dispose();
  if (process.env.BUDGET_REPORT !== "1") return;
  const report = {
    method:
      "NullEngine; the garage scene (floor disc, turntable car with body, 4 wheels and blob shadow) is rendered once per roster car after every car has been loaded (so the hidden cars are in the scene but disabled); draw calls and triangles use the same cost model as the city budget test (frameStats).",
    budget: { maxDrawCalls: GARAGE_MAX_DRAW_CALLS, maxTriangles: RENDER_BUDGETS.maxTriangles },
    cars: rows,
  };
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
});

describe("garage scene", () => {
  it("is right-handed like the city, so cars are not mirrored", () => {
    expect(garage.scene.useRightHandedSystem).toBe(true);
  });

  it("starts empty and rejects a car that is not in the roster", async () => {
    expect(garage.shown).toBeUndefined();
    await expect(garage.show("flying-saucer")).rejects.toThrow(/unknown car "flying-saucer"/);
  });

  it("builds every roster model (regression: the SUV GLB has a fifth, spare wheel node)", async () => {
    for (const car of ROSTER.cars) await expect(garage.show(car.id)).resolves.toBeUndefined();
  });

  it("renders every roster car in at most 20 draw calls and inside the triangle budget", async () => {
    for (const car of ROSTER.cars) await garage.show(car.id);
    for (const car of ROSTER.cars) {
      await garage.show(car.id);
      garage.update(0.4);
      garage.render();
      const stats = frameStats(garage.scene);
      rows.push({ car: car.id, ...stats });
      expect(stats.activeMeshes, car.id).toBeGreaterThan(3);
      expect(stats.drawCalls, `${car.id} draw calls`).toBeLessThanOrEqual(GARAGE_MAX_DRAW_CALLS);
      expect(stats.triangles, `${car.id} triangles`).toBeLessThanOrEqual(
        RENDER_BUDGETS.maxTriangles,
      );
      expect(garage.shown).toBe(car.id);
    }
  });

  it("shows exactly one car at a time even though all of them are loaded", async () => {
    await garage.show("sedan");
    const enabled = garage.scene.meshes.filter(
      (m) => m.isEnabled() && m.getTotalVertices() > 0 && m.name !== "garage-floor",
    );
    // Body and wheel meshes are named "<model>:<part>"; the blob shadow is the only other mesh.
    const models = new Set(
      enabled.filter((m) => m.name.includes(":")).map((m) => m.name.split(":")[0]),
    );
    expect([...models]).toEqual(["car-sedan"]);
  });

  it("the turntable turns the car", async () => {
    await garage.show("sedan");
    const body = garage.scene.getTransformNodeByName("car");
    expect(body).not.toBeNull();
    const before = body?.rotationQuaternion?.clone();
    garage.update(1);
    const after = body?.rotationQuaternion;
    expect(before && after && !before.equals(after)).toBe(true);
  });

  it("keeps the car left of the panel by rendering into the left 60% of the canvas", () => {
    const camera = garage.scene.activeCamera;
    expect(camera?.viewport.width).toBeCloseTo(0.6);
    expect(camera?.viewport.x).toBe(0);
  });
});
