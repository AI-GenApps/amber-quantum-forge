import { Button, Screen, Toast, Toggle, useToast } from "@web-games/kit";
import { useState } from "preact/hooks";
import { Reset } from "../sheets/Reset";
import { useApp, useProfile, useSettings } from "../state/app";
import { useGameStore } from "../state/useGame";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function Settings() {
  const { settings } = useApp();
  const store = useGameStore();
  const profile = useProfile();
  const current = useSettings();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen name="settings" class="tlw-page">
      <Header title={t("settingsTitle")} />
      <section class="wg-card tlw-card tlw-toggles">
        <Toggle
          label={t("settingsSound")}
          checked={current.sound}
          onChange={() => void settings.toggle("sound")}
        />
        <Toggle
          label={t("settingsMusic")}
          checked={current.music}
          onChange={() => void settings.toggle("music")}
        />
        <Toggle
          label={t("settingsHaptics")}
          checked={current.haptics}
          onChange={() => void settings.toggle("haptics")}
        />
        <Toggle
          label={t("settingsMotion")}
          checked={current.reducedMotion}
          onChange={() => void settings.toggle("reducedMotion")}
        />
        <Toggle
          label={t("settingsContrast")}
          checked={current.highContrast}
          onChange={() => void settings.toggle("highContrast")}
        />
        <Toggle
          label={t("settingsGuide")}
          checked={profile.settings.recipeGuide}
          onChange={(value) => void store.setPreference("recipeGuide", value)}
        />
        <Toggle
          label={t("settingsRelaxed")}
          checked={profile.settings.relaxed}
          onChange={(value) => void store.setPreference("relaxed", value)}
        />
        <Toggle
          label={t("settingsTextSize")}
          checked={profile.settings.textSize === "large"}
          onChange={(value) => void store.setPreference("textSize", value ? "large" : "normal")}
        />
      </section>
      <p class="tlw-muted">{t("settingsResetNote")}</p>
      <Button variant="danger" fullWidth onClick={() => setConfirm(true)}>
        {t("settingsReset")}
      </Button>
      <Reset
        open={confirm}
        onCancel={() => setConfirm(false)}
        onReset={() => {
          setConfirm(false);
          void store.resetProgress().then(() => toast.show(t("resetDone"), "success"));
        }}
      />
      {toast.toast ? (
        <Toast message={toast.toast.message} tone={toast.toast.tone} onDismiss={toast.dismiss} />
      ) : null}
    </Screen>
  );
}
