import type {
  Category,
  ChromaticColour,
  Colour,
  Era,
  Feature,
  HarmonyPartId,
  NeutralColour,
  RuleFamily,
  RuleKind,
  SchemeName,
} from "./types";

export const HUE_WHEEL: readonly ChromaticColour[] = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "mint",
  "teal",
  "sky",
  "blue",
  "violet",
  "magenta",
  "pink",
];

export const NEUTRAL_COLOURS: readonly NeutralColour[] = [
  "black",
  "white",
  "cream",
  "grey",
  "navy",
  "tan",
];

export const ALL_COLOURS: readonly Colour[] = [...NEUTRAL_COLOURS, ...HUE_WHEEL];

export const WARM_COLOURS: readonly ChromaticColour[] = ["pink", "red", "orange", "yellow"];

export const COOL_COLOURS: readonly ChromaticColour[] = ["mint", "teal", "sky", "blue", "violet"];

export const ERA_ORDER: readonly Era[] = ["50s", "70s", "90s", "now"];

export const FEATURES: readonly Feature[] = ["waterproof", "shade", "sparkle", "sturdy"];

export const CATEGORIES: readonly Category[] = [
  "top",
  "bottom",
  "dress",
  "outer",
  "shoes",
  "bag",
  "hat",
  "accessory",
];

export const FORMALITY_MIN = 1;
export const FORMALITY_MAX = 5;
export const WARMTH_MIN = 0;
export const WARMTH_MAX = 3;
export const RULE_NUMBER_LIMIT = 100000;

export const HARMONY_WEIGHTS: Readonly<Record<HarmonyPartId, number>> = {
  scheme: 40,
  anchor: 10,
  dressCode: 20,
  era: 15,
  season: 15,
};

export const HARMONY_PART_NAMES: Readonly<Record<HarmonyPartId, string>> = {
  scheme: "Colour scheme",
  anchor: "Neutral anchor",
  dressCode: "Dress code",
  era: "Era match",
  season: "Season sense",
};

export const SCHEME_POINTS: Readonly<Record<SchemeName, number>> = {
  Neutral: 34,
  Tonal: 40,
  Analogous: 40,
  Complementary: 40,
  "Triad pair": 32,
  "Awkward pair": 20,
  Triadic: 36,
  "Analogous trio": 36,
  Busy: 16,
  "Too many colours": 4,
};

export const DRESS_CODE_POINTS: readonly number[] = [20, 20, 14, 6, 0];
export const ERA_POINTS: readonly number[] = [15, 15, 10, 4];
export const SEASON_POINTS: readonly number[] = [15, 15, 10, 4];

export const THREE_STAR_HARMONY = 70;
export const HINT_NODE_CAP = 400000;

export const RULE_KINDS: readonly RuleKind[] = [
  "palette-warm",
  "palette-cool",
  "max-hues",
  "include-colour",
  "avoid-colour",
  "era-min",
  "era-max",
  "formality-min",
  "formality-max",
  "warmth-min",
  "warmth-max",
  "needs-feature",
  "max-spend",
  "min-spend",
  "include-piece",
  "avoid-piece",
];

export const RULE_FAMILY: Readonly<Record<RuleKind, RuleFamily>> = {
  "palette-warm": "palette",
  "palette-cool": "palette",
  "max-hues": "palette",
  "include-colour": "palette",
  "avoid-colour": "palette",
  "era-min": "era",
  "era-max": "era",
  "formality-min": "formality",
  "formality-max": "formality",
  "warmth-min": "weather",
  "warmth-max": "weather",
  "needs-feature": "feature",
  "max-spend": "budget",
  "min-spend": "budget",
  "include-piece": "piece",
  "avoid-piece": "piece",
};
