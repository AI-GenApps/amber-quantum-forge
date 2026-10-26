import { drinkRule, pastryRule, stepDuration } from "../rules/items";
import type {
  BookId,
  DiscardItem,
  DrinkToken,
  PastryId,
  PastryToken,
  PlateState,
  SeatState,
  ShiftEvent,
  ShiftState,
} from "../types";
import { reject, seatAt } from "./state";

function activeSeat(state: ShiftState, events: ShiftEvent[]): number | null {
  if (state.active === null) {
    reject(state, events, "no-active-seat");
    return null;
  }
  if (seatAt(state, state.active)?.customer == null) {
    reject(state, events, "no-customer");
    return null;
  }
  return state.active;
}

function finishCup(state: ShiftState, events: ShiftEvent[]): void {
  const cup = state.cup;
  if (cup === null) return;
  const seat = seatAt(state, cup.seat);
  if (seat !== null) seat.tray.drink = cup.drink;
  state.cup = null;
  events.push({ type: "item-ready", tick: state.tick, seat: cup.seat, component: "drink" });
}

export function drinkStep(state: ShiftState, token: DrinkToken, events: ShiftEvent[]): void {
  const cup = state.cup;
  if (cup === null) {
    if (token !== "cup") {
      reject(state, events, "no-cup");
      return;
    }
    const index = activeSeat(state, events);
    if (index === null) return;
    const seat = state.seats[index] as SeatState;
    if (seat.tray.drink !== null || seat.order === null) {
      reject(state, events, "tray-full");
      return;
    }
    state.cup = { seat: index, drink: seat.order.drink, step: 1, lock: 0 };
    events.push({ type: "step-ok", tick: state.tick, station: "drink", token, plate: 0 });
    return;
  }
  if (cup.lock > 0) {
    reject(state, events, "locked");
    return;
  }
  const steps = drinkRule(cup.drink).steps;
  const expected = steps[cup.step] as DrinkToken;
  if (token !== expected) {
    state.cup = null;
    state.stats.mistakes += 1;
    events.push({
      type: "step-wrong",
      tick: state.tick,
      station: "drink",
      token,
      expected,
      plate: 0,
    });
    return;
  }
  cup.step += 1;
  cup.lock = stepDuration(token);
  events.push({ type: "step-ok", tick: state.tick, station: "drink", token, plate: 0 });
  if (cup.lock === 0 && cup.step === steps.length) finishCup(state, events);
}

function finishPlate(state: ShiftState, index: number, events: ShiftEvent[]): void {
  const plate = state.plates[index] as PlateState;
  const seat = seatAt(state, plate.seat);
  if (seat !== null) seat.tray.pastry = plate.pastry;
  state.plates[index] = null;
  events.push({ type: "item-ready", tick: state.tick, seat: plate.seat, component: "pastry" });
}

export function pastryPick(state: ShiftState, pastryId: PastryId, events: ShiftEvent[]): void {
  const index = activeSeat(state, events);
  if (index === null) return;
  const seat = state.seats[index] as SeatState;
  const busy = state.plates.some((plate) => plate !== null && plate.seat === index);
  if (seat.tray.pastry !== null || busy) {
    reject(state, events, "tray-full");
    return;
  }
  const entry = state.stock.find((item) => item.pastry === pastryId);
  if (entry === undefined) {
    reject(state, events, "not-on-shelf");
    return;
  }
  if (entry.portions <= 0) {
    reject(state, events, "out-of-stock");
    return;
  }
  const free = state.plates.indexOf(null);
  if (free < 0) {
    reject(state, events, "no-free-plate");
    return;
  }
  entry.portions -= 1;
  state.plates[free] = { seat: index, pastry: pastryId, step: 1, oven: 0 };
  events.push({
    type: "step-ok",
    tick: state.tick,
    station: "pastry",
    token: "plate",
    plate: free,
  });
}

export function pastryStep(
  state: ShiftState,
  plateIndex: number,
  token: PastryToken,
  events: ShiftEvent[],
): void {
  if (plateIndex < 0 || plateIndex >= state.plates.length) {
    reject(state, events, "bad-plate");
    return;
  }
  const plate = state.plates[plateIndex];
  if (plate === null || plate === undefined) {
    reject(state, events, "no-plate");
    return;
  }
  if (plate.oven > 0) {
    reject(state, events, "locked");
    return;
  }
  const steps = pastryRule(plate.pastry).steps;
  const expected = steps[plate.step] as PastryToken;
  if (token !== expected) {
    state.stats.mistakes += 1;
    events.push({
      type: "step-wrong",
      tick: state.tick,
      station: "pastry",
      token,
      expected,
      plate: plateIndex,
    });
    return;
  }
  plate.step += 1;
  plate.oven = stepDuration(token);
  events.push({ type: "step-ok", tick: state.tick, station: "pastry", token, plate: plateIndex });
  if (plate.oven === 0 && plate.step === steps.length) finishPlate(state, plateIndex, events);
}

export function pickBook(state: ShiftState, bookId: BookId, events: ShiftEvent[]): void {
  const index = activeSeat(state, events);
  if (index === null) return;
  if (!state.shelfBooks.includes(bookId)) {
    reject(state, events, "not-on-shelf");
    return;
  }
  (state.seats[index] as SeatState).tray.book = bookId;
  events.push({ type: "item-ready", tick: state.tick, seat: index, component: "book" });
}

export function discard(state: ShiftState, item: DiscardItem, events: ShiftEvent[]): void {
  if (item.kind === "cup") {
    if (state.cup === null) {
      reject(state, events, "nothing-to-discard");
      return;
    }
    const seat = state.cup.seat;
    state.cup = null;
    events.push({ type: "item-discarded", tick: state.tick, seat, component: "cup" });
    return;
  }
  if (item.kind === "plate") {
    const plate = state.plates[item.plate];
    if (plate === null || plate === undefined) {
      reject(state, events, "nothing-to-discard");
      return;
    }
    state.plates[item.plate] = null;
    events.push({
      type: "item-discarded",
      tick: state.tick,
      seat: plate.seat,
      component: "pastry",
    });
    return;
  }
  const index = activeSeat(state, events);
  if (index === null) return;
  const seat = state.seats[index] as SeatState;
  if (seat.tray[item.slot] === null) {
    reject(state, events, "nothing-to-discard");
    return;
  }
  seat.tray[item.slot] = null;
  events.push({ type: "item-discarded", tick: state.tick, seat: index, component: item.slot });
}

export function tickStations(state: ShiftState, events: ShiftEvent[]): void {
  const cup = state.cup;
  if (cup !== null && cup.lock > 0) {
    cup.lock -= 1;
    if (cup.lock === 0) {
      events.push({ type: "step-ready", tick: state.tick, station: "drink" });
      if (cup.step === drinkRule(cup.drink).steps.length) finishCup(state, events);
    }
  }
  for (let index = 0; index < state.plates.length; index++) {
    const plate = state.plates[index];
    if (plate === null || plate === undefined || plate.oven <= 0) continue;
    plate.oven -= 1;
    if (plate.oven === 0) {
      events.push({ type: "oven-ready", tick: state.tick, plate: index });
      if (plate.step === pastryRule(plate.pastry).steps.length) finishPlate(state, index, events);
    }
  }
}

export function releaseSeat(state: ShiftState, index: number): void {
  if (state.cup !== null && state.cup.seat === index) state.cup = null;
  for (let plate = 0; plate < state.plates.length; plate++) {
    if (state.plates[plate]?.seat === index) state.plates[plate] = null;
  }
}
