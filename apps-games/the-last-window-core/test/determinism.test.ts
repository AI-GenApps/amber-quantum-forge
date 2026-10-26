import { describe, expect, it } from "vitest";
import { applyAction, createShift, tickShift } from "../src";
import { CASUAL, PERFECT, playShift } from "./helpers/bot";
import { dayDef, deepFreeze, dueList, UNLOCK_ALL } from "./helpers/fixtures";

const stock = {
  pastries: ["pastry-1", "pastry-2", "pastry-3"],
  books: ["book-1", "book-2", "book-3"],
} as const;

function scenario(index: number) {
  const day = (index % 14) + 1;
  const customers = Math.min(14, 6 + (index % 9));
  const due = dueList(
    ...[1 + (index % 8), 1 + ((index + 3) % 8), 1 + ((index + 5) % 8)].filter(
      (v, i, all) => all.indexOf(v) === i,
    ),
  );
  const def = dayDef(day, customers, due, UNLOCK_ALL, stock, index * 101 + 7);
  const policy = index % 2 === 0 ? PERFECT : { ...CASUAL, seed: index };
  return { def, policy };
}

describe("determinism", () => {
  it("100 seeded scenarios repeat as full JSON including every event", () => {
    for (let index = 0; index < 100; index++) {
      const { def, policy } = scenario(index);
      const a = playShift(def, stock, policy);
      const b = playShift(def, stock, policy);
      expect(JSON.stringify({ r: a.result, e: a.events, s: a.state })).toBe(
        JSON.stringify({ r: b.result, e: b.events, s: b.state }),
      );
    }
  });

  it("different seeds give different shifts", () => {
    const a = scenario(3).def;
    const b = { ...a, arrivals: scenario(5).def.arrivals };
    expect(JSON.stringify(a.arrivals)).not.toBe(JSON.stringify(b.arrivals));
  });

  it("inputs are never mutated: deeply frozen states keep working", () => {
    const { def } = scenario(7);
    let state = deepFreeze(createShift(def, stock));
    const before = JSON.stringify(state);
    const actions = [
      { type: "selectSeat", seat: 0 },
      { type: "drinkStep", token: "cup" },
      { type: "serve" },
    ] as const;
    for (let i = 0; i < 300; i++) {
      const frozen = JSON.stringify(state);
      const ticked = tickShift(state);
      expect(JSON.stringify(state)).toBe(frozen);
      state = deepFreeze(ticked.state);
      if (i % 20 === 0) {
        const act = applyAction(state, actions[(i / 20) % 3] as (typeof actions)[number]);
        expect(JSON.stringify(state)).toBe(JSON.stringify(state));
        state = deepFreeze(act.state);
      }
    }
    expect(JSON.stringify(state)).not.toBe(before);
  });

  it("applyAction and tickShift return fresh objects and leave the argument alone", () => {
    const { def } = scenario(2);
    const state = createShift(def, stock);
    const snapshot = JSON.stringify(state);
    const step = tickShift(state);
    const act = applyAction(state, { type: "selectSeat", seat: 0 });
    expect(step.state).not.toBe(state);
    expect(act.state).not.toBe(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("the same tick and action sequence replays to the same state", () => {
    const { def } = scenario(9);
    const run = () => {
      let state = createShift(def, stock);
      const log: unknown[] = [];
      for (let i = 0; i < 400; i++) {
        const step =
          i % 7 === 3 ? applyAction(state, { type: "selectSeat", seat: i % 3 }) : tickShift(state);
        state = step.state;
        log.push(step.events);
      }
      return JSON.stringify({ state, log });
    };
    expect(run()).toBe(run());
  });
});
