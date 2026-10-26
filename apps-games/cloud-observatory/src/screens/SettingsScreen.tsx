import { Screen, Toggle } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";

type SettingKey = "sound" | "music" | "haptics" | "reducedMotion" | "highContrast";

const ROWS: ReadonlyArray<readonly [SettingKey, string]> = [
  ["sound", t("settings.sound")],
  ["music", t("settings.music")],
  ["haptics", t("settings.haptics")],
  ["reducedMotion", t("settings.reducedMotion")],
  ["highContrast", t("settings.highContrast")],
];

export function SettingsScreen() {
  const { session, settings, router } = useApp();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const erase = async () => {
    setStep(0);
    await session.reset();
    router.reset("title");
  };

  return (
    <Screen name="settings" class="co-screen">
      <ScreenHeader title={t("settings.title")} />
      <div class="co-settings co-scroll">
        {ROWS.map(([key, label]) => (
          <Toggle
            key={key}
            class="co-toggle"
            label={label}
            checked={settings[key]}
            onChange={(checked) => void session.settings.set({ [key]: checked })}
          />
        ))}
        <p class="co-settings__note">{t("settings.motionNote")}</p>
        <Btn variant="secondary" fullWidth onClick={() => router.push("howto")}>
          {t("menu.howToPlay")}
        </Btn>
        <h2 class="co-section">{t("settings.dataTitle")}</h2>
        <Btn variant="danger" fullWidth onClick={() => setStep(1)}>
          {t("settings.reset")}
        </Btn>
      </div>
      <ManagedSheet
        open={step > 0}
        variant="modal"
        title={step === 1 ? t("settings.resetTitle") : t("settings.resetSure")}
        onClose={() => setStep(0)}
      >
        <div class="co-stack" data-reset-step={step}>
          <p>{step === 1 ? t("settings.resetBody") : t("settings.resetFinal")}</p>
          {step === 1 ? (
            <Btn variant="danger" fullWidth onClick={() => setStep(2)}>
              {t("settings.resetContinue")}
            </Btn>
          ) : (
            <Btn variant="danger" fullWidth onClick={erase}>
              {t("settings.resetConfirm")}
            </Btn>
          )}
          <Btn variant="secondary" fullWidth onClick={() => setStep(0)}>
            {t("common.cancel")}
          </Btn>
        </div>
      </ManagedSheet>
    </Screen>
  );
}
