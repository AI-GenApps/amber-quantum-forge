import {
  applyAction,
  createShift,
  type ShiftAction,
  type ShiftEvent,
  type ShiftState,
  tickShift,
} from "../../src";

export interface Session {
  state: ShiftState;
  events: ShiftEvent[];
}

export function open(
  def: Parameters<typeof createShift>[0],
  stock: Parameters<typeof createShift>[1],
): Session {
  return { state: createShift(def, stock), events: [] };
}

export function act(session: Session, action: ShiftAction): ShiftEvent[] {
  const step = applyAction(session.state, action);
  session.state = step.state;
  session.events.push(...step.events);
  return step.events;
}

export function tick(session: Session, count = 1): ShiftEvent[] {
  const out: ShiftEvent[] = [];
  for (let i = 0; i < count; i++) {
    const step = tickShift(session.state);
    session.state = step.state;
    out.push(...step.events);
  }
  session.events.push(...out);
  return out;
}

export function tickUntil(session: Session, tickNumber: number): ShiftEvent[] {
  return tick(session, tickNumber - session.state.tick);
}

export function ofType<T extends ShiftEvent["type"]>(
  events: readonly ShiftEvent[],
  type: T,
): Extract<ShiftEvent, { type: T }>[] {
  return events.filter((event): event is Extract<ShiftEvent, { type: T }> => event.type === type);
}

import {
  DRINKS,
  type DrinkToken,
  type Order,
  PASTRIES,
  type PastryToken,
  type StockPlan,
  stepDuration,
} from "../../src";
import { arrival, FULL_STOCK, handDef, walkinCustomer } from "./fixtures";

export function seated(
  orders: readonly Order[],
  options: { stock?: StockPlan; patienceSec?: number; lengthTicks?: number } = {},
): Session {
  const def = handDef({
    arrivals: orders.map((order, i) => arrival(i + 1, walkinCustomer(i + 1), order)),
    patienceSec: options.patienceSec ?? 60,
    lengthTicks: options.lengthTicks ?? 1800,
  });
  const session = open(def, options.stock ?? FULL_STOCK);
  tick(session, orders.length);
  return session;
}

export function makeDrink(session: Session, seat: number): void {
  const order = session.state.seats[seat]?.order;
  if (!order) throw new Error("no order");
  act(session, { type: "selectSeat", seat });
  const rule = DRINKS.find((entry) => entry.id === order.drink);
  for (const token of rule?.steps ?? []) {
    act(session, { type: "drinkStep", token: token as DrinkToken });
    tick(session, stepDuration(token));
  }
}

export function makePastry(session: Session, seat: number): void {
  const order = session.state.seats[seat]?.order;
  if (!order?.pastry) throw new Error("no pastry order");
  act(session, { type: "selectSeat", seat });
  act(session, { type: "pastryPick", pastryId: order.pastry });
  const plate = session.state.plates.findIndex((entry) => entry?.seat === seat);
  const rule = PASTRIES.find((entry) => entry.id === order.pastry);
  for (const token of (rule?.steps ?? []).slice(1)) {
    act(session, { type: "pastryStep", plate, token: token as PastryToken });
    tick(session, stepDuration(token));
  }
}
