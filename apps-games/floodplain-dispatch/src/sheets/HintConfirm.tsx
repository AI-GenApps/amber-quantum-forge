import { Button } from "@web-games/kit";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface HintConfirmProps {
  open: boolean;
  price: number;
  coins: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function HintConfirm({ open, price, coins, onConfirm, onClose }: HintConfirmProps) {
  const canAfford = coins >= price;
  return (
    <AppSheet open={open} onClose={onClose} title={t("hintTitle")} variant="modal">
      <p class="fd-sheet__body">{t("hintBody")}</p>
      <p class="fd-sheet__body" data-testid="hint-cost">
        {t("hintCost", { price, coins })}
      </p>
      {canAfford ? null : (
        <p class="fd-sheet__warn" role="alert">
          {t("hintBroke")}
        </p>
      )}
      <div class="fd-sheet__actions">
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button disabled={!canAfford} onClick={onConfirm}>
          {t("hintConfirm")}
        </Button>
      </div>
    </AppSheet>
  );
}
