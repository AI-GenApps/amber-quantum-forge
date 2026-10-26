import { describe, expect, it } from "vitest";
import {
  FINAL_SCENE_GIFT,
  getRegular,
  REGULARS,
  SCENE_BY_ID,
  SCENE_GIFT,
  SCENES,
  scenesOf,
  visibleBeats,
  words,
} from "../src";
import { beatsOf } from "../src/content/validateScenes";
import { allPicks, choiceScenes, madeFor, playScene } from "./helpers/scenes";

describe("scene structure", () => {
  it("has 8 regulars with 5 scenes each, 40 in total, in order", () => {
    expect(REGULARS).toHaveLength(8);
    expect(SCENES).toHaveLength(40);
    SCENES.forEach((scene, i) => {
      expect(scene.regular).toBe(Math.floor(i / 5) + 1);
      expect(scene.index).toBe((i % 5) + 1);
    });
  });

  it("has unique scene ids that resolve through SCENE_BY_ID", () => {
    const ids = SCENES.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(40);
    for (const scene of SCENES) expect(SCENE_BY_ID.get(scene.id)).toBe(scene);
  });

  it("has unique scene titles", () => {
    expect(new Set(SCENES.map((s) => s.title)).size).toBe(40);
  });

  it("chains the five scenes of one regular, scene 5 has no next", () => {
    for (const regular of REGULARS) {
      const own = scenesOf(regular.id);
      own.forEach((scene, i) => {
        if (i < 4) {
          expect(scene.next).toBe(own[i + 1]?.id);
          expect(SCENE_BY_ID.has(scene.next as string)).toBe(true);
        } else expect(scene.next).toBeNull();
      });
    }
  });

  it("pays 5 coins for scenes 1 to 4 and 15 for scene 5", () => {
    for (const scene of SCENES) {
      expect(scene.gift).toBe(scene.index === 5 ? FINAL_SCENE_GIFT : SCENE_GIFT);
    }
    expect([SCENE_GIFT, FINAL_SCENE_GIFT]).toEqual([5, 15]);
  });
});

describe("beats", () => {
  it("every scene has 6 to 9 beats", () => {
    for (const scene of SCENES) {
      expect(scene.beats.length, scene.id).toBeGreaterThanOrEqual(6);
      expect(scene.beats.length, scene.id).toBeLessThanOrEqual(9);
    }
  });

  it("every path through a scene shows 6 to 9 main beats", () => {
    for (const regular of REGULARS) {
      for (const picks of allPicks(regular.id)) {
        const made = madeFor(regular.id, picks);
        for (const scene of scenesOf(regular.id)) {
          const shown = visibleBeats(scene, made).length;
          expect(shown, scene.id).toBeGreaterThanOrEqual(6);
          expect(shown, scene.id).toBeLessThanOrEqual(9);
        }
      }
    }
  });

  it("no beat has more than 25 words", () => {
    for (const scene of SCENES) {
      for (const ref of beatsOf(scene)) {
        expect(words(ref.beat.text).length, ref.where).toBeLessThanOrEqual(25);
      }
    }
  });

  it("speakers are the regular, you or narration", () => {
    for (const scene of SCENES) {
      const ok = [getRegular(scene.regular).speaker, "you", "narration"];
      for (const ref of beatsOf(scene)) expect(ok, ref.where).toContain(ref.beat.speaker);
    }
  });

  it("opens and closes every scene with a non-empty beat", () => {
    for (const scene of SCENES) {
      expect(scene.beats[0]?.text.length).toBeGreaterThan(10);
      expect(scene.beats[scene.beats.length - 1]?.text.length).toBeGreaterThan(5);
    }
  });
});

describe("choices and endings", () => {
  const withChoice = SCENES.filter((s) => s.choice !== undefined);

  it("has 12 choices: regulars 2, 4, 6 and 8 have two, the others one", () => {
    expect(withChoice).toHaveLength(12);
    for (const regular of REGULARS) {
      const count = withChoice.filter((s) => s.regular === regular.id).length;
      expect(count).toBe([2, 4, 6, 8].includes(regular.id) ? 2 : 1);
      expect(regular.choiceCount).toBe(count);
    }
  });

  it("choice ids are unique and sit in scenes 2 to 4", () => {
    expect(new Set(withChoice.map((s) => s.choice?.id)).size).toBe(12);
    for (const scene of withChoice) {
      expect(scene.index).toBeGreaterThanOrEqual(2);
      expect(scene.index).toBeLessThanOrEqual(4);
    }
  });

  it("has 24 options with a lean, a label of at most 8 words and 2 reaction beats", () => {
    let options = 0;
    for (const scene of withChoice) {
      for (const key of ["a", "b"] as const) {
        const option = scene.choice?.options[key];
        options += 1;
        expect(option?.lean).toBe(key);
        expect(words(option?.label ?? "").length).toBeGreaterThan(0);
        expect(words(option?.label ?? "").length).toBeLessThanOrEqual(8);
        expect(option?.reaction).toHaveLength(2);
      }
    }
    expect(options).toBe(24);
  });

  it("has 16 ending blocks of 3 or 4 beats with the plan titles", () => {
    const finals = SCENES.filter((s) => s.index === 5);
    expect(finals).toHaveLength(8);
    let blocks = 0;
    for (const scene of finals) {
      const regular = getRegular(scene.regular);
      for (const key of ["a", "b"] as const) {
        const block = scene.endings?.[key];
        blocks += 1;
        expect(block?.title).toBe(regular.endingTitles[key]);
        expect(block?.beats.length).toBeGreaterThanOrEqual(3);
        expect(block?.beats.length).toBeLessThanOrEqual(4);
      }
    }
    expect(blocks).toBe(16);
    for (const scene of SCENES.filter((s) => s.index < 5)) expect(scene.endings).toBeUndefined();
  });

  it("every guard names a choice of the same regular that is made earlier", () => {
    for (const scene of SCENES) {
      const choices = choiceScenes(scene.regular);
      for (const ref of beatsOf(scene)) {
        const guard = ref.beat.guard;
        if (guard === undefined) continue;
        const owner = choices.find((s) => s.choice?.id === guard.choice);
        expect(owner, ref.where).toBeDefined();
        expect(["a", "b"]).toContain(guard.option);
        expect(owner?.index ?? 99, ref.where).toBeLessThanOrEqual(scene.index);
      }
    }
  });

  it("scene 4 or 5 of every regular reacts to a choice with a guarded beat", () => {
    for (const regular of REGULARS) {
      const late = scenesOf(regular.id).filter((s) => s.index >= 4);
      const guarded = late.flatMap((s) => beatsOf(s)).filter((ref) => ref.beat.guard !== undefined);
      expect(guarded.length, `regular ${regular.id}`).toBeGreaterThan(0);
    }
  });

  it("guarded beats come in pairs for both options in at least one late scene", () => {
    for (const regular of REGULARS) {
      const late = scenesOf(regular.id).filter((s) => s.index >= 4);
      const both = late.some((scene) => {
        const guards = scene.beats.flatMap((b) => (b.guard ? [b.guard] : []));
        return guards.some((g) =>
          guards.some((h) => h.choice === g.choice && h.option !== g.option),
        );
      });
      expect(both, `regular ${regular.id}`).toBe(true);
    }
  });
});

describe("playing every scene through the story player", () => {
  it("each scene finishes and pays the right gift", () => {
    for (const regular of REGULARS) {
      for (const picks of allPicks(regular.id)) {
        const made = madeFor(regular.id, picks);
        for (const scene of scenesOf(regular.id)) {
          const prior = made.filter((m) => {
            const owner = choiceScenes(regular.id).find((s) => s.choice?.id === m.choice);
            return (owner?.index ?? 99) < scene.index;
          });
          const played = playScene(
            scene,
            prior,
            picks[choiceScenes(regular.id).indexOf(scene)] ?? "a",
          );
          expect(played.lines.length, scene.id).toBeGreaterThan(5);
          expect(played.outcome.gift).toBe(scene.gift);
        }
      }
    }
  });

  it("reaches both endings of every regular, and the last choice breaks a tie", () => {
    for (const regular of REGULARS) {
      const finale = scenesOf(regular.id)[4];
      if (finale === undefined) throw new Error("no scene 5");
      const titles = new Set<string>();
      for (const picks of allPicks(regular.id)) {
        const made = madeFor(regular.id, picks);
        const played = playScene(finale, made);
        expect(played.outcome.ending).not.toBeNull();
        titles.add(played.outcome.endingTitle as string);
        const last = made[made.length - 1];
        if (made.length === 2 && made[0]?.lean !== last?.lean) {
          expect(played.outcome.ending).toBe(last?.lean);
        }
      }
      expect(titles).toEqual(new Set([regular.endingTitles.a, regular.endingTitles.b]));
    }
  });

  it("guarded beats show only for the matching choice", () => {
    for (const regular of REGULARS) {
      for (const scene of scenesOf(regular.id).filter((s) => s.index >= 4)) {
        for (const ref of beatsOf(scene).filter((r) => r.beat.guard && r.section === "main")) {
          const guard = ref.beat.guard;
          if (guard === undefined) continue;
          const owner = choiceScenes(regular.id).find((s) => s.choice?.id === guard.choice);
          if (owner === undefined || owner.index === scene.index) continue;
          const lean = owner.choice?.options[guard.option].lean ?? "a";
          const same = playScene(scene, [{ choice: guard.choice, option: guard.option, lean }]);
          const other = playScene(scene, [
            {
              choice: guard.choice,
              option: guard.option === "a" ? "b" : "a",
              lean: lean === "a" ? "b" : "a",
            },
          ]);
          expect(same.lines).toContain(ref.beat.text);
          expect(other.lines).not.toContain(ref.beat.text);
        }
      }
    }
  });
});
