import { Screen, StarRating } from "@web-games/kit";
import {
  CHAPTERS,
  chapterSolved,
  chapterStars,
  isChapterUnlocked,
  MAX_STARS,
  PUZZLES_PER_CHAPTER,
  starsToUnlock,
  totalStars,
} from "@web-games/lantern-loops-core";
import { useApp } from "../app/AppContext";
import { Backdrop } from "../components/Backdrop";
import { LockIcon } from "../components/icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { useProfile } from "../state/hooks";
import { t } from "../strings";

export function ChaptersScreen() {
  const { router, services } = useApp();
  const profile = useProfile(services.progression);
  const total = totalStars(profile.stars);
  const perChapter = PUZZLES_PER_CHAPTER * 3;

  return (
    <Screen name="chapters" class="ll-screen">
      <Backdrop chapter="harbor" />
      <ScreenHeader
        title={t("chapters.title")}
        onBack={() => router.pop()}
        right={<span class="ll-chip">{t("chapters.total", { count: total })}</span>}
      />
      <ul class="ll-list">
        {CHAPTERS.map((chapter) => {
          const unlocked = isChapterUnlocked(chapter.id, total);
          const stars = chapterStars(profile.stars, chapter.id);
          const solved = chapterSolved(profile.stars, chapter.id);
          const missing = starsToUnlock(chapter.id, total);
          return (
            <li key={chapter.id}>
              <button
                type="button"
                class="ll-chapter"
                data-chapter={chapter.id}
                data-locked={unlocked ? "false" : "true"}
                disabled={!unlocked}
                aria-label={t("chapters.open", { title: chapter.title })}
                onClick={() => router.push("puzzleList", { chapter: chapter.id })}
              >
                <span class="wg-card wg-card--raised ll-chapter-card">
                  <span class="ll-chapter-head">
                    <span class="ll-chapter-name">{chapter.title}</span>
                    {unlocked ? (
                      <StarRating value={Math.round((stars / perChapter) * 3)} />
                    ) : (
                      <span class="ll-locked">
                        <LockIcon />
                        {t("chapters.locked")}
                      </span>
                    )}
                  </span>
                  <span class="ll-chapter-blurb">{chapter.blurb}</span>
                  {unlocked ? (
                    <>
                      <span
                        class="wg-progress ll-chapter-bar"
                        role="progressbar"
                        aria-label={t("chapters.stars", { count: stars, max: perChapter })}
                        aria-valuemin={0}
                        aria-valuemax={perChapter}
                        aria-valuenow={stars}
                      >
                        <span
                          class="wg-progress__fill"
                          style={{ transform: `scaleX(${stars / perChapter})` }}
                        />
                      </span>
                      <span class="ll-chapter-meta">
                        {t("chapters.stars", { count: stars, max: perChapter })}
                        {" · "}
                        {t("chapters.solved", { count: solved, max: PUZZLES_PER_CHAPTER })}
                      </span>
                    </>
                  ) : (
                    <span class="ll-chapter-meta" data-testid="stars-to-go">
                      {t("chapters.toGo", { count: missing })}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <span class="ll-sr">{t("common.stars", { count: total, max: MAX_STARS })}</span>
    </Screen>
  );
}
