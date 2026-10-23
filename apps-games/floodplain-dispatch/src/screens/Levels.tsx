import {
  type CampaignMap,
  CHAPTERS,
  findMap,
  mapUnlocked,
  REGIONS,
  type RegionId,
  regionUnlocked,
} from "@web-games/floodplain-dispatch-core";
import { Button, Screen, StarRating } from "@web-games/kit";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Glyph } from "../ui/Glyph";
import { Header } from "../ui/Header";

export function Levels({ region }: { region: RegionId }) {
  const { router } = useApp();
  const profile = useProfile();
  const def = REGIONS.find((entry) => entry.id === region);
  if (!def || !regionUnlocked(profile, region)) {
    return (
      <Screen name="levels">
        <Header title={def?.name ?? t("appName")} />
        <p class="fd-notice" role="status">
          {def ? t("regionNeeds", { needed: def.unlockStars }) : t("boardMissing")}
        </p>
        <Button onClick={() => void router.pop()}>{t("back")}</Button>
      </Screen>
    );
  }
  const chapter = CHAPTERS.find((entry) => entry.region === region);
  const maps = def.mapIds.map((id) => findMap(id)).filter((m): m is CampaignMap => m !== undefined);
  return (
    <Screen name="levels">
      <Header title={t("levelsTitle", { region: def.name })} />
      <p class="fd-chapter">{chapter?.title}</p>
      <ul class="fd-tiles">
        {maps.map((map, index) => {
          const open = mapUnlocked(profile, map.id);
          const stars = profile.stars[map.id] ?? 0;
          const best = profile.best[map.id]?.score;
          const number = index + 1;
          return (
            <li key={map.id}>
              <button
                type="button"
                class="fd-tile fd-hit"
                data-map={map.id}
                data-locked={open ? "no" : "yes"}
                disabled={!open}
                aria-label={
                  open
                    ? t("levelTileLabel", { number, name: map.name, stars, par: map.par })
                    : t("levelLockedLabel", { number, name: map.name })
                }
                onClick={() => open && router.push("board", { mapId: map.id })}
              >
                <span class="fd-tile__num">{number}</span>
                <span class="fd-tile__name">{map.name}</span>
                {open ? (
                  <>
                    <StarRating value={stars} label={t("starsLabel", { stars })} />
                    <span class="fd-tile__meta">
                      {t("levelPar", { par: map.par })}
                      {best !== undefined ? ` - ${t("levelBest", { score: best })}` : ""}
                    </span>
                  </>
                ) : (
                  <span class="fd-tile__meta">
                    <Glyph kind="lock" size={16} /> {t("levelLocked")}
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
