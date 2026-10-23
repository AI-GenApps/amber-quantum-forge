import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const NEW_WEB_GAMES = [
  {
    id: "lantern_loops",
    slug: "lantern-loops",
    title: "Lantern Loops",
    epic: "19-web-lantern-loops",
    appId: "app.w3dev.lanternloops",
  },
  {
    id: "floodplain_dispatch",
    slug: "floodplain-dispatch",
    title: "Floodplain Dispatch",
    epic: "20-web-floodplain-dispatch",
    appId: "app.w3dev.floodplaindispatch",
  },
  {
    id: "cloud_observatory",
    slug: "cloud-observatory",
    title: "Cloud Observatory",
    epic: "21-web-cloud-observatory",
    appId: "app.w3dev.cloudobservatory",
  },
  {
    id: "the_last_window",
    slug: "the-last-window",
    title: "The Last Window",
    epic: "22-web-the-last-window",
    appId: "app.w3dev.thelastwindow",
  },
  {
    id: "dress_rehearsal",
    slug: "dress-rehearsal",
    title: "Dress Rehearsal",
    epic: "23-web-dress-rehearsal",
    appId: "app.w3dev.dressrehearsal",
  },
  {
    id: "lost_parcel_desk",
    slug: "lost-parcel-desk",
    title: "Lost Parcel Desk",
    epic: "24-web-lost-parcel-desk",
    appId: "app.w3dev.lostparceldesk",
  },
] as const;

const WEB_GAME_COUNT = NEW_WEB_GAMES.length + 1;

test("city_drive and the six web-games-kit games are the only web-engine games", () => {
  expect(webGames().map((game) => game.id)).toEqual([
    "city_drive",
    ...NEW_WEB_GAMES.map((game) => game.id),
  ]);
  expect(flutterGames()).toHaveLength(GAME_REGISTRY.length - WEB_GAME_COUNT);
  expect(flutterGames().every((game) => game.engine === "flutter")).toBe(true);
  expect(flutterGames().some((game) => game.rendering === "babylon")).toBe(false);
  expect(flutterGames().some((game) => game.rendering === "dom")).toBe(false);
});

test("each web-games-kit game registers a dom-rendered concept entry with workspace packages", () => {
  for (const expected of NEW_WEB_GAMES) {
    const game = gameById(expected.id);
    if (!game) throw new Error(`${expected.id} is not registered`);
    expect(isWebGame(game)).toBe(true);
    expect(game.engine).toBe("web");
    expect(game.rendering).toBe("dom");
    expect(game.lifecycle).toBe("concept");
    expect(game.publicTitle).toBe(expected.title);
    expect(game.platforms).toEqual(["android", "ios"]);
    expect(game.identity.androidApplicationId).toBe(expected.appId);
    expect(game.identity.iosBundleId).toBe(expected.appId);
    expect(game.namespaces.save).toBe(`games.${expected.id}`);
    expect(game.paths).toEqual({
      app: `apps-games/${expected.slug}`,
      rulesPackage: `apps-games/${expected.slug}-core`,
    });
    expect(game.source.folderId).toBe(`.agents/games/${expected.slug}`);
    expect(game.source.links.index).toBe(`.agents/games/${expected.slug}/README.md`);
    expect(game.source.links.validation).toBe(`tasks/epics/${expected.epic}/STATUS.md`);
    expect(existsSync(join(ROOT, game.source.links.index))).toBe(true);
  }
});

test("every web entry has existing package.json files and unique ids, paths and app ids", () => {
  const games = webGames();
  for (const game of games) {
    for (const path of [game.paths.app, game.paths.rulesPackage]) {
      expect(existsSync(join(ROOT, path, "package.json"))).toBe(true);
    }
  }
  for (const key of ["id", "app", "rulesPackage", "appId"] as const) {
    const values = games.map((game) =>
      key === "appId"
        ? game.identity.androidApplicationId
        : key === "id"
          ? game.id
          : game.paths[key],
    );
    expect(new Set(values).size).toBe(values.length);
  }
});

test("each new web game package.json names the workspace and the capacitor appId matches", () => {
  for (const expected of NEW_WEB_GAMES) {
    const app = JSON.parse(
      readFileSync(join(ROOT, "apps-games", expected.slug, "package.json"), "utf8"),
    );
    const core = JSON.parse(
      readFileSync(join(ROOT, "apps-games", `${expected.slug}-core`, "package.json"), "utf8"),
    );
    expect(app.name).toBe(`@web-games/${expected.slug}`);
    expect(core.name).toBe(`@web-games/${expected.slug}-core`);
    const config = readFileSync(
      join(ROOT, "apps-games", expected.slug, "capacitor.config.ts"),
      "utf8",
    );
    expect(config).toContain(`appId: "${expected.appId}"`);
  }
});

test("city_drive registers identity, namespaces, and a capability-free concept entry", () => {
  const game = city();
  expect(isWebGame(game)).toBe(true);
  expect(game.rendering).toBe("babylon");
  expect(game.publicTitle).toBe("Street Royale");
  expect(game.canonicalName).toBe("Street Royale");
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
    const paths = webGames().flatMap((game) => [game.paths.app, game.paths.rulesPackage]);
    expect(paths).toHaveLength(WEB_GAME_COUNT * 2);
    expect(errors).toContain("web game is missing package.json: city_drive/apps-games/city-drive");
    expect(errors).toContain(
      "web game is missing package.json: lantern_loops/apps-games/lantern-loops-core",
    );
    for (const path of paths) {
      mkdirSync(join(root, path), { recursive: true });
      writeFileSync(join(root, path, "package.json"), "{}\n");
    }
    expect(validateGameRegistry(root)).toEqual([]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Flutter app and package discovery never include the web game", () => {
  expect(existingApps().some((game) => isWebGame(game))).toBe(false);
  expect(existingApps().some((game) => game.id === "city_drive")).toBe(false);
  expect(existingPackages().some((path) => path.startsWith("apps-games/"))).toBe(false);
  expect(selectedApps(["--app", "city_drive"])).toEqual([]);
  for (const expected of NEW_WEB_GAMES) {
    expect(selectedApps(["--app", expected.id])).toEqual([]);
  }
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

test("Flutter commands skip every new web game and exit 0", () => {
  for (const expected of NEW_WEB_GAMES) {
    for (const command of ["format", "analyze", "test", "doctor"]) {
      const result = cli([command, "--app", expected.id]);
      expect(result.code).toBe(0);
      expect(result.out).toContain(`SKIP ${expected.id} uses the web engine`);
    }
    const build = cli(["build", "--app", expected.id]);
    expect(build.code).toBe(0);
    expect(build.out).toContain("bun run web-games:build");
    expect(build.out).toContain(`@web-games/${expected.slug}`);
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

test("games:list shows an engine column for all thirteen games", () => {
  const result = cli(["list"]);
  expect(result.code).toBe(0);
  const rows = result.out.trim().split("\n");
  expect(rows).toHaveLength(6 + WEB_GAME_COUNT);
  const engines = rows.map((row) => row.split("\t")[3]);
  expect(engines.filter((engine) => engine === "flutter")).toHaveLength(6);
  expect(engines.filter((engine) => engine === "web")).toHaveLength(WEB_GAME_COUNT);
  expect(rows.find((row) => row.startsWith("city_drive"))?.split("\t")[3]).toBe("web");
  for (const expected of NEW_WEB_GAMES) {
    const columns = rows.find((row) => row.startsWith(`${expected.id}\t`))?.split("\t");
    expect(columns?.[3]).toBe("web");
    expect(columns?.[4]).toBe("dom");
  }
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
