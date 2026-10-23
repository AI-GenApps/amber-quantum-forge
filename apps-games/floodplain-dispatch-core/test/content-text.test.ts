import { describe, expect, it } from "vitest";
import {
  CHAPTERS,
  GAME_TITLE,
  headlineFor,
  MAP_BY_ID,
  MAPS,
  MECHANIC_CARDS,
  REGIONS,
  RESULT_HEADLINES,
  TAGLINE,
  THEMES,
  TUTORIAL_STEPS,
} from "../src";

const MAX_BRIEF = 90;

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

describe("content text", () => {
  it("keeps every brief within 90 characters, plain and non-empty", () => {
    for (const map of MAPS) {
      expect(map.brief.length).toBeGreaterThan(0);
      expect(map.brief.length, map.id).toBeLessThanOrEqual(MAX_BRIEF);
      expect(map.brief.trim(), map.id).toBe(map.brief);
      expect(/\p{Extended_Pictographic}/u.test(map.brief), map.id).toBe(false);
    }
  });

  it("has no empty strings anywhere in the content data", () => {
    const strings = collectStrings([
      MAPS.map((map) => [map.id, map.name, map.brief, map.houseKinds, map.layout]),
      REGIONS,
      CHAPTERS,
      MECHANIC_CARDS,
      TUTORIAL_STEPS,
      THEMES,
      RESULT_HEADLINES,
      GAME_TITLE,
      TAGLINE,
    ]);
    expect(strings.length).toBeGreaterThan(300);
    expect(strings.filter((text) => text.trim() === "")).toEqual([]);
  });

  it("has no placeholder text and only ASCII punctuation", () => {
    const strings = collectStrings([
      MAPS.map((map) => [map.name, map.brief]),
      CHAPTERS,
      MECHANIC_CARDS,
      TUTORIAL_STEPS,
      THEMES,
      RESULT_HEADLINES,
      TAGLINE,
    ]);
    for (const text of strings) {
      expect(/lorem|todo|tbd|placeholder|xxx/i.test(text), text).toBe(false);
      expect(/^[\x20-\x7e]+$/.test(text), text).toBe(true);
    }
  });

  it("has unique ids and unique names across maps, themes and cards", () => {
    expect(new Set(MAPS.map((map) => map.id)).size).toBe(40);
    expect(new Set(MAPS.map((map) => map.name)).size).toBe(40);
    expect(new Set(THEMES.map((theme) => theme.name)).size).toBe(7);
    expect(new Set(MECHANIC_CARDS.map((card) => card.title)).size).toBe(7);
    expect(new Set(MAPS.map((map) => map.brief)).size).toBe(40);
  });

  it("has result headlines for 3, 2, 1 and 0 stars", () => {
    expect(RESULT_HEADLINES.map((entry) => entry.stars)).toEqual([3, 2, 1, 0]);
    expect(headlineFor(3)).toBe("Dry feet, full barns.");
    expect(headlineFor(0)).toBe("The season got away from us.");
    expect(GAME_TITLE).toBe("Floodplain Dispatch");
    expect(TAGLINE).toBe("Water the town before the water finds it.");
  });

  it("points every mechanic card at an existing map in the right region", () => {
    expect(MECHANIC_CARDS).toHaveLength(7);
    for (const card of MECHANIC_CARDS) expect(MAP_BY_ID.has(card.mapId), card.id).toBe(true);
    expect(MECHANIC_CARDS.map((card) => card.mapId)).toEqual([
      "v01",
      "v03",
      "v04",
      "v06",
      "d01",
      "h01",
      "e01",
    ]);
  });

  it("orders the tutorial steps 1 to 5 with highlights", () => {
    expect(TUTORIAL_STEPS.map((step) => step.step)).toEqual([1, 2, 3, 4, 5]);
    for (const step of TUTORIAL_STEPS) {
      expect(step.text.length).toBeGreaterThan(0);
      expect(step.highlight.length).toBeGreaterThan(0);
    }
  });

  it("ties chapters and regions together in order", () => {
    expect(CHAPTERS.map((chapter) => chapter.region)).toEqual([
      "valley",
      "delta",
      "highland",
      "estuary",
    ]);
    expect(REGIONS.map((region) => region.id)).toEqual(CHAPTERS.map((chapter) => chapter.region));
    expect(REGIONS.map((region) => region.unlockStars)).toEqual([0, 12, 33, 60]);
    for (const region of REGIONS) expect(region.mapIds).toHaveLength(10);
  });
});
