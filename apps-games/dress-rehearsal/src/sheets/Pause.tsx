import { Button } from "@web-games/kit";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface PauseProps {
  open: boolean;
  onResume: () => void;
  onBrief: () => void;
  onRestart: () => void;
  onLeave: () => void;
}

export function Pause({ open, onResume, onBrief, onRestart, onLeave }: PauseProps) {
  return (
    <AppSheet open={open} onClose={onResume} title={t("pauseTitle")}>
      <div class="dr-sheet__stack">
        <Button fullWidth onClick={onResume}>
          {t("pauseResume")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onBrief}>
          {t("pauseBrief")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onRestart}>
          {t("pauseRestart")}
        </Button>
        <Button fullWidth variant="danger" onClick={onLeave}>
          {t("pauseLeave")}
        </Button>
      </div>
    </AppSheet>
  );
}
