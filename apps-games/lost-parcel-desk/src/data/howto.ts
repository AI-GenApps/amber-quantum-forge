import {
  CHAPTER_UNLOCKS,
  FREEZE_PRICE,
  HINT_PRICE,
  MAX_FREEZES,
  MAX_HINTS_PER_CASE,
  MAX_STAMPS,
  MIN_FITS_TO_ACCUSE,
} from "@web-games/lost-parcel-desk-core";

export interface HowToPage {
  id: string;
  title: string;
  /** Short paragraphs; every number is read from the core constants. */
  lines: readonly string[];
}

const [, secondChapter = 0, thirdChapter = 0] = CHAPTER_UNLOCKS;

export const HOWTO_PAGES: readonly HowToPage[] = [
  {
    id: "job",
    title: "The job",
    lines: [
      "You work the lost parcel desk at a small-town post office. Each case is a parcel with no address.",
      "Open it, study what is inside, work out which of three townsfolk it belongs to, and deliver it.",
    ],
  },
  {
    id: "table",
    title: "The evidence table",
    lines: [
      "Tap an object to pick it up. Turn it over to read the back, and switch on the magnifier to find small details.",
      "Every clue you find goes into the tray. Tap a clue to pin it to your board, and tap it again to unpin it.",
    ],
  },
  {
    id: "board",
    title: "The deduction board",
    lines: [
      "Tap a pinned clue, then tap a person. Choose Fits if the clue points to them, or Rules out if it says it cannot be them.",
      `Link at least ${MIN_FITS_TO_ACCUSE} clues that fit someone before you accuse them.`,
    ],
  },
  {
    id: "stamps",
    title: "Stamps and postage",
    lines: [
      `A case pays up to ${MAX_STAMPS} stamps. A wrong accusation costs a stamp, and every case still ends with the true owner.`,
      `Stamps open new chapters (at ${secondChapter} and ${thirdChapter} stamps) and desk themes.`,
      `Postage buys hints: ${HINT_PRICE.campaign} for a case, ${HINT_PRICE.daily} on the Daily Parcel, at most ${MAX_HINTS_PER_CASE} per case. Hints never cost stamps.`,
    ],
  },
  {
    id: "pairs",
    title: "Pairs and rule-outs",
    lines: [
      "Some clues only work as a pair: one object is the key and another is the lock. Pin both and link them together.",
      "A clue can also tell you who it is not. Link it as a rule-out to the person it excludes.",
    ],
  },
  {
    id: "daily",
    title: "Daily Parcel",
    lines: [
      "A new short parcel arrives every day. Close it to extend your streak.",
      `Missed a day? A streak freeze costs ${FREEZE_PRICE} postage, and you can keep up to ${MAX_FREEZES}.`,
    ],
  },
];
