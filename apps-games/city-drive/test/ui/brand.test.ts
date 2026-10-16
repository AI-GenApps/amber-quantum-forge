import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_TITLE } from "../../src/ui/brand";

const APP = join(import.meta.dirname, "../..");
const REPO = join(APP, "../..");
const WORKING_TITLE = /city drive/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe("public name", () => {
  it("is one constant", () => {
    expect(GAME_TITLE).toBe("Street Royale");
  });

  it("no UI source spells the title out; they all read the constant", () => {
    const files = walk(join(APP, "src/ui")).filter((f) => /\.(ts|tsx|css)$/.test(f));
    for (const file of files) {
      if (file.endsWith("brand.ts")) continue;
      expect(readFileSync(file, "utf8"), relative(APP, file)).not.toMatch(/street royale/i);
    }
  });

  it("index.html carries the one static copy for the moment before the script runs", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    expect(html.match(/Street Royale/g)).toHaveLength(1);
    expect(html).toContain(`<title>${GAME_TITLE}</title>`);
  });

  it("leaves no working title in the shipped sources or the native resources", () => {
    const files = [
      ...walk(join(APP, "src")),
      join(APP, "index.html"),
      join(APP, "capacitor.config.ts"),
      join(APP, "public/manifest.webmanifest"),
      join(APP, "android/app/src/main/res/values/strings.xml"),
      join(APP, "ios/App/App/Info.plist"),
    ];
    for (const file of files) {
      expect(readFileSync(file, "utf8"), relative(APP, file)).not.toMatch(WORKING_TITLE);
    }
  });

  it("keeps the internal ids and puts the public name in the registry", () => {
    const registry = readFileSync(join(REPO, "scripts/games/registry-games.ts"), "utf8");
    const entry = registry.slice(registry.indexOf('id: "city_drive"'));
    expect(entry.slice(0, 400)).toContain(`publicTitle: "${GAME_TITLE}"`);
    expect(entry.slice(0, 400)).not.toMatch(WORKING_TITLE);
    expect(entry).toContain('identity("citydrive")');
  });

  it("leaves no working title in the public docs", () => {
    const dir = join(REPO, "docs-public");
    const hits = walk(dir).filter(
      (file) => /\.(md|mdx|json)$/.test(file) && WORKING_TITLE.test(readFileSync(file, "utf8")),
    );
    expect(hits).toEqual([]);
  });
});
