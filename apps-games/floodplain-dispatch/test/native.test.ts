import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../capacitor.config";
import { GAME_TITLE } from "../src/brand";

const APP_DIR = join(import.meta.dirname, "..");
const APP_ID = "app.w3dev.floodplaindispatch";
const NIGHT = "#18231d";
const PLUGINS = ["app", "haptics", "preferences", "screen-orientation", "share", "status-bar"];

function read(path: string): string {
  return readFileSync(join(APP_DIR, path), "utf8");
}

function git(...args: string[]): string {
  const result = spawnSync("git", args, { cwd: APP_DIR, encoding: "utf8" });
  return result.stdout;
}

function pluginsInPackageJson(): string[] {
  const pkg = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
  return Object.keys(pkg.dependencies)
    .filter((name) => name.startsWith("@capacitor/"))
    .map((name) => name.slice("@capacitor/".length))
    .filter((name) => !["android", "ios", "core"].includes(name))
    .sort();
}

function plistArray(plist: string, key: string): string[] {
  const match = new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`).exec(plist);
  expect(match, `${key} present`).not.toBeNull();
  return [...(match?.[1] ?? "").matchAll(/<string>([^<]+)<\/string>/g)].map((m) => m[1] ?? "");
}

describe("android project", () => {
  const gradle = read("android/app/build.gradle");
  const manifest = read("android/app/src/main/AndroidManifest.xml");
  const strings = read("android/app/src/main/res/values/strings.xml");

  it("uses the app id for namespace and application id", () => {
    expect(gradle).toContain(`namespace = "${APP_ID}"`);
    expect(gradle).toContain(`applicationId "${APP_ID}"`);
    expect(
      existsSync(join(APP_DIR, `android/app/src/main/java/${APP_ID.replaceAll(".", "/")}`)),
    ).toBe(true);
  });

  it("names the app with the working title", () => {
    expect(strings).toContain(`<string name="app_name">${GAME_TITLE}</string>`);
    expect(strings).toContain(`<string name="title_activity_main">${GAME_TITLE}</string>`);
  });

  it("locks the activity to portrait", () => {
    expect(manifest).toContain('android:screenOrientation="portrait"');
    expect(manifest).not.toMatch(/screenOrientation="(?!portrait)/);
  });

  it("records the backup decision and never allows cleartext traffic", () => {
    expect(manifest).toContain('android:allowBackup="true"');
    expect(manifest).not.toContain("usesCleartextTraffic");
    expect(manifest).toContain("android.permission.INTERNET");
    const permissions = [...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)];
    expect(permissions.map((m) => m[1])).toEqual(["android.permission.INTERNET"]);
  });

  it("ships launcher icons at every density and a splash drawable", () => {
    const res = join(APP_DIR, "android/app/src/main/res");
    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      for (const name of ["ic_launcher", "ic_launcher_round", "ic_launcher_foreground"]) {
        expect(existsSync(join(res, `mipmap-${density}/${name}.png`)), `${name} ${density}`).toBe(
          true,
        );
      }
    }
    expect(existsSync(join(res, "mipmap-anydpi-v26/ic_launcher.xml"))).toBe(true);
    expect(existsSync(join(res, "drawable/splash.png"))).toBe(true);
    expect(existsSync(join(res, "drawable-port-xxxhdpi/splash.png"))).toBe(true);
    expect(existsSync(join(res, "drawable-night/splash.png"))).toBe(true);
  });

  it("registers exactly the six plugins from package.json", () => {
    const settings = read("android/capacitor.settings.gradle");
    const included = [...settings.matchAll(/include ':capacitor-([a-z-]+)'/g)]
      .map((m) => m[1] ?? "")
      .filter((name) => name !== "android")
      .sort();
    expect(included).toEqual(PLUGINS);
    expect(included).toEqual(pluginsInPackageJson());
  });

  it("matches the generated plugin registry when it has been synced", () => {
    const path = join(APP_DIR, "android/app/src/main/assets/capacitor.plugins.json");
    if (!existsSync(path)) return;
    const entries = JSON.parse(readFileSync(path, "utf8")) as { pkg: string }[];
    expect(entries.map((e) => e.pkg.replace("@capacitor/", "")).sort()).toEqual(PLUGINS);
  });
});

describe("ios project", () => {
  const plist = read("ios/App/App/Info.plist");
  const project = read("ios/App/App.xcodeproj/project.pbxproj");

  it("uses the app id as the bundle identifier", () => {
    const ids = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids)).toEqual(new Set([APP_ID]));
  });

  it("uses the working title as the display name", () => {
    expect(plist).toMatch(
      new RegExp(`<key>CFBundleDisplayName</key>\\s*<string>${GAME_TITLE}</string>`),
    );
  });

  it("supports portrait only on iPhone and iPad", () => {
    expect(plistArray(plist, "UISupportedInterfaceOrientations")).toEqual([
      "UIInterfaceOrientationPortrait",
    ]);
    expect(plistArray(plist, "UISupportedInterfaceOrientations~ipad")).toEqual([
      "UIInterfaceOrientationPortrait",
    ]);
  });

  it("uses a light status bar over the night colour", () => {
    expect(plist).toContain("UIStatusBarStyleLightContent");
    expect(read("ios/App/App/Base.lproj/LaunchScreen.storyboard")).toContain('red="0.0941');
  });

  it("has the 1024 marketing icon and the splash image set", () => {
    const icons = join(APP_DIR, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
    const contents = JSON.parse(readFileSync(join(icons, "Contents.json"), "utf8")) as {
      images: { size: string; filename: string }[];
    };
    expect(contents.images.some((i) => i.size === "1024x1024")).toBe(true);
    expect(existsSync(join(icons, "AppIcon-512@2x.png"))).toBe(true);
    const splash = join(APP_DIR, "ios/App/App/Assets.xcassets/Splash.imageset");
    expect(readdirSync(splash).filter((f) => f.endsWith(".png"))).toHaveLength(6);
    expect(read("ios/App/App/Base.lproj/LaunchScreen.storyboard")).toContain('image="Splash"');
  });

  it("links exactly the six plugins through the Swift package", () => {
    const manifest = read("ios/App/CapApp-SPM/Package.swift");
    const linked = [...manifest.matchAll(/\.product\(name: "Capacitor([A-Za-z]+)"/g)]
      .map((m) => m[1] ?? "")
      .map((name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase())
      .sort();
    expect(linked).toEqual(PLUGINS);
  });
});

describe("capacitor config copies", () => {
  it("states the identity and no server url", () => {
    expect(config.appId).toBe(APP_ID);
    expect(config.server).toBeUndefined();
    expect(config.backgroundColor).toBe(NIGHT);
    expect(config.plugins?.StatusBar).toEqual({ style: "DARK", backgroundColor: NIGHT });
  });

  it("matches the synced android and ios copies when present", () => {
    for (const path of [
      "android/app/src/main/assets/capacitor.config.json",
      "ios/App/App/capacitor.config.json",
    ]) {
      if (!existsSync(join(APP_DIR, path))) continue;
      const copy = JSON.parse(read(path)) as Record<string, unknown>;
      expect(copy.appId).toBe(config.appId);
      expect(copy.appName).toBe(config.appName);
      expect(copy.webDir).toBe(config.webDir);
      expect(copy.backgroundColor).toBe(config.backgroundColor);
      expect(copy.plugins).toEqual(config.plugins);
      expect(copy.server).toBeUndefined();
    }
  });
});

describe("viewport and theme colour", () => {
  it("agrees with index.html", () => {
    const html = read("index.html");
    expect(html).toContain("viewport-fit=cover");
    expect(html).toContain(`<meta name="theme-color" content="${NIGHT}" />`);
    expect(html).toContain(`<title>${GAME_TITLE}</title>`);
  });
});

describe("git hygiene", () => {
  const files = git("ls-files", "--cached", "--others", "--exclude-standard", ".").split("\n");

  it("ignores build outputs", () => {
    for (const path of [
      "dist",
      "android/.gradle",
      "android/local.properties",
      "android/app/build",
      "android/app/src/main/assets/public",
      "ios/App/App/public",
      "ios/App/build",
      "node_modules/.cache",
    ]) {
      const result = spawnSync("git", ["check-ignore", "-q", path], { cwd: APP_DIR });
      expect(result.status, `${path} is ignored`).toBe(0);
    }
    expect(
      files.filter((f) => /^(android|ios)\/.*(^|\/)(build|\.gradle|public|dist)\//.test(f)),
    ).toEqual([]);
    expect(files.filter((f) => /\.(apk|aab|ipa)$/.test(f))).toEqual([]);
  });

  it("keeps the native project source files in the tree", () => {
    for (const path of [
      "android/app/src/main/AndroidManifest.xml",
      "android/app/build.gradle",
      "android/gradlew",
      "ios/App/App/Info.plist",
      "ios/App/App.xcodeproj/project.pbxproj",
      "ios/App/CapApp-SPM/Package.swift",
      "assets/icon-only.png",
    ]) {
      expect(files, path).toContain(path);
    }
  });
});
