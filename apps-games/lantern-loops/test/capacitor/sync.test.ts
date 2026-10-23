import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANDROID_DIR, APP_DIR, committedFiles, IOS_APP, read, sha256 } from "./files";

const DIST = join(APP_DIR, "dist");
const COPIES = {
  android: join(ANDROID_DIR, "app/src/main/assets/public"),
  ios: join(IOS_APP, "public"),
} as const;
const CONFIGS = {
  android: join(ANDROID_DIR, "app/src/main/assets/capacitor.config.json"),
  ios: join(IOS_APP, "capacitor.config.json"),
} as const;

const built = existsSync(join(DIST, "index.html"));
if (!built) {
  console.warn("sync test: dist/ is absent, run `bun run build` then `bunx cap sync` to enable it");
}

describe.skipIf(!built)("synced web copy (needs dist/ and a cap sync)", () => {
  for (const platform of ["android", "ios"] as const) {
    const copy = COPIES[platform];
    it.skipIf(!existsSync(copy))(`${platform} public/ matches the dist build`, () => {
      expect(sha256(join(copy, "index.html"))).toBe(sha256(join(DIST, "index.html")));
    });
  }
});

describe("synced capacitor.config.json", () => {
  for (const platform of ["android", "ios"] as const) {
    it.skipIf(!existsSync(CONFIGS[platform]))(`${platform} config has no server.url`, () => {
      const config = JSON.parse(read(CONFIGS[platform])) as Record<string, unknown>;
      expect(config.appId).toBe("app.w3dev.lanternloops");
      expect(config.appName).toBe("Lantern Loops");
      expect(config.webDir).toBe("dist");
      expect(config.server).toBeUndefined();
    });
  }
});

describe("committed platform folders stay clean", () => {
  const forbidden = [
    /(^|\/)local\.properties$/,
    /\.(keystore|jks|p12|mobileprovision|apk|aab|ipa|dex|class)$/i,
    /(^|\/)(build|\.gradle|Pods|DerivedData|xcuserdata)\//,
    /(^|\/)public\//,
    /(^|\/)capacitor\.config\.json$/,
    /(^|\/)config\.xml$/,
    /capacitor-cordova-(android|ios)-plugins\//,
  ];

  for (const folder of ["android", "ios"] as const) {
    it(`${folder} has no build output, local config or secrets`, () => {
      const files = committedFiles(folder);
      expect(files.length).toBeGreaterThan(10);
      expect(files.filter((file) => forbidden.some((rule) => rule.test(file)))).toEqual([]);
    });

    it(`${folder} stays below 5 MB without web assets`, () => {
      const bytes = committedFiles(folder).reduce(
        (sum, file) => sum + statSync(join(APP_DIR, file)).size,
        0,
      );
      expect(bytes).toBeLessThan(5 * 1024 * 1024);
    });
  }
});
