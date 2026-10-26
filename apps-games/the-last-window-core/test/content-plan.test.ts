import { describe, expect, it } from "vitest";
import {
  ART_SLOTS,
  BOOK_TEXT,
  BOOKS,
  DAYS,
  DECOR,
  DRINK_TEXT,
  DRINKS,
  ENDING_TITLES,
  FINALE_DAY,
  PASTRIES,
  PASTRY_TEXT,
  REGULARS,
  SCENES,
  SHIFT_TICKS,
} from "../src";
import { clean, list, readDoc, tableAfter } from "./helpers/doc";

const PLAN = readDoc("content-plan.md");
const ECONOMY = readDoc("economy.md");
const ASSETS = readDoc("assets-index.md");

function idForName(name: string): string {
  const all = [
    ...DRINKS.map((d) => [d.name, d.id]),
    ...PASTRIES.map((p) => [p.name, p.id]),
    ...BOOKS.map((b) => [b.title, b.id]),
  ];
  const found = all.find((entry) => entry[0] === name);
  if (found === undefined) throw new Error(`no item named ${name}`);
  return found[1] as string;
}

function unlockIds(cell: string): string[] {
  if (cell.startsWith("none") || cell.startsWith("nothing")) return [];
  return list(cell)
    .map((part) => (part.startsWith("decor-") ? part : idForName(part)))
    .sort();
}

function dueIds(cell: string): number[] {
  if (cell.includes("to 8")) return [1, 2, 3, 4, 5, 6, 7, 8];
  return list(cell).map(Number);
}

describe("content-plan.md campaign days", () => {
  const rows = tableAfter(PLAN, "## Campaign days");

  it("has 14 rows", () => {
    expect(rows).toHaveLength(14);
  });

  it("equals the day data row by row", () => {
    rows.forEach((row, index) => {
      const day = DAYS[index];
      expect(day).toBeDefined();
      if (day === undefined) return;
      expect(Number(row[0])).toBe(day.day);
      expect(row[1]).toBe(day.title);
      expect(row[2]).toBe(day.weather);
      expect(Number.parseInt(row[3] as string, 10) * 10).toBe(day.shiftTicks);
      expect(Number(row[4])).toBe(day.customers);
      expect(Number.parseInt(row[5] as string, 10)).toBe(day.patienceSeconds);
      expect(dueIds(row[6] as string)).toEqual([...day.regularsDue]);
      const unlocks = [
        ...day.unlocks.drinks,
        ...day.unlocks.pastries,
        ...day.unlocks.books,
        ...day.unlocks.decor,
      ];
      expect(unlockIds(row[7] as string)).toEqual(unlocks.sort());
    });
  });

  it("uses the three shift lengths from the constants", () => {
    const ticks = new Set(DAYS.map((day) => day.shiftTicks));
    expect([...ticks].sort()).toEqual(Object.values(SHIFT_TICKS).sort());
  });
});

describe("content-plan.md visit calendar", () => {
  const rows = tableAfter(PLAN, "## Regular visit calendar");

  it("equals the regular data", () => {
    expect(rows).toHaveLength(8);
    rows.forEach((row, index) => {
      const regular = REGULARS[index];
      expect(`${regular?.id} ${regular?.name}`).toBe(row[0]);
      expect(row.slice(1, 6).map(Number)).toEqual([...(regular?.visitDays ?? [])]);
      expect(row[6]).toBe("yes");
    });
  });

  it("matches the per-day regulars in the days table", () => {
    for (const regular of REGULARS) {
      const due = DAYS.filter((d) => d.day < FINALE_DAY && d.regularsDue.includes(regular.id));
      expect(due.map((d) => d.day)).toEqual([...regular.visitDays]);
    }
  });
});

describe("content-plan.md decor, items and endings", () => {
  it("decor table equals the rules and the decor text numbers", () => {
    const rows = tableAfter(PLAN, "## Decor");
    expect(rows).toHaveLength(DECOR.length);
    rows.forEach((row, index) => {
      const rule = DECOR[index];
      if (rule === undefined) throw new Error("missing decor");
      expect(clean(row[0] as string)).toBe(rule.id);
      expect(row[1]).toBe(rule.name);
      expect(Number(row[2])).toBe(rule.price);
      expect(row[3]).toBe(`Day ${rule.unlockDay}`);
      const e = rule.effect;
      const text: Record<string, string> = {
        patience: `+${"seconds" in e ? e.seconds : 0} s patience`,
        bookPrice: `+${"coins" in e ? e.coins : 0} coins per book`,
        drinkPrice: `+${"coins" in e ? e.coins : 0} coin per drink`,
        pastrySlot: "+1 pastry kind",
        bookSlot: "+1 book slot",
        fpOnDelighted: `+${"points" in e ? e.points : 0} FP on delighted`,
        rainPatience: `+${"seconds" in e ? e.seconds : 0} s patience in rain`,
        tipPoints: `+${"points" in e ? e.points : 0} tip points`,
      };
      expect(row[4]).toBe(text[e.kind]);
    });
  });

  it("drink, pastry and book flavour lines equal the plan", () => {
    const strip = (text: string) => text.replace(/\.$/, "");
    tableAfter(PLAN, "## Drinks").forEach((row) => {
      const id = clean(row[0] as string) as keyof typeof DRINK_TEXT;
      expect(strip(DRINK_TEXT[id])).toBe(row[2]);
    });
    tableAfter(PLAN, "## Pastries").forEach((row) => {
      const id = clean(row[0] as string) as keyof typeof PASTRY_TEXT;
      expect(strip(PASTRY_TEXT[id])).toBe(row[2]);
    });
    tableAfter(PLAN, "## Books and moods").forEach((row) => {
      const id = clean(row[0] as string) as keyof typeof BOOK_TEXT;
      expect(BOOK_TEXT[id].author).toBe(row[2]);
      expect(strip(BOOK_TEXT[id].blurb)).toBe(row[4]);
    });
  });

  it("the sixteen ending titles equal the plan", () => {
    const line = PLAN.replace(/\n\s*/g, " ").match(/Ending titles \(16\): (.*?)\.(?= [A-Z])/);
    expect(line).not.toBeNull();
    const entries = (line?.[1] ?? "").split(/,\s+(?=\d[AB] )/);
    expect(entries).toHaveLength(16);
    for (const entry of entries) {
      const match = entry.match(/^(\d)([AB]) (.+)$/);
      const id = Number(match?.[1]);
      const lean = (match?.[2] ?? "").toLowerCase() as "a" | "b";
      expect(ENDING_TITLES[id]?.[lean]).toBe(match?.[3]);
    }
  });

  it("the story titles equal the plan", () => {
    const line = PLAN.replace(/\n\s*/g, " ").match(/Stories tab\): (.*?)\.\s+Ending titles/);
    const entries = (line?.[1] ?? "").split(/,\s+(?=\d )/);
    expect(entries).toHaveLength(8);
    for (const entry of entries) {
      const match = entry.match(/^(\d) (.+)$/);
      expect(REGULARS.find((r) => r.id === Number(match?.[1]))?.storyTitle).toBe(match?.[2]);
    }
  });
});

describe("content-plan.md regular sections", () => {
  const sections = PLAN.split(/\n(?=### \d\. )/)
    .slice(1)
    .map((text) => text.split(/\n## /)[0] as string)
    .map((text) => text.replace(/\s+/g, " "));

  it("has eight regulars", () => {
    expect(sections).toHaveLength(8);
  });

  it("names, likes, visit days, scene titles, choices and endings equal the data", () => {
    sections.forEach((text, index) => {
      const regular = REGULARS[index];
      if (regular === undefined) throw new Error("missing regular");
      const heading = text.match(/^### (\d)\. (?:Dr\. )?(.+?) \(`customer-\d`\) - "(.+?)"/);
      expect(Number(heading?.[1])).toBe(regular.id);
      expect(heading?.[2]).toBe(regular.name);
      expect(heading?.[3]).toBe(regular.storyTitle);
      const likes = text.match(
        /Likes: (.+?), (.+?); moods (\w+), (\w+)\. Visits: Days ([\d, ]+)\./,
      );
      expect(idForName(likes?.[1] as string)).toBe(regular.likes.drink);
      expect(idForName(likes?.[2] as string)).toBe(regular.likes.pastry);
      expect([likes?.[3], likes?.[4]]).toEqual([...regular.likes.moods]);
      expect((likes?.[5] ?? "").split(", ").map(Number)).toEqual([...regular.visitDays]);
      const titles = [...text.matchAll(/\((\d)\) "([^"]+)"/g)].map((m) => [Number(m[1]), m[2]]);
      const mine = SCENES.filter((s) => s.regular === regular.id).map((s) => [s.index, s.title]);
      expect(titles).toEqual(mine);
      const choices = [
        ...text.matchAll(/Choice c(\d) \(scene (\d)\), "([^"]+)": a "([^"]+)"; b "([^"]+)"/g),
      ];
      const owned = SCENES.filter((s) => s.regular === regular.id && s.choice !== undefined);
      expect(choices).toHaveLength(owned.length);
      choices.forEach((m, i) => {
        const scene = owned[i];
        expect(Number(m[2])).toBe(scene?.index);
        expect(scene?.choice?.id).toBe(`r${regular.id}-c${m[1]}`);
        expect(scene?.choice?.prompt).toBe(m[3]);
        expect(scene?.choice?.options.a.label).toBe(m[4]);
        expect(scene?.choice?.options.b.label).toBe(m[5]);
      });
      const endings = text.match(/Endings: A "([^"]+)".*? B "([^"]+)"/);
      expect(endings?.[1]).toBe(regular.endingTitles.a);
      expect(endings?.[2]).toBe(regular.endingTitles.b);
    });
  });
});

describe("economy.md unlock schedule", () => {
  it("equals the day unlocks", () => {
    const rows = tableAfter(ECONOMY, "## Unlock schedule");
    expect(rows).toHaveLength(12);
    rows.forEach((row) => {
      const label = row[0] as string;
      const first = Number.parseInt(label, 10);
      const last = label.includes("to")
        ? Number.parseInt(label.split("to")[1] as string, 10)
        : first;
      const expected = unlockIds(row[1] as string);
      for (let day = first; day <= last; day++) {
        const entry = DAYS[day - 1];
        const mine = [
          ...(entry?.unlocks.drinks ?? []),
          ...(entry?.unlocks.pastries ?? []),
          ...(entry?.unlocks.books ?? []),
        ];
        expect(mine.sort()).toEqual(expected);
      }
    });
  });
});

describe("assets-index.md art slots", () => {
  const rows = tableAfter(ASSETS, "## Art slots (54)").filter((row) =>
    /^B\d$/.test(row[0] as string),
  );

  it("lists 54 slots equal to the art slot data", () => {
    expect(rows).toHaveLength(54);
    expect(ART_SLOTS).toHaveLength(54);
    rows.forEach((row, index) => {
      const slot = ART_SLOTS[index];
      expect(clean(row[1] as string)).toBe(slot?.id);
      expect(row[0]).toBe(slot?.batch);
      const size = (cell: string) => {
        const m = cell.match(/^(\d+) x (\d+)/);
        return m === null ? null : { width: Number(m[1]), height: Number(m[2]) };
      };
      expect(size(row[3] as string)).toEqual(slot?.master);
      expect(size(row[4] as string)).toEqual(slot?.runtime);
    });
  });
});
