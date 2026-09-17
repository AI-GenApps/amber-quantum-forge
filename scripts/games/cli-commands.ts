import { existsSync } from "node:fs";
import { parseEnvironment, validateGameConfigs } from "./config";
import { validateContent } from "./content";
import { GAME_REGISTRY, type GameRegistration, gameById, validateGameRegistry } from "./registry";
import {
  appDirectory,
  existingApps,
  existingPackages,
  flag,
  GAMES_ROOT,
  ROOT,
  readToolchain,
  requireApp,
  run,
  versionOutput,
} from "./toolchain";

export function selectedApps(args: string[]): GameRegistration[] {
  const id = flag(args, "--app");
  if (!id) return existingApps();
  const game = requireApp(id);
  if (!existingApps().some((entry) => entry.id === game.id))
    throw new Error(`Game app is not scaffolded: ${game.id}`);
  return [game];
}

function packageDirectories(): string[] {
  return existingPackages().map((path) => `${ROOT}/${path}`);
}

export function format(args: string[]): void {
  const check = args.includes("--check");
  for (const directory of packageDirectories()) {
    run(
      "dart",
      ["format", ...(check ? ["--output=none", "--set-exit-if-changed"] : []), "."],
      directory,
    );
  }
  for (const game of selectedApps(args)) {
    run(
      "dart",
      ["format", ...(check ? ["--output=none", "--set-exit-if-changed"] : []), "lib", "test"],
      appDirectory(game),
    );
  }
}

export function analyze(args: string[]): void {
  for (const directory of packageDirectories()) run("dart", ["analyze"], directory);
  for (const game of selectedApps(args)) run("flutter", ["analyze"], appDirectory(game));
}

export function test(args: string[]): void {
  for (const directory of packageDirectories()) run("dart", ["test"], directory);
  for (const game of selectedApps(args)) run("flutter", ["test"], appDirectory(game));
}

export function validate(args: string[]): void {
  const errors = validateGameRegistry();
  errors.push(...validateGameConfigs(parseEnvironment(flag(args, "--environment") ?? "debug")));
  errors.push(...validateContent());
  if (args.includes("--strict")) {
    for (const game of GAME_REGISTRY) {
      if (!gameById(game.id) || !existingApps().some((entry) => entry.id === game.id))
        errors.push(`missing app scaffold: ${game.id}`);
      if (!existingPackages().includes(game.paths.rulesPackage))
        errors.push(`missing rules package: ${game.id}`);
    }
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
  console.log(
    args.includes("--strict")
      ? "Gaming registry and content validation passed in strict mode."
      : "Gaming registry and content validation passed.",
  );
}

export function bootstrap(): void {
  run("bun", ["install", "--frozen-lockfile"]);
  const missingApps = GAME_REGISTRY.filter(
    (game) => !existingApps().some((entry) => entry.id === game.id),
  );
  const missingPackages = GAME_REGISTRY.filter(
    (game) => !existingPackages().includes(game.paths.rulesPackage),
  );
  if (missingApps.length > 0 || missingPackages.length > 0) {
    const missing = [
      ...missingApps.map((game) => `app ${game.id}`),
      ...missingPackages.map((game) => `package ${game.paths.rulesPackage}`),
    ];
    throw new Error(`Gaming workspace is incomplete: ${missing.join(", ")}`);
  }
  run(
    "dart",
    ["pub", "get", ...(existsSync(`${GAMES_ROOT}/pubspec.lock`) ? ["--enforce-lockfile"] : [])],
    GAMES_ROOT,
  );
  for (const game of GAME_REGISTRY) {
    const lockfile = `${appDirectory(game)}/pubspec.lock`;
    run(
      "flutter",
      ["pub", "get", ...(existsSync(lockfile) ? ["--enforce-lockfile"] : [])],
      appDirectory(game),
    );
  }
}

export function doctor(args: string[]): void {
  const toolchain = readToolchain();
  const checks: [string, string[], string][] = [
    ["bun", ["--version"], toolchain.bun],
    ["flutter", ["--version"], toolchain.flutter],
    ["dart", ["--version"], toolchain.dart],
  ];
  const failures: string[] = [];
  for (const [name, command, expected] of checks) {
    const output = versionOutput(name, command);
    const passed = output.includes(expected);
    console.log(
      `${passed ? "OK" : "MISMATCH"} ${name}: expected ${expected}${output ? `, observed ${output.split("\n")[0]}` : ", command unavailable"}`,
    );
    if (!passed) failures.push(name);
  }
  if (process.platform === "darwin") {
    const xcode = versionOutput("xcodebuild", ["-version"]);
    console.log(
      xcode
        ? `OK xcodebuild: ${xcode.split("\n")[0]}`
        : "MISSING xcodebuild: unsigned iOS verification is unavailable",
    );
    if (!xcode) failures.push("xcodebuild");
  } else {
    console.log("NOT RUN xcodebuild: macOS is required for iOS verification.");
  }
  const adb = versionOutput("adb", ["version"]);
  console.log(
    adb
      ? `OK adb: ${adb.split("\n")[0]}`
      : "NOT RUN adb: a physical Android device is required only for games:run.",
  );
  if (failures.length > 0 && args.includes("--strict"))
    throw new Error(`Toolchain mismatch: ${failures.join(", ")}`);
}

export function list(): void {
  for (const game of GAME_REGISTRY) {
    console.log(
      `${game.id}\t${game.publicTitle}\t${game.identity.iosBundleId}\t${game.rendering}\t${game.readiness.implemented ? "implemented" : "scaffold"}`,
    );
  }
}
