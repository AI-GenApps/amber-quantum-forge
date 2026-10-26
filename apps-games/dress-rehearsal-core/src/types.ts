export type Category = "top" | "bottom" | "dress" | "outer" | "shoes" | "bag" | "hat" | "accessory";

export type Slot = Category;

export type NeutralColour = "black" | "white" | "cream" | "grey" | "navy" | "tan";

export type ChromaticColour =
  | "red"
  | "orange"
  | "yellow"
  | "lime"
  | "green"
  | "mint"
  | "teal"
  | "sky"
  | "blue"
  | "violet"
  | "magenta"
  | "pink";

export type Colour = NeutralColour | ChromaticColour;

export type Era = "50s" | "70s" | "90s" | "now";

export type Feature = "waterproof" | "shade" | "sparkle" | "sturdy";

export interface Piece {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly colour: Colour;
  readonly era: Era;
  readonly formality: number;
  readonly warmth: number;
  readonly price: number;
  readonly features: readonly Feature[];
}

export type MaxHues = 0 | 1 | 2 | 3;

export type Rule =
  | { readonly kind: "palette-warm" }
  | { readonly kind: "palette-cool" }
  | { readonly kind: "max-hues"; readonly max: MaxHues }
  | { readonly kind: "include-colour"; readonly colour: Colour }
  | { readonly kind: "avoid-colour"; readonly colour: Colour }
  | { readonly kind: "era-min"; readonly era: Era }
  | { readonly kind: "era-max"; readonly era: Era }
  | { readonly kind: "formality-min"; readonly value: number }
  | { readonly kind: "formality-max"; readonly value: number }
  | { readonly kind: "warmth-min"; readonly value: number }
  | { readonly kind: "warmth-max"; readonly value: number }
  | { readonly kind: "needs-feature"; readonly feature: Feature }
  | { readonly kind: "max-spend"; readonly amount: number }
  | { readonly kind: "min-spend"; readonly amount: number }
  | { readonly kind: "include-piece"; readonly pieceId: string }
  | { readonly kind: "avoid-piece"; readonly pieceId: string };

export type RuleKind = Rule["kind"];

export type RuleFamily =
  | "palette"
  | "era"
  | "formality"
  | "weather"
  | "feature"
  | "budget"
  | "piece";

export type SlotSetId = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type Look = Partial<Record<Slot, string>>;

export type Stars = 0 | 1 | 2 | 3;

export interface RuleResult {
  readonly rule: Rule;
  readonly code: string;
  readonly met: boolean;
  readonly chip: string;
  readonly detail: string;
}

export type HarmonyPartId = "scheme" | "anchor" | "dressCode" | "era" | "season";

export interface HarmonyPart {
  readonly id: HarmonyPartId;
  readonly name: string;
  readonly points: number;
  readonly max: number;
  readonly reason: string;
}

export type SchemeName =
  | "Neutral"
  | "Tonal"
  | "Analogous"
  | "Complementary"
  | "Triad pair"
  | "Awkward pair"
  | "Triadic"
  | "Analogous trio"
  | "Busy"
  | "Too many colours";

export interface HarmonyResult {
  readonly total: number;
  readonly scheme: SchemeName | null;
  readonly parts: readonly HarmonyPart[];
}

export interface ChallengeShape {
  readonly id: string;
  readonly slotSet: SlotSetId;
  readonly rules: readonly Rule[];
}

export interface LivePreview {
  readonly complete: boolean;
  readonly missing: readonly Slot[];
  readonly rules: readonly RuleResult[];
  readonly metCount: number;
  readonly harmony: HarmonyResult;
}

export interface ScoreResult extends LivePreview {
  readonly stars: Stars;
}

export type PlaceFailure = "WRONG_CATEGORY" | "SLOT_CLOSED";

export type CanPlaceResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: PlaceFailure };

export type PlaceResult =
  | { readonly ok: true; readonly look: Look; readonly displaced: readonly string[] }
  | { readonly ok: false; readonly reason: PlaceFailure };
