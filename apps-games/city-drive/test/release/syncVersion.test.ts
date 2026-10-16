// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gameById } from "../../../../scripts/games/registry";
import {
  assertRelease,
  patchAll,
  patchGradle,
  patchPbxproj,
  versionDrift,
} from "../../scripts/syncVersion";

const APP = join(import.meta.dirname, "../..");
const gradle = readFileSync(join(APP, "android/app/build.gradle"), "utf8");
const pbxproj = readFileSync(join(APP, "ios/App/App.xcodeproj/project.pbxproj"), "utf8");
const plist = readFileSync(join(APP, "ios/App/App/Info.plist"), "utf8");
const release = { version: "2.3.4", buildNumber: 17 };

describe("patchGradle", () => {
  it("sets versionName and versionCode", () => {
    const out = patchGradle(gradle, release);
    expect(out).toContain('versionName "2.3.4"');
    expect(out).toMatch(/^\s*versionCode 17$/m);
    expect(out.split("\n").length).toBe(gradle.split("\n").length);
  });

  it("is idempotent", () => {
    const once = patchGradle(gradle, release);
    expect(patchGradle(once, release)).toBe(once);
  });

  it("throws when the file has no version lines", () => {
    expect(() => patchGradle("android {}", release)).toThrow("no match");
  });
});

describe("patchPbxproj", () => {
  it("sets MARKETING_VERSION and CURRENT_PROJECT_VERSION in Debug and Release", () => {
    const out = patchPbxproj(pbxproj, release);
    expect(out.match(/MARKETING_VERSION = 2\.3\.4;/g)).toHaveLength(2);
    expect(out.match(/CURRENT_PROJECT_VERSION = 17;/g)).toHaveLength(2);
    expect(out).not.toMatch(/MARKETING_VERSION = 1\.0;/);
  });

  it("changes nothing else", () => {
    const strip = (text: string) =>
      text.replace(/(MARKETING_VERSION|CURRENT_PROJECT_VERSION) = [^;]+;/g, "$1");
    expect(strip(patchPbxproj(pbxproj, release))).toBe(strip(pbxproj));
  });

  it("throws when the file has no version settings", () => {
    expect(() => patchPbxproj("// empty", release)).toThrow("no match");
  });
});

describe("release validation", () => {
  it("rejects a non x.y.z version and a build number below 1", () => {
    expect(() => assertRelease({ version: "1.0", buildNumber: 1 })).toThrow("x.y.z");
    expect(() => assertRelease({ version: "1.0.0", buildNumber: 0 })).toThrow("build number");
    expect(() => assertRelease({ version: "1.0.0", buildNumber: 1.5 })).toThrow("build number");
  });
});

describe("the committed native projects match the registry release", () => {
  const game = gameById("city_drive");

  it("has a city_drive registry entry", () => {
    expect(game).toBeDefined();
  });

  it("has no drift: versionName, versionCode, MARKETING_VERSION, CURRENT_PROJECT_VERSION", () => {
    const { version, buildNumber } = (game as NonNullable<typeof game>).release;
    expect(versionDrift({ gradle, pbxproj }, { version, buildNumber })).toEqual([]);
    expect(gradle).toContain(`versionName "${version}"`);
    expect(gradle).toMatch(new RegExp(`^\\s*versionCode ${buildNumber}$`, "m"));
    expect(pbxproj.match(new RegExp(`MARKETING_VERSION = ${version};`, "g"))).toHaveLength(2);
    expect(
      pbxproj.match(new RegExp(`CURRENT_PROJECT_VERSION = ${buildNumber};`, "g")),
    ).toHaveLength(2);
  });

  it("reads both versions from the build settings, not literals, in Info.plist", () => {
    expect(plist).toContain("<string>$(MARKETING_VERSION)</string>");
    expect(plist).toContain("<string>$(CURRENT_PROJECT_VERSION)</string>");
  });

  it("detects drift", () => {
    const drift = versionDrift(patchAll({ gradle, pbxproj }, release), {
      version: "9.9.9",
      buildNumber: 99,
    });
    expect(drift).toHaveLength(2);
  });
});

describe("sync-version CLI --check", () => {
  it("exits 0 on the committed projects", () => {
    const result = spawnSync("bun", [join(APP, "scripts", "sync-version.ts"), "--check"], {
      cwd: APP,
      encoding: "utf8",
    });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("match");
  });
});
