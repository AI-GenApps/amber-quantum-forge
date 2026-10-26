import { describe, expect, it } from "vitest";
import { countSyllables, fleschKincaidGrade, SCENES, sentences, words } from "../src";
import { beatsOf, sceneText } from "../src/content/validateScenes";

describe("countSyllables", () => {
  const known: [string, number][] = [
    ["a", 1],
    ["the", 1],
    ["tide", 1],
    ["cake", 1],
    ["watched", 1],
    ["harbour", 2],
    ["lantern", 2],
    ["window", 2],
    ["little", 2],
    ["wanted", 2],
    ["being", 2],
    ["sparrows", 2],
    ["lighthouse", 2],
    ["comforting", 3],
    ["umbrella", 3],
    ["beautiful", 3],
    ["Marigold", 3],
    ["fisherman", 3],
    ["library", 3],
  ];

  for (const [word, count] of known) {
    it(`${word} has ${count}`, () => {
      expect(countSyllables(word)).toBe(count);
    });
  }

  it("ignores punctuation and counts an empty word as zero", () => {
    expect(countSyllables("harbour,")).toBe(2);
    expect(countSyllables("")).toBe(0);
    expect(countSyllables("...")).toBe(0);
  });

  it("never returns less than one for a real word", () => {
    for (const word of ["rhythm", "by", "hmm", "shh", "psst"]) {
      expect(countSyllables(word)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("words and sentences", () => {
  it("keeps apostrophes inside words", () => {
    expect(words("Marit's lamp isn't out.")).toEqual(["Marit's", "lamp", "isn't", "out"]);
  });

  it("splits on full stops, question marks, exclamations and ellipses", () => {
    expect(sentences("Hello there. How are you? Fine!")).toHaveLength(3);
    expect(sentences("Wait... what?")).toHaveLength(2);
    expect(sentences("Wait… what?")).toHaveLength(2);
  });

  it("does not split after Dr. or Mr.", () => {
    expect(sentences("Dr. Reyes came. He left.")).toHaveLength(2);
    expect(sentences("Mr. Pell waved.")).toHaveLength(1);
  });

  it("splits after a closing quote", () => {
    expect(sentences('She said "Go." He went.')).toHaveLength(2);
  });

  it("drops empty fragments", () => {
    expect(sentences("   ")).toEqual([]);
    expect(sentences("Hi.  ")).toEqual(["Hi."]);
  });
});

describe("fleschKincaidGrade", () => {
  it("matches the formula for a known sentence", () => {
    const expected = 0.39 * 6 + 11.8 * 1 - 15.59;
    expect(fleschKincaidGrade("The cat sat on the mat.")).toBeCloseTo(expected, 5);
    expect(fleschKincaidGrade("The cat sat on the mat.")).toBeCloseTo(-1.45, 2);
  });

  it("rates a long, polysyllabic sentence far higher than a plain one", () => {
    const hard = "Cartographers navigate unfamiliar territories using sophisticated instruments.";
    const plain = "The boat came home. We had tea.";
    expect(fleschKincaidGrade(hard)).toBeGreaterThan(14);
    expect(fleschKincaidGrade(plain)).toBeLessThan(2);
  });

  it("is zero for empty text", () => {
    expect(fleschKincaidGrade("")).toBe(0);
    expect(fleschKincaidGrade("...")).toBe(0);
  });

  it("grows with sentence length", () => {
    const short = "We sat. We drank. We left.";
    const long = "We sat and drank and left and sat and drank and left again.";
    expect(fleschKincaidGrade(long)).toBeGreaterThan(fleschKincaidGrade(short));
  });
});

describe("per-scene reading grade table", () => {
  const table = SCENES.map((scene) => {
    const beats = beatsOf(scene).map((ref) => fleschKincaidGrade(ref.beat.text));
    return {
      id: scene.id,
      grade: fleschKincaidGrade(sceneText(scene)),
      worstBeat: Math.max(...beats),
    };
  });

  it("has a row for each of the 40 scenes", () => {
    expect(table).toHaveLength(40);
  });

  it("every scene averages at most grade 7.0", () => {
    for (const row of table) expect(row.grade, row.id).toBeLessThanOrEqual(7);
  });

  it("no single beat is above grade 10", () => {
    for (const row of table) expect(row.worstBeat, row.id).toBeLessThanOrEqual(10);
  });

  it("the mean over all scenes is at most 7.0", () => {
    const mean = table.reduce((sum, row) => sum + row.grade, 0) / table.length;
    expect(mean).toBeLessThanOrEqual(7);
  });
});
