import {
  CATEGORIES,
  FORMALITY_MAX,
  FORMALITY_MIN,
  FRAME_PRICE,
  FREEZE_PRICE,
  HARMONY_PART_NAMES,
  HARMONY_WEIGHTS,
  HINT_PRICE,
  HOW_TO_PAGES,
  MAX_FREEZES,
  MAX_GALLERY,
  STAR_NAMES,
  THREE_STAR_HARMONY,
  WARMTH_MAX,
  WARMTH_MIN,
} from "@web-games/dress-rehearsal-core";

export interface HowToContent {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

const PARTS = (["scheme", "anchor", "dressCode", "era", "season"] as const)
  .map((id) => `${HARMONY_PART_NAMES[id]} ${HARMONY_WEIGHTS[id]}`)
  .join(", ");

const WEIGHT_TOTAL = Object.values(HARMONY_WEIGHTS).reduce((sum, value) => sum + value, 0);

const FRAME_PRICES = Object.values(FRAME_PRICE).join(", ");

/** Page bodies; every number comes from the core constants so the text cannot drift. */
export const HOW_TO_PARAGRAPHS: Readonly<Record<string, readonly string[]>> = {
  brief: [
    "Each client gives you a brief: a few short rules, a mood and a budget in dollars.",
    "Read the rule chips on the card. A chip turns green with a tick when the look meets it, and red with a cross when it does not. Colour is never the only sign.",
    "Fill every slot on the board, then press Finish look.",
  ],
  pieces: [
    `Pieces live in the closet tray under ${CATEGORIES.length} tabs: tops, bottoms, dresses, outerwear, shoes, bags, hats and extras.`,
    "Drag a piece onto its slot, or tap a piece and then tap the slot. A piece only fits the slot of its own kind.",
    "A dress replaces the top and the bottom. Placing a top or a bottom takes the dress off again. Putting a piece on a full slot swaps them.",
    "Drag a piece off the board to clear its slot. Undo, Redo and Clear sit under the board.",
  ],
  rules: [
    "Rules are exact. A palette rule limits colours, an era rule limits the decades, a dress-code rule sets formality, a weather rule adds up warmth, a feature rule asks for a waterproof, shaded, sparkling or sturdy piece, and a budget rule caps or sets a floor for the spend.",
    `Formality runs from ${FORMALITY_MIN} (loungewear) to ${FORMALITY_MAX} (black tie). Warmth runs from ${WARMTH_MIN} (airy) to ${WARMTH_MAX} (heavy) per piece, and weather rules add up the whole look.`,
    "Neutral colours (black, white, cream, grey, navy and tan) never count as colours.",
  ],
  harmony: [
    `Harmony is a score from 0 to ${WEIGHT_TOTAL} for how well the look hangs together. It has five parts: ${PARTS}.`,
    "Colour scheme rewards neighbours and opposites on the colour wheel. Neutral anchor adds points when one piece is a neutral. Dress code, era match and season sense reward pieces that sit close together in formality, decade and warmth.",
    "Open the details under the harmony meter to see how many points each part earned and why.",
  ],
  stars: [
    `You earn up to three stars. ${STAR_NAMES[0]}: the look is complete and meets at least half of the rules. ${STAR_NAMES[1]}: it is complete and meets every rule. ${STAR_NAMES[2]}: on brief and harmony of ${THREE_STAR_HARMONY} or more.`,
    "Stars earn coins and open new chapters and closet pieces. Replaying never lowers your best.",
    `A hint reveals one piece of a polished look for ${HINT_PRICE.campaign} coins (${HINT_PRICE.daily} on the Daily Fitting) and never costs stars.`,
  ],
  "daily-gallery": [
    "The Daily Fitting is a new brief every day, made from your closet. Come back each day to build a streak.",
    `A streak freeze covers a day you miss. Each costs ${FREEZE_PRICE} coins and you can hold ${MAX_FREEZES}.`,
    `The Gallery keeps up to ${MAX_GALLERY} saved boards. Export one as an image with a frame (${FRAME_PRICES} coins for the paid frames) and share it.`,
  ],
};

export const HOW_TO: readonly HowToContent[] = HOW_TO_PAGES.map((page) => ({
  id: page.id,
  title: page.title,
  paragraphs: HOW_TO_PARAGRAPHS[page.id] ?? [],
}));
