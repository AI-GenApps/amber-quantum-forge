import {
  CHAPTERS,
  type Profile,
  REGIONS,
  type RegionDef,
  regionUnlocked,
} from "@web-games/floodplain-dispatch-core";
import { ProgressBar, Screen } from "@web-games/kit";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Glyph } from "../ui/Glyph";
import { Header } from "../ui/Header";

export const REGION_STARS_MAX = 30 as const;

export function regionStars(profile: Profile, region: RegionDef): number {
  return region.mapIds.reduce((sum, id) => sum + (profile.stars[id] ?? 0), 0);
}

export function Regions() {
  const { router } = useApp();
  const profile = useProfile();
  return (
    <Screen name="regions">
      <Header title={t("regionsTitle")} />
      <ul class="fd-cards">
        {REGIONS.map((region) => {
          const open = regionUnlocked(profile, region.id);
          const stars = regionStars(profile, region);
          const chapter = CHAPTERS.find((entry) => entry.region === region.id);
          return (
            <li key={region.id}>
              <button
                type="button"
                class="fd-card fd-hit"
                data-region={region.id}
                data-locked={open ? "no" : "yes"}
                disabled={!open}
                aria-label={
                  open
                    ? t("regionOpenLabel", { name: region.name, stars, max: REGION_STARS_MAX })
                    : t("regionLockedLabel", { name: region.name, needed: region.unlockStars })
                }
                onClick={() => open && router.push("levels", { region: region.id })}
              >
                <span class="fd-card__title">{region.name}</span>
                <span class="fd-card__sub">{region.mechanic}</span>
                <span class="fd-card__text">{chapter?.intro}</span>
                {open ? (
                  <span class="fd-card__meta">
                    <ProgressBar
                      value={stars}
                      max={REGION_STARS_MAX}
                      label={t("regionStars", { stars, max: REGION_STARS_MAX })}
                    />
                    <span>{t("regionStars", { stars, max: REGION_STARS_MAX })}</span>
                  </span>
                ) : (
                  <span class="fd-card__meta">
                    <Glyph kind="lock" size={18} />
                    <span>{t("regionNeeds", { needed: region.unlockStars })}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
