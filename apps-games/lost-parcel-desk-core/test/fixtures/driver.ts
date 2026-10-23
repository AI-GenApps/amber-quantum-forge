import { accuse, canAccuse } from "../../src/accuse";
import { requestHint } from "../../src/hints";
import type { Prng } from "../../src/prng";
import {
  addElapsed,
  createCaseState,
  flipObject,
  inspectObject,
  linkClue,
  pinClue,
  tapHotspot,
  unlinkClue,
  unpinClue,
} from "../../src/state";
import type { ActionResult, CaseDef, CaseState, LinkKind, Person } from "../../src/types";
import { deepFreeze } from "./cases";
import { giveFits, must, pinAll, revealAll } from "./helpers";

const ACTIONS = [
  "inspect",
  "flip",
  "tap",
  "pin",
  "unpin",
  "link",
  "unlink",
  "accuse",
  "hint",
  "elapsed",
] as const;

function withGhost(ids: readonly string[]): string[] {
  return [...ids, "ghost"];
}

function applyRandom(
  rng: Prng,
  def: CaseDef,
  people: readonly Person[],
  state: CaseState,
): { label: string; next: CaseState } {
  const action = rng.pick(ACTIONS);
  const objectId = rng.pick(withGhost(def.objects.map((object) => object.id)));
  const clueId = rng.pick(withGhost(def.clues.map((clue) => clue.id)));
  const personId = rng.pick(withGhost(def.candidateIds));
  const kind: LinkKind = rng.int(2) === 0 ? "fits" : "rules-out";
  const unwrap = (result: ActionResult) => result.state;
  switch (action) {
    case "inspect":
      return { label: `inspect ${objectId}`, next: unwrap(inspectObject(def, state, objectId)) };
    case "flip":
      return { label: `flip ${objectId}`, next: unwrap(flipObject(def, state, objectId)) };
    case "tap":
      return { label: `tap ${clueId}`, next: unwrap(tapHotspot(def, state, clueId)) };
    case "pin":
      return { label: `pin ${clueId}`, next: unwrap(pinClue(state, clueId)) };
    case "unpin":
      return { label: `unpin ${clueId}`, next: unwrap(unpinClue(state, clueId)) };
    case "link":
      return {
        label: `link ${clueId} ${personId} ${kind}`,
        next: unwrap(linkClue(state, clueId, personId, kind)),
      };
    case "unlink":
      return { label: `unlink ${clueId} ${personId}`, next: unwrap(unlinkClue(state, clueId, personId)) };
    case "accuse":
      return { label: `accuse ${personId}`, next: accuse(def, state, personId).state };
    case "hint":
      return { label: "hint", next: requestHint(def, people, state).state };
    default:
      return { label: "elapsed", next: unwrap(addElapsed(state, rng.int(5000))) };
  }
}

export interface Trace {
  labels: string[];
  states: CaseState[];
}

export function runRandom(
  rng: Prng,
  def: CaseDef,
  people: readonly Person[],
  steps: number,
): Trace {
  let state = deepFreeze(createCaseState(def));
  const trace: Trace = { labels: [], states: [state] };
  for (let step = 0; step < steps; step++) {
    const before = JSON.stringify(state);
    const { label, next } = applyRandom(rng, def, people, state);
    if (JSON.stringify(state) !== before) throw new Error(`${label} mutated its input`);
    state = deepFreeze(next);
    trace.labels.push(label);
    trace.states.push(state);
  }
  return trace;
}

export function finishCase(rng: Prng, def: CaseDef, start: CaseState): CaseState {
  let state = start;
  if (state.closed) return state;
  state = pinAll(revealAll(def, state));
  const leads = def.clues.slice(0, 2).map((clue) => clue.id);
  for (const personId of rng.shuffle(def.candidateIds)) {
    if (state.closed) break;
    if (state.returnedIds.includes(personId)) continue;
    state = giveFits(state, personId, leads);
    if (!canAccuse(state, personId).ok) throw new Error("expected to be able to accuse");
    const result = accuse(def, state, personId);
    state = must({ ok: true, state: result.state });
  }
  return state;
}
