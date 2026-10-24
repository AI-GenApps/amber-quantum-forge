import {
  type ShiftEvent,
  TUTORIAL_STEPS,
  type TutorialStep,
} from "@web-games/the-last-window-core";

export type TutorialStatus = "active" | "done" | "skipped";

export interface TutorialFacts {
  seated: readonly string[];
  served: readonly string[];
  seatSelected: boolean;
  drinkReady: boolean;
  bookReady: boolean;
  closed: boolean;
  acked: readonly string[];
}

export interface TutorialState {
  status: TutorialStatus;
  /** Index into `TUTORIAL_STEPS`. */
  index: number;
  /** True while the coach card for `index` is on screen. */
  visible: boolean;
  facts: TutorialFacts;
}

export type TutorialInput =
  | { type: "event"; event: ShiftEvent }
  | { type: "ack" }
  | { type: "skip" };

interface StepRule {
  id: string;
  /** The card appears once this is true. */
  shows(facts: TutorialFacts): boolean;
  /** The real action that completes the step. */
  done(facts: TutorialFacts): boolean;
}

export const TOBIAS = "regular-2" as const;
export const PRIYA = "regular-3" as const;
export const ODILE = "regular-1" as const;

const always = (): boolean => true;
const acked =
  (id: string) =>
  (facts: TutorialFacts): boolean =>
    facts.acked.includes(id);

/** One rule per step of the content file, in the same order. */
export const STEP_RULES: readonly StepRule[] = [
  { id: "note", shows: always, done: acked("note") },
  { id: "seat", shows: (f) => f.seated.includes(TOBIAS), done: (f) => f.seatSelected },
  { id: "drink", shows: always, done: (f) => f.drinkReady },
  { id: "serve", shows: always, done: (f) => f.served.includes(TOBIAS) },
  { id: "pastry", shows: (f) => f.seated.includes(PRIYA), done: (f) => f.served.includes(PRIYA) },
  { id: "book", shows: (f) => f.seated.includes(ODILE), done: (f) => f.bookReady },
  { id: "patience", shows: always, done: (f) => f.closed || f.acked.includes("patience") },
];

export function createTutorial(): TutorialState {
  return settle({
    status: "active",
    index: 0,
    visible: false,
    facts: {
      seated: [],
      served: [],
      seatSelected: false,
      drinkReady: false,
      bookReady: false,
      closed: false,
      acked: [],
    },
  });
}

function withFact(facts: TutorialFacts, event: ShiftEvent): TutorialFacts {
  switch (event.type) {
    case "customer-seated":
      return { ...facts, seated: [...facts.seated, event.customerId] };
    case "seat-selected":
      return { ...facts, seatSelected: true };
    case "item-ready":
      if (event.component === "drink") return { ...facts, drinkReady: true };
      if (event.component === "book") return { ...facts, bookReady: true };
      return facts;
    case "served":
      return { ...facts, served: [...facts.served, event.customerId] };
    case "shift-closed":
      return { ...facts, closed: true };
    default:
      return facts;
  }
}

/** Shows the next card when its moment has come and moves past steps whose action already happened. */
function settle(state: TutorialState): TutorialState {
  let current = state;
  while (current.status === "active") {
    const rule = STEP_RULES[current.index];
    if (!rule) return { ...current, status: "done", visible: false };
    if (!current.visible) {
      if (!rule.shows(current.facts)) return current;
      current = { ...current, visible: true };
    }
    if (!rule.done(current.facts)) return current;
    current = { ...current, index: current.index + 1, visible: false };
  }
  return current;
}

export function tutorialReduce(state: TutorialState, input: TutorialInput): TutorialState {
  if (state.status !== "active") return state;
  if (input.type === "skip") return { ...state, status: "skipped", visible: false };
  if (input.type === "ack") {
    const rule = STEP_RULES[state.index];
    if (!rule || !state.visible) return state;
    const needsAck = rule.id === "note" || rule.id === "patience";
    if (!needsAck) return state;
    return settle({ ...state, facts: { ...state.facts, acked: [...state.facts.acked, rule.id] } });
  }
  return settle({ ...state, facts: withFact(state.facts, input.event) });
}

export function currentStep(state: TutorialState): TutorialStep | null {
  if (state.status !== "active" || !state.visible) return null;
  return TUTORIAL_STEPS[state.index] ?? null;
}

/** The first card halts the shift until the player opens the shop. */
export function isBlocking(state: TutorialState): boolean {
  return currentStep(state)?.id === "note";
}

export function isFinished(state: TutorialState): boolean {
  return state.status !== "active";
}
