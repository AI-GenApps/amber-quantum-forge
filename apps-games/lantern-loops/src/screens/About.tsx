import { Card, Screen } from "@web-games/kit";
import { version } from "@web-games/lantern-loops-core";
import { useApp } from "../app/AppContext";
import { audioCredits } from "../audio/credits";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";
import { FONT_CREDITS } from "../theme/fonts";

export function AboutScreen() {
  const { router } = useApp();
  return (
    <Screen name="about" class="ll-screen">
      <ScreenHeader title={t("about.title")} onBack={() => router.pop()} />
      <Card tone="raised" title={t("app.title")}>
        <p class="ll-body" data-testid="version">
          {t("about.version", { version })}
        </p>
        <p class="ll-body">{t("about.fonts")}</p>
        <p class="ll-body">{t("about.audio")}</p>
        <p class="ll-body">{t("about.privacy")}</p>
      </Card>
      <section class="ll-group" aria-labelledby="about-fonts">
        <h2 id="about-fonts" class="ll-subtitle">
          {t("about.fontsTitle")}
        </h2>
        <ul class="ll-credits" data-testid="font-credits">
          {FONT_CREDITS.map((font) => (
            <li key={font.family} class="ll-muted">
              {t("about.font", {
                family: font.family,
                role:
                  font.role === "display" ? t("about.fontRoleDisplay") : t("about.fontRoleBody"),
                licence: font.licence,
                url: font.url,
              })}
            </li>
          ))}
        </ul>
      </section>
      <section class="ll-group" aria-labelledby="about-audio">
        <h2 id="about-audio" class="ll-subtitle">
          {t("about.audioTitle")}
        </h2>
        <ul class="ll-credits" data-testid="audio-credits">
          {audioCredits().map((credit) => (
            <li key={credit.packUrl} class="ll-muted">
              {t("about.pack", {
                pack: credit.pack,
                licence: credit.licence,
                url: credit.packUrl,
                ids: credit.ids.join(", "),
              })}
            </li>
          ))}
        </ul>
      </section>
    </Screen>
  );
}
