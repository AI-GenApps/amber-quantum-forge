import { render } from "preact";
import { MissionPanel, type MissionPanelActions, type MissionPanelState } from "./MissionPanel";
import "./mission.css";

/** What the mount needs from the game: a snapshot to draw and the player's four actions. */
export interface MissionSource extends MissionPanelActions {
  snapshot(): MissionPanelState;
}

export interface MountedMissionPanel {
  /** Call once per frame; the panel only redraws when something visible changed. */
  update(): void;
  dispose(): void;
}

function signature(state: MissionPanelState): string {
  const { hud, result } = state;
  const objective = hud.objective ? `${hud.objective.label}` : "";
  const hold = state.parkHold === undefined ? "" : Math.round(state.parkHold * 100);
  const comfort = hud.comfort === null ? "" : Math.round(hud.comfort);
  return [
    hud.phase,
    hud.missionId,
    objective,
    hud.progress.done,
    Math.ceil(hud.timeLeftS),
    hud.damage,
    comfort,
    hold,
    result?.stars,
    result?.coins,
  ].join("|");
}

/**
 * Mounts the minimal mission panel into `host` and wires Enter and Escape: Enter starts a briefed
 * mission or continues past an end screen, Escape declines a briefing or quits a running mission.
 */
export function mountMissionPanel(
  host: HTMLElement,
  source: MissionSource,
  keys: Pick<Window, "addEventListener" | "removeEventListener">,
): MountedMissionPanel {
  const panelHost = document.createElement("div");
  panelHost.className = "cd-mission-host";
  host.appendChild(panelHost);
  let last = "";
  const draw = (): void => {
    const state = source.snapshot();
    const sig = signature(state);
    if (sig === last) return;
    last = sig;
    render(<MissionPanel state={state} actions={source} />, panelHost);
  };
  const onKey = (event: Event): void => {
    const key = (event as KeyboardEvent).key;
    const phase = source.snapshot().hud.phase;
    if (key === "Enter") {
      if (phase === "briefing") source.accept();
      else if (phase === "success" || phase === "fail" || phase === "results") source.next();
      else return;
    } else if (key === "Escape") {
      if (phase === "briefing") source.decline();
      else if (phase === "active") source.quit();
      else return;
    } else {
      return;
    }
    event.preventDefault();
    draw();
  };
  keys.addEventListener("keydown", onKey);
  draw();
  return {
    update: draw,
    dispose() {
      keys.removeEventListener("keydown", onKey);
      render(null, panelHost);
      panelHost.remove();
    },
  };
}
