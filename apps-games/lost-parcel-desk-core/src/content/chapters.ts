import type { ChapterContent } from "./types";

export const SETTING =
  "Ketterly, a small river town in 1974. The post office was flooded on the night of 4 March; the old clerk, Mr. Hobb, saved the mail but not the labels. The player is the new clerk.";

export const CHAPTERS: readonly ChapterContent[] = [
  {
    id: 1,
    title: "The Spring Backlog",
    caseIds: ["01", "02", "03", "04"],
    unlockStamps: 0,
    intro:
      "The river has gone down and left the sorting room full of strangers' parcels. Open them, read what is inside, and work out whose they are.",
    outro:
      "Four parcels home and four townsfolk smiling. The desk is clearer, but the shelf behind it is still full.",
  },
  {
    id: 2,
    title: "Rain on the Sorting Room",
    caseIds: ["05", "06", "07", "08"],
    unlockStamps: 7,
    intro:
      "More rain, more sacks, and the labels are worse. Some clues only make sense in pairs, and some tell you who it cannot be.",
    outro:
      "Eight parcels delivered. The dead-letter shelf is half bare and the town has started leaving cake for the clerk.",
  },
  {
    id: 3,
    title: "The Last Sack",
    caseIds: ["09", "10", "11", "12"],
    unlockStamps: 18,
    intro:
      "The last sack came off the night train. Mr. Hobb's handwriting is on every one of these, and he is not here to ask.",
    outro:
      "Every parcel is home, the ledger is whole and the desk, at last, is yours.",
  },
];
