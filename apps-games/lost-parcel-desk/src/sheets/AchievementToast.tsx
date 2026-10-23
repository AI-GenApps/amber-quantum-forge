import { Toast } from "@web-games/kit";
import { ACHIEVEMENTS } from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { t } from "../strings";

export interface AchievementToastProps {
  ids: readonly string[];
}

/** Shows earned achievements one after another. */
export function AchievementToast({ ids }: AchievementToastProps) {
  const [shown, setShown] = useState(0);
  const id = ids[shown];
  const title = ACHIEVEMENTS.find((item) => item.id === id)?.title;
  if (id === undefined || title === undefined) return null;
  return (
    <Toast
      message={t("achievementEarned", { title })}
      tone="success"
      durationMs={3200}
      onDismiss={() => setShown((value) => value + 1)}
    />
  );
}
