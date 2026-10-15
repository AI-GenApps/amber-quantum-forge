/**
 * Asset manifest schema, id scheme and size budgets for the shipped CC0 models.
 * Pure data and validation: no Babylon, no DOM, no Node APIs. The build script
 * (scripts/build-assets.ts) generates the manifest, tests and later tasks read it.
 */

export const ASSET_KINDS = ["road", "building", "prop", "car"] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_PACKS = [
  "city-kit-roads",
  "city-kit-commercial",
  "city-kit-suburban",
  "car-kit",
] as const;
export type AssetPack = (typeof ASSET_PACKS)[number];

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ModelEntry {
  /** Stable id referenced literally by later tasks, see ID_PATTERNS. */
  id: string;
  /** Path relative to `public/assets`, e.g. `models/road-straight.glb`. */
  file: string;
  kind: AssetKind;
  triangles: number;
  bytes: number;
  bbox: { min: Vec3; max: Vec3 };
  /** Source pack (a licence record exists in assets-src/LICENSES/<pack>.txt). */
  pack: AssetPack;
  /** Licence record id, equal to the pack id. */
  licence: AssetPack;
}

export interface AssetManifest {
  schemaVersion: 1;
  models: ModelEntry[];
}

export const ROAD_IDS = [
  "road-straight",
  "road-corner",
  "road-t",
  "road-crossroads",
  "road-end",
  "road-crossing",
] as const;

/** Fixed id scheme per kind (dry-run amendment of task 04). */
export const ID_PATTERNS: Record<AssetKind, RegExp> = {
  road: /^road-(straight|corner|t|crossroads|end|crossing)$/,
  building: /^bld-(commercial|suburban)-[a-z0-9]+(-[a-z0-9]+)*$/,
  prop: /^prop-[a-z0-9]+(-[a-z0-9]+)*$/,
  car: /^car-[a-z0-9]+(-[a-z0-9]+)*$/,
};

export const BUDGETS = {
  /** Total model payload in bytes (all shipped GLB files). */
  totalBytes: 8 * 1024 * 1024,
  /** Maximum triangles per single model, by kind. Kinds absent here have no per-model cap. */
  maxTriangles: { building: 3000, car: 5000, road: 500 } as Partial<Record<AssetKind, number>>,
} as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isVec3 = (value: unknown): value is Vec3 => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isFiniteNumber(v.x) && isFiniteNumber(v.y) && isFiniteNumber(v.z);
};

/** Returns a list of schema problems; empty means the manifest is valid. */
export function validateManifest(input: unknown): string[] {
  const problems: string[] = [];
  if (typeof input !== "object" || input === null) return ["manifest is not an object"];
  const manifest = input as Partial<AssetManifest>;
  if (manifest.schemaVersion !== 1) problems.push("schemaVersion must be 1");
  if (!Array.isArray(manifest.models)) return [...problems, "models must be an array"];
  const seen = new Set<string>();
  for (const [index, raw] of manifest.models.entries()) {
    const entry = raw as Partial<ModelEntry>;
    const label = `models[${index}] (${String(entry?.id)})`;
    if (typeof entry?.id !== "string") {
      problems.push(`${label}: id must be a string`);
      continue;
    }
    if (seen.has(entry.id)) problems.push(`${label}: duplicate id`);
    seen.add(entry.id);
    const kind = entry.kind;
    if (!kind || !ASSET_KINDS.includes(kind)) {
      problems.push(`${label}: kind must be one of ${ASSET_KINDS.join("|")}`);
    } else if (!ID_PATTERNS[kind].test(entry.id)) {
      problems.push(`${label}: id does not match the ${kind} id scheme`);
    }
    if (entry.file !== `models/${entry.id}.glb`)
      problems.push(`${label}: file must be models/<id>.glb`);
    if (!isFiniteNumber(entry.triangles) || entry.triangles <= 0)
      problems.push(`${label}: bad triangles`);
    if (!isFiniteNumber(entry.bytes) || entry.bytes <= 0) problems.push(`${label}: bad bytes`);
    if (!entry.bbox || !isVec3(entry.bbox.min) || !isVec3(entry.bbox.max)) {
      problems.push(`${label}: bbox must be {min, max} of {x, y, z}`);
    }
    if (!entry.pack || !ASSET_PACKS.includes(entry.pack)) problems.push(`${label}: unknown pack`);
    if (entry.licence !== entry.pack) problems.push(`${label}: licence must equal pack id`);
  }
  return problems;
}

/** Returns a list of budget violations; empty means within budget. */
export function checkBudgets(manifest: AssetManifest): string[] {
  const violations: string[] = [];
  const total = manifest.models.reduce((sum, model) => sum + model.bytes, 0);
  if (total > BUDGETS.totalBytes) {
    violations.push(`total model payload ${total} B exceeds ${BUDGETS.totalBytes} B`);
  }
  for (const model of manifest.models) {
    const max = BUDGETS.maxTriangles[model.kind];
    if (max !== undefined && model.triangles > max) {
      violations.push(
        `${model.id}: ${model.triangles} triangles exceeds the ${model.kind} cap of ${max}`,
      );
    }
  }
  return violations;
}
