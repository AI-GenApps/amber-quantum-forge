import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  addConfigAsset,
  configureAndroid,
  configureIos,
  writeRuntimeShell,
  writeRuntimeTest,
} from "./generate-native";
import {
  type GenerateOptions,
  parseGenerateOptions,
  readGeneratedConfig,
  validateGenerateOptions,
  writeGeneratedConfig,
} from "./generate-types";
import { renderGeneratedIconSync } from "./icons";
import { generateXcodeProject, writeProjectSpec } from "./xcodegen";

export function generateGame(options: GenerateOptions): void {
  validateGenerateOptions(options);
  execFileSync(
    "flutter",
    [
      "create",
      "--platforms=android,ios",
      "--org",
      "app.w3dev",
      "--project-name",
      options.id,
      options.output,
    ],
    { stdio: "inherit" },
  );
  const config = writeGeneratedConfig(options.output, options.id, options.title);
  addConfigAsset(options.output);
  writeRuntimeShell(options.output);
  writeRuntimeTest(options.output, options.id, options.title);
  configureAndroid(options.output, config.androidApplicationId, options.id);
  configureIos(options.output, config.iosBundleId, config.debugId);
  renderGeneratedIconSync(options.output, options.title);
  writeProjectSpec(options.output, config.productionId);
  if (process.platform === "darwin") generateXcodeProject(options.output, config.productionId);
  console.log(`Generated independent Flutter shell at ${options.output}`);
}

export function validateGenerated(output: string): string[] {
  const root = resolve(output);
  const required = [
    "pubspec.yaml",
    "game.config.json",
    "lib/main.dart",
    "android/app/build.gradle.kts",
    "ios/Flutter/Debug.xcconfig",
    "ios/Flutter/Release.xcconfig",
    "ios/project.yml",
  ];
  const errors = required
    .filter((path) => !existsSync(resolve(root, path)))
    .map((path) => `missing ${path}`);
  const config = readGeneratedConfig(root);
  if (!config) errors.push("invalid game.config.json identity or namespace");
  if (errors.length > 0 || !config) return errors;
  errors.push(...validateAndroid(root, config));
  errors.push(...validateIos(root, config));
  errors.push(...validateRuntimeFiles(root));
  return errors;
}

function validateAndroid(
  root: string,
  config: NonNullable<ReturnType<typeof readGeneratedConfig>>,
): string[] {
  const errors: string[] = [];
  const android = readFileSync(resolve(root, "android/app/build.gradle.kts"), "utf8");
  const debugSuffixes = android.match(/applicationIdSuffix\s*=\s*"\.debug"/g) ?? [];
  if (
    !android.includes(`applicationId = "${config.androidApplicationId}"`) ||
    !android.includes(`namespace = "${config.androidApplicationId}"`) ||
    debugSuffixes.length !== 2 ||
    !android.includes('if (gameEnvironment == "debug")')
  ) {
    errors.push("Android native identifiers do not match game.config.json");
  }
  const activityPath = resolve(
    root,
    "android/app/src/main/kotlin",
    `${config.androidApplicationId.replaceAll(".", "/")}/MainActivity.kt`,
  );
  if (
    !existsSync(activityPath) ||
    !readFileSync(activityPath, "utf8").includes(`package ${config.androidApplicationId}`)
  ) {
    errors.push("Android MainActivity package does not match game.config.json");
  }
  return errors;
}

function validateIos(
  root: string,
  config: NonNullable<ReturnType<typeof readGeneratedConfig>>,
): string[] {
  const errors: string[] = [];
  for (const relativePath of ["ios/Flutter/Debug.xcconfig", "ios/Flutter/Release.xcconfig"]) {
    const source = readFileSync(resolve(root, relativePath), "utf8");
    const expected = relativePath.includes("Debug") ? config.debugId : config.productionId;
    if (!source.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${expected}`))
      errors.push(`iOS identifier missing from ${relativePath}`);
  }
  const project = readFileSync(resolve(root, "ios/project.yml"), "utf8");
  if (
    project.includes("PRODUCT_BUNDLE_app") ||
    project.includes("SWIFT_OBJC_BRapp") ||
    !project.includes(`PRODUCT_BUNDLE_IDENTIFIER: ${config.productionId}`) ||
    !project.includes(`PRODUCT_BUNDLE_IDENTIFIER: ${config.debugId}`) ||
    !project.includes("SWIFT_OBJC_BRIDGING_HEADER: Runner/Runner-Bridging-Header.h")
  ) {
    errors.push("iOS XcodeGen source has malformed or incomplete identity settings");
  }
  return errors;
}

function validateRuntimeFiles(root: string): string[] {
  const errors: string[] = [];
  const pubspec = readFileSync(resolve(root, "pubspec.yaml"), "utf8");
  if (!pubspec.includes("    - game.config.json"))
    errors.push("runtime config is not declared as an asset");
  const source = readFileSync(resolve(root, "lib/main.dart"), "utf8");
  if (!/rootBundle\.loadString\(['"]game\.config\.json['"]\)/.test(source))
    errors.push("runtime shell does not load game.config.json");
  if (/merge_relay|pocket_biome|sixty_second_heist|meme_court|snapquest|ludo/.test(source)) {
    errors.push("generated shell imports a registered game");
  }
  return errors;
}

function main(args: string[]): void {
  if (args.includes("--validate")) {
    const output = args[args.indexOf("--validate") + 1];
    if (!output) throw new Error("--validate requires an output path");
    const errors = validateGenerated(output);
    if (errors.length > 0) throw new Error(errors.join("\n"));
    console.log(`Generated shell validation passed: ${resolve(output)}`);
    return;
  }
  generateGame(parseGenerateOptions(args));
}

if (import.meta.main) main(process.argv.slice(2));
