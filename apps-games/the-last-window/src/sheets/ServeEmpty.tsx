import { t } from "../strings";
import { Confirm } from "./Confirm";

export function ServeEmpty({
  open,
  onServe,
  onCancel,
}: {
  open: boolean;
  onServe: () => void;
  onCancel: () => void;
}) {
  return (
    <Confirm
      open={open}
      title={t("emptyTitle")}
      body={t("emptyBody")}
      confirmLabel={t("emptyYes")}
      cancelLabel={t("emptyNo")}
      onConfirm={onServe}
      onCancel={onCancel}
    />
  );
}
