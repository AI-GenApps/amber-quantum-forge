import type { MeterTone } from "../model/meters";

/** A labelled horizontal bar. `fraction` is how full it is drawn, 0 to 1. */
export function Meter({
  label,
  text,
  fraction,
  tone = "ok",
}: {
  label: string;
  text: string;
  fraction: number;
  tone?: MeterTone;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div class="cd-meter" data-tone={tone}>
      <div class="cd-meter-head">
        <span>{label}</span>
        <span>{text}</span>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: a themed bar; a native <meter> cannot be styled the same in every WebView */}
      <div
        class="cd-bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={text}
      >
        <div class="cd-bar-fill" data-tone={tone} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
