import {
  ARRIVAL_CUTOFF_TICKS,
  ARRIVAL_MIN_GAP_TICKS,
  FIRST_ARRIVAL_TICK,
  WALKIN_LOOKS,
} from "../constants";
import { createPrng } from "../prng";
import type { Arrival, Customer, RegularDue, Unlocked, Weather } from "../types";
import { generateOrder } from "./orders";

export interface OrderContext {
  unlocked: Unlocked;
  weather: Weather;
  shelfEmpty: boolean;
}

export function lastArrivalTick(lengthTicks: number): number {
  return lengthTicks - ARRIVAL_CUTOFF_TICKS - 1;
}

export function arrivalTicks(seed: number, count: number, lengthTicks: number): number[] {
  const first = FIRST_ARRIVAL_TICK;
  const span = lastArrivalTick(lengthTicks) - first;
  const slack = span - ARRIVAL_MIN_GAP_TICKS * (count - 1);
  if (count < 1 || slack < 0) {
    throw new RangeError(`cannot fit ${count} arrivals into ${lengthTicks} ticks`);
  }
  const rng = createPrng(seed).fork("ticks");
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    const offset = Math.floor(((i + rng.next()) / count) * (slack + 1));
    ticks.push(first + offset + ARRIVAL_MIN_GAP_TICKS * i);
  }
  return ticks;
}

export function regularCustomer(due: RegularDue): Customer {
  return {
    id: `regular-${due.regularId}`,
    kind: "regular",
    regularId: due.regularId,
    look: 0,
    likes: due.likes,
  };
}

export function buildArrivals(
  seed: number,
  count: number,
  lengthTicks: number,
  regularsDue: readonly RegularDue[],
  context: OrderContext,
): Arrival[] {
  if (count < regularsDue.length) {
    throw new RangeError(`${count} customers cannot hold ${regularsDue.length} regulars`);
  }
  const base = createPrng(seed);
  const lookRng = base.fork("looks");
  const customers: Customer[] = regularsDue.map(regularCustomer);
  for (let i = 0; i < count - regularsDue.length; i++) {
    customers.push({
      id: `walkin-${i + 1}`,
      kind: "walkin",
      regularId: null,
      look: lookRng.int(WALKIN_LOOKS),
      likes: null,
    });
  }
  const order = base.fork("order-of-arrival").shuffle(customers);
  const ticks = arrivalTicks(seed, count, lengthTicks);
  return order.map((customer, index) => {
    const rng = base.fork(`order-${index}`);
    return {
      tick: ticks[index] as number,
      customer,
      order: generateOrder(rng, customer, context.unlocked, context.weather, context.shelfEmpty),
    };
  });
}
