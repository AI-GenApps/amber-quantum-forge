import { describe, expect, it } from "vitest";
import * as C from "../src";
import { readDoc } from "./helpers/doc";

describe("constants are pinned", () => {
  it("clock and shift lengths", () => {
    expect(C.TICK_MS).toBe(100);
    expect(C.SHIFT_TICKS).toEqual({ short: 1800, medium: 2100, long: 2400 });
    expect(C.SEATS).toBe(3);
    expect(C.DOOR_WAIT_TICKS).toBe(50);
    expect(C.ARRIVAL_CUTOFF_TICKS).toBe(200);
    expect(C.ARRIVAL_MIN_GAP_TICKS).toBe(30);
    expect(C.PATIENCE_WARNING_TICKS).toBe(100);
  });

  it("stations and stock", () => {
    expect(C.STEP_TICKS).toEqual({ brew: 8, steam: 6, water: 5, warm: 12 });
    expect(C.PLATES).toBe(2);
    expect(C.PORTIONS_PER_KIND).toBe(5);
    expect(C.BASE_PASTRY_SLOTS).toBe(3);
    expect(C.BASE_BOOK_SLOTS).toBe(3);
  });

  it("outcome thresholds and component scores", () => {
    expect(C.DELIGHTED_PATIENCE_PCT).toBe(35);
    expect(C.SATISFIED_MATCH_PCT).toBe(60);
    expect(C.SCORE_EXACT).toBe(10);
    expect(C.SCORE_PASTRY_SUBSTITUTE).toBe(5);
    expect(C.SCORE_BOOK_OTHER_MOOD).toBe(3);
    expect(C.SCORE_MISSING).toBe(0);
    expect(C.SUBSTITUTE_MIN_PAYMENT).toBe(1);
    expect(C.WRONG_MOOD_BOOK_PAYMENT).toBe(1);
  });

  it("tips, friendship points and thresholds", () => {
    expect(C.TIP_DELIGHTED_PCT).toBe(40);
    expect(C.TIP_SATISFIED_PCT).toBe(15);
    expect(C.FP_DELIGHTED).toBe(2);
    expect(C.FP_SATISFIED).toBe(1);
    expect(C.FP_PER_SERVE_MAX).toBe(3);
    expect(C.FP_CAP).toBe(8);
    expect(C.FRIENDSHIP_THRESHOLDS).toEqual([1, 2, 4, 6, 8]);
  });

  it("closing grade", () => {
    expect(C.GRADE_THREE_STAR_GOOD_PCT).toBe(80);
    expect(C.GRADE_TWO_STAR_GOOD_PCT).toBe(60);
    expect([C.GRADE_BONUS_ONE, C.GRADE_BONUS_TWO, C.GRADE_BONUS_THREE]).toEqual([5, 10, 20]);
  });

  it("scenes", () => {
    expect(C.MAX_SCENES_PER_EVENING).toBe(4);
    expect(C.MAX_SCENES_FINALE_EVENING).toBe(8);
    expect(C.FINALE_DAY).toBe(14);
    expect(C.SCENES_PER_REGULAR).toBe(5);
    expect(C.SCENE_GIFT).toBe(5);
    expect(C.FINAL_SCENE_GIFT).toBe(15);
  });

  it("patience, favourites and weather", () => {
    expect(C.PATIENCE_TABLE).toEqual([
      { fromDay: 1, toDay: 1, seconds: 60 },
      { fromDay: 2, toDay: 3, seconds: 50 },
      { fromDay: 4, toDay: 8, seconds: 45 },
      { fromDay: 9, toDay: 14, seconds: 40 },
    ]);
    expect(C.RELAXED_MULTIPLIER).toBe(1.5);
    expect(C.FAVOURITE_PCT).toBe(70);
    expect(C.WEATHER_RULES.morning).toEqual({
      pastryChancePct: 70,
      bookChancePct: 20,
      extraCustomers: 0,
      patienceSeconds: 0,
    });
    expect(C.WEATHER_RULES.evening).toEqual({
      pastryChancePct: 45,
      bookChancePct: 45,
      extraCustomers: 0,
      patienceSeconds: 0,
    });
    expect(C.WEATHER_RULES.rain).toEqual({
      pastryChancePct: 55,
      bookChancePct: 30,
      extraCustomers: 1,
      patienceSeconds: 6,
    });
    expect(C.LATE_PATIENCE_START_SECONDS).toBe(40);
    expect(C.LATE_PATIENCE_FLOOR_SECONDS).toBe(34);
    expect(C.LATE_PATIENCE_STEP_SHIFTS).toBe(5);
  });

  it("matches the numbers written in product.md", () => {
    const doc = readDoc("product.md");
    expect(doc).toContain("`TICK_MS = 100`");
    expect(doc).toContain("`DOOR_WAIT_TICKS = 50`");
    expect(doc).toContain("`PORTIONS_PER_KIND = 5`");
    expect(doc).toContain("`FP_CAP = 8`");
    expect(doc).toContain("`[1, 2, 4, 6, 8]`");
    expect(doc).toContain("`MAX_SCENES_PER_EVENING = 4`");
  });
});
