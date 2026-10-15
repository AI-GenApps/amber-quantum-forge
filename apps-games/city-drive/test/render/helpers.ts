import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import type { LoadBytes } from "../../src/render/assetCache";
import { createCityScene, type RenderedCity } from "../../src/render/city";
import { loadDistrict1 } from "../../src/render/district";
import { assetsDir, readManifest } from "../assets/helpers";

export const readBytes: LoadBytes = async (file) =>
  new Uint8Array(readFileSync(join(assetsDir, file)));

export async function buildDistrict1(): Promise<{ city: RenderedCity; engine: NullEngine }> {
  const manifest = readManifest();
  const engine = new NullEngine();
  const map = loadDistrict1(manifest);
  const city = await createCityScene(engine, map, manifest, readBytes);
  return { city, engine };
}
