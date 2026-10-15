import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { type CityMap, mapHalfExtents } from "@city-drive/core/city";
import type { AssetManifest } from "../assets/manifest";
import { AssetCache, type LoadBytes } from "./assetCache";
import { type BuiltChunk, buildChunks } from "./chunkBuilder";
import { CAMERA_MAX_Z, GRASS_COLOR, GROUND_MARGIN_M, GROUND_Y } from "./constants";
import { setupLighting } from "./lighting";
import { createPackMaterials, flatMaterial } from "./materials";
import { buildPads } from "./pads";
import { type CityPlan, planCity } from "./placements";
import { createScene } from "./scene";
import { buildTemplate, disposeTemplates, type ModelTemplate } from "./templates";

export interface RenderedCity {
  scene: Scene;
  map: CityMap;
  plan: CityPlan;
  chunks: BuiltChunk[];
  ground: Mesh;
  /** Every static mesh the city owns (ground, pads, chunk hosts and merged meshes). */
  statics: Mesh[];
  dispose(): void;
}

function freezeStatics(scene: Scene, statics: readonly Mesh[]): void {
  for (const mesh of statics) {
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = false;
    mesh.doNotSyncBoundingInfo = true;
    mesh.freezeWorldMatrix();
  }
  for (const material of scene.materials) material.freeze();
  scene.skipPointerMovePicking = true;
}

/** Limits what the camera draws so the fog hides the far edge. Call for every camera. */
export function applyViewDistance(camera: Camera): void {
  camera.maxZ = CAMERA_MAX_Z;
  camera.minZ = 0.5;
}

/**
 * Builds the city into a new scene. Reads the map and manifest, never mutates them. The caller
 * adds a camera and calls `applyViewDistance` on it.
 */
export async function createCityScene(
  engine: AbstractEngine,
  map: CityMap,
  manifest: AssetManifest,
  loadBytes: LoadBytes,
): Promise<RenderedCity> {
  const scene = createScene(engine);
  setupLighting(scene);

  const plan = planCity(map, manifest);
  const ids = new Set(plan.placements.map((p) => p.model));
  const cache = await AssetCache.load(scene, manifest, ids, loadBytes);
  const materials = createPackMaterials(scene, cache, ids);
  const templates = new Map<string, ModelTemplate>();
  for (const id of ids) templates.set(id, buildTemplate(scene, cache, id));

  const chunks = buildChunks(plan.placements, templates, materials);
  disposeTemplates(templates.values());
  cache.dispose();

  const half = mapHalfExtents(map);
  const ground = CreateGround(
    "ground",
    { width: half.x * 2 + GROUND_MARGIN_M, height: half.z * 2 + GROUND_MARGIN_M },
    scene,
  );
  ground.position.y = GROUND_Y;
  ground.material = flatMaterial(
    scene,
    "ground",
    new Color3(GRASS_COLOR.r, GRASS_COLOR.g, GRASS_COLOR.b),
  );
  const pads = buildPads(scene, plan.pads);

  const statics: Mesh[] = [ground, ...pads];
  for (const chunk of chunks) {
    statics.push(...chunk.hosts);
    if (chunk.merged) statics.push(chunk.merged);
  }
  freezeStatics(scene, statics);

  return { scene, map, plan, chunks, ground, statics, dispose: () => scene.dispose() };
}
