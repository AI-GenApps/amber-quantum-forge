// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ASSET_KINDS,
  ASSET_PACKS,
  BUDGETS,
  checkBudgets,
  ID_PATTERNS,
  ROAD_IDS,
  validateManifest,
} from "../../src/assets/manifest";
import { appDir, assetsDir, readManifest } from "./helpers";

describe("asset manifest schema", () => {
  const manifest = readManifest();

  it("validates against the schema", () => {
    expect(validateManifest(manifest)).toEqual([]);
  });

  it("every id matches the fixed id scheme of its kind", () => {
    for (const model of manifest.models) {
      expect(model.id, model.id).toMatch(ID_PATTERNS[model.kind]);
    }
  });

  it("contains the six fixed road ids and a curated set per kind", () => {
    const ids = manifest.models.map((model) => model.id);
    for (const id of ROAD_IDS) expect(ids).toContain(id);
    const count = (kind: string) => manifest.models.filter((model) => model.kind === kind).length;
    expect(count("road")).toBe(6);
    expect(count("building")).toBeGreaterThanOrEqual(16);
    expect(count("prop")).toBeGreaterThanOrEqual(8);
    expect(count("car")).toBeGreaterThanOrEqual(6);
    expect(count("car")).toBeLessThanOrEqual(8);
    expect(new Set(ASSET_KINDS)).toEqual(new Set(manifest.models.map((model) => model.kind)));
  });

  it("manifest bytes and files agree with the models folder", () => {
    const onDisk = readdirSync(join(assetsDir, "models")).filter((name) => name.endsWith(".glb"));
    expect(onDisk.sort()).toEqual(manifest.models.map((model) => `${model.id}.glb`).sort());
    for (const model of manifest.models) {
      expect(statSync(join(assetsDir, model.file)).size, model.id).toBe(model.bytes);
    }
  });

  it("rejects malformed manifests", () => {
    expect(validateManifest(null)).not.toEqual([]);
    const bad = { schemaVersion: 1, models: [{ id: "road-wrong", kind: "road" }] };
    expect(validateManifest(bad).length).toBeGreaterThan(0);
  });
});

describe("licence records", () => {
  it("every pack used by a model has a CC0 record with URL, date and SHA-256", () => {
    const manifest = readManifest();
    const packs = new Set(manifest.models.map((model) => model.licence));
    expect([...packs].sort()).toEqual([...ASSET_PACKS].sort());
    for (const pack of packs) {
      const path = join(appDir, "assets-src", "LICENSES", `${pack}.txt`);
      expect(existsSync(path), pack).toBe(true);
      const text = readFileSync(path, "utf8");
      expect(text).toMatch(/^Source URL: https:\/\/kenney\.nl\/assets\//m);
      expect(text).toMatch(/^Download date: \d{4}-\d{2}-\d{2}$/m);
      expect(text).toMatch(/^Zip SHA-256: [0-9a-f]{64}$/m);
      expect(text).toContain("Creative Commons Zero, CC0");
    }
  });
});

describe("asset budgets", () => {
  const manifest = readManifest();

  it("total payload is within budget", () => {
    const total = manifest.models.reduce((sum, model) => sum + model.bytes, 0);
    expect(total).toBeLessThanOrEqual(BUDGETS.totalBytes);
  });

  it("per-model triangle caps hold", () => {
    expect(checkBudgets(manifest)).toEqual([]);
  });

  it("the budget check actually fails when a cap is exceeded", () => {
    const [first] = manifest.models.filter((model) => model.kind === "road");
    if (!first) throw new Error("no road model in manifest");
    const over = { ...manifest, models: [{ ...first, triangles: 501 }] };
    expect(checkBudgets(over)).toHaveLength(1);
    const heavy = { ...manifest, models: [{ ...first, bytes: BUDGETS.totalBytes + 1 }] };
    expect(checkBudgets(heavy)).toHaveLength(1);
  });
});

describe("offline decoders", () => {
  it("src never references the Babylon CDN", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
      );
    for (const file of walk(join(appDir, "src"))) {
      expect(readFileSync(file, "utf8"), file).not.toContain("cdn.babylonjs.com");
    }
  });
});
