import { describe, expect, it } from "vitest";
import { type ChartSession, startChart, tapStar } from "../src/chart";
import { type Action, reduce } from "../src/reducer";
import { createInitialState, sanitizeState } from "../src/state";
import type { GameEvent, GameState, RejectReason } from "../src/types";
import { CATALOG, deepFreeze, FULL_CATALOG, LYRE, stateWith } from "./fixtures/catalog";

function lyreSession(mistakes: number): ChartSession {
  let session = startChart(LYRE);
  for (let i = 0; i < mistakes; i++) session = tapStar(session, 4).session;
  for (let i = 0; i < LYRE.stars.length; i++) session = tapStar(session, i).session;
  return session;
}

const gatherAction: Action = { type: "gather" };

const SCRIPT: readonly Action[] = [
  gatherAction,
  gatherAction,
  gatherAction,
  gatherAction,
  gatherAction,
  { type: "buy-instrument", id: "telescope", quantity: 1 },
  { type: "buy-instrument", id: "lens", quantity: 1 },
  { type: "tick", seconds: 50 },
  gatherAction,
  gatherAction,
  gatherAction,
  gatherAction,
  gatherAction,
  { type: "buy-instrument", id: "telescope", quantity: 1 },
  { type: "tick", seconds: 10 },
  { type: "buy-instrument", id: "telescope", quantity: 1 },
  { type: "tick", seconds: 300 },
  { type: "complete-chart", session: lyreSession(1) },
  { type: "buy-instrument", id: "telescope", quantity: "max" },
  { type: "buy-upgrade", id: "tel-1" },
  { type: "tick", seconds: 600 },
  { type: "buy-instrument", id: "telescope", quantity: 6 },
  { type: "buy-upgrade", id: "tel-1" },
  { type: "buy-instrument", id: "lens", quantity: 1 },
  { type: "tick", seconds: 100 },
  gatherAction,
  { type: "buy-boon", id: "dark-adapted" },
  { type: "eclipse" },
  { type: "offline", elapsed: 3600 },
  { type: "buy-upgrade", id: "lens-1" },
];

const EXPECTED_FAILURES: Readonly<Record<number, RejectReason>> = {
  7: "insufficient-starlight",
  14: "insufficient-starlight",
  20: "threshold-not-met",
  27: "insufficient-shards",
  28: "eclipse-unavailable",
  30: "threshold-not-met",
};

function play(): { state: GameState; events: GameEvent[]; log: ReturnType<typeof reduce>[] } {
  let state = createInitialState(CATALOG);
  const events: GameEvent[] = [];
  const log: ReturnType<typeof reduce>[] = [];
  for (const action of SCRIPT) {
    const result = reduce(state, action, CATALOG);
    state = result.state;
    events.push(...result.events);
    log.push(result);
  }
  return { state, events, log };
}

describe("reduce: scripted playthrough", () => {
  it("has exactly 30 actions", () => {
    expect(SCRIPT).toHaveLength(30);
  });

  it("rejects exactly the expected steps with the expected reasons", () => {
    const { log } = play();
    log.forEach((result, index) => {
      const step = index + 1;
      const expected = EXPECTED_FAILURES[step];
      expect(result.ok, `step ${step}`).toBe(expected === undefined);
      expect(result.reason, `step ${step}`).toBe(expected);
      if (expected !== undefined) expect(result.events).toEqual([]);
    });
  });

  it("emits the expected event sequence", () => {
    const sixTelescopes = 15 * 1.12 ** 4 * ((1.12 ** 6 - 1) / 0.12);
    const { events } = play();
    expect(events).toHaveLength(7);
    expect(events[0]).toEqual({
      type: "purchased",
      instrumentId: "telescope",
      quantity: 1,
      cost: 15,
    });
    expect(events[1]).toMatchObject({ type: "purchased", instrumentId: "telescope", quantity: 1 });
    expect(events[2]).toEqual({
      type: "charted",
      constellationId: "lyre",
      cost: 60,
      mistakes: 1,
      flawless: false,
    });
    expect(events[3]).toMatchObject({ type: "purchased", instrumentId: "telescope", quantity: 2 });
    expect(events[4]).toMatchObject({ type: "purchased", instrumentId: "telescope", quantity: 6 });
    expect(events[5]).toEqual({ type: "upgraded", upgradeId: "tel-1", cost: 150 });
    expect(events[6]).toEqual({ type: "purchased", instrumentId: "lens", quantity: 1, cost: 100 });
    const cost = events[4];
    if (cost?.type !== "purchased") throw new Error("expected a purchase");
    expect(cost.cost).toBeCloseTo(sixTelescopes, 9);
  });

  it("reaches the known end state", () => {
    const sixTelescopes = 15 * 1.12 ** 4 * ((1.12 ** 6 - 1) / 0.12);
    const twoTelescopes = 15 * 1.12 ** 2 * (1 + 1.12);
    const expectedStarlight =
      10 +
      5 -
      15 +
      10 +
      5 +
      2 -
      15 * 1.12 +
      120 -
      60 -
      twoTelescopes +
      504 -
      sixTelescopes -
      150 -
      100 +
      546 +
      2.1 +
      9828;
    const { state } = play();
    expect(state.owned).toEqual({ telescope: 10, lens: 1 });
    expect(state.upgrades).toEqual(["tel-1"]);
    expect(state.charted).toEqual(["lyre"]);
    expect(state.boons).toEqual([]);
    expect(state.shards).toBe(0);
    expect(state.eclipses).toBe(0);
    expect(state.taps).toBe(11);
    expect(state.cycleSeconds).toBe(1060);
    expect(state.cycleStarlight).toBeCloseTo(11022.1, 6);
    expect(state.lifetimeStarlight).toBeCloseTo(11022.1, 6);
    expect(state.starlight).toBeCloseTo(expectedStarlight, 6);
    expect(state.starlight).toBeCloseTo(10458.87, 2);
  });

  it("is deterministic and the end state survives a save round trip", () => {
    const first = play().state;
    const second = play().state;
    expect(second).toEqual(first);
    expect(sanitizeState(JSON.parse(JSON.stringify(first)), CATALOG)).toEqual(first);
  });
});

describe("reduce: single actions", () => {
  it("accepts gather and tick with no events", () => {
    const state = stateWith();
    expect(reduce(state, gatherAction, CATALOG)).toMatchObject({ ok: true, events: [] });
    expect(reduce(state, { type: "tick", seconds: 5 }, CATALOG)).toMatchObject({
      ok: true,
      events: [],
    });
  });

  it("reports the reason and keeps the state on rejection", () => {
    const state = stateWith();
    const result = reduce(state, { type: "buy-boon", id: "ghost" }, CATALOG);
    expect(result).toEqual({ state, events: [], ok: false, reason: "unknown-id" });
  });

  it("runs an Eclipse through the reducer", () => {
    const state = stateWith({ cycleStarlight: 1e11, boons: ["dark-adapted"] });
    const result = reduce(state, { type: "eclipse" }, FULL_CATALOG);
    expect(result.ok).toBe(true);
    expect(result.state.shards).toBe(10);
    expect(result.state.starlight).toBe(1000);
    expect(result.events).toEqual([{ type: "eclipsed", shards: 10, eclipses: 1 }]);
  });

  it("does not mutate frozen input for any action", () => {
    const state = deepFreeze(stateWith({ starlight: 500, shards: 3, owned: { telescope: 10 } }));
    const catalog = deepFreeze({ ...CATALOG });
    const actions: Action[] = [
      gatherAction,
      { type: "tick", seconds: 3 },
      { type: "offline", elapsed: 100 },
      { type: "buy-instrument", id: "telescope", quantity: 1 },
      { type: "buy-upgrade", id: "tel-1" },
      { type: "buy-boon", id: "dark-adapted" },
      { type: "complete-chart", session: lyreSession(0) },
      { type: "eclipse" },
    ];
    for (const action of actions) expect(() => reduce(state, action, catalog)).not.toThrow();
  });
});
