import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANDROID_DIR, APP_ID, IOS_APP_DIR, IOS_DIR } from "./paths";

const read = (path: string): string => readFileSync(path, "utf8");

describe("android project", () => {
  const manifest = read(join(ANDROID_DIR, "app/src/main/AndroidManifest.xml"));
  const gradle = read(join(ANDROID_DIR, "app/build.gradle"));

  it("exists with a main activity", () => {
    expect(existsSync(ANDROID_DIR)).toBe(true);
    expect(manifest).toContain('android:name=".MainActivity"');
    expect(
      existsSync(
        join(ANDROID_DIR, `app/src/main/java/${APP_ID.replaceAll(".", "/")}/MainActivity.java`),
      ),
    ).toBe(true);
  });

  it("locks the main activity to portrait", () => {
    const activity = manifest.slice(manifest.indexOf("<activity"), manifest.indexOf("</activity>"));
    expect(activity).toContain('android:screenOrientation="portrait"');
    expect(manifest).not.toMatch(/screenOrientation="(landscape|sensor|unspecified|fullSensor)/);
  });

  it("carries the namespace, application id, version and debug suffix", () => {
    expect(gradle).toContain(`namespace = "${APP_ID}"`);
    expect(gradle).toContain(`applicationId "${APP_ID}"`);
    expect(gradle).toContain("versionCode 1");
    expect(gradle).toContain('versionName "1.0.0"');
    expect(gradle).toMatch(/debug\s*\{\s*applicationIdSuffix "\.debug"/);
  });

  it("keeps the template SDK levels and declares no permissions", () => {
    const variables = read(join(ANDROID_DIR, "variables.gradle"));
    expect(variables).toMatch(/minSdkVersion = 24/);
    expect(variables).toMatch(/targetSdkVersion = 36/);
    expect(manifest).not.toContain("<uses-permission");
  });

  it("names the app", () => {
    const strings = read(join(ANDROID_DIR, "app/src/main/res/values/strings.xml"));
    expect(strings).toContain('<string name="app_name">Cloud Observatory</string>');
  });
});

describe("ios project", () => {
  const plist = read(join(IOS_APP_DIR, "Info.plist"));
  const project = read(join(IOS_DIR, "App/App.xcodeproj/project.pbxproj"));

  const orientations = (key: string): string[] => {
    const start = plist.indexOf(`<key>${key}</key>`);
    const block = plist.slice(start, plist.indexOf("</array>", start));
    return [...block.matchAll(/<string>(UIInterfaceOrientation\w+)<\/string>/g)].map(
      (m) => m[1] ?? "",
    );
  };

  it("exists", () => {
    expect(existsSync(join(IOS_DIR, "App/App.xcodeproj/project.pbxproj"))).toBe(true);
    expect(existsSync(join(IOS_DIR, "App/CapApp-SPM/Package.swift"))).toBe(true);
  });

  it("lists only portrait on iPhone and iPad", () => {
    expect(orientations("UISupportedInterfaceOrientations")).toEqual([
      "UIInterfaceOrientationPortrait",
    ]);
    expect(orientations("UISupportedInterfaceOrientations~ipad")).toEqual([
      "UIInterfaceOrientationPortrait",
    ]);
    expect(plist).not.toContain("Landscape");
    expect(plist).not.toContain("PortraitUpsideDown");
  });

  it("carries the bundle id, display name and version 1.0.0 build 1", () => {
    expect(plist).toMatch(/<key>CFBundleDisplayName<\/key>\s*<string>Cloud Observatory<\/string>/);
    const ids = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids)).toEqual(new Set([APP_ID]));
    const versions = [...project.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
    expect(new Set(versions)).toEqual(new Set(["1.0.0"]));
    const builds = [...project.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((m) => m[1]);
    expect(new Set(builds)).toEqual(new Set(["1"]));
  });
});

describe("capacitor config copies", () => {
  const copies = [
    join(ANDROID_DIR, "app/src/main/assets/capacitor.config.json"),
    join(IOS_APP_DIR, "capacitor.config.json"),
  ];

  it("never carry a server url", () => {
    for (const file of copies.filter((path) => existsSync(path))) {
      const config = JSON.parse(read(file)) as { appId?: string; server?: { url?: string } };
      expect(config.appId).toBe(APP_ID);
      expect(config.server?.url).toBeUndefined();
    }
  });

  it("is not set up for live reload in any committed native file", () => {
    for (const file of [
      join(ANDROID_DIR, "app/src/main/AndroidManifest.xml"),
      join(IOS_APP_DIR, "Info.plist"),
    ]) {
      expect(read(file)).not.toMatch(/cleartext|NSAllowsArbitraryLoads/i);
    }
  });
});
