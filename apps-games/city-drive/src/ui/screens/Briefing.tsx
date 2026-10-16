import type { MissionDef } from "@city-drive/core";
import { TypeIcon } from "../components/Icons";
import { Stars } from "../components/Stars";
import type { AppController } from "../controller";
import { starTargets, timeLimitText } from "../model/briefing";
import { TYPE_LABELS } from "../model/format";

export function Briefing({
  mission,
  controller,
}: {
  mission: MissionDef;
  controller: AppController;
}) {
  return (
    <section class="cd-screen cd-briefing" aria-label="Mission briefing" role="dialog">
      <div class="cd-panel cd-briefing-card">
        <p class="cd-kind">
          <TypeIcon type={mission.type} />
          <span>{TYPE_LABELS[mission.type]}</span>
          <span class="cd-dim">Time limit {timeLimitText(mission)}</span>
        </p>
        <h2 data-testid="briefing-title">{mission.title}</h2>
        <p class="cd-brief">{mission.brief}</p>
        <ul class="cd-targets" aria-label="Star targets">
          {starTargets(mission).map((target) => (
            <li key={target.stars}>
              <Stars earned={target.stars} />
              <span class="cd-target-text">{target.text}</span>
              <span class="cd-target-coins">{target.coins} coins</span>
            </li>
          ))}
        </ul>
        <div class="cd-row">
          <button
            type="button"
            class="cd-button cd-button-primary"
            onClick={() => controller.accept()}
          >
            Start
          </button>
          <button type="button" class="cd-button" onClick={() => controller.decline()}>
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
