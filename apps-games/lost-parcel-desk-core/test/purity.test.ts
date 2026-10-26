import { describe, expect, it } from "vitest";
import { accuse } from "../src/accuse";
import { analyseCase } from "../src/analyse";
import { explainWrong, summarizeBoard } from "../src/feedback";
import { requestHint } from "../src/hints";
import { canonicalLink, consistentCandidates } from "../src/logic";
import {
  addElapsed,
  createCaseState,
  flipObject,
  inspectObject,
  linkClue,
  pinClue,
  tapHotspot,
  unlinkClue,
  unpinClue,
} from "../src/state";
import { clone, DIRECT_CASE, deepFreeze, PAIR_CASE } from "./fixtures/cases";
import { MINI_CAST } from "./fixtures/cast";
import { giveFits, must } from "./fixtures/helpers";

describe("purity: frozen inputs survive every reducer", () => {
  const people = deepFreeze(clone(MINI_CAST));

  it("keeps the definition, the cast and each state untouched", () => {
    for (const source of [DIRECT_CASE, PAIR_CASE]) {
      const def = deepFreeze(clone(source));
      const snapshot = JSON.stringify(def);
      let state = deepFreeze(createCaseState(def));
      const step = (next: ReturnType<typeof must>) => {
        state = deepFreeze(next);
      };
      for (const object of def.objects) {
        step(must(inspectObject(def, state, object.id)));
        step(must(flipObject(def, state, object.id)));
      }
      for (const clue of def.clues) {
        if (clue.face === "zoom") step(must(tapHotspot(def, state, clue.id)));
        step(must(pinClue(state, clue.id)));
      }
      step(must(linkClue(state, def.clues[0]?.id ?? "", "p1", "fits")));
      step(must(unlinkClue(state, def.clues[0]?.id ?? "", "p1")));
      step(must(unpinClue(state, def.clues[0]?.id ?? "")));
      step(must(addElapsed(state, 250)));
      const hint = requestHint(def, people, state);
      expect(hint.ok).toBe(true);
      step(hint.state);
      step(
        giveFits(
          state,
          def.candidateIds[1] ?? "",
          def.clues.slice(0, 2).map((clue) => clue.id),
        ),
      );
      explainWrong(def, people, state, def.candidateIds[1] ?? "");
      summarizeBoard(def, state);
      const wrong = accuse(def, state, def.candidateIds[1] ?? "");
      expect(wrong.ok).toBe(true);
      analyseCase(def, people);
      consistentCandidates(def, people);
      canonicalLink(def, people, def.clues[0]?.id ?? "", "p1");
      expect(JSON.stringify(def)).toBe(snapshot);
      expect(JSON.stringify(people)).toBe(JSON.stringify(MINI_CAST));
    }
  });
});
