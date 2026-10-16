import {
  CONTROL_LAYOUTS,
  type ControlLayout,
  GRAPHICS_QUALITIES,
  type GraphicsQuality,
} from "@city-drive/core";
import { ScreenFrame } from "../components/ScreenFrame";
import type { AppController, AppView } from "../controller";

const LAYOUT_LABELS: Readonly<Record<ControlLayout, string>> = {
  standard: "Standard",
  mirrored: "Mirrored",
};

const QUALITY_LABELS: Readonly<Record<GraphicsQuality, string>> = {
  auto: "Auto",
  low: "Low",
  medium: "Medium",
  high: "High",
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div class="cd-setting">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        class="cd-switch"
        onClick={() => onChange(!checked)}
      >
        <span class="cd-switch-knob" />
        <span class="cd-switch-text">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labels: Readonly<Record<T, string>>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset class="cd-setting cd-fieldset">
      <legend class="cd-sr">{label}</legend>
      <span aria-hidden="true">{label}</span>
      <div class="cd-choices">
        {options.map((option) => (
          <label key={option} class="cd-choice" data-checked={option === value}>
            <input
              type="radio"
              class="cd-choice-input"
              name={label}
              value={option}
              checked={option === value}
              onChange={() => onChange(option)}
            />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Settings({ view, controller }: { view: AppView; controller: AppController }) {
  const { settings } = view.save;
  return (
    <ScreenFrame title="Settings" onBack={() => controller.back()} class="cd-settings">
      <div class="cd-settings-list">
        <Toggle
          label="Sound"
          checked={settings.audio}
          onChange={(v) => controller.setSetting("audio", v)}
        />
        <Toggle
          label="Vibration"
          checked={settings.haptics}
          onChange={(v) => controller.setSetting("haptics", v)}
        />
        <Choice
          label="Controls"
          options={CONTROL_LAYOUTS}
          labels={LAYOUT_LABELS}
          value={settings.control_layout}
          onChange={(v) => controller.setSetting("control_layout", v)}
        />
        <Choice
          label="Graphics"
          options={GRAPHICS_QUALITIES}
          labels={QUALITY_LABELS}
          value={settings.graphics_quality}
          onChange={(v) => controller.setSetting("graphics_quality", v)}
        />
        <div class="cd-setting">
          <span>How to play</span>
          <button
            type="button"
            class="cd-button"
            onClick={() => void controller.replayOnboarding()}
          >
            Replay tutorial
          </button>
        </div>
        {view.confirmingReset ? (
          <div class="cd-panel cd-confirm" role="alertdialog" aria-label="Erase progress">
            <p>Erase all coins, cars and stars? This cannot be undone.</p>
            <div class="cd-row">
              <button
                type="button"
                class="cd-button cd-button-danger"
                onClick={() => void controller.confirmReset()}
              >
                Erase everything
              </button>
              <button type="button" class="cd-button" onClick={() => controller.cancelReset()}>
                Keep my progress
              </button>
            </div>
          </div>
        ) : (
          <div class="cd-setting">
            <span>Progress</span>
            <button
              type="button"
              class="cd-button cd-button-danger"
              onClick={() => controller.requestReset()}
            >
              Reset progress
            </button>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
