import { accuse } from "../../src/accuse";
import { PEOPLE } from "../../src/content";
import { canonicalLink, leadClueIds } from "../../src/logic";
import { createCaseState, linkClue } from "../../src/state";
import type { CaseDef, CaseState } from "../../src/types";
import { giveFits, must, pinAll, revealAll } from "./helpers";

export interface SolveOptions {
  wrong?: number;
  hints?: number;
  skipClues?: boolean;
}

/** Plays a case through the real reducers: reveal, pin, canonical links, then accusations. */
export function solve(def: CaseDef, options: SolveOptions = {}): CaseState {
  const wrong = options.wrong ?? 0;
  let state = createCaseState(def);
  state = pinAll(revealAll(def, state));
  const decoys = def.candidateIds.filter((id) => id !== def.ownerId);
  const leads = leadClueIds(def);
  for (const clueId of leads) {
    for (const personId of def.candidateIds) {
      const kind = canonicalLink(def, PEOPLE, clueId, personId);
      if (kind !== null) state = must(linkClue(state, clueId, personId, kind));
    }
  }
  for (const decoyId of decoys.slice(0, wrong)) {
    state = giveFits(state, decoyId, leads);
    const result = accuse(def, state, decoyId);
    if (!result.ok) throw new Error(`wrong accusation rejected: ${result.reason}`);
    state = result.state;
  }
  if (!state.closed) {
    const result = accuse(def, state, def.ownerId);
    if (!result.ok) throw new Error(`owner accusation rejected: ${result.reason}`);
    state = result.state;
  }
  return { ...state, hintsUsed: options.hints ?? state.hintsUsed };
}
