import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ALMANAC,
  CARDS,
  CASES,
  CHAPTERS,
  chapterOf,
  getCase,
  LEDGER,
  nextCaseId,
  PEOPLE_BY_ID,
  PLACES,
  revealUsesVocabulary,
  SHIPPED_CONTENT,
  THEMES,
  TOTAL_CLUES,
  TOTAL_OBJECTS,
  TOTAL_STAMPS,
  TUTORIAL,
} from "../src";

function strings(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value))
    for (const [index, entry] of value.entries()) strings(entry, `${path}[${index}]`, out);
  else if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) strings(entry, `${path}.${key}`, out);
  }
  return out;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
}

describe("content text hygiene", () => {
  it("has no empty or whitespace-only string anywhere", () => {
    const empties = strings(SHIPPED_CONTENT, "content").filter(([, text]) => text.trim() === "");
    expect(empties).toEqual([]);
  });

  it("has no emoji and only printable ASCII", () => {
    const bad = strings(SHIPPED_CONTENT, "content").filter(
      ([, text]) => !/^[\x20-\x7e]*$/.test(text),
    );
    expect(bad).toEqual([]);
  });

  it("has no repeated clue text or caption", () => {
    const texts = CASES.flatMap((item) => item.clues.map((clue) => clue.text.toLowerCase()));
    const captions = CASES.flatMap((item) =>
      item.objects.map((object) => object.caption.toLowerCase()),
    );
    expect(new Set(texts).size).toBe(texts.length);
    expect(new Set(captions).size).toBe(captions.length);
  });

  it("repeats no sentence across reveals and clue texts", () => {
    const all = CASES.flatMap((item) => [
      ...sentences(item.reveal),
      ...item.clues.flatMap((clue) => sentences(clue.text)),
    ]);
    expect(all.filter((part, index) => all.indexOf(part) !== index)).toEqual([]);
  });

  it("keeps the totals", () => {
    expect(CASES).toHaveLength(12);
    expect(TOTAL_STAMPS).toBe(36);
    expect(CASES.reduce((sum, item) => sum + item.objects.length, 0)).toBe(TOTAL_OBJECTS);
    expect(CASES.reduce((sum, item) => sum + item.clues.length, 0)).toBe(TOTAL_CLUES);
    expect(TOTAL_OBJECTS).toBe(49);
    expect(TOTAL_CLUES).toBe(70);
  });
});

describe("reveals", () => {
  for (const item of CASES) {
    it(`case ${item.id} names the owner and uses almanac vocabulary`, () => {
      const owner = PEOPLE_BY_ID[item.ownerId];
      expect(item.reveal).toContain(owner?.name ?? "missing");
      expect(revealUsesVocabulary(item)).toBe(true);
    });

    it(`case ${item.id} states each deduction value in plain words`, () => {
      for (const entry of item.deductions) {
        const almanac = ALMANAC.find(
          (row) => row.facet === entry.facet && row.value === entry.value,
        );
        const words = [entry.value, ...(almanac?.keywords ?? []), ...(almanac?.avoid ?? [])];
        const lower = item.reveal.toLowerCase();
        expect(
          words.some(
            (word) =>
              lower.includes(word.toLowerCase().replace(/-/g, " ")) ||
              lower.includes(word.toLowerCase()),
          ),
        ).toBe(true);
      }
    });
  }
});

describe("lore and meta content", () => {
  it("has 12 ledger fragments in order, one per case", () => {
    expect(LEDGER.map((fragment) => fragment.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(LEDGER.map((fragment) => fragment.caseId)).toEqual(CASES.map((item) => item.id));
    expect(LEDGER.map((fragment) => fragment.title)).toEqual(CASES.map((item) => item.ledgerTitle));
  });

  it("mechanic cards reference existing case ids", () => {
    expect(CARDS).toHaveLength(4);
    for (const card of CARDS) expect(getCase(card.caseId)).toBeDefined();
    expect(CARDS.map((card) => card.caseId)).toEqual(["01", "01", "05", "06"]);
  });

  it("tutorial steps are ordered and their triggers point at real content", () => {
    expect(TUTORIAL.map((step) => step.step)).toEqual([1, 2, 3, 4, 5, 6]);
    const tutorialCase = getCase("01");
    for (const step of TUTORIAL) {
      const { trigger } = step;
      if (trigger.kind === "object-opened") {
        expect(tutorialCase?.objects.some((object) => object.id === trigger.objectId)).toBe(true);
      }
      if (trigger.kind === "clue-found") {
        const clue = tutorialCase?.clues.find((entry) => entry.id === trigger.clueId);
        expect(clue?.face).toBe("zoom");
      }
    }
  });

  it("achievements have unique ids and rules that point at real cases and chapters", () => {
    expect(ACHIEVEMENTS).toHaveLength(12);
    expect(new Set(ACHIEVEMENTS.map((entry) => entry.id)).size).toBe(12);
    for (const entry of ACHIEVEMENTS) {
      if (entry.rule.kind === "close-case") expect(getCase(entry.rule.caseId)).toBeDefined();
      if (entry.rule.kind === "close-chapter") {
        expect(
          CHAPTERS.some((chapter) => chapter.id === (entry.rule as { chapter: number }).chapter),
        ).toBe(true);
      }
    }
  });

  it("themes unlock in rising stamp order from zero", () => {
    expect(THEMES.map((theme) => theme.stampsNeeded)).toEqual([0, 6, 14, 24, 33]);
  });

  it("helpers navigate the cases", () => {
    expect(nextCaseId("01")).toBe("02");
    expect(nextCaseId("12")).toBeNull();
    expect(chapterOf("05")?.id).toBe(2);
    expect(chapterOf("12")?.title).toBe("The Last Sack");
    expect(getCase("99")).toBeUndefined();
    expect(PLACES.map((place) => place.caseId)).toEqual(CASES.map((item) => item.id));
  });
});

describe("source hygiene", () => {
  const SRC = join(import.meta.dirname, "..", "src");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? files(full) : full.endsWith(".ts") ? [full] : [];
    });

  it("keeps every source file under 800 lines", () => {
    const long = files(SRC).filter((file) => readFileSync(file, "utf8").split("\n").length >= 800);
    expect(long).toEqual([]);
  });

  it("never uses the any type", () => {
    const offenders = files(SRC).filter((file) =>
      /:\s*any\b|\bas any\b|<any>/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
