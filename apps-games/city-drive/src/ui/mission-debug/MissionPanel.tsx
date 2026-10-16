import type { MissionDef, MissionHud, MissionResult } from "@city-drive/core";
import { formatClock, objectiveLine, outcomeTitle, starText, TYPE_LABELS } from "./format";

/** What the panel needs from the game. A plain snapshot plus the four things a player can do. */
export interface MissionPanelState {
  hud: MissionHud;
  mission: MissionDef | undefined;
  result: MissionResult | undefined;
  /** 0..1 while parking, otherwise undefined. */
  parkHold: number | undefined;
}

export interface MissionPanelActions {
  accept(): void;
  decline(): void;
  quit(): void;
  next(): void;
}

function Briefing({ state, actions }: { state: MissionPanelState; actions: MissionPanelActions }) {
  const { mission } = state;
  if (!mission) return null;
  return (
    <section class="cd-mission-card" aria-label="Mission briefing">
      <p class="cd-mission-kind">{TYPE_LABELS[mission.type]}</p>
      <h2>{mission.title}</h2>
      <p>{mission.brief}</p>
      <p class="cd-mission-rewards">
        Rewards: {mission.reward_coins["1"]} / {mission.reward_coins["2"]} /{" "}
        {mission.reward_coins["3"]} coins for 1 / 2 / 3 stars
      </p>
      <div class="cd-mission-buttons">
        <button type="button" class="cd-mission-primary" onClick={actions.accept}>
          Start (Enter)
        </button>
        <button type="button" onClick={actions.decline}>
          Not now (Esc)
        </button>
      </div>
    </section>
  );
}

function Hud({ state, actions }: { state: MissionPanelState; actions: MissionPanelActions }) {
  const { hud } = state;
  return (
    <section class="cd-mission-hud" aria-label="Mission">
      <p class="cd-mission-objective">{objectiveLine(hud)}</p>
      <p class="cd-mission-stats">
        <span>Time {formatClock(hud.timeLeftS)}</span>
        <span>Damage {hud.damage}</span>
        {hud.comfort === null ? null : <span>Comfort {Math.round(hud.comfort)}</span>}
        {state.parkHold === undefined || state.parkHold === 0 ? null : (
          <span>Hold {Math.round(state.parkHold * 100)}%</span>
        )}
      </p>
      <button type="button" class="cd-mission-quit" onClick={actions.quit}>
        Quit (Esc)
      </button>
    </section>
  );
}

function Outcome({ state, actions }: { state: MissionPanelState; actions: MissionPanelActions }) {
  const { result } = state;
  if (!result) return null;
  return (
    <section class="cd-mission-card" aria-label="Mission result">
      <h2>{outcomeTitle(result)}</h2>
      {result.success ? <p class="cd-mission-stars">{starText(result.stars)}</p> : null}
      <p>
        Time {formatClock(result.time)} - Damage {result.damage}
        {result.comfort === null ? "" : ` - Comfort ${Math.round(result.comfort)}`}
      </p>
      <p class="cd-mission-rewards">+{result.coins} coins</p>
      <div class="cd-mission-buttons">
        <button type="button" class="cd-mission-primary" onClick={actions.next}>
          Continue (Enter)
        </button>
      </div>
    </section>
  );
}

/** Minimal mission UI for this task: briefing card, in-drive readout, result card. Task 13 restyles. */
export function MissionPanel({
  state,
  actions,
}: {
  state: MissionPanelState;
  actions: MissionPanelActions;
}) {
  switch (state.hud.phase) {
    case "briefing":
      return <Briefing state={state} actions={actions} />;
    case "active":
      return <Hud state={state} actions={actions} />;
    case "success":
    case "fail":
    case "results":
      return <Outcome state={state} actions={actions} />;
    default:
      return null;
  }
}
