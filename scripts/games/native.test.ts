import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configureAndroid } from "./native";

test("native Android preparation is idempotent", () => {
  const parent = mkdtempSync(join(tmpdir(), "gaming-native-"));
  const root = join(parent, "app");
  const buildPath = join(root, "android/app");
  mkdirSync(buildPath, { recursive: true });
  writeFileSync(
    join(buildPath, "build.gradle.kts"),
    readFileSync("apps-native/games/merge_relay/android/app/build.gradle.kts", "utf8"),
  );
  try {
    configureAndroid(root, "app.w3dev.fixture");
    const first = readFileSync(join(buildPath, "build.gradle.kts"), "utf8");
    configureAndroid(root, "app.w3dev.fixture");
    const second = readFileSync(join(buildPath, "build.gradle.kts"), "utf8");
    expect(second).toBe(first);
    expect(first.match(/signingConfigs \{/g)?.length).toBe(1);
    expect(first.match(/val gameEnvironment =/g)?.length).toBe(1);
    expect(first.match(/if \(gameEnvironment !in setOf/g)?.length).toBe(1);
    expect(first).toContain('applicationIdSuffix = ".staging"');
    expect(first).toContain('gameEnvironment == "staging"');
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
