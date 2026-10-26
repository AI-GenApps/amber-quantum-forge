import { CARDS, type MechanicCard } from "@web-games/lost-parcel-desk-core";

export function cardFlag(cardId: string): string {
  return `card-${cardId}`;
}

/** The mechanic cards for `caseId` that have not been shown yet, in order. */
export function pendingCards(
  flags: Readonly<Record<string, true>>,
  caseId: string,
): MechanicCard[] {
  return CARDS.filter((card) => card.caseId === caseId && flags[cardFlag(card.id)] !== true);
}
