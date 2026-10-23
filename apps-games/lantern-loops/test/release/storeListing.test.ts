import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CAMPAIGN } from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import { APP_DIR, KB_DIR } from "./paths";

const LISTING = readFileSync(join(KB_DIR, "store-listing.md"), "utf8");

/** Fenced `text` blocks: the first line is the field name, the rest is the copy. */
function fields(markdown: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of markdown.matchAll(/```text\n([\s\S]*?)```/g)) {
    const [name, ...body] = (match[1] ?? "").split("\n");
    out[(name ?? "").trim()] = body.join("\n").trim();
  }
  return out;
}

const LIMITS = {
  "short-description": 80,
  subtitle: 30,
  "long-description": 4000,
  "whats-new": 500,
  keywords: 100,
} as const;

describe("store listing copy", () => {
  const copy = fields(LISTING);

  it("has every field as a fenced text block", () => {
    expect(Object.keys(copy).sort()).toEqual(Object.keys(LIMITS).sort());
  });

  for (const [name, limit] of Object.entries(LIMITS)) {
    it(`keeps ${name} within ${limit} characters`, () => {
      const text = copy[name] ?? "";
      expect(text.length).toBeGreaterThan(0);
      expect([...text].length).toBeLessThanOrEqual(limit);
    });
  }

  it("keeps the app name within 30 characters and equal to the Capacitor app name", () => {
    const row = /\| App name \(30 max\) \| \*\*(.+?)\*\*/.exec(LISTING);
    expect(row?.[1]).toBe("Lantern Loops");
    const config = readFileSync(join(APP_DIR, "capacitor.config.ts"), "utf8");
    expect(config).toContain(`appName: "${row?.[1]}"`);
    expect((row?.[1] ?? "").length).toBeLessThanOrEqual(30);
  });

  it("lists the same package id as Capacitor", () => {
    const config = readFileSync(join(APP_DIR, "capacitor.config.ts"), "utf8");
    const id = /appId: "([^"]+)"/.exec(config)?.[1];
    expect(id).toBe("app.w3dev.lanternloops");
    expect(LISTING).toContain(`\`${id}\``);
  });

  it("uses clean keywords: comma separated, no spaces, no duplicates", () => {
    const words = (copy.keywords ?? "").split(",");
    expect(words.every((w) => /^[a-z0-9]+$/.test(w))).toBe(true);
    expect(new Set(words).size).toBe(words.length);
  });

  it("states claims the game satisfies", () => {
    const long = copy["long-description"] ?? "";
    expect(long).toContain(`${CAMPAIGN.length} campaign puzzles`);
    expect(long).toContain("30 days");
    expect(long).toMatch(/No ads/);
    expect(long).toMatch(/No in-app purchases/);
    expect(long).toMatch(/No data collected/);
    expect(long).toContain("one free freeze each week");
    expect(copy["whats-new"]).toContain(String(CAMPAIGN.length));
  });

  it("leaves no unfinished marker inside the copy itself", () => {
    for (const [name, text] of Object.entries(copy)) {
      expect(text, name).not.toMatch(/\b(TODO|TBD|FIXME|lorem)\b/i);
    }
  });
});
