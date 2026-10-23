import { MAX_HINTS_PER_CASE } from "../constants";
import { getCase } from "../content";
import { generateDaily } from "../daily/generate";
import { dailySeedOf, isDateKey, weekdayOf } from "../dates";
import type { CaseDef, CaseState, Link, LinkKind } from "../types";
import type { Profile, RunKind, SessionRecord } from "./profile";
import { caseUnlocked } from "./unlocks";

const MAX_ELAPSED_MS = 1_000_000_000;
const LINK_KINDS: readonly LinkKind[] = ["fits", "rules-out"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(value: unknown, allowed: readonly string[]): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !allowed.includes(item) || out.includes(item)) return null;
    out.push(item);
  }
  return out;
}

export function resolveDef(kind: RunKind, id: string): CaseDef | null {
  if (kind === "campaign") return getCase(id) ?? null;
  if (!isDateKey(id)) return null;
  return generateDaily(dailySeedOf(id), weekdayOf(id));
}

function readLinks(value: unknown, def: CaseDef, pinned: readonly string[]): Link[] | null {
  if (!Array.isArray(value)) return null;
  const out: Link[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const { clueId, personId, kind } = item;
    if (typeof clueId !== "string" || !pinned.includes(clueId)) return null;
    if (typeof personId !== "string" || !def.candidateIds.includes(personId)) return null;
    if (typeof kind !== "string" || !LINK_KINDS.includes(kind as LinkKind)) return null;
    if (out.some((link) => link.clueId === clueId && link.personId === personId)) return null;
    out.push({ clueId, personId, kind: kind as LinkKind });
  }
  return out;
}

export function readCaseState(value: unknown, def: CaseDef): CaseState | null {
  if (!isRecord(value) || value.caseId !== def.id) return null;
  const same =
    Array.isArray(value.candidateIds) &&
    value.candidateIds.length === def.candidateIds.length &&
    value.candidateIds.every((id, index) => id === def.candidateIds[index]);
  if (!same) return null;
  const objectIds = def.objects.map((item) => item.id);
  const clueIds = def.clues.map((item) => item.id);
  const seen = uniqueStrings(value.seenObjectIds, objectIds);
  const found = uniqueStrings(value.foundClueIds, clueIds);
  if (seen === null || found === null) return null;
  const orphan = found.some((clueId) => {
    const clue = def.clues.find((item) => item.id === clueId);
    return clue === undefined || !seen.includes(clue.objectId);
  });
  if (orphan) return null;
  const pinned = uniqueStrings(value.pinnedClueIds, found);
  if (pinned === null) return null;
  const links = readLinks(value.links, def, pinned);
  const returned = uniqueStrings(value.returnedIds, def.candidateIds);
  if (links === null || returned === null || returned.length > 1) return null;
  const { wrongAccusations, hintsUsed, elapsedMs } = value;
  if (wrongAccusations !== returned.length) return null;
  if (typeof hintsUsed !== "number" || !Number.isInteger(hintsUsed)) return null;
  if (hintsUsed < 0 || hintsUsed > MAX_HINTS_PER_CASE) return null;
  if (typeof elapsedMs !== "number" || !Number.isFinite(elapsedMs) || elapsedMs < 0) return null;
  if (value.closed !== false) return null;
  return {
    caseId: def.id,
    candidateIds: [...def.candidateIds],
    seenObjectIds: seen,
    foundClueIds: found,
    pinnedClueIds: pinned,
    links,
    returnedIds: returned,
    wrongAccusations: returned.length,
    hintsUsed,
    elapsedMs: Math.min(MAX_ELAPSED_MS, Math.floor(elapsedMs)),
    closed: false,
    deliveredId: null,
    stamps: null,
    byElimination: false,
  };
}

export function readSession(value: unknown, profile: Profile): SessionRecord | null {
  if (!isRecord(value)) return null;
  const { kind, id } = value;
  if ((kind !== "campaign" && kind !== "daily") || typeof id !== "string") return null;
  if (kind === "campaign" && !caseUnlocked(profile, id)) return null;
  const def = resolveDef(kind, id);
  if (def === null) return null;
  const state = readCaseState(value.state, def);
  return state === null ? null : { kind, id, state };
}
