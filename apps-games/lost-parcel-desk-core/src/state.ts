import type {
  ActionRejection,
  ActionResult,
  CaseDef,
  CaseState,
  ClueFace,
  Link,
  LinkKind,
} from "./types";

export function createCaseState(def: CaseDef): CaseState {
  return {
    caseId: def.id,
    candidateIds: [...def.candidateIds],
    seenObjectIds: [],
    foundClueIds: [],
    pinnedClueIds: [],
    links: [],
    returnedIds: [],
    wrongAccusations: 0,
    hintsUsed: 0,
    elapsedMs: 0,
    closed: false,
    deliveredId: null,
    stamps: null,
    byElimination: false,
  };
}

function reject(state: CaseState, reason: ActionRejection): ActionResult {
  return { ok: false, state, reason };
}

function accept(state: CaseState): ActionResult {
  return { ok: true, state };
}

export function setLink(links: readonly Link[], link: Link): Link[] {
  const at = links.findIndex(
    (existing) => existing.clueId === link.clueId && existing.personId === link.personId,
  );
  if (at === -1) return [...links, link];
  return links.map((existing, index) => (index === at ? link : existing));
}

export function addFound(state: CaseState, clueIds: readonly string[]): string[] {
  const found = [...state.foundClueIds];
  for (const clueId of clueIds) {
    if (!found.includes(clueId)) found.push(clueId);
  }
  return found;
}

function revealFace(
  def: CaseDef,
  state: CaseState,
  objectId: string,
  face: ClueFace,
  requireSeen: boolean,
): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  if (!def.objects.some((object) => object.id === objectId)) return reject(state, "UNKNOWN_OBJECT");
  const seen = state.seenObjectIds.includes(objectId);
  if (requireSeen && !seen) return reject(state, "OBJECT_NOT_OPEN");
  const clueIds = def.clues
    .filter((clue) => clue.objectId === objectId && clue.face === face)
    .map((clue) => clue.id);
  const foundClueIds = addFound(state, clueIds);
  const gainedClues = foundClueIds.length !== state.foundClueIds.length;
  if (seen && !gainedClues) return accept(state);
  return accept({
    ...state,
    seenObjectIds: seen ? state.seenObjectIds : [...state.seenObjectIds, objectId],
    foundClueIds,
  });
}

export function inspectObject(def: CaseDef, state: CaseState, objectId: string): ActionResult {
  return revealFace(def, state, objectId, "front", false);
}

export function flipObject(def: CaseDef, state: CaseState, objectId: string): ActionResult {
  return revealFace(def, state, objectId, "back", true);
}

export function tapHotspot(def: CaseDef, state: CaseState, clueId: string): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  const clue = def.clues.find((candidate) => candidate.id === clueId);
  if (clue === undefined) return reject(state, "UNKNOWN_CLUE");
  if (clue.face !== "zoom") return reject(state, "NOT_A_ZOOM_CLUE");
  if (!state.seenObjectIds.includes(clue.objectId)) return reject(state, "OBJECT_NOT_OPEN");
  if (state.foundClueIds.includes(clueId)) return accept(state);
  return accept({ ...state, foundClueIds: [...state.foundClueIds, clueId] });
}

export function pinClue(state: CaseState, clueId: string): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  if (!state.foundClueIds.includes(clueId)) return reject(state, "CLUE_NOT_FOUND");
  if (state.pinnedClueIds.includes(clueId)) return accept(state);
  return accept({ ...state, pinnedClueIds: [...state.pinnedClueIds, clueId] });
}

export function unpinClue(state: CaseState, clueId: string): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  if (!state.pinnedClueIds.includes(clueId)) return reject(state, "CLUE_NOT_PINNED");
  return accept({
    ...state,
    pinnedClueIds: state.pinnedClueIds.filter((id) => id !== clueId),
    links: state.links.filter((link) => link.clueId !== clueId),
  });
}

export function linkClue(
  state: CaseState,
  clueId: string,
  personId: string,
  kind: LinkKind,
): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  if (!state.candidateIds.includes(personId)) return reject(state, "NOT_A_CANDIDATE");
  if (!state.pinnedClueIds.includes(clueId)) return reject(state, "CLUE_NOT_PINNED");
  const existing = state.links.find((link) => link.clueId === clueId && link.personId === personId);
  if (existing?.kind === kind) return accept(state);
  return accept({ ...state, links: setLink(state.links, { clueId, personId, kind }) });
}

export function unlinkClue(state: CaseState, clueId: string, personId: string): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  const exists = state.links.some((link) => link.clueId === clueId && link.personId === personId);
  if (!exists) return reject(state, "NO_LINK");
  return accept({
    ...state,
    links: state.links.filter((link) => !(link.clueId === clueId && link.personId === personId)),
  });
}

export function addElapsed(state: CaseState, ms: number): ActionResult {
  if (state.closed) return reject(state, "CASE_CLOSED");
  if (!Number.isFinite(ms) || ms < 0) return reject(state, "BAD_DURATION");
  return accept({ ...state, elapsedMs: state.elapsedMs + ms });
}
