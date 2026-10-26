import { describe, expect, it } from "vitest";
import type { FacetId } from "../src";
import {
  ACHIEVEMENTS,
  ALMANAC,
  CARDS,
  CASES,
  CHAPTERS,
  eliminatedBy,
  HEADLINES,
  LEDGER,
  PEOPLE,
  PEOPLE_BY_ID,
  PLACES,
  SETTING,
  STREETS,
  THEMES,
  TUTORIAL,
} from "../src";
import { bulletValue, caseSections, lineValue, tableUnder } from "./fixtures/plan";

const FACET_BY_LABEL: Record<string, FacetId> = {
  Street: "street",
  Pastime: "pastime",
  Look: "look",
  Pet: "pet",
};

function cell(row: string[], index: number): string {
  const value = row[index];
  if (value === undefined) throw new Error(`missing cell ${index}`);
  return value;
}

describe("plan: chapters, places and cast", () => {
  it("chapters match titles, case ranges and unlock stamps", () => {
    const rows = tableUnder("## Chapters");
    expect(rows).toHaveLength(CHAPTERS.length);
    rows.forEach((row, index) => {
      const chapter = CHAPTERS[index];
      expect(chapter?.id).toBe(Number(cell(row, 0)));
      expect(chapter?.title).toBe(cell(row, 1));
      const [first, last] = cell(row, 2).split(" to ");
      expect(chapter?.caseIds[0]).toBe(first);
      expect(chapter?.caseIds.at(-1)).toBe(last);
      const unlock = cell(row, 3);
      expect(chapter?.unlockStamps).toBe(unlock === "open" ? 0 : Number(unlock));
    });
  });

  it("chapter intro and outro texts are verbatim", () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.intro).toBe(bulletValue(`- Chapter ${chapter.id} intro: `));
      expect(chapter.outro).toBe(bulletValue(`- Chapter ${chapter.id} outro: `));
    }
  });

  it("the setting line is verbatim", () => {
    const line = bulletValue("Setting: ");
    expect(line).toBe(SETTING);
  });

  it("the town map matches places, streets and the owner's home street", () => {
    const rows = tableUnder("## Town map (12 places)");
    expect(rows).toHaveLength(PLACES.length);
    rows.forEach((row, index) => {
      expect(PLACES[index]).toEqual({
        caseId: cell(row, 0),
        name: cell(row, 1),
        street: cell(row, 2),
      });
    });
    const streetLine = bulletValue("The town map is code-drawn in the riso palette.").split(
      "Streets: ",
    )[1];
    expect(STREETS.map((street) => street.name)).toEqual(
      (streetLine ?? "").replace(/\.$/, "").split(", "),
    );
  });

  it("the 12 townsfolk match the table", () => {
    const rows = tableUnder("## Townsfolk (12, one owner each)");
    expect(rows).toHaveLength(PEOPLE.length);
    rows.forEach((row, index) => {
      const person = PEOPLE[index];
      expect(person?.name).toBe(cell(row, 1));
      expect(person?.trade).toBe(cell(row, 2));
      expect(person?.facets).toEqual({
        street: cell(row, 3),
        pastime: cell(row, 4),
        look: cell(row, 5),
        pet: cell(row, 6),
      });
      expect(person?.ownsCaseId).toBe(cell(row, 7));
      const appears = CASES.filter((item) => item.candidateIds.includes(person?.id ?? "")).map(
        (item) => item.id,
      );
      expect(appears).toEqual(cell(row, 8).split(", "));
      expect(person?.portraitSlot).toBe(cell(row, 9));
    });
  });

  it("bios are verbatim", () => {
    for (const person of PEOPLE) {
      expect(person.bio).toBe(bulletValue(`- ${person.name}: `));
    }
  });

  it("the almanac matches facet, value and keywords", () => {
    const rows = tableUnder("## Clerk's Almanac (clue vocabulary, 24 entries)");
    expect(rows).toHaveLength(ALMANAC.length);
    rows.forEach((row, index) => {
      const entry = ALMANAC[index];
      expect(entry?.facet).toBe(FACET_BY_LABEL[cell(row, 0)]);
      expect(entry?.value).toBe(cell(row, 1));
      expect(entry?.keywords.join(", ")).toBe(cell(row, 2));
    });
  });
});

describe("plan: case index", () => {
  const rows = tableUnder("## Case index");

  it("lists the 12 cases with the right metadata", () => {
    expect(rows).toHaveLength(CASES.length);
    rows.forEach((row, index) => {
      const item = CASES[index];
      expect(item?.id).toBe(cell(row, 0));
      expect(item?.title).toBe(cell(row, 1));
      expect(item?.chapter).toBe(Number(cell(row, 2)));
      expect(item?.place).toBe(cell(row, 3));
      expect(PEOPLE_BY_ID[item?.ownerId ?? ""]?.name).toBe(cell(row, 4));
      const firstNames = (item?.candidateIds ?? []).map(
        (id) => PEOPLE_BY_ID[id]?.name.split(" ")[0],
      );
      expect(firstNames.join(", ")).toBe(cell(row, 5));
      expect(item?.objects.length).toBe(Number(cell(row, 6)));
      const lead = item?.clues.filter((clue) => clue.flavour !== true).length;
      const flavour = item?.clues.filter((clue) => clue.flavour === true).length;
      expect(lead).toBe(Number(cell(row, 7)));
      expect(flavour).toBe(Number(cell(row, 8)));
      const letters = { direct: "D", pair: "K", "rule-out": "R" } as const;
      expect(item?.deductions.map((entry) => letters[entry.kind]).join("+")).toBe(cell(row, 9));
      expect(item?.difficulty).toBe(Number(cell(row, 10)));
      expect(item?.parMinutes).toBe(Number(cell(row, 11)));
    });
  });
});

describe("plan: case files", () => {
  const sections = caseSections();

  it("has one section per shipped case", () => {
    expect(sections.map((section) => section.id)).toEqual(CASES.map((item) => item.id));
  });

  for (const section of caseSections()) {
    describe(`case ${section.id}`, () => {
      const item = CASES.find((entry) => entry.id === section.id);
      if (item === undefined) throw new Error("case missing");

      it("header lines match", () => {
        expect(item.title).toBe(section.title);
        const slugLine = lineValue(section, "- Slug: ");
        expect(slugLine).toBe(
          `\`${item.slug}\`; chapter ${item.chapter}; found at: ${item.foundAt}; delivered to: ${item.place}.`,
        );
        const owner = PEOPLE_BY_ID[item.ownerId];
        const candidates = item.candidateIds.map((id) => PEOPLE_BY_ID[id]?.name).join(", ");
        expect(lineValue(section, "- Owner: ")).toBe(
          `${owner?.name} (${owner?.portraitSlot}). Candidates: ${candidates}.`,
        );
        expect(lineValue(section, "- Difficulty ")).toBe(
          `${item.difficulty}, par ${item.parMinutes} minutes. Ledger fragment: "${item.ledgerTitle}".`,
        );
      });

      it("objects match", () => {
        expect(section.objects).toHaveLength(item.objects.length);
        section.objects.forEach((row, index) => {
          const object = item.objects[index];
          expect(object?.id).toBe(cell(row, 0));
          expect(object?.name).toBe(cell(row, 1));
          expect(object?.artSlot).toBe(cell(row, 2));
        });
      });

      it("clues match", () => {
        expect(section.clues).toHaveLength(item.clues.length);
        section.clues.forEach((row, index) => {
          const clue = item.clues[index];
          expect(clue?.id).toBe(cell(row, 0));
          expect(clue?.objectId).toBe(cell(row, 1));
          expect(clue?.face).toBe(cell(row, 2));
          expect(clue?.tag).toBe(cell(row, 3));
          expect(clue?.flavour === true).toBe(cell(row, 4) === "flavour");
        });
      });

      it("deductions match", () => {
        expect(section.deductions).toHaveLength(item.deductions.length);
        section.deductions.forEach((row, index) => {
          const entry = item.deductions[index];
          const label = cell(row, 0);
          expect(entry?.id).toBe(`${item.id}-${label}`);
          expect(entry?.facet).toBe(FACET_BY_LABEL[cell(row, 1)]);
          const rule = /^owner's (\w+) is (not )?(.+)$/.exec(cell(row, 2));
          expect(entry?.polarity).toBe(rule?.[2] === undefined ? "is" : "isnot");
          expect(entry?.value).toBe(rule?.[3]);
          expect(entry?.kind).toBe(cell(row, 3));
          const roles = section.clues
            .filter((clue) => cell(clue, 4).startsWith(label))
            .map((clue) => cell(clue, 0));
          expect(entry?.clueIds).toEqual(roles);
          const effect = /^rules out (.+) \((.+)\)$/.exec(cell(row, 4));
          const eliminated = entry
            ? eliminatedBy(item, PEOPLE, entry).map((id) => PEOPLE_BY_ID[id])
            : [];
          expect(eliminated.map((person) => person?.name)).toEqual([effect?.[1]]);
          expect(eliminated[0]?.facets[entry?.facet ?? "street"]).toBe(effect?.[2]);
        });
      });

      it("reveal and ledger fragment match", () => {
        expect(lineValue(section, "Reveal: ")).toBe(item.reveal);
        const fragment = LEDGER.find((entry) => entry.caseId === item.id);
        expect(lineValue(section, `Ledger fragment "${item.ledgerTitle}": `)).toBe(fragment?.text);
      });
    });
  }
});

describe("plan: ledger, achievements, themes, cards, tutorial, headlines", () => {
  it("ledger fragments match", () => {
    const rows = tableUnder("## Ledger fragments (lore titles)");
    expect(rows).toHaveLength(LEDGER.length);
    rows.forEach((row, index) => {
      expect(LEDGER[index]?.id).toBe(Number(cell(row, 0)));
      expect(LEDGER[index]?.title).toBe(cell(row, 1));
      expect(`case ${LEDGER[index]?.caseId}`).toBe(cell(row, 2));
      expect(LEDGER[index]?.text).toBe(cell(row, 3));
    });
  });

  it("achievements match ids, titles and conditions", () => {
    const rows = tableUnder("## Achievements (12, no postage reward)");
    expect(rows).toHaveLength(ACHIEVEMENTS.length);
    rows.forEach((row, index) => {
      expect(ACHIEVEMENTS[index]?.id).toBe(cell(row, 0));
      expect(ACHIEVEMENTS[index]?.title).toBe(cell(row, 1));
      expect(ACHIEVEMENTS[index]?.condition).toBe(cell(row, 2));
    });
  });

  it("themes match", () => {
    const rows = tableUnder("## Desk themes (5, cosmetic, unlocked by total stamps)");
    expect(rows).toHaveLength(THEMES.length);
    rows.forEach((row, index) => {
      const theme = THEMES[index];
      expect(index + 1).toBe(Number(cell(row, 0)));
      expect(theme?.id).toBe(cell(row, 1));
      expect(theme?.name).toBe(cell(row, 2));
      expect(theme?.stampsNeeded).toBe(Number(cell(row, 3)));
      expect(theme?.desk).toBe(cell(row, 4));
      expect(theme?.ink).toBe(cell(row, 5));
    });
  });

  it("mechanic cards match", () => {
    const rows = tableUnder("## Mechanic cards (4)");
    expect(rows).toHaveLength(CARDS.length);
    rows.forEach((row, index) => {
      const card = CARDS[index];
      expect(card?.id).toBe(cell(row, 1));
      expect(card?.title).toBe(cell(row, 2));
      expect(card?.caseId).toBe(cell(row, 3));
      expect(card?.text).toBe(cell(row, 4));
    });
  });

  it("tutorial steps match", () => {
    const rows = tableUnder("## Tutorial (case 01, 6 steps, each advanced by the real action)");
    expect(rows).toHaveLength(TUTORIAL.length);
    rows.forEach((row, index) => {
      expect(TUTORIAL[index]?.step).toBe(Number(cell(row, 0)));
      expect(TUTORIAL[index]?.prompt).toBe(cell(row, 1));
      expect(TUTORIAL[index]?.advancesWhen).toBe(cell(row, 2));
    });
  });

  it("result headlines match", () => {
    const rows = tableUnder("## Result headlines");
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      const stamps = Number(cell(row, 0)) as 1 | 2 | 3;
      expect(HEADLINES[stamps]).toBe(cell(row, 1));
    }
  });
});
