import { createMemoryAdapter } from "@web-games/kit";
import {
  CAMPAIGN,
  CHAPTER_IDS,
  type ChapterId,
  computeStats,
  decodePuzzle,
  decodeTiles,
  evaluate,
  isChapterUnlocked,
  MAX_STARS,
  totalStars,
} from "@web-games/lantern-loops-core";
import { afterEach, describe, expect, it } from "vitest";
import { createServices, type PuzzleResult } from "../../src/services";
import { createTestEnv, mountApp, removeAnimate } from "../helpers/env";

afterEach(() => {
  document.body.replaceChildren();
  removeAnimate();
});

const NOW = new Date(2026, 9, 19, 12, 0, 0);

interface Step {
  id: string;
  chapter: ChapterId;
  result: PuzzleResult;
  totalBefore: number;
  totalAfter: number;
}

async function playCampaign() {
  const adapter = createMemoryAdapter();
  const services = createServices({ adapter, now: () => NOW });
  await services.start();
  const steps: Step[] = [];
  for (const record of CAMPAIGN) {
    const decoded = decodePuzzle(record.code, record.id);
    if (!decoded.ok) throw new Error(`${record.id}: ${decoded.error.message}`);
    const tiles = decodeTiles(record.solution, record.size);
    if (!tiles.ok) throw new Error(`${record.id}: ${tiles.error.message}`);
    expect(evaluate(decoded.value, tiles.value).solved, record.id).toBe(true);
    const totalBefore = totalStars(services.progression.current().stars);
    expect(isChapterUnlocked(record.chapter, totalBefore), `${record.id} is open`).toBe(true);
    const result = await services.progression.completePuzzle(record.id, {
      hints: 0,
      seconds: 30 + record.index,
    });
    steps.push({
      id: record.id,
      chapter: record.chapter,
      result,
      totalBefore,
      totalAfter: totalStars(services.progression.current().stars),
    });
  }
  return { adapter, services, steps };
}

describe("campaign playthrough (real services, stored solutions, zero hints)", () => {
  it("solves all 120 puzzles for 360 stars", async () => {
    const { services, steps } = await playCampaign();
    expect(steps).toHaveLength(120);
    expect(steps.every((s) => s.result.stars === 3 && s.result.previousStars === 0)).toBe(true);
    const profile = services.progression.current();
    expect(Object.keys(profile.stars)).toHaveLength(120);
    expect(totalStars(profile.stars)).toBe(360);
    expect(totalStars(profile.stars)).toBe(MAX_STARS);
    expect(profile.hintsUsed).toBe(0);
  });

  it("unlocks Garden, Bridge and Sky exactly at 45, 120 and 210 stars", async () => {
    const { steps } = await playCampaign();
    const unlocks = steps.filter((s) => s.result.chaptersUnlocked.length > 0);
    expect(unlocks.map((s) => [s.id, s.result.chaptersUnlocked, s.totalAfter])).toEqual([
      ["harbor-15", ["garden"], 45],
      ["garden-10", ["bridge"], 120],
      ["bridge-10", ["sky"], 210],
    ]);
    for (const step of unlocks) expect(step.totalBefore).toBeLessThan(step.totalAfter);
    const previous = steps.find((s) => s.id === "harbor-14");
    expect(previous?.totalAfter).toBe(42);
  });

  it("pays +5 per cleared chapter and caps the jar at 20 tokens", async () => {
    const { services, steps } = await playCampaign();
    const cleared = steps.filter((s) => s.result.chaptersCleared.length > 0);
    expect(cleared.map((s) => [s.id, s.result.chaptersCleared])).toEqual([
      ["harbor-30", ["harbor"]],
      ["garden-30", ["garden"]],
      ["bridge-30", ["bridge"]],
      ["sky-30", ["sky"]],
    ]);
    expect(cleared.map((s) => [s.result.tokensGranted, s.result.balance])).toEqual([
      [5, 8],
      [5, 13],
      [5, 18],
      [2, 20],
    ]);
    expect(cleared.map((s) => s.result.tokensCapped)).toEqual([false, false, false, true]);
    const others = steps.filter((s) => s.result.chaptersCleared.length === 0);
    expect(others.every((s) => s.result.tokensGranted === 0)).toBe(true);
    expect(services.progression.current().tokens).toBe(20);
    expect(services.progression.current().chaptersCleared).toEqual([...CHAPTER_IDS]);
  });

  it("survives a save and load round trip", async () => {
    const { adapter, services } = await playCampaign();
    const before = structuredClone(services.progression.current());
    const reopened = createServices({ adapter, now: () => NOW });
    await reopened.start();
    expect(reopened.progression.current()).toEqual(before);
    expect(totalStars(reopened.progression.current().stars)).toBe(360);
  });

  it("reports matching statistics", async () => {
    const { services } = await playCampaign();
    const profile = services.progression.current();
    const stats = computeStats(profile);
    expect(stats).toMatchObject({ solved: 120, stars: 360, maxStars: 360, threeStar: 120 });
    expect(stats.chapters.map((c) => [c.id, c.stars, c.solved, c.total])).toEqual([
      ["harbor", 90, 30, 30],
      ["garden", 90, 30, 30],
      ["bridge", 90, 30, 30],
      ["sky", 90, 30, 30],
    ]);
    const seconds = CAMPAIGN.reduce((sum, r) => sum + 30 + r.index, 0);
    expect(stats.playSeconds).toBe(seconds);
    expect(stats.hintsUsed).toBe(0);
    expect(Object.keys(stats.bestTimeBySize).map(Number)).toEqual([5, 6, 7, 8, 9]);
    expect(stats.bestTimeBySize[5]).toEqual({ id: "harbor-01", seconds: 31 });
  });

  it("replays never lower stars or pay a chapter twice", async () => {
    const { services } = await playCampaign();
    const again = await services.progression.completePuzzle("harbor-01", { hints: 2, seconds: 99 });
    expect(again).toMatchObject({
      stars: 3,
      previousStars: 3,
      newBestTime: false,
      tokensGranted: 0,
      chaptersCleared: [],
    });
    expect(services.progression.current().tokens).toBe(20);
  });

  it("shows the same numbers on the statistics screen", async () => {
    const { services } = await playCampaign();
    const test = await createTestEnv({
      profile: structuredClone(services.progression.current()),
      now: NOW,
      route: { name: "stats" },
    });
    const app = await mountApp(test.env);
    const text = app.container.textContent ?? "";
    expect(text).toContain("120 / 120");
    expect(text).toContain("360 / 360");
    const bars = Array.from(app.container.querySelectorAll("[data-bar]"));
    expect(bars.slice(0, 4).map((bar) => bar.getAttribute("data-value"))).toEqual([
      "90",
      "90",
      "90",
      "90",
    ]);
    app.unmount();
  });
});
