import { describe, expect, it } from "vitest";
import {
  type ChoiceMade,
  canReplay,
  choicesMadeFor,
  completeScene,
  DIARY,
  defaultProfile,
  diaryEntries,
  endingFor,
  journalEntries,
  type OptionKey,
  type Profile,
  queueEvening,
  REGULARS,
  START_COINS,
  scenesOf,
  waitingScenes,
} from "../src";
import { allPicks, choiceScenes, madeFor, playScene } from "./helpers/scenes";

function ready(overrides: Partial<Profile> = {}): Profile {
  const profile = defaultProfile();
  for (let id = 1; id <= 8; id++) {
    profile.regulars[id] = { fp: 8, visits: 5, scenesDone: 0, choices: {}, ending: null };
  }
  return { ...profile, day: 15, ...overrides };
}

function ownChoice(sceneId: string, pick: OptionKey): ChoiceMade | undefined {
  const scene = scenesOf(Number(sceneId.split("-")[1])).find((s) => s.id === sceneId);
  const choice = scene?.choice;
  if (choice === undefined) return undefined;
  return { choice: choice.id, option: pick, lean: choice.options[pick].lean };
}

function playRegular(profile: Profile, regularId: number, picks: readonly OptionKey[]): Profile {
  let current = profile;
  let used = 0;
  for (const scene of scenesOf(regularId)) {
    const pick = scene.choice === undefined ? undefined : (picks[used++] as OptionKey);
    const applied = completeScene(
      current,
      scene.id,
      pick === undefined ? undefined : ownChoice(scene.id, pick),
    );
    expect(applied.status, scene.id).toBe("completed");
    current = applied.profile;
  }
  return current;
}

describe("completeScene", () => {
  it("pays the gift once: 5 for scenes 1 to 4 and 15 for scene 5", () => {
    let profile = ready();
    const gifts: number[] = [];
    for (const scene of scenesOf(1)) {
      const applied = completeScene(profile, scene.id, ownChoice(scene.id, "a"));
      gifts.push(applied.gift);
      profile = applied.profile;
    }
    expect(gifts).toEqual([5, 5, 5, 5, 15]);
    expect(profile.coins).toBe(START_COINS + 35);
    expect(profile.regulars[1]?.scenesDone).toBe(5);
    expect(profile.stats.scenesRead).toBe(5);
  });

  it("pays nothing on a replay and leaves the profile untouched", () => {
    const once = completeScene(ready(), "scene-1-1", undefined).profile;
    const replay = completeScene(once, "scene-1-1", undefined);
    expect(replay.status).toBe("replay");
    expect(replay.gift).toBe(0);
    expect(replay.profile).toBe(once);
    expect(canReplay(once, "scene-1-1")).toBe(true);
    expect(canReplay(once, "scene-1-2")).toBe(false);
  });

  it("refuses a scene that is not the next one or not eligible yet", () => {
    expect(completeScene(ready(), "scene-1-2").status).toBe("locked");
    expect(completeScene(defaultProfile(), "scene-1-1").status).toBe("locked");
    expect(completeScene(ready(), "scene-9-9").status).toBe("locked");
    const lowFp = ready();
    lowFp.regulars[1] = { fp: 0, visits: 5, scenesDone: 0, choices: {}, ending: null };
    expect(completeScene(lowFp, "scene-1-1").status).toBe("locked");
  });

  it("removes the scene from the pending evening queue", () => {
    const queued = queueEvening(ready(), 14).profile;
    expect(queued.pendingEvening.length).toBeGreaterThan(0);
    const done = completeScene(queued, "scene-1-1").profile;
    expect(done.pendingEvening).not.toContain("scene-1-1");
    expect(done.pendingEvening).toHaveLength(queued.pendingEvening.length - 1);
  });

  it("totals 280 coins when all 40 scenes are finished", () => {
    let profile = ready();
    for (const regular of REGULARS) {
      profile = playRegular(profile, regular.id, allPicks(regular.id)[0] ?? []);
    }
    expect(profile.coins - START_COINS).toBe(280);
    expect(profile.stats.scenesRead).toBe(40);
    expect(waitingScenes(profile)).toEqual([]);
  });
});

describe("choices and endings", () => {
  for (const regular of REGULARS) {
    const combos = allPicks(regular.id);
    for (const picks of combos) {
      it(`${regular.name} with picks ${picks.join("")} records the same ending as the scene player`, () => {
        const profile = playRegular(ready(), regular.id, picks);
        const row = profile.regulars[regular.id];
        const made = madeFor(regular.id, picks);
        const lastScene = scenesOf(regular.id).find((s) => s.index === 5);
        if (lastScene === undefined) throw new Error("no scene 5");
        const expected = playScene(lastScene, made).outcome.ending;
        expect(row?.ending).toBe(expected);
        expect(Object.keys(row?.choices ?? {})).toHaveLength(choiceScenes(regular.id).length);
        expect(endingFor(profile, regular.id)).toBe(expected);
      });
    }
  }

  it("a majority decides and a tie goes to the last choice", () => {
    const two = REGULARS.find((r) => r.choiceCount === 2);
    if (two === undefined) throw new Error("no two-choice regular");
    const lean = (picks: OptionKey[]) =>
      playRegular(ready(), two.id, picks).regulars[two.id]?.ending;
    const first = madeFor(two.id, ["a", "b"]);
    expect(first.map((m) => m.lean)).toEqual(["a", "b"]);
    expect(lean(["a", "b"])).toBe("b");
    expect(lean(["b", "a"])).toBe("a");
    expect(lean(["a", "a"])).toBe("a");
    expect(lean(["b", "b"])).toBe("b");
  });

  it("choicesMadeFor lists the choices in story order with their leans", () => {
    const two = REGULARS.find((r) => r.choiceCount === 2);
    if (two === undefined) throw new Error("no two-choice regular");
    const profile = playRegular(ready(), two.id, ["b", "a"]);
    expect(choicesMadeFor(profile, two.id)).toEqual(madeFor(two.id, ["b", "a"]));
  });

  it("records no ending before scene 5", () => {
    const profile = completeScene(ready(), "scene-1-1").profile;
    expect(profile.regulars[1]?.ending).toBeNull();
    expect(endingFor(profile, 1)).toBeNull();
  });
});

describe("journal and diary", () => {
  it("lists 8 stories with ending titles for finished ones", () => {
    const two = REGULARS.find((r) => r.choiceCount === 1);
    if (two === undefined) throw new Error("no regular");
    const entries = journalEntries(playRegular(ready(), two.id, ["a"]));
    expect(entries).toHaveLength(8);
    const done = entries.find((e) => e.regularId === two.id);
    expect(done?.finished).toBe(true);
    expect(done?.endingTitle).toBe(two.endingTitles.a);
    expect(done?.scenes.every((s) => s.available)).toBe(true);
    const other = entries.find((e) => e.regularId !== two.id);
    expect(other?.finished).toBe(false);
    expect(other?.endingTitle).toBeNull();
    expect(other?.scenes.every((s) => !s.available)).toBe(true);
  });

  it("shop diary shows one entry per finished campaign day", () => {
    expect(diaryEntries(defaultProfile())).toEqual([]);
    const entries = diaryEntries({ ...defaultProfile(), diary: [1, 2, 14] });
    expect(entries.map((e) => e.day)).toEqual([1, 2, 14]);
    expect(entries[2]).toEqual(DIARY[13]);
  });
});

describe("queueEvening", () => {
  it("applies the cap and reports the remainder", () => {
    const four = queueEvening(ready(), 3);
    expect(four.queue).toHaveLength(4);
    expect(four.remainder).toHaveLength(4);
    const eight = queueEvening(ready(), 14);
    expect(eight.queue).toHaveLength(8);
    expect(eight.remainder).toHaveLength(0);
  });

  it("offers one scene per regular at a time", () => {
    expect(waitingScenes(ready()).map((ref) => ref.index)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
  });
});
