import {
  ART_SLOT_IDS,
  ART_SLOTS,
  type ArtKind,
  type BookId,
  type DecorId,
  type DrinkId,
  type Face,
  type PastryId,
  type Weather,
} from "@web-games/the-last-window-core";

export { ART_SLOT_IDS, ART_SLOTS };

export type SlotId = string;

export const ART_DIR = "/art" as const;

export const WALKIN_IDS = [
  "walkin-umbrella",
  "walkin-oilskin",
  "walkin-satchel",
  "walkin-basket",
  "walkin-nurse",
  "walkin-leash",
] as const;

export type WalkinId = (typeof WALKIN_IDS)[number];

export function slotUrl(slot: SlotId): string {
  return `${ART_DIR}/${slot}.webp`;
}

export function isSlotId(value: string): boolean {
  return ART_SLOT_IDS.has(value);
}

export function slotKind(slot: SlotId): ArtKind | null {
  return ART_SLOTS.find((entry) => entry.id === slot)?.kind ?? null;
}

export function interiorSlot(weather: Weather): SlotId {
  return `interior-${weather}`;
}

export function bustSlot(prefix: string, face: Face): SlotId {
  return `${prefix}-${face}`;
}

export function regularPrefix(regularId: number): string {
  return `customer-${regularId}`;
}

export function walkinId(look: number): WalkinId {
  return WALKIN_IDS[
    ((look % WALKIN_IDS.length) + WALKIN_IDS.length) % WALKIN_IDS.length
  ] as WalkinId;
}

export type ItemSlot = DrinkId | PastryId | BookId | DecorId;
