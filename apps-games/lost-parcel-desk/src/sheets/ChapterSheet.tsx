import { Button } from "@web-games/kit";
import { CHAPTERS } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";
import { PaperCard } from "../ui/PaperCard";
import { AppSheet } from "./AppSheet";

export interface ChapterSheetProps {
  open: boolean;
  chapter: number;
  part: "intro" | "outro";
  onClose: () => void;
}

export function ChapterSheet({ open, chapter, part, onClose }: ChapterSheetProps) {
  const content = CHAPTERS.find((item) => item.id === chapter);
  if (!content) return null;
  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title={t(part === "intro" ? "chapterIntroTitle" : "chapterOutroTitle", {
        n: content.id,
        title: content.title,
      })}
    >
      <PaperCard id={`chapter-${content.id}-${part}`}>
        <p data-testid="chapter-text">{part === "intro" ? content.intro : content.outro}</p>
      </PaperCard>
      <div class="lp-sheetactions">
        <Button onClick={onClose}>{t("chapterContinue")}</Button>
      </div>
    </AppSheet>
  );
}
