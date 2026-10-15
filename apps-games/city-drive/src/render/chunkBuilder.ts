import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { THIN_INSTANCE_MIN } from "./constants";
import { type PackMaterials, requirePackMaterial } from "./materials";
import type { Placement } from "./placements";
import type { ModelTemplate } from "./templates";

export interface BuiltChunk {
  key: string;
  /** Thin-instance hosts: one per (model, template part) with many placements in this chunk. */
  hosts: Mesh[];
  /** The merged mesh of the chunk's low-count placements, if any. */
  merged: Mesh | undefined;
}

const YAXIS = new Vector3(0, 1, 0);

export function placementMatrix(p: Placement): Matrix {
  const yaw = Quaternion.RotationAxis(YAXIS, (-p.yawDeg * Math.PI) / 180);
  return Matrix.Compose(new Vector3(p.scale, p.scale, p.scale), yaw, new Vector3(p.x, 0, p.z));
}

function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = groups.get(k);
    if (bucket) bucket.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

function buildHost(
  template: ModelTemplate,
  chunk: string,
  items: readonly Placement[],
  materials: PackMaterials,
): Mesh[] {
  const buffer = new Float32Array(items.length * 16);
  items.forEach((item, i) => {
    placementMatrix(item).copyToArray(buffer, i * 16);
  });
  return template.parts.map((part, partIndex) => {
    const host = part.clone(`host:${chunk}:${template.id}:${partIndex}`);
    host.setEnabled(true);
    host.material = requirePackMaterial(materials, template.pack);
    host.thinInstanceSetBuffer("matrix", buffer.slice(), 16, true);
    host.thinInstanceRefreshBoundingInfo(true);
    return host;
  });
}

function buildMerged(
  chunk: string,
  items: readonly Placement[],
  templates: ReadonlyMap<string, ModelTemplate>,
  materials: PackMaterials,
): Mesh | undefined {
  const pieces: Mesh[] = [];
  items.forEach((item, index) => {
    const template = templates.get(item.model);
    if (!template) throw new Error(`chunk ${chunk}: no template for "${item.model}"`);
    for (const part of template.parts) {
      const piece = part.clone(`piece:${chunk}:${item.model}:${index}`);
      piece.setEnabled(true);
      piece.material = requirePackMaterial(materials, template.pack);
      const rotation = new Quaternion();
      placementMatrix(item).decompose(piece.scaling, rotation, piece.position);
      piece.rotationQuaternion = rotation;
      pieces.push(piece);
    }
  });
  if (pieces.length === 0) return undefined;
  const merged = Mesh.MergeMeshes(pieces, true, true, undefined, false, true);
  if (!merged) throw new Error(`chunk ${chunk}: MergeMeshes returned nothing`);
  merged.name = `merged:${chunk}`;
  return merged;
}

/**
 * Splits placements per chunk. A model used at least THIN_INSTANCE_MIN times inside a chunk becomes
 * a thin-instance host (all-or-nothing, so frustum culling works per chunk). Everything else in the
 * chunk is merged into a single multi-material mesh.
 */
export function buildChunks(
  placements: readonly Placement[],
  templates: ReadonlyMap<string, ModelTemplate>,
  materials: PackMaterials,
): BuiltChunk[] {
  const chunks: BuiltChunk[] = [];
  const byChunk = groupBy(placements, (p) => p.chunk);
  for (const key of [...byChunk.keys()].sort()) {
    const items = byChunk.get(key) ?? [];
    const hosts: Mesh[] = [];
    const leftovers: Placement[] = [];
    const byModel = groupBy(items, (p) => p.model);
    for (const model of [...byModel.keys()].sort()) {
      const group = byModel.get(model) ?? [];
      const template = templates.get(model);
      if (!template) throw new Error(`chunk ${key}: no template for "${model}"`);
      if (group.length >= THIN_INSTANCE_MIN) {
        hosts.push(...buildHost(template, key, group, materials));
      } else {
        leftovers.push(...group);
      }
    }
    chunks.push({ key, hosts, merged: buildMerged(key, leftovers, templates, materials) });
  }
  return chunks;
}
