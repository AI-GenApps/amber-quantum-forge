import { describe, expect, it } from "vitest";
import {
  advanceBeat,
  type ChoiceMade,
  chooseOption,
  currentView,
  endingLean,
  finishScene,
  resolveEnding,
  type SceneState,
  startScene,
  visibleBeats,
} from "../src";
import { deepFreeze } from "./helpers/fixtures";
import { CHOICE_SCENE, FINAL_SCENE, FINAL_WITH_CHOICE, PLAIN_SCENE } from "./helpers/scripts";

function texts(state: SceneState, choose?: "a" | "b"): string[] {
  const out: string[] = [];
  let current = state;
  for (let guard = 0; guard < 50 && !current.done; guard++) {
    const view = currentView(current);
    if (view.kind === "beat") {
      out.push(view.beat.text);
      current = advanceBeat(current);
    } else if (view.kind === "choice") {
      out.push("[choice]");
      if (choose === undefined) return out;
      current = chooseOption(current, choose);
    } else break;
  }
  return out;
}

const made = (choice: string, option: "a" | "b"): ChoiceMade => ({ choice, option, lean: option });

describe("visibleBeats", () => {
  it("hides beats whose guard does not match and keeps unguarded ones", () => {
    expect(visibleBeats(PLAIN_SCENE, []).map((b) => b.text)).toEqual(["p1", "p3"]);
    expect(visibleBeats(PLAIN_SCENE, [made("c0", "a")]).map((b) => b.text)).toEqual([
      "p1",
      "p2",
      "p3",
    ]);
    expect(visibleBeats(PLAIN_SCENE, [made("c0", "b")]).map((b) => b.text)).toEqual(["p1", "p3"]);
    expect(visibleBeats(PLAIN_SCENE, [made("other", "a")]).map((b) => b.text)).toEqual([
      "p1",
      "p3",
    ]);
  });
});

describe("resolveEnding", () => {
  it("follows the majority", () => {
    expect(resolveEnding(["a"])).toBe("a");
    expect(resolveEnding(["b"])).toBe("b");
    expect(resolveEnding(["a", "a", "b"])).toBe("a");
    expect(resolveEnding(["b", "a", "b"])).toBe("b");
  });

  it("lets the last choice decide a two-choice disagreement", () => {
    expect(resolveEnding(["a", "b"])).toBe("b");
    expect(resolveEnding(["b", "a"])).toBe("a");
  });

  it("defaults to a with no choices", () => {
    expect(resolveEnding([])).toBe("a");
  });
});

describe("scene without a choice", () => {
  it("plays visible beats in order and finishes with the gift", () => {
    const state = startScene(PLAIN_SCENE, []);
    expect(texts(state)).toEqual(["p1", "p3"]);
    let current = state;
    while (!current.done) current = advanceBeat(current);
    expect(finishScene(current)).toEqual({
      gift: 5,
      choices: [],
      ending: null,
      endingTitle: null,
    });
  });

  it("honours guards from earlier scenes", () => {
    expect(texts(startScene(PLAIN_SCENE, [made("c0", "a")]))).toEqual(["p1", "p2", "p3"]);
  });

  it("reports position and total for a beat", () => {
    const view = currentView(startScene(PLAIN_SCENE, []));
    expect(view).toMatchObject({ kind: "beat", section: "main", position: 1, total: 2 });
  });
});

describe("scene with a choice", () => {
  it("stops at the choice until an option is picked", () => {
    const state = startScene(CHOICE_SCENE, []);
    expect(texts(state)).toEqual(["one", "two", "three", "[choice]"]);
    let at = state;
    for (let i = 0; i < 3; i++) at = advanceBeat(at);
    expect(currentView(at).kind).toBe("choice");
    expect(advanceBeat(at)).toBe(at);
  });

  it("plays option a: reaction, guarded beat a, closing", () => {
    expect(texts(startScene(CHOICE_SCENE, []), "a")).toEqual([
      "one",
      "two",
      "three",
      "[choice]",
      "react-a1",
      "react-a2",
      "after-a",
      "closing",
    ]);
  });

  it("plays option b: reaction, guarded beat b, closing", () => {
    expect(texts(startScene(CHOICE_SCENE, []), "b")).toEqual([
      "one",
      "two",
      "three",
      "[choice]",
      "react-b1",
      "react-b2",
      "after-b",
      "closing",
    ]);
  });

  it("labels reaction beats with their section", () => {
    let state = startScene(CHOICE_SCENE, []);
    for (let i = 0; i < 3; i++) state = advanceBeat(state);
    state = chooseOption(state, "b");
    expect(currentView(state)).toMatchObject({
      kind: "beat",
      section: "reaction",
      position: 1,
      total: 2,
    });
  });

  it("records the choice and its lean when finishing, and pays 5 coins", () => {
    let state = startScene(CHOICE_SCENE, []);
    while (currentView(state).kind !== "choice") state = advanceBeat(state);
    state = chooseOption(state, "b");
    while (!state.done) state = advanceBeat(state);
    expect(finishScene(state)).toEqual({
      gift: 5,
      choices: [{ choice: "c1", option: "b", lean: "b" }],
      ending: null,
      endingTitle: null,
    });
  });

  it("ignores chooseOption when there is no choice on screen or it was already made", () => {
    const state = startScene(CHOICE_SCENE, []);
    expect(chooseOption(state, "a")).toBe(state);
    let at = state;
    while (currentView(at).kind !== "choice") at = advanceBeat(at);
    const chosen = chooseOption(at, "a");
    expect(chooseOption(chosen, "b")).toBe(chosen);
  });

  it("a replay does not duplicate its own recorded choice", () => {
    const state = startScene(CHOICE_SCENE, [made("c1", "a")]);
    expect(texts(state)).toEqual(["one", "two", "three", "[choice]"]);
  });

  it("pays nothing on a replay", () => {
    let state = startScene(PLAIN_SCENE, []);
    while (!state.done) state = advanceBeat(state);
    expect(finishScene(state, false).gift).toBe(0);
  });

  it("refuses to finish an unfinished scene", () => {
    expect(() => finishScene(startScene(PLAIN_SCENE, []))).toThrow();
  });
});

describe("final scene and endings", () => {
  const play = (script: typeof FINAL_SCENE, leans: ChoiceMade[], pick?: "a" | "b") => {
    let state = startScene(script, leans);
    const out: string[] = [];
    for (let guard = 0; guard < 60 && !state.done; guard++) {
      const view = currentView(state);
      if (view.kind === "choice") state = chooseOption(state, pick ?? "a");
      else {
        if (view.kind === "beat") out.push(view.beat.text);
        state = advanceBeat(state);
      }
    }
    return { out, state };
  };

  it("plays ending A after a single a choice and pays 15 coins", () => {
    const { out, state } = play(FINAL_SCENE, [made("c1", "a")]);
    expect(out).toEqual(["f1", "f3", "end-a1", "end-a2"]);
    expect(endingLean(state)).toBe("a");
    expect(finishScene(state)).toEqual({
      gift: 15,
      choices: [],
      ending: "a",
      endingTitle: "Ending A",
    });
  });

  it("plays ending B after a single b choice, with the guarded line", () => {
    const { out, state } = play(FINAL_SCENE, [made("c1", "b")]);
    expect(out).toEqual(["f1", "f2", "f3", "end-b1", "end-b2", "end-b3"]);
    expect(finishScene(state).endingTitle).toBe("Ending B");
  });

  it("uses the last choice to break a two-choice tie", () => {
    const ab = play(FINAL_SCENE, [made("c1", "a"), made("c2", "b")]);
    expect(finishScene(ab.state).ending).toBe("b");
    const ba = play(FINAL_SCENE, [made("c2", "b"), made("c1", "a")]);
    expect(finishScene(ba.state).ending).toBe("a");
  });

  it("counts the choice made inside the final scene as the last choice", () => {
    const tie = play(FINAL_WITH_CHOICE, [made("c1", "a")], "b");
    expect(finishScene(tie.state)).toMatchObject({
      ending: "b",
      choices: [{ choice: "c9", option: "b", lean: "b" }],
    });
    const agree = play(FINAL_WITH_CHOICE, [made("c1", "a")], "a");
    expect(finishScene(agree.state).ending).toBe("a");
  });

  it("plays no ending block for a scene without endings", () => {
    expect(endingLean(startScene(PLAIN_SCENE, []))).toBeNull();
  });

  it("is a pure state machine: frozen inputs are never mutated", () => {
    const frozen = deepFreeze(startScene(CHOICE_SCENE, []));
    let state: SceneState = frozen;
    for (let i = 0; i < 3; i++) state = advanceBeat(state);
    state = chooseOption(state, "a");
    expect(frozen.step).toBe(0);
    expect(state.step).toBe(4);
  });
});
