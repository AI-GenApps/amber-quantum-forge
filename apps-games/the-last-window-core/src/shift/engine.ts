import { DOOR_WAIT_TICKS, PATIENCE_WARNING_TICKS } from "../constants";
import type {
  Outcome,
  SeatState,
  ShiftAction,
  ShiftEvent,
  ShiftResult,
  ShiftState,
  StepResult,
} from "../types";
import { buildResult } from "./grade";
import {
  classifyOutcome,
  faceFor,
  fpFor,
  matchTotals,
  paymentFor,
  scoreTray,
  tipFor,
} from "./serve";
import { cloneState, effectivePatience, emptySeat, reject } from "./state";
import {
  discard,
  drinkStep,
  pastryPick,
  pastryStep,
  pickBook,
  releaseSeat,
  tickStations,
} from "./stations";

export { createShift } from "./state";

function recordRegular(
  state: ShiftState,
  regularId: number | null,
  outcome: Outcome,
  fp: number,
): void {
  if (regularId === null) return;
  const gains = state.stats.fpGains;
  const existing = gains.find((entry) => entry.regularId === regularId);
  if (existing) existing.fp += fp;
  else {
    gains.push({ regularId, fp });
    gains.sort((a, b) => a.regularId - b.regularId);
  }
  state.stats.regularOutcomes.push({ regularId, outcome });
}

function resolveSeat(state: ShiftState, index: number): void {
  releaseSeat(state, index);
  state.seats[index] = emptySeat();
  if (state.active === index) state.active = null;
}

function leaveSeat(state: ShiftState, index: number, events: ShiftEvent[]): void {
  const seat = state.seats[index] as SeatState;
  const customer = seat.customer;
  if (customer === null) return;
  events.push({
    type: "customer-left",
    tick: state.tick,
    seat: index,
    customerId: customer.id,
    face: "sad",
  });
  state.stats.counts.left += 1;
  state.stats.resolved.push("left");
  recordRegular(state, customer.regularId, "left", 0);
  resolveSeat(state, index);
}

function drainPatience(state: ShiftState, events: ShiftEvent[]): void {
  for (let index = 0; index < state.seats.length; index++) {
    const seat = state.seats[index] as SeatState;
    if (seat.customer === null || seat.patienceFree) continue;
    seat.patienceLeft -= 1;
    if (seat.patienceLeft === PATIENCE_WARNING_TICKS) {
      events.push({
        type: "patience-warning",
        tick: state.tick,
        seat: index,
        customerId: seat.customer.id,
      });
    }
    if (seat.patienceLeft <= 0) leaveSeat(state, index, events);
  }
}

function admitArrivals(state: ShiftState): void {
  const arrivals = state.def.arrivals;
  while (state.nextArrival < arrivals.length) {
    const arrival = arrivals[state.nextArrival];
    if (arrival === undefined || arrival.tick > state.tick) break;
    state.door.push({ arrivalIndex: state.nextArrival, since: arrival.tick });
    state.stats.arrived += 1;
    state.nextArrival += 1;
  }
}

function seatDoor(state: ShiftState, events: ShiftEvent[]): void {
  while (state.door.length > 0) {
    const free = state.seats.findIndex((seat) => seat.customer === null);
    if (free < 0) return;
    const entry = state.door.shift();
    const arrival = entry === undefined ? undefined : state.def.arrivals[entry.arrivalIndex];
    if (entry === undefined || arrival === undefined) return;
    const total = effectivePatience(state.def);
    state.seats[free] = {
      ...emptySeat(),
      customer: arrival.customer,
      order: arrival.order,
      arrivalIndex: entry.arrivalIndex,
      patienceTotal: total,
      patienceLeft: total,
      patienceFree: entry.arrivalIndex < state.def.patienceFreeArrivals,
    };
    events.push({
      type: "customer-seated",
      tick: state.tick,
      seat: free,
      customerId: arrival.customer.id,
      order: arrival.order,
    });
  }
}

function turnAway(state: ShiftState, events: ShiftEvent[]): void {
  const kept = [];
  for (const entry of state.door) {
    if (state.tick - entry.since < DOOR_WAIT_TICKS) {
      kept.push(entry);
      continue;
    }
    const customer = state.def.arrivals[entry.arrivalIndex]?.customer;
    if (customer === undefined) continue;
    events.push({ type: "customer-turned-away", tick: state.tick, customerId: customer.id });
    state.stats.turnedAway += 1;
    state.stats.counts.left += 1;
    state.stats.resolved.push("left");
    recordRegular(state, customer.regularId, "left", 0);
  }
  state.door = kept;
}

function updatePhase(state: ShiftState, events: ShiftEvent[]): void {
  if (state.phase === "running" && state.tick >= state.def.lengthTicks) state.phase = "closing";
  if (state.phase !== "closing") return;
  const busy = state.seats.some((seat) => seat.customer !== null) || state.door.length > 0;
  if (busy) return;
  state.phase = "closed";
  events.push({ type: "shift-closed", tick: state.tick });
}

export function tickShift(state: ShiftState): StepResult {
  if (state.phase === "closed") return { state, events: [] };
  const next = cloneState(state);
  const events: ShiftEvent[] = [];
  next.tick += 1;
  tickStations(next, events);
  drainPatience(next, events);
  admitArrivals(next);
  seatDoor(next, events);
  turnAway(next, events);
  updatePhase(next, events);
  return { state: next, events };
}

function serve(state: ShiftState, events: ShiftEvent[]): void {
  const index = state.active;
  const seat = index === null ? null : (state.seats[index] as SeatState);
  if (index === null || seat === null) {
    reject(state, events, "no-active-seat");
    return;
  }
  const customer = seat.customer;
  const order = seat.order;
  if (customer === null || order === null) {
    reject(state, events, "no-customer");
    return;
  }
  const scores = scoreTray(order, seat.tray);
  const { sum, max } = matchTotals(scores);
  const outcome = classifyOutcome(sum, max, seat.patienceLeft, seat.patienceTotal);
  const decor = state.def.decor;
  const payment = paymentFor(order, seat.tray, decor);
  const tip = tipFor(payment, outcome, decor);
  const fp = fpFor(outcome, customer.kind === "regular", decor);
  state.stats.payments += payment;
  state.stats.tips += tip;
  state.stats.counts[outcome] += 1;
  state.stats.resolved.push(outcome);
  recordRegular(state, customer.regularId, outcome, fp);
  events.push({
    type: "served",
    tick: state.tick,
    seat: index,
    customerId: customer.id,
    regularId: customer.regularId,
    outcome,
    payment,
    tip,
    fp,
    face: faceFor(outcome),
    scores,
  });
  resolveSeat(state, index);
}

function selectSeat(state: ShiftState, index: number, events: ShiftEvent[]): void {
  const seat = state.seats[index];
  if (seat === undefined) {
    reject(state, events, "bad-seat");
    return;
  }
  if (seat.customer === null) {
    reject(state, events, "no-customer");
    return;
  }
  state.active = index;
  events.push({ type: "seat-selected", tick: state.tick, seat: index });
}

export function applyAction(state: ShiftState, action: ShiftAction): StepResult {
  const next = cloneState(state);
  const events: ShiftEvent[] = [];
  if (state.phase === "closed") {
    reject(next, events, "closed");
    return { state: next, events };
  }
  switch (action.type) {
    case "selectSeat":
      selectSeat(next, action.seat, events);
      break;
    case "drinkStep":
      drinkStep(next, action.token, events);
      break;
    case "pastryPick":
      pastryPick(next, action.pastryId, events);
      break;
    case "pastryStep":
      pastryStep(next, action.plate, action.token, events);
      break;
    case "pickBook":
      pickBook(next, action.bookId, events);
      break;
    case "discard":
      discard(next, action.item, events);
      break;
    case "serve":
      serve(next, events);
      break;
  }
  updatePhase(next, events);
  return { state: next, events };
}

export function closeShift(state: ShiftState): ShiftResult {
  if (state.phase !== "closed") throw new Error("closeShift needs a closed shift");
  return buildResult(state);
}
