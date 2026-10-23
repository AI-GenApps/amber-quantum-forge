import { plural } from "@web-games/kit";
import {
  type BookId,
  bookRule,
  type Customer,
  type DrinkId,
  drinkRule,
  getRegular,
  MOOD_TEXT,
  type MoodId,
  type Order,
  type PastryId,
  pastryRule,
  type StepToken,
} from "@web-games/the-last-window-core";
import { t } from "./strings";

export const TOKEN_WORDS: Readonly<Record<StepToken, string>> = {
  cup: "Cup",
  brew: "Brew",
  steam: "Steam",
  pour: "Pour",
  leaves: "Leaves",
  water: "Water",
  honey: "Honey",
  cocoa: "Cocoa",
  plate: "Plate",
  warm: "Warm",
  glaze: "Glaze",
  dust: "Dust",
  cream: "Cream",
};

export function moodName(id: MoodId): string {
  return MOOD_TEXT.find((mood) => mood.id === id)?.name ?? id;
}

export function moodLine(moods: readonly MoodId[]): string {
  return moods.map(moodName).join(" and ");
}

export function customerName(customer: Customer): string {
  return customer.kind === "regular" && customer.regularId !== null
    ? getRegular(customer.regularId).shortName
    : t("shiftVisitor");
}

export function orderText(order: Order): string {
  const parts = [drinkRule(order.drink).name];
  if (order.pastry !== null) parts.push(pastryRule(order.pastry).name);
  if (order.mood !== null) parts.push(`a ${moodName(order.mood).toLowerCase()} book`);
  return parts.length === 1
    ? (parts[0] as string)
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function drinkName(id: DrinkId): string {
  return drinkRule(id).name;
}

export function pastryName(id: PastryId): string {
  return pastryRule(id).name;
}

export function bookTitle(id: BookId): string {
  return bookRule(id).title;
}

export function coinsText(coins: number): string {
  return coins === 1 ? t("coinsOne") : t("coins", { coins });
}

export function pluralScenes(count: number): string {
  return `${count} ${plural(count, "scene", "scenes")}`;
}

export function formatClock(ticks: number): string {
  const seconds = Math.max(0, Math.ceil(ticks / 10));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function secondsLeft(ticks: number): number {
  return Math.max(0, Math.ceil(ticks / 10));
}
