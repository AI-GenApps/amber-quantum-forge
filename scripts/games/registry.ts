import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_REGISTRY } from "./registry-games";
import { GAME_IDS, type GameRegistration } from "./registry-types";

const REGISTRY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export { GAME_REGISTRY } from "./registry-games";
export type { GameEngine, GameId, GameRegistration } from "./registry-types";

export function gameById(id: string): GameRegistration | undefined {
  return GAME_REGISTRY.find((game) => game.id === id);
}

export function flutterGames(): GameRegistration[] {
  return GAME_REGISTRY.filter((game) => game.engine === "flutter");
}

export function webGames(): GameRegistration[] {
  return GAME_REGISTRY.filter((game) => game.engine === "web");
}

export function isWebGame(game: GameRegistration): boolean {
  return game.engine === "web";
}

export function webEngineMessage(game: GameRegistration): string {
  return `${game.id} uses the web engine: use \`bun run city-drive:build\` (Flutter games:* commands do not apply).`;
}

function validateEngine(game: GameRegistration, root: string): string[] {
  const errors: string[] = [];
  if (game.engine !== "flutter" && game.engine !== "web") errors.push(`invalid engine: ${game.id}`);
  if (game.engine === "web") {
    if (game.rendering !== "babylon")
      errors.push(`web game must use babylon rendering: ${game.id}`);
    for (const path of [game.paths.app, game.paths.rulesPackage]) {
      if (!existsSync(join(root, path, "package.json")))
        errors.push(`web game is missing package.json: ${game.id}/${path}`);
    }
  } else if (game.rendering === "babylon") {
    errors.push(`babylon rendering requires the web engine: ${game.id}`);
  }
  return errors;
}

export function validateGameRegistry(root = REGISTRY_ROOT): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const appPaths = new Set<string>();
  const rulePaths = new Set<string>();
  const applicationIds = new Set<string>();

  for (const game of GAME_REGISTRY) {
    errors.push(...validateEngine(game, root));
    if (ids.has(game.id)) errors.push(`duplicate game id: ${game.id}`);
    ids.add(game.id);
    if (appPaths.has(game.paths.app)) errors.push(`duplicate app path: ${game.paths.app}`);
    appPaths.add(game.paths.app);
    if (rulePaths.has(game.paths.rulesPackage))
      errors.push(`duplicate rules path: ${game.paths.rulesPackage}`);
    rulePaths.add(game.paths.rulesPackage);
    if (!/^app\.w3dev\.[a-z0-9]+$/.test(game.identity.iosBundleId))
      errors.push(`invalid iOS ID: ${game.id}`);
    if (game.identity.iosBundleId !== game.identity.androidApplicationId)
      errors.push(`platform IDs diverge: ${game.id}`);
    if (applicationIds.has(game.identity.androidApplicationId))
      errors.push(`duplicate platform application ID: ${game.identity.androidApplicationId}`);
    applicationIds.add(game.identity.androidApplicationId);
    if (!new Set(["unverified", "verified"]).has(game.identity.registrationStatus))
      errors.push(`invalid registration status: ${game.id}`);
    if (game.environments.length !== 3)
      errors.push(`all environments must be declared: ${game.id}`);
    if (game.namespaces.save !== `games.${game.id}`)
      errors.push(`invalid save namespace: ${game.id}`);
    if (game.namespaces.saveSchemaVersion < 1)
      errors.push(`invalid save schema version: ${game.id}`);
    const implemented = new Set(game.capabilities.implemented);
    const specified = new Set(game.capabilities.specified);
    for (const capability of game.capabilities.enabled) {
      if (!implemented.has(capability))
        errors.push(`enabled capability is not implemented: ${game.id}/${capability}`);
    }
    for (const capability of game.capabilities.implemented) {
      if (!specified.has(capability))
        errors.push(`implemented capability is not specified: ${game.id}/${capability}`);
    }
    const specifiedPermissions = new Set(game.permissions.specified);
    for (const permission of game.permissions.enabled) {
      if (!specifiedPermissions.has(permission))
        errors.push(`enabled permission is not specified: ${game.id}/${permission}`);
    }
    if (game.id === "snapquest" && game.source.canonicalDrivePath !== "Apps/SnapQuest/") {
      errors.push("SnapQuest canonical Drive path must remain Apps/SnapQuest/");
    }
    if (game.id === "snapquest" && !game.capabilities.specified.includes("camera"))
      errors.push("SnapQuest must declare camera capability");
    if (game.id === "meme_court" && game.rendering !== "flutter_widgets")
      errors.push("Meme Court must use Flutter widgets");
  }
  const expected = new Set<string>(GAME_IDS);
  for (const id of expected) if (!ids.has(id)) errors.push(`registry entry is missing: ${id}`);
  for (const id of ids) if (!expected.has(id)) errors.push(`registry entry is not declared: ${id}`);
  return errors;
}
