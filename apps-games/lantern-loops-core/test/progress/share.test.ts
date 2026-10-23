import { describe, expect, it } from "vitest";
import { decodePuzzle, decodeTiles } from "../../src/code";
import { CAMPAIGN } from "../../src/content/chapters";
import { buildShareText, COLOUR_SQUARES, formatDuration } from "../../src/progress/share";

function load(id: string) {
  const record = CAMPAIGN.find((r) => r.id === id);
  if (!record) throw new Error(id);
  const puzzle = decodePuzzle(record.code, id);
  const tiles = decodeTiles(record.solution, record.size);
  if (!puzzle.ok || !tiles.ok) throw new Error("bad record");
  return { puzzle: puzzle.value, tiles: tiles.value };
}

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [102, "1:42"],
    [599, "9:59"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [3725, "1:02:05"],
    [36000, "10:00:00"],
    [61.9, "1:01"],
    [-5, "0:00"],
  ])("%s seconds is %s", (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });
});

describe("buildShareText goldens (5 x 5 daily)", () => {
  const { puzzle, tiles } = load("harbor-01");
  const base = { dateKey: "2026-10-23", puzzle, tiles };

  it("hides the path by default with a 3-star header", () => {
    expect(buildShareText({ ...base, stars: 3, seconds: 102 })).toBe(
      [
        "Lantern Loops Daily 2026-10-23",
        "3 stars  1:42",
        "⬛⬛⬛⬛⬛",
        "⬛⬛🏮⬛⬛",
        "⬛⬛⬛⬛⬛",
        "⬛⬛⬛⬛⬛",
        "⬛⬛🏮⬛⬛",
      ].join("\n"),
    );
  });

  it("shows the lit path as colour squares when asked, with a 1-star header", () => {
    expect(buildShareText({ ...base, stars: 1, seconds: 61, hidePath: false })).toBe(
      [
        "Lantern Loops Daily 2026-10-23",
        "1 star  1:01",
        "🟧🟧🟧⬛⬛",
        "🟧🟧🟧⬛⬛",
        "🟧🟧🟧🟧⬛",
        "🟧⬛🟧🟧⬛",
        "🟧🟧🟧⬛⬛",
      ].join("\n"),
    );
  });

  it("formats a time over one hour as h:mm:ss", () => {
    const text = buildShareText({ ...base, stars: 2, seconds: 3725 });
    expect(text.split("\n").slice(0, 2)).toEqual([
      "Lantern Loops Daily 2026-10-23",
      "2 stars  1:02:05",
    ]);
  });

  it("has no trailing newline and no URL", () => {
    const text = buildShareText({ ...base, stars: 3, seconds: 9 });
    expect(text.endsWith("\n")).toBe(false);
    expect(text).not.toMatch(/https?:/);
  });
});

describe("buildShareText colour squares (9 x 9, five colours)", () => {
  const { puzzle, tiles } = load("sky-27");

  it("hides the path and keeps stones and lanterns", () => {
    expect(buildShareText({ dateKey: "2026-10-24", stars: 3, seconds: 840, puzzle, tiles })).toBe(
      [
        "Lantern Loops Daily 2026-10-24",
        "3 stars  14:00",
        "⬛⬛⬛⬛⬛⬛🏮⬛⬛",
        "⬛⬛⬛⬛⬛⬛⬛⬛⬛",
        "⬛⬛⬛⬛⬛⬛⬛⬛⬛",
        "⬛⬜⬛🏮⬛⬛⬛⬛⬛",
        "⬛⬛⬛⬛⬛⬛⬛⬛⬛",
        "⬛⬛🏮🏮⬛⬛⬜⬛⬛",
        "⬛⬛⬛⬛⬛⬛⬛🏮⬛",
        "⬛⬛⬛⬛⬛⬛⬜⬛⬛",
        "⬛⬜⬛⬛⬛⬛⬛🏮⬛",
      ].join("\n"),
    );
  });

  it("draws every lantern colour as its own square", () => {
    const text = buildShareText({
      dateKey: "2026-10-24",
      stars: 3,
      seconds: 840,
      puzzle,
      tiles,
      hidePath: false,
    });
    expect(text.split("\n").slice(2)).toEqual([
      "⬛⬛⬛⬛⬛🟧🟧🟧⬛",
      "⬛⬛⬛⬛⬛🟧🟧🟧🟧",
      "⬛⬛⬛🟩🟩🟩🟧🟧🟧",
      "⬛⬜⬛🟩🟩🟩⬛🟧🟧",
      "⬛🟦🟦🟪🟪⬛⬛🟧🟧",
      "🟦🟦🟦🟪🟪⬛⬜🟧🟧",
      "🟦🟦🟦🟪🟪⬛⬛🟧🟧",
      "⬛🟦🟦🟪🟪⬛⬜🟥🟥",
      "⬛⬜⬛⬛⬛⬛⬛🟥🟥",
    ]);
    for (const square of Object.values(COLOUR_SQUARES)) expect(text).toContain(square);
  });
});
