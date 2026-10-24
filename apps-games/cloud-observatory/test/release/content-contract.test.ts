import { join } from "node:path";
import {
  ACHIEVEMENTS,
  BOONS,
  CONSTELLATIONS,
  INSTRUMENTS,
  LORE,
  LORE_CHAPTERS,
  UPGRADES,
} from "@web-games/cloud-observatory-core";
import { describe, expect, it } from "vitest";
import { ART_SLOTS } from "../../src/ui/art-slots";
import { FONT_FACES } from "../../src/ui/fonts";
import { KB, readText } from "./paths";

const contract = {
  constellations: CONSTELLATIONS.length,
  stars: CONSTELLATIONS.reduce((sum, c) => sum + c.stars.length, 0),
  instruments: INSTRUMENTS.length,
  upgrades: UPGRADES.length,
  boons: BOONS.length,
  shards: BOONS.reduce((sum, boon) => sum + boon.cost, 0),
  lore: LORE.length,
  chapters: LORE_CHAPTERS.length,
  achievements: ACHIEVEMENTS.length,
};

const quickFacts = (): string => {
  const readme = readText(join(KB, "README.md"));
  const row = readme.split("\n").find((line) => line.startsWith("| Content volume |"));
  if (!row) throw new Error("README.md has no Content volume row");
  return row;
};

const countBefore = (row: string, noun: string): number => {
  const match = row.match(new RegExp(`(\\d+) ${noun}`));
  if (!match) throw new Error(`no count before "${noun}" in: ${row}`);
  return Number(match[1]);
};

describe("content contract against the real catalog", () => {
  it("has 12 constellations with 86 stars, 8 instruments and 24 upgrades", () => {
    expect(contract).toMatchObject({
      constellations: 12,
      stars: 86,
      instruments: 8,
      upgrades: 24,
    });
  });

  it("has 10 boons costing 105 shards, 30 lore entries in 6 chapters and 20 achievements", () => {
    expect(contract).toMatchObject({
      boons: 10,
      shards: 105,
      lore: 30,
      chapters: 6,
      achievements: 20,
    });
  });

  it("has 33 art slots and the two fonts", () => {
    expect(new Set(ART_SLOTS).size).toBe(33);
    expect(ART_SLOTS).toHaveLength(33);
    expect(new Set(FONT_FACES.map((face) => face.family))).toEqual(
      new Set(["Cormorant Garamond", "Manrope"]),
    );
  });
});

describe("knowledge base README quick facts", () => {
  it("states the same counts as the code", () => {
    const row = quickFacts();
    expect(countBefore(row, "constellations")).toBe(contract.constellations);
    expect(countBefore(row, "stars")).toBe(contract.stars);
    expect(countBefore(row, "instruments")).toBe(contract.instruments);
    expect(countBefore(row, "upgrades")).toBe(contract.upgrades);
    expect(countBefore(row, "Eclipse boons")).toBe(contract.boons);
    expect(countBefore(row, "shards")).toBe(contract.shards);
    expect(countBefore(row, "lore entries")).toBe(contract.lore);
    expect(countBefore(row, "chapters")).toBe(contract.chapters);
    expect(countBefore(row, "achievements")).toBe(contract.achievements);
  });

  it("states the 33 art slots and the accepted and placeholder split", () => {
    const readme = readText(join(KB, "README.md"));
    const art = readme.split("\n").find((line) => line.startsWith("| Art |")) ?? "";
    expect(art).toContain(`${ART_SLOTS.length} image slots`);
    expect(art).toContain("33 accepted");
    expect(art).toContain("0 code-drawn placeholders");
  });

  it("states the budgets that the release tests enforce", () => {
    const readme = readText(join(KB, "README.md"));
    expect(readme).toMatch(/JS bundle at most 300 KB gzip/);
    expect(readme).toMatch(/woff2 total at most 400 KB/);
    expect(readme).toMatch(/audio at most 2\.5 MB/);
  });
});
