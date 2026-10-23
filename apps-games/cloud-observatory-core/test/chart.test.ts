import { describe, expect, it } from "vitest";
import {
  canChart,
  completeChart,
  hitTestStar,
  isSessionComplete,
  minStarDistance,
  starsInsideMargin,
  startChart,
  tapStar,
} from "../src/chart";
import { RULES } from "../src/constants";
import type { ConstellationDef } from "../src/types";
import {
  CATALOG,
  CROWN,
  deepFreeze,
  FULL_CATALOG,
  LYRE,
  ringLayout,
  stateWith,
} from "./fixtures/catalog";

function layout(id: string, count: number, cost = 10): ConstellationDef {
  return {
    id,
    name: id,
    stars: ringLayout(count),
    closed: false,
    cost,
    requires: { instrumentId: "telescope", count: 1 },
  };
}

const FIVE = layout("five", 5);
const SEVEN = layout("seven", 7);
const TEN = layout("ten", 10);
const CHART_CATALOG = { ...CATALOG, constellations: [FIVE, SEVEN, TEN, LYRE, CROWN] };

describe("startChart and tapStar", () => {
  for (const def of [FIVE, SEVEN, TEN]) {
    it(`completes a ${def.stars.length}-star layout in order`, () => {
      let session = startChart(def);
      expect(session).toEqual({
        constellationId: def.id,
        starCount: def.stars.length,
        next: 0,
        mistakes: 0,
      });
      for (let i = 0; i < def.stars.length; i++) {
        const outcome = tapStar(session, i);
        expect(outcome.result).toBe(i === def.stars.length - 1 ? "complete" : "correct");
        session = outcome.session;
      }
      expect(isSessionComplete(session)).toBe(true);
      expect(session.mistakes).toBe(0);
    });
  }

  it("counts a wrong tap as a mistake and never advances", () => {
    const session = startChart(FIVE);
    const first = tapStar(session, 3);
    expect(first.result).toBe("wrong");
    expect(first.session.next).toBe(0);
    expect(first.session.mistakes).toBe(1);
    const second = tapStar(first.session, 4);
    expect(second.session.mistakes).toBe(2);
    expect(second.session.next).toBe(0);
  });

  it("treats an already lit star as a repeat without a mistake", () => {
    const afterOne = tapStar(startChart(FIVE), 0).session;
    const outcome = tapStar(afterOne, 0);
    expect(outcome.result).toBe("repeat");
    expect(outcome.session).toEqual(afterOne);
  });

  it("treats out of range and non integer indices as invalid", () => {
    const session = startChart(FIVE);
    for (const index of [-1, 5, 99, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const outcome = tapStar(session, index);
      expect(outcome.result).toBe("invalid");
      expect(outcome.session).toEqual(session);
    }
  });

  it("any tap after completion is a repeat", () => {
    let session = startChart(FIVE);
    for (let i = 0; i < 5; i++) session = tapStar(session, i).session;
    expect(tapStar(session, 2).result).toBe("repeat");
    expect(tapStar(session, 4).result).toBe("repeat");
  });

  it("a fresh or empty session is not complete", () => {
    expect(isSessionComplete(startChart(FIVE))).toBe(false);
    expect(isSessionComplete(startChart({ ...FIVE, stars: [] }))).toBe(false);
  });

  it("does not mutate a frozen session", () => {
    const session = deepFreeze(startChart(FIVE));
    expect(tapStar(session, 1).result).toBe("wrong");
    expect(session.mistakes).toBe(0);
  });
});

function playThrough(def: ConstellationDef, mistakes: number) {
  let session = startChart(def);
  for (let i = 0; i < mistakes; i++) session = tapStar(session, def.stars.length - 1).session;
  for (let i = 0; i < def.stars.length; i++) session = tapStar(session, i).session;
  return session;
}

describe("canChart", () => {
  it("rejects an unknown constellation", () => {
    expect(canChart(stateWith(), "ghost", CHART_CATALOG)).toEqual({
      ok: false,
      reason: "unknown-id",
    });
  });

  it("rejects an unmet prerequisite", () => {
    expect(canChart(stateWith({ starlight: 1e6 }), "lyre", CHART_CATALOG)).toEqual({
      ok: false,
      reason: "prerequisite-not-met",
    });
  });

  it("rejects when starlight is below the cost", () => {
    const state = stateWith({ starlight: 59.9, owned: { telescope: 2 } });
    expect(canChart(state, "lyre", CHART_CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
  });

  it("rejects a constellation already charted", () => {
    const state = stateWith({ starlight: 1e6, owned: { telescope: 2 }, charted: ["lyre"] });
    expect(canChart(state, "lyre", CHART_CATALOG)).toEqual({
      ok: false,
      reason: "already-charted",
    });
  });

  it("accepts at exactly the cost and reports it", () => {
    const state = stateWith({ starlight: 60, owned: { telescope: 2 } });
    expect(canChart(state, "lyre", CHART_CATALOG)).toEqual({ ok: true, cost: 60 });
  });

  it("applies the cost multiplier", () => {
    const state = stateWith({ starlight: 57, owned: { telescope: 2 }, boons: ["clear-glass"] });
    const check = canChart(state, "lyre", FULL_CATALOG);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.cost).toBeCloseTo(57, 12);
  });
});

describe("completeChart", () => {
  const ready = stateWith({ starlight: 100, owned: { telescope: 2 } });

  it("pays the cost on completion, records the id and flawless", () => {
    const result = completeChart(ready, playThrough(LYRE, 0), CHART_CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starlight).toBe(40);
    expect(result.state.charted).toEqual(["lyre"]);
    expect(result.flawless).toBe(true);
    expect(result.mistakes).toBe(0);
    expect(result.cost).toBe(60);
    expect(result.events).toEqual([
      { type: "charted", constellationId: "lyre", cost: 60, mistakes: 0, flawless: true },
    ]);
  });

  it("is flawless only with zero mistakes", () => {
    const result = completeChart(ready, playThrough(LYRE, 2), CHART_CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.flawless).toBe(false);
    expect(result.mistakes).toBe(2);
    expect(result.events[0]).toMatchObject({ type: "charted", flawless: false, mistakes: 2 });
  });

  it("charts nothing for an incomplete session", () => {
    const partial = tapStar(startChart(LYRE), 0).session;
    expect(completeChart(ready, partial, CHART_CATALOG)).toEqual({
      ok: false,
      reason: "session-incomplete",
    });
  });

  it("fails when starlight is below the cost", () => {
    const poor = stateWith({ starlight: 59, owned: { telescope: 2 } });
    expect(completeChart(poor, playThrough(LYRE, 0), CHART_CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
  });

  it("fails when the prerequisite is unmet", () => {
    const state = stateWith({ starlight: 1000, owned: { telescope: 1 } });
    expect(completeChart(state, playThrough(LYRE, 0), CHART_CATALOG)).toEqual({
      ok: false,
      reason: "prerequisite-not-met",
    });
  });

  it("cannot chart twice", () => {
    const first = completeChart(ready, playThrough(LYRE, 0), CHART_CATALOG);
    if (!first.ok) throw new Error("expected success");
    const again = completeChart(
      { ...first.state, starlight: 1000 },
      playThrough(LYRE, 0),
      CHART_CATALOG,
    );
    expect(again).toEqual({ ok: false, reason: "already-charted" });
  });

  it("rejects an unknown constellation id", () => {
    const session = { constellationId: "ghost", starCount: 3, next: 3, mistakes: 0 };
    expect(completeChart(ready, session, CHART_CATALOG)).toEqual({
      ok: false,
      reason: "unknown-id",
    });
  });

  it("does not mutate frozen input", () => {
    const state = deepFreeze({ ...ready });
    const result = completeChart(
      state,
      deepFreeze(playThrough(LYRE, 0)),
      deepFreeze({ ...CHART_CATALOG }),
    );
    expect(result.ok).toBe(true);
    expect(state.charted).toEqual([]);
  });
});

describe("hitTestStar", () => {
  const stars = [
    { x: 100, y: 100 },
    { x: 130, y: 100 },
    { x: 500, y: 500 },
  ];

  it("picks the nearest star within the radius", () => {
    expect(hitTestStar(stars, { x: 118, y: 100 }, 40)).toBe(1);
    expect(hitTestStar(stars, { x: 108, y: 100 }, 40)).toBe(0);
    expect(hitTestStar(stars, { x: 500, y: 520 }, 24)).toBe(2);
  });

  it("includes the radius itself and excludes beyond it", () => {
    expect(hitTestStar(stars, { x: 524, y: 500 }, 24)).toBe(2);
    expect(hitTestStar(stars, { x: 525, y: 500 }, 24)).toBeNull();
  });

  it("returns null with no stars or no star nearby", () => {
    expect(hitTestStar([], { x: 0, y: 0 }, 50)).toBeNull();
    expect(hitTestStar(stars, { x: 900, y: 900 }, 50)).toBeNull();
  });
});

describe("layout helpers", () => {
  it("measures the minimum spacing", () => {
    expect(
      minStarDistance([
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { x: 100, y: 100 },
      ]),
    ).toBe(5);
    expect(minStarDistance([{ x: 0, y: 0 }])).toBe(Number.POSITIVE_INFINITY);
    expect(minStarDistance([])).toBe(Number.POSITIVE_INFINITY);
  });

  it("accepts good layouts and flags bad ones for spacing", () => {
    for (const def of [LYRE, CROWN, FIVE, SEVEN, TEN]) {
      expect(minStarDistance(def.stars)).toBeGreaterThanOrEqual(RULES.STAR_MIN_SPACING);
    }
    const crowded = [
      { x: 400, y: 400 },
      { x: 500, y: 400 },
    ];
    expect(minStarDistance(crowded)).toBeLessThan(RULES.STAR_MIN_SPACING);
  });

  it("checks the margin on all four sides, edges inclusive", () => {
    expect(starsInsideMargin(LYRE.stars)).toBe(true);
    expect(
      starsInsideMargin([
        { x: 100, y: 100 },
        { x: 900, y: 1300 },
      ]),
    ).toBe(true);
    expect(starsInsideMargin([{ x: 99, y: 500 }])).toBe(false);
    expect(starsInsideMargin([{ x: 901, y: 500 }])).toBe(false);
    expect(starsInsideMargin([{ x: 500, y: 99 }])).toBe(false);
    expect(starsInsideMargin([{ x: 500, y: 1301 }])).toBe(false);
    expect(starsInsideMargin([])).toBe(true);
  });
});
