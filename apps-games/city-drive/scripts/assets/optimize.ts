import { Logger, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, getBounds, prune, textureCompress, weld } from "@gltf-transform/functions";
import sharp from "sharp";
import type { Vec3 } from "../../src/assets/manifest";

const MAX_TEXTURE_SIZE = 512;

export interface OptimizedModel {
  glb: Uint8Array;
  triangles: number;
  bbox: { min: Vec3; max: Vec3 };
}

const round = (value: number): number => Math.round(value * 10000) / 10000;
const toVec3 = (v: number[]): Vec3 => ({
  x: round(v[0] ?? 0),
  y: round(v[1] ?? 0),
  z: round(v[2] ?? 0),
});

/**
 * Runs dedup, prune, weld and a texture downscale to at most 512 px, then writes an
 * uncompressed GLB (no Draco, no meshopt: see the dry-run amendment of task 04).
 */
export async function optimizeModel(sourcePath: string): Promise<OptimizedModel> {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.read(sourcePath);
  document.setLogger(new Logger(Logger.Verbosity.WARN));
  await document.transform(
    dedup(),
    prune(),
    weld(),
    textureCompress({ encoder: sharp, resize: [MAX_TEXTURE_SIZE, MAX_TEXTURE_SIZE] }),
  );
  let triangles = 0;
  // Count per node instance: dedup shares one mesh between the four wheels of a car.
  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    for (const primitive of mesh.listPrimitives()) {
      const indices = primitive.getIndices();
      const count = indices
        ? indices.getCount()
        : (primitive.getAttribute("POSITION")?.getCount() ?? 0);
      triangles += count / 3;
    }
  }
  const scene = document.getRoot().listScenes()[0];
  if (!scene) throw new Error(`${sourcePath}: glTF has no scene`);
  const bounds = getBounds(scene);
  const glb = await io.writeBinary(document);
  return { glb, triangles, bbox: { min: toVec3(bounds.min), max: toVec3(bounds.max) } };
}
