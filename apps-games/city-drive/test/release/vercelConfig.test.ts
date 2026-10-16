// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(import.meta.dirname, "../..");

type HeaderRule = { source: string; headers: { key: string; value: string }[] };
const config = JSON.parse(readFileSync(join(APP, "vercel.json"), "utf8")) as {
  framework: null;
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  headers: HeaderRule[];
};

function rule(sourcePart: string): HeaderRule {
  const found = config.headers.find((r) => r.source.includes(sourcePart));
  if (!found) throw new Error(`vercel.json has no header rule for ${sourcePart}`);
  return found;
}

const asRegExp = (source: string): RegExp => new RegExp(`^${source}$`);
const header = (r: HeaderRule, key: string): string | undefined =>
  r.headers.find((h) => h.key === key)?.value;

describe("vercel.json", () => {
  it("builds from the repo root install and serves dist", () => {
    expect(config.installCommand).toBe("cd ../.. && bun install --frozen-lockfile");
    expect(config.buildCommand).toBe("bun run build");
    expect(config.outputDirectory).toBe("dist");
    expect(config.framework).toBeNull();
  });

  it("caches hashed bundles for a year and marks them immutable", () => {
    const hashed = rule("js|css|wasm");
    expect(header(hashed, "Cache-Control")).toBe("public, max-age=31536000, immutable");
    const matcher = asRegExp(hashed.source);
    expect(matcher.test("/assets/index-CwOUeHQw.js")).toBe(true);
    expect(matcher.test("/assets/animationGroup.pure-CwOUeHQw.js")).toBe(true);
    expect(matcher.test("/assets/index-a1B2c3D4.css")).toBe(true);
  });

  it("does not make unhashed files immutable", () => {
    const hashed = asRegExp(rule("js|css|wasm").source);
    for (const path of ["/assets/manifest.json", "/assets/models/car.glb", "/index.html"]) {
      expect(hashed.test(path)).toBe(false);
    }
  });

  it("serves .wasm as application/wasm", () => {
    const wasmOnly = config.headers.find((r) => header(r, "Content-Type") === "application/wasm");
    expect(wasmOnly).toBeDefined();
    const matcher = asRegExp((wasmOnly as HeaderRule).source);
    expect(matcher.test("/assets/rapier_wasm_bg-AbCdEfGh.wasm")).toBe(true);
    expect(matcher.test("/assets/index-AbCdEfGh.js")).toBe(false);
  });

  it("every JS and CSS file of a built dist/assets matches the immutable rule", () => {
    const dist = join(APP, "dist/assets");
    if (!existsSync(dist)) return;
    const matcher = asRegExp(rule("js|css|wasm").source);
    const bundles = readdirSync(dist).filter((name) => /\.(js|css|wasm)$/.test(name));
    expect(bundles.length).toBeGreaterThan(0);
    const missed = bundles.filter((name) => !matcher.test(`/assets/${name}`));
    expect(missed).toEqual([]);
  });
});
