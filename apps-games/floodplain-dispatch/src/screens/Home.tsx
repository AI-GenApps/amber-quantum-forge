import {
  GAME_TITLE,
  REGIONS,
  starsToNextUnlock,
  TAGLINE,
  THEMES,
  TOTAL_STARS,
  totalStars,
} from "@web-games/floodplain-dispatch-core";
import { Button, Screen } from "@web-games/kit";
import { Sprite } from "../art/Sprite";
import { useApp, useProfile } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";

export function nextUnlockText(profile: ReturnType<typeof useProfile>): string | null {
  const next = starsToNextUnlock(profile);
  if (!next) return null;
  const name =
    next.kind === "region"
      ? (REGIONS.find((region) => region.id === next.id)?.name ?? next.id)
      : (THEMES.find((theme) => theme.id === next.id)?.name ?? next.id);
  return t("homeNextUnlock", { remaining: next.remaining, name });
}

export function Home() {
  const { router } = useApp();
  const game = useGame();
  const profile = useProfile();
  const unlock = nextUnlockText(profile);
  return (
    <Screen name="home" class="fd-home">
      <div class="fd-hero">
        <Sprite slot="key-art" size={160} label={GAME_TITLE} />
      </div>
      <h1 class="fd-title">{GAME_TITLE}</h1>
      <p class="fd-tagline">{TAGLINE}</p>
      <p class="fd-statline" data-testid="statline">
        <span>{t("homeStars", { stars: totalStars(profile), total: TOTAL_STARS })}</span>
        <span>{t("homeCoins", { coins: profile.coins })}</span>
      </p>
      {unlock ? <p class="fd-unlock">{unlock}</p> : null}
      {game.saveFailed ? (
        <p class="fd-warn" role="alert">
          {t("homeSaveFailed")}
        </p>
      ) : null}
      <nav class="fd-menu" aria-label="Main menu">
        <Button size="large" fullWidth onClick={() => router.push("regions")}>
          {t("homePlay")}
        </Button>
        <Button size="large" fullWidth variant="secondary" onClick={() => router.push("daily")}>
          {t("homeDaily")}
          {profile.daily.streak > 0
            ? ` - ${t("homeStreak", { streak: profile.daily.streak })}`
            : ""}
        </Button>
        <div class="fd-menu__row">
          <Button variant="secondary" onClick={() => router.push("themes")}>
            {t("homeThemes")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("records")}>
            {t("homeRecords")}
          </Button>
        </div>
        <div class="fd-menu__row">
          <Button variant="secondary" onClick={() => router.push("howto")}>
            {t("homeHowTo")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("settings")}>
            {t("homeSettings")}
          </Button>
        </div>
        <Button variant="ghost" onClick={() => router.push("credits")}>
          {t("homeCredits")}
        </Button>
      </nav>
    </Screen>
  );
}
