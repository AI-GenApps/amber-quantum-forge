import { describe, expect, expectTypeOf, it } from "vitest";
import { defineStrings, interpolate, plural } from "./strings";

const strings = defineStrings({
  title: "Lantern Loops",
  score: "Score: {points} in {moves} moves",
  repeat: "{n} and {n}",
});

describe("strings", () => {
  it("returns plain strings", () => {
    expect(strings.t("title")).toBe("Lantern Loops");
  });

  it("interpolates numbers and strings, every occurrence", () => {
    expect(strings.t("score", { points: 120, moves: "9" })).toBe("Score: 120 in 9 moves");
    expect(strings.t("repeat", { n: 2 })).toBe("2 and 2");
  });

  it("checks keys and placeholders at compile time", () => {
    expectTypeOf(strings.t<"title">).parameters.toEqualTypeOf<["title"]>();
    // @ts-expect-error unknown key
    expect(() => strings.t("missing")).toThrow("Unknown string key: missing");
    // @ts-expect-error placeholder object is required
    expect(strings.t("score")).toBe("Score: {points} in {moves} moves");
  });

  it("lists and tests keys", () => {
    expect(strings.keys()).toEqual(["title", "score", "repeat"]);
    expect(strings.has("title")).toBe(true);
    expect(strings.has("toString")).toBe(false);
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("a {x} b", {})).toBe("a {x} b");
    expect(interpolate("a {x} b", undefined)).toBe("a {x} b");
  });

  it("selects plurals", () => {
    expect(plural(1, "star", "stars")).toBe("star");
    expect(plural(0, "star", "stars")).toBe("stars");
    expect(plural(3, "star", "stars")).toBe("stars");
  });
});
