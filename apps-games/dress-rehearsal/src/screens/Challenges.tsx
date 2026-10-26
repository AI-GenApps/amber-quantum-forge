import {
  CHAPTERS,
  CLIENT_IDS,
  challengeStars,
  challengesOfChapter,
  challengeUnlocked,
  chapterUnlocked,
} from "@web-games/dress-rehearsal-core";
import { Screen, StarRating } from "@web-games/kit";
import { Sprite } from "../art/Sprite";
import { clientSlot } from "../art/slots";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";

export function Challenges({ chapter: index }: { chapter: number }) {
  const { router, artManifest } = useApp();
  const profile = useProfile();
  const chapter = CHAPTERS[index];
  if (!chapter || !chapterUnlocked(profile, index)) {
    return (
      <Screen name="challenges">
        <Header title={t("challengesTitle")} />
        <p class="dr-note">{t("chapterNeeds", { needed: chapter?.unlockStars ?? 0 })}</p>
      </Screen>
    );
  }
  const members = challengesOfChapter(index);
  return (
    <Screen name="challenges">
      <Header title={chapter.title} />
      <p class="dr-note">{chapter.intro}</p>
      <ul class="dr-grid" data-testid="challenge-list" style={{ "--dr-accent": chapter.accent }}>
        {members.map((def, position) => {
          const open = challengeUnlocked(profile, def.id);
          const stars = challengeStars(profile, def.id);
          const clientIndex = Math.max(0, CLIENT_IDS.indexOf(def.clientId));
          const label = open
            ? t("challengeOpenLabel", { number: position + 1, name: def.name, stars })
            : t("challengeLockedLabel", { number: position + 1, name: def.name });
          return (
            <li key={def.id}>
              <button
                type="button"
                class="dr-card dr-tile"
                data-challenge={def.id}
                data-locked={open ? "false" : "true"}
                disabled={!open}
                aria-label={label}
                onClick={() => router.push("styling", { challengeId: def.id })}
              >
                <span class="dr-tile__number">{position + 1}</span>
                <Sprite
                  slot={clientSlot(clientIndex)}
                  size={48}
                  decorative
                  {...(artManifest ? { manifest: artManifest } : {})}
                />
                <span class="dr-tile__name">{def.name}</span>
                {open ? (
                  <StarRating value={stars} label={t("starsLabel", { stars })} />
                ) : (
                  <span class="dr-tile__lock">
                    <Icon name="lock" size={18} />
                    <span>{t("challengeLocked")}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
