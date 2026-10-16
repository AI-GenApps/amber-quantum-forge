// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import {
  BASELINE_CAR,
  parseProgression,
  quatFromForward,
  type TrafficPose,
} from "@city-drive/core";
import { mapHalfExtents } from "@city-drive/core/city";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PROGRESSION_RAW } from "../../src/game/missions";
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
import { buildDistrict, readBytes } from "./helpers";
import { budgetPoses, type Pose, sweepPoses, trafficCrowd } from "./poses";

const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/11/budget-report.json",
);

/** Free-roam start markers a district shows at once: one per mission. */
const MARKERS_IN_VIEW = 8;
/** Parked cars beside the two parking bays of a district. */
const PARKED_BAYS = 2;

const progression = parseProgression(PROGRESSION_RAW);
type Built = Awaited<ReturnType<typeof buildDistrict>>;
let built: Built;
let camera: UniversalCamera;
let carVisual: CarVisual;
let trafficVisual: TrafficVisual;
let missionVisual: MissionVisual;
let overlay: "none" | "free-roam" | "mission" = "none";
let crowd = 16;

const districtReports: Record<string, unknown>[] = [];
const round = (v: number) => Math.round(v * 1000) / 1000;

/** The two static cars beside each parking bay, drawn by the traffic renderer, during a mission. */
function parkedCars(pose: Pose): TrafficPose[] {
  if (overlay !== "mission") return [];
  const { car, forward } = pose;
  const out: TrafficPose[] = [];
  for (let bay = 0; bay < PARKED_BAYS; bay++) {
    for (const [i, side] of [-1, 1].entries()) {
      out.push({
        id: -(bay * 2 + i + 1),
        modelIndex: 3,
        position: {
          x: car.x + forward.x * (30 + bay * 24 + side * 10.9) - forward.z * 3,
          y: 0.87,
          z: car.z + forward.z * (30 + bay * 24 + side * 10.9) + forward.x * 3,
        },
        rotation: quatFromForward(forward.x, forward.z),
        wheelRotation: 0,
        speedKmh: 0,
      });
    }
  }
  return out;
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
    const spots = Array.from({ length: MARKERS_IN_VIEW }, (_, i) =>
      at(20 + i * 9, (i % 2 === 0 ? 1 : -1) * (6 + i * 2)),
    );
    return { ...EMPTY_MISSION_VIEW, markers: spots };
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
  trafficVisual.sync([...trafficCrowd(pose, crowd), ...parkedCars(pose)]);
  missionVisual.sync(missionView(pose));
  camera.position = new Vector3(pose.position.x, pose.position.y, pose.position.z);
  camera.setTarget(new Vector3(pose.target.x, pose.target.y, pose.target.z));
  built.city.scene.render();
  return frameStats(built.city.scene);
}

afterAll(() => {
  if (process.env.BUDGET_REPORT !== "1") return;
  const report = {
    method:
      "NullEngine; for each district the player car (body, 4 wheels, blob shadow) is parked at each pose and the district's traffic density of AI cars (InstancedMesh body + 4 wheels each, 4 models) fills the view ahead of it; scene.render() once per pose; draw calls = sum over active meshes of sub-mesh counts (a thin-instance host or InstancedMesh source counts once per sub-mesh); triangles = sub-mesh triangles x thin-instance count over active meshes. Overlays: free-roam shows 8 start-marker beams; mission shows a 41-point route ribbon, the objective beam, a bay pad and the parked cars of two bays.",
    budgets: RENDER_BUDGETS,
    districts: districtReports,
  };
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
});

for (const info of progression.districts) {
  describe(`${info.id} render budget at ${info.traffic_agents} traffic cars`, () => {
    beforeAll(async () => {
      crowd = info.traffic_agents;
      overlay = "none";
      built = await buildDistrict(info.id);
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

    const summary: Record<string, unknown> = {
      district: info.id,
      trafficCars: info.traffic_agents,
    };

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
      summary.map = {
        id: built.city.map.id,
        width: built.city.map.width,
        height: built.city.map.height,
      };
      summary.poses = rows.map(({ pose, stats }) => ({ name: pose.name, ...stats }));
      summary.worst = { drawCalls: worstDraw, triangles: worstTri };
    });

    it("sweep over a grid of car positions and headings stays within the hard budgets", () => {
      const half = mapHalfExtents(built.city.map);
      let worstDraw = 0;
      let worstTri = 0;
      let worstDrawAt = "";
      for (const pose of sweepPoses(half.x, half.z, 20)) {
        const stats = measure(pose);
        if (stats.drawCalls > worstDraw) {
          worstDraw = stats.drawCalls;
          worstDrawAt = pose.name;
        }
        worstTri = Math.max(worstTri, stats.triangles);
      }
      console.log(`${info.id} sweep worst: ${worstDraw} draws at ${worstDrawAt}; ${worstTri} tris`);
      expect(worstDraw).toBeLessThanOrEqual(RENDER_BUDGETS.maxDrawCalls);
      expect(worstTri).toBeLessThanOrEqual(RENDER_BUDGETS.maxTriangles);
      summary.sweepWorst = { drawCalls: worstDraw, triangles: worstTri, at: worstDrawAt };
    });

    it("stays inside the budgets with the markers, route ribbon, objective beam and bays visible", () => {
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
      summary.overlays = {
        worst: { drawCalls: worstDraw, triangles: worstTri },
        sweepWorstMission: { drawCalls: sweepDraw, triangles: sweepTri },
      };
      districtReports.push({ ...summary, camera: { fov: round(camera.fov), maxZ: camera.maxZ } });
    });
  });
}
