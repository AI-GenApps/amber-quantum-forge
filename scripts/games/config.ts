import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GAME_REGISTRY } from "./registry";
import type { GameCapability } from "./registry-types";
import { appDirectory, ROOT } from "./toolchain";

interface GameConfig {
  readonly id: string;
  readonly canonicalName: string;
  readonly publicTitle: string;
  readonly environment: "debug" | "staging" | "production";
  readonly productionId: string;
  readonly debugId: string;
  readonly activeId: string;
  readonly saveNamespace: string;
  readonly saveSchemaVersion: number;
  readonly analyticsNamespace: string;
  readonly entitlementsNamespace: string;
  readonly rulesPackage: string;
  readonly capabilities: {
    readonly specified: readonly string[];
    readonly implemented: readonly string[];
    readonly enabled: readonly string[];
  };
  readonly permissions: {
    readonly specified: readonly string[];
    readonly enabled: readonly string[];
  };
  readonly version: string;
  readonly buildNumber: number;
}

export type GameEnvironment = GameConfig["environment"];

export function parseEnvironment(value: string | undefined): GameEnvironment {
  if (value === "debug" || value === "staging" || value === "production") return value;
  throw new Error(`Unsupported environment: ${value ?? ""}`);
}

function configForGame(
  game: (typeof GAME_REGISTRY)[number],
  environment: GameEnvironment,
): GameConfig {
  const productionId = game.identity.iosBundleId;
  const debugId = `${productionId}${game.identity.debugSuffix}`;
  return {
    id: game.id,
    canonicalName: game.canonicalName,
    publicTitle: game.publicTitle,
    environment,
    productionId,
    debugId,
    activeId: activeIdForEnvironment(game, environment),
    saveNamespace: `${game.namespaces.save}.${environment}`,
    saveSchemaVersion: game.namespaces.saveSchemaVersion,
    analyticsNamespace: `${game.namespaces.analytics}.${environment}`,
    entitlementsNamespace: game.namespaces.entitlements,
    rulesPackage: game.paths.rulesPackage,
    capabilities: game.capabilities,
    permissions: game.permissions,
    version: game.release.version,
    buildNumber: game.release.buildNumber,
  };
}

export function activeIdForEnvironment(
  game: (typeof GAME_REGISTRY)[number],
  environment: GameEnvironment,
): string {
  if (environment === "debug") return game.identity.iosBundleId + game.identity.debugSuffix;
  if (environment === "staging") return `${game.identity.iosBundleId}.staging`;
  return game.identity.iosBundleId;
}

function validateNativeIds(game: (typeof GAME_REGISTRY)[number]): string[] {
  const errors: string[] = [];
  const root = appDirectory(game);
  const androidPath = join(root, "android/app/build.gradle.kts");
  if (!existsSync(androidPath)) {
    errors.push(`missing native Android project: ${androidPath}`);
  } else {
    const android = readFileSync(androidPath, "utf8");
    if (!android.includes(`applicationId = "${game.identity.androidApplicationId}"`))
      errors.push(`Android release ID is stale: ${game.id}`);
    const debugSuffixes = android.match(/applicationIdSuffix\s*=\s*"\.debug"/g) ?? [];
    if (debugSuffixes.length !== 2 || !android.includes('if (gameEnvironment == "debug")'))
      errors.push(`Android debug identity mapping is incomplete: ${game.id}`);
    const activityPath = join(
      root,
      "android/app/src/main/kotlin",
      `${game.identity.androidApplicationId.replaceAll(".", "/")}/MainActivity.kt`,
    );
    if (!existsSync(activityPath))
      errors.push(`Android MainActivity package path is stale: ${game.id}`);
    else if (
      !readFileSync(activityPath, "utf8").includes(`package ${game.identity.androidApplicationId}`)
    )
      errors.push(`Android MainActivity package is stale: ${game.id}`);
  }
  for (const [relativePath, expected] of [
    ["ios/Flutter/Debug.xcconfig", `${game.identity.iosBundleId}.debug`],
    ["ios/Flutter/Release.xcconfig", game.identity.iosBundleId],
  ] as const) {
    const path = join(root, relativePath);
    if (!existsSync(path)) errors.push(`missing native iOS config: ${path}`);
    else if (!readFileSync(path, "utf8").includes(`PRODUCT_BUNDLE_IDENTIFIER = ${expected}`))
      errors.push(`iOS ID is stale: ${game.id}/${relativePath}`);
  }
  errors.push(...validateOptionalNativeAccess(game, root));
  return errors;
}

const optionalDependencies: ReadonlyMap<string, GameCapability> = new Map([
  ["camera", "camera"],
  ["google_ml_kit", "camera"],
  ["image_picker", "camera"],
  ["permission_handler", "camera"],
  ["purchases_flutter", "billing"],
  ["in_app_purchase", "billing"],
  ["google_mobile_ads", "ads"],
  ["firebase_messaging", "notifications"],
  ["flutter_local_notifications", "notifications"],
  ["share_plus", "sharing"],
]);

const permissionFiles = new Map([
  ["camera", { android: "android.permission.CAMERA", ios: "NSCameraUsageDescription" }],
]);

const cameraFeatures = [
  "android.hardware.camera.any",
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
] as const;

function declaredDependencies(pubspec: string): Set<string> {
  const dependencies = new Set<string>();
  for (const match of pubspec.matchAll(/^ {2}([a-z0-9_]+):/gm)) dependencies.add(match[1]);
  return dependencies;
}

function androidFeatureTag(source: string, feature: string): string | undefined {
  const escaped = feature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(
    new RegExp(`<uses-feature\\b[^>]*android:name=["']${escaped}["'][^>]*>`),
  )?.[0];
}

function currentMergedAndroidManifests(root: string, sourcePath: string): string[] {
  const sourceMtime = statSync(sourcePath).mtimeMs;
  const candidates = [
    "build/app/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml",
    "build/app/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml",
    "build/app/intermediates/merged_manifests/debug/processDebugManifest/AndroidManifest.xml",
    "build/app/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml",
    "build/app/intermediates/packaged_manifests/debug/processDebugManifestForPackage/AndroidManifest.xml",
    "build/app/intermediates/packaged_manifests/release/processReleaseManifestForPackage/AndroidManifest.xml",
  ];
  return candidates
    .map((relativePath) => join(root, relativePath))
    .filter((path) => existsSync(path) && statSync(path).mtimeMs >= sourceMtime);
}

export function validateAndroidManifestFeatures(
  manifest: string,
  gameId: string,
  cameraEnabled: boolean,
): string[] {
  const errors: string[] = [];
  for (const feature of cameraFeatures) {
    const tag = androidFeatureTag(manifest, feature);
    if (cameraEnabled) {
      if (!tag) errors.push(`enabled camera feature ${feature} is missing in ${gameId}`);
      else if (!tag.includes('android:required="false"'))
        errors.push(`camera feature ${feature} must be optional in ${gameId}`);
    } else if (tag) {
      errors.push(`irrelevant camera feature ${feature} is declared in ${gameId}`);
    }
  }
  return errors;
}

function validateOptionalNativeAccess(
  game: (typeof GAME_REGISTRY)[number],
  root: string,
): string[] {
  const errors: string[] = [];
  const pubspec = readFileSync(join(root, "pubspec.yaml"), "utf8");
  const dependencies = declaredDependencies(pubspec);
  const enabled = new Set(game.capabilities.enabled);
  for (const [dependency, capability] of optionalDependencies) {
    if (dependencies.has(dependency) && !enabled.has(capability))
      errors.push(`irrelevant optional dependency ${dependency} is bundled in ${game.id}`);
  }
  const androidManifestPath = join(root, "android/app/src/main/AndroidManifest.xml");
  const androidManifest = existsSync(androidManifestPath)
    ? readFileSync(androidManifestPath, "utf8")
    : "";
  const infoPlistPath = join(root, "ios/Runner/Info.plist");
  const infoPlist = existsSync(infoPlistPath) ? readFileSync(infoPlistPath, "utf8") : "";
  for (const [permission, files] of permissionFiles) {
    const androidDeclared = androidManifest.includes(files.android);
    const iosDeclared = infoPlist.includes(`<key>${files.ios}</key>`);
    if ((androidDeclared || iosDeclared) && !game.permissions.enabled.includes(permission))
      errors.push(`irrelevant ${permission} permission is declared in ${game.id}`);
    if (game.permissions.enabled.includes(permission) && (!androidDeclared || !iosDeclared))
      errors.push(`enabled ${permission} permission is missing native declarations in ${game.id}`);
  }
  errors.push(...validateAndroidManifestFeatures(androidManifest, game.id, enabled.has("camera")));
  if (existsSync(androidManifestPath)) {
    for (const mergedPath of currentMergedAndroidManifests(root, androidManifestPath)) {
      errors.push(
        ...validateAndroidManifestFeatures(
          readFileSync(mergedPath, "utf8"),
          `${game.id} merged manifest`,
          enabled.has("camera"),
        ),
      );
    }
  }
  return errors;
}

export function writeGameConfigs(environment: GameEnvironment = "debug"): string[] {
  const written: string[] = [];
  for (const game of GAME_REGISTRY) {
    if (existsSync(join(appDirectory(game), "pubspec.yaml")))
      written.push(writeGameConfig(game, environment));
  }
  return written;
}

export function writeGameConfig(
  game: (typeof GAME_REGISTRY)[number],
  environment: GameEnvironment = "debug",
): string {
  const path = join(appDirectory(game), "game.config.json");
  writeFileSync(path, `${JSON.stringify(configForGame(game, environment), null, 2)}\n`);
  return path;
}

export function validateGameConfigs(environment: GameEnvironment = "debug"): string[] {
  const errors: string[] = [];
  for (const game of GAME_REGISTRY) {
    const path = join(appDirectory(game), "game.config.json");
    if (!existsSync(path)) {
      errors.push(`missing generated config: ${path}`);
      continue;
    }
    try {
      const actual = JSON.parse(readFileSync(path, "utf8")) as GameConfig;
      const expected = configForGame(game, environment);
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        errors.push(`generated config is stale: ${path}`);
      errors.push(...validateNativeIds(game));
    } catch (error) {
      errors.push(
        `invalid generated config ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return errors;
}

if (import.meta.main) {
  const paths = writeGameConfigs();
  console.log(`Generated ${paths.length} app configs under ${ROOT}/apps-native/games`);
}
