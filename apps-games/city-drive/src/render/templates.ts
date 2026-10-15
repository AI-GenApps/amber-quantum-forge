import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AssetPack } from "../assets/manifest";
import type { AssetCache } from "./assetCache";

/** Geometry of one manifest model with its glTF node transforms baked in (right-handed, native). */
export interface ModelTemplate {
  id: string;
  pack: AssetPack;
  /** One mesh per source primitive node, all in model space, all disabled. */
  parts: Mesh[];
}

/**
 * Bakes each container mesh's world matrix into new meshes. The scene is right-handed, so the glTF
 * loader adds no root flip and the baked geometry is the artwork as authored. The new mesh would
 * default to the winding of builder meshes (clockwise), so it takes the loader's own side
 * orientation (counter-clockwise, the glTF convention) from the source instead.
 */
export function buildTemplate(scene: Scene, cache: AssetCache, id: string): ModelTemplate {
  const entry = cache.entry(id);
  const parts: Mesh[] = [];
  for (const source of cache.container(id).meshes) {
    const geometry = source instanceof InstancedMesh ? source.sourceMesh : source;
    if (!(geometry instanceof Mesh) || geometry.getTotalVertices() === 0) continue;
    const part = new Mesh(`${id}:${source.name}`, scene);
    VertexData.ExtractFromMesh(geometry, false, true).applyToMesh(part);
    part.bakeTransformIntoVertices(source.computeWorldMatrix(true));
    part.sideOrientation = geometry.sideOrientation;
    part.setEnabled(false);
    parts.push(part);
  }
  if (parts.length === 0) throw new Error(`template "${id}": the GLB has no renderable mesh`);
  return { id, pack: entry.pack, parts };
}

export function disposeTemplates(templates: Iterable<ModelTemplate>): void {
  for (const template of templates) {
    for (const part of template.parts) part.dispose();
  }
}
