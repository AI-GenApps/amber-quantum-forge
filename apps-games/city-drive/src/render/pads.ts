import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { GROUND_Y, PLAZA_COLOR } from "./constants";
import { flatMaterial } from "./materials";
import type { PadPlacement } from "./placements";

const PAD_LIFT_M = 0.08;

/** Flat plaza squares: one thin-instance host per chunk sharing a single unit-square geometry. */
export function buildPads(scene: Scene, pads: readonly PadPlacement[]): Mesh[] {
  if (pads.length === 0) return [];
  const source = CreateGround("pad-source", { width: 1, height: 1 }, scene);
  source.material = flatMaterial(
    scene,
    "plaza",
    new Color3(PLAZA_COLOR.r, PLAZA_COLOR.g, PLAZA_COLOR.b),
  );
  const byChunk = new Map<string, PadPlacement[]>();
  for (const pad of pads) byChunk.set(pad.chunk, [...(byChunk.get(pad.chunk) ?? []), pad]);
  const hosts: Mesh[] = [];
  for (const key of [...byChunk.keys()].sort()) {
    const group = byChunk.get(key) ?? [];
    const host = source.clone(`pads:${key}`);
    const buffer = new Float32Array(group.length * 16);
    group.forEach((pad, i) => {
      Matrix.Compose(
        new Vector3(pad.size, 1, pad.size),
        Quaternion.Identity(),
        new Vector3(pad.x, GROUND_Y + PAD_LIFT_M, pad.z),
      ).copyToArray(buffer, i * 16);
    });
    host.thinInstanceSetBuffer("matrix", buffer, 16, true);
    host.thinInstanceRefreshBoundingInfo(true);
    hosts.push(host);
  }
  source.dispose();
  return hosts;
}
