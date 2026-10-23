const WORD = /[A-Za-z0-9]+(?:['’][A-Za-z]+)*/g;
const ABBREVIATIONS = ["Dr.", "Mr.", "Mrs.", "Ms.", "St."];

export function words(text: string): string[] {
  return text.match(WORD) ?? [];
}

export function countSyllables(word: string): number {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length === 0) return 0;
  if (letters.length <= 3) return 1;
  let stem = letters;
  let extra = 0;
  if (/[^aeiouy]le$/.test(stem)) {
    stem = stem.slice(0, -1);
    extra = 1;
  } else {
    stem = stem.replace(/(?:[^aeiouysxzcg]es|[^aeioutdy]ed|[^aeiouy]e)$/, "");
  }
  stem = stem.replace(/^y/, "");
  const runs = stem.match(/[aeiouy]+/g) ?? [];
  let count = runs.length + extra;
  if (/[^ts]io(?!u)|ia|eo|iu|[^q]ua(?![y])|uo|[aeiou]ing$/.test(stem)) count += 1;
  return Math.max(1, count);
}

export function sentences(text: string): string[] {
  let guarded = text;
  for (const abbreviation of ABBREVIATIONS) {
    guarded = guarded.split(abbreviation).join(abbreviation.slice(0, -1));
  }
  return guarded
    .split(/(?<=[.!?…])["”')]*\s+/)
    .map((part) => part.trim())
    .filter((part) => words(part).length > 0);
}

export function fleschKincaidGrade(text: string): number {
  const list = words(text);
  const count = sentences(text).length;
  if (list.length === 0 || count === 0) return 0;
  const syllables = list.reduce((sum, word) => sum + countSyllables(word), 0);
  return 0.39 * (list.length / count) + 11.8 * (syllables / list.length) - 15.59;
}
