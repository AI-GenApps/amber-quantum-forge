import {
  ALMANAC,
  type AlmanacEntry,
  type Clue,
  containsPhrase,
  termsOf,
} from "@web-games/lost-parcel-desk-core";
import { ALMANAC_OVERRIDES } from "../data/almanacOverrides";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "its",
  "his",
  "her",
  "not",
  "are",
  "was",
  "has",
  "had",
  "one",
  "two",
  "all",
  "any",
  "out",
  "off",
  "into",
  "over",
  "under",
  "then",
  "than",
  "but",
  "you",
  "your",
  "who",
  "how",
  "now",
  "per",
]);

function stem(word: string): string {
  return word.length > 5 ? word.replace(/(ing|ed|es|s)$/, "") : word.replace(/s$/, "");
}

function tokensOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !STOP.has(word))
    .map(stem);
}

const ENTRY_TOKENS = ALMANAC.map((entry) => new Set(termsOf(entry).flatMap(tokensOf)));
const DOCUMENT_FREQUENCY = new Map<string, number>();
for (const tokens of ENTRY_TOKENS) {
  for (const token of tokens)
    DOCUMENT_FREQUENCY.set(token, (DOCUMENT_FREQUENCY.get(token) ?? 0) + 1);
}

/** The Almanac entry a clue tag points to: whole-phrase vocabulary first, then the best word overlap. */
export function almanacEntryForTag(tag: string): AlmanacEntry | undefined {
  const phrases = ALMANAC.map((entry) => ({
    entry,
    hits: termsOf(entry)
      .filter((term) => containsPhrase(tag, term))
      .sort((a, b) => b.length - a.length),
  })).filter((item) => item.hits.length > 0);
  if (phrases.length > 0) {
    phrases.sort((a, b) => (b.hits[0]?.length ?? 0) - (a.hits[0]?.length ?? 0));
    return phrases[0]?.entry;
  }
  const words = tokensOf(tag);
  let best: AlmanacEntry | undefined;
  let bestScore = 0;
  ALMANAC.forEach((entry, index) => {
    const tokens = ENTRY_TOKENS[index];
    if (!tokens) return;
    const score = words.reduce(
      (sum, word) => sum + (tokens.has(word) ? 1 / (DOCUMENT_FREQUENCY.get(word) ?? 1) : 0),
      0,
    );
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  });
  return best;
}

export function almanacKey(entry: AlmanacEntry): string {
  return `${entry.facet}:${entry.value}`;
}

/** The entry to highlight for a clue: an authored pointer when one exists, else the best match for its tag. */
export function almanacEntryFor(clue: Pick<Clue, "id" | "tag">): AlmanacEntry | undefined {
  const key = ALMANAC_OVERRIDES[clue.id];
  if (key !== undefined) return ALMANAC.find((entry) => almanacKey(entry) === key);
  return almanacEntryForTag(clue.tag);
}
