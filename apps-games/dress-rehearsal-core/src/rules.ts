import {
  ALL_COLOURS,
  COOL_COLOURS,
  ERA_ORDER,
  FEATURES,
  FORMALITY_MAX,
  FORMALITY_MIN,
  HUE_WHEEL,
  RULE_FAMILY,
  RULE_KINDS,
  RULE_NUMBER_LIMIT,
  WARM_COLOURS,
} from "./constants";
import type { ChromaticColour, Colour, Era, Feature, MaxHues, Piece, Rule } from "./types";

export { RULE_FAMILY, RULE_KINDS };

export type RuleCodeErrorReason =
  | "UNKNOWN_KIND"
  | "MISSING_ARGUMENT"
  | "UNEXPECTED_ARGUMENT"
  | "BAD_ARGUMENT";

export class RuleCodeError extends Error {
  readonly reason: RuleCodeErrorReason;
  readonly code: string;

  constructor(reason: RuleCodeErrorReason, code: string) {
    super(`Bad rule code "${code}": ${reason}`);
    this.name = "RuleCodeError";
    this.reason = reason;
    this.code = code;
  }
}

export function eraIndex(era: Era): number {
  return ERA_ORDER.indexOf(era);
}

export function isChromatic(colour: Colour): colour is ChromaticColour {
  return (HUE_WHEEL as readonly Colour[]).includes(colour);
}

export function hueIndex(colour: ChromaticColour): number {
  return HUE_WHEEL.indexOf(colour);
}

export function chromaticColours(pieces: readonly Piece[]): ChromaticColour[] {
  const used = new Set<ChromaticColour>();
  for (const piece of pieces) {
    if (isChromatic(piece.colour)) used.add(piece.colour);
  }
  return HUE_WHEEL.filter((colour) => used.has(colour));
}

function sum(pieces: readonly Piece[], pick: (piece: Piece) => number): number {
  let total = 0;
  for (const piece of pieces) total += pick(piece);
  return total;
}

export function checkRule(rule: Rule, pieces: readonly Piece[]): boolean {
  switch (rule.kind) {
    case "palette-warm":
      return chromaticColours(pieces).every((colour) => WARM_COLOURS.includes(colour));
    case "palette-cool":
      return chromaticColours(pieces).every((colour) => COOL_COLOURS.includes(colour));
    case "max-hues":
      return chromaticColours(pieces).length <= rule.max;
    case "include-colour":
      return pieces.some((piece) => piece.colour === rule.colour);
    case "avoid-colour":
      return !pieces.some((piece) => piece.colour === rule.colour);
    case "era-min":
      return pieces.every((piece) => eraIndex(piece.era) >= eraIndex(rule.era));
    case "era-max":
      return pieces.every((piece) => eraIndex(piece.era) <= eraIndex(rule.era));
    case "formality-min":
      return pieces.every((piece) => piece.formality >= rule.value);
    case "formality-max":
      return pieces.every((piece) => piece.formality <= rule.value);
    case "warmth-min":
      return sum(pieces, (piece) => piece.warmth) >= rule.value;
    case "warmth-max":
      return sum(pieces, (piece) => piece.warmth) <= rule.value;
    case "needs-feature":
      return pieces.some((piece) => piece.features.includes(rule.feature));
    case "max-spend":
      return sum(pieces, (piece) => piece.price) <= rule.amount;
    case "min-spend":
      return sum(pieces, (piece) => piece.price) >= rule.amount;
    case "include-piece":
      return pieces.some((piece) => piece.id === rule.pieceId);
    case "avoid-piece":
      return !pieces.some((piece) => piece.id === rule.pieceId);
  }
}

const NUMBER_PATTERN = /^(0|[1-9]\d{0,5})$/;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function ruleCode(rule: Rule): string {
  switch (rule.kind) {
    case "palette-warm":
    case "palette-cool":
      return rule.kind;
    case "max-hues":
      return `${rule.kind}:${rule.max}`;
    case "include-colour":
    case "avoid-colour":
      return `${rule.kind}:${rule.colour}`;
    case "era-min":
    case "era-max":
      return `${rule.kind}:${rule.era}`;
    case "formality-min":
    case "formality-max":
    case "warmth-min":
    case "warmth-max":
      return `${rule.kind}:${rule.value}`;
    case "needs-feature":
      return `${rule.kind}:${rule.feature}`;
    case "max-spend":
    case "min-spend":
      return `${rule.kind}:${rule.amount}`;
    case "include-piece":
    case "avoid-piece":
      return `${rule.kind}:${rule.pieceId}`;
  }
}

function parseNumber(code: string, arg: string, min: number, max: number): number {
  if (!NUMBER_PATTERN.test(arg)) throw new RuleCodeError("BAD_ARGUMENT", code);
  const value = Number(arg);
  if (value < min || value > max) throw new RuleCodeError("BAD_ARGUMENT", code);
  return value;
}

function parseColour(code: string, arg: string): Colour {
  const found = ALL_COLOURS.find((colour) => colour === arg);
  if (found === undefined) throw new RuleCodeError("BAD_ARGUMENT", code);
  return found;
}

function parseEra(code: string, arg: string): Era {
  const found = ERA_ORDER.find((era) => era === arg);
  if (found === undefined) throw new RuleCodeError("BAD_ARGUMENT", code);
  return found;
}

function parseFeature(code: string, arg: string): Feature {
  const found = FEATURES.find((feature) => feature === arg);
  if (found === undefined) throw new RuleCodeError("BAD_ARGUMENT", code);
  return found;
}

export function parseRuleCode(code: string): Rule {
  const split = code.indexOf(":");
  const head = split === -1 ? code : code.slice(0, split);
  const arg = split === -1 ? undefined : code.slice(split + 1);
  const kind = RULE_KINDS.find((candidate) => candidate === head);
  if (kind === undefined) throw new RuleCodeError("UNKNOWN_KIND", code);
  if (kind === "palette-warm" || kind === "palette-cool") {
    if (arg !== undefined) throw new RuleCodeError("UNEXPECTED_ARGUMENT", code);
    return { kind };
  }
  if (arg === undefined || arg === "") throw new RuleCodeError("MISSING_ARGUMENT", code);
  switch (kind) {
    case "max-hues":
      return { kind, max: parseNumber(code, arg, 0, 3) as MaxHues };
    case "include-colour":
    case "avoid-colour":
      return { kind, colour: parseColour(code, arg) };
    case "era-min":
    case "era-max":
      return { kind, era: parseEra(code, arg) };
    case "formality-min":
    case "formality-max":
      return { kind, value: parseNumber(code, arg, FORMALITY_MIN, FORMALITY_MAX) };
    case "warmth-min":
    case "warmth-max":
      return { kind, value: parseNumber(code, arg, 0, RULE_NUMBER_LIMIT) };
    case "needs-feature":
      return { kind, feature: parseFeature(code, arg) };
    case "max-spend":
    case "min-spend":
      return { kind, amount: parseNumber(code, arg, 0, RULE_NUMBER_LIMIT) };
    case "include-piece":
    case "avoid-piece":
      if (!ID_PATTERN.test(arg)) throw new RuleCodeError("BAD_ARGUMENT", code);
      return { kind, pieceId: arg };
  }
}

const MAX_HUES_CHIP: readonly string[] = [
  "Neutrals only",
  "One colour at most",
  "Two colours at most",
  "Three colours at most",
];

function eraPhrase(era: Era): string {
  return era === "now" ? "now" : `the ${era}`;
}

function eraOrigin(era: Era): string {
  return era === "now" ? "modern" : `from the ${era}`;
}

export function ruleChipText(rule: Rule, pieceName?: string): string {
  switch (rule.kind) {
    case "palette-warm":
      return "Warm colours only";
    case "palette-cool":
      return "Cool colours only";
    case "max-hues":
      return MAX_HUES_CHIP[rule.max] ?? "";
    case "include-colour":
      return `Include something ${rule.colour}`;
    case "avoid-colour":
      return `Nothing ${rule.colour}`;
    case "era-min":
      return rule.era === "now"
        ? "Only modern pieces"
        : `Nothing older than ${eraPhrase(rule.era)}`;
    case "era-max":
      return `Nothing newer than ${eraPhrase(rule.era)}`;
    case "formality-min":
      return `Every piece formality ${rule.value} or more`;
    case "formality-max":
      return `Every piece formality ${rule.value} or less`;
    case "warmth-min":
      return `Total warmth at least ${rule.value}`;
    case "warmth-max":
      return `Total warmth at most ${rule.value}`;
    case "needs-feature":
      return `A ${rule.feature} piece`;
    case "max-spend":
      return `Spend at most $${rule.amount}`;
    case "min-spend":
      return `Spend at least $${rule.amount}`;
    case "include-piece":
      return `Wear the ${pieceName ?? "chosen piece"}`;
    case "avoid-piece":
      return `Leave out the ${pieceName ?? "chosen piece"}`;
  }
}

function names(pieces: readonly Piece[]): string {
  return pieces.map((piece) => piece.name).join(", ");
}

function colourList(pieces: readonly Piece[]): string {
  const colours = chromaticColours(pieces);
  return colours.length === 0 ? "none" : colours.join(", ");
}

function extremeEra(pieces: readonly Piece[], pickMax: boolean): Era | undefined {
  let best: Era | undefined;
  for (const piece of pieces) {
    if (best === undefined) best = piece.era;
    else if (pickMax ? eraIndex(piece.era) > eraIndex(best) : eraIndex(piece.era) < eraIndex(best))
      best = piece.era;
  }
  return best;
}

export function ruleDetail(rule: Rule, pieces: readonly Piece[], pieceName?: string): string {
  const met = checkRule(rule, pieces);
  switch (rule.kind) {
    case "palette-warm":
    case "palette-cool": {
      const allowed: readonly ChromaticColour[] =
        rule.kind === "palette-warm" ? WARM_COLOURS : COOL_COLOURS;
      if (met) return `Colours used: ${colourList(pieces)}`;
      const off = chromaticColours(pieces).filter((colour) => !allowed.includes(colour));
      return `${rule.kind === "palette-warm" ? "Not warm" : "Not cool"}: ${off.join(", ")}`;
    }
    case "max-hues":
      return `Colours used: ${colourList(pieces)}`;
    case "include-colour": {
      const match = pieces.filter((piece) => piece.colour === rule.colour);
      return met ? `Has ${rule.colour}: ${names(match)}` : `Missing: something ${rule.colour}`;
    }
    case "avoid-colour": {
      const match = pieces.filter((piece) => piece.colour === rule.colour);
      return met ? `No ${rule.colour} pieces` : `Found ${rule.colour}: ${names(match)}`;
    }
    case "era-min": {
      if (pieces.length === 0) return "No pieces yet";
      if (met) return `Oldest piece is ${eraOrigin(extremeEra(pieces, false) ?? rule.era)}`;
      const old = pieces.filter((piece) => eraIndex(piece.era) < eraIndex(rule.era));
      return `Too old: ${names(old)}`;
    }
    case "era-max": {
      if (pieces.length === 0) return "No pieces yet";
      if (met) return `Newest piece is ${eraOrigin(extremeEra(pieces, true) ?? rule.era)}`;
      const recent = pieces.filter((piece) => eraIndex(piece.era) > eraIndex(rule.era));
      return `Too new: ${names(recent)}`;
    }
    case "formality-min": {
      if (pieces.length === 0) return "No pieces yet";
      const lowest = Math.min(...pieces.map((piece) => piece.formality));
      return `Lowest formality is ${lowest}, the minimum is ${rule.value}`;
    }
    case "formality-max": {
      if (pieces.length === 0) return "No pieces yet";
      const highest = Math.max(...pieces.map((piece) => piece.formality));
      return `Highest formality is ${highest}, the limit is ${rule.value}`;
    }
    case "warmth-min":
      return `Total warmth is ${sum(pieces, (piece) => piece.warmth)}, the minimum is ${rule.value}`;
    case "warmth-max":
      return `Total warmth is ${sum(pieces, (piece) => piece.warmth)}, the limit is ${rule.value}`;
    case "needs-feature": {
      const match = pieces.filter((piece) => piece.features.includes(rule.feature));
      return met ? `Has ${rule.feature}: ${names(match)}` : `Missing: something ${rule.feature}`;
    }
    case "max-spend":
      return `Spend is $${sum(pieces, (piece) => piece.price)}, the limit is $${rule.amount}`;
    case "min-spend":
      return `Spend is $${sum(pieces, (piece) => piece.price)}, the minimum is $${rule.amount}`;
    case "include-piece": {
      const worn = pieces.find((piece) => piece.id === rule.pieceId);
      return met
        ? `Wearing the ${worn?.name ?? pieceName ?? "required piece"}`
        : `Missing: the ${pieceName ?? "required piece"}`;
    }
    case "avoid-piece": {
      const worn = pieces.find((piece) => piece.id === rule.pieceId);
      return met
        ? `Left out the ${pieceName ?? "piece"}`
        : `Still wearing the ${worn?.name ?? pieceName ?? "piece"}`;
    }
  }
}
