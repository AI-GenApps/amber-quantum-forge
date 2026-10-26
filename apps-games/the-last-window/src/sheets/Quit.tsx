import { t } from "../strings";
import { Confirm } from "./Confirm";

export function Quit({
  open,
  onQuit,
  onStay,
}: {
  open: boolean;
  onQuit: () => void;
  onStay: () => void;
}) {
  return (
    <Confirm
      open={open}
      title={t("quitTitle")}
      body={t("quitBody")}
      confirmLabel={t("quitYes")}
      cancelLabel={t("quitNo")}
      danger
      onConfirm={onQuit}
      onCancel={onStay}
    />
  );
}
