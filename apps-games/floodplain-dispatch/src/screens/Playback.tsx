import { Button, plural } from "@web-games/kit";
import { type PlaybackState, SPEEDS, type Speed, weekAt } from "../session/playback";
import { t } from "../strings";
import { Glyph, type GlyphKind } from "../ui/Glyph";

export interface PlaybackBarProps {
  state: PlaybackState;
  total: number;
  weeks: number;
  counts: { supplied: number; flooded: number; irrigated: number };
  totals: { houses: number; fields: number };
  onToggle: () => void;
  onSpeed: (speed: Speed) => void;
  onScrub: (pos: number) => void;
  onSkip: () => void;
  onEdit: () => void;
}

const CHIP_GLYPH: Readonly<Record<string, GlyphKind>> = {
  supplied: "check",
  flooded: "wave",
  irrigated: "drop",
};

function Chip({ kind, text }: { kind: string; text: string }) {
  return (
    <li class={`fd-chip fd-chip--${kind}`} data-chip={kind}>
      <Glyph kind={CHIP_GLYPH[kind] ?? "dot"} size={16} />
      {text}
    </li>
  );
}

export function PlaybackBar(props: PlaybackBarProps) {
  const { state, total, weeks, counts, totals } = props;
  const week = Math.min(weekAt(state.pos) + (state.pos >= total ? 0 : 1), weeks);
  return (
    <div class="fd-playback" data-testid="playback">
      <p class="fd-playback__week" data-testid="week-counter">
        {t("weekCounter", { week: Math.max(1, week), weeks })}
      </p>
      <ul class="fd-chips" data-testid="live-badges">
        <Chip
          kind="supplied"
          text={`${counts.supplied}/${totals.houses} ${plural(totals.houses, "house", "houses")} ${t("badgeSupplied")}`}
        />
        <Chip kind="flooded" text={`${counts.flooded} ${t("badgeFlooded")}`} />
        <Chip
          kind="irrigated"
          text={`${counts.irrigated}/${totals.fields} ${plural(totals.fields, "field", "fields")} ${t("badgeIrrigated")}`}
        />
      </ul>
      <div class="fd-playback__row">
        <Button variant="secondary" onClick={props.onToggle}>
          {state.playing ? t("pausePlayback") : t("playPlayback")}
        </Button>
        <fieldset class="fd-speeds" aria-label={t("speedGroup")}>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              class="fd-speed fd-hit"
              aria-pressed={state.speed === speed}
              aria-label={t("speedLabel", { speed })}
              onClick={() => props.onSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </fieldset>
      </div>
      <input
        class="fd-scrub fd-hit"
        type="range"
        min={0}
        max={total}
        step={1}
        value={state.pos}
        aria-label={t("scrubLabel")}
        aria-valuetext={t("weekCounter", { week: Math.max(1, week), weeks })}
        onInput={(event) => props.onScrub(Number((event.currentTarget as HTMLInputElement).value))}
      />
      <div class="fd-playback__row">
        <Button variant="secondary" onClick={props.onEdit}>
          {t("edit")}
        </Button>
        <Button onClick={props.onSkip}>{t("skipToResult")}</Button>
      </div>
    </div>
  );
}
