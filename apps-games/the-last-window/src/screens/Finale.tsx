import { Button, Screen } from "@web-games/kit";
import {
  FINALE,
  type FinaleVariant,
  finaleLine,
  REGULARS,
  regularOf,
  SCENES_PER_REGULAR,
} from "@web-games/the-last-window-core";
import { Backdrop } from "../art/Backdrop";
import { Portrait } from "../art/Portrait";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";

export function Finale() {
  const { router } = useApp();
  const profile = useProfile();
  return (
    <Screen name="result" class="tlw-page tlw-finale">
      <Backdrop slot="interior-evening" owned={profile.owned} class="tlw-backdrop--dim" />
      <h1 class="tlw-display" data-testid="finale-title">
        {t("finaleTitle")}
      </h1>
      <ul class="tlw-list tlw-finale__cards">
        {REGULARS.map((regular) => {
          const row = regularOf(profile, regular.id);
          const variant: FinaleVariant =
            row.scenesDone >= SCENES_PER_REGULAR && row.ending !== null ? row.ending : "unfinished";
          return (
            <li key={regular.id} class="wg-card tlw-card tlw-finale__card" data-variant={variant}>
              <Portrait
                slot={regular.artPrefix}
                mood={variant === "unfinished" ? "neutral" : "happy"}
                class="tlw-due__face"
              />
              <div>
                <h2 class="wg-card__title">{regular.storyTitle}</h2>
                <p>{finaleLine(regular.id, variant)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p class="tlw-note" data-testid="finale-caption">
        {FINALE.caption}
      </p>
      <p>{t("resultCampaignDone")}</p>
      <Button size="large" fullWidth onClick={() => router.reset("home")}>
        {t("resultHome")}
      </Button>
    </Screen>
  );
}
