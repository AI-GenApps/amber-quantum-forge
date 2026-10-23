import { findPerson } from "../logic";
import type { CaseDef, FacetId, Person } from "../types";
import { ALMANAC, almanacFor } from "./almanac";
import type { AlmanacEntry } from "./types";

const TRADE_WORDS = [
  "ferry",
  "baker",
  "bakery",
  "barber",
  "barbershop",
  "clippers",
  "projectionist",
  "projector",
  "librarian",
  "library",
  "mechanic",
  "spanner",
  "teacher",
  "classroom",
  "florist",
  "signaller",
  "signalman",
  "tailor",
  "tailoring",
  "ironmonger",
  "hardware",
  "piano tuner",
  "tuner",
];

const PLACEHOLDERS = /\b(?:todo|tbd|lorem|ipsum|placeholder|xxx|fixme)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;
const SENTENCE_BREAK = /[.!?]["')]*\s+["'A-Z]/;
const SENTENCE_END = /[.!?]["')]*$/;

const regexCache = new Map<string, RegExp>();

export function normalise(text: string): string {
  return text.toLowerCase().replace(/[-–—]/g, " ");
}

export function containsPhrase(text: string, phrase: string): boolean {
  const key = normalise(phrase);
  let pattern = regexCache.get(key);
  if (pattern === undefined) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = new RegExp(`\\b${escaped}\\b`);
    regexCache.set(key, pattern);
  }
  return pattern.test(normalise(text));
}

export function tradeWordsIn(text: string): string[] {
  const lower = normalise(text);
  return TRADE_WORDS.filter((word) => new RegExp(`\\b${word}(?:s|es)?\\b`).test(lower));
}

export function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

export function hasBadCharset(text: string): boolean {
  return !PRINTABLE_ASCII.test(text) || EMOJI.test(text);
}

export function hasPlaceholder(text: string): boolean {
  return PLACEHOLDERS.test(text);
}

export function isOneSentence(text: string): boolean {
  return SENTENCE_END.test(text.trim()) && !SENTENCE_BREAK.test(text.trim());
}

export function termsOf(entry: AlmanacEntry): string[] {
  const own = entry.value === "none" ? [] : [entry.value];
  return [...own, ...entry.keywords, ...entry.avoid];
}

export function separatingTerms(def: CaseDef, people: readonly Person[]): string[] {
  const terms: string[] = [];
  const facets: FacetId[] = ["street", "pastime", "look", "pet"];
  const members = def.candidateIds
    .map((id) => findPerson(people, id))
    .filter((person): person is Person => person !== undefined);
  for (const facet of facets) {
    const values = new Set(members.map((person) => person.facets[facet]));
    for (const value of values) {
      const holders = members.filter((person) => person.facets[facet] === value).length;
      if (holders === members.length) continue;
      const entry = almanacFor(facet, value);
      if (entry !== undefined) terms.push(...termsOf(entry));
    }
  }
  return terms;
}

export function firstHit(text: string, terms: readonly string[]): string | undefined {
  return terms.find((term) => containsPhrase(text, term));
}

export function allTermsOfDeductionValues(def: CaseDef): string[] {
  return def.deductions.flatMap((item) => {
    const entry = ALMANAC.find((row) => row.facet === item.facet && row.value === item.value);
    return entry === undefined ? [] : termsOf(entry);
  });
}
