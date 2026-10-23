import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUDIT_FILE,
  NETWORK_APIS,
  runAudit,
  skeletonDependencies,
  writeAudit,
} from "../../scripts/no-data-audit";
import { APP_DIR } from "./paths";

describe("no-data audit", () => {
  it("finds no network API and no non-allowlisted URL, and writes no-data-audit.txt", () => {
    const { result, text } = writeAudit();
    expect(result.files.length).toBeGreaterThan(60);
    expect(result.apiUses).toEqual([]);
    expect(result.badUrls).toEqual([]);
    expect(text).toContain("Network API uses: 0");
    expect(text).toContain("Non-allowlisted URLs: 0");
    expect(text).toContain("Result: PASS");
    expect(readFileSync(AUDIT_FILE, "utf8")).toBe(text);
  });

  it("covers every API of the spec and would catch a violation", () => {
    expect(NETWORK_APIS).toEqual([
      "fetch(",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "sendBeacon",
      "navigator.geolocation",
      "importScripts",
    ]);
    const audited = runAudit().files;
    expect(audited).toContain("src/main.tsx");
    expect(audited).toContain("index.html");
    expect(audited.some((f) => f.startsWith("public/audio/LICENSES/"))).toBe(true);
    expect(audited.some((f) => f.endsWith(".woff2"))).toBe(false);
  });

  it("keeps the dependency set of the skeleton", () => {
    const pkg = JSON.parse(readFileSync(join(APP_DIR, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.dependencies).toEqual({
      "@capacitor/android": "8.5.3",
      "@capacitor/app": "8.1.2",
      "@capacitor/core": "8.5.3",
      "@capacitor/haptics": "8.0.2",
      "@capacitor/ios": "8.5.3",
      "@capacitor/preferences": "8.0.1",
      "@capacitor/screen-orientation": "8.0.2",
      "@capacitor/share": "8.0.3",
      "@capacitor/status-bar": "8.0.4",
      "@web-games/kit": "workspace:*",
      "@web-games/lantern-loops-core": "workspace:*",
      preact: "11.0.1",
    });
    expect(pkg.devDependencies).toEqual({
      "@capacitor/assets": "3.0.5",
      "@capacitor/cli": "8.5.3",
      "@types/node": "20.19.43",
      "happy-dom": "21.0.1",
      sharp: "0.35.3",
      typescript: "5.9.3",
      vite: "8.3.4",
      vitest: "5.0.5",
    });
    expect(skeletonDependencies().match).toBe(true);
  });
});
