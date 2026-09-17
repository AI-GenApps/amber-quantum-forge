import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  affectedForFiles,
  buildPubReverseGraph,
  type PubReverseGraph,
  parseGitNameStatus,
  parsePubspecDependencies,
  reverseDependencyClosure,
} from "./affected";

const members = [
  ["apps-native/games/packages/platform_core", "platform_core"],
  ["apps-native/games/packages/merge_rules", "merge_rules"],
  ["apps-native/games/packages/biome_rules", "biome_rules"],
  ["apps-native/games/packages/heist_rules", "heist_rules"],
  ["apps-native/games/packages/court_rules", "court_rules"],
  ["apps-native/games/packages/snapquest_rules", "snapquest_rules"],
  ["apps-native/games/merge_relay", "merge_relay"],
  ["apps-native/games/pocket_biome", "pocket_biome"],
  ["apps-native/games/sixty_second_heist", "sixty_second_heist"],
  ["apps-native/games/meme_court", "meme_court"],
  ["apps-native/games/snapquest", "snapquest"],
] as const;

function workspaceFixture(overrides: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "gaming-affected-"));
  for (const [path, name] of members) {
    const directory = join(root, path);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "pubspec.yaml"), overrides[name] ?? `name: ${name}\n`);
  }
  return root;
}

test("Git name-status parsing includes deleted and renamed paths", () => {
  expect(parseGitNameStatus("D\told.dart\nR100\tbefore.dart\tafter.dart\n")).toEqual([
    "after.dart",
    "before.dart",
    "old.dart",
  ]);
});

test("malformed rename status fails closed", () => {
  expect(() => parseGitNameStatus("R100\tonly-old.dart\n")).toThrow("Malformed R100");
  expect(() => parseGitNameStatus("M missing-tab.dart\n")).toThrow("Malformed git name-status");
});

test("Pubspec parser rejects malformed dependency entries", () => {
  const parsed = parsePubspecDependencies("name: fixture\ndependencies:\n  - invalid\n");
  expect(parsed.errors).toContain("malformed dependency entry: - invalid");
});

test("reverse Pub graph handles cycles without looping", () => {
  const root = workspaceFixture({
    platform_core: "name: platform_core\ndependencies:\n  merge_rules:\n    path: ../merge_rules\n",
    merge_rules: "name: merge_rules\ndependencies:\n  platform_core:\n    path: ../platform_core\n",
    merge_relay:
      "name: merge_relay\ndependencies:\n  merge_rules:\n    path: ../packages/merge_rules\n",
  });
  try {
    const graph = buildPubReverseGraph(root);
    expect(graph.errors).toEqual([]);
    const closure = reverseDependencyClosure(graph, "apps-native/games/packages/merge_rules");
    expect(closure).toContain("apps-native/games/merge_relay");
    expect(closure).toContain("apps-native/games/packages/platform_core");
    expect(closure.length).toBeLessThan(5);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unknown local Pub dependency forces a full matrix", () => {
  const root = workspaceFixture({
    merge_rules: "name: merge_rules\ndependencies:\n  missing_local:\n    path: ../missing_local\n",
  });
  try {
    const graph = buildPubReverseGraph(root);
    expect(graph.errors.some((error) => error.includes("unknown local path dependency"))).toBe(
      true,
    );
    const result = affectedForFiles(["apps-native/games/packages/merge_rules/lib/rules.dart"], {
      root,
      graph,
    });
    expect(result.fallback).toBe(true);
    expect(result.apps).toHaveLength(5);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Dart package changes use reverse consumers instead of copying game rules", () => {
  const merge = affectedForFiles(["apps-native/games/packages/merge_rules/lib/rules.dart"]);
  expect(merge.apps).toEqual(["merge_relay"]);
  const biome = affectedForFiles(["apps-native/games/packages/biome_rules/lib/rules.dart"]);
  expect(biome.apps).toEqual(["pocket_biome"]);
  const core = affectedForFiles(["apps-native/games/packages/platform_core/lib/save.dart"]);
  expect(core.apps).toEqual([
    "merge_relay",
    "pocket_biome",
    "sixty_second_heist",
    "meme_court",
    "snapquest",
  ]);
});

test("shared API, lock, codegen, workflow, and turbo changes force the matrix", () => {
  for (const path of [
    "packages/api/src/games/routes.ts",
    "apps-native/games/pubspec.lock",
    "scripts/codegen-dart.ts",
    "scripts/codegen/registry.ts",
    ".github/workflows/games-ci.yml",
    "turbo.json",
  ]) {
    expect(affectedForFiles([path]).fallback).toBe(true);
  }
});

test("prefix lookalikes do not trigger shared change detection", () => {
  expect(affectedForFiles(["packages/apiary/src/index.ts"]).fallback).toBe(false);
  expect(affectedForFiles(["scripts/gamesx/check.ts"]).fallback).toBe(false);
  expect(affectedForFiles(["apps-native/games-notes/README.md"]).fallback).toBe(false);
});

test("unused graph values remain type-safe fixtures", () => {
  const graph: PubReverseGraph = {
    members: [],
    packageNames: new Map(),
    reverse: new Map(),
    errors: [],
  };
  expect(reverseDependencyClosure(graph, "missing")).toEqual(["missing"]);
});
