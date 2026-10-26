import { Button, Screen, Toggle } from "@web-games/kit";
import { useState } from "preact/hooks";
import { Confirm } from "../sheets/Confirm";
import { useApp, useSettings } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function Settings() {
  const { settings, game, router } = useApp();
  const current = useSettings();
  const [confirming, setConfirming] = useState(false);
  const rows = [
    ["sound", t("settingsSound")],
    ["music", t("settingsMusic")],
    ["haptics", t("settingsHaptics")],
    ["reducedMotion", t("settingsReduced")],
    ["highContrast", t("settingsContrast")],
  ] as const;
  return (
    <Screen name="settings">
      <Header title={t("settingsTitle")} showCoins={false} />
      <div class="dr-panel">
        {rows.map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            checked={current[key]}
            onChange={() => void settings.toggle(key)}
          />
        ))}
      </div>
      <p class="dr-note">{t("settingsSaved")}</p>
      <Button variant="secondary" fullWidth onClick={() => router.push("credits")}>
        {t("settingsAbout")}
      </Button>
      <Button variant="danger" fullWidth onClick={() => setConfirming(true)}>
        {t("settingsReset")}
      </Button>
      <Confirm
        open={confirming}
        title={t("confirmResetTitle")}
        body={t("confirmResetBody")}
        confirmLabel={t("confirmResetYes")}
        cancelLabel={t("cancel")}
        danger
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void game.resetProgress().then(() => router.reset("home"));
        }}
      />
    </Screen>
  );
}
