import { describe, expect, it } from "vitest";
import {
  ARRIVAL_CUTOFF_TICKS,
  ARRIVAL_MIN_GAP_TICKS,
  arrivalTicks,
  buildArrivals,
  FIRST_ARRIVAL_TICK,
  lastArrivalTick,
} from "../src";
import { dueList, UNLOCK_ALL, UNLOCK_DAY1 } from "./helpers/fixtures";

const ctx = { unlocked: UNLOCK_ALL, weather: "evening", shelfEmpty: false } as const;

describe("arrivalTicks", () => {
  it("keeps the cut-off, the spacing and the first-arrival floor for many seeds and sizes", () => {
    for (const length of [1800, 2100, 2400]) {
      for (let count = 1; count <= 14; count++) {
        for (let seed = 1; seed <= 25; seed++) {
          const ticks = arrivalTicks(seed * 31, count, length);
          expect(ticks).toHaveLength(count);
          expect(ticks[0]).toBeGreaterThanOrEqual(FIRST_ARRIVAL_TICK);
          expect(ticks[count - 1]).toBeLessThanOrEqual(lastArrivalTick(length));
          expect(ticks[count - 1]).toBeLessThan(length - ARRIVAL_CUTOFF_TICKS);
          for (let i = 1; i < count; i++) {
            expect((ticks[i] as number) - (ticks[i - 1] as number)).toBeGreaterThanOrEqual(
              ARRIVAL_MIN_GAP_TICKS,
            );
          }
        }
      }
    }
  });

  it("is deterministic and varies with the seed", () => {
    expect(arrivalTicks(9, 8, 2100)).toEqual(arrivalTicks(9, 8, 2100));
    expect(arrivalTicks(9, 8, 2100)).not.toEqual(arrivalTicks(10, 8, 2100));
  });

  it("is hard-coded stable for a sample", () => {
    expect(arrivalTicks(1, 6, 1800)).toEqual([228, 435, 583, 834, 1184, 1447]);
  });

  it("spreads arrivals over the open part of the shift", () => {
    const ticks = arrivalTicks(3, 12, 2400);
    expect(ticks[0] as number).toBeLessThan(400);
    expect(ticks[11] as number).toBeGreaterThan(1500);
  });

  it("refuses impossible counts", () => {
    expect(() => arrivalTicks(1, 0, 1800)).toThrow(RangeError);
    expect(() => arrivalTicks(1, 80, 1800)).toThrow(RangeError);
  });
});

describe("buildArrivals", () => {
  const due = dueList(1, 2, 3);
  it("holds every regular exactly once plus walk-ins to reach the count", () => {
    const arrivals = buildArrivals(7, 6, 1800, due, ctx);
    expect(arrivals).toHaveLength(6);
    const regulars = arrivals.filter((a) => a.customer.kind === "regular");
    expect(regulars.map((a) => a.customer.regularId).sort()).toEqual([1, 2, 3]);
    expect(arrivals.filter((a) => a.customer.kind === "walkin")).toHaveLength(3);
    expect(new Set(arrivals.map((a) => a.customer.id)).size).toBe(6);
  });

  it("shuffles the order of regulars and walk-ins across seeds", () => {
    const orders = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      orders.add(
        buildArrivals(seed, 6, 1800, due, ctx)
          .map((a) => a.customer.kind[0])
          .join(""),
      );
    }
    expect(orders.size).toBeGreaterThan(3);
  });

  it("gives ticks that respect the cut-off and are increasing", () => {
    const arrivals = buildArrivals(8, 12, 2400, dueList(1, 2, 3, 4, 5, 6, 7, 8), ctx);
    const ticks = arrivals.map((a) => a.tick);
    expect(ticks).toEqual(arrivalTicks(8, 12, 2400));
    expect(Math.max(...ticks)).toBeLessThan(2400 - ARRIVAL_CUTOFF_TICKS);
  });

  it("is deterministic as JSON", () => {
    const a = buildArrivals(21, 9, 2100, dueList(3, 5, 6), ctx);
    const b = buildArrivals(21, 9, 2100, dueList(3, 5, 6), ctx);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("generates orders from the unlocked ids and the empty-shelf exception", () => {
    const early = buildArrivals(4, 8, 1800, due, {
      unlocked: UNLOCK_DAY1,
      weather: "morning",
      shelfEmpty: false,
    });
    for (const a of early) expect(UNLOCK_DAY1.drinks).toContain(a.order.drink);
    const empty = buildArrivals(4, 40, 2400, due, {
      unlocked: UNLOCK_ALL,
      weather: "morning",
      shelfEmpty: true,
    });
    for (const a of empty) expect(a.order.pastry).toBeNull();
  });

  it("gives walk-ins one of six looks and regulars no likes for walk-ins", () => {
    const arrivals = buildArrivals(2, 14, 2400, [], ctx);
    for (const a of arrivals) {
      expect(a.customer.likes).toBeNull();
      expect(a.customer.look).toBeGreaterThanOrEqual(0);
      expect(a.customer.look).toBeLessThan(6);
    }
  });

  it("refuses more regulars than customers", () => {
    expect(() => buildArrivals(1, 2, 1800, due, ctx)).toThrow(RangeError);
  });
});
