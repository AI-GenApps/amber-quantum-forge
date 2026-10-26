import { MAX_HINTS_PER_CASE } from "./constants";
import { canonicalLink, findPerson } from "./logic";
import { addFound, setLink } from "./state";
import type { CaseDef, CaseState, Deduction, HintResult, Link, Person } from "./types";

function canonicalLinks(def: CaseDef, people: readonly Person[], deduction: Deduction): Link[] {
  const links: Link[] = [];
  for (const clueId of deduction.clueIds) {
    for (const personId of def.candidateIds) {
      const kind = canonicalLink(def, people, clueId, personId);
      if (kind !== null) links.push({ clueId, personId, kind });
    }
  }
  return links;
}

function isResolved(
  def: CaseDef,
  people: readonly Person[],
  state: CaseState,
  deduction: Deduction,
) {
  const clues = deduction.clueIds.every(
    (clueId) => state.foundClueIds.includes(clueId) && state.pinnedClueIds.includes(clueId),
  );
  if (!clues) return false;
  return canonicalLinks(def, people, deduction).every((wanted) =>
    state.links.some(
      (link) =>
        link.clueId === wanted.clueId &&
        link.personId === wanted.personId &&
        link.kind === wanted.kind,
    ),
  );
}

export function nextUnresolvedDeduction(
  def: CaseDef,
  people: readonly Person[],
  state: CaseState,
): Deduction | null {
  return def.deductions.find((deduction) => !isResolved(def, people, state, deduction)) ?? null;
}

function explain(def: CaseDef, people: readonly Person[], deduction: Deduction, links: Link[]) {
  const names = (kind: Link["kind"]) =>
    def.candidateIds
      .filter((id) => links.some((link) => link.personId === id && link.kind === kind))
      .map((id) => findPerson(people, id)?.name ?? id);
  const relation = deduction.polarity === "is" ? "is" : "is not";
  const fits = names("fits");
  const rulesOut = names("rules-out");
  return `The owner's ${deduction.facet} ${relation} ${deduction.value}. Fits: ${fits.join(", ") || "nobody"}. Rules out: ${rulesOut.join(", ") || "nobody"}.`;
}

export function requestHint(def: CaseDef, people: readonly Person[], state: CaseState): HintResult {
  if (state.closed) return { ok: false, state, reason: "CASE_CLOSED" };
  const deduction = nextUnresolvedDeduction(def, people, state);
  if (deduction === null) return { ok: false, state, reason: "NOTHING_TO_HINT" };
  if (state.hintsUsed >= MAX_HINTS_PER_CASE) return { ok: false, state, reason: "HINT_LIMIT" };

  const links = canonicalLinks(def, people, deduction);
  const pinnedClueIds = [...state.pinnedClueIds];
  for (const clueId of deduction.clueIds) {
    if (!pinnedClueIds.includes(clueId)) pinnedClueIds.push(clueId);
  }
  const next: CaseState = {
    ...state,
    foundClueIds: addFound(state, deduction.clueIds),
    pinnedClueIds,
    links: links.reduce<Link[]>((acc, link) => setLink(acc, link), state.links),
    hintsUsed: state.hintsUsed + 1,
  };
  return {
    ok: true,
    state: next,
    deductionId: deduction.id,
    clueIds: [...deduction.clueIds],
    links,
    explanation: explain(def, people, deduction, links),
  };
}
