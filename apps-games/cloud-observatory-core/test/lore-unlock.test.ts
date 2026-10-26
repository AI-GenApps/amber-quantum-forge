import { describe, expect, it } from "vitest";
import { CATALOG, loreForTrigger } from "../src/content/catalog";
import { LORE, LORE_CHAPTERS } from "../src/content/lore";
import {
  chapterProgress,
  isChapterStarted,
  newLoreSince,
  unlockedLore,
  withLoreUnlocked,
} from "../src/lore-unlock";
import { ALL_LORE_IDS, profileWith } from "./fixtures/profile";

function profileFor(trigger: (typeof LORE)[number]["trigger"]) {
  if (trigger.kind === "instrument") return profileWith({ game: { owned: { [trigger.id]: 1 } } });
  if (trigger.kind === "constellation") return profileWith({ game: { charted: [trigger.id] } });
  return profileWith({ game: { boons: [trigger.id] } });
}

describe("lore triggers", () => {
  it("has 30 entries across 8 instruments, 12 constellations and 10 boons", () => {
    const kinds = LORE.map((entry) => entry.trigger.kind);
    expect(kinds.filter((kind) => kind === "instrument")).toHaveLength(8);
    expect(kinds.filter((kind) => kind === "constellation")).toHaveLength(12);
    expect(kinds.filter((kind) => kind === "boon")).toHaveLength(10);
  });

  it.each(
    LORE.map((entry) => [entry.id, entry] as const),
  )("%s unlocks from its trigger", (_id, entry) => {
    const profile = profileFor(entry.trigger);
    expect(unlockedLore(profile, CATALOG).map((item) => item.id)).toEqual([entry.id]);
  });

  it("does not unlock from a missing trigger", () => {
    expect(unlockedLore(profileWith(), CATALOG)).toEqual([]);
    expect(unlockedLore(profileWith({ game: { owned: { telescope: 0 } } }), CATALOG)).toEqual([]);
  });

  it("reaches all 30 entries from the full set of triggers", () => {
    const profile = profileWith({
      game: {
        owned: Object.fromEntries(CATALOG.instruments.map((def) => [def.id, 1])),
        charted: CATALOG.constellations.map((def) => def.id),
        boons: CATALOG.boons.map((def) => def.id),
      },
    });
    expect(unlockedLore(profile, CATALOG).map((entry) => entry.id)).toEqual(ALL_LORE_IDS);
  });

  it("keeps entries after an Eclipse clears the instruments", () => {
    const owned = profileWith({ game: { owned: { telescope: 3 } } });
    const stored = withLoreUnlocked(owned, CATALOG);
    const afterEclipse = { ...stored, game: { ...stored.game, owned: {} } };
    expect(unlockedLore(afterEclipse, CATALOG).map((entry) => entry.id)).toEqual(["lore-01"]);
  });

  it("lists entries in catalog order whatever order they were triggered in", () => {
    const profile = profileWith({
      game: {
        charted: ["crown", "lyre"],
        boons: ["dark-adapted"],
        owned: { lens: 2, telescope: 1 },
      },
    });
    const ids = unlockedLore(profile, CATALOG).map((entry) => entry.id);
    expect(ids).toEqual(ALL_LORE_IDS.filter((id) => ids.includes(id)));
    expect(ids).toHaveLength(5);
  });
});

describe("newLoreSince", () => {
  it("reports exactly the entries added between two profiles", () => {
    const before = profileWith({ game: { owned: { telescope: 1 } } });
    const after = profileWith({ game: { owned: { telescope: 1, lens: 1 }, charted: ["lyre"] } });
    const lyre = loreForTrigger("constellation", "lyre");
    expect(newLoreSince(before, after, CATALOG).map((entry) => entry.id)).toEqual(
      ["lore-02", lyre?.id].sort(),
    );
  });

  it("is empty when nothing changed and never repeats known entries", () => {
    const profile = profileWith({ game: { owned: { telescope: 1 } } });
    expect(newLoreSince(profile, profile, CATALOG)).toEqual([]);
    expect(newLoreSince(profile, withLoreUnlocked(profile, CATALOG), CATALOG)).toEqual([]);
  });
});

describe("chapters", () => {
  it("counts unlocked entries per chapter", () => {
    const profile = profileWith({ game: { owned: { telescope: 1, lens: 1 } } });
    const progress = chapterProgress(profile, CATALOG);
    expect(progress).toHaveLength(LORE_CHAPTERS.length);
    expect(progress.map((item) => item.total).reduce((a, b) => a + b, 0)).toBe(30);
    expect(progress[0]?.unlocked).toBe(2);
    expect(progress[1]?.unlocked).toBe(0);
  });

  it("reports a chapter as started with its first unlocked entry", () => {
    const first = LORE.find((entry) => entry.chapter === 2);
    expect(first).toBeDefined();
    const empty = profileWith();
    expect(isChapterStarted(empty, 2, CATALOG)).toBe(false);
    const profile = profileFor((first as (typeof LORE)[number]).trigger);
    expect(isChapterStarted(profile, 2, CATALOG)).toBe(true);
    expect(isChapterStarted(profile, 6, CATALOG)).toBe(false);
  });
});
