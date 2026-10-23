import { Button, Sheet } from "@web-games/kit";
import { type ChapterId, getChapter } from "@web-games/lantern-loops-core";
import { useSheetBack } from "../app/AppContext";
import { ArtImage } from "../art/ArtImage";
import { t } from "../strings";

export interface UnlockCelebrationProps {
  chapters: readonly ChapterId[];
  onContinue: () => void;
}

/** Shown when a solve opens a new chapter. */
export function UnlockCelebration({ chapters, onContinue }: UnlockCelebrationProps) {
  const open = chapters.length > 0;
  useSheetBack(open, onContinue);
  return (
    <Sheet open={open} onClose={onContinue} title={t("unlock.title")} variant="modal">
      <div class="ll-celebrate">
        <ArtImage slot="lantern-amber" size={72} />
        {chapters.map((id) => {
          const chapter = getChapter(id);
          return (
            <p key={id} class="ll-body" data-unlocked={id}>
              {t("unlock.body", { title: chapter.title, blurb: chapter.blurb })}
            </p>
          );
        })}
      </div>
      <div class="ll-actions">
        <Button onClick={onContinue}>{t("common.continue")}</Button>
      </div>
    </Sheet>
  );
}
