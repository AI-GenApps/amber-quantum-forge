import { MAX_STAMPS } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";
import { Confirm } from "./Confirm";

export interface AccuseConfirmProps {
  open: boolean;
  name: string;
  wrongSoFar: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AccuseConfirm({ open, name, wrongSoFar, onConfirm, onCancel }: AccuseConfirmProps) {
  return (
    <Confirm
      open={open}
      title={t("accuseTitle", { name })}
      body={t("accuseBody", { stamps: Math.max(1, MAX_STAMPS - wrongSoFar - 1) })}
      confirmLabel={t("accuseYes")}
      cancelLabel={t("cancel")}
      confirmClass="lp-own-sfx"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
