import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { GAME_REGISTRY, gameById } from "./registry";
import { ROOT } from "./toolchain";

export interface GenerateOptions {
  readonly id: string;
  readonly title: string;
  readonly output: string;
}

export interface GeneratedConfig {
  readonly id: string;
  readonly title: string;
  readonly environment: "debug";
  readonly productionId: string;
  readonly debugId: string;
  readonly activeId: string;
  readonly iosBundleId: string;
  readonly androidApplicationId: string;
  readonly saveNamespace: string;
  readonly saveSchemaVersion: 1;
  readonly analyticsNamespace: string;
  readonly rulesPackage: null;
}

export function parseGenerateOptions(args: string[]): GenerateOptions {
  const value = (name: string): string => {
    const index = args.indexOf(name);
    const result = index >= 0 ? args[index + 1] : undefined;
    if (!result) throw new Error(`${name} is required`);
    return result;
  };
  return { id: value("--id"), title: value("--title"), output: resolve(value("--output")) };
}

export function validateGenerateOptions(options: GenerateOptions): void {
  if (!/^[a-z][a-z0-9_]{2,48}$/.test(options.id)) {
    throw new Error("Generated app ID must be lowercase snake_case and 3-49 characters");
  }
  if (options.title.trim().length === 0) throw new Error("Generated app title must not be empty");
  const registeredPath = GAME_REGISTRY.some((game) => {
    const path = resolve(ROOT, game.paths.app);
    return options.output === path || options.output.startsWith(`${path}/`);
  });
  const generatedProductionId = productionIdentifier(options.id);
  const registeredIdentity = GAME_REGISTRY.some(
    (game) => game.identity.androidApplicationId === generatedProductionId,
  );
  if (gameById(options.id) || registeredPath) {
    throw new Error(`Generated app ID or path already belongs to a registered game: ${options.id}`);
  }
  if (registeredIdentity)
    throw new Error(
      `Generated app identity already belongs to a registered game: ${generatedProductionId}`,
    );
  if (existsSync(options.output)) throw new Error(`Output already exists: ${options.output}`);
}

function appIdentifier(id: string): string {
  return `app.w3dev.${id.replaceAll("_", "")}.debug`;
}

function productionIdentifier(id: string): string {
  return appIdentifier(id).replace(/\.debug$/, "");
}

export function writeGeneratedConfig(root: string, id: string, title: string): GeneratedConfig {
  const productionId = productionIdentifier(id);
  const debugId = `${productionId}.debug`;
  const config: GeneratedConfig = {
    id,
    title,
    environment: "debug",
    productionId,
    debugId,
    activeId: debugId,
    iosBundleId: productionId,
    androidApplicationId: productionId,
    saveNamespace: `games.${id}.debug`,
    saveSchemaVersion: 1,
    analyticsNamespace: `game.${id}.debug`,
    rulesPackage: null,
  };
  writeFileSync(resolve(root, "game.config.json"), `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

export function readGeneratedConfig(root: string): GeneratedConfig | undefined {
  try {
    const raw = JSON.parse(readFileSync(resolve(root, "game.config.json"), "utf8")) as Record<
      string,
      unknown
    >;
    if (
      typeof raw.id !== "string" ||
      typeof raw.title !== "string" ||
      raw.environment !== "debug" ||
      raw.productionId !== raw.iosBundleId ||
      raw.productionId !== raw.androidApplicationId ||
      raw.debugId !== `${raw.productionId}.debug` ||
      raw.activeId !== raw.debugId ||
      typeof raw.iosBundleId !== "string" ||
      typeof raw.androidApplicationId !== "string" ||
      raw.saveNamespace !== `games.${raw.id}.debug` ||
      raw.saveSchemaVersion !== 1 ||
      raw.analyticsNamespace !== `game.${raw.id}.debug` ||
      raw.rulesPackage !== null
    ) {
      return undefined;
    }
    return raw as unknown as GeneratedConfig;
  } catch {
    return undefined;
  }
}
