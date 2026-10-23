import { Button, Screen } from "@web-games/kit";
import { THEMES, themesUnlocked, totalStamps } from "@web-games/lost-parcel-desk-core";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { deskPalette } from "../theme/deskThemes";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";

export function Themes() {
  const { game } = useApp();
  const profile = useProfile();
  const total = totalStamps(profile);
  const open = new Set(themesUnlocked(profile).map((theme) => theme.id));
  return (
    <Screen name="themes" class="lp-themes">
      <Header title={t("themesTitle")} />
      <p class="lp-subnote">{t("themesStamps", { stamps: total })}</p>
      <ul class="lp-themelist">
        {THEMES.map((theme) => {
          const unlocked = open.has(theme.id);
          const current = profile.themeSelected === theme.id;
          const palette = deskPalette(theme.id);
          return (
            <li
              key={theme.id}
              class={`lp-themecard${current ? " lp-themecard--current" : ""}`}
              data-theme-card={theme.id}
            >
              <span
                class="lp-swatch"
                aria-hidden="true"
                style={{ background: palette.background, borderColor: palette.border }}
              >
                <span
                  class="lp-swatch__blotter"
                  style={{ background: palette.blotter, borderColor: palette.blotterEdge }}
                />
                <span class="lp-swatch__paper" style={{ background: "var(--lp-cream)" }} />
              </span>
              <div class="lp-themecard__body">
                <h2 class="lp-themecard__name">{theme.name}</h2>
                <p class="lp-themecard__desk">{theme.desk}</p>
                <p class="lp-themecard__need">
                  {unlocked ? (
                    t("themeUnlocked")
                  ) : (
                    <>
                      <Icon name="lock" size={14} />{" "}
                      {t("themeNeeds", { stamps: theme.stampsNeeded })}
                    </>
                  )}
                </p>
              </div>
              <Button
                variant={current ? "primary" : "secondary"}
                disabled={!unlocked || current}
                onClick={() => void game.selectTheme(theme.id)}
              >
                {current ? t("themeApplied") : t("themeApply")}
                <span class="lp-sr-only"> {theme.name}</span>
              </Button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
