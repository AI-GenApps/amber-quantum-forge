import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { GAME_REGISTRY } from "./registry";
import { appDirectory } from "./toolchain";

const ENVIRONMENT_DECLARATION = `val gameEnvironment = project.findProperty("gameEnvironment")?.toString() ?: "debug"
if (gameEnvironment !in setOf("debug", "staging", "production")) throw GradleException("Unsupported gameEnvironment: $gameEnvironment")
val androidKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
val androidKeystoreAlias = System.getenv("ANDROID_KEY_ALIAS")
val androidKeystorePassword = System.getenv("ANDROID_KEY_PASSWORD")
val androidStorePassword = System.getenv("ANDROID_STORE_PASSWORD")
`;

const SIGNING_CONFIG = `    signingConfigs {
        if (gameEnvironment == "production") {
            val keystorePath = androidKeystorePath ?: throw GradleException("ANDROID_KEYSTORE_PATH is required for production builds")
            val keyAlias = androidKeystoreAlias ?: throw GradleException("ANDROID_KEY_ALIAS is required for production builds")
            val keyPassword = androidKeystorePassword ?: throw GradleException("ANDROID_KEY_PASSWORD is required for production builds")
            val storePassword = androidStorePassword ?: throw GradleException("ANDROID_STORE_PASSWORD is required for production builds")
            create("gamesRelease") {
                storeFile = file(keystorePath)
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
                this.storePassword = storePassword
            }
        }
    }

`;

const BUILD_TYPES = `    buildTypes {
        debug {
            if (gameEnvironment == "staging") {
                applicationIdSuffix = ".staging"
            } else {
                applicationIdSuffix = ".debug"
            }
        }
        release {
            if (gameEnvironment == "debug") {
                applicationIdSuffix = ".debug"
                signingConfig = signingConfigs.getByName("debug")
            } else if (gameEnvironment == "staging") {
                applicationIdSuffix = ".staging"
                signingConfig = signingConfigs.getByName("debug")
            } else {
                signingConfig = signingConfigs.getByName("gamesRelease")
            }
        }
    }
`;

function replaceEnvironmentDeclaration(source: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.startsWith("val gameEnvironment ="));
  if (start === -1)
    return source.replace(/}\n\nandroid \{/, `}\n\n${ENVIRONMENT_DECLARATION}\nandroid {`);
  let end = start;
  while (end + 1 < lines.length) {
    const next = lines[end + 1];
    if (
      next.startsWith("if (gameEnvironment") ||
      next.startsWith("val androidKeystorePath") ||
      next.startsWith("val androidKeystoreAlias") ||
      next.startsWith("val androidKeystorePassword") ||
      next.startsWith("val androidStorePassword")
    ) {
      end += 1;
      continue;
    }
    break;
  }
  return [
    ...lines.slice(0, start),
    ENVIRONMENT_DECLARATION.trimEnd(),
    ...lines.slice(end + 1),
  ].join("\n");
}

export function configureAndroid(root: string, productionId: string): void {
  const path = join(root, "android/app/build.gradle.kts");
  if (!existsSync(path)) throw new Error(`Missing Android build file: ${path}`);
  const source = readFileSync(path, "utf8");
  if (!/namespace\s*=\s*"[^"]+"/.test(source) || !/applicationId\s*=\s*"[^"]+"/.test(source)) {
    throw new Error(`Android identity was not found: ${path}`);
  }
  const withEnvironment = replaceEnvironmentDeclaration(source);
  const namespaced = withEnvironment.replace(
    /namespace\s*=\s*"[^"]+"/,
    `namespace = "${productionId}"`,
  );
  const withApplicationId = namespaced.replace(
    /applicationId\s*=\s*"[^"]+"/,
    `applicationId = "${productionId}"`,
  );
  const buildTypesPattern = / {4}buildTypes \{[\s\S]*?\n {4}\}\n(?=\})/;
  if (!buildTypesPattern.test(withApplicationId))
    throw new Error(`Android release build type was not found: ${path}`);
  const withBuildTypes = withApplicationId.replace(buildTypesPattern, BUILD_TYPES);
  const signingPattern = / {4}signingConfigs \{[\s\S]*?\n {4}\}\n\n {4}defaultConfig \{/;
  const withSigningConfig = signingPattern.test(withBuildTypes)
    ? withBuildTypes.replace(signingPattern, `${SIGNING_CONFIG}    defaultConfig {`)
    : withBuildTypes.replace(/ {4}defaultConfig \{/, `${SIGNING_CONFIG}    defaultConfig {`);
  if (!/ {4}signingConfigs \{[\s\S]*?\n {4}\}\n\n {4}defaultConfig \{/.test(withSigningConfig))
    throw new Error(`Android signing config insertion failed: ${path}`);
  const withoutTemplateNotes = withSigningConfig
    .replace(/^ {8}\/\/ TODO: Specify your own unique Application ID.*\n/m, "")
    .replace(/^ {8}\/\/ For more information:.*\n/m, "")
    .replace(/^ {12}\/\/ TODO: Add your own signing config.*\n/m, "")
    .replace(/^ {12}\/\/ Signing with the debug keys for now.*\n/m, "");
  writeFileSync(path, withoutTemplateNotes);
}

function configureAndroidActivity(root: string, gameId: string, productionId: string): void {
  const oldPath = join(root, "android/app/src/main/kotlin", "app/w3dev", gameId, "MainActivity.kt");
  const newPath = join(
    root,
    "android/app/src/main/kotlin",
    `${productionId.replaceAll(".", "/")}/MainActivity.kt`,
  );
  const sourcePath = existsSync(newPath) ? newPath : oldPath;
  if (!existsSync(sourcePath)) throw new Error(`Missing Android MainActivity: ${root}`);
  const source = readFileSync(sourcePath, "utf8");
  const updated = source.replace(/^package .+$/m, `package ${productionId}`);
  mkdirSync(dirname(newPath), { recursive: true });
  writeFileSync(newPath, updated);
  if (sourcePath !== newPath) unlinkSync(sourcePath);
}

function configureIos(root: string, productionId: string): void {
  const configs: [string, string][] = [
    ["ios/Flutter/Debug.xcconfig", `${productionId}.debug`],
    ["ios/Flutter/Release.xcconfig", productionId],
  ];
  for (const [relativePath, bundleId] of configs) {
    const path = join(root, relativePath);
    if (!existsSync(path)) throw new Error(`Missing iOS config: ${path}`);
    const source = readFileSync(path, "utf8");
    const line = `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId}`;
    const updated = source.includes("PRODUCT_BUNDLE_IDENTIFIER =")
      ? source.replace(/^PRODUCT_BUNDLE_IDENTIFIER\s*=.*$/m, line)
      : `${source.trimEnd()}\n${line}\n`;
    writeFileSync(path, updated);
  }
}

function configureIosPodfile(root: string): void {
  const path = join(root, "ios/Podfile");
  if (!existsSync(path)) return;
  const source = readFileSync(path, "utf8");
  const platform = "platform :ios, '15.0'";
  const platformPattern = /^# platform :ios, '[^']+'$/m;
  const updated = platformPattern.test(source)
    ? source.replace(platformPattern, platform)
    : source.includes("platform :ios")
      ? source.replace(/^platform :ios.*$/m, platform)
      : `${platform}\n\n${source}`;
  writeFileSync(path, updated);
}

export function prepareNativeProjects(): void {
  for (const game of GAME_REGISTRY) {
    const root = appDirectory(game);
    if (!existsSync(join(root, "pubspec.yaml"))) throw new Error(`Missing app pubspec: ${root}`);
    configureAndroid(root, game.identity.androidApplicationId);
    configureAndroidActivity(root, game.id, game.identity.androidApplicationId);
    configureIos(root, game.identity.iosBundleId);
    configureIosPodfile(root);
  }
  console.log(`Configured native identities for ${GAME_REGISTRY.length} games.`);
}

if (import.meta.main) prepareNativeProjects();
