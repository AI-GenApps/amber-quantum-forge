import { BASE_BOOK_SLOTS, BASE_PASTRY_SLOTS } from "../constants";
import type { DecorEffects, DecorId } from "../types";

export type DecorEffect =
  | { kind: "patience"; seconds: number }
  | { kind: "bookPrice"; coins: number }
  | { kind: "drinkPrice"; coins: number }
  | { kind: "pastrySlot"; slots: number }
  | { kind: "bookSlot"; slots: number }
  | { kind: "fpOnDelighted"; points: number }
  | { kind: "rainPatience"; seconds: number }
  | { kind: "tipPoints"; points: number };

export interface DecorRule {
  id: DecorId;
  name: string;
  price: number;
  unlockDay: number;
  effect: DecorEffect;
}

export const DECOR: readonly DecorRule[] = [
  {
    id: "decor-1",
    name: "Window Seat Cushions",
    price: 80,
    unlockDay: 2,
    effect: { kind: "patience", seconds: 4 },
  },
  {
    id: "decor-2",
    name: "Brass Reading Lamp",
    price: 110,
    unlockDay: 3,
    effect: { kind: "bookPrice", coins: 2 },
  },
  {
    id: "decor-3",
    name: "Potted Rosemary",
    price: 90,
    unlockDay: 4,
    effect: { kind: "drinkPrice", coins: 1 },
  },
  {
    id: "decor-4",
    name: "Glass Cake Stand",
    price: 180,
    unlockDay: 4,
    effect: { kind: "pastrySlot", slots: 1 },
  },
  {
    id: "decor-5",
    name: "Rolling Library Ladder",
    price: 200,
    unlockDay: 5,
    effect: { kind: "bookSlot", slots: 1 },
  },
  {
    id: "decor-6",
    name: "Harbour Chart Frame",
    price: 140,
    unlockDay: 6,
    effect: { kind: "fpOnDelighted", points: 1 },
  },
  {
    id: "decor-7",
    name: "Rain Chime",
    price: 150,
    unlockDay: 7,
    effect: { kind: "rainPatience", seconds: 8 },
  },
  {
    id: "decor-8",
    name: "Brass Gramophone",
    price: 250,
    unlockDay: 9,
    effect: { kind: "tipPoints", points: 10 },
  },
];

export function noDecorEffects(): DecorEffects {
  return decorEffects([]);
}

export function decorEffects(owned: readonly DecorId[]): DecorEffects {
  const out: DecorEffects = {
    patienceSeconds: 0,
    rainPatienceSeconds: 0,
    bookBonus: 0,
    drinkBonus: 0,
    shelfSlots: { pastries: BASE_PASTRY_SLOTS, books: BASE_BOOK_SLOTS },
    fpBonus: 0,
    tipBonusPoints: 0,
  };
  for (const rule of DECOR) {
    if (!owned.includes(rule.id)) continue;
    const effect = rule.effect;
    switch (effect.kind) {
      case "patience":
        out.patienceSeconds += effect.seconds;
        break;
      case "rainPatience":
        out.rainPatienceSeconds += effect.seconds;
        break;
      case "bookPrice":
        out.bookBonus += effect.coins;
        break;
      case "drinkPrice":
        out.drinkBonus += effect.coins;
        break;
      case "pastrySlot":
        out.shelfSlots.pastries += effect.slots;
        break;
      case "bookSlot":
        out.shelfSlots.books += effect.slots;
        break;
      case "fpOnDelighted":
        out.fpBonus += effect.points;
        break;
      case "tipPoints":
        out.tipBonusPoints += effect.points;
        break;
    }
  }
  return out;
}
