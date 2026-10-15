// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { BASELINE_CAR, quatFromForward } from "@city-drive/core";
import { mapHalfExtents } from "@city-drive/core/city";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type CarVisual, createCarVisual } from "../../src/render/carVisual";
import { applyViewDistance } from "../../src/render/city";
import { RENDER_BUDGETS } from "../../src/render/constants";
import { type FrameStats, frameStats } from "../../src/render/stats";
import { readManifest } from "../assets/helpers";
import { buildDistrict1, readBytes } from "./helpers";
import { budgetPoses, type Pose, sweepPoses } from "./poses";

const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/07/budget-report.json",
);

type Built = Awaited<ReturnType<typeof buildDistrict1>>;
let built: Built;
let camera: UniversalCamera;
let carVisual: CarVisual;

/** Park the player's car at the pose's car spot, facing the pose's heading, on its settled wheels. */
function placeCar(pose: Pose): void {
  const q = quatFromForward(pose.forward.x, pose.forward.z);
  carVisual.sync({
    position: { x: pose.car.x, y: 0.87, z: pose.car.z },
    rotation: q,
    speedKmh: 0,
    wheels: BASELINE_CAR.wheels.map(() => ({ steering: 0, rotation: 0, suspensionLength: 0.27 })),
  });
}

function measure(pose: Pose): FrameStats {
  placeCar(pose);
  camera.position = new Vector3(pose.position.x, pose.position.y, pose.position.z);
  camera.setTarget(new Vector3(pose.target.x, pose.target.y, pose.target.z));
  built.city.scene.render();
  return frameStats(built.city.scene);
}

const round = (v: number) => Math.round(v * 1000) / 1000;

beforeAll(async () => {
  built = await buildDistrict1();
  camera = new UniversalCamera("budget-cam", Vector3.Zero(), built.city.scene);
  applyViewDistance(camera);
  built.city.scene.activeCamera = camera;
  carVisual = await createCarVisual(built.city.scene, readManifest(), readBytes, BASELINE_CAR);
});

afterAll(() => {
  built.city.dispose();
  built.engine.dispose();
});

describe("district-1 render budget", () => {
  it("stays inside the draw-call and triangle budgets at all 9 poses", () => {
    const half = mapHalfExtents(built.city.map);
    const poses = budgetPoses(half.x, half.z);
    expect(poses).toHaveLength(9);
    const rows = poses.map((pose) => ({ pose, stats: measure(pose) }));
    for (const { pose, stats } of rows) {
      expect(stats.activeMeshes, pose.name).toBeGreaterThan(0);
      expect(stats.drawCalls, `${pose.name} draw calls`).toBeLessThanOrEqual(
        RENDER_BUDGETS.maxDrawCalls,
      );
      expect(stats.triangles, `${pose.name} triangles`).toBeLessThanOrEqual(
        RENDER_BUDGETS.maxTriangles,
      );
    }
    const worstDraw = Math.max(...rows.map((r) => r.stats.drawCalls));
    const worstTri = Math.max(...rows.map((r) => r.stats.triangles));
    expect(worstDraw, "draw-call target").toBeLessThan(RENDER_BUDGETS.targetDrawCalls);

    if (process.env.BUDGET_REPORT === "1") {
      const report = {
        map: built.city.map.id,
        withPlayerCar: true,
        method:
          "NullEngine; the player car (body, 4 wheels, blob shadow) is parked at each pose; scene.render() once per pose; draw calls = sum over active meshes of sub-mesh counts (a thin-instance host or InstancedMesh source counts once per sub-mesh); triangles = sub-mesh triangles x thin-instance count over active meshes; SceneInstrumentation is not meaningful under NullEngine",
        budgets: RENDER_BUDGETS,
        camera: { fov: round(camera.fov), minZ: camera.minZ, maxZ: camera.maxZ },
        poses: rows.map(({ pose, stats }) => ({
          name: pose.name,
          camera: {
            x: round(pose.position.x),
            y: round(pose.position.y),
            z: round(pose.position.z),
          },
          target: { x: round(pose.target.x), y: round(pose.target.y), z: round(pose.target.z) },
          ...stats,
        })),
        worst: { drawCalls: worstDraw, triangles: worstTri },
      };
      mkdirSync(dirname(REPORT_PATH), { recursive: true });
      writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    }
  });

  it("sweep over a grid of car positions and headings stays within the hard budgets", () => {
    const half = mapHalfExtents(built.city.map);
    let worstDraw = 0;
    let worstTri = 0;
    let worstDrawAt = "";
    let worstTriAt = "";
    for (const pose of sweepPoses(half.x, half.z, 20)) {
      const stats = measure(pose);
      if (stats.drawCalls > worstDraw) {
        worstDraw = stats.drawCalls;
        worstDrawAt = pose.name;
      }
      if (stats.triangles > worstTri) {
        worstTri = stats.triangles;
        worstTriAt = pose.name;
      }
    }
    console.log(
      `sweep worst: ${worstDraw} draws at ${worstDrawAt}; ${worstTri} tris at ${worstTriAt}`,
    );
    expect(worstDraw).toBeLessThanOrEqual(RENDER_BUDGETS.maxDrawCalls);
    expect(worstTri).toBeLessThanOrEqual(RENDER_BUDGETS.maxTriangles);
  });
});
