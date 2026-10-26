import { Button, Screen } from "@web-games/kit";
import {
  CAMPAIGN_DAYS,
  campaignComplete,
  GAME_TITLE,
  lateOpen,
} from "@web-games/the-last-window-core";
import { Backdrop } from "../art/Backdrop";
import { useApp, useProfile } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";

export function Home() {
  const { router } = useApp();
  const game = useGame();
  const profile = useProfile();
  const done = campaignComplete(profile);
  const waiting = profile.pendingEvening.length;
  return (
    <Screen name="home" class="tlw-home">
      <Backdrop slot="interior-evening" owned={profile.owned} class="tlw-backdrop--dim" />
      <div class="tlw-home__body">
        <h1 class="tlw-home__name">{GAME_TITLE}</h1>
        <p class="tlw-home__status" data-testid="home-status">
          {done
            ? t("homeStatusDone", { coins: profile.coins })
            : t("homeStatus", { day: profile.day, coins: profile.coins })}
        </p>
        {done ? <p class="tlw-note">{t("homeDone")}</p> : null}
        {game.saveFailed ? (
          <p class="tlw-warn" role="alert">
            {t("saveFailed")}
          </p>
        ) : null}
        <nav class="tlw-menu" aria-label={t("menu")}>
          {waiting > 0 ? (
            <Button
              size="large"
              fullWidth
              onClick={() =>
                router.push("scene", {
                  ids: profile.pendingEvening,
                  index: 0,
                  after: "home",
                  replay: false,
                })
              }
            >
              {t("homeScenes", { count: waiting })}
            </Button>
          ) : null}
          {done ? null : (
            <Button
              size="large"
              fullWidth
              variant={waiting > 0 ? "secondary" : "primary"}
              onClick={() => router.push("day", { day: Math.min(profile.day, CAMPAIGN_DAYS) })}
            >
              {t("homeContinue", { day: profile.day })}
            </Button>
          )}
          {lateOpen(profile) ? (
            <Button
              size="large"
              fullWidth
              variant={done && waiting === 0 ? "primary" : "secondary"}
              onClick={() => router.push("late")}
            >
              {t("homeLate")}
            </Button>
          ) : null}
          <div class="tlw-menu__row">
            <Button variant="secondary" onClick={() => router.push("journal")}>
              {t("homeJournal")}
            </Button>
            <Button variant="secondary" onClick={() => router.push("shop")}>
              {t("homeShop")}
            </Button>
          </div>
          <div class="tlw-menu__row">
            <Button variant="secondary" onClick={() => router.push("recipes")}>
              {t("homeRecipes")}
            </Button>
            <Button variant="secondary" onClick={() => router.push("settings")}>
              {t("homeSettings")}
            </Button>
          </div>
          <div class="tlw-menu__row">
            <Button variant="ghost" onClick={() => router.push("howto")}>
              {t("homeHowTo")}
            </Button>
            <Button variant="ghost" onClick={() => router.push("credits")}>
              {t("homeCredits")}
            </Button>
          </div>
        </nav>
      </div>
    </Screen>
  );
}
