import { describe, expect, it } from "vitest";
import * as C from "../src/constants";

describe("balance constants are pinned to product.md", () => {
  it("step, week and cap numbers", () => {
    expect(C.STEPS_PER_WEEK).toBe(4);
    expect(C.CANAL_EDGE_CAP).toBe(4);
    expect(C.OTHER_EDGE_CAP).toBe(2);
    expect(C.FLOW_MIN_DIFF).toBe(2);
    expect(C.PUMP_RATE).toBe(4);
    expect(C.RESERVOIR_CAPACITY).toBe(10);
    expect(C.MAX_CELL_DEPTH).toBe(99);
  });

  it("crest modifiers", () => {
    expect(C.CREST_CANAL).toBe(-2);
    expect(C.CREST_RESERVOIR).toBe(-3);
    expect(C.CREST_BARRIER).toBe(3);
  });

  it("goal thresholds", () => {
    expect(C.FLOOD_DEPTH).toBe(2);
    expect(C.SUPPLY_DEPTH).toBe(2);
    expect(C.NEED_STEPS).toBe(6);
    expect(C.FIELD_WET_MIN).toBe(1);
    expect(C.FIELD_WET_MAX).toBe(4);
  });

  it("board limits", () => {
    expect(C.MAX_HEIGHT).toBe(7);
    expect([C.ENGINE_MIN_WIDTH, C.ENGINE_MIN_HEIGHT]).toEqual([2, 2]);
    expect([C.ENGINE_MAX_WIDTH, C.ENGINE_MAX_HEIGHT]).toEqual([16, 20]);
  });

  it("piece costs", () => {
    expect(C.PIECE_COSTS).toEqual({ canal: 1, barrier: 1, gate: 2, pump: 3, reservoir: 4 });
  });

  it("score weights", () => {
    expect(C.SCORE_STAR_ONE).toBe(200);
    expect(C.SCORE_PER_SUPPLIED_HOUSE).toBe(100);
    expect(C.SCORE_PER_IRRIGATED_FIELD).toBe(50);
    expect(C.SCORE_PER_FLOODED_HOUSE).toBe(150);
    expect(C.SCORE_PER_UNSPENT_POINT).toBe(20);
  });

  it("exports nothing unpinned", () => {
    expect(Object.keys(C).sort()).toEqual(
      [
        "CANAL_EDGE_CAP",
        "CREST_BARRIER",
        "CREST_CANAL",
        "CREST_RESERVOIR",
        "ENGINE_MAX_HEIGHT",
        "ENGINE_MAX_WIDTH",
        "ENGINE_MIN_HEIGHT",
        "ENGINE_MIN_WIDTH",
        "FIELD_WET_MAX",
        "FIELD_WET_MIN",
        "FLOOD_DEPTH",
        "FLOW_MIN_DIFF",
        "MAX_CELL_DEPTH",
        "MAX_HEIGHT",
        "NEED_STEPS",
        "OTHER_EDGE_CAP",
        "PIECE_COSTS",
        "PUMP_RATE",
        "RESERVOIR_CAPACITY",
        "SCORE_PER_FLOODED_HOUSE",
        "SCORE_PER_IRRIGATED_FIELD",
        "SCORE_PER_SUPPLIED_HOUSE",
        "SCORE_PER_UNSPENT_POINT",
        "SCORE_STAR_ONE",
        "STEPS_PER_WEEK",
        "SUPPLY_DEPTH",
      ].sort(),
    );
  });
});
