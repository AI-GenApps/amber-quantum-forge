import { describe, expect, it } from "vitest";
import {
  addPlacement,
  budgetLeft,
  checkPlacement,
  placementCost,
  removePlacement,
  rotatePump,
  setGateWeeks,
  totalCost,
} from "../src/placement";
import type { Placement } from "../src/types";
import { makeDef, placement } from "./helpers";

const DEF = makeDef([".3 .3 F2 H3", ".2 .2 I6 S0", ".0 .7 .1 T5"], {
  budget: 6,
  weeks: 10,
  pieces: ["canal", "barrier", "pump", "gate"],
});

describe("costs", () => {
  it("prices every piece", () => {
    expect(placementCost(placement("canal", 0, 0))).toBe(1);
    expect(placementCost(placement("barrier", 0, 0))).toBe(1);
    expect(placementCost(placement("gate", 0, 0))).toBe(2);
    expect(placementCost(placement("pump", 0, 0))).toBe(3);
    expect(placementCost(placement("reservoir", 0, 0))).toBe(4);
  });

  it("sums spend and budget left", () => {
    const list = [placement("canal", 0, 0), placement("pump", 1, 0, { dir: "N" })];
    expect(totalCost(list)).toBe(4);
    expect(budgetLeft(DEF, list)).toBe(2);
    expect(budgetLeft(DEF, [])).toBe(6);
  });
});

describe("checkPlacement", () => {
  it("accepts a legal piece", () => {
    expect(checkPlacement(DEF, [], placement("canal", 0, 0))).toBeNull();
    expect(checkPlacement(DEF, [], placement("pump", 0, 0, { dir: "E" }))).toBeNull();
    expect(
      checkPlacement(DEF, [], placement("gate", 0, 0, { opensWeek: 2, closesWeek: 5 })),
    ).toBeNull();
    expect(checkPlacement(DEF, [], placement("gate", 0, 0))).toBeNull();
  });

  it("OUT_OF_BOUNDS", () => {
    expect(checkPlacement(DEF, [], placement("canal", 4, 0))).toBe("OUT_OF_BOUNDS");
    expect(checkPlacement(DEF, [], placement("canal", 0, -1))).toBe("OUT_OF_BOUNDS");
    expect(checkPlacement(DEF, [], placement("canal", 0.5, 0))).toBe("OUT_OF_BOUNDS");
  });

  it("NOT_BUILDABLE for house, field, scenery, inlet and sea", () => {
    for (const [x, y] of [
      [3, 0],
      [2, 0],
      [3, 2],
      [2, 1],
      [3, 1],
    ] as const) {
      expect(checkPlacement(DEF, [], placement("canal", x, y))).toBe("NOT_BUILDABLE");
    }
  });

  it("PIECE_UNAVAILABLE when the map does not offer the piece", () => {
    expect(checkPlacement(DEF, [], placement("reservoir", 0, 0))).toBe("PIECE_UNAVAILABLE");
  });

  it("OCCUPIED when the cell already holds a piece", () => {
    expect(checkPlacement(DEF, [placement("canal", 0, 0)], placement("barrier", 0, 0))).toBe(
      "OCCUPIED",
    );
  });

  it("OVER_BUDGET counts existing spend plus the candidate", () => {
    const owned = [placement("pump", 0, 0, { dir: "N" }), placement("canal", 1, 0)];
    expect(checkPlacement(DEF, owned, placement("gate", 0, 2))).toBeNull();
    expect(checkPlacement(DEF, owned, placement("pump", 1, 2, { dir: "N" }))).toBe("OVER_BUDGET");
    const nearly = [placement("pump", 0, 0, { dir: "N" }), placement("gate", 1, 0)];
    expect(checkPlacement(DEF, nearly, placement("canal", 0, 1))).toBeNull();
    expect(checkPlacement(DEF, nearly, placement("gate", 0, 1))).toBe("OVER_BUDGET");
  });

  it("BAD_DIRECTION for a pump without a direction or any other piece with one", () => {
    expect(checkPlacement(DEF, [], placement("pump", 0, 0))).toBe("BAD_DIRECTION");
    expect(checkPlacement(DEF, [], { x: 0, y: 0, kind: "pump", dir: "Q" as "N" })).toBe(
      "BAD_DIRECTION",
    );
    expect(checkPlacement(DEF, [], placement("canal", 0, 0, { dir: "N" }))).toBe("BAD_DIRECTION");
  });

  it("BAD_GATE_WEEKS for inverted, equal, negative, over-long, fractional or misplaced weeks", () => {
    const gate = (opensWeek: number, closesWeek: number) =>
      checkPlacement(DEF, [], placement("gate", 0, 0, { opensWeek, closesWeek }));
    expect(gate(5, 5)).toBe("BAD_GATE_WEEKS");
    expect(gate(6, 5)).toBe("BAD_GATE_WEEKS");
    expect(gate(-1, 5)).toBe("BAD_GATE_WEEKS");
    expect(gate(0, 11)).toBe("BAD_GATE_WEEKS");
    expect(gate(0.5, 5)).toBe("BAD_GATE_WEEKS");
    expect(gate(0, 10)).toBeNull();
    expect(checkPlacement(DEF, [], placement("gate", 0, 0, { opensWeek: 10 }))).toBe(
      "BAD_GATE_WEEKS",
    );
    expect(checkPlacement(DEF, [], placement("canal", 0, 0, { opensWeek: 1 }))).toBe(
      "BAD_GATE_WEEKS",
    );
  });

  it("reports the first failing rule in a fixed order", () => {
    expect(checkPlacement(DEF, [], placement("reservoir", 9, 9))).toBe("OUT_OF_BOUNDS");
    expect(checkPlacement(DEF, [], placement("reservoir", 3, 0))).toBe("NOT_BUILDABLE");
    expect(checkPlacement(DEF, [placement("canal", 0, 0)], placement("pump", 0, 0))).toBe(
      "BAD_DIRECTION",
    );
  });
});

describe("immutable edits", () => {
  const start: Placement[] = [
    placement("canal", 0, 0),
    placement("pump", 1, 0, { dir: "N" }),
    placement("gate", 0, 2, { opensWeek: 1, closesWeek: 4 }),
  ];
  const frozen = JSON.stringify(start);

  it("addPlacement appends a copy", () => {
    const candidate = placement("barrier", 1, 2);
    const next = addPlacement(start, candidate);
    expect(next).toHaveLength(4);
    expect(next[3]).toEqual(candidate);
    expect(next[3]).not.toBe(candidate);
    expect(JSON.stringify(start)).toBe(frozen);
  });

  it("removePlacement refunds the full cost", () => {
    const next = removePlacement(start, 1, 0);
    expect(next.map((p) => p.kind)).toEqual(["canal", "gate"]);
    expect(totalCost(start) - totalCost(next)).toBe(3);
    expect(removePlacement(start, 3, 3)).toEqual(start);
    expect(JSON.stringify(start)).toBe(frozen);
  });

  it("rotatePump cycles N, E, S, W and ignores other pieces", () => {
    let list = start;
    const seen: (string | undefined)[] = [];
    for (let i = 0; i < 5; i++) {
      list = rotatePump(list, 1, 0);
      seen.push(list[1]?.dir);
    }
    expect(seen).toEqual(["E", "S", "W", "N", "E"]);
    expect(rotatePump(start, 0, 0)).toEqual(start);
    expect(JSON.stringify(start)).toBe(frozen);
  });

  it("setGateWeeks edits only the gate at that cell", () => {
    const next = setGateWeeks(start, 0, 2, 2, 6);
    expect(next[2]).toMatchObject({ opensWeek: 2, closesWeek: 6 });
    expect(next[0]).toEqual(start[0]);
    expect(setGateWeeks(start, 0, 0, 2, 6)).toEqual(start);
    expect(JSON.stringify(start)).toBe(frozen);
  });
});
