import { t } from "../strings";
import { Confirm } from "./Confirm";

export function Reset({
  open,
  onReset,
  onCancel,
}: {
  open: boolean;
  onReset: () => void;
  onCancel: () => void;
}) {
  return (
    <Confirm
      open={open}
      title={t("resetTitle")}
      body={t("resetBody")}
      confirmLabel={t("resetYes")}
      cancelLabel={t("resetNo")}
      danger
      onConfirm={onReset}
      onCancel={onCancel}
    />
  );
}
