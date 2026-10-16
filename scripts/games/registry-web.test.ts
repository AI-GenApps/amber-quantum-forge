import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildGame } from "./cli-build";
import { selectedApps } from "./cli-commands";
import {
  flutterGames,
  GAME_REGISTRY,
  gameById,
  isWebGame,
  validateGameRegistry,
  webEngineMessage,
  webGames,
} from "./registry";
import { existingApps, existingPackages, ROOT } from "./toolchain";

const cliPath = join(ROOT, "scripts/games/cli.ts");

function cli(args: string[]) {
  const result = Bun.spawnSync(["bun", cliPath, ...args], { cwd: ROOT });
  return {
    code: result.exitCode,
    out: `${result.stdout.toString()}${result.stderr.toString()}`,
  };
}

function city() {
  const game = gameById("city_drive");
  if (!game) throw new Error("city_drive is not registered");
  return game;
}

test("city_drive is the only web-engine game and every other game stays on Flutter", () => {
  expect(webGames().map((game) => game.id)).toEqual(["city_drive"]);
  expect(flutterGames()).toHaveLength(GAME_REGISTRY.length - 1);
  expect(flutterGames().every((game) => game.engine === "flutter")).toBe(true);
  expect(flutterGames().some((game) => game.rendering === "babylon")).toBe(false);
});

test("city_drive registers identity, namespaces, and a capability-free concept entry", () => {
  const game = city();
  expect(isWebGame(game)).toBe(true);
  expect(game.rendering).toBe("babylon");
  expect(game.lifecycle).toBe("concept");
  expect(game.platforms).toEqual(["android", "ios"]);
  expect(game.identity.androidApplicationId).toBe("app.w3dev.citydrive");
  expect(game.identity.iosBundleId).toBe("app.w3dev.citydrive");
  expect(game.identity.debugSuffix).toBe(".debug");
  expect(game.namespaces.save).toBe("games.city_drive");
  expect(game.paths).toEqual({
    app: "apps-games/city-drive",
    rulesPackage: "apps-games/city-drive-core",
  });
  expect(game.release.version).toBe("0.1.0");
  expect(game.release.buildNumber).toBe(1);
  expect(game.capabilities.specified).toEqual(["game_loop"]);
  for (const forbidden of ["ads", "billing", "guest_identity", "save_sync"] as const) {
    expect(game.capabilities.specified).not.toContain(forbidden);
  }
  expect(game.source.canonicalDrivePath).toBeNull();
});

test("a web entry validates against the workspace package.json files", () => {
  expect(validateGameRegistry()).toEqual([]);
});

test("a web entry without package.json is rejected, with no pubspec required", () => {
  const root = mkdtempSync(join(tmpdir(), "city-drive-registry-"));
  try {
    const errors = validateGameRegistry(root);
    expect(errors).toContain("web game is missing package.json: city_drive/apps-games/city-drive");
    expect(errors).toContain(
      "web game is missing package.json: city_drive/apps-games/city-drive-core",
    );
    for (const path of ["apps-games/city-drive", "apps-games/city-drive-core"]) {
      mkdirSync(join(root, path), { recursive: true });
      writeFileSync(join(root, path, "package.json"), "{}\n");
    }
    expect(validateGameRegistry(root)).toEqual([]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Flutter app and package discovery never include the web game", () => {
  expect(existingApps().some((game) => game.id === "city_drive")).toBe(false);
  expect(existingPackages().some((path) => path.startsWith("apps-games/"))).toBe(false);
  expect(selectedApps(["--app", "city_drive"])).toEqual([]);
});

test("games:build for a web game prints the web-engine message and builds nothing", () => {
  const result = cli(["build", "--app", "city_drive"]);
  expect(result.code).toBe(0);
  expect(result.out).toContain(webEngineMessage(city()));
  expect(result.out).toContain("bun run city-drive:build");
  expect(result.out).toContain("bun run city-drive:cap:sync");
  expect(result.out).toContain("bun run city-drive:android:debug");
  expect(() => buildGame([], city())).not.toThrow();
});

test("Flutter commands skip city_drive and exit 0", () => {
  for (const command of ["format", "analyze", "test", "doctor"]) {
    const result = cli([command, "--app", "city_drive"]);
    expect(result.code).toBe(0);
    expect(result.out).toContain("SKIP city_drive uses the web engine");
  }
});

test("device and native commands refuse the web game with a clear message", () => {
  for (const args of [
    ["run", "--app", "city_drive"],
    ["xcodegen", "--app", "city_drive"],
  ]) {
    const result = cli(args);
    expect(result.out).toContain("city_drive uses the web engine");
  }
  const metadata = cli([
    "metadata",
    "--app",
    "city_drive",
    "--platform",
    "android",
    "--environment",
    "debug",
    "--output",
    join(tmpdir(), "city-drive-metadata-unused.json"),
  ]);
  expect(metadata.code).not.toBe(0);
  expect(metadata.out).toContain("city_drive uses the web engine");
});

test("games:list shows an engine column for all seven games", () => {
  const result = cli(["list"]);
  expect(result.code).toBe(0);
  const rows = result.out.trim().split("\n");
  expect(rows).toHaveLength(7);
  const engines = rows.map((row) => row.split("\t")[3]);
  expect(engines.filter((engine) => engine === "flutter")).toHaveLength(6);
  expect(rows.find((row) => row.startsWith("city_drive"))?.split("\t")[3]).toBe("web");
});

test("games:validate and strict validation pass with the web game registered", () => {
  expect(cli(["validate"]).code).toBe(0);
  expect(cli(["validate", "--strict"]).code).toBe(0);
});

interface WorkflowStep {
  readonly uses?: string;
  readonly run?: string;
}

function workflow(name: string): { jobs: Record<string, { steps?: WorkflowStep[] }> } {
  const text = readFileSync(join(ROOT, ".github/workflows", name), "utf8");
  return Bun.YAML.parse(text) as { jobs: Record<string, { steps?: WorkflowStep[] }> };
}

test("city-drive-ci.yml is valid YAML, pins actions by SHA, and runs only Bun commands", () => {
  const steps = Object.values(workflow("city-drive-ci.yml").jobs).flatMap((job) => job.steps ?? []);
  expect(steps.length).toBeGreaterThan(0);
  for (const step of steps) {
    if (step.uses) expect(step.uses).toMatch(/@[0-9a-f]{40}$/);
    if (step.run) expect(step.run).toMatch(/^bunx? /);
  }
  const commands = steps.flatMap((step) => (step.run ? [step.run] : []));
  expect(commands).toEqual([
    "bun install --frozen-lockfile",
    "bunx biome check apps-games",
    "bun run city-drive:typecheck",
    "bun run city-drive:test",
    "bun run city-drive:build",
  ]);
  expect(readFileSync(join(ROOT, ".github/workflows/city-drive-ci.yml"), "utf8")).not.toMatch(
    /deploy|vercel/i,
  );
});

test("Flutter build workflows keep rejecting city_drive", () => {
  for (const name of ["games-build.yml", "games-android-release.yml"]) {
    const text = readFileSync(join(ROOT, ".github/workflows", name), "utf8");
    expect(text).not.toContain("city_drive");
    expect(text).toContain('case "$GAME_APP" in merge_relay|');
  }
});
