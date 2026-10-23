import { Button, Sheet } from "@web-games/kit";
import { useSheetBack } from "../app/AppContext";
import { t } from "../strings";

export type CoachKind = "bridge" | "sky";

export interface CoachCardProps {
  kind: CoachKind | null;
  onDismiss: () => void;
}

/** One-time card that introduces mirrors (Bridge 1) or gates (Sky 1). */
export function CoachCard({ kind, onDismiss }: CoachCardProps) {
  useSheetBack(kind !== null, onDismiss);
  return (
    <Sheet open={kind !== null} onClose={onDismiss} title={t("coach.title")} variant="modal">
      <p class="ll-body">{kind === "sky" ? t("coach.sky") : t("coach.bridge")}</p>
      <div class="ll-actions">
        <Button onClick={onDismiss}>{t("coach.gotIt")}</Button>
      </div>
    </Sheet>
  );
}
