import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GAME_REGISTRY } from "./registry";
import { ROOT } from "./toolchain";

const maxContentFileBytes = 2_000_000;
const forbiddenKeys = new Set([
  "rawphoto",
  "photobytes",
  "imagebytes",
  "captiontext",
  "customerexport",
  "exif",
  "ocr",
]);

export interface ContentValidationGame {
  readonly id: string;
  readonly publicTitle: string;
  readonly paths: { readonly app: string };
  readonly source: {
    readonly folderId: string;
    readonly indexId: string;
    readonly prdId: string;
    readonly validationId: string;
  };
}

export interface ContentValidationOptions {
  readonly root?: string;
  readonly games?: readonly ContentValidationGame[];
}

interface ManifestSpec {
  readonly relativePath: string;
  readonly appIdRequired: boolean;
  readonly sourceIdsRequired: boolean;
}

function jsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(entry.parentPath, entry.name));
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function inspectValue(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      inspectValue(item, `${path}[${index}]`, errors);
    });
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(normalizeKey(key)))
      errors.push(`${path}.${key} contains a blocked field`);
    inspectValue(child, `${path}.${key}`, errors);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function manifestSpec(game: ContentValidationGame): ManifestSpec {
  if (game.id === "meme_court") {
    return {
      relativePath: "assets/content/prompts.json",
      appIdRequired: false,
      sourceIdsRequired: true,
    };
  }
  if (game.id === "snapquest") {
    return {
      relativePath: "assets/content/catalog.json",
      appIdRequired: false,
      sourceIdsRequired: true,
    };
  }
  return {
    relativePath: "content/manifest.json",
    appIdRequired: true,
    sourceIdsRequired: false,
  };
}

function knownSourceIds(game: ContentValidationGame): Set<string> {
  return new Set([
    game.source.folderId,
    game.source.indexId,
    game.source.prdId,
    game.source.validationId,
  ]);
}

function validateManifest(
  game: ContentValidationGame,
  file: string,
  value: unknown,
  spec: ManifestSpec,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`${file} must contain a JSON object manifest`);
    return;
  }
  const appId = value.app_id;
  if (appId !== undefined && appId !== game.id) {
    errors.push(`${file}.app_id must be ${game.id}`);
  }
  if (spec.appIdRequired && appId !== game.id) {
    errors.push(`${file} is missing the expected app_id ${game.id}`);
  }
  if (value.public_title !== undefined && value.public_title !== game.publicTitle) {
    errors.push(`${file}.public_title must be ${game.publicTitle}`);
  }
  const version = ["content_version", "rule_version", "version", "schema_version"]
    .map((key) => value[key])
    .find((candidate) => candidate !== undefined);
  if (
    version === undefined ||
    (typeof version === "string" &&
      (version.trim().length === 0 ||
        version.length > 128 ||
        !/^[a-z0-9][a-z0-9._-]*$/i.test(version))) ||
    (typeof version === "number" && (!Number.isSafeInteger(version) || version < 1)) ||
    (typeof version !== "string" && typeof version !== "number")
  ) {
    errors.push(`${file} is missing a valid content version`);
  }
  const sourceIds = value.source_ids;
  if (spec.sourceIdsRequired && !Array.isArray(sourceIds)) {
    errors.push(`${file} is missing source_ids`);
  }
  if (sourceIds !== undefined) {
    if (
      !Array.isArray(sourceIds) ||
      sourceIds.length === 0 ||
      sourceIds.some(
        (sourceId) => typeof sourceId !== "string" || !knownSourceIds(game).has(sourceId),
      )
    ) {
      errors.push(`${file}.source_ids must contain known non-empty source IDs`);
    }
  }
}

function readJson(file: string, errors: string[]): unknown | undefined {
  if (statSync(file).size > maxContentFileBytes) {
    errors.push(`${file} exceeds the content file limit`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    errors.push(
      `${file} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

export function validateContent(options: ContentValidationOptions = {}): string[] {
  const root = options.root ?? ROOT;
  const games = options.games ?? GAME_REGISTRY;
  const errors: string[] = [];
  for (const game of games) {
    const appRoot = join(root, game.paths.app);
    const spec = manifestSpec(game);
    const expectedPath = join(appRoot, spec.relativePath);
    if (!existsSync(expectedPath)) {
      errors.push(`${expectedPath} is the expected content manifest for ${game.id}`);
    }
    const directories = [join(appRoot, "content"), join(appRoot, "assets", "content")];
    const files = [...new Set(directories.flatMap((directory) => jsonFiles(directory)))].sort();
    if (files.length === 0) errors.push(`${appRoot} has no content JSON files`);
    for (const file of files) {
      const parsed = readJson(file, errors);
      if (parsed === undefined) continue;
      inspectValue(parsed, file, errors);
      if (file === expectedPath) validateManifest(game, file, parsed, spec, errors);
    }
  }
  return errors;
}

function main(): void {
  const errors = validateContent();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log("Content validation passed; no blocked fields or invalid manifests found.");
}

if (import.meta.main) main();
