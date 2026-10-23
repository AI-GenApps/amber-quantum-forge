export interface HowToPage {
  id: string;
  title: string;
  /** Short paragraphs. Task 05 replaces them with the final onboarding copy. */
  lines: readonly string[];
}

export const HOWTO_PAGES: readonly HowToPage[] = [
  {
    id: "open",
    title: "Open the parcel",
    lines: ["Each lost parcel holds four or five objects. Open one from the case files to begin."],
  },
  {
    id: "look",
    title: "Look closer",
    lines: [
      "Tap an object to pick it up. Turn it over to read the back, and use the magnifier to find small details.",
    ],
  },
  {
    id: "pin",
    title: "Pin the clues",
    lines: ["Tap a clue in the tray to pin it to the deduction board. Tap it again to unpin it."],
  },
  {
    id: "link",
    title: "Link them to a person",
    lines: [
      "On the board, tap a pinned clue and then a person. Choose Fits if the clue points to them, or Rules out if it says it cannot be them.",
    ],
  },
  {
    id: "accuse",
    title: "Accuse",
    lines: [
      "Link at least two clues that fit someone, then accuse them. A wrong accusation costs a stamp, and every case ends with the true owner.",
    ],
  },
  {
    id: "stamps",
    title: "Stamps and postage",
    lines: [
      "A case pays up to 3 stamps. Hints cost postage, never stamps. Stamps open new chapters and desk themes.",
    ],
  },
];
