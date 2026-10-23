import { almanacFor, CASES, deductionOfClue, leadClueIds } from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import { ALMANAC_OVERRIDES } from "../src/data/almanacOverrides";
import { almanacEntryFor, almanacEntryForTag, almanacKey } from "../src/lib/almanacLink";

describe("almanac links from clue tags", () => {
  it("links every lead clue of the campaign to the entry of its own deduction", () => {
    const misses: string[] = [];
    for (const item of CASES) {
      for (const clueId of leadClueIds(item)) {
        const clue = item.clues.find((candidate) => candidate.id === clueId);
        const deduction = deductionOfClue(item, clueId);
        if (!clue || !deduction) continue;
        const expected = almanacFor(deduction.facet, deduction.value);
        const found = almanacEntryFor(clue);
        if (!found || !expected || almanacKey(found) !== almanacKey(expected)) {
          misses.push(
            `${clueId} "${clue.tag}" -> ${found ? almanacKey(found) : "none"} (wanted ${deduction.facet}:${deduction.value})`,
          );
        }
      }
    }
    expect(misses).toEqual([]);
  });

  it("only overrides clues the word match gets wrong", () => {
    for (const [clueId, key] of Object.entries(ALMANAC_OVERRIDES)) {
      const clue = CASES.flatMap((item) => item.clues).find((candidate) => candidate.id === clueId);
      expect(clue, clueId).toBeDefined();
      const matched = clue ? almanacEntryForTag(clue.tag) : undefined;
      expect(matched ? almanacKey(matched) : null, clueId).not.toBe(key);
    }
  });

  it("matches whole vocabulary phrases before loose words", () => {
    expect(almanacEntryForTag("copper hair strand in the wool")?.value).toBe("red hair");
    expect(almanacEntryForTag("river-mud grit on the cuff")?.value).toBe("Quay Road");
    expect(almanacEntryForTag("a perfectly ordinary Tuesday")).toBeUndefined();
  });
});
