import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { keepsUnfrozen } from "../render/freeze";

export interface FreezeAudit {
  /** Static meshes whose world matrix, active-mesh flag or picking is not set as frozen. */
  looseStatics: string[];
  /** Materials that are neither frozen nor marked `keepUnfrozen`. */
  looseMaterials: string[];
  /** Enabled meshes that are not static (the car, traffic parts, mission markers). */
  dynamicMeshes: number;
  /** Materials deliberately left unfrozen (instanced traffic). */
  keptUnfrozen: string[];
  /** `scene.freezeActiveMeshes()` would stop moving traffic from being drawn, so it must be off. */
  activeMeshesFrozen: boolean;
}

/** Checks the freeze rules of a finished city scene (see `render/freeze.ts`). */
export function auditFreeze(scene: Scene, statics: readonly Mesh[]): FreezeAudit {
  const staticSet = new Set<unknown>(statics);
  const looseStatics = statics
    .filter((m) => !m.isWorldMatrixFrozen || m.alwaysSelectAsActiveMesh || m.isPickable)
    .map((m) => m.name);
  const looseMaterials = scene.materials
    .filter((m) => !m.isFrozen && !keepsUnfrozen(m))
    .map((m) => m.name);
  const keptUnfrozen = scene.materials.filter((m) => keepsUnfrozen(m)).map((m) => m.name);
  const dynamicMeshes = scene.meshes.filter((m) => !staticSet.has(m) && m.isEnabled()).length;
  const activeMeshesFrozen = scene._activeMeshesFrozen;
  return { looseStatics, looseMaterials, dynamicMeshes, keptUnfrozen, activeMeshesFrozen };
}
