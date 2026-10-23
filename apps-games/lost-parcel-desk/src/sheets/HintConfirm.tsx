import { Button } from "@web-games/kit";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface HintConfirmProps {
  open: boolean;
  price: number;
  postage: number;
  hintsLeft: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HintConfirm({
  open,
  price,
  postage,
  hintsLeft,
  onConfirm,
  onCancel,
}: HintConfirmProps) {
  const short = postage < price;
  return (
    <AppSheet open={open} onClose={onCancel} title={t("hintTitle")} variant="modal">
      <p class="lp-sheetbody">{t("hintBody")}</p>
      <p class="lp-sheetbody" data-testid="hint-price">
        {t("hintPrice", { price, postage })}
      </p>
      <p class="lp-sheetbody">{t("hintsLeft", { left: hintsLeft })}</p>
      {short ? (
        <p class="lp-warn" role="alert">
          {t("hintShort", { need: price - postage })}
        </p>
      ) : null}
      <div class="lp-sheetactions">
        <Button variant="secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button disabled={short || hintsLeft <= 0} onClick={onConfirm}>
          {t("hintBuy", { price })}
        </Button>
      </div>
    </AppSheet>
  );
}
