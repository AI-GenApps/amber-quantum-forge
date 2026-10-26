import { Button } from "@web-games/kit";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface HintConfirmProps {
  open: boolean;
  price: number;
  coins: number;
  onBuy: () => void;
  onCancel: () => void;
}

export function HintConfirm({ open, price, coins, onBuy, onCancel }: HintConfirmProps) {
  const affordable = coins >= price;
  return (
    <AppSheet open={open} onClose={onCancel} title={t("hintTitle")} variant="modal">
      <p class="dr-sheet__body">{t("hintBody", { price })}</p>
      <p class="dr-sheet__body" data-testid="hint-balance">
        {affordable ? t("hintBalance", { coins }) : t("hintShort", { coins, price })}
      </p>
      <div class="dr-sheet__actions">
        <Button variant="secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button disabled={!affordable} onClick={onBuy}>
          {t("hintBuy", { price })}
        </Button>
      </div>
    </AppSheet>
  );
}
