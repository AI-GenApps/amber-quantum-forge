export type DrinkId = "drink-1" | "drink-2" | "drink-3" | "drink-4" | "drink-5" | "drink-6";
export type PastryId = "pastry-1" | "pastry-2" | "pastry-3" | "pastry-4" | "pastry-5";
export type BookId = "book-1" | "book-2" | "book-3" | "book-4" | "book-5";
export type MoodId = "comforting" | "adventurous" | "wistful" | "funny" | "curious";
export type DecorId =
  | "decor-1"
  | "decor-2"
  | "decor-3"
  | "decor-4"
  | "decor-5"
  | "decor-6"
  | "decor-7"
  | "decor-8";

export type DrinkToken = "cup" | "brew" | "steam" | "pour" | "leaves" | "water" | "honey" | "cocoa";
export type PastryToken = "plate" | "warm" | "glaze" | "dust" | "cream";
export type StepToken = DrinkToken | PastryToken;

export type Weather = "morning" | "evening" | "rain";
export type Outcome = "delighted" | "satisfied" | "disappointed" | "left";
export type Component = "drink" | "pastry" | "book";
export type Face = "neutral" | "happy" | "sad";
export type ShiftKind = "day" | "late";
export type Phase = "running" | "closing" | "closed";

export interface Order {
  drink: DrinkId;
  pastry: PastryId | null;
  mood: MoodId | null;
}

export interface Likes {
  drink: DrinkId;
  pastry: PastryId;
  moods: readonly [MoodId, MoodId];
}

export interface Customer {
  id: string;
  kind: "regular" | "walkin";
  regularId: number | null;
  look: number;
  likes: Likes | null;
}

export interface RegularDue {
  regularId: number;
  likes: Likes;
}

export interface Unlocked {
  drinks: readonly DrinkId[];
  pastries: readonly PastryId[];
  books: readonly BookId[];
}

export interface ShelfSlots {
  pastries: number;
  books: number;
}

export interface DecorEffects {
  patienceSeconds: number;
  rainPatienceSeconds: number;
  bookBonus: number;
  drinkBonus: number;
  shelfSlots: ShelfSlots;
  fpBonus: number;
  tipBonusPoints: number;
}

export interface Arrival {
  tick: number;
  customer: Customer;
  order: Order;
}

export interface ShiftDef {
  kind: ShiftKind;
  day: number;
  weather: Weather;
  lengthTicks: number;
  basePatienceTicks: number;
  relaxed: boolean;
  decor: DecorEffects;
  unlocked: Unlocked;
  arrivals: readonly Arrival[];
  patienceFreeArrivals: number;
  seed: number;
}

export interface StockPlan {
  pastries: readonly PastryId[];
  books: readonly BookId[];
}

export interface Tray {
  drink: DrinkId | null;
  pastry: PastryId | null;
  book: BookId | null;
}

export interface SeatState {
  customer: Customer | null;
  order: Order | null;
  arrivalIndex: number;
  patienceTotal: number;
  patienceLeft: number;
  patienceFree: boolean;
  face: Face;
  tray: Tray;
}

export interface CupState {
  seat: number;
  drink: DrinkId;
  step: number;
  lock: number;
}

export interface PlateState {
  seat: number;
  pastry: PastryId;
  step: number;
  oven: number;
}

export interface StockEntry {
  pastry: PastryId;
  portions: number;
}

export interface DoorEntry {
  arrivalIndex: number;
  since: number;
}

export interface OutcomeCounts {
  delighted: number;
  satisfied: number;
  disappointed: number;
  left: number;
}

export interface RegularFp {
  regularId: number;
  fp: number;
}

export interface RegularOutcome {
  regularId: number;
  outcome: Outcome;
}

export interface ShiftStats {
  payments: number;
  tips: number;
  arrived: number;
  counts: OutcomeCounts;
  turnedAway: number;
  mistakes: number;
  fpGains: RegularFp[];
  regularOutcomes: RegularOutcome[];
  resolved: Outcome[];
}

export interface ShiftState {
  def: ShiftDef;
  tick: number;
  phase: Phase;
  seats: SeatState[];
  active: number | null;
  door: DoorEntry[];
  nextArrival: number;
  cup: CupState | null;
  plates: (PlateState | null)[];
  stock: StockEntry[];
  shelfBooks: readonly BookId[];
  stats: ShiftStats;
}

export type DiscardItem =
  | { kind: "cup" }
  | { kind: "plate"; plate: number }
  | { kind: "tray"; slot: Component };

export type ShiftAction =
  | { type: "selectSeat"; seat: number }
  | { type: "drinkStep"; token: DrinkToken }
  | { type: "pastryPick"; pastryId: PastryId }
  | { type: "pastryStep"; plate: number; token: PastryToken }
  | { type: "pickBook"; bookId: BookId }
  | { type: "discard"; item: DiscardItem }
  | { type: "serve" };

export type RejectReason =
  | "closed"
  | "no-customer"
  | "no-active-seat"
  | "locked"
  | "no-cup"
  | "no-plate"
  | "tray-full"
  | "no-free-plate"
  | "out-of-stock"
  | "not-on-shelf"
  | "nothing-to-discard"
  | "bad-seat"
  | "bad-plate";

export interface Scores {
  drink: number;
  pastry: number | null;
  book: number | null;
}

export type ShiftEvent =
  | { type: "customer-seated"; tick: number; seat: number; customerId: string; order: Order }
  | { type: "customer-turned-away"; tick: number; customerId: string }
  | { type: "customer-left"; tick: number; seat: number; customerId: string; face: Face }
  | { type: "seat-selected"; tick: number; seat: number }
  | { type: "step-ok"; tick: number; station: "drink" | "pastry"; token: StepToken; plate: number }
  | {
      type: "step-wrong";
      tick: number;
      station: "drink" | "pastry";
      token: StepToken;
      expected: StepToken;
      plate: number;
    }
  | { type: "step-ready"; tick: number; station: "drink" }
  | { type: "oven-ready"; tick: number; plate: number }
  | { type: "item-ready"; tick: number; seat: number; component: Component }
  | { type: "item-discarded"; tick: number; seat: number; component: Component | "cup" }
  | { type: "patience-warning"; tick: number; seat: number; customerId: string }
  | {
      type: "served";
      tick: number;
      seat: number;
      customerId: string;
      regularId: number | null;
      outcome: Outcome;
      payment: number;
      tip: number;
      fp: number;
      face: Face;
      scores: Scores;
    }
  | { type: "action-rejected"; tick: number; reason: RejectReason }
  | { type: "shift-closed"; tick: number };

export interface Grade {
  stars: 1 | 2 | 3;
  bonusCoins: number;
  good: number;
}

export interface GradeSummary {
  counts: OutcomeCounts;
  arrived: number;
}

export interface ShiftResult {
  kind: ShiftKind;
  day: number;
  payments: number;
  tips: number;
  bonusCoins: number;
  coins: number;
  grade: Grade;
  arrived: number;
  counts: OutcomeCounts;
  turnedAway: number;
  mistakes: number;
  longestDelightedRun: number;
  fpGains: RegularFp[];
  regularOutcomes: RegularOutcome[];
}

export interface StepResult {
  state: ShiftState;
  events: ShiftEvent[];
}

export type StockErrorCode =
  | "TOO_MANY_PASTRIES"
  | "TOO_MANY_BOOKS"
  | "LOCKED_ITEM"
  | "NEED_A_BOOK"
  | "CANNOT_AFFORD";

export interface StockError {
  code: StockErrorCode;
  id: string | null;
}
