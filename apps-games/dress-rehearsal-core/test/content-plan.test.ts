import { describe, expect, it } from "vitest";
import {
  AFFINITY_THRESHOLDS,
  CHALLENGES,
  CHAPTERS,
  CLIENTS,
  FRAMES,
  HOW_TO_PAGES,
  PIECES,
  RESULT_HEADLINES,
  RULE_CARDS,
  ruleCode,
  STAR_NAMES,
  TAGLINE,
  TOTAL_PIECES,
  TOTAL_STARS,
  TRAY_TAB_LABELS,
  TUTORIAL_STEPS,
} from "../src/index";
import { PLAN_LINES, sectionLines, table, tableAfter, toNumber, unquote } from "./helpers/plan";

const PIECE_HEADINGS = [
  "### Riviera Summer (accent sky)",
  "### Rainy City (accent ochre)",
  "### Gala Night (accent red)",
  "### Mountain Weekend (accent green)",
  "### Studio Avant-garde (accent violet)",
  "### Vintage 70s (accent rust)",
];

const CHALLENGE_HEADINGS = PLAN_LINES.filter((line) => /^### Chapter \d - /.test(line));

describe("content-plan.md equals the data", () => {
  it("lists every closet piece", () => {
    const rows = PIECE_HEADINGS.flatMap((heading) => table(heading, "Slot id"));
    expect(rows).toHaveLength(48);
    expect(PIECES).toHaveLength(48);
    expect(TOTAL_PIECES).toBe(48);
    rows.forEach((row, at) => {
      const piece = PIECES[at];
      expect(unquote(row[0] ?? "")).toBe(piece?.id);
      expect(row[1]).toBe(piece?.name);
      expect(row[2]).toBe(piece?.category);
      expect(row[3]).toBe(piece?.colour);
      expect(row[4]).toBe(piece?.era);
      expect(toNumber(row[5] ?? "")).toBe(piece?.formality);
      expect(toNumber(row[6] ?? "")).toBe(piece?.warmth);
      expect(toNumber(row[7] ?? "")).toBe(piece?.price);
      const features = row[8] === "-" ? [] : (row[8] ?? "").split(",").map((f) => f.trim());
      expect(features).toEqual(piece?.features);
    });
  });

  it("lists the six chapters", () => {
    const rows = table("## Chapters", "#");
    expect(rows).toHaveLength(6);
    rows.forEach((row, at) => {
      const chapter = CHAPTERS[at];
      expect(unquote(row[1] ?? "")).toBe(chapter?.themeId);
      expect(row[2]).toBe(chapter?.title);
      expect(row[3]).toBe(chapter?.chapterTitle);
      expect(/#[0-9a-f]{6}/i.exec(row[4] ?? "")?.[0]).toBe(chapter?.accent);
      expect(toNumber(row[5] ?? "")).toBe(chapter?.unlockStars);
      const count = CHALLENGES.filter((def) => def.chapterIndex === at).length;
      expect(row[6]).toContain(`(${count})`);
    });
  });

  it("lists the chapter intro and outro texts", () => {
    const rows = table("## Chapters", "Theme id");
    expect(rows).toHaveLength(6);
    rows.forEach((row, at) => {
      expect(unquote(row[0] ?? "")).toBe(CHAPTERS[at]?.themeId);
      expect(row[1]).toBe(CHAPTERS[at]?.intro);
      expect(row[2]).toBe(CHAPTERS[at]?.outro);
    });
  });

  it("lists the six clients and their lines", () => {
    const rows = table("## Clients (customers)", "#");
    expect(rows).toHaveLength(6);
    rows.forEach((row, at) => {
      const client = CLIENTS[at];
      expect(unquote(row[1] ?? "")).toBe(client?.id);
      expect(row[2]).toBe(client?.name);
      expect(row[3]).toBe(client?.role);
      expect(toNumber(row[4] ?? "")).toBe(
        CHALLENGES.filter((d) => d.clientId === client?.id).length,
      );
      expect(row[5]).toBe(client?.bio);
    });
    const lines = table("## Clients (customers)", "Client");
    expect(lines).toHaveLength(6);
    lines.forEach((row, at) => {
      const client = CLIENTS[at];
      expect(row[0]).toBe(client?.name);
      expect(row.slice(1)).toEqual([
        client?.lines.intro,
        client?.lines.stars3,
        client?.lines.stars2,
        client?.lines.stars1,
        client?.lines.stars0,
        client?.lines.level1,
        client?.lines.level2,
        client?.lines.level3,
      ]);
    });
    expect([...AFFINITY_THRESHOLDS]).toEqual([3, 9, 15]);
  });

  it("lists the 40 challenges", () => {
    expect(CHALLENGE_HEADINGS).toHaveLength(6);
    const rows = CHALLENGE_HEADINGS.flatMap((heading) => table(heading, "Id"));
    expect(rows).toHaveLength(40);
    rows.forEach((row, at) => {
      const def = CHALLENGES[at];
      const client = CLIENTS.find((candidate) => candidate.id === def?.clientId);
      expect(unquote(row[0] ?? "")).toBe(def?.id);
      expect(row[1]).toBe(def?.name);
      expect(row[2]).toBe(client?.name);
      expect(row[3]).toBe(def?.slotSet);
      expect(row[4]).toBe(def?.rules.map(ruleCode).join("; "));
      expect(row[5]).toBe(def?.brief);
    });
  });

  it("lists the nine rule cards and the rule kinds each introduces", () => {
    const rows = table("## Rule cards (first-time sheets)", "#");
    expect(rows).toHaveLength(9);
    expect(RULE_CARDS).toHaveLength(9);
    rows.forEach((row, at) => {
      const card = RULE_CARDS[at];
      expect(row[1]).toBe(card?.title);
      expect(unquote(row[2] ?? "")).toBe(card?.shownOn);
      expect(row[3]).toBe(card?.text);
    });
    const kinds = table("## Rule cards (first-time sheets)", "Card");
    expect(kinds).toHaveLength(9);
    for (const row of kinds) {
      const card = RULE_CARDS.find((candidate) => candidate.title === row[0]);
      expect(card, row[0]).toBeDefined();
      const listed = (row[1] ?? "").includes("none")
        ? []
        : (row[1] ?? "").split(",").map((kind) => unquote(kind.trim()));
      expect([...(card?.kinds ?? [])]).toEqual(listed);
    }
  });

  it("lists the five tutorial steps", () => {
    const lines = sectionLines(
      "## Tutorial plan (riv-01, steps shown by the onboarding task)",
    ).filter((line) => /^\d\. /.test(line));
    expect(lines).toHaveLength(5);
    expect(TUTORIAL_STEPS).toHaveLength(5);
    lines.forEach((line, at) => {
      const match = /^(\d)\. "([^"]+)" (.+)$/.exec(line);
      expect(match, line).not.toBeNull();
      expect(Number(match?.[1])).toBe(TUTORIAL_STEPS[at]?.index);
      expect(match?.[2]).toBe(TUTORIAL_STEPS[at]?.title);
      expect(match?.[3]).toBe(TUTORIAL_STEPS[at]?.description);
    });
  });

  it("lists the strings", () => {
    const text = sectionLines("## Titles and strings that need writing (all English)").join("\n");
    expect(text).toContain(`Tagline: "${TAGLINE}"`);
    expect(text).toContain(Object.values(TRAY_TAB_LABELS).join(", "));
    for (const headline of RESULT_HEADLINES) expect(text).toContain(`"${headline.text}"`);
    expect(text).toContain(`Star names: ${STAR_NAMES.join(", ")}`);
    expect(text).toContain(HOW_TO_PAGES.map((page) => page.title).join("; "));
    expect(text).toContain(FRAMES.map((frame) => frame.name).join(", "));
  });

  it("matches the binding totals", () => {
    expect(CHALLENGES).toHaveLength(40);
    expect(CHAPTERS).toHaveLength(6);
    expect(CLIENTS).toHaveLength(6);
    expect(TOTAL_STARS).toBe(120);
    expect(tableAfter(PLAN_LINES, "Set")).toHaveLength(7);
  });
});
