import {
  ARRIVAL_CUTOFF_TICKS,
  PLATES,
  PORTIONS_PER_KIND,
  RELAXED_MULTIPLIER,
  SEATS,
} from "../constants";
import { shelfBooks } from "../rules/stock";
import type {
  Order,
  SeatState,
  ShiftDef,
  ShiftEvent,
  ShiftState,
  ShiftStats,
  StockPlan,
  Tray,
} from "../types";

export function emptyTray(): Tray {
  return { drink: null, pastry: null, book: null };
}

export function emptySeat(): SeatState {
  return {
    customer: null,
    order: null,
    arrivalIndex: -1,
    patienceTotal: 0,
    patienceLeft: 0,
    patienceFree: false,
    face: "neutral",
    tray: emptyTray(),
  };
}

function emptyStats(): ShiftStats {
  return {
    payments: 0,
    tips: 0,
    arrived: 0,
    counts: { delighted: 0, satisfied: 0, disappointed: 0, left: 0 },
    turnedAway: 0,
    mistakes: 0,
    fpGains: [],
    regularOutcomes: [],
    resolved: [],
  };
}

export function effectivePatience(def: ShiftDef): number {
  return def.relaxed
    ? Math.floor(def.basePatienceTicks * RELAXED_MULTIPLIER)
    : def.basePatienceTicks;
}

export function stripPastry(order: Order): Order {
  return { drink: order.drink, pastry: null, mood: order.mood };
}

export function createShift(def: ShiftDef, stock: StockPlan): ShiftState {
  const kinds = stock.pastries.filter((id, index) => stock.pastries.indexOf(id) === index);
  const cutoff = def.lengthTicks - ARRIVAL_CUTOFF_TICKS;
  const arrivals = def.arrivals
    .filter((arrival) => arrival.tick < cutoff)
    .map((arrival) =>
      kinds.length === 0 ? { ...arrival, order: stripPastry(arrival.order) } : arrival,
    );
  return {
    def: { ...def, arrivals },
    tick: 0,
    phase: "running",
    seats: Array.from({ length: SEATS }, emptySeat),
    active: null,
    door: [],
    nextArrival: 0,
    cup: null,
    plates: Array.from({ length: PLATES }, () => null),
    stock: kinds.map((pastry) => ({ pastry, portions: PORTIONS_PER_KIND })),
    shelfBooks: shelfBooks(stock, def.unlocked, def.decor.shelfSlots),
    stats: emptyStats(),
  };
}

export function cloneState(state: ShiftState): ShiftState {
  return {
    ...state,
    seats: state.seats.map((seat) => ({ ...seat, tray: { ...seat.tray } })),
    door: state.door.map((entry) => ({ ...entry })),
    cup: state.cup === null ? null : { ...state.cup },
    plates: state.plates.map((plate) => (plate === null ? null : { ...plate })),
    stock: state.stock.map((entry) => ({ ...entry })),
    stats: {
      ...state.stats,
      counts: { ...state.stats.counts },
      fpGains: state.stats.fpGains.map((entry) => ({ ...entry })),
      regularOutcomes: state.stats.regularOutcomes.map((entry) => ({ ...entry })),
      resolved: state.stats.resolved.slice(),
    },
  };
}

export function seatAt(state: ShiftState, seat: number): SeatState | null {
  return state.seats[seat] ?? null;
}

export function reject(
  state: ShiftState,
  events: ShiftEvent[],
  reason: Extract<ShiftEvent, { type: "action-rejected" }>["reason"],
): void {
  events.push({ type: "action-rejected", tick: state.tick, reason });
}
