import type { GlyphKind } from "../content";
import type { FacetId } from "../types";

export interface TemplateSide {
  object: string;
  tag: string;
}

export interface DailyTemplate {
  facet: FacetId;
  value: string;
  a: TemplateSide;
  b: TemplateSide;
  ruleOut: string;
}

function row(
  facet: FacetId,
  value: string,
  a: [string, string],
  b: [string, string],
  ruleOut: string,
): DailyTemplate {
  return {
    facet,
    value,
    a: { object: a[0], tag: a[1] },
    b: { object: b[0], tag: b[1] },
    ruleOut,
  };
}

export const TEMPLATES: readonly DailyTemplate[] = [
  row(
    "street",
    "Quay Road",
    ["Rope-tied string", "river-mud grit on the knot"],
    ["Ferry-ticket sleeve", "rope fibre in the seam"],
    "never on the river side",
  ),
  row(
    "street",
    "Mill Lane",
    ["Paper sack", "grain husks in the corner"],
    ["Sacking square", "millstone dust in the weave"],
    "nowhere near the mill",
  ),
  row(
    "street",
    "Tanner's Row",
    ["Scented wrapper", "tannery smell in the paper"],
    ["Hide-string bundle", "leather dust on the knot"],
    "far from the tannery",
  ),
  row(
    "street",
    "Lamplight Street",
    ["Blackened glove", "lamp soot on the fingers"],
    ["Oil-stained rag", "oil stains on the cloth"],
    "no lamp outside my door",
  ),
  row(
    "street",
    "Orchard Close",
    ["Petal-pressed card", "apple blossom in the fold"],
    ["Windfall wrapper", "apple stain on the paper"],
    "no trees where I live",
  ),
  row(
    "street",
    "Station Hill",
    ["Gritty box", "coal cinders in the creases"],
    ["Smutty scarf", "engine smuts on the cuff"],
    "never lived by the line",
  ),
  row(
    "pastime",
    "angling",
    ["Tackle tin", "fish hook in the lining"],
    ["Weight pouch", "split lead weights in a twist"],
    "refused the angling club badge",
  ),
  row(
    "pastime",
    "choir",
    ["Hymn sheet", "pencilled tenor line"],
    ["Fork case", "tuning fork stamped middle C"],
    "left the choir, never went back",
  ),
  row(
    "pastime",
    "crosswords",
    ["Newspaper cutting", "pencilled crossword, one clue left"],
    ["Rubbed-out grid", "clue numbers in the margin"],
    "crosswords give me a headache",
  ),
  row(
    "pastime",
    "model trains",
    ["Signal lamp", "tiny signal lamp"],
    ["Track-pin packet", "OO-gauge track pins"],
    "train set refunded, not for me",
  ),
  row(
    "pastime",
    "birdwatching",
    ["Field notebook", "tick marks beside bird names"],
    ["Lens-cap tag", "lens cap engraved 8x42"],
    "binoculars are for burglars",
  ),
  row(
    "pastime",
    "chess",
    ["Carved bishop", "boxwood bishop"],
    ["Scorecard", '"white to move" in pencil'],
    "I never saw the point of chess",
  ),
  row(
    "look",
    "red hair",
    ["Wool jumper", "copper hair strands"],
    ["Hairbrush", "copper hairs in the bristles"],
    "dark-haired in every photograph",
  ),
  row(
    "look",
    "spectacles",
    ["Lens cloth", "thumbprints on the cloth"],
    ["Spare arm", "spectacle arm with a bent hinge"],
    "eye test: no glasses needed",
  ),
  row(
    "look",
    "left-handed",
    ["Slanting note", "ink smeared along the left edge"],
    ["Left-hand scissors", "scissors marked for the left hand"],
    "always writes with the right",
  ),
  row(
    "look",
    "hearing aid",
    ["Battery card", "size-13 battery card"],
    ["Foam dome", "foam dome that fits an ear"],
    "clinic card: hearing normal",
  ),
  row(
    "look",
    "tall",
    ["Let-down coat", "hem let down by four inches"],
    ["Door-frame note", "pencil mark at six feet four"],
    "trousers taken up two inches",
  ),
  row(
    "look",
    "walking stick",
    ["Rubber ferrule", "worn rubber tip"],
    ["Chemist's slip", "replacement ferrule on the slip"],
    "tower climb, unaided",
  ),
  row(
    "pet",
    "cat",
    ["Cushion cover", "tabby hairs in the weave"],
    ["Scratched card", "scratch marks on the corner"],
    "cannot abide cats",
  ),
  row(
    "pet",
    "dog",
    ["Chewed lead", "tooth marks on the strap"],
    ["Biscuit packet", "paw print on the packet"],
    "no dogs in my house",
  ),
  row(
    "pet",
    "canary",
    ["Seed twist", "birdseed in the fold"],
    ["Cuttlebone", "yellow feather in the bone"],
    "cannot stand birdsong",
  ),
  row(
    "pet",
    "none",
    ["Spotless wrapper", "no hair or crumb anywhere"],
    ["Fresh-folded paper", "not a mark on it"],
    "pet-sitter's receipt",
  ),
  row(
    "pet",
    "tortoise",
    ["Lettuce paper", "lettuce nibbles on the edge"],
    ["Heat-lamp slip", "bulb receipt for a shell-warmer"],
    "tortoises are too slow for me",
  ),
  row(
    "pet",
    "goldfish",
    ["Fish-food tin", "flakes in the lid"],
    ["Little net", "green net with a fishy smell"],
    "dislikes fish",
  ),
];

export function templateFor(facet: FacetId, value: string): DailyTemplate | undefined {
  return TEMPLATES.find((item) => item.facet === facet && item.value === value);
}

export interface FlavourLine {
  line: string;
  object: string;
  glyph: GlyphKind;
}

export const FLAVOUR_POOL: readonly FlavourLine[] = [
  { line: "a gift tag with a smudged name", object: "Gift tag", glyph: "card" },
  { line: "string tied in a double knot", object: "Knotted string", glyph: "cloth" },
  { line: "a faded 1960s stamp", object: "Faded stamp", glyph: "ticket" },
  { line: "yellowed sticky tape", object: "Sticky tape", glyph: "paper" },
  { line: "a coffee ring on the wrapper", object: "Coffee-ringed wrapper", glyph: "paper" },
  { line: "an ink blot on the label", object: "Blotted label", glyph: "card" },
  { line: "a pencilled sum", object: "Pencilled sum", glyph: "paper" },
  { line: "a creased corner", object: "Creased corner", glyph: "paper" },
  { line: "a single mother-of-pearl button", object: "Pearl button", glyph: "metal" },
  { line: "a postage-paid sticker", object: "Postage sticker", glyph: "ticket" },
  { line: "a folded bus timetable", object: "Bus timetable", glyph: "ticket" },
  { line: "a tea-stained corner", object: "Stained corner", glyph: "paper" },
];

export const RULE_OUT_OBJECTS = ["Scribbled note", "Folded slip"] as const;
