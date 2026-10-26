import { Button, Sheet } from "@web-games/kit";
import type { ComponentChildren } from "preact";
import { useSheetFx } from "../feedback/hooks";
import { useApp, useBack } from "../state/app";

export interface ConfirmProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ComponentChildren;
}

/** Two-button dialog shared by the quit, serve-empty, purchase, reset and exit sheets. */
export function Confirm({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmProps) {
  const { router } = useApp();
  useSheetFx(open);
  useBack(router, open, () => {
    onCancel();
    return true;
  });
  return (
    <Sheet open={open} onClose={onCancel} title={title} variant="modal" class="tlw-confirm">
      <p>{body}</p>
      {children}
      <div class="tlw-actions">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
