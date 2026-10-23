import { MECHANIC_CARDS, type MechanicCard } from "@web-games/floodplain-dispatch-core";
import { Button } from "@web-games/kit";
import { AppSheet } from "../sheets/AppSheet";
import { t } from "../strings";

export const cardFlag = (id: string): string => `card-${id}`;

/** The card that belongs to this map and has not been seen yet, if any. */
export function pendingCard(
  flags: Readonly<Record<string, true>>,
  mapId: string | undefined,
): MechanicCard | null {
  if (!mapId) return null;
  const card = MECHANIC_CARDS.find((entry) => entry.mapId === mapId);
  if (!card || flags[cardFlag(card.id)] === true) return null;
  return card;
}

export interface MechanicCardSheetProps {
  card: MechanicCard | null;
  onDismiss: () => void;
}

export function MechanicCardSheet({ card, onDismiss }: MechanicCardSheetProps) {
  return (
    <AppSheet open={card !== null} onClose={onDismiss} title={card?.title ?? ""}>
      <p data-testid="mechanic-card">{card?.text}</p>
      <div class="fd-sheet__actions">
        <Button onClick={onDismiss}>{t("cardGotIt")}</Button>
      </div>
    </AppSheet>
  );
}
