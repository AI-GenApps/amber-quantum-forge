import {
  type CaseDef,
  type CaseState,
  type Clue,
  type EvidenceObject,
  GLYPH_KINDS,
  type GlyphKind,
  type Link,
  type LinkKind,
  PEOPLE_BY_ID,
  summarizeBoard,
} from "@web-games/lost-parcel-desk-core";
import type { ChipState } from "../ui/ClueChip";
import type { CardBracket, CardLink } from "../ui/ProfileCard";

export interface ObjectVisual {
  glyph: GlyphKind;
  slot: string | null;
}

function isGlyph(value: unknown): value is GlyphKind {
  return typeof value === "string" && (GLYPH_KINDS as readonly string[]).includes(value);
}

/** Campaign objects carry a glyph and an art slot; daily objects carry a glyph only. */
export function visualOf(object: EvidenceObject): ObjectVisual {
  const glyph = "glyph" in object && isGlyph(object.glyph) ? object.glyph : "paper";
  const slot = "artSlot" in object && typeof object.artSlot === "string" ? object.artSlot : null;
  return { glyph, slot };
}

export interface HotspotPoint {
  x: number;
  y: number;
}

/** Zoom clues of campaign cases carry a hotspot on a 0 to 1000 grid. */
export function hotspotOf(clue: Clue): HotspotPoint | null {
  if (!("hotspot" in clue)) return null;
  const spot = clue.hotspot;
  if (typeof spot !== "object" || spot === null) return null;
  const { x, y } = spot as { x?: unknown; y?: unknown };
  return typeof x === "number" && typeof y === "number" ? { x, y } : null;
}

export function clueById(def: CaseDef, clueId: string): Clue | undefined {
  return def.clues.find((clue) => clue.id === clueId);
}

export function isLinked(state: CaseState, clueId: string): boolean {
  return state.links.some((link) => link.clueId === clueId);
}

export function chipState(state: CaseState, clueId: string): ChipState {
  if (isLinked(state, clueId)) return "linked";
  return state.pinnedClueIds.includes(clueId) ? "pinned" : "found";
}

export function linkOf(state: CaseState, clueId: string, personId: string): LinkKind | null {
  return (
    state.links.find((link) => link.clueId === clueId && link.personId === personId)?.kind ?? null
  );
}

export function cardLinks(def: CaseDef, state: CaseState, personId: string): CardLink[] {
  return state.links
    .filter((link) => link.personId === personId)
    .map((link) => ({ link, clue: clueById(def, link.clueId) }))
    .filter((entry): entry is { link: Link; clue: Clue } => entry.clue !== undefined)
    .map(({ link, clue }) => ({ clueId: clue.id, tag: clue.tag, kind: link.kind }));
}

/** A key-and-lock pair is bracketed on a card once both of its clues carry the same link kind there. */
export function pairBrackets(def: CaseDef, state: CaseState, personId: string): CardBracket[] {
  const out: CardBracket[] = [];
  for (const deduction of def.deductions) {
    if (deduction.kind !== "pair" || deduction.clueIds.length !== 2) continue;
    const [first, second] = deduction.clueIds as [string, string];
    for (const kind of ["fits", "rules-out"] as const) {
      if (linkOf(state, first, personId) === kind && linkOf(state, second, personId) === kind) {
        const tags: [string, string] = [
          clueById(def, first)?.tag ?? first,
          clueById(def, second)?.tag ?? second,
        ];
        out.push({ id: `${deduction.id}:${personId}:${kind}`, kind, tags });
      }
    }
  }
  return out;
}

export function liveSummary(def: CaseDef, state: CaseState): string {
  return summarizeBoard(def, state)
    .map((entry) => {
      const name = PEOPLE_BY_ID[entry.personId]?.name.split(" ")[0] ?? entry.personId;
      const tail = entry.returned ? ", returned to sender" : "";
      return `${name}: ${entry.fits} ${entry.fits === 1 ? "clue fits" : "clues fit"}, ${entry.rulesOut} rule out${tail}.`;
    })
    .join(" ");
}

export function objectClues(def: CaseDef, objectId: string): Clue[] {
  return def.clues.filter((clue) => clue.objectId === objectId);
}
