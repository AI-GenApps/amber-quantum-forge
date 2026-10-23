import type { TutorialStep } from "./types";

export const TUTORIAL_CASE_ID = "01";

export const TUTORIAL: readonly TutorialStep[] = [
  {
    step: 1,
    prompt: "Tap the parcel to open it.",
    advancesWhen: "The parcel is opened",
    trigger: { kind: "parcel-opened" },
  },
  {
    step: 2,
    prompt: "Tap the knitted scarf to pick it up.",
    advancesWhen: "Object 01-2 is opened",
    trigger: { kind: "object-opened", objectId: "01-2" },
  },
  {
    step: 3,
    prompt: "Switch on the magnifier and tap the glowing spot.",
    advancesWhen: "Clue 01-c1 is found",
    trigger: { kind: "clue-found", clueId: "01-c1" },
  },
  {
    step: 4,
    prompt: "Pin the clue to your board.",
    advancesWhen: "A clue is pinned",
    trigger: { kind: "clue-pinned" },
  },
  {
    step: 5,
    prompt: "Link the clue to the person it fits.",
    advancesWhen: "A clue is linked as fits",
    trigger: { kind: "clue-linked-fits" },
  },
  {
    step: 6,
    prompt: "Link one more clue, then accuse.",
    advancesWhen: "A first accusation is made",
    trigger: { kind: "accused" },
  },
];
