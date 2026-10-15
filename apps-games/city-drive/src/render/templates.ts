import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AssetPack } from "../assets/manifest";
import type { AssetCache } from "./assetCache";

/** Geometry of one manifest model with its glTF node transforms and handedness baked in. */
export interface ModelTemplate {
  id: string;
  pack: AssetPack;
  /** One mesh per source primitive node, all in model space, all disabled. */
  parts: Mesh[];
}

/** Bakes each container mesh's world matrix (including the loader's root flip) into new meshes. */
export function buildTemplate(scene: Scene, cache: AssetCache, id: string): ModelTemplate {
  const entry = cache.entry(id);
  const parts: Mesh[] = [];
  for (const source of cache.container(id).meshes) {
    const geometry = source instanceof InstancedMesh ? source.sourceMesh : source;
    if (!(geometry instanceof Mesh) || geometry.getTotalVertices() === 0) continue;
    const part = new Mesh(`${id}:${source.name}`, scene);
    VertexData.ExtractFromMesh(geometry, false, true).applyToMesh(part);
    part.bakeTransformIntoVertices(source.computeWorldMatrix(true));
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
