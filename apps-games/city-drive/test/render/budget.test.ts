// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { BASELINE_CAR, quatFromForward, type TrafficPose } from "@city-drive/core";
import { mapHalfExtents } from "@city-drive/core/city";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type CarVisual, createCarVisual } from "../../src/render/carVisual";
import { applyViewDistance } from "../../src/render/city";
import { RENDER_BUDGETS } from "../../src/render/constants";
import {
  createMissionVisual,
  EMPTY_MISSION_VIEW,
  type MissionView,
  type MissionVisual,
} from "../../src/render/missionVisual";
import { type FrameStats, frameStats } from "../../src/render/stats";
import { createTrafficVisual, type TrafficVisual } from "../../src/render/traffic";
import { readManifest } from "../assets/helpers";
import { buildDistrict1, readBytes } from "./helpers";
import { budgetPoses, type Pose, sweepPoses, trafficCrowd } from "./poses";

const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/09/budget-report.json",
);

type Built = Awaited<ReturnType<typeof buildDistrict1>>;
let built: Built;
let camera: UniversalCamera;
let carVisual: CarVisual;
let trafficVisual: TrafficVisual;
let missionVisual: MissionVisual;
let overlay: "none" | "free-roam" | "mission" = "none";

const MISSION_REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/10/budget-report.json",
);

/** The two static cars beside a parking bay, drawn by the traffic renderer, during a mission. */
function parkedCars(pose: Pose): TrafficPose[] {
  if (overlay !== "mission") return [];
  const { car, forward } = pose;
  return [-1, 1].map((side, i) => ({
    id: -(i + 1),
    modelIndex: 3,
    position: {
      x: car.x + forward.x * (30 + side * 10.9) - forward.z * 3,
      y: 0.87,
      z: car.z + forward.z * (30 + side * 10.9) + forward.x * 3,
    },
    rotation: quatFromForward(forward.x, forward.z),
    wheelRotation: 0,
    speedKmh: 0,
  }));
}

/** Everything the mission renderer can show at once, around the pose's car. */
function missionView(pose: Pose): MissionView {
  if (overlay === "none") return EMPTY_MISSION_VIEW;
  const { car, forward } = pose;
  const side = { x: -forward.z, z: forward.x };
  const at = (ahead: number, across: number) => ({
    x: car.x + forward.x * ahead + side.x * across,
    z: car.z + forward.z * ahead + side.z * across,
  });
  if (overlay === "free-roam") {
    return {
      ...EMPTY_MISSION_VIEW,
      markers: [at(25, 0), at(45, 18), at(60, -18), at(80, 6)],
    };
  }
  const route = Array.from({ length: 41 }, (_, i) => at(i * 4, 0));
  const centre = at(30, 3);
  return {
    markers: [],
    route,
    objective: at(60, 0),
    bay: {
      centre,
      axis: forward,
      right: { x: -forward.z, z: forward.x },
      halfLength: 2.8,
      halfWidth: 1.3,
      parkedCars: [],
    },
  };
}

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
  trafficVisual.sync([...trafficCrowd(pose), ...parkedCars(pose)]);
  missionVisual.sync(missionView(pose));
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
  trafficVisual = await createTrafficVisual(built.city.scene, readManifest(), readBytes);
  missionVisual = createMissionVisual(built.city.scene);
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
        trafficCarsInView: 16,
        method:
          "NullEngine; the player car (body, 4 wheels, blob shadow) is parked at each pose and 16 traffic cars (InstancedMesh body + 4 wheels each, 4 models) fill the view ahead of it; scene.render() once per pose; draw calls = sum over active meshes of sub-mesh counts (a thin-instance host or InstancedMesh source counts once per sub-mesh); triangles = sub-mesh triangles x thin-instance count over active meshes; SceneInstrumentation is not meaningful under NullEngine",
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

  it("stays inside the budgets with the markers, route ribbon, objective beam and bay visible", () => {
    const half = mapHalfExtents(built.city.map);
    const poses = budgetPoses(half.x, half.z);
    const rows: { overlay: string; pose: Pose; stats: FrameStats }[] = [];
    for (const kind of ["free-roam", "mission"] as const) {
      overlay = kind;
      for (const pose of poses) rows.push({ overlay: kind, pose, stats: measure(pose) });
    }
    for (const { overlay: kind, pose, stats } of rows) {
      expect(stats.drawCalls, `${kind} ${pose.name} draw calls`).toBeLessThanOrEqual(
        RENDER_BUDGETS.maxDrawCalls,
      );
      expect(stats.triangles, `${kind} ${pose.name} triangles`).toBeLessThanOrEqual(
        RENDER_BUDGETS.maxTriangles,
      );
    }
    const worstDraw = Math.max(...rows.map((r) => r.stats.drawCalls));
    const worstTri = Math.max(...rows.map((r) => r.stats.triangles));
    expect(worstDraw, "draw-call target").toBeLessThan(RENDER_BUDGETS.targetDrawCalls);

    overlay = "mission";
    let sweepDraw = 0;
    let sweepTri = 0;
    for (const pose of sweepPoses(half.x, half.z, 20)) {
      const stats = measure(pose);
      sweepDraw = Math.max(sweepDraw, stats.drawCalls);
      sweepTri = Math.max(sweepTri, stats.triangles);
    }
    expect(sweepDraw).toBeLessThanOrEqual(RENDER_BUDGETS.maxDrawCalls);
    expect(sweepTri).toBeLessThanOrEqual(RENDER_BUDGETS.maxTriangles);
    overlay = "none";

    if (process.env.BUDGET_REPORT === "1") {
      const report = {
        map: built.city.map.id,
        withPlayerCar: true,
        trafficCarsInView: 16,
        missionVisuals:
          "free-roam: 4 start-marker beams; mission: 41-point route ribbon (40 arrows), objective beam and a bay pad, all in view of every pose",
        method:
          "NullEngine; same cost model as task 09 (sub-mesh counts of active meshes, thin-instance counts for triangles); mission overlays are the thin-instance beam and arrow hosts and the bay pad",
        budgets: RENDER_BUDGETS,
        poses: rows.map(({ overlay: kind, pose, stats }) => ({
          overlay: kind,
          name: pose.name,
          ...stats,
        })),
        worst: { drawCalls: worstDraw, triangles: worstTri },
        sweepWorstMission: { drawCalls: sweepDraw, triangles: sweepTri },
      };
      mkdirSync(dirname(MISSION_REPORT_PATH), { recursive: true });
      writeFileSync(MISSION_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    }
  });
});
