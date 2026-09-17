import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_REGISTRY, type GameRegistration } from "./registry";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const GAMES_ROOT = join(ROOT, "apps-native/games");

export interface Toolchain {
  readonly bun: string;
  readonly flutter: string;
  readonly dart: string;
  readonly flame: string;
}

export function readToolchain(): Toolchain {
  return JSON.parse(readFileSync(join(GAMES_ROOT, "toolchain.json"), "utf8")) as Toolchain;
}

export function run(command: string, args: string[], cwd = ROOT): void {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

export function versionOutput(command: string, args: string[]): string {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8" });
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

export function capture(command: string, args: string[], cwd = ROOT): string {
  return execFileSync(command, args, { cwd, encoding: "utf8" }).trim();
}

export function appDirectory(game: GameRegistration): string {
  return join(ROOT, game.paths.app);
}

export function existingApps(): GameRegistration[] {
  return GAME_REGISTRY.filter((game) => existsSync(join(appDirectory(game), "pubspec.yaml")));
}

export function existingPackages(): string[] {
  const packagesRoot = join(GAMES_ROOT, "packages");
  if (!existsSync(packagesRoot)) return [];
  return GAME_REGISTRY.map((game) => game.paths.rulesPackage)
    .concat("apps-native/games/packages/platform_core")
    .filter((path, index, paths) => paths.indexOf(path) === index)
    .filter((path) => existsSync(join(ROOT, path, "pubspec.yaml")));
}

export function flag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

export function requireApp(id: string | undefined): GameRegistration {
  const game = GAME_REGISTRY.find((entry) => entry.id === id);
  if (!game) throw new Error(`Unknown app '${id ?? ""}'. Use games:list to see stable IDs.`);
  return game;
}
