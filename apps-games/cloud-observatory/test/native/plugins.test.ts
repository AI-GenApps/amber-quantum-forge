import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANDROID_DIR, APP_DIR, EXPECTED_PLUGINS, IOS_DIR } from "./paths";

const read = (path: string): string => readFileSync(path, "utf8");
const expected = [...EXPECTED_PLUGINS].sort();

describe("synced capacitor plugins", () => {
  it("android settings.gradle lists exactly the six plugins", () => {
    const text = read(join(ANDROID_DIR, "capacitor.settings.gradle"));
    const names = [...text.matchAll(/include ':capacitor-([\w-]+)'/g)]
      .map((m) => m[1] ?? "")
      .filter((name) => name !== "android")
      .sort();
    expect(names).toEqual(expected);
  });

  it("android app build lists exactly the six plugin projects", () => {
    const text = read(join(ANDROID_DIR, "app/capacitor.build.gradle"));
    const names = [...text.matchAll(/project\(':capacitor-([\w-]+)'\)/g)]
      .map((m) => m[1] ?? "")
      .filter((name) => name !== "cordova-android-plugins")
      .sort();
    expect(names).toEqual(expected);
  });

  it("ios package manifest lists exactly the six plugins", () => {
    const text = read(join(IOS_DIR, "App/CapApp-SPM/Package.swift"));
    const toKebab = (pascal: string): string =>
      pascal.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const names = [...text.matchAll(/\.package\(name: "Capacitor(\w+)", path:/g)]
      .map((m) => toKebab(m[1] ?? ""))
      .sort();
    expect(names).toEqual(expected);
  });

  it("matches the plugin dependencies in package.json", () => {
    const pkg = JSON.parse(read(join(APP_DIR, "package.json"))) as {
      dependencies: Record<string, string>;
    };
    const declared = Object.keys(pkg.dependencies)
      .filter((name) => name.startsWith("@capacitor/"))
      .map((name) => name.replace("@capacitor/", ""))
      .filter((name) => !["core", "android", "ios"].includes(name))
      .sort();
    expect(declared).toEqual(expected);
  });
});
