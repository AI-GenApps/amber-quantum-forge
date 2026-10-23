import type { CaseDef, Deduction, LinkKind, Person } from "./types";

export function findPerson(people: readonly Person[], personId: string): Person | undefined {
  return people.find((person) => person.id === personId);
}

export function satisfies(person: Person, deduction: Deduction): boolean {
  const holds = person.facets[deduction.facet] === deduction.value;
  return deduction.polarity === "is" ? holds : !holds;
}

export function consistentCandidates(
  def: CaseDef,
  people: readonly Person[],
  deductionIds?: readonly string[],
): string[] {
  const active = def.deductions.filter(
    (deduction) => deductionIds === undefined || deductionIds.includes(deduction.id),
  );
  return def.candidateIds.filter((candidateId) => {
    const person = findPerson(people, candidateId);
    return person !== undefined && active.every((deduction) => satisfies(person, deduction));
  });
}

export function eliminatedBy(
  def: CaseDef,
  people: readonly Person[],
  deduction: Deduction,
): string[] {
  return def.candidateIds.filter((candidateId) => {
    const person = findPerson(people, candidateId);
    return person !== undefined && !satisfies(person, deduction);
  });
}

export function deductionOfClue(def: CaseDef, clueId: string): Deduction | undefined {
  return def.deductions.find((deduction) => deduction.clueIds.includes(clueId));
}

export function canonicalLink(
  def: CaseDef,
  people: readonly Person[],
  clueId: string,
  personId: string,
): LinkKind | null {
  const deduction = deductionOfClue(def, clueId);
  const person = findPerson(people, personId);
  if (deduction === undefined || person === undefined) return null;
  return satisfies(person, deduction) ? "fits" : "rules-out";
}

export function leadClueIds(def: CaseDef): string[] {
  const ids: string[] = [];
  for (const deduction of def.deductions) {
    for (const clueId of deduction.clueIds) {
      if (!ids.includes(clueId)) ids.push(clueId);
    }
  }
  return ids;
}
