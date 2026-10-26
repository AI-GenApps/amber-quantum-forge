import { Screen } from "@web-games/kit";
import { caseUnlocked, isClosed, PLACES, POST_OFFICE } from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { MAP_HEIGHT, MAP_WIDTH, PLACE_SPOTS, STREET_LINES } from "../data/townMap";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";

type PlaceState = "delivered" | "open" | "locked";

export function TownMap() {
  const { router } = useApp();
  const profile = useProfile();
  const [note, setNote] = useState<string | null>(null);

  const stateOf = (caseId: string): PlaceState =>
    isClosed(profile, caseId) ? "delivered" : caseUnlocked(profile, caseId) ? "open" : "locked";

  const openPlace = (caseId: string): void => {
    if (!caseUnlocked(profile, caseId)) {
      setNote(t("mapLockedNote", { id: caseId }));
      return;
    }
    setNote(null);
    router.push("intro", { caseId });
  };

  const filled = PLACES.filter((place) => isClosed(profile, place.caseId)).length;

  return (
    <Screen name="map" class="lp-map-screen">
      <Header title={t("mapTitle")} />
      <p class="lp-subnote" data-testid="map-count">
        {t("mapCount", { filled, total: PLACES.length, office: POST_OFFICE })}
      </p>
      <svg class="lp-map" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
        <rect class="lp-map__ground" x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} rx="8" />
        <rect class="lp-map__river" x="0" y="484" width={MAP_WIDTH} height="36" />
        {STREET_LINES.map((street) => (
          <g key={street.id} data-street={street.id}>
            <path class="lp-map__street" d={street.d} />
            <text
              class="lp-map__label"
              x={street.labelAt.x}
              y={street.labelAt.y}
              text-anchor="middle"
            >
              {street.label}
            </text>
          </g>
        ))}
        {PLACE_SPOTS.map((spot) => {
          const state = stateOf(spot.caseId);
          return (
            // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a button; the list below holds the real buttons
            <g
              key={spot.caseId}
              class={`lp-map__place lp-map__place--${state}`}
              data-place={spot.caseId}
              data-state={state}
              role="button"
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") openPlace(spot.caseId);
              }}
              onClick={() => openPlace(spot.caseId)}
            >
              <rect x={spot.x - 20} y={spot.y - 16} width="40" height="32" rx="4" />
              <text x={spot.x} y={spot.y + 4} text-anchor="middle">
                {spot.caseId}
              </text>
            </g>
          );
        })}
      </svg>
      {note !== null ? (
        <p class="lp-notice" role="status" data-testid="map-note">
          {note}
        </p>
      ) : null}
      <ul class="lp-placelist">
        {PLACES.map((place) => {
          const state = stateOf(place.caseId);
          return (
            <li key={place.caseId}>
              <button
                type="button"
                class={`lp-placebtn lp-placebtn--${state}`}
                data-place-button={place.caseId}
                onClick={() => openPlace(place.caseId)}
              >
                {state === "locked" ? (
                  <Icon name="lock" size={16} />
                ) : state === "delivered" ? (
                  <Icon name="tick" size={16} />
                ) : (
                  <Icon name="next" size={16} />
                )}
                <span class="lp-placebtn__name">{place.name}</span>
                <span class="lp-placebtn__meta">
                  {t("mapPlaceMeta", { id: place.caseId, street: place.street })}
                </span>
                <span class="lp-placebtn__state">
                  {state === "delivered"
                    ? t("mapDelivered")
                    : state === "open"
                      ? t("mapOpen")
                      : t("mapLocked")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
