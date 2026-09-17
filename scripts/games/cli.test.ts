import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { affectedForFiles, detectAffected } from "./affected";
import { classifyPhysicalDevice } from "./cli";
import { productionIdentityErrors, runAndroidBuild } from "./cli-build";
import {
  activeIdForEnvironment,
  validateAndroidManifestFeatures,
  validateGameConfigs,
} from "./config";
import { validateContent } from "./content";
import { GAME_REGISTRY, validateGameRegistry } from "./registry";
import { appDirectory } from "./toolchain";

test("registry keeps five independent app identities", () => {
  expect(validateGameRegistry()).toEqual([]);
});

test("generated app configs and native identities match the registry", () => {
  expect(validateGameConfigs()).toEqual([]);
});

test("content fixtures contain no blocked customer data", () => {
  expect(validateContent()).toEqual([]);
});

test("invalid affected base forces a full matrix", () => {
  const result = detectAffected("refs/heads/this-base-does-not-exist");
  expect(result.fallback).toBe(true);
  expect(result.apps).toHaveLength(5);
});

test("deleted and renamed app paths remain attributable", () => {
  const deleted = affectedForFiles(["apps-native/games/merge_relay/lib/main.dart"]);
  expect(deleted.apps).toEqual(["merge_relay"]);
  expect(deleted.fallback).toBe(false);

  const renamed = affectedForFiles([
    "apps-native/games/merge_relay/lib/main.dart",
    "apps-native/games/pocket_biome/lib/main.dart",
  ]);
  expect(renamed.apps).toEqual(["merge_relay", "pocket_biome"]);
});

test("unknown gaming paths force the conservative full matrix", () => {
  const result = affectedForFiles(["apps-native/games/README.md"]);
  expect(result.fallback).toBe(true);
  expect(result.apps).toHaveLength(5);
});

test("physical device detection accepts only real iOS and Android targets", () => {
  expect(
    classifyPhysicalDevice(
      [{ id: "android", targetPlatform: "android-arm64", emulator: false }],
      "android",
    ),
  ).toBe("physical");
  expect(
    classifyPhysicalDevice([{ id: "ios", targetPlatform: "ios", emulator: false }], "ios"),
  ).toBe("physical");
  expect(
    classifyPhysicalDevice([{ id: "sim", targetPlatform: "ios-simulator", emulator: true }], "sim"),
  ).toBe("emulator");
  expect(
    classifyPhysicalDevice(
      [{ id: "chrome", targetPlatform: "web-javascript", emulator: false }],
      "chrome",
    ),
  ).toBe("unsupported");
  expect(classifyPhysicalDevice([], "missing")).toBe("missing");
});

test("Android artifact readiness does not depend on Apple publication metadata", () => {
  const game = GAME_REGISTRY[0];
  expect(game.identity.registrationStatus).toBe("unverified");
  expect(game.release.publisher).toBeNull();
  expect(game.release.storeProductIds.ios).toBeNull();
  expect(game.release.storeProductIds.android).toBeNull();
  expect(productionIdentityErrors(game, "android")).toEqual([]);
});

test("environment arguments leave tracked app sources unchanged", () => {
  const originals = new Map(
    GAME_REGISTRY.map((game) => [
      game.id,
      {
        config: readFileSync(join(appDirectory(game), "game.config.json"), "utf8"),
        gradle: readFileSync(join(appDirectory(game), "android/app/build.gradle.kts"), "utf8"),
      },
    ]),
  );
  const selected = GAME_REGISTRY[0];
  const calls: { command: string; args: string[]; cwd?: string }[] = [];
  runAndroidBuild(selected, "debug", "staging", (command, args, cwd) => {
    calls.push({ command, args, cwd });
  });
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args).toContain("gameEnvironment=staging");
  expect(calls[0]?.args).toContain("GAME_ENVIRONMENT=staging");
  expect(() =>
    runAndroidBuild(selected, "release", "staging", () => {
      throw new Error("fixture build interruption");
    }),
  ).toThrow("fixture build interruption");
  for (const game of GAME_REGISTRY) {
    const original = originals.get(game.id);
    expect(original).toBeDefined();
    if (!original) continue;
    expect(readFileSync(join(appDirectory(game), "game.config.json"), "utf8")).toBe(
      original.config,
    );
    expect(readFileSync(join(appDirectory(game), "android/app/build.gradle.kts"), "utf8")).toBe(
      original.gradle,
    );
  }
  expect(activeIdForEnvironment(selected, "debug")).toBe("app.w3dev.mergerelay.debug");
  expect(activeIdForEnvironment(selected, "staging")).toBe("app.w3dev.mergerelay.staging");
  expect(activeIdForEnvironment(selected, "production")).toBe("app.w3dev.mergerelay");
});

test("all native Android projects declare immutable environment branches", () => {
  for (const game of GAME_REGISTRY) {
    const source = readFileSync(join(appDirectory(game), "android/app/build.gradle.kts"), "utf8");
    expect(source).toContain('setOf("debug", "staging", "production")');
    expect(source).toContain('applicationIdSuffix = ".staging"');
    expect(source).toContain('signingConfig = signingConfigs.getByName("debug")');
  }
});

test("camera hardware features stay optional and isolated to SnapQuest", () => {
  const snapManifest = readFileSync(
    join(appDirectory(GAME_REGISTRY[4]), "android/app/src/main/AndroidManifest.xml"),
    "utf8",
  );
  expect(validateAndroidManifestFeatures(snapManifest, "snapquest", true)).toEqual([]);
  expect(
    validateAndroidManifestFeatures(
      '<manifest><uses-feature android:name="android.hardware.camera" android:required="true" /></manifest>',
      "fixture",
      true,
    ),
  ).toHaveLength(3);
  expect(validateAndroidManifestFeatures("<manifest />", "fixture", false)).toEqual([]);
});
