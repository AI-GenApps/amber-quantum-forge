import { Button, Screen } from "@web-games/kit";
import {
  SUBTITLE,
  TAGLINE,
  TITLE,
  TOTAL_STAMPS,
  totalStamps,
} from "@web-games/lost-parcel-desk-core";
import { Sprite } from "../art/Sprite";
import { useApp, useArtManifest, useProfile } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";
import { PostageCounter } from "../ui/PostageCounter";

export function Home() {
  const { router } = useApp();
  const game = useGame();
  const profile = useProfile();
  const manifest = useArtManifest();
  const live = game.active !== null && !game.active.state.closed ? game.active : null;
  const held = live ? { kind: live.kind, id: live.id } : profile.session;
  const stamps = totalStamps(profile);

  const resume = (): void => {
    if (held === null) return;
    if (held.kind === "daily") router.push("table", { daily: true });
    else router.push("table", { caseId: held.id });
  };

  return (
    <Screen name="home" class="lp-home">
      <header class="lp-hero">
        <Sprite slot="icon" size={84} label={TITLE} {...(manifest ? { manifest } : {})} />
        <h1 class="lp-title">{TITLE}</h1>
        <p class="lp-subtitle">{SUBTITLE}</p>
        <p class="lp-tagline">{TAGLINE}</p>
      </header>
      <p class="lp-statline" data-testid="statline">
        <PostageCounter postage={profile.postage} />
        <span data-testid="stamp-total">{t("homeStamps", { stamps, total: TOTAL_STAMPS })}</span>
      </p>
      {game.saveFailed ? (
        <p class="lp-warn" role="alert">
          {t("homeSaveFailed")}
        </p>
      ) : null}
      <nav class="lp-menu" aria-label={t("homeMenu")}>
        {held ? (
          <Button size="large" fullWidth onClick={resume}>
            {held.kind === "daily" ? t("homeContinueDaily") : t("homeContinue", { id: held.id })}
          </Button>
        ) : null}
        <Button
          size="large"
          fullWidth
          variant={held ? "secondary" : "primary"}
          onClick={() => router.push("files")}
        >
          {t("homeFiles")}
        </Button>
        <Button size="large" fullWidth variant="secondary" onClick={() => router.push("daily")}>
          {profile.daily.streak > 0
            ? t("homeDailyStreak", { streak: profile.daily.streak })
            : t("homeDaily")}
        </Button>
        <div class="lp-menu__grid">
          <Button variant="secondary" onClick={() => router.push("map")}>
            {t("homeMap")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("almanac", { tab: "clues" })}>
            {t("homeAlmanac")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("ledger")}>
            {t("homeLedger")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("achievements")}>
            {t("homeAchievements")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("records")}>
            {t("homeRecords")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("themes")}>
            {t("homeThemes")}
          </Button>
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
