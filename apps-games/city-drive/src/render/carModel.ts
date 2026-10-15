import { type Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AssetCache } from "./assetCache";

export interface CarWheelPart {
  /** Geometry centred on the wheel axle, so rotating the mesh spins the wheel. */
  mesh: Mesh;
  /** Axle position in model space (the model rests on y = 0, faces +Z; its left is +X). */
  centre: Vector3;
  radius: number;
}

export interface CarModelParts {
  body: Mesh;
  /** Four wheels in any order; match them to physics wheels with `wheelFor`. */
  wheels: CarWheelPart[];
  /** Length of the model along Z in metres. */
  length: number;
}

function bakedCopy(scene: Scene, name: string, source: Mesh, matrix: Matrix): Mesh {
  const part = new Mesh(name, scene);
  VertexData.ExtractFromMesh(source, false, true).applyToMesh(part);
  part.bakeTransformIntoVertices(matrix);
  part.sideOrientation = source.sideOrientation;
  part.setEnabled(false);
  return part;
}

function geometryOf(mesh: Mesh | InstancedMesh): Mesh {
  return mesh instanceof InstancedMesh ? mesh.sourceMesh : mesh;
}

function verticalRadius(mesh: Mesh): number {
  const positions = mesh.getVerticesData("position") ?? [];
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (let i = 1; i < positions.length; i += 3) {
    lo = Math.min(lo, positions[i] as number);
    hi = Math.max(hi, positions[i] as number);
  }
  return (hi - lo) / 2;
}

/**
 * Splits a Kenney car GLB into a body mesh and four wheel meshes, as authored (the scene is
 * right-handed, so the loader adds no flip). Wheels are re-centred on their axle.
 * Kenney names the wheel nodes `wheel-<front|back>-<left|right>`; a car without them is rejected.
 */
export function buildCarParts(scene: Scene, cache: AssetCache, id: string): CarModelParts {
  let body: Mesh | undefined;
  const wheels: CarWheelPart[] = [];
  for (const node of cache.container(id).meshes) {
    if (!(node instanceof Mesh || node instanceof InstancedMesh)) continue;
    const geometry = geometryOf(node);
    if (geometry.getTotalVertices() === 0) continue;
    const world = node.computeWorldMatrix(true).clone();
    if (node.name.startsWith("wheel-")) {
      const centre = world.getTranslation().clone();
      world.setTranslation(Vector3.Zero());
      const mesh = bakedCopy(scene, `${id}:${node.name}`, geometry, world);
      wheels.push({ mesh, centre, radius: verticalRadius(mesh) });
    } else if (node.name === "body") {
      body = bakedCopy(scene, `${id}:body`, geometry, world);
    }
  }
  if (!body) throw new Error(`car model "${id}": no node named "body"`);
  if (wheels.length !== 4) {
    throw new Error(`car model "${id}": expected 4 wheel nodes, found ${wheels.length}`);
  }
  const { min, max } = cache.entry(id).bbox;
  return { body, wheels, length: max.z - min.z };
}

/** The model wheel on the same side and axle as a physics wheel at (x, z) in chassis space. */
export function wheelFor(parts: CarModelParts, x: number, z: number): CarWheelPart {
  const match = parts.wheels.find(
    (w) => Math.sign(w.centre.x) === Math.sign(x) && Math.sign(w.centre.z) === Math.sign(z),
  );
  if (!match)
    throw new Error(`car model: no wheel on the (${Math.sign(x)}, ${Math.sign(z)}) corner`);
  return match;
}
