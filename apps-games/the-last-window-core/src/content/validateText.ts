import { issue, LIMITS } from "./issues";
import { words } from "./readability";
import type { ContentBundle, ContentIssue } from "./types";

export interface TextRef {
  where: string;
  text: string;
}

const PLACEHOLDER = /\b(TODO|TBD|FIXME|XXX|lorem|ipsum|placeholder)\b|\{[a-z]+\}/i;

export function allowedCharacter(code: number): boolean {
  if (code === 0x0a) return true;
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  if (code === 0x2013 || code === 0x2014 || code === 0x2022 || code === 0x2026) return true;
  return code >= 0x2018 && code <= 0x201d;
}

export function collectTexts(bundle: ContentBundle): TextRef[] {
  const out: TextRef[] = [];
  for (const day of bundle.days) out.push({ where: `day ${day.day} title`, text: day.title });
  for (const regular of bundle.regulars) {
    out.push({ where: `regular ${regular.id} name`, text: regular.name });
    out.push({ where: `regular ${regular.id} story`, text: regular.storyTitle });
    out.push({ where: `regular ${regular.id} ending a`, text: regular.endingTitles.a });
    out.push({ where: `regular ${regular.id} ending b`, text: regular.endingTitles.b });
  }
  for (const scene of bundle.scenes) {
    out.push({ where: `${scene.id} title`, text: scene.title });
    for (const [i, beat] of scene.beats.entries()) {
      out.push({ where: `${scene.id} beat ${i + 1}`, text: beat.text });
    }
    const choice = scene.choice;
    if (choice !== undefined) {
      out.push({ where: `${scene.id} prompt`, text: choice.prompt });
      for (const key of ["a", "b"] as const) {
        const option = choice.options[key];
        if (option === undefined) continue;
        out.push({ where: `${scene.id} option ${key} label`, text: option.label });
        for (const [i, beat] of option.reaction.entries()) {
          out.push({ where: `${scene.id} option ${key} reaction ${i + 1}`, text: beat.text });
        }
      }
    }
    if (scene.endings !== undefined) {
      for (const key of ["a", "b"] as const) {
        const block = scene.endings[key];
        if (block === undefined) continue;
        out.push({ where: `${scene.id} ending ${key} title`, text: block.title });
        for (const [i, beat] of block.beats.entries()) {
          out.push({ where: `${scene.id} ending ${key} beat ${i + 1}`, text: beat.text });
        }
      }
    }
  }
  for (const line of bundle.finale.lines) {
    out.push({ where: `finale ${line.regularId} ${line.variant}`, text: line.text });
  }
  out.push({ where: "finale caption", text: bundle.finale.caption });
  for (const entry of bundle.diary) out.push({ where: `diary ${entry.day}`, text: entry.text });
  for (const card of bundle.dayCards) out.push({ where: `day card ${card.day}`, text: card.text });
  return out;
}

export function validateCharacters(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const ref of collectTexts(bundle)) {
    if (ref.text.trim().length === 0) {
      issues.push(issue("BAD_CHARACTER", ref.where, "empty text"));
      continue;
    }
    if (PLACEHOLDER.test(ref.text)) {
      issues.push(issue("BAD_CHARACTER", ref.where, "placeholder text"));
    }
    for (const char of ref.text) {
      const code = char.codePointAt(0) ?? 0;
      if (!allowedCharacter(code)) {
        issues.push(
          issue("BAD_CHARACTER", ref.where, `character U+${code.toString(16).toUpperCase()}`),
        );
        break;
      }
    }
  }
  return issues;
}

function over(text: string, limit: number): boolean {
  return words(text).length > limit;
}

export function validateLengths(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const lines = bundle.finale.lines;
  if (lines.length !== LIMITS.finaleLines) {
    issues.push(
      issue("SCENE_COUNT", "finale", `expected ${LIMITS.finaleLines} lines, got ${lines.length}`),
    );
  }
  for (const regular of bundle.regulars) {
    for (const variant of ["a", "b", "unfinished"] as const) {
      const count = lines.filter((l) => l.regularId === regular.id && l.variant === variant).length;
      if (count !== 1) {
        issues.push(
          issue("BAD_ENDING", `finale ${regular.id}`, `variant ${variant} appears ${count} times`),
        );
      }
    }
  }
  for (const line of lines) {
    if (over(line.text, LIMITS.maxFinaleWords)) {
      issues.push(
        issue("BEAT_LENGTH", `finale ${line.regularId} ${line.variant}`, "over 20 words"),
      );
    }
  }
  if (over(bundle.finale.caption, LIMITS.maxCaptionWords)) {
    issues.push(issue("BEAT_LENGTH", "finale caption", "over 30 words"));
  }
  if (bundle.diary.length !== LIMITS.diaryEntries) {
    issues.push(
      issue("SCENE_COUNT", "diary", `expected ${LIMITS.diaryEntries}, got ${bundle.diary.length}`),
    );
  }
  for (const entry of bundle.diary) {
    const day = bundle.days.find((d) => d.day === entry.day);
    if (day === undefined || day.title !== entry.title) {
      issues.push(issue("DAY_TABLE", `diary ${entry.day}`, "title differs from the day table"));
    }
    if (over(entry.text, LIMITS.maxDiaryWords)) {
      issues.push(issue("BEAT_LENGTH", `diary ${entry.day}`, "over 40 words"));
    }
  }
  if (bundle.dayCards.length !== LIMITS.dayCards) {
    issues.push(
      issue(
        "SCENE_COUNT",
        "day cards",
        `expected ${LIMITS.dayCards}, got ${bundle.dayCards.length}`,
      ),
    );
  }
  for (const card of bundle.dayCards) {
    if (over(card.text, LIMITS.maxDayCardWords)) {
      issues.push(issue("BEAT_LENGTH", `day card ${card.day}`, "over 30 words"));
    }
    if (!cardMentions(bundle, card.day, card.text)) {
      issues.push(
        issue(
          "DAY_TABLE",
          `day card ${card.day}`,
          "mentions neither the weather nor a regular due",
        ),
      );
    }
  }
  return issues;
}

function cardMentions(bundle: ContentBundle, dayNumber: number, text: string): boolean {
  const day = bundle.days.find((d) => d.day === dayNumber);
  if (day === undefined) return false;
  const lower = text.toLowerCase();
  const weatherWord = day.weather === "rain" ? "rain" : day.weather;
  if (lower.includes(weatherWord)) return true;
  return day.regularsDue.some((id) => {
    const regular = bundle.regulars.find((r) => r.id === id);
    return regular !== undefined && text.includes(regular.name.split(" ")[0] as string);
  });
}
