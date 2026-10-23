import { Button, Sheet, Toggle } from "@web-games/kit";
import type { Unlocked } from "@web-games/the-last-window-core";
import { useState } from "preact/hooks";
import { RecipeList } from "../screens/Recipes";
import { useApp, useBack, useProfile, useSettings } from "../state/app";
import { useGameStore } from "../state/useGame";
import { t } from "../strings";

export interface PauseProps {
  open: boolean;
  unlocked: Unlocked;
  onResume: () => void;
  onQuit: () => void;
}

export function Pause({ open, unlocked, onResume, onQuit }: PauseProps) {
  const { router, settings } = useApp();
  const store = useGameStore();
  const profile = useProfile();
  const current = useSettings();
  const [recipes, setRecipes] = useState(false);
  useBack(router, open, () => {
    onResume();
    return true;
  });
  return (
    <Sheet open={open} onClose={onResume} title={t("pauseTitle")} class="tlw-pause">
      <div class="tlw-actions tlw-actions--stack">
        <Button size="large" fullWidth onClick={onResume}>
          {t("pauseResume")}
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setRecipes(!recipes)}>
          {recipes ? t("pauseHideRecipes") : t("pauseRecipes")}
        </Button>
      </div>
      {recipes ? <RecipeList unlocked={unlocked} /> : null}
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
        label={t("settingsGuide")}
        checked={profile.settings.recipeGuide}
        onChange={(value) => void store.setPreference("recipeGuide", value)}
      />
      <Button variant="danger" fullWidth onClick={onQuit}>
        {t("pauseQuit")}
      </Button>
    </Sheet>
  );
}
