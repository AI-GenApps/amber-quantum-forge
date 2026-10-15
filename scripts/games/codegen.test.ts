import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateRegistry } from "./codegen";

const registryPath = join(
  import.meta.dir,
  "../../apps-native/games/packages/platform_core/lib/src/generated/game_app_registry.dart",
);

test("generated Dart registry is formatter-stable", () => {
  generateRegistry();
  execFileSync("dart", ["format", "--output=none", "--set-exit-if-changed", registryPath]);
  expect(readFileSync(registryPath, "utf8")).toContain("GeneratedGameRegistry");
});

test("generated Dart registry excludes web games and is left untouched when unchanged", () => {
  const before = readFileSync(registryPath, "utf8");
  generateRegistry();
  const after = readFileSync(registryPath, "utf8");
  expect(after).toBe(before);
  expect(after).not.toContain("city_drive");
  expect(after).not.toContain("babylon");
  expect(after).toContain("id: 'ludo'");
});
