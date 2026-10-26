import { describe, expect, it } from "vitest";
import {
  type ContentBundle,
  type ContentIssue,
  type ContentIssueCode,
  defaultBundle,
  validateContent,
} from "../src";

type Writable<T> = { -readonly [K in keyof T]: Writable<T[K]> };
type Draft = Writable<Omit<ContentBundle, "artSlotIds">> & { artSlotIds: Set<string> };

function draft(): Draft {
  const bundle = defaultBundle();
  const copy = structuredClone({ ...bundle, artSlotIds: [...bundle.artSlotIds] });
  return { ...copy, artSlotIds: new Set(copy.artSlotIds) } as unknown as Draft;
}

function codes(issues: readonly ContentIssue[]): ContentIssueCode[] {
  return [...new Set(issues.map((entry) => entry.code))].sort();
}

function check(change: (bundle: Draft) => void): ContentIssueCode[] {
  const bundle = draft();
  change(bundle);
  return codes(validateContent(bundle as unknown as ContentBundle));
}

function scene(bundle: Draft, regular: number, index: number) {
  const found = bundle.scenes.find((s) => s.regular === regular && s.index === index);
  if (found === undefined) throw new Error("scene not found");
  return found;
}

describe("the real content", () => {
  it("produces no issues", () => {
    expect(validateContent()).toEqual([]);
  });

  it("an untouched copy produces no issues either", () => {
    expect(check(() => undefined)).toEqual([]);
  });
});

describe("broken copies", () => {
  it("a dangling next scene", () => {
    expect(
      check((b) => {
        scene(b, 1, 2).next = "scene-1-9";
      }),
    ).toEqual(["DANGLING_SCENE"]);
  });

  it("a scene of an unknown regular", () => {
    expect(
      check((b) => {
        scene(b, 8, 5).regular = 9;
      }),
    ).toContain("DANGLING_SCENE");
  });

  it("a guard that names no choice", () => {
    const result = check((b) => {
      const beat = scene(b, 1, 4).beats.find((x) => x.guard !== undefined);
      if (beat?.guard) beat.guard.choice = "r1-c9";
    });
    expect(result).toEqual(["DANGLING_GUARD"]);
  });

  it("a guard that is used before its choice is made", () => {
    const result = check((b) => {
      const target = scene(b, 1, 2);
      target.beats[1] = {
        speaker: "narration",
        text: "Early.",
        guard: { choice: "r1-c1", option: "a" },
      };
    });
    expect(result).toEqual(["DANGLING_GUARD"]);
  });

  it("a regular whose late scenes never react to a choice", () => {
    const result = check((b) => {
      for (const s of b.scenes.filter((x) => x.regular === 1 && x.index >= 4)) {
        s.beats = s.beats.filter((beat) => beat.guard === undefined);
        while (s.beats.length < 6) s.beats.push({ speaker: "narration", text: "Rain falls." });
      }
    });
    expect(result).toEqual(["DANGLING_GUARD"]);
  });

  it("a third choice for a regular who should have two", () => {
    const result = check((b) => {
      const donor = scene(b, 2, 4).choice;
      if (donor === undefined) throw new Error("no donor");
      scene(b, 2, 3).choice = { ...structuredClone(donor), id: "r2-c3", afterBeat: 3 };
    });
    expect(result).toEqual(["BAD_CHOICE_COUNT"]);
  });

  it("a choice with a third reaction beat", () => {
    const result = check((b) => {
      scene(b, 1, 3).choice?.options.a.reaction.push({ speaker: "narration", text: "More." });
    });
    expect(result).toEqual(["BAD_CHOICE_COUNT"]);
  });

  it("an option label of nine words", () => {
    const result = check((b) => {
      const option = scene(b, 1, 3).choice?.options.a;
      if (option) option.label = "Ask to light it one more night for sure please";
    });
    expect(result).toEqual(["BEAT_LENGTH"]);
  });

  it("a missing ending block", () => {
    const result = check((b) => {
      const endings = scene(b, 3, 5).endings;
      if (endings) delete (endings as { b?: unknown }).b;
    });
    expect(result).toEqual(["BAD_ENDING"]);
  });

  it("an ending title that differs from the regular", () => {
    const result = check((b) => {
      const endings = scene(b, 3, 5).endings;
      if (endings) endings.a.title = "Something Else";
    });
    expect(result).toEqual(["BAD_ENDING"]);
  });

  it("an ending block of five beats", () => {
    const result = check((b) => {
      scene(b, 3, 5).endings?.a.beats.push(
        { speaker: "narration", text: "Extra." },
        { speaker: "narration", text: "More." },
      );
    });
    expect(result).toEqual(["BAD_ENDING"]);
  });

  it("an ending that no choice can reach", () => {
    const result = check((b) => {
      delete (scene(b, 1, 3) as { choice?: unknown }).choice;
      for (const s of b.scenes.filter((x) => x.regular === 1)) {
        s.beats = s.beats.filter((beat) => beat.guard === undefined);
        while (s.beats.length < 6) s.beats.push({ speaker: "narration", text: "Rain falls." });
      }
    });
    expect(result).toContain("BAD_ENDING");
    expect(result).toContain("BAD_CHOICE_COUNT");
  });

  it("a ten-beat scene", () => {
    const result = check((b) => {
      scene(b, 5, 1).beats.push({ speaker: "narration", text: "One more cup." });
      scene(b, 5, 1).beats.push({ speaker: "narration", text: "A second cup." });
    });
    expect(result).toEqual(["BEAT_COUNT"]);
  });

  it("a five-beat scene", () => {
    const result = check((b) => {
      scene(b, 5, 1).beats.length = 5;
    });
    expect(result).toEqual(["BEAT_COUNT"]);
  });

  it("a beat of twenty-six words", () => {
    const result = check((b) => {
      scene(b, 5, 1).beats[2] = {
        speaker: "narration",
        text: `${"The tea is hot. ".repeat(6)}Ok it is.`,
      };
    });
    expect(result).toEqual(["BEAT_LENGTH"]);
  });

  it("an unknown speaker", () => {
    const result = check((b) => {
      scene(b, 5, 1).beats[1] = { speaker: "regular-6", text: "Hello." };
    });
    expect(result).toEqual(["BAD_SPEAKER"]);
  });

  it("a very hard beat", () => {
    const result = check((b) => {
      scene(b, 5, 1).beats[1] = {
        speaker: "narration",
        text: "Unquestionably, extraordinary organisational responsibilities necessitated considerable administrative reconsideration.",
      };
    });
    expect(result).toContain("READING_LEVEL");
    expect(result).toEqual(["READING_LEVEL"]);
  });

  it("an unknown art slot", () => {
    expect(
      check((b) => {
        b.artSlotIds.delete("drink-2");
      }),
    ).toEqual(["UNKNOWN_ART_SLOT"]);
  });

  it("an unknown favourite item", () => {
    const result = check((b) => {
      const regular = b.regulars[0];
      if (regular) (regular.likes as { drink: string }).drink = "drink-9";
    });
    expect(result).toEqual(["UNKNOWN_ITEM"]);
  });

  it("an unknown item in a day unlock", () => {
    const result = check((b) => {
      const day = b.days[2];
      if (day) (day.unlocks.drinks as string[]).push("drink-9");
    });
    expect(result).toContain("UNKNOWN_ITEM");
  });

  it("a wrong visit count: a sixth campaign visit", () => {
    const result = check((b) => {
      const day = b.days[11];
      if (day) day.regularsDue = [...day.regularsDue, 1];
    });
    expect(result).toEqual(["CALENDAR", "VISIT_COUNT"]);
  });

  it("an unreachable arc: only four campaign visits", () => {
    const result = check((b) => {
      const day = b.days[10];
      if (day) day.regularsDue = day.regularsDue.filter((id) => id !== 1);
      const regular = b.regulars[0];
      if (regular) regular.visitDays = [1, 3, 6, 9, 9];
    });
    expect(result).toContain("UNREACHABLE_ARC");
    expect(result).toContain("VISIT_COUNT");
  });

  it("a wrong weather or patience row", () => {
    expect(
      check((b) => {
        const d = b.days[2];
        if (d) d.weather = "morning";
      }),
    ).toEqual(["DAY_TABLE"]);
    expect(
      check((b) => {
        const d = b.days[4];
        if (d) d.patienceSeconds = 44;
      }),
    ).toEqual(["DAY_TABLE"]);
  });

  it("a wrong customer total", () => {
    expect(
      check((b) => {
        const d = b.days[2];
        if (d) d.customers = 9;
      }),
    ).toEqual(["DAY_TABLE"]);
  });

  it("a missing scene", () => {
    const result = check((b) => {
      b.scenes.splice(12, 1);
    });
    expect(result).toContain("SCENE_COUNT");
    expect(result).toContain("DANGLING_SCENE");
  });

  it("a wrong gift", () => {
    expect(
      check((b) => {
        scene(b, 1, 5).gift = 5;
      }),
    ).toEqual(["SCENE_COUNT"]);
  });

  it("a placeholder or non-Latin character", () => {
    expect(
      check((b) => {
        scene(b, 1, 1).beats[2] = { speaker: "you", text: "TODO later." };
      }),
    ).toEqual(["BAD_CHARACTER"]);
    expect(
      check((b) => {
        scene(b, 1, 1).beats[2] = { speaker: "you", text: "Hello Ω there." };
      }),
    ).toEqual(["BAD_CHARACTER"]);
    expect(
      check((b) => {
        scene(b, 1, 1).beats[2] = { speaker: "you", text: "Hi \u{1F600}." };
      }),
    ).toEqual(["BAD_CHARACTER"]);
  });

  it("a finale line over twenty words", () => {
    const result = check((b) => {
      const line = b.finale.lines[0];
      if (line)
        line.text =
          "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone.";
    });
    expect(result).toEqual(["BEAT_LENGTH"]);
  });

  it("a day card that mentions neither weather nor regular", () => {
    expect(
      check((b) => {
        const c = b.dayCards[0];
        if (c) c.text = "Open the shop and be kind.";
      }),
    ).toEqual(["DAY_TABLE"]);
  });

  it("a missing finale variant", () => {
    const result = check((b) => {
      b.finale.lines.splice(4, 1);
    });
    expect(result).toContain("BAD_ENDING");
    expect(result).toContain("SCENE_COUNT");
  });
});
