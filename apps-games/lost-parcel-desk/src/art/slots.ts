import { CASES, PEOPLE } from "@web-games/lost-parcel-desk-core";

export type SlotKind =
  | "icon"
  | "key-art"
  | "backdrop"
  | "evidence"
  | "portrait"
  | "parcel"
  | "store";

export interface SlotDef {
  id: string;
  kind: SlotKind;
  /** Whether runtime art ships in the app bundle (the icon and the feature graphic do not). */
  inBundle: boolean;
}

const evidence: SlotDef[] = CASES.flatMap((item) =>
  item.objects.map((object): SlotDef => ({ id: object.artSlot, kind: "evidence", inBundle: true })),
);

const portraits: SlotDef[] = PEOPLE.map(
  (person): SlotDef => ({ id: person.portraitSlot, kind: "portrait", inBundle: true }),
);

export const SLOTS: readonly SlotDef[] = [
  { id: "icon", kind: "icon", inBundle: false },
  { id: "key-art", kind: "key-art", inBundle: true },
  { id: "desk-backdrop", kind: "backdrop", inBundle: true },
  ...evidence,
  ...portraits,
  { id: "parcel-closed", kind: "parcel", inBundle: true },
  { id: "parcel-open", kind: "parcel", inBundle: true },
  { id: "feature-graphic", kind: "store", inBundle: false },
];

export type SlotId = string;

export const SLOT_IDS: readonly SlotId[] = SLOTS.map((slot) => slot.id);

export const ART_DIR = "/art" as const;

export function slotUrl(slot: SlotId): string {
  return `${ART_DIR}/${slot}.webp`;
}

export function isSlotId(value: string): boolean {
  return SLOT_IDS.includes(value);
}

export function slotDef(slot: SlotId): SlotDef | undefined {
  return SLOTS.find((entry) => entry.id === slot);
}

export interface RuntimeSize {
  width: number;
  height: number;
}

/** Pixel size of the runtime WebP; the icon and the feature graphic ship as masters only. */
export function runtimeSize(slot: SlotId): RuntimeSize | null {
  switch (slotDef(slot)?.kind) {
    case "evidence":
    case "parcel":
      return { width: 560, height: 560 };
    case "portrait":
      return { width: 360, height: 480 };
    case "key-art":
    case "backdrop":
      return { width: 800, height: 1200 };
    default:
      return null;
  }
}

/** Transparent sprites and portraits against fully opaque scenes and store images. */
export function hasAlphaSlot(slot: SlotId): boolean {
  const kind = slotDef(slot)?.kind;
  return kind === "evidence" || kind === "parcel" || kind === "portrait";
}

/** Width and height ratio of the master, as the smallest whole numbers. */
export function slotAspect(slot: SlotId): readonly [number, number] {
  switch (slotDef(slot)?.kind) {
    case "portrait":
      return [3, 4];
    case "key-art":
    case "backdrop":
      return [2, 3];
    case "store":
      return [3, 2];
    default:
      return [1, 1];
  }
}
