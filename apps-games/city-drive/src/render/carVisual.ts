import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "@city-drive/core";
import type { AssetManifest } from "../assets/manifest";
import type { CarPose } from "../game/interpolate";
import { AssetCache, type LoadBytes } from "./assetCache";
import { buildCarParts, wheelFor } from "./carModel";
import { createPackMaterials } from "./materials";

/** Mean suspension length (m) of the baseline car settled on flat ground. Sets the ride height. */
const SETTLED_SUSPENSION_M = 0.27;
const SHADOW_Y = 0.04;
const SHADOW_ALPHA = 0.38;

export interface CarVisual {
  /** Moves with the chassis centre. Everything else hangs off it. */
  root: TransformNode;
  body: Mesh;
  wheels: Mesh[];
  shadow: Mesh;
  /** Uniform model scale that makes the model's wheels match the physics wheel radius. */
  scale: number;
  sync(pose: CarPose): void;
  dispose(): void;
}

function makeShadow(scene: Scene, spec: CarSpec): Mesh {
  const shadow = CreateDisc("car-shadow", { radius: 1, tessellation: 20 }, scene);
  const material = new StandardMaterial("car-shadow", scene);
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();
  material.disableLighting = true;
  material.alpha = SHADOW_ALPHA;
  material.zOffset = -2;
  material.backFaceCulling = false;
  shadow.material = material;
  shadow.isPickable = false;
  shadow.scaling.set(spec.chassisHalfExtents.x * 1.1, spec.chassisHalfExtents.z * 0.85, 1);
  return shadow;
}

/**
 * Builds the drivable car: a body mesh and four wheel meshes under one root, plus a blob shadow.
 * The model is scaled so its wheels match the physics wheel radius (the wheels then touch the
 * ground); the body can be a little shorter than the collider.
 */
export async function createCarVisual(
  scene: Scene,
  manifest: AssetManifest,
  loadBytes: LoadBytes,
  spec: CarSpec,
  modelId = "car-sedan",
): Promise<CarVisual> {
  const cache = await AssetCache.load(scene, manifest, [modelId], loadBytes);
  const material = createPackMaterials(scene, cache, [modelId]).get(cache.entry(modelId).pack);
  const parts = buildCarParts(scene, cache, modelId);
  cache.dispose();

  const root = new TransformNode("car", scene);
  root.rotationQuaternion = Quaternion.Identity();
  const model = new TransformNode("car-model", scene);
  model.parent = root;
  const wheelRadius = (parts.wheels[0]?.radius as number) || spec.wheelRadius;
  const scale = spec.wheelRadius / wheelRadius;
  const firstWheel = spec.wheels[0];
  if (!firstWheel) throw new Error("car spec has no wheels");
  const rideY = -(Math.abs(firstWheel.position.y) + SETTLED_SUSPENSION_M + spec.wheelRadius);
  model.scaling.setAll(scale);
  model.position.y = rideY;

  parts.body.parent = model;
  const meshes = [parts.body];
  const wheels = spec.wheels.map((w) => {
    const part = wheelFor(parts, w.position.x, w.position.z);
    part.mesh.parent = model;
    part.mesh.position.copyFrom(part.centre);
    return { mesh: part.mesh, spec: w, centre: part.centre };
  });
  for (const mesh of [...meshes, ...wheels.map((w) => w.mesh)]) {
    mesh.setEnabled(true);
    mesh.material = material ?? null;
    mesh.isPickable = false;
    mesh.rotationQuaternion = null;
  }
  const shadow = makeShadow(scene, spec);
  shadow.rotation.x = Math.PI / 2;

  const sync = (pose: CarPose): void => {
    const { position: p, rotation: q } = pose;
    root.position.set(p.x, p.y, p.z);
    root.rotationQuaternion?.set(q.x, q.y, q.z, q.w);
    wheels.forEach((w, i) => {
      const state = pose.wheels[i];
      if (!state) return;
      // Chassis-local axle height, converted into the scaled model's frame.
      const localY = w.spec.position.y - state.suspensionLength;
      w.mesh.position.y = (localY - rideY) / scale;
      w.mesh.rotation.set(state.rotation, state.steering, 0);
    });
    // The shadow lies on the ground under the car, turned to the car's heading.
    const fx = 2 * (q.x * q.z + q.w * q.y);
    const fz = 1 - 2 * (q.x * q.x + q.y * q.y);
    shadow.position.set(p.x, SHADOW_Y, p.z);
    shadow.rotation.y = Math.atan2(fx, fz);
  };

  return {
    root,
    body: parts.body,
    wheels: wheels.map((w) => w.mesh),
    shadow,
    scale,
    sync,
    dispose: () => {
      for (const mesh of [parts.body, ...wheels.map((w) => w.mesh)]) mesh.dispose();
      shadow.dispose(false, true);
      model.dispose();
      root.dispose();
    },
  };
}
