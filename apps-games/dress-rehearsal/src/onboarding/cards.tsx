import { RULE_CARDS, type RuleCard } from "@web-games/dress-rehearsal-core";
import { Button } from "@web-games/kit";
import { AppSheet } from "../sheets/AppSheet";
import { t } from "../strings";

export const cardFlag = (id: RuleCard["id"]) => `card-${id}` as const;

/** The cards that belong to this challenge and have not been seen, in table order. */
export function pendingCards(
  seen: Readonly<Partial<Record<RuleCard["id"], true>>>,
  challengeId: string | null,
): RuleCard[] {
  if (challengeId === null) return [];
  return RULE_CARDS.filter((card) => card.shownOn === challengeId && seen[card.id] !== true);
}

export interface RuleCardSheetProps {
  card: RuleCard | null;
  /** 1-based position among the cards shown now, with the count, for "1 of 3". */
  position: number;
  total: number;
  onDismiss: () => void;
}

export function RuleCardSheet({ card, position, total, onDismiss }: RuleCardSheetProps) {
  return (
    <AppSheet
      open={card !== null}
      onClose={onDismiss}
      title={card?.title ?? ""}
      class="dr-rulecard"
    >
      <p class="dr-eyebrow">{t("cardEyebrow")}</p>
      <p class="dr-sheet__body" data-testid="rule-card" data-card={card?.id}>
        {card?.text}
      </p>
      {total > 1 ? <p class="dr-note">{t("cardPosition", { position, total })}</p> : null}
      <div class="dr-sheet__actions">
        <Button onClick={onDismiss}>{t("cardGotIt")}</Button>
      </div>
    </AppSheet>
  );
}
