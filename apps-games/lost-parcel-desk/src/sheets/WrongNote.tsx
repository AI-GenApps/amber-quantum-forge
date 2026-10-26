import { Button } from "@web-games/kit";
import { RETURN_TO_SENDER } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";
import { PaperCard } from "../ui/PaperCard";
import { RubberStamp } from "../ui/RubberStamp";
import { AppSheet } from "./AppSheet";

export interface WrongNoteProps {
  open: boolean;
  name: string;
  note: string;
  stampsLeft: number;
  onClose: () => void;
}

export function WrongNote({ open, name, note, stampsLeft, onClose }: WrongNoteProps) {
  return (
    <AppSheet open={open} onClose={onClose} title={t("wrongTitle", { name })} variant="modal">
      <PaperCard id={`wrong-${name}`} class="lp-wrongnote">
        <RubberStamp text={RETURN_TO_SENDER} fall id={name} />
        <p data-testid="wrong-note">{note}</p>
        <p class="lp-sheetbody">{t("wrongStamps", { stamps: stampsLeft })}</p>
      </PaperCard>
      <div class="lp-sheetactions">
        <Button onClick={onClose}>{t("wrongContinue")}</Button>
      </div>
    </AppSheet>
  );
}
