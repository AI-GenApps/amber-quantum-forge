import {
  CHAPTERS,
  GAME_TITLE,
  type Profile,
  starsToNextUnlock,
  TAGLINE,
  TOTAL_STARS,
  totalStars,
} from "@web-games/dress-rehearsal-core";
import { Button, Screen } from "@web-games/kit";
import { Sprite } from "../art/Sprite";
import { useApp, useGameState, useProfile } from "../state/app";
import { t } from "../strings";
import { CoinBadge } from "../ui/Header";

export function nextUnlockText(profile: Profile): string | null {
  const next = starsToNextUnlock(profile);
  if (!next) return null;
  const name = CHAPTERS[next.chapterIndex]?.title ?? "";
  return t("homeNextUnlock", { needed: next.needed, name });
}

export function Home() {
  const { router, artManifest } = useApp();
  const game = useGameState();
  const profile = useProfile();
  const unlock = nextUnlockText(profile);
  return (
    <Screen name="home" class="dr-home">
      <div class="dr-hero">
        <Sprite
          slot="key-art"
          size={120}
          label={GAME_TITLE}
          {...(artManifest ? { manifest: artManifest } : {})}
        />
      </div>
      <h1 class="dr-title">{GAME_TITLE}</h1>
      <p class="dr-tagline">{TAGLINE}</p>
      <p class="dr-statline" data-testid="statline">
        <span>{t("homeStars", { stars: totalStars(profile), total: TOTAL_STARS })}</span>
        <CoinBadge />
      </p>
      {unlock ? <p class="dr-unlock">{unlock}</p> : null}
      {game.saveFailed ? (
        <p class="dr-warn" role="alert">
          {t("homeSaveFailed")}
        </p>
      ) : null}
      <nav class="dr-menu" aria-label={t("homeMenu")}>
        <Button size="large" fullWidth onClick={() => router.push("chapters")}>
          {t("homePlay")}
        </Button>
        <Button size="large" fullWidth variant="secondary" onClick={() => router.push("daily")}>
          {t("homeDaily")}
          {profile.daily.streak > 0
            ? ` - ${t("homeStreak", { streak: profile.daily.streak })}`
            : ""}
        </Button>
        <div class="dr-menu__row">
          <Button variant="secondary" onClick={() => router.push("closet")}>
            {t("homeCloset")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("clients")}>
            {t("homeClients")}
          </Button>
        </div>
        <div class="dr-menu__row">
          <Button variant="secondary" onClick={() => router.push("gallery")}>
            {t("homeGallery")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("howto")}>
            {t("homeHowTo")}
          </Button>
        </div>
        <div class="dr-menu__row">
          <Button variant="secondary" onClick={() => router.push("settings")}>
            {t("homeSettings")}
          </Button>
          <Button variant="ghost" onClick={() => router.push("credits")}>
            {t("homeCredits")}
          </Button>
        </div>
      </nav>
    </Screen>
  );
}
