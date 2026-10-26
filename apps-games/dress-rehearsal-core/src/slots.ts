import type { CanPlaceResult, Look, Piece, PlaceResult, Slot, SlotSetId } from "./types";

export const SLOT_ORDER: readonly Slot[] = [
  "hat",
  "accessory",
  "outer",
  "top",
  "dress",
  "bag",
  "bottom",
  "shoes",
];

export const SLOT_SET_IDS: readonly SlotSetId[] = ["A", "B", "C", "D", "E", "F", "G"];

export const SLOT_SETS: Readonly<Record<SlotSetId, readonly Slot[]>> = {
  A: ["top", "bottom", "shoes", "bag", "hat", "accessory"],
  B: ["dress", "outer", "shoes", "bag", "hat", "accessory"],
  C: ["top", "bottom", "outer", "shoes", "bag", "accessory"],
  D: ["top", "bottom", "outer", "shoes", "bag", "hat", "accessory"],
  E: ["top", "bottom", "dress", "shoes", "bag", "hat", "accessory"],
  F: ["top", "bottom", "dress", "outer", "shoes", "bag", "accessory"],
  G: ["top", "bottom", "dress", "outer", "shoes", "bag", "hat", "accessory"],
};

export function openSlots(set: SlotSetId): readonly Slot[] {
  const open = SLOT_SETS[set];
  return SLOT_ORDER.filter((slot) => open.includes(slot));
}

export function isSlotOpen(set: SlotSetId, slot: Slot): boolean {
  return SLOT_SETS[set].includes(slot);
}

export function hasOnePieceRule(set: SlotSetId): boolean {
  return isSlotOpen(set, "dress") && isSlotOpen(set, "top") && isSlotOpen(set, "bottom");
}

export function normalizeLook(look: Look): Look {
  const out: Look = {};
  for (const slot of SLOT_ORDER) {
    const id = look[slot];
    if (id !== undefined) out[slot] = id;
  }
  return out;
}

export function canPlace(
  set: SlotSetId,
  piece: Piece,
  slot: Slot = piece.category,
): CanPlaceResult {
  if (piece.category !== slot) return { ok: false, reason: "WRONG_CATEGORY" };
  if (!isSlotOpen(set, slot)) return { ok: false, reason: "SLOT_CLOSED" };
  return { ok: true };
}

export function place(
  set: SlotSetId,
  look: Look,
  piece: Piece,
  slot: Slot = piece.category,
): PlaceResult {
  const check = canPlace(set, piece, slot);
  if (!check.ok) return check;
  const displaced: string[] = [];
  const next: Look = {};
  const cleared = new Set<Slot>();
  if (hasOnePieceRule(set)) {
    if (slot === "dress") {
      cleared.add("top");
      cleared.add("bottom");
    } else if (slot === "top" || slot === "bottom") {
      cleared.add("dress");
    }
  }
  const previous = look[slot];
  if (previous !== undefined && previous !== piece.id) displaced.push(previous);
  for (const other of SLOT_ORDER) {
    const id = look[other];
    if (other === slot) continue;
    if (id === undefined) continue;
    if (cleared.has(other)) displaced.push(id);
    else next[other] = id;
  }
  next[slot] = piece.id;
  return { ok: true, look: normalizeLook(next), displaced };
}

export function clearSlot(look: Look, slot: Slot): Look {
  const next: Look = {};
  for (const other of SLOT_ORDER) {
    const id = look[other];
    if (other !== slot && id !== undefined) next[other] = id;
  }
  return next;
}

export function missingSlots(set: SlotSetId, look: Look): Slot[] {
  const missing = new Set<Slot>();
  const open = SLOT_SETS[set];
  const hasDress = look.dress !== undefined;
  const hasTop = look.top !== undefined;
  const hasBottom = look.bottom !== undefined;
  for (const slot of open) {
    if (slot === "dress" || slot === "top" || slot === "bottom") continue;
    if (look[slot] === undefined) missing.add(slot);
  }
  if (hasOnePieceRule(set)) {
    if (!hasDress) {
      if (!hasTop) missing.add("top");
      if (!hasBottom) missing.add("bottom");
    }
  } else if (open.includes("dress")) {
    if (!hasDress) missing.add("dress");
  } else {
    if (!hasTop) missing.add("top");
    if (!hasBottom) missing.add("bottom");
  }
  return SLOT_ORDER.filter((slot) => missing.has(slot));
}

export function hasConflict(set: SlotSetId, look: Look): boolean {
  return (
    hasOnePieceRule(set) &&
    look.dress !== undefined &&
    (look.top !== undefined || look.bottom !== undefined)
  );
}

export function isComplete(set: SlotSetId, look: Look): boolean {
  return missingSlots(set, look).length === 0 && !hasConflict(set, look);
}
