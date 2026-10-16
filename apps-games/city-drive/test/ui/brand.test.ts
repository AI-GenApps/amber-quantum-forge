import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_TITLE } from "../../src/ui/brand";

const APP = join(import.meta.dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe("working title", () => {
  it("is one constant", () => {
    expect(GAME_TITLE).toBe("City Drive");
  });

  it("no UI source spells the title out; they all read the constant", () => {
    const files = walk(join(APP, "src/ui")).filter((f) => /\.(ts|tsx|css)$/.test(f));
    for (const file of files) {
      if (file.endsWith("brand.ts")) continue;
      expect(readFileSync(file, "utf8"), relative(APP, file)).not.toMatch(/city drive/i);
    }
  });

  it("index.html carries the one static copy for the moment before the script runs", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    expect(html.match(/City Drive/g)).toHaveLength(1);
    expect(html).toContain(`<title>${GAME_TITLE}</title>`);
  });
});
