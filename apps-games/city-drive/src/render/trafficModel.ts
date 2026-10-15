import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { trafficConstants } from "@city-drive/core";
import type { AssetCache } from "./assetCache";
import { buildCarParts } from "./carModel";

/** One traffic car model: a shared body source mesh and where its four wheels sit. */
export interface TrafficModel {
  id: string;
  body: Mesh;
  /** The four wheel centres in model space (the middle of each wheel, not its node origin). */
  axles: Vector3[];
  /** Uniform scale that makes the model's wheels match the physics wheel radius. */
  scale: number;
}

/**
 * Takes the body and the four axle positions from a Kenney car GLB. Its own wheel meshes are
 * dropped: traffic draws the shared low-poly wheel instead (see trafficWheel.ts).
 */
export function buildTrafficModel(
  scene: Scene,
  cache: AssetCache,
  id: string,
  material: StandardMaterial,
): TrafficModel {
  const parts = buildCarParts(scene, cache, id);
  const radius = parts.wheels[0]?.radius || trafficConstants.WHEEL_RADIUS_M;
  const axles = parts.wheels.map((w) => {
    w.mesh.refreshBoundingInfo();
    // The Kenney wheel hangs outward from its node origin; the true axle centre is the middle of it.
    return w.centre.add(w.mesh.getBoundingInfo().boundingBox.center);
  });
  for (const wheel of parts.wheels) wheel.mesh.dispose();
  parts.body.material = material;
  parts.body.isPickable = false;
  parts.body.rotationQuaternion = null;
  return { id, body: parts.body, axles, scale: trafficConstants.WHEEL_RADIUS_M / radius };
}
