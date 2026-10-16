import { BRIEFING_TIPS, RESULTS_TIPS, STEP_COPY } from "./copy";
import type { OnboardingView } from "./flow";

interface Props {
  view: OnboardingView;
  onSkip(): void;
  onDismiss(): void;
}

function Tips({
  title,
  tips,
  onDismiss,
}: {
  title: string;
  tips: readonly string[];
  onDismiss(): void;
}) {
  return (
    <div class="cd-tip-body">
      <p class="cd-tip-title">{title}</p>
      <ul class="cd-tip-list">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <button type="button" class="cd-button cd-button-primary" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}

/** The first-drive tutorial: control steps over free roam, then tips beside the briefing and results. */
export function OnboardingOverlay({ view, onSkip, onDismiss }: Props) {
  return (
    <aside
      class="cd-onboarding"
      data-stage={view.stage}
      data-no-tap="true"
      aria-label="How to play"
    >
      {view.stage === "controls" ? (
        <div class="cd-tip-body" role="status">
          <p class="cd-tip-step">
            Step {view.step + 1} of {view.steps}
          </p>
          <p class="cd-tip-title">{STEP_COPY[view.stepId].title}</p>
          <p class="cd-tip-hint">{STEP_COPY[view.stepId].hint}</p>
          <div
            class="cd-tip-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(view.progress * 100)}
          >
            <span style={{ width: `${Math.round(view.progress * 100)}%` }} />
          </div>
        </div>
      ) : view.stage === "briefing" ? (
        <Tips title="Your first mission" tips={BRIEFING_TIPS} onDismiss={onDismiss} />
      ) : (
        <Tips title="Coins and the garage" tips={RESULTS_TIPS} onDismiss={onDismiss} />
      )}
      <button type="button" class="cd-button cd-tip-skip" onClick={onSkip}>
        Skip tutorial
      </button>
    </aside>
  );
}
