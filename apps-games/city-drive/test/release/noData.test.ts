// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(import.meta.dirname, "../..");
const CORE = join(APP, "../city-drive-core");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const SOURCES = [...walk(join(APP, "src")), ...walk(join(CORE, "src"))];

function offenders(pattern: RegExp): string[] {
  return SOURCES.filter((file) => pattern.test(readFileSync(file, "utf8"))).map((file) =>
    relative(join(APP, ".."), file),
  );
}

describe("no-data audit: v1 collects nothing and talks to no server", () => {
  it("opens no socket, beacon, XHR or event stream", () => {
    expect(offenders(/XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts/)).toEqual([]);
  });

  it("calls fetch only to load its own bundled assets", () => {
    expect(offenders(/\bfetch\s*\(/)).toEqual(["city-drive/src/main.ts"]);
    const main = readFileSync(join(APP, "src/main.ts"), "utf8");
    const calls = main.match(/\bfetch\s*\([^)]*\)/g) ?? [];
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("import.meta.env.BASE_URL");
    expect(calls[0]).toContain("}assets/");
  });

  it("has no absolute URL in the sources or index.html", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    expect(html).not.toMatch(/https?:\/\//);
    expect(offenders(/https?:\/\//)).toEqual([]);
  });

  it("reads no device identifier, location or camera", () => {
    expect(offenders(/geolocation|mediaDevices|getUserMedia|advertisingId|IDFA/)).toEqual([]);
  });

  it("depends on no analytics, ads, crash or purchase SDK", () => {
    const banned =
      /firebase|analytics|sentry|posthog|mixpanel|amplitude|admob|adsense|revenuecat|crashlytics|appsflyer|adjust|segment/i;
    for (const dir of [APP, CORE]) {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const names = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
      ];
      expect(names.filter((name) => banned.test(name))).toEqual([]);
    }
  });

  it("declares only INTERNET in the Android manifest, and no Info.plist usage strings", () => {
    const manifest = readFileSync(join(APP, "android/app/src/main/AndroidManifest.xml"), "utf8");
    const permissions = [...manifest.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(permissions).toEqual(["android.permission.INTERNET"]);
    const plist = readFileSync(join(APP, "ios/App/App/Info.plist"), "utf8");
    expect(plist).not.toMatch(/UsageDescription/);
    expect(plist).not.toMatch(/NSAllowsArbitraryLoads/);
  });

  it("never points the native shell at a remote server", () => {
    const config = readFileSync(join(APP, "capacitor.config.ts"), "utf8");
    expect(config).not.toMatch(/^\s*url\s*:/m);
    expect(config).not.toMatch(/cleartext/i);
  });
});
