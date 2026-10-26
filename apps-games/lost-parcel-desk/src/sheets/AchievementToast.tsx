import { Toast } from "@web-games/kit";
import { ACHIEVEMENTS } from "@web-games/lost-parcel-desk-core";
import { useEffect, useRef, useState } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { useFeedback } from "../state/app";
import { t } from "../strings";

export interface AchievementToastProps {
  ids: readonly string[];
}

/** Shows earned achievements one after another, each sliding in with its sound. */
export function AchievementToast({ ids }: AchievementToastProps) {
  const [shown, setShown] = useState(0);
  const feedback = useFeedback();
  const motion = useMotion();
  const holder = useRef<HTMLDivElement>(null);
  const id = ids[shown];
  const title = ACHIEVEMENTS.find((item) => item.id === id)?.title;
  const visible = id !== undefined && title !== undefined;
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per toast
  useEffect(() => {
    if (!visible) return;
    feedback.fire({ type: "achievement" });
    const toast = holder.current?.firstElementChild;
    if (toast instanceof HTMLElement) void motion.toastSlide(toast);
  }, [shown, visible]);
  if (!visible) return null;
  return (
    <div ref={holder} style={{ display: "contents" }}>
      <Toast
        message={t("achievementEarned", { title })}
        tone="success"
        durationMs={3200}
        onDismiss={() => setShown((value) => value + 1)}
      />
    </div>
  );
}
