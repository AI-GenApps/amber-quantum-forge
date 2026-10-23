import { describe, expect, it } from "vitest";
import { type CampaignMap, validateMap, validateMaps } from "../src";
import { b, c, g, p, r, stormTide, surge } from "../src/content/dsl";
import { BASE_MAP } from "./fixtures/base-map";

function codes(map: CampaignMap): string[] {
  return validateMap(map).map((entry) => entry.code);
}

function withLayout(edit: (rows: string[]) => string[]): CampaignMap {
  return { ...BASE_MAP, layout: edit([...BASE_MAP.layout]) };
}

function replaceToken(row: number, column: number, token: string): CampaignMap {
  return withLayout((rows) => {
    const tokens = (rows[row] as string).split(" ");
    tokens[column] = token;
    rows[row] = tokens.join(" ");
    return rows;
  });
}

const FAR_CELLS = [c(7, 11), c(6, 11), c(5, 11), c(4, 11)];

describe("validators on the baseline", () => {
  it("accepts the unmodified baseline map", () => {
    expect(validateMap(BASE_MAP)).toEqual([]);
  });
});

describe("layout and size validators", () => {
  it("rejects a bad layout token with LAYOUT_PARSE", () => {
    expect(codes(replaceToken(3, 0, "X2"))).toEqual(["LAYOUT_PARSE"]);
  });

  it("rejects a ragged row with LAYOUT_PARSE", () => {
    expect(codes(withLayout((rows) => [...rows.slice(0, 5), ".2 .2", ...rows.slice(6)]))).toEqual([
      "LAYOUT_PARSE",
    ]);
  });

  it("rejects a board that is too short with SIZE_BOUNDS", () => {
    expect(codes(withLayout((rows) => rows.slice(0, 11)))).toEqual(["SIZE_BOUNDS"]);
  });

  it("rejects a board that is too wide with SIZE_BOUNDS", () => {
    const wide = withLayout((rows) => rows.map((row) => `${row} .2 .2 .2 .2 .2`));
    expect(codes(wide)).toEqual(["SIZE_BOUNDS"]);
  });

  it("rejects weeks outside 20 to 30 with WEEKS_BOUNDS", () => {
    expect(codes({ ...BASE_MAP, weeks: 19 })).toContain("WEEKS_BOUNDS");
    expect(codes({ ...BASE_MAP, weeks: 31 })).toContain("WEEKS_BOUNDS");
  });

  it("rejects a missing inlet and a missing sea", () => {
    expect(codes(replaceToken(0, 1, ".6"))).toContain("NO_INLET");
    expect(codes(replaceToken(2, 2, ".0"))).toContain("NO_SEA");
  });

  it("rejects a wrong rate count, inlet height and sea height", () => {
    expect(codes({ ...BASE_MAP, inlets: [2, 2] })).toEqual(["INLET_COUNT"]);
    expect(codes(replaceToken(0, 1, "I3"))).toContain("INLET_HEIGHT");
    expect(codes(replaceToken(2, 2, "S1"))).toContain("SEA_HEIGHT");
  });

  it("rejects wrong house kind counts and unknown kinds", () => {
    expect(codes({ ...BASE_MAP, houseKinds: ["cottage", "barn"] })).toEqual(["HOUSE_KIND_COUNT"]);
    expect(codes({ ...BASE_MAP, houseKinds: ["castle"] })).toEqual(["HOUSE_KIND_UNKNOWN"]);
  });
});

describe("gating validators", () => {
  it("rejects an event before its region with EVENT_GATING", () => {
    expect(codes({ ...BASE_MAP, events: [surge(1, 18, 2)] })).toContain("EVENT_GATING");
    expect(codes({ ...BASE_MAP, events: [stormTide(1, 18, 2)] })).toContain("EVENT_GATING");
  });

  it("rejects an event outside the season with EVENT_RANGE", () => {
    expect(codes({ ...BASE_MAP, weeks: 20, events: [surge(1, 19, 4)] })).toContain("EVENT_RANGE");
  });

  it("rejects a storm tide without a tide", () => {
    expect(codes({ ...BASE_MAP, events: [stormTide(1, 2, 2)] })).toContain("STORM_WITHOUT_TIDE");
  });

  it("rejects a tide outside the Estuary with TIDE_REGION", () => {
    const tidal = { ...BASE_MAP, tide: { period: 8, amp: 1 } };
    expect(codes(tidal)).toContain("TIDE_REGION");
  });

  it("requires a tide on Estuary maps with TIDE_MISSING", () => {
    expect(codes({ ...BASE_MAP, region: "estuary" })).toContain("TIDE_MISSING");
  });

  it("rejects a forbidden piece kind with PIECE_GATING", () => {
    expect(codes({ ...BASE_MAP, pieces: ["canal", "barrier"] })).toContain("PIECE_GATING");
    expect(codes({ ...BASE_MAP, pieces: ["canal", "gate"] })).toContain("PIECE_GATING");
    expect(codes({ ...BASE_MAP, pieces: ["canal", "reservoir"] })).toContain("PIECE_GATING");
  });
});

describe("rule validators", () => {
  it("rejects a budget that is not par + 3 with BUDGET_RULE", () => {
    expect(codes({ ...BASE_MAP, budget: 10 })).toEqual(["BUDGET_RULE"]);
  });

  it("rejects par that does not equal the reference cost with REFERENCE_COST", () => {
    expect(codes({ ...BASE_MAP, par: 7, budget: 10 })).toEqual(["REFERENCE_COST"]);
  });

  it("rejects a missing reference with NO_REFERENCE", () => {
    expect(codes({ ...BASE_MAP, reference: [] })).toEqual(["NO_REFERENCE"]);
  });

  it("rejects a reference that goes over budget with REFERENCE_ILLEGAL", () => {
    const over = { ...BASE_MAP, reference: [...BASE_MAP.reference, ...FAR_CELLS] };
    const issues = validateMap(over);
    expect(issues.map((entry) => entry.code)).toEqual(["REFERENCE_ILLEGAL"]);
    expect(issues[0]?.detail).toContain("OVER_BUDGET");
  });

  it("rejects a forbidden piece in the reference with REFERENCE_ILLEGAL", () => {
    const pumped = { ...BASE_MAP, reference: [...BASE_MAP.reference, p(7, 11, "N")] };
    const issues = validateMap(pumped);
    expect(issues.map((entry) => entry.code)).toEqual(["REFERENCE_ILLEGAL"]);
    expect(issues[0]?.detail).toContain("PIECE_UNAVAILABLE");
    const barred = { ...BASE_MAP, reference: [...BASE_MAP.reference, b(7, 11)] };
    expect(validateMap(barred)[0]?.detail).toContain("PIECE_UNAVAILABLE");
    const reserve = { ...BASE_MAP, reference: [r(7, 11)] };
    expect(validateMap(reserve)[0]?.detail).toContain("PIECE_UNAVAILABLE");
  });

  it("rejects a reference on an occupied or unbuildable cell", () => {
    const onHouse = { ...BASE_MAP, reference: [...BASE_MAP.reference, c(0, 2)] };
    expect(validateMap(onHouse)[0]?.detail).toContain("NOT_BUILDABLE");
    const twice = { ...BASE_MAP, reference: [...BASE_MAP.reference, c(0, 0)] };
    expect(validateMap(twice)[0]?.detail).toContain("OCCUPIED");
  });

  it("rejects a reference that does not earn three stars with REFERENCE_STARS", () => {
    const broken = { ...BASE_MAP, reference: BASE_MAP.reference.slice(0, 3) };
    const result = codes({ ...broken, par: 3, budget: 6 });
    expect(result).toContain("REFERENCE_STARS");
  });

  it("rejects a redundant piece with REDUNDANT_PIECE", () => {
    const padded = { ...BASE_MAP, reference: [...BASE_MAP.reference, c(7, 11)] };
    expect(codes({ ...padded, par: 7, budget: 10 })).toEqual(["REDUNDANT_PIECE"]);
  });

  it("rejects a gate reference without weeks with GATE_WEEKS_MISSING", () => {
    const gated: CampaignMap = {
      ...BASE_MAP,
      pieces: ["canal", "gate"],
      reference: [{ x: 0, y: 0, kind: "gate" }, ...BASE_MAP.reference.slice(1)],
      par: 7,
      budget: 10,
    };
    expect(codes(gated)).toContain("GATE_WEEKS_MISSING");
    const withWeeks = { ...gated, reference: [g(0, 0, 0, 20), ...BASE_MAP.reference.slice(1)] };
    expect(codes(withWeeks)).not.toContain("GATE_WEEKS_MISSING");
  });

  it("rejects a map where the empty placement clears with EMPTY_CLEARS", () => {
    const adjacent = replaceToken(0, 0, "H2");
    const easy: CampaignMap = {
      ...adjacent,
      layout: adjacent.layout.map((row) => row.replace("H3", ".3").replace("F2", ".2")),
      houseKinds: ["cottage"],
      reference: [c(1, 1)],
      par: 1,
      budget: 4,
    };
    const result = codes(easy);
    expect(result).toContain("EMPTY_CLEARS");
  });
});

describe("whole-content validator", () => {
  it("reports duplicate ids, duplicate names and wrong order", () => {
    const issues = validateMaps([BASE_MAP, { ...BASE_MAP, name: "Other Name" }]);
    const found = issues.map((entry) => entry.code);
    expect(found).toContain("DUPLICATE_ID");
    expect(found).not.toContain("DUPLICATE_NAME");
    expect(found).toContain("ID_ORDER");
    const named = validateMaps([BASE_MAP, { ...BASE_MAP, id: "v02" }]);
    expect(named.map((entry) => entry.code)).toContain("DUPLICATE_NAME");
  });

  it("reports wrong region counts and totals for a short list", () => {
    const found = validateMaps([BASE_MAP]).map((entry) => entry.code);
    expect(found).toEqual(
      expect.arrayContaining([
        "REGION_COUNT",
        "TOTAL_MAPS",
        "TOTAL_HOUSES",
        "TOTAL_FIELDS",
        "TOTAL_STARS",
      ]),
    );
  });
});
