import { describe, expect, it } from "vitest";
import type { CampaignMap } from "../src";
import {
  CHAPTERS,
  MAPS,
  MECHANIC_CARDS,
  parseLayout,
  REGIONS,
  THEMES,
  TOTAL_FIELDS,
  TOTAL_HOUSES,
  TOTAL_STARS,
} from "../src";
import {
  PLAN_TEXT,
  parseCards,
  parseChapters,
  parseMapRows,
  parseThemes,
  parseUnlocks,
} from "./plan-parse";

const PIECE_CODE = { canal: "C", barrier: "B", pump: "P", gate: "S", reservoir: "R" } as const;

function countKind(map: CampaignMap, kind: string): number {
  const parsed = parseLayout(map.layout);
  if (!parsed.ok) throw new Error(`layout of ${map.id}`);
  return parsed.layout.kinds.filter((entry) => entry === kind).length;
}

function sizeOf(map: CampaignMap): { width: number; height: number } {
  const parsed = parseLayout(map.layout);
  if (!parsed.ok) throw new Error(`layout of ${map.id}`);
  return { width: parsed.layout.width, height: parsed.layout.height };
}

function houseCounts(map: CampaignMap): Record<string, number> {
  const out: Record<string, number> = {};
  for (const kind of map.houseKinds) out[kind] = (out[kind] ?? 0) + 1;
  return out;
}

const ROWS = parseMapRows();

describe("content-plan.md versus shipped map data", () => {
  it("lists exactly the 40 shipped maps in order", () => {
    expect(ROWS.map((row) => row.id)).toEqual(MAPS.map((map) => map.id));
    expect(ROWS).toHaveLength(40);
  });

  for (const row of ROWS) {
    describe(row.id, () => {
      const map = MAPS.find((entry) => entry.id === row.id) as CampaignMap;

      it("has the planned identity, size, weeks and rates", () => {
        expect(map.name).toBe(row.name);
        expect(sizeOf(map)).toEqual({ width: row.width, height: row.height });
        expect(map.weeks).toBe(row.weeks);
        expect(map.inlets).toHaveLength(row.inlets);
        expect(map.inlets.every((rate) => rate === row.rate)).toBe(true);
        expect(countKind(map, "inlet")).toBe(row.inlets);
      });

      it("has the planned houses, fields and pieces", () => {
        expect(houseCounts(map)).toEqual(row.houses);
        expect(map.houseKinds).toHaveLength(row.housesTotal);
        expect(countKind(map, "house")).toBe(row.housesTotal);
        expect(countKind(map, "field")).toBe(row.fields);
        expect(map.pieces.map((kind) => PIECE_CODE[kind]).join("")).toBe(row.pieces);
      });

      it("has the planned par, budget, tide and forecast events", () => {
        expect(map.par).toBe(row.par);
        expect(map.budget).toBe(row.budget);
        expect(map.tide).toEqual(row.tide);
        expect(map.events.map((e) => ({ ...e }))).toEqual(row.events);
      });

      it("has the planned brief", () => {
        expect(map.brief).toBe(row.brief);
      });
    });
  }
});

describe("content-plan.md versus shipped totals and texts", () => {
  it("states the campaign totals", () => {
    expect(PLAN_TEXT).toContain("4 regions, 40 campaign maps, 120 campaign stars.");
    expect(PLAN_TEXT).toContain("193 houses and 133 fields");
    expect([TOTAL_STARS, TOTAL_HOUSES, TOTAL_FIELDS]).toEqual([120, 193, 133]);
    expect(ROWS.reduce((sum, row) => sum + row.housesTotal, 0)).toBe(193);
    expect(ROWS.reduce((sum, row) => sum + row.fields, 0)).toBe(133);
  });

  it("matches region unlock stars", () => {
    const unlocks = parseUnlocks();
    for (const region of REGIONS) expect(unlocks[region.name]).toBe(region.unlockStars);
  });

  it("matches chapter titles, intros and outros", () => {
    const chapters = parseChapters();
    expect(chapters).toHaveLength(4);
    expect(
      CHAPTERS.map((chapter) => ({
        title: chapter.title,
        intro: chapter.intro,
        outro: chapter.outro,
      })),
    ).toEqual(chapters);
    expect(REGIONS.map((region) => region.chapterTitle)).toEqual(chapters.map((c) => c.title));
  });

  it("matches the seven theme names and star thresholds", () => {
    const themes = parseThemes();
    expect(themes.map((t) => t.stars)).toEqual([0, 9, 27, 48, 75, 100, 120]);
    expect(THEMES.map((t) => ({ name: t.name, stars: t.starsNeeded }))).toEqual(themes);
  });

  it("matches the seven mechanic cards", () => {
    const cards = parseCards();
    expect(cards).toHaveLength(7);
    expect(
      MECHANIC_CARDS.map((card, index) => ({
        index: index + 1,
        title: card.title,
        shownOn: card.mapId,
        text: card.text,
      })),
    ).toEqual(cards);
  });
});
