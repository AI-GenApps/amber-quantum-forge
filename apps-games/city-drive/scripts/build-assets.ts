/**
 * Builds the shipped CC0 model set from extracted Kenney packs.
 *
 *   bun scripts/build-assets.ts --raw <dir> [--zips <dir>] [--date YYYY-MM-DD] [--validate]
 *
 * --raw   directory holding the extracted packs (default: assets-src/raw, gitignored)
 * --zips  directory holding the downloaded zips; when given, licence records are
 *         (re)written with the zip SHA-256, otherwise existing records are verified
 *
 * --validate  also runs `gltf-transform validate` (Khronos validator) on every output GLB
 *
 * Idempotent: a second run over the same inputs rewrites byte-identical files.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AssetManifest,
  checkBudgets,
  type ModelEntry,
  validateManifest,
} from "../src/assets/manifest";
import { CATALOG, PACK_SOURCES } from "./assets/catalog";
import {
  findZip,
  readPackLicence,
  renderLicenceRecord,
  resolvePackDir,
  verifyLicenceRecord,
  writeLicenceRecord,
} from "./assets/licences";
import { optimizeModel } from "./assets/optimize";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function validateOutputs(models: ModelEntry[], modelsDir: string): void {
  const cli = join(appDir, "node_modules", ".bin", "gltf-transform");
  for (const model of models) {
    const result = spawnSync(cli, ["validate", join(modelsDir, `${model.id}.glb`)], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(
        `gltf-transform validate failed for ${model.id}:\n${result.stdout}${result.stderr}`,
      );
    }
  }
  console.log(`validated ${models.length} GLB files with gltf-transform validate`);
}

function verifyCommitted(licencesDir: string): void {
  const manifestPath = join(appDir, "public/assets/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as AssetManifest;
  const problems = [...validateManifest(manifest), ...checkBudgets(manifest)];
  for (const source of PACK_SOURCES) {
    if (!existsSync(join(licencesDir, `${source.pack}.txt`)))
      problems.push(`missing licence ${source.pack}`);
  }
  if (problems.length > 0)
    throw new Error(`Committed assets are invalid:\n- ${problems.join("\n- ")}`);
  console.log(
    `raw packs not found (see assets-src/README.md): verified ${manifest.models.length} committed models, manifest and licences`,
  );
}

async function main(): Promise<void> {
  const rawDir = resolve(arg("raw") ?? join(appDir, "assets-src/raw"));
  const zipsDir = arg("zips") ? resolve(arg("zips") as string) : undefined;
  const date = arg("date") ?? new Date().toISOString().slice(0, 10);
  const licencesDir = join(appDir, "assets-src/LICENSES");
  if (!existsSync(rawDir)) {
    // Fresh checkout without the (gitignored) raw packs: verify what is committed instead.
    verifyCommitted(licencesDir);
    return;
  }
  const modelsDir = join(appDir, "public/assets/models");
  mkdirSync(licencesDir, { recursive: true });
  mkdirSync(modelsDir, { recursive: true });

  const packDirs = new Map<string, string>();
  for (const source of PACK_SOURCES) {
    const packDir = resolvePackDir(rawDir, source);
    packDirs.set(source.pack, packDir);
    const licenceText = readPackLicence(packDir);
    const recordPath = join(licencesDir, `${source.pack}.txt`);
    if (zipsDir) {
      writeLicenceRecord(
        recordPath,
        renderLicenceRecord(source, licenceText, findZip(zipsDir, source), date),
      );
    } else {
      verifyLicenceRecord(recordPath, licenceText);
    }
  }

  const models: ModelEntry[] = [];
  for (const entry of CATALOG) {
    const packDir = packDirs.get(entry.pack) as string;
    const sourcePath = join(packDir, "Models", "GLB format", `${entry.source}.glb`);
    const optimized = await optimizeModel(sourcePath);
    writeFileSync(join(modelsDir, `${entry.id}.glb`), optimized.glb);
    models.push({
      id: entry.id,
      file: `models/${entry.id}.glb`,
      kind: entry.kind,
      triangles: optimized.triangles,
      bytes: optimized.glb.byteLength,
      bbox: optimized.bbox,
      pack: entry.pack,
      licence: entry.pack,
    });
  }
  models.sort((a, b) => a.id.localeCompare(b.id));

  // Drop models that are no longer in the catalog so the output stays reproducible.
  const wanted = new Set(models.map((model) => `${model.id}.glb`));
  for (const name of readdirSync(modelsDir)) {
    if (name.endsWith(".glb") && !wanted.has(name)) rmSync(join(modelsDir, name));
  }

  const manifest: AssetManifest = { schemaVersion: 1, models };
  const problems = [...validateManifest(manifest), ...checkBudgets(manifest)];
  if (problems.length > 0) throw new Error(`Asset build failed:\n- ${problems.join("\n- ")}`);
  writeFileSync(
    join(appDir, "public/assets/manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  if (process.argv.includes("--validate")) validateOutputs(models, modelsDir);

  const total = models.reduce((sum, model) => sum + model.bytes, 0);
  console.log(`built ${models.length} models, ${total} bytes`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
