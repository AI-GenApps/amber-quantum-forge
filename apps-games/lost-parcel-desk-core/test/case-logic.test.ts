import { describe, expect, it } from "vitest";
import type { CaseContent, Link } from "../src";
import {
  accuse,
  analyseCase,
  CASES,
  canonicalLink,
  consistentCandidates,
  createCaseState,
  leadClueIds,
  linkClue,
  MAX_STAMPS,
  nextUnresolvedDeduction,
  PEOPLE,
  pinClue,
  requestHint,
} from "../src";
import { at, must, revealAll } from "./fixtures/helpers";

function canonicalLinksOf(item: CaseContent, deductionId: string): Link[] {
  const found = item.deductions.find((entry) => entry.id === deductionId);
  if (found === undefined) throw new Error("no deduction");
  return found.clueIds.flatMap((clueId) =>
    item.candidateIds.flatMap((personId) => {
      const kind = canonicalLink(item, PEOPLE, clueId, personId);
      return kind === null ? [] : [{ clueId, personId, kind }];
    }),
  );
}

describe("every shipped case is logically sound", () => {
  for (const item of CASES) {
    describe(`case ${item.id} ${item.title}`, () => {
      it("passes analyseCase with no issues", () => {
        expect(analyseCase(item, PEOPLE)).toEqual([]);
      });

      it("has the owner as the only consistent candidate", () => {
        expect(consistentCandidates(item, PEOPLE)).toEqual([item.ownerId]);
      });

      it("needs every deduction: removing one leaves two candidates", () => {
        for (const entry of item.deductions) {
          const rest = item.deductions.filter((other) => other.id !== entry.id).map((o) => o.id);
          const left = consistentCandidates(item, PEOPLE, rest);
          expect(left).toHaveLength(2);
          expect(left).toContain(item.ownerId);
        }
      });

      it("uses exactly the lead clues of its deductions", () => {
        const leads = leadClueIds(item);
        const flagged = item.clues.filter((clue) => clue.flavour !== true).map((c) => c.id);
        expect([...leads].sort()).toEqual([...flagged].sort());
      });

      it("hints resolve D1 then D2 with the canonical links", () => {
        const first = requestHint(item, PEOPLE, createCaseState(item));
        if (!first.ok) throw new Error("first hint rejected");
        expect(first.deductionId).toBe(at(item.deductions, 0).id);
        expect(first.links).toEqual(canonicalLinksOf(item, at(item.deductions, 0).id));
        const second = requestHint(item, PEOPLE, first.state);
        if (!second.ok) throw new Error("second hint rejected");
        expect(second.deductionId).toBe(at(item.deductions, 1).id);
        expect(second.links).toEqual(canonicalLinksOf(item, at(item.deductions, 1).id));
        expect(nextUnresolvedDeduction(item, PEOPLE, second.state)).toBeNull();
        const third = requestHint(item, PEOPLE, second.state);
        expect(third.ok).toBe(false);
      });

      it("a scripted perfect solution earns 3 stamps and closes the case", () => {
        let state = revealAll(item, createCaseState(item));
        for (const clueId of leadClueIds(item)) {
          state = must(pinClue(state, clueId));
          for (const personId of item.candidateIds) {
            const kind = canonicalLink(item, PEOPLE, clueId, personId);
            if (kind === null) throw new Error("no canonical link");
            state = must(linkClue(state, clueId, personId, kind));
          }
        }
        const result = accuse(item, state, item.ownerId);
        if (!result.ok) throw new Error(`accusation rejected: ${result.reason}`);
        expect(result.correct).toBe(true);
        expect(result.stamps).toBe(MAX_STAMPS);
        expect(result.state.stamps).toBe(3);
        expect(result.state.closed).toBe(true);
        expect(result.state.deliveredId).toBe(item.ownerId);
        expect(result.state.hintsUsed).toBe(0);
      });
    });
  }
});
