import { Button } from "@web-games/kit";
import { CARDS } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";
import { PaperCard } from "../ui/PaperCard";
import { AppSheet } from "./AppSheet";

export interface CardSheetProps {
  open: boolean;
  cardId: string;
  onClose: () => void;
}

/** A mechanic card (Look closer, The deduction board, Key and lock, Rule-outs). Task 05 decides when each is shown. */
export function CardSheet({ open, cardId, onClose }: CardSheetProps) {
  const card = CARDS.find((item) => item.id === cardId);
  if (!card) return null;
  return (
    <AppSheet open={open} onClose={onClose} title={card.title}>
      <PaperCard id={`card-${card.id}`}>
        <p data-testid="card-text">{card.text}</p>
      </PaperCard>
      <div class="lp-sheetactions">
        <Button onClick={onClose}>{t("cardGotIt")}</Button>
      </div>
    </AppSheet>
  );
}
