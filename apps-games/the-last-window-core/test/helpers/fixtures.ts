import {
  type Arrival,
  buildArrivals,
  type Customer,
  type DecorEffects,
  decorEffects,
  type Likes,
  noDecorEffects,
  type Order,
  patienceSeconds,
  patienceTicks,
  type RegularDue,
  type ShiftDef,
  type StockPlan,
  shiftLengthForDay,
  type Unlocked,
  type Weather,
  weatherForDay,
} from "../../src";

export const UNLOCK_DAY1: Unlocked = {
  drinks: ["drink-1", "drink-3"],
  pastries: ["pastry-1"],
  books: ["book-1"],
};

export const UNLOCK_ALL: Unlocked = {
  drinks: ["drink-1", "drink-2", "drink-3", "drink-4", "drink-5", "drink-6"],
  pastries: ["pastry-1", "pastry-2", "pastry-3", "pastry-4", "pastry-5"],
  books: ["book-1", "book-2", "book-3", "book-4", "book-5"],
};

const LIKES: readonly Likes[] = [
  { drink: "drink-1", pastry: "pastry-1", moods: ["wistful", "comforting"] },
  { drink: "drink-2", pastry: "pastry-2", moods: ["funny", "adventurous"] },
  { drink: "drink-3", pastry: "pastry-3", moods: ["curious", "comforting"] },
  { drink: "drink-5", pastry: "pastry-4", moods: ["adventurous", "funny"] },
  { drink: "drink-6", pastry: "pastry-5", moods: ["funny", "comforting"] },
  { drink: "drink-4", pastry: "pastry-2", moods: ["comforting", "wistful"] },
  { drink: "drink-3", pastry: "pastry-1", moods: ["curious", "wistful"] },
  { drink: "drink-2", pastry: "pastry-3", moods: ["adventurous", "curious"] },
];

export function regularDue(id: number): RegularDue {
  return { regularId: id, likes: LIKES[id - 1] as Likes };
}

export function dueList(...ids: number[]): RegularDue[] {
  return ids.map(regularDue);
}

export function walkinCustomer(n: number): Customer {
  return { id: `walkin-${n}`, kind: "walkin", regularId: null, look: n % 6, likes: null };
}

export function regularCustomerOf(id: number): Customer {
  return {
    id: `regular-${id}`,
    kind: "regular",
    regularId: id,
    look: 0,
    likes: LIKES[id - 1] as Likes,
  };
}

export const ORDER_BASIC: Order = { drink: "drink-1", pastry: null, mood: null };

export function arrival(tick: number, customer: Customer, order: Order = ORDER_BASIC): Arrival {
  return { tick, customer, order };
}

export interface DefOptions {
  kind?: ShiftDef["kind"];
  day?: number;
  weather?: Weather;
  lengthTicks?: number;
  patienceSec?: number;
  relaxed?: boolean;
  decor?: DecorEffects;
  unlocked?: Unlocked;
  arrivals?: readonly Arrival[];
  free?: number;
  seed?: number;
}

export function handDef(options: DefOptions = {}): ShiftDef {
  return {
    kind: options.kind ?? "day",
    day: options.day ?? 1,
    weather: options.weather ?? "morning",
    lengthTicks: options.lengthTicks ?? 1800,
    basePatienceTicks: patienceTicks(options.patienceSec ?? 60, false),
    relaxed: options.relaxed ?? false,
    decor: options.decor ?? noDecorEffects(),
    unlocked: options.unlocked ?? UNLOCK_ALL,
    arrivals: options.arrivals ?? [],
    patienceFreeArrivals: options.free ?? 0,
    seed: options.seed ?? 1,
  };
}

export const FULL_STOCK: StockPlan = {
  pastries: ["pastry-1", "pastry-2", "pastry-3"],
  books: ["book-1", "book-2", "book-3"],
};

export const NO_STOCK: StockPlan = { pastries: [], books: ["book-1"] };

export function dayDef(
  day: number,
  customers: number,
  due: readonly RegularDue[],
  unlocked: Unlocked,
  stock: StockPlan,
  seed = day * 7919,
  owned: Parameters<typeof decorEffects>[0] = [],
): ShiftDef {
  const weather = weatherForDay(day);
  const decor = decorEffects(owned);
  const lengthTicks = shiftLengthForDay(day);
  return {
    kind: "day",
    day,
    weather,
    lengthTicks,
    basePatienceTicks: patienceTicks(patienceSeconds(day, weather, decor), false),
    relaxed: false,
    decor,
    unlocked,
    arrivals: buildArrivals(seed, customers, lengthTicks, due, {
      unlocked,
      weather,
      shelfEmpty: stock.pastries.length === 0,
    }),
    patienceFreeArrivals: 0,
    seed,
  };
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}
