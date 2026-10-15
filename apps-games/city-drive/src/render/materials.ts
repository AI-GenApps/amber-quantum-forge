import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AssetPack } from "../assets/manifest";
import type { AssetCache } from "./assetCache";

export type PackMaterials = Map<AssetPack, StandardMaterial>;

function albedoOf(material: unknown): BaseTexture | undefined {
  if (typeof material !== "object" || material === null) return undefined;
  const m = material as { albedoTexture?: BaseTexture | null; diffuseTexture?: BaseTexture | null };
  return m.albedoTexture ?? m.diffuseTexture ?? undefined;
}

export function flatMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = Color3.Black();
  return material;
}

/**
 * One cheap StandardMaterial per Kenney pack. Every model of a pack samples the same colormap, so
 * a single shared material keeps the number of distinct draw states low. The glTF loader's PBR
 * materials are replaced because StandardMaterial costs less on low-end Android GPUs.
 */
export function createPackMaterials(
  scene: Scene,
  cache: AssetCache,
  ids: Iterable<string>,
): PackMaterials {
  const materials: PackMaterials = new Map();
  for (const id of ids) {
    const pack = cache.entry(id).pack;
    if (materials.has(pack)) continue;
    const texture = cache
      .container(id)
      .meshes.map((mesh) => albedoOf(mesh.material))
      .find((candidate) => candidate !== undefined);
    if (!texture) throw new Error(`materials: model "${id}" has no colormap texture`);
    const material = flatMaterial(scene, `pack:${pack}`, Color3.White());
    material.diffuseTexture = texture;
    materials.set(pack, material);
  }
  return materials;
}

export function requirePackMaterial(materials: PackMaterials, pack: AssetPack): StandardMaterial {
  const material = materials.get(pack);
  if (!material) throw new Error(`materials: no material for pack "${pack}"`);
  return material;
}
