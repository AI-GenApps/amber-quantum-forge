import { Screen, StarRating } from "@web-games/kit";
import {
  type ChapterId,
  chapterPuzzles,
  getChapter,
  isChapterUnlocked,
  starsToUnlock,
  totalStars,
} from "@web-games/lantern-loops-core";
import { useApp } from "../app/AppContext";
import { ArtImage } from "../art/ArtImage";
import { Backdrop } from "../components/Backdrop";
import { ScreenHeader } from "../components/ScreenHeader";
import { useProfile } from "../state/hooks";
import { t } from "../strings";

export function PuzzleListScreen({ chapter }: { chapter: ChapterId }) {
  const { router, services } = useApp();
  const profile = useProfile(services.progression);
  const info = getChapter(chapter);
  const total = totalStars(profile.stars);
  const open = isChapterUnlocked(chapter, total);

  return (
    <Screen name="puzzle-list" class="ll-screen">
      <Backdrop chapter={chapter} />
      <ScreenHeader title={t("list.title", { title: info.title })} onBack={() => router.pop()} />
      {open ? (
        <ul class="ll-puzzle-grid">
          {chapterPuzzles(chapter).map((record) => {
            const stars = profile.stars[record.id] ?? 0;
            return (
              <li key={record.id}>
                <button
                  type="button"
                  class="ll-puzzle-btn"
                  data-puzzle={record.id}
                  data-stars={stars}
                  aria-label={`${t("list.puzzle", {
                    number: record.index,
                    title: record.title,
                    size: t("common.boardSize", { size: record.size }),
                  })}, ${stars > 0 ? t("list.puzzleStars", { count: stars }) : t("list.puzzleNew")}`}
                  onClick={() => router.push("puzzle", { id: record.id })}
                >
                  <ArtImage slot={stars > 0 ? "lantern-amber" : "lantern-unlit"} size={36} />
                  <span class="ll-puzzle-num">{record.index}</span>
                  <StarRating class="ll-puzzle-stars" value={stars} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div class="ll-empty" data-testid="list-locked">
          <h2 class="ll-subtitle">{t("list.lockedTitle")}</h2>
          <p class="ll-body">{t("list.lockedBody", { count: starsToUnlock(chapter, total) })}</p>
        </div>
      )}
    </Screen>
  );
}
