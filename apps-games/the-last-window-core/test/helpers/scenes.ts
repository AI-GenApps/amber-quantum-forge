import {
  advanceBeat,
  type ChoiceMade,
  chooseOption,
  currentView,
  finishScene,
  type OptionKey,
  type SceneDef,
  type SceneOutcome,
  scenesOf,
  startScene,
} from "../../src";

export interface Played {
  lines: string[];
  outcome: SceneOutcome;
}

export function playScene(
  scene: SceneDef,
  made: readonly ChoiceMade[],
  pick: OptionKey = "a",
): Played {
  let state = startScene(scene, made);
  const lines: string[] = [];
  for (let guard = 0; guard < 100 && !state.done; guard++) {
    const view = currentView(state);
    if (view.kind === "done") break;
    if (view.kind === "choice") {
      state = chooseOption(state, pick);
      continue;
    }
    lines.push(view.beat.text);
    state = advanceBeat(state);
  }
  if (!state.done) throw new Error(`scene ${scene.id} did not finish`);
  return { lines, outcome: finishScene(state) };
}

export function choiceScenes(regularId: number): SceneDef[] {
  return scenesOf(regularId).filter((scene) => scene.choice !== undefined);
}

export function allPicks(regularId: number): OptionKey[][] {
  const count = choiceScenes(regularId).length;
  const out: OptionKey[][] = [];
  for (let mask = 0; mask < 2 ** count; mask++) {
    out.push(Array.from({ length: count }, (_, i): OptionKey => ((mask >> i) & 1 ? "b" : "a")));
  }
  return out;
}

export function madeFor(regularId: number, picks: readonly OptionKey[]): ChoiceMade[] {
  return choiceScenes(regularId).map((scene, i) => {
    const key = picks[i] as OptionKey;
    const choice = scene.choice;
    if (choice === undefined) throw new Error("no choice");
    return { choice: choice.id, option: key, lean: choice.options[key].lean };
  });
}
