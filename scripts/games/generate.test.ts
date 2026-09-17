import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateGame, validateGenerated } from "./generate";
import { writeRuntimeTest } from "./generate-native";
import { validateGenerateOptions } from "./generate-types";

test("generic generator keeps debug and production native identities separate", () => {
  const parent = mkdtempSync(join(tmpdir(), "gaming-generator-"));
  const output = join(parent, "generated_sixth");
  try {
    generateGame({ id: "generated_sixth", title: "Generated Sixth", output });
    expect(validateGenerated(output)).toEqual([]);

    const config = JSON.parse(readFileSync(join(output, "game.config.json"), "utf8")) as Record<
      string,
      string
    >;
    expect(config.productionId).toBe("app.w3dev.generatedsixth");
    expect(config.debugId).toBe("app.w3dev.generatedsixth.debug");
    expect(config.activeId).toBe(config.debugId);
    expect(readFileSync(join(output, "ios/Flutter/Debug.xcconfig"), "utf8")).toContain(
      "PRODUCT_BUNDLE_IDENTIFIER = app.w3dev.generatedsixth.debug",
    );
    expect(readFileSync(join(output, "ios/Flutter/Release.xcconfig"), "utf8")).toContain(
      "PRODUCT_BUNDLE_IDENTIFIER = app.w3dev.generatedsixth",
    );
    expect(
      existsSync(
        join(output, "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png"),
      ),
    ).toBeTrue();
    expect(
      existsSync(join(output, "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml")),
    ).toBeTrue();
    expect(
      readFileSync(join(output, "android/app/src/main/AndroidManifest.xml"), "utf8"),
    ).toContain('android:label="Generated Sixth"');
    const androidBuild = readFileSync(join(output, "android/app/build.gradle.kts"), "utf8");
    expect(androidBuild).toContain('?: "debug"');
    expect(androidBuild).toContain('setOf("debug", "staging", "production")');
    expect(androidBuild).toContain('applicationIdSuffix = ".staging"');
    expect(androidBuild).toContain("ANDROID_KEYSTORE_PATH is required for production builds");
    expect(readFileSync(join(output, "pubspec.yaml"), "utf8")).not.toContain("camera:");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("generic generator rejects normalized identity collisions", () => {
  const parent = mkdtempSync(join(tmpdir(), "gaming-generator-collision-"));
  try {
    expect(() =>
      validateGenerateOptions({
        id: "merge__relay",
        title: "Collision",
        output: join(parent, "generated_collision"),
      }),
    ).toThrow("app.w3dev.mergerelay");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("generic generator serializes hostile Dart title text", () => {
  const parent = mkdtempSync(join(tmpdir(), "gaming-generator-text-"));
  mkdirSync(join(parent, "test"));
  try {
    writeRuntimeTest(parent, "generated_text", "Dollar $bad \\ quote\nLine '");
    const source = readFileSync(join(parent, "test/widget_test.dart"), "utf8");
    expect(source).toContain("\\$bad");
    expect(source).toContain("\\\\ quote");
    expect(source).toContain("\\nLine");
    expect(source).toContain("\\'");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
