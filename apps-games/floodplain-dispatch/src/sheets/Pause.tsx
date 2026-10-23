import { Button } from "@web-games/kit";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface PauseProps {
  open: boolean;
  canClear: boolean;
  onResume: () => void;
  onClear: () => void;
  onHowTo: () => void;
  onExit: () => void;
}

export function Pause({ open, canClear, onResume, onClear, onHowTo, onExit }: PauseProps) {
  return (
    <AppSheet open={open} onClose={onResume} title={t("pauseTitle")}>
      <div class="fd-sheet__stack">
        <Button fullWidth onClick={onResume}>
          {t("pauseResume")}
        </Button>
        <Button fullWidth variant="secondary" disabled={!canClear} onClick={onClear}>
          {t("pauseRestart")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onHowTo}>
          {t("pauseHowTo")}
        </Button>
        <Button fullWidth variant="danger" onClick={onExit}>
          {t("pauseExit")}
        </Button>
      </div>
    </AppSheet>
  );
}
