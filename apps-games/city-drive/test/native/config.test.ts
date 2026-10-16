import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../capacitor.config";
import { GAME_TITLE } from "../../src/ui/brand";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(join(root, path), "utf8");

function walk(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "build" || name === "public") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

describe("capacitor config", () => {
  it("names the app, serves the bundled build and never a dev server", () => {
    expect(config.appId).toBe("app.w3dev.citydrive");
    expect(config.appName).toBe(GAME_TITLE);
    expect(config.webDir).toBe("dist");
    expect(config.server).toBeUndefined();
  });

  it("requires a modern WebView for WebGL2 and WebAssembly", () => {
    expect(config.android?.minWebViewVersion).toBeGreaterThanOrEqual(94);
    expect(config.android?.webContentsDebuggingEnabled).toBe(false);
  });
});

describe("package.json", () => {
  it("pins every Capacitor package exactly", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    const capacitor = Object.entries(all).filter(([name]) => name.includes("capacitor"));
    const names = capacitor.map(([name]) => name);
    for (const needed of [
      "@capacitor/core",
      "@capacitor/cli",
      "@capacitor/android",
      "@capacitor/ios",
      "@capacitor/app",
      "@capacitor/haptics",
      "@capacitor/preferences",
      "@capacitor/screen-orientation",
      "@capacitor/status-bar",
      "@capacitor-community/keep-awake",
    ]) {
      expect(names).toContain(needed);
    }
    for (const [name, version] of capacitor) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

describe("android project", () => {
  it("is landscape only", () => {
    expect(read("android/app/src/main/AndroidManifest.xml")).toContain(
      'android:screenOrientation="sensorLandscape"',
    );
  });

  it("targets SDK 36 from SDK 24 and suffixes the debug id", () => {
    const variables = read("android/variables.gradle");
    expect(variables).toMatch(/minSdkVersion = 24/);
    expect(variables).toMatch(/targetSdkVersion = 36/);
    const gradle = read("android/app/build.gradle");
    expect(gradle).toMatch(/applicationId "app\.w3dev\.citydrive"/);
    expect(gradle).toMatch(/debug \{[^}]*applicationIdSuffix "\.debug"/s);
  });
});

describe("ios project", () => {
  it("allows landscape left and right only", () => {
    const plist = read("ios/App/App/Info.plist");
    for (const key of [
      "UISupportedInterfaceOrientations",
      "UISupportedInterfaceOrientations~ipad",
    ]) {
      const block = plist.split(`<key>${key}</key>`)[1]?.split("</array>")[0] ?? "";
      expect(block, key).toContain("UIInterfaceOrientationLandscapeLeft");
      expect(block, key).toContain("UIInterfaceOrientationLandscapeRight");
      expect(block, key).not.toContain("Portrait");
    }
  });

  it("deploys to iOS 15, which Rapier compat and Babylon WebGL2 run on", () => {
    expect(read("ios/App/CapApp-SPM/Package.swift")).toContain(".iOS(.v15)");
  });
});

describe("secrets", () => {
  it("keeps keystores and signing config out of the native projects", () => {
    const files = [...walk(join(root, "android")), ...walk(join(root, "ios"))];
    const banned = files.filter((file) =>
      /\.(jks|keystore|p12|p8|mobileprovision|cer)$|keystore\.properties$|google-services\.json$/.test(
        file,
      ),
    );
    expect(banned).toEqual([]);
    expect(read("android/app/build.gradle")).not.toMatch(
      /signingConfigs|storePassword|keyPassword/,
    );
  });
});
