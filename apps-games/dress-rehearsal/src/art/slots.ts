import { THEME_IDS, type ThemeId } from "@web-games/dress-rehearsal-core";

export type SlotKind = "item" | "client" | "backdrop" | "keyart" | "icon" | "landscape";

type PieceNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type ClientNumber = 1 | 2 | 3 | 4 | 5 | 6;
type BackdropTheme = "studio" | "riviera" | "rainy-city" | "gala" | "mountain" | "vintage";

export type ItemSlotId = `item-${ThemeId}-${PieceNumber}`;
export type ClientSlotId = `client-${ClientNumber}`;
export type BackdropSlotId = `backdrop-${BackdropTheme}`;
export type SlotId =
  | ItemSlotId
  | ClientSlotId
  | BackdropSlotId
  | "icon"
  | "key-art"
  | "feature-graphic";

export interface SlotDef {
  readonly id: SlotId;
  readonly kind: SlotKind;
  /** Whether the runtime art ships in the app bundle (icon and feature graphic do not). */
  readonly inBundle: boolean;
}

const PIECE_NUMBERS: readonly PieceNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];
const CLIENT_NUMBERS: readonly ClientNumber[] = [1, 2, 3, 4, 5, 6];
const BACKDROP_THEMES: readonly BackdropTheme[] = [
  "studio",
  "riviera",
  "rainy-city",
  "gala",
  "mountain",
  "vintage",
];

export const SLOTS: readonly SlotDef[] = [
  { id: "icon", kind: "icon", inBundle: false },
  { id: "key-art", kind: "keyart", inBundle: true },
  ...THEME_IDS.flatMap((theme) =>
    PIECE_NUMBERS.map((n): SlotDef => ({ id: `item-${theme}-${n}`, kind: "item", inBundle: true })),
  ),
  ...CLIENT_NUMBERS.map((n): SlotDef => ({ id: `client-${n}`, kind: "client", inBundle: true })),
  ...BACKDROP_THEMES.map(
    (theme): SlotDef => ({ id: `backdrop-${theme}`, kind: "backdrop", inBundle: true }),
  ),
  { id: "feature-graphic", kind: "landscape", inBundle: false },
];

export const SLOT_IDS: readonly SlotId[] = SLOTS.map((slot) => slot.id);

export interface PixelSize {
  readonly width: number;
  readonly height: number;
}

/** Runtime size (2x display size); store-only slots have none. */
export const RUNTIME_SIZES: Readonly<Record<SlotKind, PixelSize | null>> = {
  item: { width: 256, height: 256 },
  client: { width: 360, height: 480 },
  backdrop: { width: 800, height: 1200 },
  keyart: { width: 800, height: 1200 },
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

export function slotDef(slot: SlotId): SlotDef {
  const def = SLOTS.find((entry) => entry.id === slot);
  if (!def) throw new Error(`Unknown art slot ${slot}`);
  return def;
}

export function runtimeSize(slot: SlotId): PixelSize | null {
  return RUNTIME_SIZES[slotDef(slot).kind];
}

export function pieceSlot(pieceId: string): SlotId | null {
  return isSlotId(pieceId) ? pieceId : null;
}

export function clientSlot(index: number): ClientSlotId {
  return `client-${Math.min(6, Math.max(1, index + 1))}` as ClientSlotId;
}

export function backdropSlot(theme: ThemeId): BackdropSlotId {
  return `backdrop-${theme}` as BackdropSlotId;
}
