import { Button, Sheet } from "@web-games/kit";
import { useSheetBack } from "../app/AppContext";
import { t } from "../strings";

export interface ConfirmSheetProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal yes/no question. Back and Escape cancel. */
export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  useSheetBack(open, onCancel);
  return (
    <Sheet open={open} onClose={onCancel} title={title} variant="modal">
      <p class="ll-body">{body}</p>
      <div class="ll-actions">
        <Button variant="secondary" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
