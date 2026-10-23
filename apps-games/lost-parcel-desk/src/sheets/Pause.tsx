import { Button } from "@web-games/kit";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface PauseProps {
  open: boolean;
  onResume: () => void;
  onSettings: () => void;
  onLeave: () => void;
}

export function Pause({ open, onResume, onSettings, onLeave }: PauseProps) {
  return (
    <AppSheet open={open} onClose={onResume} title={t("pauseTitle")}>
      <p class="lp-sheetbody">{t("pauseBody")}</p>
      <div class="lp-linkmenu">
        <Button fullWidth onClick={onResume}>
          {t("pauseResume")}
        </Button>
        <Button fullWidth variant="secondary" onClick={onSettings}>
          {t("pauseSettings")}
        </Button>
        <Button fullWidth variant="ghost" onClick={onLeave}>
          {t("pauseLeave")}
        </Button>
      </div>
    </AppSheet>
  );
}
