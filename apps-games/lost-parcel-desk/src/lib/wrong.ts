import {
  type CaseDef,
  type CaseState,
  explainWrong,
  type FacetId,
  PEOPLE,
  PEOPLE_BY_ID,
} from "@web-games/lost-parcel-desk-core";

const LOOK_PHRASES: Readonly<Record<string, string>> = {
  "red hair": "has red hair",
  spectacles: "wears spectacles",
  "left-handed": "is left-handed",
  "hearing aid": "wears a hearing aid",
  tall: "is tall",
  "walking stick": "uses a walking stick",
};

/** One plain sentence about a townsperson's fact, in the voice of the wrong-accusation note. */
export function factSentence(first: string, facet: FacetId, value: string): string {
  switch (facet) {
    case "street":
      return `${first} lives on ${value}`;
    case "pastime":
      return `${first}'s pastime is ${value}`;
    case "look":
      return `${first} ${LOOK_PHRASES[value] ?? `looks ${value}`}`;
    case "pet":
      return value === "none" ? `${first} has no pet` : `${first} has a ${value}`;
  }
}

/** The line shown on the "Return to sender" note: a found clue that does not fit, or a hint that one is still unseen. */
export function wrongNote(def: CaseDef, state: CaseState, personId: string): string {
  const person = PEOPLE_BY_ID[personId];
  const first = person?.name.split(" ")[0] ?? "That person";
  const why = explainWrong(def, PEOPLE, state, personId);
  if (why === null) return `${first} is not the owner.`;
  if (why.kind === "unseen") {
    return `Something you have not found yet rules out ${first}. Keep looking.`;
  }
  const tag = def.clues.find((clue) => clue.id === why.clueId)?.tag ?? "That clue";
  const fact = factSentence(first, why.facet, why.actual);
  return why.polarity === "is"
    ? `The ${tag} does not fit ${first}: ${fact}.`
    : `The ${tag} rules out ${first}: ${fact}.`;
}
