import { CANDIDATE_COUNT } from "./constants";
import { consistentCandidates, findPerson } from "./logic";
import type { CaseDef, CaseIssue, CaseIssueCode, ClueFace, Person } from "./types";

const FACES: readonly ClueFace[] = ["front", "zoom", "back"];
const REQUIRED_DEDUCTIONS = 2;

function unique(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function candidateIssues(def: CaseDef, people: readonly Person[]): CaseIssue[] {
  const issues: CaseIssue[] = [];
  const add = (code: CaseIssueCode, subjectId: string) =>
    issues.push({ code, caseId: def.id, subjectId });
  if (def.candidateIds.length !== CANDIDATE_COUNT) add("BAD_CANDIDATE_COUNT", def.id);
  for (const id of unique(def.candidateIds)) {
    if (def.candidateIds.indexOf(id) !== def.candidateIds.lastIndexOf(id)) {
      add("DUPLICATE_CANDIDATE", id);
    }
    if (findPerson(people, id) === undefined) add("UNKNOWN_PERSON", id);
  }
  if (!def.candidateIds.includes(def.ownerId)) add("OWNER_NOT_CANDIDATE", def.ownerId);
  return issues;
}

function structureIssues(def: CaseDef): CaseIssue[] {
  const issues: CaseIssue[] = [];
  const add = (code: CaseIssueCode, subjectId: string) =>
    issues.push({ code, caseId: def.id, subjectId });
  const clueIds = def.clues.map((clue) => clue.id);
  const objectIds = def.objects.map((object) => object.id);

  if (def.deductions.length < REQUIRED_DEDUCTIONS) add("TOO_FEW_DEDUCTIONS", def.id);
  if (def.deductions.length > REQUIRED_DEDUCTIONS) add("TOO_MANY_DEDUCTIONS", def.id);

  const owners = new Map<string, string[]>();
  for (const deduction of def.deductions) {
    const distinct = unique(deduction.clueIds);
    if (deduction.kind === "pair") {
      if (distinct.length !== 2) add("PAIR_NEEDS_TWO_CLUES", deduction.id);
    } else if (distinct.length !== 1) {
      add("SINGLE_NEEDS_ONE_CLUE", deduction.id);
    }
    const wanted = deduction.kind === "rule-out" ? "isnot" : "is";
    if (deduction.polarity !== wanted) add("POLARITY_KIND_MISMATCH", deduction.id);
    for (const clueId of distinct) {
      if (!clueIds.includes(clueId)) add("UNKNOWN_CLUE", clueId);
      owners.set(clueId, [...(owners.get(clueId) ?? []), deduction.id]);
    }
  }

  for (const clue of def.clues) {
    if (!objectIds.includes(clue.objectId)) add("UNKNOWN_OBJECT", clue.id);
    const inDeductions = owners.get(clue.id)?.length ?? 0;
    if (inDeductions > 1) add("CLUE_IN_TWO_DEDUCTIONS", clue.id);
    if (inDeductions > 0 && clue.flavour === true) add("LEAD_CLUE_FLAGGED_FLAVOUR", clue.id);
    if (inDeductions === 0 && clue.flavour !== true) add("FLAVOUR_CLUE_IN_DEDUCTION", clue.id);
  }

  for (const object of def.objects) {
    const onObject = def.clues.filter((clue) => clue.objectId === object.id);
    if (onObject.length === 0) add("OBJECT_WITHOUT_CLUE", object.id);
    for (const face of FACES) {
      const sameFace = onObject.filter((clue) => clue.face === face);
      for (const extra of sameFace.slice(1)) add("DUPLICATE_FACE", extra.id);
    }
  }
  return issues;
}

function logicIssues(def: CaseDef, people: readonly Person[]): CaseIssue[] {
  const issues: CaseIssue[] = [];
  const add = (code: CaseIssueCode, subjectId: string) =>
    issues.push({ code, caseId: def.id, subjectId });
  const consistent = consistentCandidates(def, people);
  const only = consistent[0];
  if (consistent.length !== 1 || only === undefined) {
    add("NO_UNIQUE_OWNER", def.id);
    return issues;
  }
  if (only !== def.ownerId) add("WRONG_OWNER", def.ownerId);
  for (const deduction of def.deductions) {
    const rest = def.deductions
      .filter((other) => other.id !== deduction.id)
      .map((other) => other.id);
    if (consistentCandidates(def, people, rest).length < 2) {
      add("DEDUCTION_NOT_NECESSARY", deduction.id);
    }
  }
  return issues;
}

/**
 * Structural proof that a case is fair. Each stage only runs when the one before it is clean, so
 * every defect reports its own code. An unmarked clue that no deduction uses is reported as
 * FLAVOUR_CLUE_IN_DEDUCTION; a clue used by a deduction but flagged flavour as LEAD_CLUE_FLAGGED_FLAVOUR.
 */
export function analyseCase(def: CaseDef, people: readonly Person[]): CaseIssue[] {
  const candidate = candidateIssues(def, people);
  if (candidate.length > 0) return candidate;
  const structure = structureIssues(def);
  if (structure.length > 0) return structure;
  return logicIssues(def, people);
}
