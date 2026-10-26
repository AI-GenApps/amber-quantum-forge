import { PIECE_BY_ID } from "../content/pieces";
import type { ClientDef, ClientId } from "../content/types";
import { ruleChipText } from "../rules";
import type { Rule } from "../types";
import { DAILY_BRIEF_MAX } from "./tiers";

const SHORT_NAMES: Readonly<Record<ClientId, string>> = {
  mireille: "Mireille",
  tobias: "Tobias",
  ottoline: "Dame Ottoline",
  priya: "Priya",
  jun: "Jun",
  edie: "Edie",
};

const MAX_HUES_SHORT: readonly string[] = [
  "neutrals only",
  "one colour",
  "two colours",
  "three colours",
];

function pieceName(id: string): string {
  return PIECE_BY_ID.get(id)?.name ?? "chosen piece";
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function fullPhrase(rule: Rule): string {
  const name =
    rule.kind === "include-piece" || rule.kind === "avoid-piece"
      ? pieceName(rule.pieceId)
      : undefined;
  return lowerFirst(ruleChipText(rule, name));
}

export function shortPhrase(rule: Rule): string {
  switch (rule.kind) {
    case "palette-warm":
      return "warm colours";
    case "palette-cool":
      return "cool colours";
    case "max-hues":
      return MAX_HUES_SHORT[rule.max] ?? "few colours";
    case "include-colour":
      return `something ${rule.colour}`;
    case "avoid-colour":
      return `no ${rule.colour}`;
    case "era-min":
      return rule.era === "now" ? "modern pieces only" : `${rule.era} or newer`;
    case "era-max":
      return `${rule.era} or older`;
    case "formality-min":
      return `formality ${rule.value}+`;
    case "formality-max":
      return `formality up to ${rule.value}`;
    case "warmth-min":
      return `warmth ${rule.value}+`;
    case "warmth-max":
      return `warmth up to ${rule.value}`;
    case "needs-feature":
      return `a ${rule.feature} piece`;
    case "max-spend":
      return `up to $${rule.amount}`;
    case "min-spend":
      return `$${rule.amount}+`;
    case "include-piece":
      return `wear the ${pieceName(rule.pieceId)}`;
    case "avoid-piece":
      return `skip the ${pieceName(rule.pieceId)}`;
  }
}

function sentence(name: string, phrases: readonly string[]): string {
  const last = phrases[phrases.length - 1] ?? "";
  const head = phrases.slice(0, -1);
  const list = head.length === 0 ? last : `${head.join(", ")} and ${last}`;
  return `${name}: ${list}.`;
}

export function buildBrief(client: ClientDef, rules: readonly Rule[]): string {
  const short = SHORT_NAMES[client.id];
  const full = rules.map(fullPhrase);
  const attempts = [
    sentence(client.name, full),
    sentence(short, full),
    sentence(short, rules.map(shortPhrase)),
  ];
  for (const text of attempts) if (text.length <= DAILY_BRIEF_MAX) return text;
  return attempts[2] as string;
}
