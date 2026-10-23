import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(import.meta.dirname, "..", "src");

const isSource = (file: string): boolean => /\.(ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const FORBIDDEN = [
  /\bDate\.now\b/,
  /\bMath\.random\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /\bperformance\.now\b/,
];

const read = (path: string): string => stripComments(readFileSync(path, "utf8"));

const pureFiles = [
  ...walk(join(SRC, "rng")),
  ...walk(join(SRC, "daily")),
  join(SRC, "save", "store.ts"),
  join(SRC, "save", "types.ts"),
].filter(isSource);

describe("architecture: deterministic cores", () => {
  it("finds the rule-like files it is meant to guard", () => {
    const names = pureFiles.map((file) => relative(SRC, file));
    expect(names).toEqual(
      expect.arrayContaining(["rng/rng.ts", "daily/daily.ts", "save/store.ts", "save/types.ts"]),
    );
  });

  for (const file of pureFiles) {
    it(`${relative(SRC, file)} reads no clock, randomness or platform global`, () => {
      const code = read(file);
      const hits = FORBIDDEN.filter((pattern) => pattern.test(code)).map(String);
      expect(hits).toEqual([]);
    });
  }

  it("keeps platform access inside the storage adapters", () => {
    const adapters = walk(join(SRC, "save", "adapters")).filter(isSource);
    expect(adapters.length).toBeGreaterThan(0);
    const touching = adapters
      .filter((file) => /\blocalStorage\b/.test(read(file)))
      .map((file) => relative(SRC, file));
    const allowed = ["save/adapters/default.ts", "save/adapters/local-storage.ts"];
    expect(touching.filter((name) => !allowed.includes(name))).toEqual([]);
    expect(touching).toContain("save/adapters/local-storage.ts");
  });
});

describe("architecture: package hygiene", () => {
  const sources = walk(SRC).filter(isSource);

  it("keeps every code file under 800 lines", () => {
    const long = sources
      .concat(walk(SRC).filter((file) => /\.test\.tsx?$/.test(file)))
      .filter((file) => readFileSync(file, "utf8").split("\n").length > 800)
      .map((file) => relative(SRC, file));
    expect(long).toEqual([]);
  });

  it("uses no `any`", () => {
    const offenders = sources
      .filter((file) => /(:\s*any\b|<any>|\bas any\b|any\[\])/.test(read(file)))
      .map((file) => relative(SRC, file));
    expect(offenders).toEqual([]);
  });

  it("exact-pins every dependency and adds nothing beyond the allowed set", () => {
    const pkg = JSON.parse(readFileSync(join(SRC, "..", "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, version] of Object.entries(all)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
    }
    expect(Object.keys(pkg.dependencies).sort()).toEqual([
      "@capacitor/app",
      "@capacitor/core",
      "@capacitor/haptics",
      "@capacitor/preferences",
      "@capacitor/screen-orientation",
      "@capacitor/share",
      "@capacitor/status-bar",
      "preact",
    ]);
  });

  it("matches City Drive's pinned versions", () => {
    const read = (path: string) =>
      JSON.parse(readFileSync(join(SRC, "..", "..", path, "package.json"), "utf8")) as {
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
      };
    const kit = read("web-kit");
    const city = read("city-drive");
    const cityAll = { ...city.dependencies, ...city.devDependencies };
    const kitAll = { ...kit.dependencies, ...kit.devDependencies };
    for (const [name, version] of Object.entries(kitAll)) {
      if (name === "@capacitor/share" || name === "@types/node") continue;
      expect(version, name).toBe(cityAll[name]);
    }
  });
});
