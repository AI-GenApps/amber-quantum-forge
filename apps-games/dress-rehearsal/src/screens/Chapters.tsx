import {
  CHAPTERS,
  challengesOfChapter,
  chapterUnlocked,
  MAX_STARS_PER_CHALLENGE,
} from "@web-games/dress-rehearsal-core";
import { Screen, StarRating } from "@web-games/kit";
import { Sprite } from "../art/Sprite";
import { backdropSlot } from "../art/slots";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";

export function Chapters() {
  const { router, artManifest } = useApp();
  const profile = useProfile();
  return (
    <Screen name="chapters">
      <Header title={t("chaptersTitle")} />
      <ul class="dr-list" data-testid="chapter-list">
        {CHAPTERS.map((chapter) => {
          const members = challengesOfChapter(chapter.index);
          const max = members.length * MAX_STARS_PER_CHALLENGE;
          const earned = members.reduce((sum, def) => sum + (profile.stars[def.id] ?? 0), 0);
          const open = chapterUnlocked(profile, chapter.index);
          const label = open
            ? t("chapterOpenLabel", { title: chapter.title, stars: earned, max })
            : t("chapterLockedLabel", { title: chapter.title, needed: chapter.unlockStars });
          return (
            <li key={chapter.themeId}>
              <button
                type="button"
                class="dr-card dr-chapter"
                data-chapter={chapter.themeId}
                data-locked={open ? "false" : "true"}
                style={{ "--dr-accent": chapter.accent }}
                disabled={!open}
                aria-label={label}
                onClick={() => router.push("challenges", { chapter: chapter.index })}
              >
                <span class="dr-chapter__band">
                  <span class="dr-chapter__title">{chapter.title}</span>
                  {open ? null : <Icon name="lock" size={20} />}
                </span>
                <span class="dr-chapter__body">
                  <span class="dr-chapter__art" aria-hidden="true">
                    <Sprite
                      slot={backdropSlot(chapter.themeId)}
                      size={48}
                      decorative
                      {...(artManifest ? { manifest: artManifest } : {})}
                    />
                  </span>
                  <span class="dr-chapter__text">
                    <span class="dr-chapter__sub">{chapter.chapterTitle}</span>
                    {open ? (
                      <span class="dr-chapter__stars">
                        <StarRating
                          value={Math.round((earned / max) * 3)}
                          label={t("chapterStars", { stars: earned, max })}
                        />
                        <span>{t("chapterStars", { stars: earned, max })}</span>
                      </span>
                    ) : (
                      <span class="dr-chapter__need">
                        {t("chapterNeeds", { needed: chapter.unlockStars })}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
