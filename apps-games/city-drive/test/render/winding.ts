import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";

/**
 * Share of triangles whose counter-clockwise winding normal (right-hand rule, the glTF convention)
 * agrees with the stored vertex normals. 1 = every face is wound counter-clockwise, 0 = clockwise.
 */
export function ccwShare(mesh: Mesh): number {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
  const indices = mesh.getIndices();
  if (!positions || !normals || !indices) throw new Error(`${mesh.name}: no geometry`);
  let agree = 0;
  let counted = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i], indices[i + 1], indices[i + 2]].map(
      (v) => (v as number) * 3,
    ) as [number, number, number];
    const ux = (positions[b] as number) - (positions[a] as number);
    const uy = (positions[b + 1] as number) - (positions[a + 1] as number);
    const uz = (positions[b + 2] as number) - (positions[a + 2] as number);
    const vx = (positions[c] as number) - (positions[a] as number);
    const vy = (positions[c + 1] as number) - (positions[a + 1] as number);
    const vz = (positions[c + 2] as number) - (positions[a + 2] as number);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const dot =
      nx * ((normals[a] as number) + (normals[b] as number) + (normals[c] as number)) +
      ny * ((normals[a + 1] as number) + (normals[b + 1] as number) + (normals[c + 1] as number)) +
      nz * ((normals[a + 2] as number) + (normals[b + 2] as number) + (normals[c + 2] as number));
    if (Math.abs(dot) < 1e-12) continue;
    counted++;
    if (dot > 0) agree++;
  }
  return counted === 0 ? 1 : agree / counted;
}
