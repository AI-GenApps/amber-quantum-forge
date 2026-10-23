import { Button, Sheet } from "@web-games/kit";
import { useSheetBack } from "../app/AppContext";
import { EmberIcon } from "../components/icons";
import { t } from "../strings";

export interface HintSheetProps {
  open: boolean;
  tokens: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks before a hint spends a token; with no token it only explains how to earn more. */
export function HintSheet({ open, tokens, onConfirm, onCancel }: HintSheetProps) {
  useSheetBack(open, onCancel);
  const canUse = tokens > 0;
  return (
    <Sheet open={open} onClose={onCancel} title={t("hint.title")} variant="modal">
      <p class="ll-body ll-tokens-line">
        <EmberIcon />
        {canUse ? t("hint.body", { count: tokens }) : t("hint.empty")}
      </p>
      {canUse ? <p class="ll-body ll-muted">{t("hint.stars")}</p> : null}
      <div class="ll-actions">
        <Button variant="secondary" onClick={onCancel}>
          {canUse ? t("common.cancel") : t("common.close")}
        </Button>
        {canUse ? <Button onClick={onConfirm}>{t("hint.confirm")}</Button> : null}
      </div>
    </Sheet>
  );
}
