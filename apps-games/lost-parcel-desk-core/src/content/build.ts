import type { Deduction, DeductionKind, FacetId } from "../types";
import type { ClueContent, GlyphKind, Hotspot, ObjectContent } from "./types";

export function object(
  id: string,
  name: string,
  glyph: GlyphKind,
  caption: string,
  artSlot?: string,
): ObjectContent {
  const slot = artSlot ?? `evidence-${id}`;
  return { id, name, caption, glyph, artSlot: slot };
}

export function lead(
  id: string,
  objectId: string,
  face: "front" | "back",
  tag: string,
  text: string,
): ClueContent {
  return { id, objectId, face, tag, text };
}

export function zoom(
  id: string,
  objectId: string,
  tag: string,
  text: string,
  hotspot: Hotspot,
): ClueContent {
  return { id, objectId, face: "zoom", tag, text, hotspot };
}

export function flavour(
  id: string,
  objectId: string,
  face: "front" | "back",
  tag: string,
  text: string,
): ClueContent {
  return { id, objectId, face, tag, text, flavour: true };
}

export function deduction(
  id: string,
  facet: FacetId,
  value: string,
  kind: DeductionKind,
  clueIds: string[],
): Deduction {
  return {
    id,
    facet,
    polarity: kind === "rule-out" ? "isnot" : "is",
    value,
    kind,
    clueIds,
  };
}
