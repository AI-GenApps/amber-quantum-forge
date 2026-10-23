import type { TutorialRecord } from "./types";

/**
 * The two guided 4x4 boards of the onboarding. They sit outside `CAMPAIGN`: they never count toward
 * stars, statistics or unlocks. Both are proven unique by `validateTutorials`.
 */
export const TUTORIALS: readonly TutorialRecord[] = [
  {
    id: "tutorial-1",
    title: "Light one lantern",
    size: 4,
    code: "....|...=5.|....|...=3La",
    solution: "006c005500550039",
  },
  {
    id: "tutorial-2",
    title: "Count the stones",
    size: 4,
    code: ".S2La.|....|..=3..|.S1..",
    solution: "006c069503a90000",
  },
];

export function getTutorial(id: string): TutorialRecord | undefined {
  return TUTORIALS.find((record) => record.id === id);
}
