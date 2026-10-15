import "@babylonjs/core/Meshes/instancedMesh.js";
import { Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { type TrafficPose, trafficConstants } from "@city-drive/core";
import type { AssetManifest } from "../assets/manifest";
import { AssetCache, type LoadBytes } from "./assetCache";
import { createPackMaterials, requirePackMaterial } from "./materials";
import { buildTrafficModel, type TrafficModel } from "./trafficModel";
import { buildTrafficWheel } from "./trafficWheel";

/** Traffic car models, by `TrafficPose.modelIndex`. The SUV has a spare-wheel node, which buildCarParts rejects. */
const TRAFFIC_MODEL_IDS = ["car-hatchback-sports", "car-van", "car-truck", "car-sedan"] as const;

interface Slot {
  root: TransformNode;
  parts: InstancedMesh[];
  wheels: InstancedMesh[];
}

export interface TrafficVisual {
  /** Draw these poses: slots are bound to agent ids, new ids take a free slot. */
  sync(poses: readonly TrafficPose[]): void;
  /** Cars shown by the last sync. */
  readonly shown: number;
  /** Slots ever created, which is the high-water mark of cars on screen. */
  readonly slotCount: number;
  dispose(): void;
}

function makeSlot(scene: Scene, model: TrafficModel, wheel: Mesh): Slot {
  const root = new TransformNode(`traffic:${model.id}`, scene);
  root.rotationQuaternion = Quaternion.Identity();
  const frame = new TransformNode(`traffic:${model.id}:model`, scene);
  frame.parent = root;
  frame.scaling.setAll(model.scale);
  frame.position.y = -trafficConstants.AGENT_CENTRE_Y_M;
  const body = model.body.createInstance(`${model.id}:body`);
  body.parent = frame;
  const wheels = model.axles.map((axle, i) => {
    const mesh = wheel.createInstance(`${model.id}:wheel${i}`);
    mesh.parent = frame;
    mesh.position.copyFrom(axle);
    mesh.scaling.setAll(1 / model.scale);
    return mesh;
  });
  const parts = [body, ...wheels];
  for (const part of parts) part.isPickable = false;
  root.setEnabled(false);
  return { root, parts, wheels };
}

/**
 * One InstancedMesh per car part, per car: every instance of a model shares the model's body and
 * wheel source meshes, so the whole fleet costs 2 draw calls per model however many cars are
 * out. Cars move every frame, so these are InstancedMesh, not thin instances.
 */
export async function createTrafficVisual(
  scene: Scene,
  manifest: AssetManifest,
  loadBytes: LoadBytes,
  modelIds: readonly string[] = TRAFFIC_MODEL_IDS,
): Promise<TrafficVisual> {
  const cache = await AssetCache.load(scene, manifest, modelIds, loadBytes);
  const materials = createPackMaterials(scene, cache, modelIds);
  const models = modelIds.map((id) =>
    buildTrafficModel(scene, cache, id, requirePackMaterial(materials, cache.entry(id).pack)),
  );
  cache.dispose();
  const wheel = buildTrafficWheel(scene);

  const free: Slot[][] = models.map(() => []);
  const all: Slot[] = [];
  const bound = new Map<number, { slot: Slot; model: number }>();
  let shown = 0;

  const acquire = (modelIndex: number): Slot | undefined => {
    const model = models[modelIndex % models.length];
    if (!model) return undefined;
    const slot = free[modelIndex % models.length]?.pop() ?? makeSlot(scene, model, wheel);
    if (!all.includes(slot)) all.push(slot);
    slot.root.setEnabled(true);
    return slot;
  };

  return {
    get shown() {
      return shown;
    },
    get slotCount() {
      return all.length;
    },
    sync(poses) {
      const live = new Set(poses.map((p) => p.id));
      for (const [id, entry] of bound) {
        if (live.has(id)) continue;
        entry.slot.root.setEnabled(false);
        free[entry.model]?.push(entry.slot);
        bound.delete(id);
      }
      for (const pose of poses) {
        let entry = bound.get(pose.id);
        if (!entry) {
          const model = pose.modelIndex % models.length;
          const slot = acquire(model);
          if (!slot) continue;
          entry = { slot, model };
          bound.set(pose.id, entry);
        }
        const { root, wheels } = entry.slot;
        const p = pose.position;
        const q = pose.rotation;
        root.position.set(p.x, p.y, p.z);
        root.rotationQuaternion?.set(q.x, q.y, q.z, q.w);
        for (const wheelMesh of wheels) wheelMesh.rotation.x = pose.wheelRotation;
      }
      shown = bound.size;
    },
    dispose() {
      for (const slot of all) {
        for (const part of slot.parts) part.dispose();
        slot.root.dispose(false, false);
      }
      for (const model of models) model.body.dispose();
      wheel.dispose();
      bound.clear();
      all.length = 0;
    },
  };
}
