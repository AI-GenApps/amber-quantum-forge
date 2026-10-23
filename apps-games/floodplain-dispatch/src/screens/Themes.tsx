import { THEMES, themesUnlocked } from "@web-games/floodplain-dispatch-core";
import { Button, Screen } from "@web-games/kit";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { landColor, mapThemeFor } from "../theme/mapThemes";
import { Header } from "../ui/Header";

function Swatch({ id, name }: { id: string; name: string }) {
  const theme = mapThemeFor(id);
  return (
    <svg
      class="fd-swatch"
      viewBox="0 0 64 32"
      width="64"
      height="32"
      role="img"
      aria-label={t("themesSwatch", { name })}
    >
      <rect width="64" height="32" fill={theme.background} />
      <rect x="4" y="4" width="14" height="24" fill={landColor(theme, 1)} />
      <rect x="18" y="4" width="14" height="24" fill={landColor(theme, 5)} />
      <rect x="32" y="4" width="10" height="24" fill={theme.fieldBase} />
      <rect x="42" y="4" width="8" height="24" fill={theme.waterMid} />
      <rect x="50" y="4" width="10" height="24" fill={theme.sea} />
    </svg>
  );
}

export function Themes() {
  const { game } = useApp();
  const profile = useProfile();
  const open = new Set(themesUnlocked(profile).map((theme) => theme.id));
  return (
    <Screen name="themes">
      <Header title={t("themesTitle")} />
      <ul class="fd-list">
        {THEMES.map((theme) => {
          const unlocked = open.has(theme.id);
          const applied = profile.themeSelected === theme.id;
          const state = applied
            ? t("themesStateApplied")
            : unlocked
              ? t("themesStateReady")
              : t("themesStateLocked", { needed: theme.starsNeeded });
          return (
            <li
              key={theme.id}
              class="fd-row"
              data-theme-id={theme.id}
              data-state={applied ? "applied" : unlocked ? "ready" : "locked"}
            >
              <Swatch id={theme.id} name={theme.name} />
              <div class="fd-row__text">
                <span class="fd-row__title">{theme.name}</span>
                <span class="fd-row__sub">
                  {unlocked ? state : t("themesNeeds", { needed: theme.starsNeeded })}
                </span>
              </div>
              <Button
                variant={applied ? "ghost" : "secondary"}
                disabled={!unlocked || applied}
                onClick={() => void game.selectTheme(theme.id)}
              >
                <span class="fd-sr-only">{t("themesLabel", { name: theme.name, state })} </span>
                <span aria-hidden="true">{applied ? t("themesApplied") : t("themesApply")}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
