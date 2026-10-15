import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { trafficConstants } from "@city-drive/core";
import { flatMaterial } from "./materials";

/** Sides of the tyre. Low on purpose: 16 cars carry 64 wheels. */
const TESSELLATION = 12;
const WIDTH_M = 0.36;
const TYRE = new Color4(0.1, 0.1, 0.11, 1);
const HUB = new Color4(0.72, 0.72, 0.75, 1);

/**
 * One cheap wheel shared by every traffic car: a 12-sided tyre with a light bar across the hub so
 * that spin shows. About 70 triangles against 332 for the Kenney wheel, which the 150k triangle
 * budget cannot afford 64 times. Built at the physical wheel radius, axle along X, vertex-coloured
 * (our own geometry, not a pack asset). Instances must undo the model scale.
 */
export function buildTrafficWheel(scene: Scene): Mesh {
  const radius = trafficConstants.WHEEL_RADIUS_M;
  const tyre = CreateCylinder(
    "traffic-wheel:tyre",
    {
      diameter: radius * 2,
      height: WIDTH_M,
      tessellation: TESSELLATION,
      faceColors: [HUB, TYRE, HUB],
    },
    scene,
  );
  tyre.rotation.z = Math.PI / 2;
  tyre.bakeCurrentTransformIntoVertices();
  const bar = CreateBox(
    "traffic-wheel:bar",
    {
      width: WIDTH_M + 0.02,
      height: 0.06,
      depth: radius * 1.5,
      faceColors: Array.from({ length: 6 }, () => HUB),
    },
    scene,
  );
  const wheel = Mesh.MergeMeshes([tyre, bar], true, true);
  if (!wheel) throw new Error("traffic wheel: merge produced no mesh");
  wheel.name = "traffic-wheel";
  wheel.material = flatMaterial(scene, "traffic-wheel", Color3.White());
  wheel.isPickable = false;
  wheel.setEnabled(false);
  return wheel;
}
