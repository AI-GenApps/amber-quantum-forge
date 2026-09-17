import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { GAME_REGISTRY, type GameId } from "./registry";
import { flag, ROOT } from "./toolchain";
export interface AffectedResult {
  readonly apps: GameId[];
  readonly fallback: boolean;
  readonly reason: string;
  readonly changed: string[];
}
export interface ParsedPubspec {
  readonly name: string;
  readonly dependencies: readonly string[];
  readonly localPathDependencies: ReadonlyMap<string, string>;
  readonly errors: readonly string[];
}
export interface PubReverseGraph {
  readonly members: readonly string[];
  readonly packageNames: ReadonlyMap<string, string>;
  readonly reverse: ReadonlyMap<string, readonly string[]>;
  readonly errors: readonly string[];
}
export interface AffectedOptions {
  readonly root?: string;
  readonly graph?: PubReverseGraph;
}
interface ChangedFilesResult {
  readonly files: string[];
  readonly baseError?: string;
}
const platformCorePath = "apps-native/games/packages/platform_core";
function uniqueSorted(paths: Iterable<string>): string[] {
  return [...new Set(paths)].sort();
}
function isPathInside(path: string, directory: string): boolean {
  return path === directory || path.startsWith(`${directory}/`);
}
function workspaceMembers(): string[] {
  return uniqueSorted([
    platformCorePath,
    ...GAME_REGISTRY.flatMap((game) => [game.paths.app, game.paths.rulesPackage]),
  ]);
}
export function parsePubspecDependencies(contents: string): ParsedPubspec {
  const errors: string[] = [];
  const name = contents.match(/^name:\s*([a-z0-9_]+)\s*$/m)?.[1];
  if (!name) errors.push("pubspec is missing a valid package name");
  const dependencies: string[] = [];
  const localPathDependencies = new Map<string, string>();
  let section: string | undefined;
  let currentDependency: string | undefined;
  for (const line of contents.split(/\r?\n/)) {
    if (line.trim().length === 0 || line.trim().startsWith("#")) continue;
    const topLevel = line.match(/^([a-z][a-z0-9_-]*):(?:\s.*)?$/i);
    if (topLevel) {
      section = topLevel[1];
      currentDependency = undefined;
      continue;
    }
    if (section !== "dependencies" && section !== "dev_dependencies") continue;
    const dependency = line.match(/^ {2}([a-z][a-z0-9_]*):(?:\s.*)?$/i);
    if (dependency) {
      currentDependency = dependency[1];
      dependencies.push(currentDependency);
      continue;
    }
    const localPath = line.match(/^ {4}path:\s*(\S+)\s*$/);
    if (localPath && currentDependency) {
      localPathDependencies.set(currentDependency, localPath[1]);
      continue;
    }
    if (/^ {2}\S/.test(line)) errors.push(`malformed dependency entry: ${line.trim()}`);
  }
  return {
    name: name ?? "",
    dependencies: uniqueSorted(dependencies),
    localPathDependencies,
    errors,
  };
}
export function buildPubReverseGraph(root = ROOT): PubReverseGraph {
  const members = workspaceMembers();
  const packageNames = new Map<string, string>();
  const parsed = new Map<string, ParsedPubspec>();
  const errors: string[] = [];
  for (const member of members) {
    const path = join(root, member, "pubspec.yaml");
    if (!existsSync(path)) {
      errors.push(`missing workspace pubspec: ${member}`);
      continue;
    }
    const result = parsePubspecDependencies(readFileSync(path, "utf8"));
    for (const error of result.errors) errors.push(`${member}: ${error}`);
    if (!result.name) continue;
    if (packageNames.has(result.name)) {
      errors.push(`duplicate workspace package name: ${result.name}`);
      continue;
    }
    packageNames.set(result.name, member);
    parsed.set(member, result);
  }
  const reverse = new Map<string, string[]>();
  for (const [member, packageSpec] of parsed) {
    for (const dependency of packageSpec.dependencies) {
      const dependencyPath = packageNames.get(dependency);
      const localPath = packageSpec.localPathDependencies.get(dependency);
      if (localPath && !dependencyPath) {
        errors.push(`${member}: unknown local path dependency ${dependency} (${localPath})`);
        continue;
      }
      if (!dependencyPath) continue;
      if (localPath && resolve(root, member, localPath) !== resolve(root, dependencyPath)) {
        errors.push(`${member}: local path does not match workspace package ${dependency}`);
        continue;
      }
      const dependents = reverse.get(dependencyPath) ?? [];
      dependents.push(member);
      reverse.set(dependencyPath, uniqueSorted(dependents));
    }
  }
  return { members, packageNames, reverse, errors: uniqueSorted(errors) };
}
export function reverseDependencyClosure(graph: PubReverseGraph, changedMember: string): string[] {
  const result = new Set<string>([changedMember]);
  const queue = [changedMember];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const dependent of graph.reverse.get(current) ?? []) {
      if (result.has(dependent)) continue;
      result.add(dependent);
      queue.push(dependent);
    }
  }
  return uniqueSorted(result);
}
export function parseGitNameStatus(output: string): string[] {
  const files = new Set<string>();
  for (const line of output.split(/\r?\n/)) {
    if (!line) continue;
    const fields = line.split("\t");
    const status = fields[0] ?? "";
    if (/^[RC]\d{3}$/.test(status)) {
      if (fields.length !== 3 || !fields[1] || !fields[2])
        throw new Error(`Malformed ${status} rename/copy status: ${line}`);
      files.add(fields[1]);
      files.add(fields[2]);
      continue;
    }
    if (!/^[A-Z][0-9]*$/.test(status) || fields.length !== 2 || !fields[1])
      throw new Error(`Malformed git name-status entry: ${line}`);
    files.add(fields[1]);
  }
  return uniqueSorted(files);
}
function collectDiff(files: Set<string>, args: string[]): void {
  const output = execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const path of parseGitNameStatus(output)) files.add(path);
}
function changedFiles(base: string): ChangedFilesResult {
  const files = new Set<string>();
  let baseError: string | undefined;
  try {
    collectDiff(files, ["diff", "--name-status", "--find-renames", `${base}...HEAD`]);
  } catch (error) {
    baseError = error instanceof Error ? error.message : String(error);
  }
  for (const args of [
    ["diff", "--name-status", "--find-renames"],
    ["diff", "--cached", "--name-status", "--find-renames"],
  ]) {
    try {
      collectDiff(files, args);
    } catch {
      baseError ??= `Unable to read git diff: ${args.join(" ")}`;
    }
  }
  try {
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    for (const path of untracked.split(/\r?\n/)) if (path) files.add(path);
  } catch {
    baseError ??= "Unable to enumerate untracked files";
  }
  return { files: uniqueSorted(files), baseError };
}
function appForPath(path: string): GameId | undefined {
  return GAME_REGISTRY.find((game) => isPathInside(path, game.paths.app))?.id;
}
function fullMatrix(reason: string, changed: readonly string[]): AffectedResult {
  return {
    apps: GAME_REGISTRY.map((game) => game.id),
    fallback: true,
    reason,
    changed: uniqueSorted(changed),
  };
}
function sharedChange(path: string): boolean {
  const exact = new Set([
    "apps-native/games/pubspec.yaml",
    "apps-native/games/pubspec.lock",
    "apps-native/games/toolchain.json",
    "package.json",
    "bun.lock",
    "bun.lockb",
    "turbo.json",
    "scripts/codegen-dart.ts",
    "scripts/codegen-swift.ts",
  ]);
  if (exact.has(path)) return true;
  return [
    "packages/api/",
    "packages/db/",
    "scripts/games/",
    "scripts/codegen/",
    ".github/workflows/",
    ".eas/workflows/",
  ].some((prefix) => path.startsWith(prefix));
}
function appIdsForMembers(members: readonly string[]): GameId[] {
  const changed = new Set(members);
  return GAME_REGISTRY.filter((game) => changed.has(game.paths.app)).map((game) => game.id);
}
export function affectedForFiles(
  changed: readonly string[],
  options: AffectedOptions = {},
): AffectedResult {
  const normalized = uniqueSorted(changed.filter((path) => path.length > 0));
  const graph = options.graph ?? buildPubReverseGraph(options.root ?? ROOT);
  const affected = new Set<GameId>();
  for (const path of normalized) {
    if (sharedChange(path) || path.endsWith("/pubspec.lock")) {
      return fullMatrix(
        `Full matrix required for shared or orchestration change: ${path}`,
        normalized,
      );
    }
    const app = appForPath(path);
    if (app) {
      affected.add(app);
      continue;
    }
    if (isPathInside(path, "apps-native/games/packages")) {
      const member = graph.members.find((candidate) => isPathInside(path, candidate));
      if (!member || graph.errors.length > 0) {
        return fullMatrix(
          `Full matrix required because the Pub dependency graph is unknown for ${path}`,
          normalized,
        );
      }
      for (const id of appIdsForMembers(reverseDependencyClosure(graph, member))) affected.add(id);
      continue;
    }
    if (isPathInside(path, "apps-native/games")) {
      return fullMatrix(`Full matrix required for unclassified gaming change: ${path}`, normalized);
    }
  }
  const apps = GAME_REGISTRY.filter((game) => affected.has(game.id)).map((game) => game.id);
  const reason = apps.length > 0 ? "Affected app paths identified" : "No game changes detected";
  return { apps, fallback: false, reason, changed: normalized };
}
export function detectAffected(base = "origin/main"): AffectedResult {
  const changedResult = changedFiles(base);
  if (changedResult.baseError) {
    return fullMatrix(
      `Full matrix required: ${changedResult.baseError}; base '${base}' is not safely comparable`,
      changedResult.files,
    );
  }
  return affectedForFiles(changedResult.files);
}
function main(args: string[]): void {
  const result = detectAffected(flag(args, "--base") ?? "origin/main");
  if (args.includes("--format=json")) {
    console.log(JSON.stringify(result));
    return;
  }
  console.log(result.fallback ? `FULL MATRIX: ${result.reason}` : result.reason);
  console.log(result.apps.length > 0 ? result.apps.join("\n") : "No affected game apps");
  if (result.changed.length > 0) console.log(`Changed files: ${result.changed.length}`);
}
if (import.meta.main) main(process.argv.slice(2));
