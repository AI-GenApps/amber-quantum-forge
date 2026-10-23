import { Card, Screen } from "@web-games/kit";
import { version } from "@web-games/lantern-loops-core";
import { useApp } from "../app/AppContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";

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
    </Screen>
  );
}
