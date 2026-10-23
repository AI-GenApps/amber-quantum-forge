import { Button } from "@web-games/kit";
import { AppSheet } from "./AppSheet";

export interface ConfirmProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <AppSheet open={open} onClose={onCancel} title={title} variant="modal">
      <p class="lp-sheetbody">{body}</p>
      <div class="lp-sheetactions">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </AppSheet>
  );
}
