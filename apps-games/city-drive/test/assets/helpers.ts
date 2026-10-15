import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AssetManifest } from "../../src/assets/manifest";

export const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const assetsDir = join(appDir, "public", "assets");

export function readManifest(): AssetManifest {
  return JSON.parse(readFileSync(join(assetsDir, "manifest.json"), "utf8")) as AssetManifest;
}
