import { describe, expect, it } from "vitest";
import { BUNDLE, cloneBundle } from "./bundle";
import { readDoc, tableRows } from "./docs";
import { loreProblems, type PlanLoreRow } from "./validators";

function planRows(): PlanLoreRow[] {
  return tableRows(readDoc("content-plan.md"))
    .filter((cells) => /^lore-\d\d$/.test(cells[1] ?? ""))
    .map((cells) => ({ id: cells[1] ?? "", title: cells[2] ?? "", trigger: cells[3] ?? "" }));
}

describe("lore", () => {
  it("parses 30 rows from content-plan.md", () => {
    expect(planRows()).toHaveLength(30);
  });

  it("passes every validator", () => {
    expect(loreProblems(BUNDLE, planRows())).toEqual([]);
  });

  it("has six chapters of five entries in order", () => {
    BUNDLE.chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const ids = BUNDLE.lore.filter((e) => e.chapter === chapter.number).map((e) => e.id);
      expect(ids).toHaveLength(5);
    });
  });

  it("gives every trigger kind the contracted count", () => {
    const count = (kind: string) => BUNDLE.lore.filter((e) => e.trigger.kind === kind).length;
    expect(count("instrument")).toBe(8);
    expect(count("constellation")).toBe(12);
    expect(count("boon")).toBe(10);
  });

  it("fails on an unresolved trigger, bad length, banned tokens and duplicates", () => {
    const plan = planRows();
    const mutations: ((b: ReturnType<typeof cloneBundle>) => void)[] = [
      (b) => {
        (b.lore[0] as { trigger: unknown }).trigger = { kind: "boon", id: "ghost" };
      },
      (b) => {
        (b.lore[1] as { body: string }).body = "Too short.";
      },
      (b) => {
        (b.lore[2] as { body: string }).body = `${b.lore[2]?.body ?? ""} A window opens.`;
      },
      (b) => {
        (b.lore[3] as { body: string }).body = b.lore[4]?.body ?? "";
      },
      (b) => {
        (b.lore[5] as { title: string }).title = "Renamed";
      },
      (b) => {
        (b.lore[6] as { trigger: unknown }).trigger = b.lore[7]?.trigger;
      },
    ];
    for (const mutate of mutations) {
      const copy = cloneBundle();
      mutate(copy);
      expect(loreProblems(copy, plan).length).toBeGreaterThan(0);
    }
  });
});
