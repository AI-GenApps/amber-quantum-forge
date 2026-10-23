import { flipObject, inspectObject, linkClue, pinClue, tapHotspot } from "../../src/state";
import type { ActionResult, CaseDef, CaseState } from "../../src/types";

export function must(result: ActionResult): CaseState {
  if (!result.ok) throw new Error(`unexpected rejection ${result.reason}`);
  return result.state;
}

export function revealAll(def: CaseDef, start: CaseState): CaseState {
  let state = start;
  for (const object of def.objects) {
    state = must(inspectObject(def, state, object.id));
    state = must(flipObject(def, state, object.id));
  }
  for (const clue of def.clues) {
    if (clue.face === "zoom") state = must(tapHotspot(def, state, clue.id));
  }
  return state;
}

export function pinAll(state: CaseState): CaseState {
  return state.foundClueIds.reduce((acc, clueId) => must(pinClue(acc, clueId)), state);
}

export function giveFits(state: CaseState, personId: string, clueIds: string[]): CaseState {
  return clueIds.reduce((acc, clueId) => must(linkClue(acc, clueId, personId, "fits")), state);
}

export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`no item at ${index}`);
  return item;
}
