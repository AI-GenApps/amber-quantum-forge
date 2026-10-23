export interface SlotDef {
  id: string;
  /** Whether the runtime art ships in the app bundle (icon and feature graphic do not). */
  inBundle: boolean;
}

export const SLOTS = [
  { id: "icon", inBundle: false },
  { id: "key-art", inBundle: true },
  { id: "house-cottage", inBundle: true },
  { id: "pump", inBundle: true },
  { id: "house-townhouse", inBundle: true },
  { id: "house-mill", inBundle: true },
  { id: "house-barn", inBundle: true },
  { id: "house-school", inBundle: true },
  { id: "reservoir", inBundle: true },
  { id: "sluice-gate", inBundle: true },
  { id: "sandbag-barrier", inBundle: true },
  { id: "windmill", inBundle: true },
  { id: "tree-oak", inBundle: true },
  { id: "tree-poplar", inBundle: true },
  { id: "tree-willow", inBundle: true },
  { id: "backdrop-valley", inBundle: true },
  { id: "backdrop-delta", inBundle: true },
  { id: "backdrop-highland", inBundle: true },
  { id: "backdrop-estuary", inBundle: true },
  { id: "feature-graphic", inBundle: false },
] as const satisfies readonly SlotDef[];

export type SlotId = (typeof SLOTS)[number]["id"];

export const SLOT_IDS: readonly SlotId[] = SLOTS.map((slot) => slot.id);

export const ART_DIR = "/art" as const;

export function slotUrl(slot: SlotId): string {
  return `${ART_DIR}/${slot}.webp`;
}

export function isSlotId(value: string): value is SlotId {
  return (SLOT_IDS as readonly string[]).includes(value);
}

export const HOUSE_SLOT: Readonly<Record<string, SlotId>> = {
  cottage: "house-cottage",
  townhouse: "house-townhouse",
  mill: "house-mill",
  barn: "house-barn",
  school: "house-school",
};

export const PIECE_SLOT: Readonly<Record<string, SlotId>> = {
  pump: "pump",
  reservoir: "reservoir",
  gate: "sluice-gate",
  barrier: "sandbag-barrier",
};
