import type { MechanicCard } from "./types";

export const CARDS: readonly MechanicCard[] = [
  {
    id: "look-closer",
    title: "Look closer",
    caseId: "01",
    text: "Tap an object to pick it up. Turn it over to read the back, and use the magnifier to find small details.",
  },
  {
    id: "the-board",
    title: "The deduction board",
    caseId: "01",
    text: "Pin a clue, then link it to the person it fits. Link at least two clues to someone before you accuse them. A wrong accusation costs a stamp.",
  },
  {
    id: "key-and-lock",
    title: "Key and lock",
    caseId: "05",
    text: "Some clues only work as a pair: one object is the key and another is the lock. Pin both and link them together.",
  },
  {
    id: "rule-outs",
    title: "Rule-outs",
    caseId: "06",
    text: "A clue can tell you who it is not. Link it as a rule-out to the person it excludes.",
  },
];
