import { MAX_STAMPS, MIN_FITS_TO_ACCUSE } from "./constants";
import type { AccuseCheck, AccuseResult, CaseDef, CaseState } from "./types";

export function fitsCount(state: CaseState, personId: string): number {
  return state.links.filter((link) => link.personId === personId && link.kind === "fits").length;
}

export function canAccuse(state: CaseState, personId: string): AccuseCheck {
  if (state.closed) return { ok: false, reason: "CASE_CLOSED", needed: 0 };
  if (!state.candidateIds.includes(personId)) {
    return { ok: false, reason: "NOT_A_CANDIDATE", needed: 0 };
  }
  if (state.returnedIds.includes(personId)) {
    return { ok: false, reason: "ALREADY_RETURNED", needed: 0 };
  }
  const needed = MIN_FITS_TO_ACCUSE - fitsCount(state, personId);
  if (needed > 0) return { ok: false, reason: "NEEDS_MORE_FITS", needed };
  return { ok: true, needed: 0 };
}

export function accuse(def: CaseDef, state: CaseState, personId: string): AccuseResult {
  const check = canAccuse(state, personId);
  if (!check.ok) return { ok: false, state, reason: check.reason, needed: check.needed };

  if (personId === def.ownerId) {
    const stamps = MAX_STAMPS - state.wrongAccusations;
    const closed: CaseState = {
      ...state,
      closed: true,
      deliveredId: personId,
      stamps,
      byElimination: false,
    };
    return {
      ok: true,
      state: closed,
      accusedId: personId,
      correct: true,
      stamps,
      closed: true,
      byElimination: false,
    };
  }

  const wrongAccusations = state.wrongAccusations + 1;
  const returnedIds = [...state.returnedIds, personId];
  const remaining = state.candidateIds.filter((id) => !returnedIds.includes(id));
  const stamps = MAX_STAMPS - wrongAccusations;
  const byElimination = remaining.length === 1 && remaining[0] === def.ownerId;
  const next: CaseState = byElimination
    ? {
        ...state,
        wrongAccusations,
        returnedIds,
        closed: true,
        deliveredId: def.ownerId,
        stamps,
        byElimination,
      }
    : { ...state, wrongAccusations, returnedIds };
  return {
    ok: true,
    state: next,
    accusedId: personId,
    correct: false,
    stamps,
    closed: byElimination,
    byElimination,
  };
}
