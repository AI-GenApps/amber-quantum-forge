import { Screen } from "@web-games/kit";
import { ACHIEVEMENTS } from "@web-games/lost-parcel-desk-core";
import { useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";
import { PaperCard } from "../ui/PaperCard";

export function Achievements() {
  const profile = useProfile();
  const earned = ACHIEVEMENTS.filter((item) => profile.achievements[item.id] === true).length;
  return (
    <Screen name="achievements" class="lp-achievements">
      <Header title={t("achievementsTitle")} />
      <p class="lp-subnote" data-testid="achievement-count">
        {t("achievementsCount", { earned, total: ACHIEVEMENTS.length })}
      </p>
      <ul class="lp-badges">
        {ACHIEVEMENTS.map((item) => {
          const done = profile.achievements[item.id] === true;
          return (
            <li key={item.id}>
              <PaperCard
                id={item.id}
                as="article"
                class={`lp-badge${done ? " lp-badge--earned" : ""}`}
                tilt={0}
              >
                <h2 class="lp-badge__title">
                  <Icon name={done ? "stamp" : "lock"} size={20} /> {item.title}
                </h2>
                <p class="lp-badge__cond">{item.condition}</p>
                <p class="lp-badge__state" data-state={done ? "earned" : "locked"}>
                  {done ? t("badgeEarned") : t("badgeLocked")}
                </p>
              </PaperCard>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
