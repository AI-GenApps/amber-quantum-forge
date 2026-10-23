import { describe, expect, it } from "vitest";
import {
  eligibleScenes,
  eveningLimit,
  eveningQueue,
  type RegularProgress,
  type SceneRef,
} from "../src";

const progress = (
  regularId: number,
  fp: number,
  visits: number,
  scenesDone: number,
): RegularProgress => ({ regularId, fp, visits, scenesDone });

describe("eligibleScenes", () => {
  it("offers scene 1 at level 1 with one visit", () => {
    expect(eligibleScenes([progress(1, 1, 1, 0)])).toEqual([{ regularId: 1, index: 1 }]);
  });

  it("needs the level: one point short blocks the scene", () => {
    expect(eligibleScenes([progress(1, 1, 2, 1)])).toEqual([]);
    expect(eligibleScenes([progress(1, 2, 2, 1)])).toEqual([{ regularId: 1, index: 2 }]);
  });

  it("needs the visits: level reached but too few visits blocks the scene", () => {
    expect(eligibleScenes([progress(1, 8, 2, 2)])).toEqual([]);
    expect(eligibleScenes([progress(1, 8, 3, 2)])).toEqual([{ regularId: 1, index: 3 }]);
  });

  it("needs the previous scene finished: only the next scene is offered", () => {
    expect(eligibleScenes([progress(1, 8, 5, 0)])).toEqual([{ regularId: 1, index: 1 }]);
    expect(eligibleScenes([progress(1, 8, 5, 3)])).toEqual([{ regularId: 1, index: 4 }]);
  });

  it("checks every threshold boundary for scenes 1 to 5", () => {
    const fpNeeded = [1, 2, 4, 6, 8];
    for (let k = 1; k <= 5; k++) {
      const need = fpNeeded[k - 1] as number;
      expect(eligibleScenes([progress(1, need - 1, k, k - 1)])).toEqual([]);
      expect(eligibleScenes([progress(1, need, k, k - 1)])).toEqual([{ regularId: 1, index: k }]);
      expect(eligibleScenes([progress(1, need, k - 1, k - 1)])).toEqual([]);
    }
  });

  it("offers nothing once all five scenes are done", () => {
    expect(eligibleScenes([progress(1, 8, 9, 5)])).toEqual([]);
  });

  it("collects one scene per eligible regular", () => {
    const list = eligibleScenes([progress(3, 2, 2, 1), progress(1, 1, 1, 0), progress(2, 0, 3, 0)]);
    expect(list).toEqual([
      { regularId: 3, index: 2 },
      { regularId: 1, index: 1 },
    ]);
  });
});

describe("eveningQueue", () => {
  const many: SceneRef[] = Array.from({ length: 8 }, (_, i) => ({ regularId: 8 - i, index: 1 }));

  it("orders by regular and then scene index", () => {
    const queue = eveningQueue(
      [
        { regularId: 2, index: 2 },
        { regularId: 1, index: 3 },
        { regularId: 2, index: 1 },
        { regularId: 1, index: 2 },
      ],
      4,
      3,
    );
    expect(queue).toEqual([
      { regularId: 1, index: 2 },
      { regularId: 1, index: 3 },
      { regularId: 2, index: 1 },
      { regularId: 2, index: 2 },
    ]);
  });

  it("caps an ordinary evening at 4 scenes", () => {
    const queue = eveningQueue(many, 4, 5);
    expect(queue.map((ref) => ref.regularId)).toEqual([1, 2, 3, 4]);
    expect(eveningQueue(many, undefined, 5)).toHaveLength(4);
  });

  it("allows 8 scenes on Day 14", () => {
    expect(eveningQueue(many, 4, 14)).toHaveLength(8);
    expect(eveningLimit(14)).toBe(8);
    expect(eveningLimit(13)).toBe(4);
  });

  it("does not mutate its input and handles an empty list", () => {
    const copy = many.map((ref) => ({ ...ref }));
    eveningQueue(many, 4, 2);
    expect(many).toEqual(copy);
    expect(eveningQueue([], 4, 2)).toEqual([]);
  });
});
