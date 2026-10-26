import { DECOR_TEXT, type DecorRule } from "@web-games/the-last-window-core";
import { t } from "../strings";
import { Confirm } from "./Confirm";

export interface PurchaseProps {
  rule: DecorRule | null;
  coins: number;
  onBuy: () => void;
  onCancel: () => void;
}

export function Purchase({ rule, coins, onBuy, onCancel }: PurchaseProps) {
  const price = rule?.price ?? 0;
  const short = Math.max(0, price - coins);
  return (
    <Confirm
      open={rule !== null}
      title={t("purchaseTitle", { name: rule?.name ?? "" })}
      body={
        short > 0
          ? t("purchaseShort", { need: short })
          : t("purchaseBody", {
              effect: rule ? DECOR_TEXT[rule.id] : "",
              price,
              left: coins - price,
            })
      }
      confirmLabel={t("purchaseYes")}
      cancelLabel={t("cancel")}
      confirmDisabled={short > 0}
      onConfirm={onBuy}
      onCancel={onCancel}
    />
  );
}
