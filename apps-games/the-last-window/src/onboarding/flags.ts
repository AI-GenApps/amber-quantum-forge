import type { Profile } from "@web-games/the-last-window-core";

export const FLAG_TUTORIAL = "tutorial" as const;

export const CARD_FLAGS = {
  stock: "card-stock",
  rain: "card-rain",
  scene: "card-scene",
  choice: "card-choice",
  decor: "card-decor",
  late: "card-late",
} as const;

export type CardId = keyof typeof CARD_FLAGS;

export const CARD_IDS: readonly CardId[] = ["stock", "rain", "scene", "choice", "decor", "late"];

export function hasFlag(profile: Pick<Profile, "flags">, name: string): boolean {
  return profile.flags[name] === true;
}
