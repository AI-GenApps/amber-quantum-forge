import { findPerson, satisfies } from "./logic";
import type { CandidateSummary, CaseDef, CaseState, Person, WrongExplanation } from "./types";

export function explainWrong(
  def: CaseDef,
  people: readonly Person[],
  state: CaseState,
  personId: string,
): WrongExplanation | null {
  const person = findPerson(people, personId);
  if (person === undefined) return null;
  const ruling = def.deductions.filter((deduction) => !satisfies(person, deduction));
  if (ruling.length === 0) return null;

  const build = (deductionIndex: number, kind: "clue" | "unseen"): WrongExplanation => {
    const deduction = ruling[deductionIndex] as (typeof ruling)[number];
    return {
      kind,
      personId,
      deductionId: deduction.id,
      clueId: kind === "clue" ? (deduction.clueIds[0] ?? null) : null,
      clueIds: [...deduction.clueIds],
      facet: deduction.facet,
      polarity: deduction.polarity,
      expected: deduction.value,
      actual: person.facets[deduction.facet],
    };
  };

  const seenAt = ruling.findIndex((deduction) =>
    deduction.clueIds.every((clueId) => state.foundClueIds.includes(clueId)),
  );
  return seenAt === -1 ? build(0, "unseen") : build(seenAt, "clue");
}

export function summarizeBoard(def: CaseDef, state: CaseState): CandidateSummary[] {
  return def.candidateIds.map((personId) => ({
    personId,
    fits: state.links.filter((link) => link.personId === personId && link.kind === "fits").length,
    rulesOut: state.links.filter((link) => link.personId === personId && link.kind === "rules-out")
      .length,
    returned: state.returnedIds.includes(personId),
  }));
}
