import { describe, expect, it } from "vitest";
import {
  applyAction,
  closeShift,
  createPrng,
  createShift,
  DRINK_TOKENS,
  PASTRY_TOKENS,
  type ShiftAction,
  tickShift,
} from "../src";
import { CASUAL, PERFECT, playShift } from "./helpers/bot";
import { dayDef, deepFreeze, dueList, UNLOCK_ALL, UNLOCK_DAY1 } from "./helpers/fixtures";
import { violations } from "./helpers/invariants";

const stocks = [
  { pastries: ["pastry-1", "pastry-2", "pastry-3"], books: ["book-1", "book-2", "book-3"] },
  { pastries: [], books: ["book-4"] },
  { pastries: ["pastry-5", "pastry-4"], books: ["book-5", "book-1", "book-2"] },
] as const;

function randomAction(rng: ReturnType<typeof createPrng>): ShiftAction {
  switch (rng.int(8)) {
    case 0:
      return { type: "selectSeat", seat: rng.int(5) - 1 };
    case 1:
      return { type: "drinkStep", token: rng.pick(DRINK_TOKENS) };
    case 2:
      return {
        type: "pastryPick",
        pastryId: rng.pick(["pastry-1", "pastry-2", "pastry-4", "pastry-5"]),
      };
    case 3:
      return { type: "pastryStep", plate: rng.int(4) - 1, token: rng.pick(PASTRY_TOKENS) };
    case 4:
      return { type: "pickBook", bookId: rng.pick(["book-1", "book-2", "book-4", "book-5"]) };
    case 5:
      return {
        type: "discard",
        item: rng.pick([
          { kind: "cup" },
          { kind: "plate", plate: rng.int(3) },
          { kind: "tray", slot: rng.pick(["drink", "pastry", "book"] as const) },
        ] as const),
      };
    default:
      return { type: "serve" };
  }
}

describe("random play never breaks the engine", () => {
  it("100 seeds of random actions keep every invariant and repeat exactly", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const day = (seed % 14) + 1;
      const stock = stocks[seed % stocks.length] as (typeof stocks)[number];
      const unlocked = seed % 5 === 0 ? UNLOCK_DAY1 : UNLOCK_ALL;
      const def = dayDef(
        day,
        6 + (seed % 9),
        dueList(1 + (seed % 8), 1 + ((seed + 2) % 8)),
        unlocked,
        stock,
        seed,
      );
      const play = (): string => {
        const rng = createPrng(seed).fork("fuzz");
        let state = deepFreeze(createShift(def, stock));
        const log: unknown[] = [];
        for (let i = 0; i < def.lengthTicks + 1500 && state.phase !== "closed"; i++) {
          if (rng.int(100) < 45) {
            const step = applyAction(state, randomAction(rng));
            state = deepFreeze(step.state);
            log.push(step.events);
          }
          const step = tickShift(state);
          state = deepFreeze(step.state);
          log.push(step.events);
          const broken = violations(state);
          if (broken.length > 0)
            throw new Error(`seed ${seed} tick ${state.tick}: ${broken.join("; ")}`);
        }
        expect(state.phase).toBe("closed");
        const result = closeShift(state);
        expect(result.coins).toBeGreaterThanOrEqual(5);
        expect(result.payments).toBeGreaterThanOrEqual(0);
        expect(result.tips).toBeGreaterThanOrEqual(0);
        return JSON.stringify({ result, log });
      };
      expect(play()).toBe(play());
    }
  });

  it("100 seeds of bot play (perfect and casual) never throw and keep coins non-negative", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const day = (seed % 14) + 1;
      const stock = stocks[seed % stocks.length] as (typeof stocks)[number];
      const def = dayDef(
        day,
        6 + (seed % 9),
        dueList(1 + (seed % 8), 1 + ((seed + 3) % 8)),
        UNLOCK_ALL,
        stock,
        seed * 3,
      );
      const policy = seed % 2 === 0 ? PERFECT : { ...CASUAL, seed };
      const a = playShift(def, stock, policy);
      const b = playShift(def, stock, policy);
      expect(a.state.phase).toBe("closed");
      expect(a.result.coins).toBeGreaterThanOrEqual(5);
      expect(violations(a.state)).toEqual([]);
      expect(a.result).toEqual(b.result);
      expect(a.result.arrived).toBe(def.arrivals.length);
    }
  });
});
