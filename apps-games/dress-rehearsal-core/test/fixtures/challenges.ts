import { parseRuleCode } from "../../src/rules";
import type { ChallengeShape, SlotSetId } from "../../src/types";

export interface ProofRow {
  readonly id: string;
  readonly set: SlotSetId;
  readonly codes: string;
  readonly looks: number;
  readonly threeStar: number;
}

export function shape(id: string, set: SlotSetId, codes: string): ChallengeShape {
  return {
    id,
    slotSet: set,
    rules: codes.split(";").map((code) => parseRuleCode(code.trim())),
  };
}

export const STARTER_PROOF: readonly ProofRow[] = [
  { id: "riv-01", set: "A", codes: "warmth-max:2; needs-feature:shade", looks: 72, threeStar: 24 },
  { id: "riv-02", set: "A", codes: "max-hues:1; max-spend:330", looks: 72, threeStar: 9 },
  { id: "riv-03", set: "E", codes: "palette-warm; warmth-max:4", looks: 80, threeStar: 18 },
  { id: "riv-04", set: "C", codes: "needs-feature:waterproof; max-hues:1; warmth-max:6", looks: 144, threeStar: 41 },
  { id: "riv-05", set: "D", codes: "formality-min:2; warmth-max:7; max-hues:1", looks: 144, threeStar: 14 },
  { id: "riv-06", set: "A", codes: "include-colour:sky; palette-cool; avoid-colour:navy", looks: 72, threeStar: 8 },
  { id: "riv-07", set: "G", codes: "include-piece:item-riviera-4; max-spend:450; warmth-max:8", looks: 160, threeStar: 5 },
  { id: "rai-01", set: "C", codes: "needs-feature:waterproof; warmth-min:6; formality-max:4", looks: 144, threeStar: 37 },
  { id: "rai-02", set: "D", codes: "formality-min:2; needs-feature:waterproof; max-hues:1", looks: 144, threeStar: 16 },
  { id: "rai-03", set: "B", codes: "needs-feature:waterproof; warmth-min:5; max-hues:1", looks: 16, threeStar: 4 },
  { id: "rai-04", set: "C", codes: "max-hues:0; needs-feature:waterproof; warmth-min:6", looks: 144, threeStar: 5 },
  { id: "rai-05", set: "D", codes: "include-colour:yellow; needs-feature:waterproof; max-spend:520", looks: 144, threeStar: 23 },
  { id: "rai-06", set: "F", codes: "formality-min:2; needs-feature:waterproof; max-spend:560", looks: 160, threeStar: 36 },
  { id: "rai-07", set: "G", codes: "avoid-piece:item-rainy-city-1; warmth-min:7; max-hues:1; needs-feature:waterproof", looks: 160, threeStar: 6 },
];

export const STARTER_CHALLENGES: readonly ChallengeShape[] = STARTER_PROOF.map((row) =>
  shape(row.id, row.set, row.codes),
);
