import { existsSync } from "node:fs";
import { parseEnvironment } from "./config";
import type { GameRegistration } from "./registry";
import { appDirectory, flag, run } from "./toolchain";
import { generateXcodeProject } from "./xcodegen";

function notRun(reason: string): void {
  console.log(`NOT RUN: ${reason}`);
  process.exitCode = 2;
}

function missingEnvironment(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]);
}

export function productionIdentityErrors(
  game: GameRegistration,
  platform: "android" | "ios",
): string[] {
  const errors: string[] = [];
  const id =
    platform === "android" ? game.identity.androidApplicationId : game.identity.iosBundleId;
  if (!id || id.endsWith(game.identity.debugSuffix)) errors.push(`${platform} production ID`);
  if (!game.release.version || game.release.buildNumber < 1)
    errors.push(`${platform} version and build number`);
  return errors;
}

function requireAndroidReleaseCredentials(): string[] {
  const missing = missingEnvironment([
    "ANDROID_KEYSTORE_PATH",
    "ANDROID_KEY_ALIAS",
    "ANDROID_KEY_PASSWORD",
    "ANDROID_STORE_PASSWORD",
  ]);
  if (process.env.ANDROID_KEYSTORE_PATH && !existsSync(process.env.ANDROID_KEYSTORE_PATH))
    missing.push("ANDROID_KEYSTORE_PATH(file)");
  return missing;
}

function requireIosReleaseCredentials(): string[] {
  const missing = missingEnvironment(["IOS_DISTRIBUTION_TEAM", "IOS_EXPORT_OPTIONS_PLIST"]);
  if (process.env.IOS_EXPORT_OPTIONS_PLIST && !existsSync(process.env.IOS_EXPORT_OPTIONS_PLIST))
    missing.push("IOS_EXPORT_OPTIONS_PLIST(file)");
  return missing;
}

export function runAndroidBuild(
  game: GameRegistration,
  mode: string,
  environment: string,
  execute: (command: string, args: string[], cwd?: string) => void = run,
): void {
  if (mode === "aab") {
    const missing = requireAndroidReleaseCredentials();
    if (missing.length > 0) {
      notRun(`Android app bundle signing is unavailable: missing ${missing.join(", ")}.`);
      return;
    }
    execute(
      "flutter",
      [
        "build",
        "appbundle",
        "--release",
        "--android-project-arg",
        `gameEnvironment=${environment}`,
        "--dart-define",
        `GAME_ENVIRONMENT=${environment}`,
        "--dart-define",
        `APP_VERSION=${game.release.version}`,
      ],
      appDirectory(game),
    );
    return;
  }
  if (mode !== "debug" && mode !== "release")
    throw new Error(`Unsupported Android build mode: ${mode}`);
  execute(
    "flutter",
    [
      "build",
      "apk",
      `--${mode}`,
      "--android-project-arg",
      `gameEnvironment=${environment}`,
      "--dart-define",
      `GAME_ENVIRONMENT=${environment}`,
      "--dart-define",
      `APP_VERSION=${game.release.version}`,
    ],
    appDirectory(game),
  );
}

function buildAndroid(game: GameRegistration, mode: string, environment: string): void {
  runAndroidBuild(game, mode, environment);
}

function buildIos(game: GameRegistration, mode: string, environment: string): void {
  if (process.platform !== "darwin") {
    notRun("iOS builds require macOS and Xcode.");
    return;
  }
  if (environment === "staging") {
    notRun(
      "staging iOS artifacts require an isolated Xcode configuration and are not implemented.",
    );
    return;
  }
  if (mode === "unsigned") {
    generateXcodeProject(appDirectory(game), game.identity.iosBundleId);
    run(
      "flutter",
      [
        "build",
        "ios",
        "--debug",
        "--no-codesign",
        "--dart-define",
        `GAME_ENVIRONMENT=${environment}`,
        "--dart-define",
        `APP_VERSION=${game.release.version}`,
      ],
      appDirectory(game),
    );
    return;
  }
  if (mode === "profile") {
    if (!process.env.IOS_DEVELOPMENT_TEAM) {
      notRun("profile iOS builds require IOS_DEVELOPMENT_TEAM for local development signing.");
      return;
    }
    generateXcodeProject(appDirectory(game), game.identity.iosBundleId);
    run(
      "flutter",
      [
        "build",
        "ios",
        "--profile",
        "--dart-define",
        `GAME_ENVIRONMENT=${environment}`,
        "--dart-define",
        `APP_VERSION=${game.release.version}`,
      ],
      appDirectory(game),
    );
    return;
  }
  if (mode === "archive" || mode === "ipa") {
    const missing = requireIosReleaseCredentials();
    if (missing.length > 0) {
      notRun(`iOS distribution signing is unavailable: missing ${missing.join(", ")}.`);
      return;
    }
    generateXcodeProject(appDirectory(game), game.identity.iosBundleId);
    run(
      "flutter",
      [
        "build",
        "ipa",
        "--release",
        "--export-options-plist",
        process.env.IOS_EXPORT_OPTIONS_PLIST as string,
        "--dart-define",
        `GAME_ENVIRONMENT=${environment}`,
        "--dart-define",
        `APP_VERSION=${game.release.version}`,
      ],
      appDirectory(game),
    );
    return;
  }
  throw new Error(`Unsupported iOS build mode: ${mode}`);
}

export function buildGame(args: string[], game: GameRegistration): void {
  const platform = flag(args, "--platform") ?? "android";
  const mode = flag(args, "--mode") ?? "debug";
  const environment = parseEnvironment(flag(args, "--environment") ?? "debug");
  if (platform !== "android" && platform !== "ios")
    throw new Error(`Unsupported build platform: ${platform}`);
  if (environment === "staging" && platform === "ios") {
    notRun(
      "staging iOS artifacts require an isolated Xcode configuration and are not implemented.",
    );
    return;
  }
  if (environment === "production") {
    if (!(platform === "android" ? mode === "aab" : mode === "archive" || mode === "ipa")) {
      notRun("production builds use Android --mode aab or iOS --mode archive/ipa.");
      return;
    }
    const identityErrors = productionIdentityErrors(game, platform);
    if (identityErrors.length > 0) {
      notRun(`production artifacts require ${identityErrors.join(", ")}.`);
      return;
    }
  }
  if (platform === "android") buildAndroid(game, mode, environment);
  else if (platform === "ios") buildIos(game, mode, environment);
}
