import { ArrowIcon, HornIcon, PauseIcon } from "../components/Icons";
import { Meter } from "../components/Meter";
import type { AppController } from "../controller";
import { arrowAnchor, objectiveArrow } from "../model/arrow";
import { formatClock, objectiveLine } from "../model/format";
import { missionMeter, URGENT_SECONDS } from "../model/meters";
import type { MinimapModel } from "../model/minimap";
import type { PlayState } from "../types";
import { Minimap } from "./Minimap";

function ObjectiveArrow({ play }: { play: PlayState }) {
  const objective = play.hud.objective;
  if (!objective) return null;
  const arrow = objectiveArrow(play.player.position, play.player.forward, objective);
  if (!arrow.offscreen) return null;
  const at = arrowAnchor(arrow.angle);
  return (
    <div
      class="cd-arrow"
      data-testid="objective-arrow"
      style={{ left: `${at.left * 100}%`, top: `${at.top * 100}%` }}
      role="img"
      aria-label={`${objective.label}, ${Math.round(arrow.distanceM)} metres`}
    >
      <span class="cd-arrow-pointer" style={{ transform: `rotate(${arrow.angle}rad)` }}>
        <ArrowIcon class="cd-arrow-icon" />
      </span>
      <span class="cd-arrow-distance">{Math.round(arrow.distanceM)} m</span>
    </div>
  );
}

function MissionBar({ play }: { play: PlayState }) {
  const { hud } = play;
  const meter = missionMeter(play.mission, hud);
  return (
    <div class="cd-mission-bar">
      <p class="cd-timer" data-urgent={hud.timeLeftS <= URGENT_SECONDS} data-testid="timer">
        {formatClock(hud.timeLeftS)}
      </p>
      <p class="cd-objective" data-testid="objective">
        {objectiveLine(hud)}
      </p>
      {meter ? <Meter {...meter} /> : null}
      {play.parkHold !== undefined && play.parkHold > 0 ? (
        <Meter
          label="Hold still"
          text={`${Math.round(play.parkHold * 100)}%`}
          fraction={play.parkHold}
        />
      ) : null}
    </div>
  );
}

/** The in-drive overlay: minimap, speed, pause button and, during a mission, timer and meters. */
export function Hud({
  play,
  controller,
  minimap,
}: {
  play: PlayState;
  controller: AppController;
  minimap: MinimapModel | undefined;
}) {
  const active = play.hud.phase === "active";
  return (
    <section class="cd-hud" aria-label="Heads-up display" data-active={active}>
      {minimap ? <Minimap controller={controller} model={minimap} /> : null}
      {active ? (
        <MissionBar play={play} />
      ) : (
        <p class="cd-hint">Drive to a marker to start a mission</p>
      )}
      <button
        type="button"
        class="cd-button cd-icon-button cd-pause-button"
        aria-label="Pause"
        onClick={() => controller.pause()}
      >
        <PauseIcon />
      </button>
      <button
        type="button"
        class="cd-button cd-icon-button cd-horn-button"
        aria-label="Horn"
        data-no-tap="true"
        onClick={() => controller.horn()}
      >
        <HornIcon />
      </button>
      <p class="cd-speed">
        <span class="cd-sr">Speed</span>
        <span class="cd-speed-value" data-testid="speed">
          {Math.round(Math.abs(play.speedKmh))}
        </span>
        <small>km/h</small>
      </p>
      {active ? <ObjectiveArrow play={play} /> : null}
    </section>
  );
}
