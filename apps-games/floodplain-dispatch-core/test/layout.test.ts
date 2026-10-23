import { describe, expect, it } from "vitest";
import { formatLayout, parseLayout } from "../src/layout";

describe("parseLayout", () => {
  it("parses kinds and heights", () => {
    const result = parseLayout([".3 .3 F2 H3", "T4 .2 I6 S0"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.layout.width).toBe(4);
    expect(result.layout.height).toBe(2);
    expect(result.layout.kinds).toEqual([
      "land",
      "land",
      "field",
      "house",
      "scenery",
      "land",
      "inlet",
      "sea",
    ]);
    expect(result.layout.heights).toEqual([3, 3, 2, 3, 4, 2, 6, 0]);
  });

  it("round-trips through formatLayout", () => {
    const rows = [".3 .3 F2 H3", "T4 .2 I6 S0", ".0 .7 .1 H5"];
    const result = parseLayout(rows);
    if (!result.ok) throw new Error("expected ok");
    expect(formatLayout(result.layout)).toEqual(rows);
  });

  it("reports EMPTY for no rows or an empty first row", () => {
    expect(parseLayout([])).toEqual({ ok: false, error: { code: "EMPTY", row: 0, column: 0 } });
    expect(parseLayout([""])).toEqual({ ok: false, error: { code: "EMPTY", row: 0, column: 0 } });
  });

  it("reports RAGGED_ROW with the row and column where it stops", () => {
    expect(parseLayout([".1 .1 .1", ".1 .1"])).toEqual({
      ok: false,
      error: { code: "RAGGED_ROW", row: 1, column: 2 },
    });
    expect(parseLayout([".1 .1", ".1 .1 .1"])).toEqual({
      ok: false,
      error: { code: "RAGGED_ROW", row: 1, column: 2 },
    });
    expect(parseLayout([".1 .1", ""])).toEqual({
      ok: false,
      error: { code: "RAGGED_ROW", row: 1, column: 1 },
    });
  });

  it("reports BAD_TOKEN for unknown kinds, wrong lengths and double spaces", () => {
    expect(parseLayout([".1 X1"])).toEqual({
      ok: false,
      error: { code: "BAD_TOKEN", row: 0, column: 1 },
    });
    expect(parseLayout([".1 .12"])).toEqual({
      ok: false,
      error: { code: "BAD_TOKEN", row: 0, column: 1 },
    });
    expect(parseLayout([".1 H"])).toEqual({
      ok: false,
      error: { code: "BAD_TOKEN", row: 0, column: 1 },
    });
    expect(parseLayout([".1  .1"])).toEqual({
      ok: false,
      error: { code: "BAD_TOKEN", row: 0, column: 1 },
    });
  });

  it("reports BAD_HEIGHT outside 0 to 7", () => {
    expect(parseLayout([".1", ".1", ".8"])).toEqual({
      ok: false,
      error: { code: "BAD_HEIGHT", row: 2, column: 0 },
    });
    expect(parseLayout([".1 Hx"])).toEqual({
      ok: false,
      error: { code: "BAD_HEIGHT", row: 0, column: 1 },
    });
    expect(parseLayout([".1 .-"]).ok).toBe(false);
  });

  it("accepts every height 0 to 7 and every kind", () => {
    expect(parseLayout([".0 .1 .2 .3 .4 .5 .6 .7", "H0 F1 T2 I3 S4 .5 .6 .7"]).ok).toBe(true);
  });
});
