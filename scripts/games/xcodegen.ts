import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { GAME_REGISTRY } from "./registry";
import { appDirectory } from "./toolchain";

export function projectSpec(bundleId: string, deploymentTarget = "15.0"): string {
  const localDevelopmentTeam = process.env.IOS_DEVELOPMENT_TEAM?.trim();
  const distributionTeam = process.env.IOS_DISTRIBUTION_TEAM?.trim();
  const localSigningSettings = localDevelopmentTeam
    ? `          CODE_SIGN_STYLE: Automatic
          CODE_SIGN_IDENTITY: "Apple Development"
          DEVELOPMENT_TEAM: ${localDevelopmentTeam}`
    : "          CODE_SIGNING_ALLOWED: NO";
  const distributionSigningSettings = distributionTeam
    ? `          CODE_SIGN_STYLE: Manual
          CODE_SIGN_IDENTITY: "Apple Distribution"
          DEVELOPMENT_TEAM: ${distributionTeam}`
    : "          CODE_SIGNING_ALLOWED: NO";

  return `name: Runner
options:
  bundleIdPrefix: app.w3dev
  deploymentTarget:
    iOS: "${deploymentTarget}"
  createIntermediateGroups: true
configs:
  Debug: debug
  Release: release
  Profile: release
settings:
  base:
    CLANG_ENABLE_MODULES: YES
    ENABLE_BITCODE: NO
    IPHONEOS_DEPLOYMENT_TARGET: "${deploymentTarget}"
    SWIFT_VERSION: "5.0"
targets:
  Runner:
    type: application
    platform: iOS
    deploymentTarget: "${deploymentTarget}"
    sources:
      - path: Runner/AppDelegate.swift
      - path: Runner/SceneDelegate.swift
      - path: Runner/GeneratedPluginRegistrant.m
      - path: Runner/Assets.xcassets
        buildPhase: resources
      - path: Runner/Base.lproj/LaunchScreen.storyboard
        buildPhase: resources
      - path: Runner/Base.lproj/Main.storyboard
        buildPhase: resources
    configFiles:
      Debug: Flutter/Debug.xcconfig
      Release: Flutter/Release.xcconfig
      Profile: Flutter/Release.xcconfig
    settings:
      base:
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        CURRENT_PROJECT_VERSION: "$(FLUTTER_BUILD_NUMBER)"
        INFOPLIST_FILE: Runner/Info.plist
        LD_RUNPATH_SEARCH_PATHS:
          - "$(inherited)"
          - "@executable_path/Frameworks"
        PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}
        PRODUCT_NAME: "$(TARGET_NAME)"
        SWIFT_OBJC_BRIDGING_HEADER: Runner/Runner-Bridging-Header.h
        VERSIONING_SYSTEM: apple-generic
      configs:
        Debug:
          PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}.debug
${localSigningSettings}
        Release:
          PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}
${distributionSigningSettings}
        Profile:
          PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}.debug
${localSigningSettings}
    preBuildScripts:
      - name: Run Flutter Build
        script: /bin/sh "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" build
        basedOnDependencyAnalysis: false
    postBuildScripts:
      - name: Embed Flutter Frameworks
        script: /bin/sh "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" embed_and_thin
        basedOnDependencyAnalysis: false
  RunnerTests:
    type: bundle.unit-test
    platform: iOS
    deploymentTarget: "${deploymentTarget}"
    sources:
      - path: RunnerTests
    dependencies:
      - target: Runner
    settings:
      base:
        GENERATE_INFOPLIST_FILE: YES
        PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}.tests
        TEST_HOST: "$(BUILT_PRODUCTS_DIR)/Runner.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/Runner"
schemes:
  Runner:
    build:
      targets:
        Runner: all
        RunnerTests: [test]
    run:
      config: Debug
      customLLDBInitFile: "$(SRCROOT)/Flutter/ephemeral/flutter_lldbinit"
    test:
      config: Debug
      customLLDBInitFile: "$(SRCROOT)/Flutter/ephemeral/flutter_lldbinit"
      targets:
        - RunnerTests
    profile:
      config: Profile
    analyze:
      config: Debug
    archive:
      config: Release
`;
}

export function writeProjectSpec(root: string, bundleId: string, deploymentTarget = "15.0"): void {
  writeFileSync(join(root, "ios/project.yml"), projectSpec(bundleId, deploymentTarget));
}

export function generateXcodeProject(
  root: string,
  bundleId: string,
  deploymentTarget = "15.0",
): void {
  writeProjectSpec(root, bundleId, deploymentTarget);
  execFileSync("xcodegen", ["generate", "--spec", "ios/project.yml", "--project", "ios"], {
    cwd: root,
    stdio: "inherit",
  });
}

export function generateXcodeProjects(selected?: (typeof GAME_REGISTRY)[number]): void {
  const games = selected ? [selected] : GAME_REGISTRY;
  for (const game of games) {
    const root = appDirectory(game);
    generateXcodeProject(root, game.identity.iosBundleId, "15.0");
  }
}

if (import.meta.main) generateXcodeProjects();
