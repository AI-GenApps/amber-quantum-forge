import { IconButton } from "@web-games/kit";
import type { ShiftState } from "@web-games/the-last-window-core";
import { coinsText, formatClock } from "../../labels";
import { t } from "../../strings";
import { Glyph } from "../../ui/Glyph";

export interface HudProps {
  state: ShiftState;
  title: string;
  onPause: () => void;
}

export function Hud({ state, title, onPause }: HudProps) {
  const left = Math.max(0, state.def.lengthTicks - state.tick);
  const earned = state.stats.payments + state.stats.tips;
  return (
    <div class="tlw-hud">
      <div class="tlw-hud__block">
        <span class="tlw-hud__label">{title}</span>
        <span
          class="tlw-hud__clock"
          data-testid="clock"
          role="timer"
          aria-label={t("shiftTime", { time: formatClock(left) })}
        >
          <Glyph name="clock" size={18} />{" "}
          {state.phase === "running" ? formatClock(left) : t("shiftClosing")}
        </span>
      </div>
      <span class="tlw-hud__coins" data-testid="earned">
        <Glyph name="coin" size={18} /> {coinsText(earned)}
      </span>
      <IconButton label={t("shiftPause")} variant="secondary" onClick={onPause}>
        <Glyph name="pause" />
      </IconButton>
    </div>
  );
}
