import { describe, expect, it } from "vitest";
import {
  BOOK_TEXT,
  DAY_CARDS,
  DECOR_TEXT,
  DIARY,
  DRINK_TEXT,
  defaultBundle,
  FINALE,
  MOOD_TEXT,
  OPENING_NOTE,
  OUTCOME_WORDS,
  PASTRY_TEXT,
  SCENES,
  SECTION_LABELS,
  TAGLINE,
  TUTORIAL_STEPS,
  WEATHER_NAMES,
  words,
} from "../src";
import { allowedCharacter, collectTexts } from "../src/content/validateText";

function extraTexts(): string[] {
  return [
    TAGLINE,
    ...OPENING_NOTE,
    ...Object.values(DRINK_TEXT),
    ...Object.values(PASTRY_TEXT),
    ...Object.values(BOOK_TEXT).flatMap((b) => [b.author, b.blurb]),
    ...Object.values(DECOR_TEXT),
    ...MOOD_TEXT.flatMap((m) => [m.name, m.text]),
    ...TUTORIAL_STEPS.flatMap((s) => [s.title, s.text, s.action]),
    ...Object.values(OUTCOME_WORDS),
    ...Object.values(WEATHER_NAMES),
    ...Object.values(SECTION_LABELS),
  ];
}

function everyText(): { where: string; text: string }[] {
  return [
    ...collectTexts(defaultBundle()),
    ...extraTexts().map((text, i) => ({ where: `extra ${i}`, text })),
  ];
}

describe("text hygiene", () => {
  it("covers a large amount of text", () => {
    expect(everyText().length).toBeGreaterThan(450);
  });

  it("has no empty or blank string", () => {
    for (const ref of everyText()) expect(ref.text.trim().length, ref.where).toBeGreaterThan(0);
  });

  it("has no placeholder tokens", () => {
    for (const ref of everyText()) {
      expect(ref.text, ref.where).not.toMatch(/\b(TODO|TBD|FIXME|XXX|lorem|ipsum|placeholder)\b/i);
      expect(ref.text, ref.where).not.toMatch(/[{}[\]<>]/);
    }
  });

  it("keeps every character inside Latin-1 plus the font subset punctuation", () => {
    for (const ref of everyText()) {
      for (const char of ref.text) {
        expect(allowedCharacter(char.codePointAt(0) ?? 0), `${ref.where}: ${char}`).toBe(true);
      }
    }
  });

  it("has no emoji or pictographs", () => {
    for (const ref of everyText()) {
      expect(ref.text, ref.where).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("has no stray spaces", () => {
    for (const ref of everyText()) {
      expect(ref.text, ref.where).not.toMatch(/ {2}|^ | $|\t|\n/);
    }
  });

  it("ends every scene beat with sentence punctuation", () => {
    for (const scene of SCENES) {
      const beats = [
        ...scene.beats,
        ...(scene.choice
          ? [...scene.choice.options.a.reaction, ...scene.choice.options.b.reaction]
          : []),
        ...(scene.endings ? [...scene.endings.a.beats, ...scene.endings.b.beats] : []),
      ];
      for (const beat of beats) {
        expect(beat.text, `${scene.id}: ${beat.text}`).toMatch(/[.!?…]['"’”]?$/);
      }
    }
  });

  it("has no duplicate scene titles, day titles or ending titles", () => {
    const sceneTitles = SCENES.map((s) => s.title);
    expect(new Set(sceneTitles).size).toBe(sceneTitles.length);
    const endings = SCENES.flatMap((s) =>
      s.endings ? [s.endings.a.title, s.endings.b.title] : [],
    );
    expect(new Set(endings).size).toBe(16);
    expect(new Set(DIARY.map((d) => d.title)).size).toBe(14);
  });

  it("has no real brands, violence, or romance words", () => {
    const banned = [
      "google",
      "apple",
      "starbucks",
      "amazon",
      "facebook",
      "instagram",
      "nokia",
      "coca",
      "kill",
      "murder",
      "blood",
      "gun",
      "knife",
      "weapon",
      "stab",
      "shoot",
      "corpse",
      "kiss",
      "darling",
      "romance",
      "boyfriend",
      "girlfriend",
      "sweetheart",
      "wedding",
    ];
    for (const ref of everyText()) {
      const bag = words(ref.text).map((w) => w.toLowerCase());
      for (const word of banned) expect(bag, `${ref.where}: ${word}`).not.toContain(word);
    }
  });

  it("keeps apostrophes and quotes inside the font subset", () => {
    const odd = /[‐-‒―′″´`]/;
    for (const ref of everyText()) expect(ref.text, ref.where).not.toMatch(odd);
  });

  it("finale and diary stay within their limits", () => {
    expect(FINALE.lines).toHaveLength(24);
    for (const line of FINALE.lines) expect(words(line.text).length).toBeLessThanOrEqual(20);
    expect(words(FINALE.caption).length).toBeLessThanOrEqual(30);
    for (const entry of DIARY) expect(words(entry.text).length).toBeLessThanOrEqual(40);
    for (const card of DAY_CARDS) expect(words(card.text).length).toBeLessThanOrEqual(30);
  });

  it("item flavour lines are at most 12 words", () => {
    const lines = [
      ...Object.values(DRINK_TEXT),
      ...Object.values(PASTRY_TEXT),
      ...Object.values(BOOK_TEXT).map((b) => b.blurb),
    ];
    expect(lines).toHaveLength(16);
    for (const line of lines) expect(words(line).length, line).toBeLessThanOrEqual(12);
  });
});
