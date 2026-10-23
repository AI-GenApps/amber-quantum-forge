import {
  type DrinkId,
  type DrinkToken,
  drinkRule,
  type PastryToken,
  type PlateState,
  pastryRule,
  type ShiftState,
  stepDuration,
} from "@web-games/the-last-window-core";

export interface DrinkGuide {
  drink: DrinkId;
  expected: DrinkToken | null;
  step: number;
  total: number;
  lock: number;
  lockTotal: number;
}

/** What the drink station needs next: continues the cup in use, else starts the active ticket. */
export function drinkGuide(state: ShiftState): DrinkGuide | null {
  const cup = state.cup;
  if (cup !== null) {
    const steps = drinkRule(cup.drink).steps;
    const last = steps[cup.step - 1];
    return {
      drink: cup.drink,
      expected: cup.lock > 0 ? null : ((steps[cup.step] as DrinkToken | undefined) ?? null),
      step: cup.step + 1,
      total: steps.length,
      lock: cup.lock,
      lockTotal: last === undefined ? 0 : stepDuration(last),
    };
  }
  const seat = state.active === null ? null : state.seats[state.active];
  if (!seat || seat.customer === null || seat.order === null || seat.tray.drink !== null) {
    return null;
  }
  return {
    drink: seat.order.drink,
    expected: "cup",
    step: 1,
    total: drinkRule(seat.order.drink).steps.length,
    lock: 0,
    lockTotal: 0,
  };
}

/** The plate that pastry steps apply to: the active seat's plate, else the first plate in use. */
export function targetPlate(state: ShiftState): number | null {
  const own = state.plates.findIndex((plate) => plate !== null && plate.seat === state.active);
  if (own >= 0) return own;
  const any = state.plates.findIndex((plate) => plate !== null);
  return any >= 0 ? any : null;
}

export interface PlateGuide {
  plate: PlateState;
  expected: PastryToken | null;
  step: number;
  total: number;
}

export function plateGuide(plate: PlateState): PlateGuide {
  const steps = pastryRule(plate.pastry).steps;
  const next = steps[plate.step] as PastryToken | undefined;
  return {
    plate,
    expected: plate.oven > 0 ? null : (next ?? null),
    step: plate.step + 1,
    total: steps.length,
  };
}
