import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";

export interface FrameStats {
  activeMeshes: number;
  drawCalls: number;
  triangles: number;
}

function sourceOf(mesh: AbstractMesh): Mesh | undefined {
  const source = mesh instanceof InstancedMesh ? mesh.sourceMesh : mesh;
  return source instanceof Mesh ? source : undefined;
}

/**
 * Cost model for the meshes the last `scene.render()` selected for the active camera. NullEngine
 * cannot report real GPU draw calls, so SceneInstrumentation is not used.
 *
 * - Draw calls: the sum over active meshes of their sub-mesh counts. A thin-instance host, or the
 *   source of some InstancedMesh, counts once per sub-mesh however many instances it carries.
 * - Triangles: a mesh's full triangle count times its thin-instance count (1 for plain meshes and
 *   one source copy per active InstancedMesh). Culling is per mesh, so this is conservative.
 */
export function frameStats(scene: Scene): FrameStats {
  const active = scene.getActiveMeshes();
  const counted = new Set<Mesh>();
  let drawCalls = 0;
  let triangles = 0;
  for (let i = 0; i < active.length; i++) {
    const mesh = active.data[i];
    const source = mesh ? sourceOf(mesh) : undefined;
    if (!mesh || !source) continue;
    const subMeshes = source.subMeshes ?? [];
    const sourceTriangles = subMeshes.reduce((sum, sub) => sum + sub.indexCount / 3, 0);
    const copies = mesh instanceof InstancedMesh ? 1 : Math.max(1, source.thinInstanceCount);
    triangles += sourceTriangles * copies;
    if (!counted.has(source)) {
      counted.add(source);
      drawCalls += subMeshes.length;
    }
  }
  return { activeMeshes: active.length, drawCalls, triangles };
}
