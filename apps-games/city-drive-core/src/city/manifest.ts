import type { Vec3 } from "../physics/math";

/** The slice of the app's asset manifest that the city needs. Core never imports the app package. */
export interface CityManifestModel {
  id: string;
  kind: string;
  bbox: { min: Vec3; max: Vec3 };
}

export interface CityManifest {
  models: readonly CityManifestModel[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseVec3(value: unknown, where: string): Vec3 {
  if (!isRecord(value)) throw new Error(`${where}: expected {x,y,z}`);
  const { x, y, z } = value;
  if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") {
    throw new Error(`${where}: x, y and z must be numbers`);
  }
  return { x, y, z };
}

/** Read the city-relevant fields out of the parsed `manifest.json`. Throws with the model id. */
export function parseCityManifest(raw: unknown): CityManifest {
  if (!isRecord(raw) || !Array.isArray(raw.models)) {
    throw new Error("asset manifest: expected an object with a models array");
  }
  const models = raw.models.map((entry: unknown, index: number): CityManifestModel => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.kind !== "string") {
      throw new Error(`asset manifest: models[${index}] needs a string id and kind`);
    }
    if (!isRecord(entry.bbox)) throw new Error(`asset manifest: ${entry.id} has no bbox`);
    return {
      id: entry.id,
      kind: entry.kind,
      bbox: {
        min: parseVec3(entry.bbox.min, `${entry.id} bbox.min`),
        max: parseVec3(entry.bbox.max, `${entry.id} bbox.max`),
      },
    };
  });
  return { models };
}

export function modelById(manifest: CityManifest, id: string): CityManifestModel | undefined {
  return manifest.models.find((m) => m.id === id);
}
