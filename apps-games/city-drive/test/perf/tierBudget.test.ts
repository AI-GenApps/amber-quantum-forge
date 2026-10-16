// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { parseProgression } from "@city-drive/core";
import { mapHalfExtents } from "@city-drive/core/city";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PROGRESSION_RAW } from "../../src/game/missions";
import { QUALITY_TIERS } from "../../src/perf/tiers";
import { applyViewDistance } from "../../src/render/city";
import { CAMERA_MAX_Z, FOG_END, FOG_START, RENDER_BUDGETS } from "../../src/render/constants";
import { type FrameStats, frameStats } from "../../src/render/stats";
import { createTrafficVisual, type TrafficVisual } from "../../src/render/traffic";
import { readManifest } from "../assets/helpers";
import { buildDistrict, readBytes } from "../render/helpers";
import { budgetPoses, type Pose, trafficCrowd } from "../render/poses";

const progression = parseProgression(PROGRESSION_RAW);
const REPORT_PATH = join(
  __dirname,
  "../../../../.agents/resources/2026-10-15/city-drive-qa/15/tier-budget.json",
);

/** Worst draw calls and triangles over the 9 budget poses at one tier, plus the worst active meshes. */
function worstAt(
  scene: Parameters<typeof frameStats>[0],
  camera: UniversalCamera,
  traffic: TrafficVisual,
  poses: Pose[],
  tier: number,
  agents: number,
): FrameStats {
  const t = QUALITY_TIERS[tier];
  if (!t) throw new Error(`no tier ${tier}`);
  camera.maxZ = CAMERA_MAX_Z * t.view;
  scene.fogStart = FOG_START * t.view;
  scene.fogEnd = FOG_END * t.view;
  const worst: FrameStats = { activeMeshes: 0, drawCalls: 0, triangles: 0 };
  for (const pose of poses) {
    traffic.sync(trafficCrowd(pose, Math.max(1, Math.round(agents * t.traffic))));
    camera.position = new Vector3(pose.position.x, pose.position.y, pose.position.z);
    camera.setTarget(new Vector3(pose.target.x, pose.target.y, pose.target.z));
    scene.render();
    const stats = frameStats(scene);
    worst.activeMeshes = Math.max(worst.activeMeshes, stats.activeMeshes);
    worst.drawCalls = Math.max(worst.drawCalls, stats.drawCalls);
    worst.triangles = Math.max(worst.triangles, stats.triangles);
  }
  return worst;
}

const tierRows: Record<string, FrameStats[]> = {};

afterAll(() => {
  if (process.env.BUDGET_REPORT !== "1") return;
  const report = {
    method:
      "NullEngine; per district and quality tier, worst case over the 9 budget poses with the tier's far plane, fog and traffic count (AI cars as InstancedMesh); same cost model as the task 06 budget test",
    budgets: RENDER_BUDGETS,
    tiers: QUALITY_TIERS,
    districts: tierRows,
  };
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
});

for (const info of progression.districts) {
  describe(`${info.id} cost per quality tier`, () => {
    let built: Awaited<ReturnType<typeof buildDistrict>>;
    let camera: UniversalCamera;
    let traffic: TrafficVisual;

    beforeAll(async () => {
      built = await buildDistrict(info.id);
      camera = new UniversalCamera("tier-cam", Vector3.Zero(), built.city.scene);
      applyViewDistance(camera);
      built.city.scene.activeCamera = camera;
      traffic = await createTrafficVisual(built.city.scene, readManifest(), readBytes);
    });
    afterAll(() => {
      built.city.dispose();
      built.engine.dispose();
    });

    it("every tier stays inside the budgets and never costs more than the tier above it", () => {
      const half = mapHalfExtents(built.city.map);
      const poses = budgetPoses(half.x, half.z);
      const rows = QUALITY_TIERS.map((_, tier) =>
        worstAt(built.city.scene, camera, traffic, poses, tier, info.traffic_agents),
      );
      tierRows[info.id] = rows;
      for (const [tier, row] of rows.entries()) {
        expect(row.drawCalls, `tier ${tier} draw calls`).toBeLessThanOrEqual(
          RENDER_BUDGETS.maxDrawCalls,
        );
        expect(row.triangles, `tier ${tier} triangles`).toBeLessThanOrEqual(
          RENDER_BUDGETS.maxTriangles,
        );
        const above = rows[tier - 1];
        if (above) {
          expect(row.triangles, `tier ${tier} triangles vs ${tier - 1}`).toBeLessThanOrEqual(
            above.triangles,
          );
          expect(row.activeMeshes, `tier ${tier} meshes vs ${tier - 1}`).toBeLessThanOrEqual(
            above.activeMeshes,
          );
        }
      }
    });

    it("the shortest view hides chunks that are entirely beyond the fog end", () => {
      const half = mapHalfExtents(built.city.map);
      const pose = budgetPoses(half.x, half.z)[0];
      if (!pose) throw new Error("no pose");
      const rows = tierRows[info.id] ?? [];
      const first = rows[0];
      const last = rows[QUALITY_TIERS.length - 1];
      expect(first && last && last.triangles < first.triangles).toBe(true);
      const view = QUALITY_TIERS[QUALITY_TIERS.length - 1]?.view ?? 1;
      camera.maxZ = CAMERA_MAX_Z * view;
      camera.position = new Vector3(pose.position.x, pose.position.y, pose.position.z);
      const target = new Vector3(pose.target.x, pose.target.y, pose.target.z);
      camera.setTarget(target);
      const axis = target.subtract(camera.position).normalize();
      built.city.scene.render();
      const active = new Set(built.city.scene.getActiveMeshes().data);
      let hidden = 0;
      for (const mesh of built.city.statics) {
        const sphere = mesh.getBoundingInfo().boundingSphere;
        const depth = Vector3.Dot(sphere.centerWorld.subtract(camera.position), axis);
        if (mesh === built.city.ground) continue;
        if (depth - sphere.radiusWorld > camera.maxZ + 1) {
          hidden++;
          expect(active.has(mesh), mesh.name).toBe(false);
        }
      }
      expect(hidden, "some chunks lie beyond the shortest view").toBeGreaterThan(0);
    });
  });
}
