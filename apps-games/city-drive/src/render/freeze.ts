import type { Material } from "@babylonjs/core/Materials/material.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";

/** Material metadata flag: leave this material unfrozen (it is drawn by instances that come and go). */
const KEEP_UNFROZEN = "keepUnfrozen";

export function keepsUnfrozen(material: Material): boolean {
  const meta: unknown = material.metadata;
  return typeof meta === "object" && meta !== null && KEEP_UNFROZEN in meta;
}

/** Marks a material so `freezeMaterials` skips it. */
export function markKeepUnfrozen(material: Material): void {
  material.metadata = { ...(material.metadata as object | null), [KEEP_UNFROZEN]: true };
}

/**
 * Static chunk hosts, ground and pads never move: freeze their world matrices and keep them out of
 * the always-active list so frustum culling still drops far chunks. `scene.freezeActiveMeshes()` is
 * deliberately not used, because traffic moves every frame and would stop being drawn correctly.
 */
export function freezeStatics(scene: Scene, statics: readonly Mesh[]): void {
  for (const mesh of statics) {
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = false;
    mesh.doNotSyncBoundingInfo = true;
    mesh.freezeWorldMatrix();
  }
  freezeMaterials(scene);
  scene.skipPointerMovePicking = true;
}

/**
 * Freezes every material of the scene except the ones marked `keepUnfrozen`. Fog distances are
 * scene uniforms that Babylon rebinds the first time each material is drawn in a frame, so the
 * quality governor can still change them on frozen materials.
 */
export function freezeMaterials(scene: Scene): void {
  for (const material of scene.materials) {
    if (!keepsUnfrozen(material)) material.freeze();
  }
}
