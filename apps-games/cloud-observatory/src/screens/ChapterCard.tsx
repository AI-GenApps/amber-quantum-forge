import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { loreSlot } from "../ui/art-slots";

export interface ChapterCardProps {
  chapter: { readonly chapter: number; readonly title: string } | null;
  onClose: () => void;
}

/** Interstitial shown when the first entry of a new chapter unlocks. */
export function ChapterCard({ chapter, onClose }: ChapterCardProps) {
  return (
    <ManagedSheet
      open={chapter !== null}
      title={chapter ? t("chapter.heading", { number: chapter.chapter }) : ""}
      onClose={onClose}
    >
      {chapter ? (
        <div
          class="co-stack co-chapter-card"
          data-sheet="chapter-card"
          data-chapter={chapter.chapter}
        >
          <ArtImage slot={loreSlot(chapter.chapter)} class="co-chapter-card__art" />
          <h3 class="co-chapter-card__title">{chapter.title}</h3>
          <Btn fullWidth onClick={onClose}>
            {t("chapter.continue")}
          </Btn>
        </div>
      ) : null}
    </ManagedSheet>
  );
}
