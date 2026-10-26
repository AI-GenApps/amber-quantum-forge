import { formatNumber } from "@web-games/cloud-observatory-core";
import { ProgressBar, Screen } from "@web-games/kit";
import { useApp } from "../app/context";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";
import { cx } from "../ui/cx";
import { achievementViews } from "./derive";

export function AchievementsScreen() {
  const { snapshot } = useApp();
  const views = achievementViews(snapshot.profile);
  const unlocked = views.filter((view) => view.unlocked).length;
  return (
    <Screen name="achievements" class="co-screen">
      <ScreenHeader title={t("achievements.title")} />
      <p class="co-journal-count" data-unlocked={unlocked}>
        {t("achievements.count", { count: unlocked, total: views.length })}
      </p>
      <ul class="co-list co-scroll">
        {views.map((view) => (
          <li
            key={view.def.id}
            class={cx("co-ach", view.unlocked && "co-ach--done")}
            data-achievement={view.def.id}
            data-state={view.unlocked ? "unlocked" : "locked"}
          >
            <span class="co-ach__icon">
              <Icon name={view.unlocked ? "check" : "lock"} />
            </span>
            <div class="co-ach__main">
              <h3 class="co-ach__name">{view.def.name}</h3>
              <p class="co-ach__desc">{view.def.description}</p>
              <ProgressBar
                value={view.current}
                max={view.target}
                label={t("achievements.progressLabel", { name: view.def.name })}
              />
              <p class="co-ach__progress">
                {view.unlocked
                  ? t("achievements.done")
                  : t("achievements.progress", {
                      current: formatNumber(view.current),
                      target: formatNumber(view.target),
                    })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
