// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LISTING = readFileSync(
  join(import.meta.dirname, "../../../../.agents/games/city-drive/store-listing.md"),
  "utf8",
);

function field(heading: string): string {
  const start = LISTING.indexOf(`### ${heading}\n`);
  if (start < 0) throw new Error(`store-listing.md has no "### ${heading}" section`);
  const match = /```text\n([\s\S]*?)\n```/.exec(LISTING.slice(start));
  if (!match?.[1]) throw new Error(`"### ${heading}" has no fenced text block`);
  return match[1];
}

const LIMITS: ReadonlyArray<readonly [string, number]> = [
  ["Title", 30],
  ["Short description", 80],
  ["Full description", 4000],
  ["App Store subtitle", 30],
  ["App Store keywords", 100],
  ["App Store promotional text", 170],
];

describe("store listing lengths", () => {
  for (const [heading, max] of LIMITS) {
    it(`${heading} is filled and at most ${max} characters`, () => {
      const text = field(heading);
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).not.toMatch(/\bTBD\b/);
      expect([...text].length).toBeLessThanOrEqual(max);
    });
  }

  it("uses the public name as the title", () => {
    expect(field("Title")).toBe("Street Royale");
  });

  it("states the v1 promises the declarations rely on", () => {
    const full = field("Full description").toLowerCase();
    expect(full).toContain("no ads");
    expect(full).toContain("no in-app purchases");
    expect(full).toContain("offline");
    expect(full).toContain("no data is collected");
  });

  it("keeps the declaration answers", () => {
    expect(LISTING).toMatch(/Contains ads \| \*\*No\*\*/);
    expect(LISTING).toMatch(/In-app purchases \| \*\*No\*\*/);
    expect(LISTING).toContain("Data Not Collected");
  });

  it("plans eight screenshots", () => {
    const rows = LISTING.split("## Screenshot plan")[1]?.match(/^\| [1-8] \|/gm) ?? [];
    expect(rows).toHaveLength(8);
  });
});
