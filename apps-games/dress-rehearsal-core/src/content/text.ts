import { CHAPTERS } from "./chapters";
import { CHALLENGES } from "./challenges";
import { RULE_CARDS, TUTORIAL_STEPS } from "./cards";
import { CLIENTS } from "./clients";
import { PIECES } from "./pieces";
import {
  FRAMES,
  GAME_TITLE,
  HARMONY_PART_LABELS,
  HOW_TO_PAGES,
  RESULT_HEADLINES,
  SCHEME_NAMES,
  STAR_NAMES,
  TAGLINE,
  TRAY_TAB_LABELS,
} from "./strings";
import type { ContentSet } from "./types";

export const BRIEF_MAX_LENGTH = 90;
export const CLIENT_LINE_MAX_LENGTH = 80;

const PLACEHOLDER_PATTERN = /\b(lorem|ipsum|todo|tbd|placeholder|xxx)\b/i;

const SHIPPED_CONTENT: ContentSet = {
  pieces: PIECES,
  chapters: CHAPTERS,
  clients: CLIENTS,
  challenges: CHALLENGES,
  cards: RULE_CARDS,
};

export interface TextEntry {
  readonly label: string;
  readonly text: string;
}

export function isInFontSubset(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const basic = code >= 0x20 && code <= 0x7e;
    const latin1 = code >= 0xa0 && code <= 0xff;
    const punctuation =
      code === 0x2013 ||
      code === 0x2014 ||
      (code >= 0x2018 && code <= 0x201d) ||
      code === 0x2022 ||
      code === 0x2026;
    if (!basic && !latin1 && !punctuation) return false;
  }
  return true;
}

export function outsideFontSubset(text: string): string[] {
  const found = new Set<string>();
  for (const char of text) if (!isInFontSubset(char)) found.add(char);
  return [...found];
}

export function hasPlaceholderText(text: string): boolean {
  return text.trim() === "" || PLACEHOLDER_PATTERN.test(text);
}

export function collectContentText(set: ContentSet = SHIPPED_CONTENT): readonly TextEntry[] {
  const out: TextEntry[] = [
    { label: "game title", text: GAME_TITLE },
    { label: "tagline", text: TAGLINE },
  ];
  for (const [category, text] of Object.entries(TRAY_TAB_LABELS)) {
    out.push({ label: `tray tab ${category}`, text });
  }
  for (const headline of RESULT_HEADLINES) {
    out.push({ label: `headline ${headline.stars}`, text: headline.text });
  }
  for (const name of STAR_NAMES) out.push({ label: "star name", text: name });
  for (const name of HARMONY_PART_LABELS) out.push({ label: "harmony part", text: name });
  for (const name of SCHEME_NAMES) out.push({ label: "scheme name", text: name });
  for (const page of HOW_TO_PAGES) out.push({ label: `how-to ${page.id}`, text: page.title });
  for (const frame of FRAMES) out.push({ label: `frame ${frame.id}`, text: frame.name });
  for (const chapter of set.chapters) {
    const tag = `chapter ${chapter.themeId}`;
    out.push({ label: `${tag} title`, text: chapter.title });
    out.push({ label: `${tag} chapter title`, text: chapter.chapterTitle });
    out.push({ label: `${tag} intro`, text: chapter.intro });
    out.push({ label: `${tag} outro`, text: chapter.outro });
  }
  for (const client of set.clients) {
    out.push({ label: `client ${client.id} name`, text: client.name });
    out.push({ label: `client ${client.id} role`, text: client.role });
    out.push({ label: `client ${client.id} bio`, text: client.bio });
    for (const [key, text] of Object.entries(client.lines)) {
      out.push({ label: `client ${client.id} ${key}`, text });
    }
  }
  for (const piece of set.pieces) out.push({ label: `piece ${piece.id}`, text: piece.name });
  for (const def of set.challenges) {
    out.push({ label: `challenge ${def.id} name`, text: def.name });
    out.push({ label: `challenge ${def.id} brief`, text: def.brief });
  }
  for (const card of set.cards) {
    out.push({ label: `card ${card.id} title`, text: card.title });
    out.push({ label: `card ${card.id} text`, text: card.text });
  }
  for (const step of TUTORIAL_STEPS) {
    out.push({ label: `tutorial ${step.index} title`, text: step.title });
    out.push({ label: `tutorial ${step.index} description`, text: step.description });
  }
  return out;
}
