import type { Settings } from "@web-games/kit";
import { Button, Screen, Toast, Toggle, useToast } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { reduce, routeFor } from "../onboarding/machine";
import { ConfirmSheet } from "../overlays/ConfirmSheet";
import type { Profile } from "../save/profile";
import { useProfile, useSettings } from "../state/hooks";
import { t } from "../strings";

type ResetStep = "none" | "first" | "second";

export function SettingsScreen() {
  const { router, services } = useApp();
  const profile = useProfile(services.progression);
  const settings = useSettings(services.settings);
  const [step, setStep] = useState<ResetStep>("none");
  const toast = useToast();

  const kitToggle = (key: keyof Settings, label: string) => (
    <Toggle
      key={key}
      label={label}
      checked={settings[key]}
      onChange={() => void services.settings.toggle(key)}
    />
  );
  const profileToggle = (key: "showTimer" | "showConflicts" | "hidePathInShare", label: string) => (
    <Toggle
      key={key}
      label={label}
      checked={profile[key]}
      onChange={(checked) =>
        void services.progression.patch({ [key]: checked } as Partial<Profile>)
      }
    />
  );

  const replayTutorial = (): void => {
    const route = routeFor(reduce({ step: "done" }, "replay"));
    if (route.name === "puzzle") router.push("puzzle", { id: route.id });
  };

  const reset = async (): Promise<void> => {
    setStep("none");
    await services.progression.reset();
    await services.flags.clear();
    toast.show(t("toast.reset"), "success");
  };

  return (
    <Screen name="settings" class="ll-screen">
      <ScreenHeader title={t("settings.title")} onBack={() => router.pop()} />
      <section class="ll-group" aria-labelledby="settings-access">
        <h2 id="settings-access" class="ll-subtitle">
          {t("settings.groupAccess")}
        </h2>
        {kitToggle("sound", t("settings.sound"))}
        {kitToggle("music", t("settings.music"))}
        {kitToggle("haptics", t("settings.haptics"))}
        {kitToggle("reducedMotion", t("settings.reducedMotion"))}
        {kitToggle("highContrast", t("settings.highContrast"))}
      </section>
      <section class="ll-group" aria-labelledby="settings-play">
        <h2 id="settings-play" class="ll-subtitle">
          {t("settings.groupPlay")}
        </h2>
        {profileToggle("showTimer", t("settings.showTimer"))}
        {profileToggle("showConflicts", t("settings.showConflicts"))}
        {profileToggle("hidePathInShare", t("settings.hidePath"))}
        <Button variant="secondary" fullWidth onClick={replayTutorial}>
          {t("settings.replayTutorial")}
        </Button>
      </section>
      <section class="ll-group" aria-labelledby="settings-data">
        <h2 id="settings-data" class="ll-subtitle">
          {t("settings.groupData")}
        </h2>
        <Button variant="danger" fullWidth onClick={() => setStep("first")}>
          {t("settings.reset")}
        </Button>
      </section>
      <ConfirmSheet
        open={step === "first"}
        title={t("settings.resetTitle")}
        body={t("settings.resetBody")}
        confirmLabel={t("settings.resetNext")}
        onCancel={() => setStep("none")}
        onConfirm={() => setStep("second")}
      />
      <ConfirmSheet
        open={step === "second"}
        title={t("settings.resetAgainTitle")}
        body={t("settings.resetAgainBody")}
        confirmLabel={t("settings.resetConfirm")}
        danger
        onCancel={() => setStep("none")}
        onConfirm={() => void reset()}
      />
      {toast.toast ? (
        <Toast
          key={toast.toast.id}
          message={toast.toast.message}
          tone={toast.toast.tone}
          onDismiss={toast.dismiss}
        />
      ) : null}
    </Screen>
  );
}
