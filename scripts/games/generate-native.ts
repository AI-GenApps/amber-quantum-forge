import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function writeRuntimeShell(root: string): void {
  const main = `import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final config = await GameConfig.load();
  runApp(GameShell(config: config));
}

final class GameConfig {
  const GameConfig({
    required this.id,
    required this.title,
    required this.environment,
    required this.activeId,
    required this.saveNamespace,
    required this.analyticsNamespace,
  });

  final String id;
  final String title;
  final String environment;
  final String activeId;
  final String saveNamespace;
  final String analyticsNamespace;

  static Future<GameConfig> load() async {
    final raw = await rootBundle.loadString('game.config.json');
    final decoded = jsonDecode(raw);
    if (decoded is! Map) throw const FormatException('game.config.json must be an object');
    final values = Map<String, Object?>.from(decoded);
    final id = values['id'];
    final title = values['title'];
    final environment = values['environment'];
    final activeId = values['activeId'];
    final saveNamespace = values['saveNamespace'];
    final analyticsNamespace = values['analyticsNamespace'];
    if (id is! String || title is! String || environment is! String || activeId is! String || saveNamespace is! String || analyticsNamespace is! String) {
      throw const FormatException('game.config.json identity is invalid');
    }
    return GameConfig(
      id: id,
      title: title,
      environment: environment,
      activeId: activeId,
      saveNamespace: saveNamespace,
      analyticsNamespace: analyticsNamespace,
    );
  }
}

final class GameShell extends StatelessWidget {
  const GameShell({required this.config, super.key});

  final GameConfig config;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: config.title,
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
      home: Scaffold(
        appBar: AppBar(title: Text(config.title)),
        body: Center(
          child: Text('\${config.id} · \${config.environment} · \${config.saveNamespace}'),
        ),
      ),
    );
  }
}
`;
  writeFileSync(resolve(root, "lib/main.dart"), main);
}

export function writeRuntimeTest(root: string, id: string, title: string): void {
  const identifier = `app.w3dev.${id.replaceAll("_", "")}.debug`;
  const escapedTitle = escapeDartString(title);
  const test = `import 'package:flutter_test/flutter_test.dart';
import 'package:${id}/main.dart';

void main() {
  testWidgets('generated shell renders its isolated config', (tester) async {
    const config = GameConfig(
      id: '${id}',
      title: '${escapedTitle}',
      environment: 'debug',
      activeId: '${identifier}',
      saveNamespace: 'games.${id}.debug',
      analyticsNamespace: 'game.${id}.debug',
    );
    await tester.pumpWidget(GameShell(config: config));
    expect(find.text('${escapedTitle}'), findsWidgets);
    expect(find.text('${id} · debug · games.${id}.debug'), findsOneWidget);
  });
}
`;
  writeFileSync(resolve(root, "test/widget_test.dart"), test);
}

function escapeDartString(value: string): string {
  let escaped = "";
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (character === "\\") escaped += "\\\\";
    else if (character === "'") escaped += "\\'";
    else if (character === "$") escaped += "\\$";
    else if (character === "\n") escaped += "\\n";
    else if (character === "\r") escaped += "\\r";
    else if (character === "\t") escaped += "\\t";
    else if (code < 0x20 || code === 0x7f) escaped += `\\u{${code.toString(16)}}`;
    else escaped += character;
  }
  return escaped;
}

export function addConfigAsset(root: string): void {
  const path = resolve(root, "pubspec.yaml");
  const pubspec = readFileSync(path, "utf8");
  if (!/^flutter:\s*$/m.test(pubspec)) throw new Error("Generated pubspec has no Flutter section");
  const updated = pubspec.replace(/^flutter:\s*$/m, "flutter:\n  assets:\n    - game.config.json");
  writeFileSync(path, updated);
}

export function configureAndroid(root: string, applicationId: string, id: string): void {
  const path = resolve(root, "android/app/build.gradle.kts");
  if (!existsSync(path)) throw new Error("Generated Android Kotlin build file is missing");
  const source = readFileSync(path, "utf8");
  const environmentDeclaration =
    'val gameEnvironment = project.findProperty("gameEnvironment")?.toString() ?: "debug"\n' +
    'if (gameEnvironment !in setOf("debug", "staging", "production")) throw GradleException("Unsupported gameEnvironment: $gameEnvironment")\n' +
    'val androidKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")\n' +
    'val androidKeystoreAlias = System.getenv("ANDROID_KEY_ALIAS")\n' +
    'val androidKeystorePassword = System.getenv("ANDROID_KEY_PASSWORD")\n' +
    'val androidStorePassword = System.getenv("ANDROID_STORE_PASSWORD")\n';
  const withEnvironment = source.replace(
    /}\n\nandroid \{/,
    `}\n\n${environmentDeclaration}\nandroid {`,
  );
  const withNamespace = withEnvironment.replace(
    /namespace\s*=\s*"[^"]+"/,
    `namespace = "${applicationId}"`,
  );
  const withApplicationId = withNamespace.replace(
    /applicationId\s*=\s*"[^"]+"/,
    `applicationId = "${applicationId}"`,
  );
  if (withApplicationId === source)
    throw new Error("Generated Android application ID was not found");
  const buildTypesPattern = / {4}buildTypes \{\n {8}release \{[\s\S]*? {8}\}\n {4}\}/;
  if (!buildTypesPattern.test(withApplicationId))
    throw new Error("Generated Android build types were not found");
  const withBuildTypes = withApplicationId.replace(
    buildTypesPattern,
    "    buildTypes {\n" +
      "        debug {\n" +
      '            if (gameEnvironment == "staging") {\n' +
      '                applicationIdSuffix = ".staging"\n' +
      "            } else {\n" +
      '                applicationIdSuffix = ".debug"\n' +
      "            }\n" +
      "        }\n" +
      "        release {\n" +
      '            if (gameEnvironment == "debug") {\n' +
      '                applicationIdSuffix = ".debug"\n' +
      '                signingConfig = signingConfigs.getByName("debug")\n' +
      '            } else if (gameEnvironment == "staging") {\n' +
      '                applicationIdSuffix = ".staging"\n' +
      '                signingConfig = signingConfigs.getByName("debug")\n' +
      "            } else {\n" +
      '                signingConfig = signingConfigs.getByName("gamesRelease")\n' +
      "            }\n" +
      "        }\n" +
      "    }",
  );
  const signingConfigPattern = / {4}defaultConfig \{/;
  if (!signingConfigPattern.test(withBuildTypes))
    throw new Error("Generated Android default config was not found");
  const updated = withBuildTypes.replace(
    signingConfigPattern,
    "    signingConfigs {\n" +
      '        if (gameEnvironment == "production") {\n' +
      '            val keystorePath = androidKeystorePath ?: throw GradleException("ANDROID_KEYSTORE_PATH is required for production builds")\n' +
      '            val keyAlias = androidKeystoreAlias ?: throw GradleException("ANDROID_KEY_ALIAS is required for production builds")\n' +
      '            val keyPassword = androidKeystorePassword ?: throw GradleException("ANDROID_KEY_PASSWORD is required for production builds")\n' +
      '            val storePassword = androidStorePassword ?: throw GradleException("ANDROID_STORE_PASSWORD is required for production builds")\n' +
      '            create("gamesRelease") {\n' +
      "                storeFile = file(keystorePath)\n" +
      "                this.keyAlias = keyAlias\n" +
      "                this.keyPassword = keyPassword\n" +
      "                this.storePassword = storePassword\n" +
      "            }\n" +
      "        }\n" +
      "    }\n\n" +
      "    defaultConfig {",
  );
  writeFileSync(path, updated);
  const oldActivity = resolve(
    root,
    "android/app/src/main/kotlin",
    "app/w3dev",
    id,
    "MainActivity.kt",
  );
  const newActivity = resolve(
    root,
    "android/app/src/main/kotlin",
    applicationId.replaceAll(".", "/"),
    "MainActivity.kt",
  );
  if (!existsSync(oldActivity)) throw new Error("Generated Android MainActivity was not found");
  const activity = readFileSync(oldActivity, "utf8").replace(
    /^package .+$/m,
    `package ${applicationId}`,
  );
  mkdirSync(dirname(newActivity), { recursive: true });
  writeFileSync(newActivity, activity);
  if (oldActivity !== newActivity) unlinkSync(oldActivity);
}
export function configureIos(root: string, productionId: string, debugId: string): void {
  for (const [relativePath, bundleId] of [
    ["ios/Flutter/Debug.xcconfig", debugId],
    ["ios/Flutter/Release.xcconfig", productionId],
  ] as const) {
    const path = resolve(root, relativePath);
    if (!existsSync(path)) throw new Error(`Generated iOS config is missing: ${relativePath}`);
    const source = readFileSync(path, "utf8");
    const line = `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId}`;
    const updated = source.includes("PRODUCT_BUNDLE_IDENTIFIER =")
      ? source.replace(/^PRODUCT_BUNDLE_IDENTIFIER\s*=.*$/m, line)
      : `${source.trimEnd()}\n${line}\n`;
    writeFileSync(path, updated);
  }
}
