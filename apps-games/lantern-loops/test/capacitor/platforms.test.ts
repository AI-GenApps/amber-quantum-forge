import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_TITLE } from "../../src/brand";
import { ANDROID_DIR, ANDROID_RES, APP_DIR, IOS_APP, IOS_DIR, read } from "./files";

const APP_ID = "app.w3dev.lanternloops";

function plistArray(plist: string, key: string): string[] {
  const match = new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`).exec(plist);
  if (match === null) throw new Error(`Info.plist has no ${key}`);
  return [...(match[1] ?? "").matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1] ?? "");
}

describe("capacitor platform projects exist", () => {
  it("has the Capacitor 8 android structure", () => {
    for (const path of [
      "build.gradle",
      "settings.gradle",
      "variables.gradle",
      "capacitor.settings.gradle",
      "app/build.gradle",
      "app/src/main/AndroidManifest.xml",
      "app/src/main/java/app/w3dev/lanternloops/MainActivity.java",
    ]) {
      expect(existsSync(join(ANDROID_DIR, path)), path).toBe(true);
    }
  });

  it("has the Capacitor 8 ios structure with Swift Package Manager", () => {
    for (const path of [
      "App/App.xcodeproj/project.pbxproj",
      "App/App/Info.plist",
      "App/App/AppDelegate.swift",
      "App/CapApp-SPM/Package.swift",
    ]) {
      expect(existsSync(join(IOS_DIR, path)), path).toBe(true);
    }
    expect(existsSync(join(IOS_DIR, "App/Podfile"))).toBe(false);
  });
});

describe("android identity and version", () => {
  const gradle = read(ANDROID_DIR, "app/build.gradle");

  it("uses the app id as namespace and applicationId", () => {
    expect(gradle).toContain(`namespace = "${APP_ID}"`);
    expect(gradle).toContain(`applicationId "${APP_ID}"`);
  });

  it("is version 0.1.0 (code 1)", () => {
    expect(gradle).toContain('versionName "0.1.0"');
    expect(gradle).toContain("versionCode 1\n");
  });

  it("names the app in strings.xml", () => {
    const strings = read(ANDROID_RES, "values/strings.xml");
    expect(strings).toContain(`<string name="app_name">${GAME_TITLE}</string>`);
    expect(strings).toContain(`<string name="title_activity_main">${GAME_TITLE}</string>`);
    expect(strings).toContain(`<string name="package_name">${APP_ID}</string>`);
  });

  it("keeps the activity class in the app id package", () => {
    const activity = read(
      ANDROID_DIR,
      "app/src/main/java/app/w3dev/lanternloops/MainActivity.java",
    );
    expect(activity).toContain(`package ${APP_ID};`);
  });
});

describe("android manifest", () => {
  const manifest = read(ANDROID_DIR, "app/src/main/AndroidManifest.xml");

  it("locks the main activity to portrait", () => {
    const activity = /<activity[\s\S]*?>/.exec(manifest)?.[0] ?? "";
    expect(activity).toContain('android:name=".MainActivity"');
    expect(activity).toContain('android:screenOrientation="portrait"');
    expect(manifest).not.toMatch(/landscape/i);
  });

  it("keeps Capacitor's default permissions (INTERNET only, open question Q6)", () => {
    const permissions = [...manifest.matchAll(/<uses-permission android:name="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(permissions).toEqual(["android.permission.INTERNET"]);
  });

  it("uses the launcher icons", () => {
    expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
    expect(manifest).toContain('android:roundIcon="@mipmap/ic_launcher_round"');
  });

  it("paints the launch theme, status bar and adaptive icon background indigo", () => {
    const styles = read(ANDROID_RES, "values/styles.xml");
    expect(styles).toContain('<item name="android:statusBarColor">#12132E</item>');
    expect(styles).toContain('<item name="android:windowBackground">#12132E</item>');
    expect(read(ANDROID_RES, "values/ic_launcher_background.xml")).toContain("#12132E");
  });
});

describe("ios identity, version and orientation", () => {
  const plist = read(IOS_APP, "Info.plist");
  const project = read(IOS_DIR, "App/App.xcodeproj/project.pbxproj");

  it("uses the app id as bundle identifier in every configuration", () => {
    const ids = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) expect(id).toBe(APP_ID);
    expect(plist).toContain("<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>");
  });

  it("is marketing version 0.1.0, build 1", () => {
    const marketing = [...project.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
    const build = [...project.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((m) => m[1]);
    expect(marketing.length).toBeGreaterThanOrEqual(2);
    expect(new Set(marketing)).toEqual(new Set(["0.1.0"]));
    expect(new Set(build)).toEqual(new Set(["1"]));
    expect(plist).toContain("<string>$(MARKETING_VERSION)</string>");
    expect(plist).toContain("<string>$(CURRENT_PROJECT_VERSION)</string>");
  });

  it("shows the game title as the display name", () => {
    expect(plist).toMatch(
      new RegExp(`<key>CFBundleDisplayName</key>\\s*<string>${GAME_TITLE}</string>`),
    );
  });

  it("lists only portrait for iPhone and iPad", () => {
    expect(plistArray(plist, "UISupportedInterfaceOrientations")).toEqual([
      "UIInterfaceOrientationPortrait",
    ]);
    expect(plistArray(plist, "UISupportedInterfaceOrientations~ipad")).toEqual([
      "UIInterfaceOrientationPortrait",
    ]);
    expect(plist).toMatch(/<key>UIRequiresFullScreen<\/key>\s*<true\/>/);
  });

  it("paints the launch screen indigo", () => {
    const storyboard = read(IOS_APP, "Base.lproj/LaunchScreen.storyboard");
    expect(storyboard).toContain('red="0.070588235294117646" green="0.074509803921568626"');
  });
});

describe("capacitor config source", () => {
  const source = read(APP_DIR, "capacitor.config.ts");

  it("has no server.url and the indigo background", () => {
    expect(source).not.toMatch(/\bserver\s*:/);
    expect(source).not.toMatch(/\burl\s*:/);
    expect(source).toContain('backgroundColor: "#12132E"');
  });
});
