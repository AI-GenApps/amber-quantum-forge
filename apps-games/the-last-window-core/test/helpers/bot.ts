import {
  applyAction,
  type BookId,
  bookCarriesMood,
  closeShift,
  createPrng,
  createShift,
  DRINK_TOKENS,
  type DrinkToken,
  drinkRule,
  PASTRY_TOKENS,
  type PastryToken,
  type Prng,
  pastryRule,
  type SeatState,
  type ShiftAction,
  type ShiftDef,
  type ShiftEvent,
  type ShiftResult,
  type ShiftState,
  type StockPlan,
  tickShift,
} from "../../src";

export interface BotPolicy {
  name: string;
  reactionTicks: number;
  wrongPct: number;
  urgentFirst: boolean;
  seed: number;
}

export const PERFECT: BotPolicy = {
  name: "perfect",
  reactionTicks: 3,
  wrongPct: 0,
  urgentFirst: true,
  seed: 11,
};

export const CASUAL: BotPolicy = {
  name: "casual",
  reactionTicks: 25,
  wrongPct: 20,
  urgentFirst: false,
  seed: 23,
};

export interface BotRun {
  result: ShiftResult;
  state: ShiftState;
  events: ShiftEvent[];
  actions: number;
}

function seatOrder(state: ShiftState, policy: BotPolicy): number[] {
  const seats = state.seats
    .map((seat, index) => ({ seat, index }))
    .filter((entry) => entry.seat.customer !== null);
  if (policy.urgentFirst) {
    seats.sort((a, b) => a.seat.patienceLeft - b.seat.patienceLeft || a.index - b.index);
  }
  return seats.map((entry) => entry.index);
}

function pastryChoice(state: ShiftState, seat: SeatState): string | null {
  const wanted = seat.order?.pastry ?? null;
  if (wanted === null) return null;
  const stocked = state.stock.filter((entry) => entry.portions > 0);
  if (stocked.some((entry) => entry.pastry === wanted)) return wanted;
  return stocked[0]?.pastry ?? null;
}

function bookChoice(
  state: ShiftState,
  seat: SeatState,
  rng: Prng,
  policy: BotPolicy,
): BookId | null {
  const mood = seat.order?.mood ?? null;
  if (mood === null || state.shelfBooks.length === 0) return null;
  const match = state.shelfBooks.find((id) => bookCarriesMood(id, mood));
  if (match !== undefined && (policy.wrongPct === 0 || rng.int(100) < 80)) return match;
  return policy.wrongPct === 0 ? (state.shelfBooks[0] as BookId) : rng.pick(state.shelfBooks);
}

function wrongToken<T extends string>(rng: Prng, all: readonly T[], expected: T): T {
  return rng.pick(all.filter((token) => token !== expected));
}

function select(state: ShiftState, index: number): ShiftAction | null {
  return state.active === index ? null : { type: "selectSeat", seat: index };
}

function nextAction(state: ShiftState, policy: BotPolicy, rng: Prng): ShiftAction | null {
  const order = seatOrder(state, policy);
  for (const index of order) {
    const seat = state.seats[index] as SeatState;
    const need = seat.order;
    if (need === null) continue;
    const pastry = pastryChoice(state, seat);
    const plateBusy = state.plates.some((plate) => plate?.seat === index);
    const cupBusy = state.cup?.seat === index;
    const hasPastry = need.pastry === null || pastry === null || seat.tray.pastry !== null;
    const hasBook = need.mood === null || state.shelfBooks.length === 0 || seat.tray.book !== null;
    if (seat.tray.drink !== null && hasPastry && hasBook && !plateBusy && !cupBusy) {
      return select(state, index) ?? { type: "serve" };
    }
  }
  const cup = state.cup;
  if (cup !== null && cup.lock === 0) {
    const expected = drinkRule(cup.drink).steps[cup.step] as DrinkToken;
    const token =
      rng.int(100) < policy.wrongPct ? wrongToken(rng, DRINK_TOKENS, expected) : expected;
    return { type: "drinkStep", token };
  }
  for (let plate = 0; plate < state.plates.length; plate++) {
    const entry = state.plates[plate];
    if (entry === null || entry === undefined || entry.oven > 0) continue;
    const expected = pastryRule(entry.pastry).steps[entry.step] as PastryToken;
    const token =
      rng.int(100) < policy.wrongPct ? wrongToken(rng, PASTRY_TOKENS, expected) : expected;
    return { type: "pastryStep", plate, token };
  }
  for (const index of order) {
    const seat = state.seats[index] as SeatState;
    const need = seat.order;
    if (need === null) continue;
    const pastry = pastryChoice(state, seat);
    const plateBusy = state.plates.some((plate) => plate?.seat === index);
    const hasFree = state.plates.some((plate) => plate === null);
    const wantsPastry = pastry !== null && seat.tray.pastry === null && !plateBusy && hasFree;
    const wantsBook = need.mood !== null && state.shelfBooks.length > 0 && seat.tray.book === null;
    const wantsDrink = seat.tray.drink === null && state.cup === null;
    if (!wantsPastry && !wantsBook && !wantsDrink) continue;
    const pick = select(state, index);
    if (pick !== null) return pick;
    if (wantsPastry && pastry !== null) {
      return { type: "pastryPick", pastryId: pastry as never };
    }
    if (wantsDrink) return { type: "drinkStep", token: "cup" };
    const book = bookChoice(state, seat, rng, policy);
    if (book !== null) return { type: "pickBook", bookId: book };
  }
  return null;
}

export function playShift(def: ShiftDef, stock: StockPlan, policy: BotPolicy): BotRun {
  let state = createShift(def, stock);
  const rng = createPrng(policy.seed).fork(`bot-${def.seed}`);
  const events: ShiftEvent[] = [];
  let cooldown = 0;
  let actions = 0;
  const limit = def.lengthTicks + 5000;
  for (let guard = 0; state.phase !== "closed" && guard < limit; guard++) {
    if (cooldown > 0) cooldown -= 1;
    else {
      const action = nextAction(state, policy, rng);
      if (action !== null) {
        const step = applyAction(state, action);
        state = step.state;
        events.push(...step.events);
        actions += 1;
        cooldown = policy.reactionTicks;
      }
    }
    const step = tickShift(state);
    state = step.state;
    events.push(...step.events);
  }
  return { result: closeShift(state), state, events, actions };
}
