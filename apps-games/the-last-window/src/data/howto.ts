import {
  BASE_BOOK_SLOTS,
  BASE_PASTRY_SLOTS,
  DECOR_TOTAL_PRICE,
  DELIGHTED_PATIENCE_PCT,
  drinkRule,
  FP_DELIGHTED,
  FP_SATISFIED,
  FRIENDSHIP_THRESHOLDS,
  PATIENCE_TABLE,
  PATIENCE_WARNING_TICKS,
  PLATES,
  PORTIONS_PER_KIND,
  pastryRule,
  RELAXED_MULTIPLIER,
  SCENES_PER_REGULAR,
  SEATS,
  SHIFT_TICKS,
  STEP_TICKS,
  TICK_MS,
  TIP_DELIGHTED_PCT,
  TIP_SATISFIED_PCT,
} from "@web-games/the-last-window-core";

export interface HowToPage {
  title: string;
  lines: readonly string[];
}

const seconds = (ticks: number): number => (ticks * TICK_MS) / 1000;
const first = PATIENCE_TABLE[0]?.seconds ?? 0;
const last = PATIENCE_TABLE[PATIENCE_TABLE.length - 1]?.seconds ?? 0;
const harbour = drinkRule("drink-1");
const roll = pastryRule("pastry-1");

/** Six pages. Every number is read from the core constants. */
export const HOWTO_PAGES: readonly HowToPage[] = [
  {
    title: "Your shop",
    lines: [
      `You keep The Last Window, a cafe-bookshop on Quay Lane. Each day is one shift of ${seconds(SHIFT_TICKS.short)} to ${seconds(SHIFT_TICKS.long)} seconds.`,
      `Customers sit at ${SEATS} seats. Tap a seat to see what that person wants.`,
      `Patience starts at ${first} seconds on Day 1 and falls to ${last} seconds by Day 9. A number shows when a customer has ${seconds(PATIENCE_WARNING_TICKS)} seconds left. Relaxed mode multiplies patience by ${RELAXED_MULTIPLIER}.`,
    ],
  },
  {
    title: "Making drinks",
    lines: [
      `Tap the step buttons in order. A ${harbour.name} is ${harbour.steps.join(", ")} and sells for ${harbour.price} coins.`,
      `A wrong tap empties the cup, so start again. Brewing takes ${seconds(STEP_TICKS.brew)} seconds and steaming ${seconds(STEP_TICKS.steam)}.`,
      `Serve while the customer still has ${DELIGHTED_PATIENCE_PCT} percent of their patience to leave a ${TIP_DELIGHTED_PCT} percent tip. A merely satisfied customer tips ${TIP_SATISFIED_PCT} percent.`,
    ],
  },
  {
    title: "Pastries and the oven",
    lines: [
      `Pick a pastry from the shelf, then follow its steps. A ${roll.name} is plate, then warm, and sells for ${roll.price} coins.`,
      `Warming takes ${seconds(STEP_TICKS.warm)} seconds and the oven works while you make a drink. You have ${PLATES} plates.`,
      "A plate flashes when it is ready for its next step.",
    ],
  },
  {
    title: "Books and moods",
    lines: [
      "Some customers ask for a book. Open the shelf and give one whose mood tag matches.",
      "Every book carries two moods, and every mood is on two books. Reading the tags is the whole puzzle.",
      "A wrong-mood book still pays a little, but a matching one makes a delighted customer.",
    ],
  },
  {
    title: "Friends and stories",
    lines: [
      `A delighted regular earns ${FP_DELIGHTED} friendship points and a satisfied one earns ${FP_SATISFIED}.`,
      `Friendship levels arrive at ${FRIENDSHIP_THRESHOLDS.join(", ")} points. Each level opens a short evening story, ${SCENES_PER_REGULAR} per regular.`,
      "Some stories ask you to choose. Your choices shape how each story ends.",
    ],
  },
  {
    title: "Stock and decor",
    lines: [
      `Plan the shelves each evening: ${BASE_PASTRY_SLOTS} pastry slots and ${BASE_BOOK_SLOTS} book slots to start. Each pastry costs coins up front for ${PORTIONS_PER_KIND} portions. Books are free.`,
      `Spend coins in the decor shop. All eight items together cost ${DECOR_TOTAL_PRICE} coins, and each helps in one small way.`,
      "Replay this guided shift any time from the button below.",
    ],
  },
];
