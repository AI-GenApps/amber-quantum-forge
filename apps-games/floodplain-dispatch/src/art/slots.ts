export type SlotKind = "sprite" | "portrait" | "icon" | "landscape";

export interface SlotDef {
  id: string;
  /** Sprites are 1:1 with alpha, portraits are opaque 2:3, the icon is opaque 1:1, the landscape 3:2. */
  kind: SlotKind;
  /** Whether the runtime art ships in the app bundle (icon and feature graphic do not). */
  inBundle: boolean;
}

export const SLOTS = [
  { id: "icon", kind: "icon", inBundle: false },
  { id: "key-art", kind: "portrait", inBundle: true },
  { id: "house-cottage", kind: "sprite", inBundle: true },
  { id: "pump", kind: "sprite", inBundle: true },
  { id: "house-townhouse", kind: "sprite", inBundle: true },
  { id: "house-mill", kind: "sprite", inBundle: true },
  { id: "house-barn", kind: "sprite", inBundle: true },
  { id: "house-school", kind: "sprite", inBundle: true },
  { id: "reservoir", kind: "sprite", inBundle: true },
  { id: "sluice-gate", kind: "sprite", inBundle: true },
  { id: "sandbag-barrier", kind: "sprite", inBundle: true },
  { id: "windmill", kind: "sprite", inBundle: true },
  { id: "tree-oak", kind: "sprite", inBundle: true },
  { id: "tree-poplar", kind: "sprite", inBundle: true },
  { id: "tree-willow", kind: "sprite", inBundle: true },
  { id: "backdrop-valley", kind: "portrait", inBundle: true },
  { id: "backdrop-delta", kind: "portrait", inBundle: true },
  { id: "backdrop-highland", kind: "portrait", inBundle: true },
  { id: "backdrop-estuary", kind: "portrait", inBundle: true },
  { id: "feature-graphic", kind: "landscape", inBundle: false },
] as const satisfies readonly SlotDef[];

export type SlotId = (typeof SLOTS)[number]["id"];

export const SLOT_IDS: readonly SlotId[] = SLOTS.map((slot) => slot.id);

export interface PixelSize {
  width: number;
  height: number;
}

/** Runtime size (2x display size); store-only slots have none. */
export const RUNTIME_SIZES: Readonly<Record<SlotKind, PixelSize | null>> = {
  sprite: { width: 192, height: 192 },
  portrait: { width: 800, height: 1200 },
  icon: null,
  landscape: null,
};

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

export function slotDef(slot: SlotId): (typeof SLOTS)[number] {
  const def = SLOTS.find((entry) => entry.id === slot);
  if (!def) throw new Error(`Unknown art slot ${slot}`);
  return def;
}

export function runtimeSize(slot: SlotId): PixelSize | null {
  return RUNTIME_SIZES[slotDef(slot).kind];
}
