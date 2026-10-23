import { Button, Sheet } from "@web-games/kit";
import { useSheetBack } from "../app/AppContext";
import { t } from "../strings";

export interface PauseSheetProps {
  open: boolean;
  canRestart: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onLeave: () => void;
}

export function PauseSheet({
  open,
  canRestart,
  onResume,
  onRestart,
  onHowTo,
  onSettings,
  onLeave,
}: PauseSheetProps) {
  useSheetBack(open, onResume);
  return (
    <Sheet open={open} onClose={onResume} title={t("pause.title")}>
      <div class="ll-stack">
        <Button fullWidth onClick={onResume}>
          {t("pause.resume")}
        </Button>
        <Button fullWidth variant="secondary" disabled={!canRestart} onClick={onRestart}>
          {t("pause.restart")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onHowTo}>
          {t("pause.howto")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onSettings}>
          {t("pause.settings")}
        </Button>
        <Button fullWidth variant="ghost" onClick={onLeave}>
          {t("pause.leave")}
        </Button>
      </div>
    </Sheet>
  );
}
