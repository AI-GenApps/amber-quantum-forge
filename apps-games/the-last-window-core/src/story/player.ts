import { FINAL_SCENE_GIFT, SCENE_GIFT, SCENES_PER_REGULAR } from "../constants";
import type { Beat, Choice, ChoiceMade, Lean, OptionKey, SceneScript } from "./types";

export interface SceneState {
  script: SceneScript;
  made: readonly ChoiceMade[];
  own: ChoiceMade | null;
  step: number;
  done: boolean;
}

export type SceneSection = "main" | "reaction" | "ending";

export type SceneView =
  | { kind: "beat"; beat: Beat; section: SceneSection; position: number; total: number }
  | { kind: "choice"; choice: Choice }
  | { kind: "done" };

export interface SceneOutcome {
  gift: number;
  choices: ChoiceMade[];
  ending: Lean | null;
  endingTitle: string | null;
}

type Item =
  | { kind: "beat"; beat: Beat; section: SceneSection }
  | { kind: "choice"; choice: Choice };

function guardPasses(beat: Beat, made: readonly ChoiceMade[]): boolean {
  if (beat.guard === undefined) return true;
  const guard = beat.guard;
  return made.some((entry) => entry.choice === guard.choice && entry.option === guard.option);
}

export function visibleBeats(script: SceneScript, choicesMade: readonly ChoiceMade[]): Beat[] {
  return script.beats.filter((beat) => guardPasses(beat, choicesMade));
}

export function resolveEnding(leans: readonly Lean[]): Lean {
  const a = leans.filter((lean) => lean === "a").length;
  const b = leans.length - a;
  if (a > b) return "a";
  if (b > a) return "b";
  return leans[leans.length - 1] ?? "a";
}

function beatItems(beats: readonly Beat[], made: readonly ChoiceMade[], section: SceneSection) {
  return beats
    .filter((beat) => guardPasses(beat, made))
    .map((beat): Item => ({ kind: "beat", beat, section }));
}

function timeline(state: SceneState): Item[] {
  const { script, made, own } = state;
  const choice = script.choice;
  const split = choice === undefined ? script.beats.length : choice.afterBeat;
  const items = beatItems(script.beats.slice(0, split), made, "main");
  if (choice !== undefined) {
    items.push({ kind: "choice", choice });
    if (own === null) return items;
    items.push(...beatItems(choice.options[own.option].reaction, made, "reaction"));
    items.push(...beatItems(script.beats.slice(split), made, "main"));
  }
  if (script.endings !== undefined) {
    const lean = resolveEnding(made.map((entry) => entry.lean));
    items.push(...beatItems(script.endings[lean].beats, made, "ending"));
  }
  return items;
}

export function startScene(script: SceneScript, choicesMade: readonly ChoiceMade[]): SceneState {
  const ownId = script.choice?.id;
  const made = choicesMade.filter((entry) => entry.choice !== ownId);
  const state: SceneState = { script, made, own: null, step: 0, done: false };
  return timeline(state).length === 0 ? { ...state, done: true } : state;
}

export function currentView(state: SceneState): SceneView {
  if (state.done) return { kind: "done" };
  const items = timeline(state);
  const item = items[state.step];
  if (item === undefined) return { kind: "done" };
  if (item.kind === "choice") return { kind: "choice", choice: item.choice };
  const sameSection = items.filter(
    (entry) => entry.kind === "beat" && entry.section === item.section,
  );
  const position = sameSection.indexOf(item);
  return {
    kind: "beat",
    beat: item.beat,
    section: item.section,
    position: position + 1,
    total: sameSection.length,
  };
}

export function advanceBeat(state: SceneState): SceneState {
  if (state.done) return state;
  const items = timeline(state);
  const item = items[state.step];
  if (item === undefined) return { ...state, done: true };
  if (item.kind === "choice") return state;
  if (state.step + 1 < items.length) return { ...state, step: state.step + 1 };
  return { ...state, done: true };
}

export function chooseOption(state: SceneState, option: OptionKey): SceneState {
  if (state.done || state.own !== null) return state;
  const item = timeline(state)[state.step];
  if (item === undefined || item.kind !== "choice") return state;
  const picked = item.choice.options[option];
  const own: ChoiceMade = { choice: item.choice.id, option, lean: picked.lean };
  const next: SceneState = {
    ...state,
    made: [...state.made, own],
    own,
    step: state.step + 1,
  };
  return timeline(next).length <= next.step ? { ...next, done: true } : next;
}

export function endingLean(state: SceneState): Lean | null {
  if (state.script.endings === undefined) return null;
  return resolveEnding(state.made.map((entry) => entry.lean));
}

export function finishScene(state: SceneState, firstTime = true): SceneOutcome {
  if (!state.done) throw new Error("finishScene needs a finished scene");
  const lean = endingLean(state);
  const endings = state.script.endings;
  const gift = state.script.index === SCENES_PER_REGULAR ? FINAL_SCENE_GIFT : SCENE_GIFT;
  return {
    gift: firstTime ? gift : 0,
    choices: state.own === null ? [] : [state.own],
    ending: lean,
    endingTitle: lean === null || endings === undefined ? null : endings[lean].title,
  };
}
